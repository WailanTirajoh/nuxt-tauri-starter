/**
 * Print Composable - usePrint
 *
 * VueUse-style helpers for printing (and "Save as PDF" via the OS print
 * dialog). Print the whole page, or just one element — the element is cloned
 * into a hidden iframe with the page's styles so it prints on its own.
 *
 * No Tauri plugin required: built on the webview's native `window.print()`.
 * Desktop-oriented — the OS print dialog offers a "Save as PDF" target.
 *
 * Example:
 * ```ts
 * const { print, printElement } = usePrint()
 * print()                                  // print the whole page
 * printElement(receiptRef, { documentTitle: "Receipt" })
 * ```
 */

import { ref, unref, type Ref } from "vue";

/** A print target: an element, a template ref to one, or a CSS selector. */
export type PrintTarget = HTMLElement | Ref<HTMLElement | null> | string;

/**
 * Options for printing a single element
 */
export interface PrintElementOptions {
  /** Document title used by the print dialog / PDF filename */
  documentTitle?: string;
  /** Copy the page's stylesheets into the print frame (default: true) */
  copyStyles?: boolean;
  /** Extra CSS injected into the print frame (e.g. page margins) */
  styles?: string;
}

/**
 * Options for the composable
 */
export interface UsePrintOptions {
  /** Custom error handler */
  onError?: (error: Error) => void;
}

/**
 * Return type for usePrint composable
 */
export interface UsePrintReturn {
  /** Whether printing is available (client-side) */
  isSupported: Ref<boolean>;
  /** Whether a print is currently being prepared */
  printing: Ref<boolean>;
  /** Print the entire document via the native print dialog */
  print: () => void;
  /** Print a single element (cloned into an isolated frame with the page styles) */
  printElement: (target: PrintTarget, options?: PrintElementOptions) => Promise<void>;
}

const resolveEl = (target: PrintTarget): HTMLElement | null => {
  if (typeof target === "string") return document.querySelector(target);
  return unref(target);
};

/** Collect the page's <style> and stylesheet <link> tags as HTML. */
const collectStyles = (): string =>
  Array.from(
    document.querySelectorAll('style, link[rel="stylesheet"]'),
  )
    .map((node) => node.outerHTML)
    .join("\n");

/**
 * Print composable
 *
 * @param options - error handler
 */
export function usePrint(options: UsePrintOptions = {}): UsePrintReturn {
  const { onError } = options;

  // Start false (matches SSR) and enable after mount, so there's no hydration
  // mismatch on anything bound to `isSupported`.
  const isSupported = ref(false);
  tryOnMounted(() => {
    isSupported.value = true;
  });
  const printing = ref(false);

  const handleError = (error: unknown, context: string) => {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(`[usePrint] ${context}:`, err);
    if (onError) onError(err);
  };

  const print = () => {
    if (!import.meta.client) return;
    try {
      window.print();
    } catch (error) {
      handleError(error, "Failed to print");
    }
  };

  const printElement = async (
    target: PrintTarget,
    opts: PrintElementOptions = {},
  ): Promise<void> => {
    if (!import.meta.client) return;
    const { documentTitle = document.title, copyStyles = true, styles } = opts;

    const el = resolveEl(target);
    if (!el) {
      handleError(new Error("Print target not found"), "Cannot print element");
      return;
    }

    printing.value = true;
    // Hidden iframe so the print job contains only the target element
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    Object.assign(iframe.style, {
      position: "fixed",
      right: "0",
      bottom: "0",
      width: "0",
      height: "0",
      border: "0",
    });
    document.body.appendChild(iframe);

    const cleanup = () => {
      iframe.remove();
      printing.value = false;
    };

    try {
      const doc = iframe.contentDocument;
      const win = iframe.contentWindow;
      if (!doc || !win) throw new Error("Could not access print frame");

      doc.open();
      doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${documentTitle}</title>${
        copyStyles ? collectStyles() : ""
      }${styles ? `<style>${styles}</style>` : ""}</head><body>${el.outerHTML}</body></html>`);
      doc.close();

      // Wait for the frame (and its stylesheets/images) to settle, then print
      await new Promise<void>((resolve) => {
        const done = () => resolve();
        if (doc.readyState === "complete") setTimeout(done, 50);
        else win.addEventListener("load", () => setTimeout(done, 50), { once: true });
      });

      win.focus();
      win.print();
      // Give the (modal on most platforms) dialog time before removing the frame
      win.addEventListener("afterprint", cleanup, { once: true });
      setTimeout(cleanup, 1000);
    } catch (error) {
      handleError(error, "Failed to print element");
      cleanup();
    }
  };

  return { isSupported, printing, print, printElement };
}
