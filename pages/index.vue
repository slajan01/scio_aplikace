<!-- pages/index.vue -->
<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
    <div class="text-center bg-white/60 backdrop-blur-sm p-8 md:p-12 rounded-2xl shadow-lg max-w-2xl">
      <h1 class="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
        Vítejte v aplikaci SCIO
      </h1>
      <p class="text-lg text-gray-600 mb-8">
        Interaktivní nástroj pro učitele a studenty, který umožňuje sledovat plnění cílů v reálném čase s pomocí umělé inteligence.
      </p>
      <div class="flex flex-col sm:flex-row justify-center gap-4">
        <UButton 
          to="/login"
          label="Přihlásit se jako učitel"
          size="xl"
          icon="i-heroicons-user"
          class="transform hover:scale-105 transition-transform"
        />
        <UButton 
          to="/join"
          label="Vstoupit do skupiny jako student"
          size="xl"
          icon="i-heroicons-qr-code"
          variant="soft"
          class="transform hover:scale-105 transition-transform"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
// Tento skript může zůstat prázdný, protože veškerá logika je v šabloně.
// Můžeme sem případně přidat SEO metadata.
useHead({
  title: 'Sledování pokroku | Vítejte',
  meta: [
    { name: 'description', content: 'Aplikace pro real-time sledování pokroku studentů s pomocí AI.' }
  ]
})
</script>
