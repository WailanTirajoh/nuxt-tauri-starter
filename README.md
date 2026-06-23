# Nuxt + Tauri Reactive Storage Boilerplate

**Ship a cross-platform desktop app in minutes, not days.**

![Tauri](https://img.shields.io/badge/Tauri-2.0-FFC131?style=flat-square&logo=tauri)
![Nuxt](https://img.shields.io/badge/Nuxt-4.0-00DC82?style=flat-square&logo=nuxt.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## What you get

A fully configured **Nuxt 4 + Tauri 2** starter with reactive, SQLite-backed storage that works offline, syncs across windows, and ships as a 3–10 MB native binary — no Electron, no server required.

```vue
<script setup>
const products = useDocumentStorage('products', [])
</script>

<template>
  <!-- Reactively persisted. Auto-synced. That's it. -->
  <div v-for="p in products" :key="p.id">{{ p.name }}</div>
</template>
```

---

## Why this over the alternatives?

| | This boilerplate | Electron | Web app |
|---|---|---|---|
| **App size** | 3–10 MB | 50–150 MB | — |
| **Offline** | ✅ SQLite | ✅ | ❌ |
| **Setup time** | 5 minutes | 2–3 days | — |
| **Multi-window sync** | ✅ built-in | ❌ DIY | — |

---

## Quick start

```bash
git clone https://github.com/WailanTirajoh/nuxt-tauri-starter && cd nuxt-tauri-starter
pnpm install
pnpm tauri dev
```

Then open `/demo` to see reactive storage, multi-window sync, and the storage inspector live.

---

## Core feature: `useDocumentStorage`

VueUse-style API, backed by SQLite via Tauri IPC.

```ts
const user = useDocumentStorage('user', { name: 'Guest' })

user.value.name = 'Wailan'
// → debounced write to SQLite
// → broadcast to all open windows
```

**Options:** `collection`, `debounce` (default 300ms), `manual` (explicit save), `onError`

---

## Native notifications: `useNotification`

VueUse-style wrapper around Tauri's notification plugin. Permission is handled for you, state is reactive and shared app-wide, and it's SSR-safe.

```ts
const { notify, permissionGranted } = useNotification()

notify('Saved!')                              // string → title
notify({ title: 'Upload done', body: '3 files' })
// → first call auto-requests OS permission, then fires a native notification
```

**Defaults & options:** `useNotification(defaultOptions, { autoRequest, requestOnMounted, onError })` — `defaultOptions` (e.g. `{ icon }`) merge into every `notify()` call.

---

## Window management: `useWindow`

VueUse-style wrapper around Tauri's window API — imperative controls, reactive window state, and multi-window creation. SSR-safe.

```ts
const win = useWindow()

win.toggleMaximize()
win.toggleFullscreen()
win.setTitle('Dashboard')
win.createWindow('secondary', { url: '/demo' })   // open a new window
// win.isMaximized, win.isFullscreen, win.isFocused are reactive (synced via window events)
```

`useWindow(label)` targets another window by label. Controls: `minimize`, `maximize`/`toggleMaximize`, `setFullscreen`, `center`, `show`/`hide`, `setFocus`, `setTitle`, `setSize`, `close`, plus `createWindow` / `listWindows`.

> New windows need their label covered by a capability — see `src-tauri/capabilities/default.json`.

---

## File system: `useFileSystem`

VueUse-style wrapper around Tauri's fs plugin — typed read/write/watch ops plus a reactive `useTextFile` binding (the storage pattern applied to a file). SSR-safe and scoped to the app data dir.

```ts
const fs = useFileSystem()                 // defaults to BaseDirectory.AppData
await fs.writeTextFile('notes.txt', 'hello')

// reactive: auto-loads, debounce-writes, live-updates on external change
const { data, isReady } = useTextFile('demo.txt')
data.value = 'edited'   // → debounced write to the file
```

Ops: `readTextFile`/`writeTextFile`, `readFile`/`writeFile`, `exists`, `mkdir`, `remove`, `rename`, `copyFile`, `readDir`, `watch`.

> File access is permission-scoped. The default capability grants only the app data dir (`fs:allow-appdata-*` + watch) — widen the scope in `src-tauri/capabilities/default.json` for other directories.

---

## Auto-update: `useUpdater`

VueUse-style wrapper around Tauri's updater plugin — a small reactive state machine: check → download (with progress) → install → relaunch. SSR-safe.

```ts
const { checkForUpdates, available, version, downloadAndInstall, progress, relaunchApp } = useUpdater()

await checkForUpdates()
if (available.value) {
  await downloadAndInstall()   // progress tracks 0–100
  await relaunchApp()          // restart into the new version
}
```

`status` reflects `idle | checking | available | up-to-date | downloading | ready | installing | error`. Pass `{ autoCheck: true }` to check on mount.

> The updater only works in **signed production builds** with a real `plugins.updater` pubkey + endpoint — see setup below. The starter ships a **placeholder** config (empty pubkey, example endpoint) so the plugin initializes; until you fill it in, `checkForUpdates()` resolves to a friendly error state (try it on `/updater`).

### Auto-update setup

`src-tauri/tauri.conf.json` already has a placeholder `plugins.updater` block — the updater plugin requires it to initialize, but the empty pubkey means checks fail until you supply real values. To enable it:

1. **Generate a keypair:** `pnpm tauri signer generate -- -w ~/.tauri/myapp.key` (keep the private key secret; never commit it).
2. **Fill in** the `plugins.updater` block and enable artifact generation:
   ```jsonc
   "bundle": { "createUpdaterArtifacts": true },
   "plugins": {
     "updater": {
       "pubkey": "<contents of myapp.key.pub>",
       "endpoints": ["https://your.host/updates/{{target}}/{{arch}}/{{current_version}}"]
     }
   }
   ```
3. **Sign releases** by setting `TAURI_SIGNING_PRIVATE_KEY` (and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`) in your release CI, and host a `latest.json` matching Tauri's schema.

See the [Tauri updater docs](https://v2.tauri.app/plugin/updater/) for the full flow.

---

## Barcode scanner: `useBarcodeScanner`

VueUse-style wrapper around Tauri's barcode-scanner plugin — camera permission handled for you, reactive scan state, typed result. **Mobile only (Android/iOS).**

```ts
const { scan, scanning, result, isSupported } = useBarcodeScanner()

const code = await scan({ formats: [Format.QRCode] })
// code?.content  → the decoded string
// code?.format   → e.g. "QR_CODE"
```

Also exposes `permissionGranted`, `ensurePermission()`, `cancel()`, and `openAppSettings()`. Defaults to the OS's native fullscreen scanner; pass `windowed: true` to render your own UI over the live camera.

> Mobile only — on desktop `isSupported` is `false` and `scan()` is a no-op. The plugin adds the camera permission on Android automatically; for iOS the camera usage string lives in `src-tauri/Info.ios.plist`. Permissions are scoped to mobile in `src-tauri/capabilities/mobile.json`.

---

## Stack

**Frontend:** Nuxt 4 · Vue 3 · TypeScript · Tailwind CSS · VueUse · Pinia  
**Backend:** Tauri 2 · Rust · Diesel 2 · SQLite

**Architecture in one line:** Rust handles persistence. Vue owns all business logic. No Rust recompile for feature changes.

---

## Build for production

```bash
pnpm tauri build
# → .dmg / .msi / .deb / .AppImage in src-tauri/target/release/bundle/
```

---

## Prerequisites

- Node.js 18+, pnpm, Rust 1.70+
- [Platform dependencies](https://tauri.app/v2/guides/getting-started/prerequisites/)

---

## Roadmap — Tauri API integrations

Wrapping Tauri's native APIs into composables so you never touch raw IPC directly. Several are shipped — storage, notifications, window management, file system, and the auto-updater — with more on the way.

| API | Composable | Status |
|-----|-----------|--------|
| File system (read/write/watch) | `useFileSystem` | ✅ Done |
| Native dialogs (open/save/message) | `useDialog` | 🔲 Planned |
| Shell & subprocess | `useShell` | 🔲 Planned |
| System tray | `useSystemTray` | 🔲 Planned |
| Window management (minimize, resize, multi-window) | `useWindow` | ✅ Done |
| OS notifications | `useNotification` | ✅ Done |
| Clipboard | `useClipboard` | 🔲 Planned |
| Auto-updater | `useUpdater` | ✅ Done |
| Barcode scanner (mobile) | `useBarcodeScanner` | ✅ Done |
| HTTP client (Rust-side, bypasses CORS) | `useTauriHttp` | 🔲 Planned |
| Print / PDF export | `usePrint` | 🔲 Planned |
| Global shortcuts | `useGlobalShortcut` | 🔲 Planned |

Each composable will follow the same pattern as `useDocumentStorage` — VueUse-style, typed, and ready to drop into any component.

Want to contribute one? Open a PR.

---

MIT License · Built for the developer community