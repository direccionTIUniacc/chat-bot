<template>
  <header class="bg-white shadow-sm border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo y navegación -->
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <h1 class="text-xl font-bold text-gradient">
              Dashboard
            </h1>
          </div>
        </div>

        <!-- Navegación principal -->
        <nav class="hidden md:flex space-x-8">
          <router-link
            v-for="item in navigationItems"
            :key="item.name"
            :to="item.href"
            :class="[
              'px-3 py-2 rounded-md text-sm font-medium transition-colors',
              $route.path === item.href
                ? 'bg-uniacc-primary text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            ]"
          >
            <component :is="item.icon" class="w-4 h-4 inline mr-2" />
            {{ item.name }}
          </router-link>
        </nav>

        <!-- Acciones del usuario -->
        <div class="flex items-center space-x-4">
          <!-- Notificaciones de Chat -->
          <NotificacionesChat />

          <!-- Notificaciones generales -->
          <button
            class="p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-uniacc-primary focus:ring-offset-2 rounded-md"
          >
            <Bell class="w-5 h-5" />
          </button>

          <!-- Configuración -->
          <button
            class="p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-uniacc-primary focus:ring-offset-2 rounded-md"
          >
            <Settings class="w-5 h-5" />
          </button>

          <!-- Menú móvil -->
          <button
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="md:hidden p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-uniacc-primary focus:ring-offset-2 rounded-md"
          >
            <Menu class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Menú móvil -->
    <div v-if="mobileMenuOpen" class="md:hidden">
      <div class="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
        <router-link
          v-for="item in navigationItems"
          :key="item.name"
          :to="item.href"
          @click="mobileMenuOpen = false"
          :class="[
            'block px-3 py-2 rounded-md text-base font-medium',
            $route.path === item.href
              ? 'bg-uniacc-primary text-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          ]"
        >
          <component :is="item.icon" class="w-4 h-4 inline mr-2" />
          {{ item.name }}
        </router-link>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Home, Users, BarChart3, MessageSquare, UserCheck, Zap, Globe, Bell, Settings, Menu, TrendingUp } from 'lucide-vue-next'
import NotificacionesChat from '@/components/chat/NotificacionesChat.vue'

const mobileMenuOpen = ref(false)

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Prospectos', href: '/prospectos', icon: Users },
  { name: 'Progressive Capture', href: '/progressive-capture', icon: TrendingUp },
  { name: 'Conversaciones', href: '/conversaciones', icon: MessageSquare },
  { name: 'Ejecutivos', href: '/ejecutivos', icon: UserCheck },
  { name: 'Fuentes', href: '/fuentes', icon: Globe },
  { name: 'Automatizaciones', href: '/automatizaciones', icon: Zap },
  { name: 'Métricas', href: '/metricas', icon: BarChart3 }
]
</script>
