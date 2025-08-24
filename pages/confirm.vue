<!-- pages/confirm.vue -->
<template>
  <div class="flex items-center justify-center min-h-screen">
    <p>Moment, probíhá přihlašování...</p>
  </div>
</template>

<script setup>
const user = useSupabaseUser();

watch(user, () => {
  if (user.value) {
    // Jakmile je uživatel přihlášen, přesměrujeme ho na nástěnku
    return navigateTo('/dashboard');
  }
}, { immediate: true });
</script>