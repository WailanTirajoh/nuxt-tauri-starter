<script setup lang="ts">
import { useUpdater } from "@/composables/useUpdater";

const {
  isSupported,
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
    // Not running under Tauri
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
      error: "Error",
    })[status.value],
);

const statusColor = computed(
  () =>
    ({
      idle: "text-gray-500",
      checking: "text-blue-600",
      available: "text-purple-600",
      "up-to-date": "text-green-600",
      downloading: "text-blue-600",
      ready: "text-green-600",
      installing: "text-blue-600",
      error: "text-red-600",
    })[status.value],
);
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4">
    <div class="max-w-2xl mx-auto space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-4xl font-bold text-gray-900 mb-2">useUpdater Demo</h1>
        <p class="text-lg text-gray-600">
          Auto-update state machine via Tauri — check, download with progress,
          install, relaunch.
        </p>
        <p v-if="!isSupported" class="text-sm text-orange-600 mt-2 italic">
          Tauri runtime not detected — run via
          <span class="font-mono">pnpm tauri dev</span> to interact.
        </p>
      </div>

      <div class="bg-white rounded-lg shadow-md p-6 space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-gray-500">Current version</div>
            <div class="font-mono font-bold text-gray-900">
              {{ appVersion ?? "—" }}
            </div>
          </div>
          <div class="text-right">
            <div class="text-sm text-gray-500">Status</div>
            <div class="font-semibold" :class="statusColor">
              {{ statusLabel }}
            </div>
          </div>
        </div>

        <button
          @click="checkForUpdates"
          :disabled="status === 'checking' || status === 'downloading'"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          Check for updates
        </button>

        <!-- Up to date -->
        <div
          v-if="status === 'up-to-date'"
          class="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800"
        >
          ✓ You're on the latest version.
        </div>

        <!-- Update available -->
        <div
          v-if="available"
          class="p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-3"
        >
          <div class="text-sm text-purple-900">
            New version
            <span class="font-mono font-bold">{{ version }}</span> is available.
          </div>
          <pre
            v-if="notes"
            class="text-xs bg-white border border-purple-100 p-3 rounded overflow-x-auto whitespace-pre-wrap"
            >{{ notes }}</pre
          >

          <div v-if="status === 'downloading' || status === 'ready'">
            <div class="h-2 bg-purple-100 rounded-full overflow-hidden">
              <div
                class="h-full bg-purple-600 transition-all"
                :style="{ width: `${progress}%` }"
              />
            </div>
            <div class="text-xs text-purple-700 mt-1">{{ progress }}%</div>
          </div>

          <button
            v-if="status !== 'ready'"
            @click="downloadAndInstall"
            :disabled="status === 'downloading'"
            class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
          >
            Download &amp; install
          </button>
          <button
            v-else
            @click="relaunchApp"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Relaunch to apply
          </button>
        </div>

        <!-- Error / not configured -->
        <div
          v-if="status === 'error'"
          class="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900"
        >
          <p class="font-medium mb-1">Couldn't check for updates</p>
          <p>
            This starter ships a placeholder
            <span class="font-mono">plugins.updater</span> config — set your real
            pubkey + endpoint to enable it (see the README "Auto-update setup").
            The updater only works in signed production builds, not
            <span class="font-mono">tauri dev</span>.
          </p>
          <p v-if="error" class="mt-2 font-mono text-xs text-amber-700">
            {{ error.message }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
