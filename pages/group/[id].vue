<!-- pages/group/[id].vue -->
<template>
  <div class="min-h-screen bg-gray-50 p-4 md:p-8">
    <div v-if="pendingGroup">Načítání...</div>
    <div v-else-if="!group">Chyba: Skupina nenalezena.</div>
    
    <!-- Pohled pro UČITELE -->
    <div v-else-if="isOwner">
      <div class="container mx-auto">
        <header class="mb-6 flex justify-between items-start">
          <div>
            <h1 class="text-3xl font-bold">{{ group.name }}</h1>
            <p class="text-gray-600">{{ group.goalDescription }}</p>
            <div class="flex items-center space-x-2 text-sm mt-2">
              <span class="w-3 h-3 rounded-full" :class="connectionStatus.color"></span>
              <span>{{ connectionStatus.text }}</span>
            </div>
          </div>
          <UButton 
            label="Pozvat studenty" 
            icon="i-heroicons-qr-code"
            @click="isQrModalOpen = true"
          />
        </header>

        <div v-if="pendingStudents">Načítání studentů...</div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <UCard 
            v-for="student in studentsList" 
            :key="student.id" 
            @click="toggleStudentDetails(student)"
            :ui="{ body: { padding: 'px-4 py-2 sm:p-3' } }"
            class="cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
          >
            <template #header>
              <div class="flex justify-between items-center">
                <h3 class="font-semibold">{{ student.nickname }}</h3>
                <UBadge v-if="student.needsHelp" color="red" variant="soft">Potřebuje pomoc</UBadge>
              </div>
            </template>
            
            <div class="space-y-2">
              <UProgress :value="student.percentage" />
              <p class="text-xs text-center text-gray-500">{{ student.progress }} / {{ student.target }} splněno</p>
            </div>

            <div v-if="expandedStudentId === student.id" class="mt-4 pt-3 border-t">
              <div v-if="isLoadingMessages" class="text-center text-sm">Načítání zpráv...</div>
              <ul v-else-if="student.messages && student.messages.length" class="space-y-2 text-sm">
                <li v-for="(msg, index) in student.messages" :key="index" class="bg-gray-100 p-2 rounded">
                  <!-- Používáme novou komponentu pro zobrazení zprávy -->
                  <RenderMessage :content="msg.content" />
                </li>
              </ul>
              <p v-else class="text-center text-sm text-gray-500">Žádné relevantní zprávy.</p>
            </div>
          </UCard>
        </div>
        <UButton label="Zpět na nástěnku" to="/dashboard" variant="link" class="mt-8" />
      </div>

      <!-- MODÁLNÍ OKNO S QR KÓDEM PRO UČITELE -->
      <UModal v-model="isQrModalOpen">
        <div class="p-8 text-center">
          <h2 class="text-xl font-bold mb-4">Připojení pro studenty</h2>
          <div class="flex justify-center mb-4">
            <ClientOnly>
              <vue-qrcode v-if="joinUrl" :value="joinUrl" :options="{ width: 250, margin: 2 }" tag="svg" />
            </ClientOnly>
          </div>
          <p class="text-sm text-gray-500 mb-4">Naskenujte kód nebo zkopírujte odkaz</p>
          <UInput :value="joinUrl" readonly icon="i-heroicons-link" />
        </div>
      </UModal>
    </div>

    <!-- Pohled pro ostatní -->
    <div v-else class="flex flex-col items-center">
       <div class="bg-white p-8 rounded-xl shadow-lg text-center w-full max-w-md">
        <h1 class="text-2xl font-bold mb-2">{{ group.name }}</h1>
        <p class="text-gray-600 mb-6">{{ group.goalDescription }}</p>
        <p class="my-8">Pro zobrazení QR kódu se prosím přihlaste jako vlastník skupiny.</p>
        <UButton label="Na přihlášení" to="/login" />
      </div>
    </div>
  </div>
</template>

<script setup>
import VueQrcode from 'vue-qrcode';

definePageMeta({ middleware: ['auth'] });

const route = useRoute();
const user = useSupabaseUser();
const groupId = route.params.id;

// --- NAČTENÍ DAT ---
const { data: group, pending: pendingGroup } = useAsyncData(`group-${groupId}`, () => $fetch(`/api/groups/${groupId}`));
const { data: studentsList, pending: pendingStudents } = useAsyncData(`dashboard-${groupId}`, () => $fetch(`/api/groups/${groupId}/dashboard`));

// --- ZOBRAZENÍ DETAILU STUDENTA ---
const expandedStudentId = ref(null);
const isLoadingMessages = ref(false);

const toggleStudentDetails = async (student) => {
  if (expandedStudentId.value === student.id) {
    expandedStudentId.value = null;
    return;
  }

  isLoadingMessages.value = true;
  expandedStudentId.value = student.id;

  if (!student.messages) {
    try {
      const messages = await $fetch(`/api/students/${student.id}/messages`);
      student.messages = messages;
    } catch (e) {
      console.error("Chyba při načítání zpráv studenta:", e);
      student.messages = [];
    }
  }
  isLoadingMessages.value = false;
};

// --- ZJIŠTĚNÍ ROLE ---
const isOwner = computed(() => user.value && group.value && user.value.id === group.value.ownerId);

// --- LOGIKA PRO QR KÓD ---
const isQrModalOpen = ref(false);
const joinUrl = computed(() => (typeof window !== 'undefined') ? `${window.location.origin}/join/${groupId}` : '');

// --- LOGIKA PRO WEBSOCKET (POUZE PRO UČITELE) ---
const connectionStatus = ref({ text: 'Připojování...', color: 'bg-yellow-400' });
let ws = null;

onMounted(() => {
  if (isOwner.value) {
    const host = window.location.host;
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = `${protocol}://${host}/ws/group/${groupId}`;
    ws = new WebSocket(wsUrl);

    ws.onopen = () => connectionStatus.value = { text: 'Připojeno živě', color: 'bg-green-500' };
    ws.onclose = () => connectionStatus.value = { text: 'Odpojeno', color: 'bg-red-500' };
    ws.onerror = () => connectionStatus.value = { text: 'Chyba spojení', color: 'bg-red-500' };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'update' && studentsList.value) {
        const studentToUpdate = studentsList.value.find(s => s.id === data.student.id);
        if (studentToUpdate) {
          studentToUpdate.progress = data.progress.current;
          studentToUpdate.percentage = data.progress.percentage;
          studentToUpdate.needsHelp = data.needsHelp;
          
          if (expandedStudentId.value === studentToUpdate.id) {
            studentToUpdate.messages = null;
            toggleStudentDetails(studentToUpdate);
          }
        }
      }
    };
  }
});

onUnmounted(() => {
  if (ws) ws.close();
});
</script>