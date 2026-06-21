<script setup lang="ts">
import { useNotification } from "@/composables/useNotification";
import PageHeader from "@/components/PageHeader.vue";
import SettingsGroup from "@/components/SettingsGroup.vue";
import SettingsRow from "@/components/SettingsRow.vue";
import AppButton from "@/components/AppButton.vue";

const { notify, permissionGranted, ensurePermission, isSupported } =
  useNotification({ icon: "icons/128x128.png" });

const notifyTitle = ref("Hello from Tauri");
const notifyBody = ref("This is a native notification");

const sendNotify = () => {
  notify({ title: notifyTitle.value, body: notifyBody.value });
};

const inputClass =
  "w-40 sm:w-56 rounded-lg bg-black/5 dark:bg-white/10 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
</script>

<template>
  <div>
    <PageHeader
      title="Notifications"
      subtitle="Native OS notifications, permission handled for you."
      icon="bell"
      color="red"
    />

    <SettingsGroup
      title="Permission"
      footer="The first send triggers the OS permission prompt automatically. State is shared app-wide and reactive."
    >
      <SettingsRow
        title="Notification permission"
        :description="
          isSupported
            ? 'Allow this app to show notifications'
            : 'Run via pnpm tauri dev to interact'
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
          v-if="!permissionGranted"
          size="sm"
          @click="ensurePermission"
        >
          Request
        </AppButton>
      </SettingsRow>
    </SettingsGroup>

    <SettingsGroup title="Send a test notification">
      <SettingsRow title="Title">
        <input v-model="notifyTitle" type="text" :class="inputClass" />
      </SettingsRow>
      <SettingsRow title="Body">
        <input v-model="notifyBody" type="text" :class="inputClass" />
      </SettingsRow>
      <SettingsRow title="Send" description="Fires a native notification now">
        <AppButton variant="primary" @click="sendNotify">Send</AppButton>
      </SettingsRow>
    </SettingsGroup>
  </div>
</template>
