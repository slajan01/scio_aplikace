<!-- pages/chat/[id].vue -->
<template>
  <div class="h-screen flex flex-col">
    <!-- Hlavička -->
    <header class="bg-white shadow-sm p-4 border-b">
      <div v-if="group" class="container mx-auto flex justify-between items-center">
        <div>
          <h1 class="text-xl font-bold">{{ group.name }}</h1>
          <p class="text-sm text-gray-600">Cíl: {{ group.goalDescription }}</p>
        </div>
        <!-- Indikátor stavu připojení -->
        <div class="flex items-center space-x-2 text-sm">
          <span
            class="w-3 h-3 rounded-full"
            :class="connectionStatus.color"
          ></span>
          <span class="text-gray-700">{{ connectionStatus.text }}</span>
        </div>
      </div>
    </header>

    <!-- Hlavní obsah -->
    <div class="flex-1 container mx-auto p-4 flex flex-col md:flex-row gap-4 overflow-y-hidden">
      <!-- Levá část - Chat -->
      <div class="flex-1 flex flex-col bg-white rounded-lg shadow">
        <div ref="chatContainer" class="flex-1 p-4 space-y-4 overflow-y-auto">
          <!-- Zprávy chatu -->
          <div
            v-for="(msg, index) in messages"
            :key="index"
            class="p-3 rounded-lg max-w-xs text-gray-900"
            :class="[
              msg.isMe ? 'bg-green-100 self-end' : 'bg-gray-100 self-start',
              msg.isRelevant && 'ring-2 ring-green-500'
            ]"
          >
            <p class="font-bold text-sm text-gray-700">{{ msg.nickname }}</p>
            <RenderMessage :content="msg.text" />
            <RenderMessage v-if="msg.feedback" :content="msg.feedback" class="text-xs italic text-blue-600 mt-1 border-t pt-1" />
          </div>
        </div>
        <!-- Input pro psaní zpráv -->
        <div class="p-4 border-t flex items-center gap-2">
          <UInput
            v-model="newMessage"
            @keyup.enter="sendMessage"
            size="xl"
            placeholder="Napiš nebo namluv zprávu..."
            class="flex-1"
            :disabled="!isSubscribed"
          />
          <UButton
            @click="toggleRecording"
            :icon="isRecording ? 'i-heroicons-stop-circle' : 'i-heroicons-microphone'"
            :color="isRecording ? 'red' : 'primary'"
            size="xl"
            square
            variant="soft"
          />
        </div>
      </div>

      <!-- Pravá část - Pokrok (RESPONZIVNÍ) -->
      <div class="w-full md:w-1/3">
        <!-- Mobilní verze: Rozbalovací harmonika -->
        <div class="md:hidden">
          <UAccordion :items="accordionItems">
            <template #default="{ open }">
              <UButton color="gray" variant="ghost" class="border rounded-lg w-full">
                <span class="truncate text-lg">Zobrazit můj pokrok</span>
                <template #trailing>
                  <UIcon name="i-heroicons-chevron-down-20-solid" class="w-5 h-5 ms-auto transform transition-transform duration-200" :class="[open && 'rotate-180']"/>
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
        <!-- Desktopová verze: Pevný panel -->
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
const supabase = useSupabaseClient();
const groupId = route.params.id;

const messages = ref([]);
const newMessage = ref('');
const progress = ref(null);
const isSubscribed = ref(false);
const chatContainer = ref(null);
const studentInfo = ref({ nickname: 'Neznámý', deviceId: null, studentId: null });

// Pro harmoniku
const accordionItems = [{ label: 'Pokrok', slot: 'item' }];

const connectionStatus = computed(() => {
  if (isSubscribed.value) return { text: 'Připojeno', color: 'bg-green-500' };
  return { text: 'Připojování...', color: 'bg-yellow-400' };
});

// Načtení počátečních dat
const { data: group } = useAsyncData(`group-chat-${groupId}`, () => $fetch(`/api/groups/${groupId}`));
// API pro načtení historie chatu a aktuálního pokroku studenta
const { data: initialData, refresh: refreshInitialData } = useAsyncData(`chat-initial-${groupId}`, async () => {
  const deviceId = localStorage.getItem(`group-device-id:${groupId}`);
  if (!deviceId) return null;
  return $fetch(`/api/groups/${groupId}/chat-init?deviceId=${deviceId}`);
});


watch(initialData, (data) => {
  if (data) {
    messages.value = data.messages.map(m => ({
      ...m,
      isMe: m.student?.deviceIdentifier === studentInfo.value.deviceId,
      nickname: m.student?.nickname || 'Systém',
      text: m.content,
      feedback: m.feedback,
      isRelevant: m.isRelevant
    }));
    progress.value = data.progress;
    studentInfo.value.studentId = data.studentId;
  }
}, { immediate: true });


let channel = null;

onMounted(() => {
  studentInfo.value.deviceId = localStorage.getItem(`group-device-id:${groupId}`);
  studentInfo.value.nickname = localStorage.getItem(`group-nickname:${groupId}`) || 'Student';
  if (!studentInfo.value.deviceId) {
    return navigateTo(`/join/${groupId}`);
  }

  // Vytvoření kanálu specifického pro skupinu
  channel = supabase.channel(`group-${groupId}`);

  channel
    .on('broadcast', { event: 'new_message' }, (payload) => {
        const newMessageData = payload.payload;
        messages.value.push({
          ...newMessageData.message,
          isMe: newMessageData.student.deviceIdentifier === studentInfo.value.deviceId,
          nickname: newMessageData.student.nickname,
          text: newMessageData.message.content
        });
    })
    .on('broadcast', { event: 'progress_update' }, (payload) => {
        const updateData = payload.payload;
        // Aktualizujeme progress bar jen pro správného studenta
        if (updateData.student.deviceIdentifier === studentInfo.value.deviceId) {
           progress.value = updateData.progress;
        }
    })
    .subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        isSubscribed.value = true;
        console.log('Úspěšně přihlášen k Supabase Realtime kanálu!');
      }
      if (status === 'CHANNEL_ERROR') {
        console.error('Chyba připojení k Supabase kanálu:', err);
      }
    });

  // Po načtení se posuneme na konec chatu
  setTimeout(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  }, 100);
});

onUnmounted(() => {
  if (channel) {
    supabase.removeChannel(channel);
  }
});

const sendMessage = async () => {
  if (!newMessage.value.trim()) return;

  const tempMessage = newMessage.value;
  newMessage.value = '';

  await $fetch('/api/messages/create', {
    method: 'POST',
    body: {
      groupId: groupId,
      text: tempMessage,
      deviceId: studentInfo.value.deviceId
    }
  });
};

// --- LOGIKA PRO HLASOVÉ ZADÁVÁNÍ ---
const isRecording = ref(false);
let recognition = null;

onMounted(() => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true; // Umožní delší promluvy
    recognition.lang = 'cs-CZ';
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      newMessage.value = finalTranscript + interimTranscript;
    };
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      stopRecording();
    };
    recognition.onend = () => {
      if (isRecording.value) {
        recognition.start(); // Automatický restart poslechu
      }
    };
  }
});

const startRecording = () => {
  if (recognition && !isRecording.value) {
    newMessage.value = '';
    isRecording.value = true;
    recognition.start();
  }
};
const stopRecording = () => {
  if (recognition && isRecording.value) {
    isRecording.value = false;
    recognition.stop();
  }
};
const toggleRecording = () => {
  if (isRecording.value) {
    stopRecording();
  } else {
    startRecording();
  }
};
</script>

<style>
/* Zajistíme, aby se zprávy v chatu řadily správně */
.flex-1.p-4.space-y-4.overflow-y-auto {
  display: flex;
  flex-direction: column;
}
</style>
