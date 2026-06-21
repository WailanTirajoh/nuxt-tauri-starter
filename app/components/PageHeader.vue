<script setup lang="ts">
import IconBadge from "./IconBadge.vue";

defineProps<{
  title: string;
  subtitle?: string;
  icon?: string;
  color?: "blue" | "green" | "purple" | "orange" | "red" | "gray" | "teal";
}>();
</script>

<template>
  <header class="flex items-center gap-3 mb-6">
    <IconBadge v-if="icon" :icon="icon" :color="color" :size="36" />
    <div>
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-white leading-tight">
        {{ title }}
      </h1>
      <p v-if="subtitle" class="text-sm text-gray-500 dark:text-neutral-400">
        {{ subtitle }}
      </p>
    </div>
  </header>
</template>
