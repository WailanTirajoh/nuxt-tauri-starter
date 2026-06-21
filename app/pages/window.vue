<script setup lang="ts">
import { useWindow } from "@/composables/useWindow";
import PageHeader from "@/components/PageHeader.vue";
import SettingsGroup from "@/components/SettingsGroup.vue";
import SettingsRow from "@/components/SettingsRow.vue";
import ToggleSwitch from "@/components/ToggleSwitch.vue";
import AppButton from "@/components/AppButton.vue";

const {
  isSupported,
  isMaximized,
  isFullscreen,
  isFocused,
  title,
  minimize,
  toggleMaximize,
  setFullscreen,
  center,
  hide,
  setTitle,
  setSize,
  createWindow,
  listWindows,
} = useWindow();

const secondary = useWindow("secondary");

// Two-way proxies so toggles both reflect and drive window state
const maximized = computed({
  get: () => isMaximized.value,
  set: () => toggleMaximize(),
});
const fullscreen = computed({
  get: () => isFullscreen.value,
  set: (v: boolean) => setFullscreen(v),
});

const newTitle = ref("nuxt-tauri-starter");
const width = ref(900);
const height = ref(700);
const openWindows = ref<string[]>([]);

const refreshWindows = async () => {
  openWindows.value = await listWindows();
};

const openSecondWindow = async () => {
  const labels = await listWindows();
  if (labels.includes("secondary")) {
    secondary.setFocus();
  } else {
    createWindow("secondary", {
      url: "/demo",
      title: "Second Window — Storage",
      width: 800,
      height: 600,
    });
  }
  setTimeout(refreshWindows, 400);
};

onMounted(refreshWindows);

const inputClass =
  "rounded-lg bg-black/5 dark:bg-white/10 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
</script>

<template>
  <div>
    <PageHeader
      title="Window"
      subtitle="Window controls, reactive state, and multi-window."
      icon="window"
      color="purple"
    />

    <SettingsGroup
      title="State"
      :footer="
        isSupported
          ? 'Toggles reflect live state via onResized / onFocusChanged events.'
          : 'Run via pnpm tauri dev to interact.'
      "
    >
      <SettingsRow title="Maximized">
        <ToggleSwitch v-model="maximized" label="Maximized" />
      </SettingsRow>
      <SettingsRow title="Fullscreen">
        <ToggleSwitch v-model="fullscreen" label="Fullscreen" />
      </SettingsRow>
      <SettingsRow title="Focused" description="Read-only">
        <span
          class="text-xs font-medium"
          :class="isFocused ? 'text-green-600 dark:text-green-400' : 'text-gray-400'"
        >
          {{ isFocused ? "Yes" : "No" }}
        </span>
      </SettingsRow>
    </SettingsGroup>

    <SettingsGroup title="Controls">
      <SettingsRow title="Minimize">
        <AppButton size="sm" @click="minimize">Minimize</AppButton>
      </SettingsRow>
      <SettingsRow title="Center on screen">
        <AppButton size="sm" @click="center">Center</AppButton>
      </SettingsRow>
      <SettingsRow title="Hide" description="Bring back via the dock / taskbar">
        <AppButton size="sm" @click="hide">Hide</AppButton>
      </SettingsRow>
      <SettingsRow title="Title" :description="`Current: ${title || '—'}`">
        <input v-model="newTitle" type="text" :class="`w-32 sm:w-48 ${inputClass}`" />
        <AppButton size="sm" @click="setTitle(newTitle)">Set</AppButton>
      </SettingsRow>
      <SettingsRow title="Size">
        <input v-model.number="width" type="number" :class="`w-20 ${inputClass}`" />
        <input v-model.number="height" type="number" :class="`w-20 ${inputClass}`" />
        <AppButton size="sm" @click="setSize(width, height)">Set</AppButton>
      </SettingsRow>
    </SettingsGroup>

    <SettingsGroup
      title="Multi-window"
      footer="Opens the Storage demo in a second window — edit a value in both to watch it sync live."
    >
      <SettingsRow
        title="Second window"
        :description="`Open windows: ${openWindows.join(', ') || '—'}`"
      >
        <AppButton size="sm" @click="refreshWindows">Refresh</AppButton>
        <AppButton variant="primary" size="sm" @click="openSecondWindow">
          Open
        </AppButton>
      </SettingsRow>
    </SettingsGroup>
  </div>
</template>
