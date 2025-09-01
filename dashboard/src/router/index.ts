import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: {
      title: 'Dashboard - UNIACC ChatBot'
    }
  },
  {
    path: '/prospectos',
    name: 'Prospectos',
    component: () => import('@/views/ProspectosView.vue'),
    meta: {
      title: 'Prospectos - UNIACC ChatBot'
    }
  },
  {
    path: '/progressive-capture',
    name: 'ProgressiveCapture',
    component: () => import('@/components/prospectos/ProgressiveCaptureView.vue'),
    meta: {
      title: 'Progressive Capture - UNIACC ChatBot'
    }
  },
  {
    path: '/metricas',
    name: 'Metricas',
    component: () => import('@/views/MetricasView.vue'),
    meta: {
      title: 'Métricas - UNIACC ChatBot'
    }
  },
  {
    path: '/conversaciones',
    name: 'Conversaciones',
    component: () => import('@/views/ConversacionesView.vue'),
    meta: {
      title: 'Conversaciones - UNIACC ChatBot'
    }
  },
  {
    path: '/ejecutivos',
    name: 'Ejecutivos',
    component: () => import('@/views/EjecutivosView.vue'),
    meta: {
      title: 'Ejecutivos - UNIACC ChatBot'
    }
  },
  {
    path: '/automatizaciones',
    name: 'Automatizaciones',
    component: () => import('@/views/AutomatizacionesView.vue'),
    meta: {
      title: 'Automatizaciones - UNIACC ChatBot'
    }
  },
  {
    path: '/fuentes',
    name: 'Fuentes',
    component: () => import('@/views/FuentesView.vue'),
    meta: {
      title: 'Fuentes de Leads - UNIACC ChatBot'
    }
  },
  {
    path: '/chat-demo',
    name: 'ChatDemo',
    component: () => import('@/views/ChatDemoView.vue'),
    meta: {
      title: 'Chat Demo - UNIACC ChatBot'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Guard para actualizar el título de la página
router.beforeEach((to) => {
  if (to.meta?.title) {
    document.title = to.meta.title as string
  }
})

export default router
