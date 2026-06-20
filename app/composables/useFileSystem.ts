/**
 * File System Composable - useFileSystem
 *
 * Provides a VueUse-style, typed wrapper around Tauri's fs plugin plus a
 * reactive `useTextFile` binding that auto-loads, debounce-writes, and
 * live-updates a single text file (the `useDocumentStorage` pattern applied
 * to a file). Safe to call during SSR (no-ops on the server).
 *
 * Operations are scoped by the app's capability permissions — by default the
 * app data directory (`BaseDirectory.AppData`).
 *
 * Example:
 * ```ts
 * const fs = useFileSystem()
 * await fs.writeTextFile("notes.txt", "hello")
 *
 * const { data, isReady } = useTextFile("demo.txt")
 * data.value = "edited" // → debounced write to the file
 * ```
 */

import { ref, type Ref } from "vue";
import {
  readTextFile,
  writeTextFile,
  readFile,
  writeFile,
  exists,
  mkdir,
  remove,
  rename,
  copyFile,
  readDir,
  watch,
  BaseDirectory,
  type WatchEvent,
  type WatchOptions,
  type UnwatchFn,
  type DirEntry,
} from "@tauri-apps/plugin-fs";

/** Options common to most fs operations. */
export interface FsOptions {
  baseDir?: BaseDirectory;
}

/**
 * Options for the composable
 */
export interface UseFileSystemOptions {
  /** Base directory applied to every operation (default: AppData) */
  baseDir?: BaseDirectory;
  /** Custom error handler */
  onError?: (error: Error) => void;
}

/**
 * Typed, SSR-safe facade over Tauri's fs plugin.
 *
 * @param options - Default base directory + error handler
 */
export function useFileSystem(options: UseFileSystemOptions = {}) {
  const { baseDir = BaseDirectory.AppData, onError } = options;

  const isSupported = useState<boolean>("fs:supported", () => false);
  if (import.meta.client) isSupported.value = true;

  const handleError = (error: unknown, context: string) => {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(`[useFileSystem] ${context}:`, err);
    if (onError) onError(err);
  };

  // Merge the default baseDir into a single-path option object
  const withBase = <T extends FsOptions>(opts?: T): T =>
    ({ baseDir, ...(opts ?? {}) }) as T;

  return {
    isSupported,

    async readTextFile(path: string, opts?: FsOptions): Promise<string | null> {
      if (!import.meta.client) return null;
      try {
        return await readTextFile(path, withBase(opts));
      } catch (error) {
        handleError(error, `Failed to read "${path}"`);
        return null;
      }
    },

    async writeTextFile(
      path: string,
      contents: string,
      opts?: FsOptions,
    ): Promise<boolean> {
      if (!import.meta.client) return false;
      try {
        await writeTextFile(path, contents, withBase(opts));
        return true;
      } catch (error) {
        handleError(error, `Failed to write "${path}"`);
        return false;
      }
    },

    async readFile(path: string, opts?: FsOptions): Promise<Uint8Array | null> {
      if (!import.meta.client) return null;
      try {
        return await readFile(path, withBase(opts));
      } catch (error) {
        handleError(error, `Failed to read bytes "${path}"`);
        return null;
      }
    },

    async writeFile(
      path: string,
      data: Uint8Array,
      opts?: FsOptions,
    ): Promise<boolean> {
      if (!import.meta.client) return false;
      try {
        await writeFile(path, data, withBase(opts));
        return true;
      } catch (error) {
        handleError(error, `Failed to write bytes "${path}"`);
        return false;
      }
    },

    async exists(path: string, opts?: FsOptions): Promise<boolean> {
      if (!import.meta.client) return false;
      try {
        return await exists(path, withBase(opts));
      } catch (error) {
        handleError(error, `Failed to check exists "${path}"`);
        return false;
      }
    },

    async mkdir(
      path: string,
      opts?: FsOptions & { recursive?: boolean },
    ): Promise<boolean> {
      if (!import.meta.client) return false;
      try {
        await mkdir(path, withBase(opts));
        return true;
      } catch (error) {
        handleError(error, `Failed to mkdir "${path}"`);
        return false;
      }
    },

    async remove(
      path: string,
      opts?: FsOptions & { recursive?: boolean },
    ): Promise<boolean> {
      if (!import.meta.client) return false;
      try {
        await remove(path, withBase(opts));
        return true;
      } catch (error) {
        handleError(error, `Failed to remove "${path}"`);
        return false;
      }
    },

    async rename(
      oldPath: string,
      newPath: string,
      opts?: Parameters<typeof rename>[2],
    ): Promise<boolean> {
      if (!import.meta.client) return false;
      try {
        await rename(oldPath, newPath, opts);
        return true;
      } catch (error) {
        handleError(error, `Failed to rename "${oldPath}"`);
        return false;
      }
    },

    async copyFile(
      fromPath: string,
      toPath: string,
      opts?: Parameters<typeof copyFile>[2],
    ): Promise<boolean> {
      if (!import.meta.client) return false;
      try {
        await copyFile(fromPath, toPath, opts);
        return true;
      } catch (error) {
        handleError(error, `Failed to copy "${fromPath}"`);
        return false;
      }
    },

    async readDir(path: string, opts?: FsOptions): Promise<DirEntry[]> {
      if (!import.meta.client) return [];
      try {
        return await readDir(path, withBase(opts));
      } catch (error) {
        handleError(error, `Failed to read dir "${path}"`);
        return [];
      }
    },

    async watch(
      paths: string | string[],
      cb: (event: WatchEvent) => void,
      opts?: WatchOptions,
    ): Promise<UnwatchFn> {
      const noop: UnwatchFn = () => {};
      if (!import.meta.client) return noop;
      try {
        return await watch(paths, cb, { baseDir, ...(opts ?? {}) });
      } catch (error) {
        handleError(error, "Failed to watch");
        return noop;
      }
    },
  };
}

/**
 * Options for useTextFile
 */
export interface UseTextFileOptions {
  /** Base directory (default: AppData) */
  baseDir?: BaseDirectory;
  /** Value seeded into the file if it doesn't exist yet */
  defaultValue?: string;
  /** Debounce delay for writes in ms (default: 300) */
  debounce?: number;
  /** Live-update `data` when the file changes on disk (default: true) */
  watch?: boolean;
  /** Custom error handler */
  onError?: (error: Error) => void;
}

/**
 * Return type for useTextFile
 */
export interface UseTextFileReturn {
  /** Reactive file contents — assigning triggers a debounced write */
  data: Ref<string>;
  /** Whether the initial load has completed */
  isReady: Ref<boolean>;
  /** Flush the current value to disk immediately */
  save: () => Promise<void>;
  /** Re-read the file from disk into `data` */
  reload: () => Promise<void>;
  /** Stop watching the file */
  stop: () => void;
}

/**
 * Reactive single-file binding — auto-loads, debounce-writes on change, and
 * live-updates from external changes (parallels `useDocumentStorage`).
 *
 * @param path - File path relative to `baseDir`
 * @param options - Binding options
 */
export function useTextFile(
  path: string,
  options: UseTextFileOptions = {},
): UseTextFileReturn {
  const {
    baseDir = BaseDirectory.AppData,
    defaultValue = "",
    debounce = 300,
    watch: enableWatch = true,
    onError,
  } = options;

  const data = ref<string>(defaultValue);
  const isReady = ref(false);
  let unwatch: UnwatchFn | null = null;
  // Set before applying an external change so the debounced writer skips that tick
  let suppressWrite = false;

  const handleError = (error: unknown, context: string) => {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(`[useTextFile] ${context} "${path}":`, err);
    if (onError) onError(err);
  };

  const write = async () => {
    try {
      await writeTextFile(path, data.value, { baseDir });
    } catch (error) {
      handleError(error, "Failed to write");
    }
  };

  const reload = async () => {
    if (!import.meta.client) return;
    try {
      if (await exists(path, { baseDir })) {
        const fresh = await readTextFile(path, { baseDir });
        if (fresh !== data.value) {
          suppressWrite = true;
          data.value = fresh;
        }
      }
    } catch (error) {
      handleError(error, "Failed to read");
    }
  };

  const save = async () => {
    if (!import.meta.client) return;
    await write();
  };

  const stop = () => {
    if (unwatch) {
      unwatch();
      unwatch = null;
    }
  };

  // Debounced write on change (skips the tick following an external sync)
  watchDebounced(
    data,
    () => {
      if (suppressWrite) {
        suppressWrite = false;
        return;
      }
      write();
    },
    { debounce },
  );

  // Initialize (client only — fs APIs are unavailable during SSR)
  if (import.meta.client) {
    (async () => {
      try {
        if (await exists(path, { baseDir })) {
          suppressWrite = true;
          data.value = await readTextFile(path, { baseDir });
        } else if (defaultValue) {
          await writeTextFile(path, defaultValue, { baseDir });
        }
        isReady.value = true;

        if (enableWatch) {
          unwatch = await watch(path, () => reload(), { baseDir });
        }
      } catch (error) {
        handleError(error, "Failed to initialize");
        isReady.value = true;
      }
    })();

    tryOnUnmounted(stop);
  }

  return { data, isReady, save, reload, stop };
}

// Re-export plugin types for convenience
export { BaseDirectory } from "@tauri-apps/plugin-fs";
export type { WatchEvent, DirEntry } from "@tauri-apps/plugin-fs";
