<script setup lang="ts">
import { useBarcodeScanner } from "@/composables/useBarcodeScanner";
import PageHeader from "@/components/PageHeader.vue";
import SettingsGroup from "@/components/SettingsGroup.vue";
import SettingsRow from "@/components/SettingsRow.vue";
import AppButton from "@/components/AppButton.vue";

const {
  isSupported,
  permissionGranted,
  scanning,
  result,
  error,
  scan,
  cancel,
  ensurePermission,
  openAppSettings,
} = useBarcodeScanner();

// Windowed scan: the camera renders behind a transparent webview so we can draw
// our own viewfinder overlay on top.
const startScan = async () => {
  const scanned = await scan({ windowed: true });
  // Haptic feedback on a successful decode (VIBRATE permission is provided by
  // the barcode-scanner plugin).
  if (scanned && import.meta.client && navigator.vibrate) {
    navigator.vibrate([0, 55, 45, 55]);
  }
};

// Toggle whole-app transparency while a windowed scan is active.
watch(scanning, (on) => {
  if (import.meta.client) {
    document.documentElement.classList.toggle("scanner-active", on);
  }
});
onBeforeUnmount(() => {
  if (import.meta.client) {
    document.documentElement.classList.remove("scanner-active");
  }
  if (scanning.value) cancel();
});
</script>

<template>
  <div>
    <PageHeader
      title="Scanner"
      subtitle="Scan barcodes and QR codes with the device camera."
      icon="scan"
      color="orange"
    />

    <SettingsGroup
      title="Camera"
      footer="The first scan triggers the OS camera-permission prompt automatically."
    >
      <SettingsRow
        title="Camera permission"
        :description="
          isSupported
            ? 'Allow this app to use the camera'
            : 'Barcode scanning runs on Android/iOS only'
        "
      >
        <span
          class="text-xs font-medium px-2 py-0.5 rounded-full"
          :class="
            permissionGranted
              ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
              : 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-neutral-400'
          "
        >
          {{ permissionGranted ? "Granted" : "Not granted" }}
        </span>
        <AppButton
          v-if="isSupported && !permissionGranted"
          size="sm"
          @click="ensurePermission"
        >
          Request
        </AppButton>
      </SettingsRow>
    </SettingsGroup>

    <SettingsGroup title="Scan">
      <SettingsRow
        title="Scan a code"
        description="Opens the native camera scanner"
      >
        <AppButton
          v-if="!scanning"
          variant="primary"
          :disabled="!isSupported"
          @click="startScan"
        >
          Scan
        </AppButton>
        <AppButton v-else variant="danger" @click="cancel">Cancel</AppButton>
      </SettingsRow>

      <SettingsRow v-if="result" title="Result">
        <template #description>
          <div class="mt-1 space-y-1">
            <p class="text-sm font-mono break-all text-gray-900 dark:text-neutral-100">
              {{ result.content }}
            </p>
            <p class="text-xs text-gray-500 dark:text-neutral-400">
              Format: <span class="font-mono">{{ result.format }}</span>
            </p>
          </div>
        </template>
      </SettingsRow>
    </SettingsGroup>

    <!-- Not supported (desktop / web) -->
    <div
      v-if="!isSupported"
      class="rounded-xl bg-amber-50 dark:bg-amber-500/10 ring-1 ring-amber-200 dark:ring-amber-500/30 px-4 py-3 text-sm text-amber-800 dark:text-amber-300"
    >
      <p class="font-medium mb-1">Mobile only</p>
      <p class="text-xs leading-relaxed">
        The barcode scanner uses the device camera and runs on Android/iOS only.
        Build with <span class="font-mono">pnpm tauri android dev</span> on a
        device or camera-enabled emulator to try it.
      </p>
    </div>

    <!-- Error / denied -->
    <div
      v-else-if="error"
      class="mt-4 rounded-xl bg-red-50 dark:bg-red-500/10 ring-1 ring-red-200 dark:ring-red-500/30 px-4 py-3 text-sm text-red-800 dark:text-red-300"
    >
      <p class="font-mono text-xs break-all">{{ error.message }}</p>
      <button
        class="mt-2 text-xs underline"
        @click="openAppSettings"
      >
        Open app settings
      </button>
    </div>
  </div>

  <!-- Windowed scan viewfinder — teleported to <body> so it sits on the
       transparent webview, above the live camera -->
  <Teleport to="body">
    <Transition name="scan">
    <div
      v-if="scanning"
      class="fixed inset-0 z-[200] flex flex-col items-center justify-center text-white select-none"
    >
      <div
        class="relative h-64 w-64 rounded-3xl"
        style="box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.55)"
      >
        <!-- corner brackets -->
        <span class="absolute -left-0.5 -top-0.5 h-9 w-9 rounded-tl-3xl border-l-4 border-t-4 border-white/90" />
        <span class="absolute -right-0.5 -top-0.5 h-9 w-9 rounded-tr-3xl border-r-4 border-t-4 border-white/90" />
        <span class="absolute -bottom-0.5 -left-0.5 h-9 w-9 rounded-bl-3xl border-b-4 border-l-4 border-white/90" />
        <span class="absolute -bottom-0.5 -right-0.5 h-9 w-9 rounded-br-3xl border-b-4 border-r-4 border-white/90" />
        <!-- scan line -->
        <span
          class="absolute left-3 right-3 top-3 h-0.5 rounded bg-blue-400"
          style="animation: scanline 2s ease-in-out infinite alternate"
        />
      </div>
      <p class="mt-8 text-sm text-white/90">
        Point at a QR code or barcode
      </p>
      <button
        class="mt-6 rounded-full bg-white/15 px-6 py-2 text-sm font-medium backdrop-blur"
        @click="cancel"
      >
        Cancel
      </button>
    </div>
    </Transition>
  </Teleport>
</template>
