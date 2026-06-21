<script setup lang="ts">
import { getDocumentKeys } from "@/composables/useDocumentStorage";
import { useNotification } from "@/composables/useNotification";
import PageHeader from "@/components/PageHeader.vue";
import SettingsGroup from "@/components/SettingsGroup.vue";
import SettingsRow from "@/components/SettingsRow.vue";
import IconBadge from "@/components/IconBadge.vue";
import AppIcon from "@/components/AppIcon.vue";

const { permissionGranted, isSupported } = useNotification();

const docCount = ref<number | null>(null);
const appVersion = ref<string | null>(null);

onMounted(async () => {
  docCount.value = (await getDocumentKeys()).length;
  if (import.meta.client) {
    try {
      const { getVersion } = await import("@tauri-apps/api/app");
      appVersion.value = await getVersion();
    } catch {
      // not running under Tauri
    }
  }
});

const features = computed(() => [
  {
    to: "/demo",
    icon: "database",
    color: "blue" as const,
    label: "Storage",
    desc: "Reactive SQLite, synced across windows",
    status: docCount.value === null ? "—" : `${docCount.value} documents`,
    tone: "neutral",
  },
  {
    to: "/notifications",
    icon: "bell",
    color: "red" as const,
    label: "Notifications",
    desc: "Native OS toasts, permission handled",
    status: permissionGranted.value ? "Granted" : "Not granted",
    tone: permissionGranted.value ? "good" : "neutral",
  },
  {
    to: "/window",
    icon: "window",
    color: "purple" as const,
    label: "Window",
    desc: "Controls, reactive state, multi-window",
    status: "Ready",
    tone: "neutral",
  },
  {
    to: "/filesystem",
    icon: "folder",
    color: "teal" as const,
    label: "Files",
    desc: "Read / write / watch, reactive binding",
    status: "App data",
    tone: "neutral",
  },
  {
    to: "/updater",
    icon: "update",
    color: "green" as const,
    label: "Updates",
    desc: "Check, download, install, relaunch",
    status: appVersion.value ? `v${appVersion.value}` : "—",
    tone: "neutral",
  },
]);
</script>

<template>
  <div>
    <PageHeader
      title="Tauri Starter"
      subtitle="Tauri APIs, wrapped as VueUse-style composables."
      icon="bolt"
      color="blue"
    />

    <!-- Metric cards -->
    <div class="grid grid-cols-3 gap-3 mb-6">
      <div class="rounded-xl bg-white dark:bg-neutral-800/80 ring-1 ring-black/5 dark:ring-white/10 px-4 py-3">
        <div class="text-xs text-gray-500 dark:text-neutral-400">Composables</div>
        <div class="text-2xl font-semibold">5</div>
      </div>
      <div class="rounded-xl bg-white dark:bg-neutral-800/80 ring-1 ring-black/5 dark:ring-white/10 px-4 py-3">
        <div class="text-xs text-gray-500 dark:text-neutral-400">Documents</div>
        <div class="text-2xl font-semibold">{{ docCount ?? "—" }}</div>
      </div>
      <div class="rounded-xl bg-white dark:bg-neutral-800/80 ring-1 ring-black/5 dark:ring-white/10 px-4 py-3">
        <div class="text-xs text-gray-500 dark:text-neutral-400">Version</div>
        <div class="text-2xl font-semibold">{{ appVersion ? `v${appVersion}` : "—" }}</div>
      </div>
    </div>

    <!-- Feature index -->
    <SettingsGroup title="Demos">
      <NuxtLink
        v-for="f in features"
        :key="f.to"
        :to="f.to"
        class="flex items-center gap-4 px-4 py-3 hover:bg-black/[0.03] dark:hover:bg-white/5 transition-colors"
      >
        <IconBadge :icon="f.icon" :color="f.color" :size="30" />
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium">{{ f.label }}</p>
          <p class="text-xs text-gray-500 dark:text-neutral-400 truncate">
            {{ f.desc }}
          </p>
        </div>
        <span
          class="text-xs font-medium"
          :class="
            f.tone === 'good'
              ? 'text-green-600 dark:text-green-400'
              : 'text-gray-400 dark:text-neutral-500'
          "
        >
          {{ f.status }}
        </span>
        <span class="text-gray-300 dark:text-neutral-600">
          <AppIcon name="chevron" :size="16" />
        </span>
      </NuxtLink>
    </SettingsGroup>

    <p
      v-if="!isSupported"
      class="text-xs text-gray-400 dark:text-neutral-500 text-center"
    >
      Some demos need the desktop runtime — run with
      <span class="font-mono">pnpm tauri dev</span>.
    </p>
  </div>
</template>
