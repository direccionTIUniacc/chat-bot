<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <Header />
    
    <!-- Contenido principal -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <router-view />
    </main>
    
    <!-- Footer opcional -->
    <footer class="bg-white border-t border-gray-200 mt-auto">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <p class="text-center text-sm text-gray-500">
          © {{ currentYear }} UNIACC. Dashboard del ChatBot.
        </p>
      </div>
    </footer>
    
    <!-- Notificaciones en tiempo real -->
    <NotificacionesTiempoReal />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Header from './Header.vue'
import NotificacionesTiempoReal from '@/components/chat/NotificacionesTiempoReal.vue'

const currentYear = computed(() => new Date().getFullYear())
</script>
