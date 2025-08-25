import type { IncomingMessage, ServerResponse } from 'http'
import { useSupabase } from '@/composables/useSupabase'

interface TestRequest extends IncomingMessage {
  body?: any
}

// Handler para probar la integración
export default async function handler(
  req: TestRequest,
  res: ServerResponse
) {
  // Solo aceptar POST requests
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  try {
    // Obtener el body del request
    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })

    req.on('end', async () => {
      try {
        console.log('🧪 Test de integración recibido')
        const testData = JSON.parse(body)
        
        const { supabase } = useSupabase()

        // Crear prospecto de prueba
        const { data, error } = await supabase
          .from('prospectos')
          .insert({
            nombre: testData.nombre || 'Prospecto Test',
            email: testData.email || 'test@uniacc.cl',
            telefono: testData.telefono || '+56912345678',
            whatsapp: testData.whatsapp || '56912345678',
            carrera_interes: testData.carrera_interes || 'Test Carrera',
            nivel_interes: 'alto',
            fuente: 'test_integration',
            estado: 'nuevo',
            created_at: new Date(),
            metadata: {
              test: true,
              timestamp: new Date().toISOString(),
              source: 'dashboard_integration_test'
            }
          })
          .select()
          .single()

        if (error) {
          console.error('❌ Error test integración:', error)
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ 
            success: false, 
            error: error.message 
          }))
          return
        }

        console.log('✅ Test integración exitoso:', data.id)
        
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          success: true,
          message: 'Integración funcionando correctamente',
          prospecto_id: data.id,
          data: data
        }))

      } catch (parseError) {
        console.error('❌ Error parsing test data:', parseError)
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ 
          success: false, 
          error: 'Invalid JSON data' 
        }))
      }
    })

  } catch (error) {
    console.error('💥 Error en test de integración:', error)
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ 
      success: false, 
      error: 'Internal server error' 
    }))
  }
}
