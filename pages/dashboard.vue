<!-- pages/dashboard.vue -->
<template>
  <div class="min-h-screen bg-gray-100">
    <header class="bg-white shadow-sm">
      <nav class="container mx-auto px-4 py-3 flex justify-between items-center">
        <h1 class="text-xl font-bold">Nástěnka učitele</h1>
        <div v-if="user" class="flex items-center space-x-4">
          <span class="text-sm text-gray-600">{{ user.email }}</span>
          <UButton 
            @click="signOut" 
            label="Odhlásit se" 
            variant="soft" 
            color="red" 
          />
        </div>
      </nav>
    </header>

    <main class="container mx-auto p-4 mt-6">
      <div class="bg-white p-6 rounded-lg shadow">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold">Moje skupiny</h2>
          <UButton 
            label="Vytvořit novou skupinu" 
            icon="i-heroicons-plus"
            @click="isModalOpen = true" 
          />
        </div>
        
        <div v-if="pending">Načítání skupin...</div>
        <div v-else-if="error">Chyba při načítání skupin: {{ error.message }}</div>
        <UTable v-else-if="groups && groups.length" :rows="groups" :columns="columns">
          <!-- Změnili jsme tlačítko zde -->
          <template #actions-data="{ row }">
            <UButton 
              :to="`/group/${row.id}`"
              icon="i-heroicons-arrow-top-right-on-square" 
              size="sm" 
              color="primary" 
              variant="soft"
              label="Otevřít nástěnku"
            />
          </template>
        </UTable>
        <p v-else class="text-gray-500">Zatím nemáte vytvořené žádné skupiny.</p>

      </div>
    </main>

    <!-- Modální okno pro vytvoření skupiny -->
    <UModal v-model="isModalOpen">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Nová skupina</h3>
        </template>

        <UForm :state="state" @submit="handleCreateGroup" class="space-y-4">
          <UFormGroup label="Název skupiny" name="name">
            <UInput v-model="state.name" placeholder="Např. A2 - Kvadratické rovnice" />
          </UFormGroup>

          <UFormGroup label="Popis cíle" name="goalDescription">
            <UTextarea v-model="state.goalDescription" placeholder="Např. Vyřeší 3 rovnice..." />
          </UFormGroup>

          <UButton type="submit" label="Vytvořit" :loading="isLoading" block />
        </UForm>
      </UCard>
    </UModal>
  </div>
</template>

<script setup>
// Ochrana stránky
definePageMeta({
  middleware: ['auth']
})

const user = useSupabaseUser();
const supabase = useSupabaseClient();
const toast = useToast();

const { data: groups, pending, error, refresh } = await useAsyncData('groups', () => $fetch('/api/groups'));

// Definice sloupců pro tabulku
const columns = [
  { key: 'name', label: 'Název skupiny' },
  { key: 'goalDescription', label: 'Cíl' },
  { key: 'actions', label: 'Akce' }
];

const isModalOpen = ref(false);
const isLoading = ref(false);
const state = ref({
  name: '',
  goalDescription: ''
});

const handleCreateGroup = async () => {
  isLoading.value = true;
  try {
    await $fetch('/api/groups/create', {
      method: 'POST',
      body: state.value
    });
    
    toast.add({ title: 'Skupina úspěšně vytvořena!', color: 'green' });
    isModalOpen.value = false;
    state.value = { name: '', goalDescription: '' };
    
    await refresh();

  } catch (err) {
    toast.add({ title: 'Chyba při vytváření skupiny', description: err.data?.message || 'Zkuste to prosím znovu.', color: 'red' });
  } finally {
    isLoading.value = false;
  }
};

const signOut = async () => {
  await supabase.auth.signOut();
  navigateTo('/login');
};
</script>