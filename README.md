# Nuxt + Tauri Reactive Storage Boilerplate

**Ship a cross-platform desktop app in minutes, not days.**

![Tauri](https://img.shields.io/badge/Tauri-2.0-FFC131?style=flat-square&logo=tauri)
![Nuxt](https://img.shields.io/badge/Nuxt-3.0-00DC82?style=flat-square&logo=nuxt.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## What you get

A fully configured **Nuxt 3 + Tauri 2** starter with reactive, SQLite-backed storage that works offline, syncs across windows, and ships as a 3–10 MB native binary — no Electron, no server required.

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
git clone <your-repo-url> && cd noken-pos
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

## Stack

**Frontend:** Nuxt 3 · Vue 3 · TypeScript · Tailwind CSS · VueUse · Pinia  
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

The storage layer is done. Next up: wrapping Tauri's native APIs into composables so you never touch raw IPC directly.

| API | Composable | Status |
|-----|-----------|--------|
| File system (read/write/watch) | `useFileSystem` | 🔲 Planned |
| Native dialogs (open/save/message) | `useDialog` | 🔲 Planned |
| Shell & subprocess | `useShell` | 🔲 Planned |
| System tray | `useSystemTray` | 🔲 Planned |
| Window management (minimize, resize, multi-window) | `useWindow` | 🔲 Planned |
| OS notifications | `useNotification` | 🔲 Planned |
| Clipboard | `useClipboard` | 🔲 Planned |
| Auto-updater | `useUpdater` | 🔲 Planned |
| HTTP client (Rust-side, bypasses CORS) | `useTauriHttp` | 🔲 Planned |
| Print / PDF export | `usePrint` | 🔲 Planned |
| Global shortcuts | `useGlobalShortcut` | 🔲 Planned |

Each composable will follow the same pattern as `useDocumentStorage` — VueUse-style, typed, and ready to drop into any component.

Want to contribute one? Open a PR.

---

MIT License · Built for the developer community