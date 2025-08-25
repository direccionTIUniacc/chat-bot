import { ref } from 'vue'
import type { Prospecto, ProspectoStats, ChatbotMetrics } from '@/types'

// Datos mínimos para el dashboard (sin mock para testing limpio)
export function useMockData() {
  // 🧹 DATOS MOCK DESHABILITADOS PARA TESTING DE INTEGRACIÓN
  const mockProspectos: Prospecto[] = [
    // Array vacío para testing limpio de integración
  ]

  // Stats vacías para que no falle el dashboard
  const mockStats: ProspectoStats = {
    total: 0,
    nuevos: 0,
    contactados: 0,
    interesados: 0,
    matriculados: 0,
    descartados: 0,
    conversion_rate: 0
  }

  const mockChatbotMetrics: ChatbotMetrics = {
    total_sessions: 0,
    active_sessions: 0,
    completed_sessions: 0,
    avg_duration: 0,
    messages_per_session: 0,
    conversion_rate: 0,
    popular_queries: []
  }

  return {
    prospectos: ref(mockProspectos),
    stats: ref(mockStats),
    chatbotMetrics: ref(mockChatbotMetrics),
    
    // Funciones helper
    addProspecto: (prospecto: Prospecto) => {
      mockProspectos.push(prospecto)
    },
    
    getProspectoById: (id: string) => {
      return mockProspectos.find(p => p.id === id)
    },
    
    updateStats: () => {
      mockStats.total = mockProspectos.length
      mockStats.nuevos = mockProspectos.filter(p => p.estado === 'nuevo').length
      mockStats.contactados = mockProspectos.filter(p => p.estado === 'contactado').length
      mockStats.interesados = mockProspectos.filter(p => p.estado === 'interesado').length
      mockStats.matriculados = mockProspectos.filter(p => p.estado === 'matriculado').length
      mockStats.descartados = mockProspectos.filter(p => p.estado === 'descartado').length
      
      // Calcular conversion rate
      if (mockStats.total > 0) {
        mockStats.conversion_rate = (mockStats.matriculados / mockStats.total) * 100
      }
    }
  }
}