<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: "primary" | "secondary" | "danger";
    disabled?: boolean;
    size?: "sm" | "md";
  }>(),
  { variant: "secondary", size: "md" },
);

const variants: Record<string, string> = {
  primary: "bg-blue-500 hover:bg-blue-600 text-white",
  secondary:
    "bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-neutral-100",
  danger: "bg-red-500 hover:bg-red-600 text-white",
};
const sizes: Record<string, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
};
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    class="inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none"
    :class="[variants[variant], sizes[size]]"
  >
    <slot />
  </button>
</template>
