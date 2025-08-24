<!-- pages/join/index.vue -->
<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <UCard class="max-w-md text-center">
      <template #header>
        <div class="flex justify-center">
          <UIcon name="i-heroicons-qr-code" class="text-4xl text-gray-400" />
        </div>
      </template>

      <h1 class="text-2xl font-bold mb-4">Vstup do skupiny</h1>
      <p class="text-gray-600">
        Pro vstup do konkrétní skupiny prosím použijte unikátní odkaz nebo naskenujte QR kód, který vám poskytl váš učitel.
      </p>
      
      <UButton to="/" label="Zpět na hlavní stránku" variant="link" class="mt-6" />
    </UCard>
  </div>
</template>

<script setup>
useHead({
  title: 'Vstup do skupiny',
})
</script>
