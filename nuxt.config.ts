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
      exclude: ['/', '/join', '/join/*'],
    }
  },
  
  devtools: { enabled: true }
})