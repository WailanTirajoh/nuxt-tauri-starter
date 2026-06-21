/**
 * Window Management Composable - useWindow
 *
 * Provides a VueUse-style, typed wrapper around Tauri's window API. Gives
 * imperative controls for the current window, reactive window state kept in
 * sync via window events, and multi-window creation. Safe to call during SSR
 * (no-ops on the server).
 *
 * Example:
 * ```ts
 * const win = useWindow()
 *
 * win.toggleMaximize()
 * win.setTitle("Dashboard")
 * win.createWindow("secondary", { url: "/demo" })
 * // win.isMaximized, win.isFullscreen, win.isFocused are reactive
 * ```
 */

import type { Ref } from "vue";
import {
  getCurrentWindow,
  getAllWindows,
  type Window,
} from "@tauri-apps/api/window";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { LogicalSize } from "@tauri-apps/api/dpi";

/** Options accepted by `WebviewWindow` when creating a new window. */
export type CreateWindowOptions = ConstructorParameters<typeof WebviewWindow>[1];

/**
 * Options for the composable
 */
export interface UseWindowOptions {
  /** Custom error handler */
  onError?: (error: Error) => void;
}

/**
 * Return type for useWindow composable
 */
export interface UseWindowReturn {
  /** Whether the Tauri window API is available (false during SSR / on web) */
  isSupported: Ref<boolean>;

  // Reactive state (kept in sync via window events)
  isMaximized: Ref<boolean>;
  isMinimized: Ref<boolean>;
  isFullscreen: Ref<boolean>;
  isFocused: Ref<boolean>;
  title: Ref<string>;

  // Current-window controls
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  unmaximize: () => Promise<void>;
  toggleMaximize: () => Promise<void>;
  setFullscreen: (value: boolean) => Promise<void>;
  toggleFullscreen: () => Promise<void>;
  show: () => Promise<void>;
  hide: () => Promise<void>;
  setFocus: () => Promise<void>;
  center: () => Promise<void>;
  startDragging: () => Promise<void>;
  close: () => Promise<void>;
  setTitle: (title: string) => Promise<void>;
  setSize: (width: number, height: number) => Promise<void>;

  // Multi-window
  createWindow: (
    label: string,
    options?: CreateWindowOptions,
  ) => WebviewWindow | undefined;
  listWindows: () => Promise<string[]>;
}

// Labels whose event listeners have already been attached (window-lifetime,
// so we attach once and never tear down).
const initialized = new Set<string>();

/**
 * Reactive window management composable
 *
 * @param label - Target a specific window by label; defaults to the current window
 * @param options - Composable behavior options
 */
export function useWindow(
  label?: string,
  options: UseWindowOptions = {},
): UseWindowReturn {
  const { onError } = options;

  // Resolve the label up front (current window's label is available
  // synchronously under Tauri). Guard against non-Tauri contexts (browser,
  // SSR) where `getCurrentWindow()` would throw.
  let winLabel = label ?? "current";
  if (!label && import.meta.client) {
    try {
      winLabel = getCurrentWindow().label;
    } catch {
      // Not running under Tauri — keep the fallback label
    }
  }

  // Shared, app-wide reactive state (keyed by label — SSR-safe via useState)
  const isSupported = useState<boolean>(
    `window:${winLabel}:supported`,
    () => false,
  );
  const isMaximized = useState<boolean>(
    `window:${winLabel}:maximized`,
    () => false,
  );
  const isMinimized = useState<boolean>(
    `window:${winLabel}:minimized`,
    () => false,
  );
  const isFullscreen = useState<boolean>(
    `window:${winLabel}:fullscreen`,
    () => false,
  );
  const isFocused = useState<boolean>(
    `window:${winLabel}:focused`,
    () => false,
  );
  const title = useState<string>(`window:${winLabel}:title`, () => "");

  const handleError = (error: unknown, context: string) => {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(`[useWindow] ${context}:`, err);
    if (onError) onError(err);
  };

  // Resolve the target window handle (current window or another by label)
  const resolveWindow = async (): Promise<Window | null> => {
    if (!import.meta.client) return null;
    try {
      return label ? await WebviewWindow.getByLabel(label) : getCurrentWindow();
    } catch (error) {
      handleError(error, "Failed to resolve window");
      return null;
    }
  };

  // Re-query reactive state from the OS
  const refresh = async () => {
    const win = await resolveWindow();
    if (!win) return;
    try {
      isMaximized.value = await win.isMaximized();
      isMinimized.value = await win.isMinimized();
      isFullscreen.value = await win.isFullscreen();
      isFocused.value = await win.isFocused();
      title.value = await win.title();
    } catch (error) {
      handleError(error, "Failed to read window state");
    }
  };

  // Wrap a control call with error handling
  const run = (
    context: string,
    fn: (win: Window) => Promise<unknown>,
  ): (() => Promise<void>) => {
    return async () => {
      const win = await resolveWindow();
      if (!win) return;
      try {
        await fn(win);
      } catch (error) {
        handleError(error, context);
      }
    };
  };

  const minimize = run("Failed to minimize", (w) => w.minimize());
  const maximize = run("Failed to maximize", (w) => w.maximize());
  const unmaximize = run("Failed to unmaximize", (w) => w.unmaximize());
  const toggleMaximize = run("Failed to toggle maximize", (w) =>
    w.toggleMaximize(),
  );
  const show = run("Failed to show", (w) => w.show());
  const hide = run("Failed to hide", (w) => w.hide());
  const setFocus = run("Failed to focus", (w) => w.setFocus());
  const center = run("Failed to center", (w) => w.center());
  const startDragging = run("Failed to start dragging", (w) =>
    w.startDragging(),
  );
  const close = run("Failed to close", (w) => w.close());

  const setFullscreen = (value: boolean) =>
    run("Failed to set fullscreen", (w) => w.setFullscreen(value))();
  const toggleFullscreen = () => setFullscreen(!isFullscreen.value);
  const setTitle = (t: string) =>
    run("Failed to set title", (w) => w.setTitle(t))();
  const setSize = (width: number, height: number) =>
    run("Failed to set size", (w) => w.setSize(new LogicalSize(width, height)))();

  const createWindow = (
    newLabel: string,
    opts?: CreateWindowOptions,
  ): WebviewWindow | undefined => {
    if (!import.meta.client) return undefined;
    try {
      const win = new WebviewWindow(newLabel, opts);
      win.once("tauri://error", (e) =>
        handleError(new Error(String(e.payload)), "Failed to create window"),
      );
      return win;
    } catch (error) {
      handleError(error, "Failed to create window");
      return undefined;
    }
  };

  const listWindows = async (): Promise<string[]> => {
    if (!import.meta.client) return [];
    try {
      const windows = await getAllWindows();
      return windows.map((w) => w.label);
    } catch (error) {
      handleError(error, "Failed to list windows");
      return [];
    }
  };

  // Initialize on the client only, once per window label
  if (import.meta.client) {
    isSupported.value = true;
    if (!initialized.has(winLabel)) {
      initialized.add(winLabel);
      (async () => {
        const win = await resolveWindow();
        if (!win) {
          initialized.delete(winLabel);
          return;
        }
        await refresh();
        try {
          // Re-query on resize (covers maximize/unmaximize/fullscreen)
          await win.onResized(() => refresh());
          // Track focus changes
          await win.onFocusChanged(({ payload }) => {
            isFocused.value = payload;
          });
        } catch (error) {
          handleError(error, "Failed to attach window listeners");
        }
      })();
    }
  }

  return {
    isSupported,
    isMaximized,
    isMinimized,
    isFullscreen,
    isFocused,
    title,
    minimize,
    maximize,
    unmaximize,
    toggleMaximize,
    setFullscreen,
    toggleFullscreen,
    show,
    hide,
    setFocus,
    center,
    startDragging,
    close,
    setTitle,
    setSize,
    createWindow,
    listWindows,
  };
}
