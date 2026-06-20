<script setup lang="ts">
import { useNotification } from "@/composables/useNotification";

const { notify, permissionGranted, ensurePermission, isSupported } =
  useNotification({
    icon: "icons/128x128.png",
  });

const notifyTitle = ref("Hello from Tauri");
const notifyBody = ref("This is a native notification 🎉");

const sendNotify = () => {
  notify({ title: notifyTitle.value, body: notifyBody.value });
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4">
    <div class="max-w-3xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold text-gray-900 mb-2">
          useNotification Demo
        </h1>
        <p class="text-lg text-gray-600">
          Native OS notifications via Tauri — permission handled automatically,
          reactive and shared app-wide.
        </p>
      </div>

      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-2xl font-semibold text-gray-900 mb-4">
          🔔 Send a Notification
        </h2>
        <div class="space-y-4">
          <div class="flex items-center gap-2 text-sm">
            <span class="text-gray-600">Permission:</span>
            <span
              class="font-mono font-bold"
              :class="permissionGranted ? 'text-green-600' : 'text-orange-600'"
            >
              {{ permissionGranted ? "granted" : "not granted" }}
            </span>
            <span v-if="!isSupported" class="text-xs text-gray-400 italic">
              (Tauri runtime not detected — run via
              <span class="font-mono">pnpm tauri dev</span>)
            </span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              v-model="notifyTitle"
              type="text"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Body
            </label>
            <input
              v-model="notifyBody"
              type="text"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div class="flex gap-2">
            <button
              @click="sendNotify"
              class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Send Notification
            </button>
            <button
              @click="ensurePermission"
              class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
            >
              Request Permission
            </button>
          </div>
          <div class="pt-4 border-t border-gray-200">
            <p class="text-xs text-gray-500">
              💡 First send triggers the OS permission prompt automatically
              (auto-request). Permission state is shared app-wide and reactive.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
