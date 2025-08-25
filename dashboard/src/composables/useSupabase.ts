import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vtwdmyezyvhprwonengu.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0d2RteWV6eXZocHJ3b25lbmd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4ODQ2MTQsImV4cCI6MjA3MTQ2MDYxNH0.iRICnZOws2yfMx514Cuyl5xZGDzrB5s6Bygtew5axZQ'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

export function useSupabase() {
  return {
    supabase,
    
    // Helper para manejar errores de Supabase
    handleSupabaseError: (error: any) => {
      console.error('Supabase Error:', error)
      return {
        success: false,
        error: error?.message || 'Error de conexión con la base de datos',
        data: null
      }
    },

    // Helper para respuestas exitosas
    handleSupabaseSuccess: <T>(data: T) => {
      return {
        success: true,
        error: null,
        data
      }
    }
  }
}
