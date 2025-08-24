<!-- pages/chat/[id].vue -->
<template>
  <div class="h-screen flex flex-col">
    <header class="bg-white shadow-sm p-4 border-b">
      <div v-if="group" class="container mx-auto flex justify-between items-center">
        <div>
          <h1 class="text-xl font-bold">{{ group.name }}</h1>
          <p class="text-sm text-gray-600">Cíl: {{ group.goalDescription }}</p>
        </div>
        <div class="text-right">
          <div class="flex items-center space-x-2 text-sm justify-end">
            <span class="w-3 h-3 rounded-full" :class="connectionStatus.color"></span>
            <span>{{ connectionStatus.text }}</span>
          </div>
          <p v-if="connectionError" class="text-xs text-red-500 mt-1">{{ connectionError }}</p>
        </div>
      </div>
    </header>

    <div class="flex-1 container mx-auto p-4 flex flex-col md:flex-row gap-4 overflow-y-hidden">
      <!-- Levá část - Chat -->
      <div class="flex-1 flex flex-col bg-white rounded-lg shadow">
        <div ref="chatContainer" class="flex-1 p-4 space-y-4 overflow-y-auto">
          <div 
            v-for="(msg, index) in messages" 
            :key="index"
            class="p-3 rounded-lg max-w-lg transition-all text-gray-900"
            :class="[
              msg.isMe ? 'bg-green-100 self-end' : 'bg-gray-100 self-start',
              { 'border-2 border-green-500': msg.isRelevant }
            ]"
          >
            <p class="font-bold text-sm text-gray-700">{{ msg.nickname }}</p>
            <RenderMessage :content="msg.text" />
            <p v-if="msg.feedback" class="text-xs italic text-gray-600 mt-1">{{ msg.feedback }}</p>
          </div>
        </div>
        <div class="p-4 border-t">
          <form @submit.prevent="sendMessage" class="flex items-center gap-2">
            <UInput 
              v-model="newMessage"
              size="xl" 
              placeholder="Napiš nebo namluv zprávu..." 
              :disabled="!isWsOpen"
              :loading="isLoading"
              class="flex-1"
            />
            <UButton
              v-if="isSpeechSupported"
              @click="toggleListening"
              :icon="isListening ? 'i-heroicons-stop-circle' : 'i-heroicons-microphone'"
              :color="isListening ? 'red' : 'primary'"
              size="xl"
              square
              variant="soft"
            />
          </form>
        </div>
      </div>

      <!-- Pravá část - Pokrok (Responzivní) -->
      <div class="w-full md:w-1/3">
        <div class="md:hidden">
          <UAccordion :items="accordionItems">
            <template #default="{ item, open }">
              <UButton color="gray" variant="ghost" class="border rounded-lg w-full">
                <span class="truncate text-lg">Zobrazit můj pokrok</span>
                <template #trailing>
                  <UIcon
                    name="i-heroicons-chevron-down-20-solid"
                    class="w-5 h-5 ms-auto transform transition-transform duration-200"
                    :class="[open && 'rotate-180']"
                  />
                </template>
              </UButton>
            </template>
            <template #item>
              <div class="p-4 bg-white border rounded-lg mt-2">
                <div v-if="progress" class="space-y-4">
                  <UProgress :value="progress.percentage" />
                  <p class="text-sm text-center">{{ progress.current }} / {{ progress.target }} splněno</p>
                </div>
                <p v-else class="text-gray-500">Čekám na první zprávu...</p>
              </div>
            </template>
          </UAccordion>
        </div>
        <div class="hidden md:block bg-white rounded-lg shadow p-4">
          <h2 class="text-lg font-semibold mb-4">Tvůj pokrok</h2>
          <div v-if="progress" class="space-y-4">
            <UProgress :value="progress.percentage" />
            <p class="text-sm text-center">{{ progress.current }} / {{ progress.target }} splněno</p>
          </div>
          <p v-else class="text-gray-500">Čekám na první zprávu...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute();
const groupId = route.params.id;

const { data: group } = useAsyncData(`group-chat-${groupId}`, () => $fetch(`/api/groups/${groupId}`));

const messages = ref([{ text: 'Vítej! Tvým úkolem je splnit cíl popsaný výše. Napiš, jak bys začal/a.', nickname: 'Systém', isMe: false }]);
const newMessage = ref('');
const isWsOpen = ref(false);
const isLoading = ref(true);
const chatContainer = ref(null);
const studentInfo = ref({ nickname: 'Neznámý', deviceId: null });
const connectionError = ref(null);
const progress = ref(null);
const accordionItems = [{ label: 'Pokrok', slot: 'item' }];
let ws = null;
let heartbeatInterval = null;

// --- HLASOVÉ ZADÁVÁNÍ ---
const isListening = ref(false);
const isSpeechSupported = ref(false);
let recognition = null;

onMounted(() => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    isSpeechSupported.value = true;
    recognition = new SpeechRecognition();
    recognition.lang = 'cs-CZ';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      newMessage.value = transcript;
    };

    recognition.onend = () => {
      isListening.value = false;
    };
    
    recognition.onerror = (event) => {
      console.error('Chyba rozpoznávání řeči:', event.error);
      isListening.value = false;
    }
  }
});

const toggleListening = () => {
  if (!recognition) return;
  if (isListening.value) {
    recognition.stop();
  } else {
    recognition.start();
  }
  isListening.value = !isListening.value;
};

const connectionStatus = computed(() => {
  if (isLoading.value) return { text: 'Připojování...', color: 'bg-yellow-400' };
  if (isWsOpen.value) return { text: 'Připojeno', color: 'bg-green-500' };
  return { text: 'Odpojeno', color: 'bg-red-500' };
});

onMounted(() => {
  studentInfo.value.deviceId = localStorage.getItem(`group-device-id:${groupId}`);
  studentInfo.value.nickname = localStorage.getItem(`group-nickname:${groupId}`) || 'Student';

  if (!studentInfo.value.deviceId) return navigateTo(`/join/${groupId}`);

  const host = window.location.host;
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const wsUrl = `${protocol}://${host}/ws/group/${groupId}`;
  
  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    isWsOpen.value = true;
    isLoading.value = false;
    connectionError.value = null;
    heartbeatInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'ping' }));
    }, 25000);
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'pong') return;
    
    if (data.type === 'update') {
      const msg = data.message;
      msg.isMe = msg.deviceId === studentInfo.value.deviceId;
      messages.value.push(msg);
      progress.value = data.progress;
    }

    nextTick(() => {
      chatContainer.value?.scrollTo(0, chatContainer.value.scrollHeight);
    });
  };

  ws.onclose = (event) => {
    isWsOpen.value = false;
    isLoading.value = false;
    clearInterval(heartbeatInterval);
    if (!event.wasClean) connectionError.value = `Spojení uzavřeno s chybou (kód: ${event.code})`;
  };

  ws.onerror = (error) => {
    isWsOpen.value = false;
    isLoading.value = false;
    clearInterval(heartbeatInterval);
    connectionError.value = 'Chyba připojení k WebSocketu.';
    console.error('WebSocket chyba:', error);
  };
});

onUnmounted(() => {
  clearInterval(heartbeatInterval);
  if (recognition) recognition.stop();
  if (ws) ws.close();
});

const sendMessage = () => {
  if (!newMessage.value.trim() || !ws || !isWsOpen.value) return;
  const messagePayload = {
    type: 'chat_message',
    text: newMessage.value,
    nickname: studentInfo.value.nickname,
    deviceId: studentInfo.value.deviceId,
  };
  ws.send(JSON.stringify(messagePayload));
  newMessage.value = '';
};
</script>

<style>
.flex-1.p-4.space-y-4.overflow-y-auto {
  display: flex;
  flex-direction: column;
}
</style>
