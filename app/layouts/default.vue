<script setup lang="ts">
import { useDocumentStorage } from "@/composables/useDocumentStorage";
import IconBadge from "@/components/IconBadge.vue";
import AppIcon from "@/components/AppIcon.vue";

const theme = useDocumentStorage<"light" | "dark">("ui:theme", "light");

const nav = [
  { to: "/", label: "Dashboard", icon: "dashboard", color: "gray" },
  { to: "/demo", label: "Storage", icon: "database", color: "blue" },
  { to: "/notifications", label: "Notifications", icon: "bell", color: "red" },
  { to: "/window", label: "Window", icon: "window", color: "purple" },
  { to: "/filesystem", label: "Files", icon: "folder", color: "teal" },
  { to: "/updater", label: "Updates", icon: "update", color: "green" },
  { to: "/scanner", label: "Scanner", icon: "scan", color: "orange" },
  { to: "/print", label: "Print", icon: "printer", color: "gray" },
] as const;

const route = useRoute();
const search = ref("");
const sidebarOpen = ref(false);

const filtered = computed(() =>
  nav.filter((n) =>
    n.label.toLowerCase().includes(search.value.trim().toLowerCase()),
  ),
);
const isActive = (to: string) =>
  to === "/" ? route.path === "/" : route.path.startsWith(to);

// Close the mobile drawer on navigation
watch(() => route.path, () => (sidebarOpen.value = false));

if (import.meta.client) {
  watchEffect(() => {
    document.documentElement.classList.toggle("dark", theme.value === "dark");
  });
}
const toggleTheme = () => {
  theme.value = theme.value === "dark" ? "light" : "dark";
};
</script>

<template>
  <div
    class="flex h-screen overflow-hidden bg-gray-100 dark:bg-neutral-900 text-gray-900 dark:text-neutral-100"
  >
    <!-- Backdrop (mobile only, when drawer open) -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-30 bg-black/30 md:hidden"
      @click="sidebarOpen = false"
    />

    <!-- Sidebar: static on md+, slide-in drawer on mobile -->
    <aside
      class="fixed md:static inset-y-0 left-0 z-40 w-64 md:w-60 shrink-0 flex flex-col bg-gray-50 dark:bg-neutral-950/95 md:dark:bg-neutral-950/60 border-r border-black/5 dark:border-white/10 transform transition-transform duration-200"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'"
      style="padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom)"
    >
      <!-- Brand -->
      <div class="flex items-center gap-2.5 px-4 h-14 shrink-0">
        <IconBadge icon="bolt" color="blue" :size="26" />
        <span class="font-semibold text-sm">Tauri Starter</span>
        <button
          class="md:hidden ml-auto p-1 -mr-1 text-gray-500 dark:text-neutral-400"
          aria-label="Close menu"
          @click="sidebarOpen = false"
        >
          <AppIcon name="x" :size="20" />
        </button>
      </div>

      <!-- Search -->
      <div class="px-3 pb-2">
        <div class="relative">
          <span
            class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-neutral-500"
          >
            <AppIcon name="search" :size="15" />
          </span>
          <input
            v-model="search"
            type="text"
            placeholder="Search"
            class="w-full rounded-lg bg-black/5 dark:bg-white/10 pl-8 pr-3 py-1.5 text-sm placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <!-- Nav -->
      <nav class="flex-1 overflow-y-auto px-3 py-1 space-y-0.5">
        <NuxtLink
          v-for="item in filtered"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors"
          :class="
            isActive(item.to)
              ? 'bg-blue-500 text-white'
              : 'hover:bg-black/5 dark:hover:bg-white/10'
          "
        >
          <IconBadge :icon="item.icon" :color="item.color" :size="22" />
          <span class="font-medium">{{ item.label }}</span>
        </NuxtLink>
        <p
          v-if="filtered.length === 0"
          class="px-2 py-3 text-xs text-gray-400 dark:text-neutral-500"
        >
          No matches
        </p>
      </nav>

      <!-- Footer / theme toggle -->
      <div class="px-3 py-3 border-t border-black/5 dark:border-white/10">
        <button
          type="button"
          class="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          @click="toggleTheme"
        >
          <span
            class="inline-flex items-center justify-center w-[22px] h-[22px] rounded-[6px] bg-gray-700 dark:bg-neutral-700 text-white"
          >
            <AppIcon :name="theme === 'dark' ? 'sun' : 'moon'" :size="14" />
          </span>
          <span class="font-medium">{{
            theme === "dark" ? "Light mode" : "Dark mode"
          }}</span>
        </button>
      </div>
    </aside>

    <!-- Content -->
    <main
      class="flex-1 overflow-y-auto"
      style="padding-bottom: env(safe-area-inset-bottom)"
    >
      <!-- Mobile top bar (padding-top clears the device status bar) -->
      <div
        class="md:hidden sticky top-0 z-20 bg-gray-100/90 dark:bg-neutral-900/90 backdrop-blur border-b border-black/5 dark:border-white/10"
        style="padding-top: env(safe-area-inset-top)"
      >
        <div class="flex items-center gap-3 px-4 h-14">
          <button
            class="p-1 -ml-1 text-gray-700 dark:text-neutral-200"
            aria-label="Open menu"
            @click="sidebarOpen = true"
          >
            <AppIcon name="menu" :size="22" />
          </button>
          <span class="font-semibold text-sm">Tauri Starter</span>
        </div>
      </div>

      <div class="max-w-3xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
        <slot />
      </div>
    </main>
  </div>
</template>
