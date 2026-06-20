<script setup lang="ts">
import { useWindow } from "@/composables/useWindow";

const {
  isSupported,
  isMaximized,
  isMinimized,
  isFullscreen,
  isFocused,
  title,
  minimize,
  toggleMaximize,
  toggleFullscreen,
  center,
  hide,
  setTitle,
  setSize,
  createWindow,
  listWindows,
} = useWindow();

// Handle for targeting the second window by label (resolved lazily on use)
const secondary = useWindow("secondary");

const newTitle = ref("nuxt-tauri-starter");
const width = ref(900);
const height = ref(700);
const openWindows = ref<string[]>([]);

const applyTitle = () => setTitle(newTitle.value);
const applySize = () => setSize(width.value, height.value);

const refreshWindows = async () => {
  openWindows.value = await listWindows();
};

const openSecondWindow = async () => {
  const labels = await listWindows();
  if (labels.includes("secondary")) {
    // Already open — focus it instead of creating a duplicate
    secondary.setFocus();
  } else {
    createWindow("secondary", {
      url: "/demo",
      title: "Second Window — Storage Demo",
      width: 800,
      height: 600,
    });
  }
  // Give the new window a moment to register, then refresh the list
  setTimeout(refreshWindows, 400);
};

onMounted(refreshWindows);

const state = computed(() => [
  { label: "Maximized", value: isMaximized.value },
  { label: "Minimized", value: isMinimized.value },
  { label: "Fullscreen", value: isFullscreen.value },
  { label: "Focused", value: isFocused.value },
]);
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4">
    <div class="max-w-3xl mx-auto space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-4xl font-bold text-gray-900 mb-2">useWindow Demo</h1>
        <p class="text-lg text-gray-600">
          Native window management via Tauri — imperative controls, reactive
          state, and multi-window creation.
        </p>
        <p v-if="!isSupported" class="text-sm text-orange-600 mt-2 italic">
          Tauri runtime not detected — run via
          <span class="font-mono">pnpm tauri dev</span> to interact.
        </p>
      </div>

      <!-- Reactive state readout -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-2xl font-semibold text-gray-900 mb-4">
          📊 Live Window State
        </h2>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            v-for="item in state"
            :key="item.label"
            class="bg-gray-50 rounded-lg p-3 text-center"
          >
            <div class="text-xs text-gray-500 mb-1">{{ item.label }}</div>
            <div
              class="font-mono font-bold"
              :class="item.value ? 'text-green-600' : 'text-gray-400'"
            >
              {{ item.value }}
            </div>
          </div>
        </div>
        <p class="text-sm text-gray-700 mt-4">
          Title: <span class="font-mono font-bold">{{ title }}</span>
        </p>
        <p class="text-xs text-gray-500 mt-2">
          💡 State updates reactively via <span class="font-mono">onResized</span>
          / <span class="font-mono">onFocusChanged</span> events.
        </p>
      </div>

      <!-- Controls -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-2xl font-semibold text-gray-900 mb-4">🎛️ Controls</h2>
        <div class="flex flex-wrap gap-2">
          <button
            @click="minimize"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Minimize
          </button>
          <button
            @click="toggleMaximize"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Toggle Maximize
          </button>
          <button
            @click="toggleFullscreen"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Toggle Fullscreen
          </button>
          <button
            @click="center"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Center
          </button>
          <button
            @click="hide"
            class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
          >
            Hide
          </button>
        </div>
        <p class="text-xs text-gray-500 mt-2">
          💡 After Hide, bring the window back via the dock / taskbar icon.
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <div class="flex gap-2">
              <input
                v-model="newTitle"
                type="text"
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
              />
              <button
                @click="applyTitle"
                class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Set
              </button>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Size (W × H)
            </label>
            <div class="flex gap-2">
              <input
                v-model.number="width"
                type="number"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
              />
              <input
                v-model.number="height"
                type="number"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
              />
              <button
                @click="applySize"
                class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Set
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Multi-window -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-2xl font-semibold text-gray-900 mb-4">
          🪟 Multi-window
        </h2>
        <button
          @click="openSecondWindow"
          class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          Open Second Window (Storage Demo)
        </button>
        <div class="mt-4">
          <div class="flex items-center gap-2 mb-2">
            <h3 class="text-sm font-semibold text-gray-900">Open windows</h3>
            <button
              @click="refreshWindows"
              class="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 transition"
            >
              Refresh
            </button>
          </div>
          <ul class="bg-gray-50 p-3 rounded-lg space-y-1">
            <li
              v-for="label in openWindows"
              :key="label"
              class="text-sm font-mono text-gray-900"
            >
              • {{ label }}
            </li>
            <li
              v-if="openWindows.length === 0"
              class="text-sm text-gray-500 italic"
            >
              No windows listed
            </li>
          </ul>
        </div>
        <p class="text-xs text-gray-500 mt-3">
          💡 The second window opens the Storage Demo. Open Storage Demo in this
          window too, then edit a value to watch it sync live across windows via
          the <span class="font-mono">storage:changed</span> broadcast.
        </p>
      </div>
    </div>
  </div>
</template>
