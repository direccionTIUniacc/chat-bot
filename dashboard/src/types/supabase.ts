export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      prospectos: {
        Row: {
          id: string
          nombre: string
          email: string
          telefono: string | null
          carrera_interes: string
          nivel_interes: 'bajo' | 'medio' | 'alto'
          fuente: 'chatbot' | 'web' | 'social' | 'referido'
          estado: 'nuevo' | 'contactado' | 'interesado' | 'matriculado' | 'descartado'
          notas: string | null
          fecha_contacto: string | null
          fecha_seguimiento: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nombre: string
          email: string
          telefono?: string | null
          carrera_interes: string
          nivel_interes: 'bajo' | 'medio' | 'alto'
          fuente: 'chatbot' | 'web' | 'social' | 'referido'
          estado?: 'nuevo' | 'contactado' | 'interesado' | 'matriculado' | 'descartado'
          notas?: string | null
          fecha_contacto?: string | null
          fecha_seguimiento?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          email?: string
          telefono?: string | null
          carrera_interes?: string
          nivel_interes?: 'bajo' | 'medio' | 'alto'
          fuente?: 'chatbot' | 'web' | 'social' | 'referido'
          estado?: 'nuevo' | 'contactado' | 'interesado' | 'matriculado' | 'descartado'
          notas?: string | null
          fecha_contacto?: string | null
          fecha_seguimiento?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      chat_sessions: {
        Row: {
          id: string
          prospecto_id: string | null
          started_at: string
          ended_at: string | null
          status: 'active' | 'ended' | 'transferred'
          messages_count: number
          duration: number | null
          outcome: 'info_collected' | 'appointment_scheduled' | 'not_interested' | 'transferred' | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          prospecto_id?: string | null
          started_at?: string
          ended_at?: string | null
          status?: 'active' | 'ended' | 'transferred'
          messages_count?: number
          duration?: number | null
          outcome?: 'info_collected' | 'appointment_scheduled' | 'not_interested' | 'transferred' | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          prospecto_id?: string | null
          started_at?: string
          ended_at?: string | null
          status?: 'active' | 'ended' | 'transferred'
          messages_count?: number
          duration?: number | null
          outcome?: 'info_collected' | 'appointment_scheduled' | 'not_interested' | 'transferred' | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          session_id: string
          type: 'user' | 'bot' | 'system'
          content: string
          timestamp: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          type: 'user' | 'bot' | 'system'
          content: string
          timestamp?: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          type?: 'user' | 'bot' | 'system'
          content?: string
          timestamp?: string
          metadata?: Json | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
