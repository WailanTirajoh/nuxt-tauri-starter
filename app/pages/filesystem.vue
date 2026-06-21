<script setup lang="ts">
import {
  useFileSystem,
  useTextFile,
  BaseDirectory,
  type DirEntry,
} from "@/composables/useFileSystem";
import PageHeader from "@/components/PageHeader.vue";
import SettingsGroup from "@/components/SettingsGroup.vue";
import SettingsRow from "@/components/SettingsRow.vue";
import AppButton from "@/components/AppButton.vue";
import AppIcon from "@/components/AppIcon.vue";

const FILE = "demo.txt";
const fs = useFileSystem({ baseDir: BaseDirectory.AppData });
const { data, isReady, reload } = useTextFile(FILE, {
  baseDir: BaseDirectory.AppData,
  defaultValue: "Edit me — I'm saved to a file in the app data dir.\n",
});

const entries = ref<DirEntry[]>([]);
const fileExists = ref<boolean | null>(null);
const savedHint = ref(false);
let savedTimer: ReturnType<typeof setTimeout> | null = null;

watch(data, () => {
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
  <div>
    <PageHeader
      title="Files"
      subtitle="Read / write / watch files, scoped to the app data dir."
      icon="folder"
      color="teal"
    />

    <SettingsGroup
      title="demo.txt"
      footer="Edits auto-save (300ms debounce). Restart the app — content persists. Edit the file externally and the editor updates live (watch)."
    >
      <div class="px-4 py-3">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium">Contents</span>
          <span class="text-xs">
            <span v-if="!isReady" class="text-gray-400">loading…</span>
            <span v-else-if="savedHint" class="text-green-600 dark:text-green-400">
              ✓ saved
            </span>
            <span v-else class="text-orange-500">editing…</span>
          </span>
        </div>
        <textarea
          v-model="data"
          rows="7"
          :disabled="!isReady"
          class="w-full rounded-lg bg-black/5 dark:bg-white/10 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
      </div>
      <SettingsRow>
        <template #title>
          <span class="text-sm text-gray-500 dark:text-neutral-400">
            Exists:
            <span class="font-mono font-medium text-gray-900 dark:text-neutral-100">{{
              fileExists ?? "—"
            }}</span>
          </span>
        </template>
        <AppButton size="sm" @click="reload">Reload</AppButton>
        <AppButton size="sm" @click="checkExists">Check</AppButton>
        <AppButton variant="danger" size="sm" @click="deleteFile">Delete</AppButton>
      </SettingsRow>
    </SettingsGroup>

    <SettingsGroup title="App data directory">
      <SettingsRow>
        <template #title>
          <span class="text-sm font-medium">Entries</span>
        </template>
        <AppButton size="sm" @click="refreshDir">Refresh</AppButton>
      </SettingsRow>
      <div class="px-4 py-3 max-h-52 overflow-y-auto">
        <ul class="space-y-1">
          <li
            v-for="entry in entries"
            :key="entry.name"
            class="flex items-center gap-2 text-sm font-mono text-gray-700 dark:text-neutral-300"
          >
            <span class="text-gray-400 dark:text-neutral-500">
              <AppIcon :name="entry.isDirectory ? 'folder' : 'file'" :size="15" />
            </span>
            {{ entry.name }}
          </li>
          <li
            v-if="entries.length === 0"
            class="text-sm text-gray-400 dark:text-neutral-500 italic"
          >
            Empty (or not yet loaded)
          </li>
        </ul>
      </div>
    </SettingsGroup>
  </div>
</template>
