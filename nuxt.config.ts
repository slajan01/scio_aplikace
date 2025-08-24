// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    '@nuxtjs/supabase'
  ],

  // Explicitně povolíme WebSocket v serverovém enginu Nitro
  nitro: {
    experimental: {
      websocket: true
    }
  },

  // Nastavíme server, aby byl dostupný zvenčí (pro Codespace)
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
      exclude: ['/'],
    }
  },
  devtools: { enabled: true }
})