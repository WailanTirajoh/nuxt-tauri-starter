/**
 * Barcode Scanner Composable - useBarcodeScanner
 *
 * VueUse-style, typed wrapper around Tauri's barcode-scanner plugin. Handles
 * camera permission, exposes reactive scan state, and returns the decoded
 * result. Mobile-only (Android/iOS) — on desktop / SSR it degrades gracefully
 * (`isSupported` is false and `scan()` no-ops with a clear error).
 *
 * Example:
 * ```ts
 * const { scan, scanning, result } = useBarcodeScanner()
 * const code = await scan({ formats: [Format.QRCode] })
 * // code?.content, code?.format
 * ```
 */

import type { Ref } from "vue";
import {
  scan as scanBarcode,
  cancel as cancelScan,
  checkPermissions,
  requestPermissions,
  openAppSettings as openSettings,
  Format,
  type Scanned,
  type ScanOptions,
} from "@tauri-apps/plugin-barcode-scanner";

/**
 * Options for the composable
 */
export interface UseBarcodeScannerOptions {
  /** Barcode formats to detect (default: all) */
  formats?: Format[];
  /** Use a transparent webview over the live camera instead of the native fullscreen scanner */
  windowed?: boolean;
  /** Which camera to use */
  cameraDirection?: "back" | "front";
  /** Automatically request camera permission from `scan()` if needed (default: true) */
  autoRequest?: boolean;
  /** Custom error handler */
  onError?: (error: Error) => void;
}

/**
 * Return type for useBarcodeScanner composable
 */
export interface UseBarcodeScannerReturn {
  /** Whether scanning is available (mobile + Tauri runtime only) */
  isSupported: Ref<boolean>;
  /** Reactive camera-permission state */
  permissionGranted: Ref<boolean>;
  /** Whether a scan is currently in progress */
  scanning: Ref<boolean>;
  /** The most recent successful scan */
  result: Ref<Scanned | null>;
  /** Last error, if any */
  error: Ref<Error | null>;
  /** Ensure camera permission, requesting it if needed. Returns the result. */
  ensurePermission: () => Promise<boolean>;
  /** Start scanning. Resolves with the decoded result, or null on failure/cancel. */
  scan: (options?: ScanOptions) => Promise<Scanned | null>;
  /** Cancel an in-progress scan. */
  cancel: () => Promise<void>;
  /** Open the OS app settings (e.g. to re-enable a denied camera permission). */
  openAppSettings: () => Promise<void>;
}

/** Scanning is only available in a mobile (Android/iOS) Tauri webview. */
const isMobileTauri = (): boolean =>
  import.meta.client &&
  typeof window !== "undefined" &&
  "__TAURI_INTERNALS__" in window &&
  /android|iphone|ipad|ipod/i.test(navigator.userAgent);

/**
 * Reactive barcode scanner composable
 *
 * @param options - Default scan options + behavior
 */
export function useBarcodeScanner(
  options: UseBarcodeScannerOptions = {},
): UseBarcodeScannerReturn {
  const {
    formats,
    windowed = false,
    cameraDirection,
    autoRequest = true,
    onError,
  } = options;

  // Shared, app-wide reactive state (SSR-safe via useState)
  const isSupported = useState<boolean>("scanner:supported", () => false);
  const permissionGranted = useState<boolean>("scanner:granted", () => false);
  const scanning = useState<boolean>("scanner:scanning", () => false);
  const result = useState<Scanned | null>("scanner:result", () => null);
  const error = useState<Error | null>("scanner:error", () => null);

  if (import.meta.client) isSupported.value = isMobileTauri();

  const handleError = (err: unknown, context: string) => {
    const e = err instanceof Error ? err : new Error(String(err));
    console.error(`[useBarcodeScanner] ${context}:`, e);
    error.value = e;
    if (onError) onError(e);
  };

  // Reflect the actual camera-permission state on startup (so the UI doesn't
  // show "not granted" when it was already granted in a previous session).
  if (import.meta.client && isSupported.value) {
    void checkPermissions()
      .then((state) => {
        permissionGranted.value = state === "granted";
      })
      .catch((err) => handleError(err, "Failed to read camera permission"));
  }

  const ensurePermission = async (): Promise<boolean> => {
    if (!isSupported.value) return false;
    try {
      let state = await checkPermissions();
      if (state !== "granted") state = await requestPermissions();
      permissionGranted.value = state === "granted";
      return permissionGranted.value;
    } catch (err) {
      handleError(err, "Failed to resolve camera permission");
      return false;
    }
  };

  const scan = async (opts: ScanOptions = {}): Promise<Scanned | null> => {
    error.value = null;
    if (!isSupported.value) {
      handleError(
        new Error("Barcode scanning is only available on Android/iOS"),
        "Cannot scan",
      );
      return null;
    }

    const granted = permissionGranted.value
      ? true
      : autoRequest
        ? await ensurePermission()
        : false;
    if (!granted) {
      handleError(new Error("Camera permission not granted"), "Cannot scan");
      return null;
    }

    scanning.value = true;
    try {
      const scanned = await scanBarcode({
        windowed,
        cameraDirection,
        formats,
        ...opts,
      });
      result.value = scanned;
      return scanned;
    } catch (err) {
      handleError(err, "Scan failed");
      return null;
    } finally {
      scanning.value = false;
    }
  };

  const cancel = async (): Promise<void> => {
    if (!isSupported.value) return;
    try {
      await cancelScan();
    } catch (err) {
      handleError(err, "Failed to cancel scan");
    } finally {
      scanning.value = false;
    }
  };

  const openAppSettings = async (): Promise<void> => {
    if (!isSupported.value) return;
    try {
      await openSettings();
    } catch (err) {
      handleError(err, "Failed to open app settings");
    }
  };

  return {
    isSupported,
    permissionGranted,
    scanning,
    result,
    error,
    ensurePermission,
    scan,
    cancel,
    openAppSettings,
  };
}

// Re-export plugin types for convenience
export { Format } from "@tauri-apps/plugin-barcode-scanner";
export type { Scanned, ScanOptions } from "@tauri-apps/plugin-barcode-scanner";
