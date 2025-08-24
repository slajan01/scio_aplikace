<!-- pages/login.vue -->
<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-50">
    <div class="p-8 bg-white rounded-lg shadow-md w-full max-w-sm text-center">
      <h1 class="text-2xl font-bold mb-6">Přihlášení pro učitele</h1>
      <UButton 
        @click="signInWithGoogle" 
        label="Přihlásit se přes Google" 
        size="xl"
        icon="i-logos-google-icon"
        block
      />
    </div>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient();
const user = useSupabaseUser();

const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/confirm` // Důležité pro přesměrování po přihlášení
    }
  });
  if (error) {
    console.error('Chyba při přihlašování:', error.message);
  }
};

// Pokud je uživatel už přihlášen, přesměruj ho na nástěnku
watchEffect(() => {
  if (user.value) {
    navigateTo('/dashboard'); // Tuto stránku vytvoříme příště
  }
});
</script>