<script setup lang="ts">
defineProps<{ title?: string; description?: string }>();
</script>

<template>
  <div class="flex items-center gap-4 px-4 py-3">
    <div v-if="$slots.leading" class="shrink-0">
      <slot name="leading" />
    </div>
    <div class="min-w-0 flex-1">
      <slot name="title">
        <p
          v-if="title"
          class="text-sm font-medium text-gray-900 dark:text-neutral-100 truncate"
        >
          {{ title }}
        </p>
      </slot>
      <p
        v-if="description"
        class="text-xs text-gray-500 dark:text-neutral-400 mt-0.5 leading-relaxed"
      >
        {{ description }}
      </p>
      <slot name="description" />
    </div>
    <div v-if="$slots.default" class="shrink-0 flex items-center gap-2">
      <slot />
    </div>
  </div>
</template>
