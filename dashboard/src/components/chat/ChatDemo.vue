<template>
  <div class="chat-demo-container">
    <!-- Header -->
    <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold">🎓 UNIACC ChatBot Demo</h3>
          <p class="text-blue-100 text-sm">Tel: {{ currentPhone }}</p>
        </div>
        <div class="flex items-center space-x-2">
          <div v-if="isTimeoutActive" class="flex items-center text-green-300">
            <div class="w-2 h-2 bg-green-300 rounded-full animate-pulse mr-1"></div>
            <span class="text-xs">Polling activo</span>
          </div>
          <button 
            @click="clearChat"
            class="text-white/80 hover:text-white transition-colors"
            title="Limpiar chat"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Messages Area -->
    <div 
      ref="messagesContainer"
      class="h-96 overflow-y-auto p-4 bg-gray-50 space-y-3"
      :class="{ 'opacity-50': isLoading }"
    >
      <TransitionGroup name="message" tag="div">
        <div
          v-for="message in messages"
          :key="message.id"
          class="message-item"
          :class="getMessageClasses(message)"
        >
          <div class="message-content">
            <div class="text-sm whitespace-pre-line">{{ message.content }}</div>
            <div class="text-xs opacity-60 mt-1">
              {{ formatTime(message.timestamp) }}
              <span v-if="message.type === 'user'"> - Tú</span>
              <span v-else-if="message.type === 'bot'"> - ChatBot 🤖</span>
              <span v-else-if="message.isTimeout"> - Sistema ⏰</span>
              <span v-else> - Sistema</span>
            </div>
          </div>
        </div>
      </TransitionGroup>

      <!-- Loading indicator -->
      <div v-if="isLoading" class="flex justify-start">
        <div class="bg-white rounded-lg px-4 py-2 shadow">
          <div class="flex space-x-1">
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Input Area -->
    <div class="bg-white border-t p-4 rounded-b-lg">
      <form @submit.prevent="handleSendMessage" class="space-y-3">
        <div class="flex space-x-2">
          <input
            v-model="inputMessage"
            type="text"
            placeholder="Escribe tu mensaje... (ej: hola)"
            class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            :disabled="isLoading"
          />
          <button
            type="submit"
            :disabled="isLoading || !inputMessage.trim()"
            class="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <span v-if="!isLoading">Enviar</span>
            <span v-else class="flex items-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Enviando...
            </span>
          </button>
        </div>

        <!-- Test Buttons -->
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            @click="handleForceTimeout"
            class="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            :disabled="!currentPhone"
          >
            🧪 Forzar Timeout
          </button>
          <button
            type="button"
            @click="handleTestPolling"
            class="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            :disabled="!currentPhone"
          >
            🔍 Test Polling
          </button>
          <button
            type="button"
            @click="clearChat"
            class="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            🧹 Limpiar
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import { useChatDemo } from '@/composables/useChatDemo'

// Composable
const {
  messages,
  isLoading,
  currentPhone,
  isTimeoutActive,
  sendMessage,
  clearChat,
  forceTimeout,
  testPolling
} = useChatDemo()

// Local state
const inputMessage = ref('')
const messagesContainer = ref<HTMLElement>()

// Methods
const handleSendMessage = async () => {
  if (!inputMessage.value.trim()) return

  const message = inputMessage.value
  inputMessage.value = ''

  await sendMessage(message)
  await scrollToBottom()
}

const handleForceTimeout = async () => {
  try {
    await forceTimeout()
    await scrollToBottom()
  } catch (error) {
    alert('Error forzando timeout: ' + (error as Error).message)
  }
}

const handleTestPolling = async () => {
  try {
    const message = await testPolling()
    if (message) {
      alert(`Mensaje encontrado: ${message.substring(0, 50)}...`)
    } else {
      alert('No hay mensajes pendientes')
    }
  } catch (error) {
    alert('Error en test polling: ' + (error as Error).message)
  }
}

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('es-CL', { 
    hour: '2-digit', 
    minute: '2-digit'
  })
}

const getMessageClasses = (message: any) => {
  const base = 'max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow'
  
  switch (message.type) {
    case 'user':
      return `${base} bg-blue-500 text-white ml-auto`
    case 'bot':
      return `${base} bg-white border border-gray-200`
    case 'system':
      if (message.isTimeout) {
        return `${base} bg-yellow-50 border border-yellow-200 text-yellow-800`
      }
      return `${base} bg-gray-100 border border-gray-200 text-gray-600 text-center mx-auto`
    default:
      return base
  }
}

// Auto-scroll on new messages
watch(() => messages.length, () => {
  scrollToBottom()
})
</script>

<style scoped>
.chat-demo-container {
  @apply border border-gray-200 rounded-lg shadow-lg overflow-hidden;
}

.message-item {
  @apply flex;
}

.message-content {
  @apply flex-1;
}

/* Transitions */
.message-enter-active {
  transition: all 0.3s ease-out;
}

.message-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.message-enter-to {
  opacity: 1;
  transform: translateY(0);
}
</style>
