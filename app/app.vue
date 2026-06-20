<template>
  <div>
    <NuxtRouteAnnouncer />
    <nav class="bg-gray-800 text-white p-4">
      <div class="container mx-auto flex items-center justify-between">
        <h1 class="text-xl font-bold">Nuxt Tauri</h1>

        <div class="space-x-4">
          <NuxtLink to="/" class="hover:text-gray-300">Home</NuxtLink>
          <NuxtLink to="/demo" class="hover:text-gray-300">
            Storage Demo
          </NuxtLink>
          <NuxtLink to="/notifications" class="hover:text-gray-300">
            Notifications
          </NuxtLink>
          <NuxtLink to="/window" class="hover:text-gray-300">
            Window
          </NuxtLink>
          <NuxtLink to="/filesystem" class="hover:text-gray-300">
            Files
          </NuxtLink>
        </div>
      </div>
    </nav>
    <NuxtPage />
  </div>
</template>

<style>
body {
  margin: 0;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
    Arial, sans-serif;
}
</style>
