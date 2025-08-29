<template>
  <div class="chat-demo-view">
    <!-- Header -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">💬 Chat Demo - Sistema de Timeout</h1>
          <p class="text-gray-600 mt-1">
            Demo interactivo del ChatBot UNIACC con sistema de timeout automático
          </p>
        </div>
        <div class="flex items-center space-x-3">
          <div class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            🔄 Progressive Capture
          </div>
          <div class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            ⏰ Timeout System
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Chat Demo - Main Column -->
      <div class="lg:col-span-2">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
          <ChatDemo />
        </div>
      </div>

      <!-- Sidebar - Info & Stats -->
      <div class="space-y-6">
        <!-- Información del Sistema -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">ℹ️ Información del Sistema</h3>
          
          <div class="space-y-4">
            <div class="flex justify-between">
              <span class="text-gray-600">Warning Timeout:</span>
              <span class="font-medium">90 segundos</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Final Timeout:</span>
              <span class="font-medium">120 segundos</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Polling Interval:</span>
              <span class="font-medium">3 segundos</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">ChatBot Backend:</span>
              <span class="font-medium text-green-600">{{ chatbotUrl }}</span>
            </div>
          </div>
        </div>

        <!-- Guía de Testing -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">🧪 Guía de Testing</h3>
          
          <div class="space-y-3 text-sm">
            <div class="p-3 bg-blue-50 rounded-lg">
              <div class="font-medium text-blue-900">1. Testing Automático (2 min)</div>
              <div class="text-blue-700 mt-1">
                • Escribe "hola"<br>
                • Escribe tu nombre<br>
                • Espera 90s → Warning<br>
                • Espera 30s más → Timeout final
              </div>
            </div>
            
            <div class="p-3 bg-green-50 rounded-lg">
              <div class="font-medium text-green-900">2. Testing Rápido</div>
              <div class="text-green-700 mt-1">
                • Escribe "hola" y tu nombre<br>
                • Clic "🧪 Forzar Timeout"<br>
                • Ver mensaje inmediato
              </div>
            </div>
            
            <div class="p-3 bg-purple-50 rounded-lg">
              <div class="font-medium text-purple-900">3. Test Polling</div>
              <div class="text-purple-700 mt-1">
                • Clic "🔍 Test Polling"<br>
                • Verificar endpoint manual
              </div>
            </div>
          </div>
        </div>

        <!-- Progressive Capture Info -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">📊 Progressive Capture</h3>
          
          <div class="space-y-2 text-sm">
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>captura en proceso</span>
            </div>
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span>abandono solo nombre</span>
            </div>
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>abandono con email</span>
            </div>
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>abandono con edad</span>
            </div>
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>abandono con región</span>
            </div>
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>captura completa</span>
            </div>
          </div>
        </div>

        <!-- Enlaces Rápidos -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">🔗 Enlaces Rápidos</h3>
          
          <div class="space-y-2">
            <a 
              :href="chatbotUrl + '/health'" 
              target="_blank"
              class="block text-blue-600 hover:text-blue-800 text-sm"
            >
              🏥 Health Check Backend
            </a>
            <a 
              :href="chatbotUrl + '/stats'" 
              target="_blank"
              class="block text-blue-600 hover:text-blue-800 text-sm"
            >
              📊 Stats del ChatBot
            </a>
            <router-link 
              to="/prospectos"
              class="block text-blue-600 hover:text-blue-800 text-sm"
            >
              👥 Ver Prospectos Guardados
            </router-link>
            <router-link 
              to="/conversaciones"
              class="block text-blue-600 hover:text-blue-800 text-sm"
            >
              💬 Ver Conversaciones
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ChatDemo from '@/components/chat/ChatDemo.vue'

// Configuration
const chatbotUrl = computed(() => {
  return import.meta.env.VITE_CHATBOT_URL || 'http://localhost:3001'
})
</script>

<style scoped>
.chat-demo-view {
  @apply p-6 bg-gray-50 min-h-screen;
}
</style>
