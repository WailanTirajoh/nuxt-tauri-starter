<script setup lang="ts">
const model = defineModel<boolean>({ default: false });
defineProps<{ disabled?: boolean; label?: string }>();
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="model"
    :aria-label="label"
    :disabled="disabled"
    class="relative inline-flex h-[26px] w-[44px] shrink-0 items-center rounded-full transition-colors duration-200 disabled:opacity-40"
    :class="model ? 'bg-green-500' : 'bg-gray-300 dark:bg-neutral-600'"
    @click="model = !model"
  >
    <span
      class="inline-block h-[22px] w-[22px] transform rounded-full bg-white shadow transition-transform duration-200"
      :class="model ? 'translate-x-[20px]' : 'translate-x-[2px]'"
    />
  </button>
</template>
