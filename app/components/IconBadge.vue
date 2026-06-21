<script setup lang="ts">
import AppIcon from "./AppIcon.vue";

const props = withDefaults(
  defineProps<{
    icon: string;
    color?: "blue" | "green" | "purple" | "orange" | "red" | "gray" | "teal";
    size?: number;
  }>(),
  { color: "blue", size: 28 },
);

// Solid macOS-style colored squares (same in light/dark for the vivid look)
const colors: Record<string, string> = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  purple: "bg-violet-500",
  orange: "bg-orange-500",
  red: "bg-red-500",
  gray: "bg-gray-500",
  teal: "bg-teal-500",
};
</script>

<template>
  <span
    class="inline-flex items-center justify-center rounded-[7px] text-white shrink-0"
    :class="colors[color]"
    :style="{ width: `${size}px`, height: `${size}px` }"
  >
    <AppIcon :name="icon" :size="Math.round(size * 0.62)" />
  </span>
</template>
