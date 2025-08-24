// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    '@nuxtjs/supabase'
  ],

  nitro: {
    experimental: {
      websocket: true
    }
  },

  devServer: {
    host: '0.0.0.0',
    port: 3000
  },

  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY,
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      // TOTO POLE JSME UPRAVILI
      exclude: ['/', '/join', '/join/*'], // Povolíme přístup na úvodní stránku a všechny stránky začínající na /join
    }
  },
  devtools: { enabled: true }
})