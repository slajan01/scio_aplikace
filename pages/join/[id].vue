<!-- pages/join/[id].vue -->
<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div v-if="pending">Načítání informací o skupině...</div>
    <div v-else-if="error" class="text-red-500 text-center">
      <h1 class="text-2xl font-bold">Chyba</h1>
      <p>Tato skupina neexistuje nebo byla smazána.</p>
    </div>
    <UCard v-else-if="group" class="w-full max-w-md">
      <template #header>
        <h3 class="text-lg font-semibold text-center">Vstup do skupiny</h3>
      </template>

      <div class="text-center mb-4">
        <p class="font-bold text-xl">{{ group.name }}</p>
        <p class="text-sm text-gray-600">Cíl: {{ group.goalDescription }}</p>
      </div>

      <UForm :state="state" @submit="joinGroup" class="space-y-4">
        <UFormGroup label="Tvoje přezdívka" name="nickname">
          <UInput v-model="state.nickname" placeholder="Např. Honza Novák" size="xl" />
        </UFormGroup>

        <UButton 
          type="submit" 
          label="Vstoupit do skupiny" 
          :loading="isLoading" 
          block 
          size="xl"
        />
      </UForm>
    </UCard>
  </div>
</template>

<script setup>
const route = useRoute();
const toast = useToast();
const groupId = route.params.id;

const { data: group, pending, error } = useAsyncData(
  `group-join-${groupId}`,
  () => $fetch(`/api/groups/${groupId}`)
);

const state = ref({ nickname: '' });
const isLoading = ref(false);

onMounted(() => {
  const deviceIdentifier = localStorage.getItem(`group-device-id:${groupId}`);
  if (deviceIdentifier) {
    toast.add({ title: 'Už jsi ve skupině!', description: 'Přesměrovávám tě do chatu.', color: 'blue' });
    navigateTo(`/chat/${groupId}`);
  }
});

const joinGroup = async () => {
  const nickname = state.value.nickname.trim();
  if (!nickname) {
    toast.add({ title: 'Zadej prosím přezdívku', color: 'orange' });
    return;
  }
  isLoading.value = true;
  
  const deviceIdentifier = crypto.randomUUID();

  try {
    await $fetch('/api/students/join', {
      method: 'POST',
      body: { groupId, nickname, deviceIdentifier },
    });

    // Uložíme si obě potřebné informace
    localStorage.setItem(`group-device-id:${groupId}`, deviceIdentifier);
    localStorage.setItem(`group-nickname:${groupId}`, nickname);
    
    toast.add({ title: `Vítej, ${nickname}!`, color: 'green' });
    navigateTo(`/chat/${groupId}`);

  } catch (err) {
    toast.add({ title: 'Chyba při připojování', description: err.data?.message, color: 'red' });
  } finally {
    isLoading.value = false;
  }
};
</script>