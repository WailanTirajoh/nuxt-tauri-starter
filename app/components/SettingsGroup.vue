<script setup lang="ts">
defineProps<{ title?: string; footer?: string }>();
</script>

<template>
  <section class="mb-6">
    <h2
      v-if="title"
      class="px-4 mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-neutral-500"
    >
      {{ title }}
    </h2>
    <div
      class="rounded-xl bg-white dark:bg-neutral-800/80 ring-1 ring-black/5 dark:ring-white/10 divide-y divide-gray-100 dark:divide-white/5 overflow-hidden"
    >
      <slot />
    </div>
    <p
      v-if="footer"
      class="px-4 mt-2 text-xs text-gray-500 dark:text-neutral-500 leading-relaxed"
    >
      {{ footer }}
    </p>
  </section>
</template>
