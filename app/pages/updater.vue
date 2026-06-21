<script setup lang="ts">
import { useUpdater } from "@/composables/useUpdater";
import PageHeader from "@/components/PageHeader.vue";
import SettingsGroup from "@/components/SettingsGroup.vue";
import SettingsRow from "@/components/SettingsRow.vue";
import AppButton from "@/components/AppButton.vue";

const {
  status,
  available,
  version,
  notes,
  progress,
  error,
  checkForUpdates,
  downloadAndInstall,
  relaunchApp,
} = useUpdater();

const appVersion = ref<string | null>(null);
onMounted(async () => {
  if (!import.meta.client) return;
  try {
    const { getVersion } = await import("@tauri-apps/api/app");
    appVersion.value = await getVersion();
  } catch {
    // not running under Tauri
  }
});

const statusLabel = computed(
  () =>
    ({
      idle: "Idle",
      checking: "Checking…",
      available: "Update available",
      "up-to-date": "Up to date",
      downloading: "Downloading…",
      ready: "Ready to relaunch",
      installing: "Installing…",
      error: "Unavailable",
    })[status.value],
);
const statusColor = computed(() =>
  status.value === "up-to-date" || status.value === "ready"
    ? "text-green-600 dark:text-green-400"
    : status.value === "error"
      ? "text-amber-600 dark:text-amber-400"
      : "text-gray-500 dark:text-neutral-400",
);
</script>

<template>
  <div>
    <PageHeader
      title="Updates"
      subtitle="Check, download, install, and relaunch into a new version."
      icon="update"
      color="green"
    />

    <SettingsGroup title="Software update">
      <SettingsRow title="Current version">
        <span class="font-mono text-sm">{{
          appVersion ? `v${appVersion}` : "—"
        }}</span>
      </SettingsRow>
      <SettingsRow title="Status">
        <span class="text-sm font-medium" :class="statusColor">{{
          statusLabel
        }}</span>
      </SettingsRow>
      <SettingsRow title="Check for updates">
        <AppButton
          variant="primary"
          size="sm"
          :disabled="status === 'checking' || status === 'downloading'"
          @click="checkForUpdates"
        >
          Check now
        </AppButton>
      </SettingsRow>
    </SettingsGroup>

    <!-- Available -->
    <SettingsGroup v-if="available" title="Available update">
      <SettingsRow :title="`Version ${version}`" description="Release notes below" />
      <div v-if="notes" class="px-4 pb-3">
        <pre
          class="text-xs bg-black/5 dark:bg-white/10 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap"
          >{{ notes }}</pre
        >
      </div>
      <div v-if="status === 'downloading' || status === 'ready'" class="px-4 py-3">
        <div class="h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
          <div
            class="h-full bg-green-500 transition-all"
            :style="{ width: `${progress}%` }"
          />
        </div>
        <div class="text-xs text-gray-500 dark:text-neutral-400 mt-1">
          {{ progress }}%
        </div>
      </div>
      <SettingsRow title="Install">
        <AppButton
          v-if="status !== 'ready'"
          variant="primary"
          size="sm"
          :disabled="status === 'downloading'"
          @click="downloadAndInstall"
        >
          Download &amp; install
        </AppButton>
        <AppButton v-else variant="primary" size="sm" @click="relaunchApp">
          Relaunch
        </AppButton>
      </SettingsRow>
    </SettingsGroup>

    <!-- Up to date -->
    <SettingsGroup v-else-if="status === 'up-to-date'">
      <SettingsRow
        title="You're up to date"
        description="No newer version is available."
      />
    </SettingsGroup>

    <!-- Error / not configured -->
    <div
      v-if="status === 'error'"
      class="rounded-xl bg-amber-50 dark:bg-amber-500/10 ring-1 ring-amber-200 dark:ring-amber-500/30 px-4 py-3 text-sm text-amber-800 dark:text-amber-300"
    >
      <p class="font-medium mb-1">Couldn't check for updates</p>
      <p class="text-xs leading-relaxed">
        This starter ships a placeholder
        <span class="font-mono">plugins.updater</span> config — set your real
        pubkey + endpoint to enable it (see the README). The updater only works
        in signed production builds, not <span class="font-mono">tauri dev</span>.
      </p>
      <p v-if="error" class="mt-2 font-mono text-xs opacity-70">
        {{ error.message }}
      </p>
    </div>
  </div>
</template>
