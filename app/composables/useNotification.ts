/**
 * Native Notification Composable - useNotification
 *
 * Provides a VueUse-style, typed wrapper around Tauri's notification plugin.
 * Handles OS permission transparently, shares permission state across all
 * callers, and is safe to call during SSR (no-ops on the server).
 *
 * Example:
 * ```ts
 * const { notify } = useNotification()
 *
 * notify("Saved!")                              // string → title
 * notify({ title: "Upload done", body: "3 files" })
 * ```
 */

import { ref, type Ref } from "vue";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
  type Options,
} from "@tauri-apps/plugin-notification";

/** A notification can be sent as a plain title string or full options. */
export type TitleOrOptions = string | Options;

/**
 * Options for the composable
 */
export interface UseNotificationOptions {
  /**
   * Automatically request permission from `notify()` if not yet granted.
   * @default true
   */
  autoRequest?: boolean;

  /**
   * Eagerly request permission when the component mounts.
   * @default false
   */
  requestOnMounted?: boolean;

  /**
   * Custom error handler
   */
  onError?: (error: Error) => void;
}

/**
 * Return type for useNotification composable
 */
export interface UseNotificationReturn {
  /** Whether the Tauri notification API is available (false during SSR / on web) */
  isSupported: Ref<boolean>;

  /** Reactive permission state, shared across all callers */
  permissionGranted: Ref<boolean>;

  /** Ensure permission is granted, requesting it if needed. Returns the result. */
  ensurePermission: () => Promise<boolean>;

  /** Send a native notification (string title or full options). */
  notify: (input: TitleOrOptions) => Promise<void>;
}

// Shared, app-wide reactive state (created once, returned to every caller)
const isSupported = ref(false);
const permissionGranted = ref(false);

/**
 * Reactive native notification composable
 *
 * @param defaultOptions - Options merged into every `notify()` call
 * @param options - Composable behavior options
 */
export function useNotification(
  defaultOptions: Partial<Options> = {},
  options: UseNotificationOptions = {},
): UseNotificationReturn {
  const { autoRequest = true, requestOnMounted = false, onError } = options;

  // Error handler
  const handleError = (error: unknown, context: string) => {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(`[useNotification] ${context}:`, err);
    if (onError) onError(err);
  };

  // Ensure permission, requesting it if not already granted
  const ensurePermission = async (): Promise<boolean> => {
    if (!isSupported.value) return false;

    try {
      if (!permissionGranted.value) {
        permissionGranted.value = await isPermissionGranted();
      }
      if (!permissionGranted.value) {
        const result = await requestPermission();
        permissionGranted.value = result === "granted";
      }
      return permissionGranted.value;
    } catch (error) {
      handleError(error, "Failed to resolve permission");
      return false;
    }
  };

  // Send a notification
  const notify = async (input: TitleOrOptions): Promise<void> => {
    if (!isSupported.value) return;

    try {
      const granted = permissionGranted.value
        ? true
        : autoRequest
          ? await ensurePermission()
          : false;

      if (!granted) {
        handleError(
          new Error("Notification permission not granted"),
          "Cannot notify",
        );
        return;
      }

      const base: Options =
        typeof input === "string" ? { title: input } : input;

      sendNotification({ ...defaultOptions, ...base });
    } catch (error) {
      handleError(error, "Failed to send notification");
    }
  };

  // Initialize on the client only (Tauri APIs are unavailable during SSR)
  if (import.meta.client) {
    isSupported.value = true;
    (async () => {
      try {
        permissionGranted.value = await isPermissionGranted();
        if (requestOnMounted) await ensurePermission();
      } catch (error) {
        handleError(error, "Failed to read initial permission");
      }
    })();
  }

  return {
    isSupported,
    permissionGranted,
    ensurePermission,
    notify,
  };
}

// Re-export plugin types for convenience
export type { Options } from "@tauri-apps/plugin-notification";
