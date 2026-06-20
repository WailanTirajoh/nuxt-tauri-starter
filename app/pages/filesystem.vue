<script setup lang="ts">
import {
  useFileSystem,
  useTextFile,
  BaseDirectory,
  type DirEntry,
} from "@/composables/useFileSystem";

const FILE = "demo.txt";

const fs = useFileSystem({ baseDir: BaseDirectory.AppData });

const { data, isReady, reload } = useTextFile(FILE, {
  baseDir: BaseDirectory.AppData,
  defaultValue: "Edit me — I'm saved to a file in the app data dir.\n",
});

const entries = ref<DirEntry[]>([]);
const fileExists = ref<boolean | null>(null);
const lastEdited = ref<number | null>(null);

// Show a transient "saved" hint shortly after edits settle
const savedHint = ref(false);
let savedTimer: ReturnType<typeof setTimeout> | null = null;
watch(data, () => {
  lastEdited.value = Date.now();
  savedHint.value = false;
  if (savedTimer) clearTimeout(savedTimer);
  savedTimer = setTimeout(() => (savedHint.value = true), 500);
});

const refreshDir = async () => {
  entries.value = await fs.readDir(".");
};

const checkExists = async () => {
  fileExists.value = await fs.exists(FILE);
};

const deleteFile = async () => {
  await fs.remove(FILE);
  data.value = "";
  await Promise.all([refreshDir(), checkExists()]);
};

onMounted(async () => {
  await Promise.all([refreshDir(), checkExists()]);
});
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4">
    <div class="max-w-3xl mx-auto space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-4xl font-bold text-gray-900 mb-2">
          useFileSystem Demo
        </h1>
        <p class="text-lg text-gray-600">
          Read / write / watch files via Tauri — scoped to the app data
          directory. The editor below is bound to a real file with
          <span class="font-mono">useTextFile</span>.
        </p>
        <p v-if="!fs.isSupported.value" class="text-sm text-orange-600 mt-2 italic">
          Tauri runtime not detected — run via
          <span class="font-mono">pnpm tauri dev</span> to interact.
        </p>
      </div>

      <!-- Reactive file editor -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-2xl font-semibold text-gray-900">
            📝 {{ FILE }}
          </h2>
          <span class="text-sm">
            <span v-if="!isReady" class="text-gray-400">loading…</span>
            <span v-else-if="savedHint" class="text-green-600 font-medium">
              ✓ saved
            </span>
            <span v-else class="text-orange-500">editing…</span>
          </span>
        </div>
        <textarea
          v-model="data"
          rows="8"
          :disabled="!isReady"
          class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 font-mono text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <div class="flex gap-2 mt-4">
          <button
            @click="reload"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Reload from disk
          </button>
          <button
            @click="deleteFile"
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Delete file
          </button>
          <button
            @click="checkExists"
            class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
          >
            Check exists
          </button>
        </div>
        <p class="text-xs text-gray-500 mt-3">
          💡 Edits auto-save (300ms debounce). Restart the app — the content
          persists. Edit the file externally and the editor updates live (watch).
          <span v-if="fileExists !== null">
            Exists: <span class="font-mono font-bold">{{ fileExists }}</span>
          </span>
        </p>
      </div>

      <!-- Directory listing -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center gap-2 mb-3">
          <h2 class="text-2xl font-semibold text-gray-900">
            📂 App data directory
          </h2>
          <button
            @click="refreshDir"
            class="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 transition"
          >
            Refresh
          </button>
        </div>
        <ul class="bg-gray-50 p-3 rounded-lg space-y-1 max-h-60 overflow-y-auto">
          <li
            v-for="entry in entries"
            :key="entry.name"
            class="text-sm font-mono text-gray-900"
          >
            {{ entry.isDirectory ? "📁" : "📄" }} {{ entry.name }}
          </li>
          <li v-if="entries.length === 0" class="text-sm text-gray-500 italic">
            Empty (or not yet loaded)
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
