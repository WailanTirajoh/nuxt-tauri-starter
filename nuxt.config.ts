// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  // ssr: false,
  app: {
    head: {
      // viewport-fit=cover exposes env(safe-area-inset-*) so the UI can avoid
      // the mobile status bar / navigation bar (notches, Android system bars).
      meta: [
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1, viewport-fit=cover",
        },
      ],
    },
  },
  css: ["~/assets/css/main.css"],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  vite: {
    // Better support for Tauri CLI output
    clearScreen: false,
    // Enable environment variables
    // Additional environment variables can be found at
    // https://v2.tauri.app/reference/environment-variables/
    envPrefix: ["VITE_", "TAURI_"],
    server: {
      // Tauri requires a consistent port
      strictPort: true,
    },
    optimizeDeps: {
      include: ["@tauri-apps/plugin-dialog"],
    },
  },

  modules: ["@pinia/nuxt", "@pinia/colada-nuxt", "@vueuse/nuxt"],
});
