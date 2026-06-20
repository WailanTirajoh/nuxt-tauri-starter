/**
 * Auto-updater Composable - useUpdater
 *
 * Provides a VueUse-style, typed wrapper around Tauri's updater plugin as a
 * small reactive state machine: check → download (with progress) → install →
 * relaunch. Safe to call during SSR (no-ops on the server).
 *
 * The updater only works in signed production builds with `plugins.updater`
 * configured (pubkey + endpoints) — see the README "Auto-update setup" section.
 * When unconfigured, `checkForUpdates()` surfaces a friendly error state.
 *
 * Example:
 * ```ts
 * const { checkForUpdates, available, downloadAndInstall, progress } = useUpdater()
 * await checkForUpdates()
 * if (available.value) await downloadAndInstall()
 * ```
 */

import type { Ref } from "vue";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export type UpdaterStatus =
  | "idle"
  | "checking"
  | "available"
  | "up-to-date"
  | "downloading"
  | "ready"
  | "installing"
  | "error";

/**
 * Options for the composable
 */
export interface UseUpdaterOptions {
  /** Check for updates on mount (default: false) */
  autoCheck?: boolean;
  /** Custom error handler */
  onError?: (error: Error) => void;
}

/**
 * Return type for useUpdater composable
 */
export interface UseUpdaterReturn {
  isSupported: Ref<boolean>;
  status: Ref<UpdaterStatus>;
  available: Ref<boolean>;
  version: Ref<string | null>;
  currentVersion: Ref<string | null>;
  notes: Ref<string | null>;
  progress: Ref<number>;
  error: Ref<Error | null>;
  checkForUpdates: () => Promise<boolean>;
  downloadAndInstall: () => Promise<void>;
  relaunchApp: () => Promise<void>;
}

// The pending Update handle, held between check and install (app-global, and
// not serializable so it can't live in useState).
let currentUpdate: Update | null = null;

/**
 * Reactive auto-updater composable
 *
 * @param options - autoCheck + error handler
 */
export function useUpdater(options: UseUpdaterOptions = {}): UseUpdaterReturn {
  const { autoCheck = false, onError } = options;

  // Shared, app-wide reactive state (SSR-safe via useState)
  const isSupported = useState<boolean>("updater:supported", () => false);
  const status = useState<UpdaterStatus>("updater:status", () => "idle");
  const available = useState<boolean>("updater:available", () => false);
  const version = useState<string | null>("updater:version", () => null);
  const currentVersion = useState<string | null>(
    "updater:current-version",
    () => null,
  );
  const notes = useState<string | null>("updater:notes", () => null);
  const progress = useState<number>("updater:progress", () => 0);
  const error = useState<Error | null>("updater:error", () => null);

  const handleError = (err: unknown, context: string) => {
    const e = err instanceof Error ? err : new Error(String(err));
    console.error(`[useUpdater] ${context}:`, e);
    error.value = e;
    status.value = "error";
    if (onError) onError(e);
  };

  const checkForUpdates = async (): Promise<boolean> => {
    if (!import.meta.client) return false;
    error.value = null;
    status.value = "checking";
    try {
      const update = await check();
      if (update) {
        currentUpdate = update;
        available.value = true;
        version.value = update.version;
        currentVersion.value = update.currentVersion;
        notes.value = update.body ?? null;
        status.value = "available";
        return true;
      }
      available.value = false;
      status.value = "up-to-date";
      return false;
    } catch (err) {
      handleError(err, "Failed to check for updates");
      return false;
    }
  };

  const downloadAndInstall = async (): Promise<void> => {
    if (!import.meta.client) return;
    if (!currentUpdate) {
      handleError(new Error("No update available to install"), "Cannot install");
      return;
    }
    progress.value = 0;
    status.value = "downloading";
    let total = 0;
    let downloaded = 0;
    try {
      await currentUpdate.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            total = event.data.contentLength ?? 0;
            break;
          case "Progress":
            downloaded += event.data.chunkLength;
            progress.value = total
              ? Math.round((downloaded / total) * 100)
              : 0;
            break;
          case "Finished":
            progress.value = 100;
            status.value = "ready";
            break;
        }
      });
      status.value = "ready";
    } catch (err) {
      handleError(err, "Failed to download/install update");
    }
  };

  const relaunchApp = async (): Promise<void> => {
    if (!import.meta.client) return;
    try {
      status.value = "installing";
      await relaunch();
    } catch (err) {
      handleError(err, "Failed to relaunch");
    }
  };

  if (import.meta.client) {
    isSupported.value = true;
    if (autoCheck) checkForUpdates();
  }

  return {
    isSupported,
    status,
    available,
    version,
    currentVersion,
    notes,
    progress,
    error,
    checkForUpdates,
    downloadAndInstall,
    relaunchApp,
  };
}
