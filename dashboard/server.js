const express = require('express')
const cors = require('cors')
const { createClient } = require('@supabase/supabase-js')

const app = express()
const PORT = 3006 // Puerto para API (dashboard frontend está en 3000)

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Configurar Supabase
const useSupabase = () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://vtwdmyezyvhprwonengu.supabase.co'
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0d2RteWV6eXZocHJ3b25lbmd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4ODQ2MTQsImV4cCI6MjA3MTQ2MDYxNH0.iRICnZOws2yfMx514Cuyl5xZGDzrB5s6Bygtew5axZQ'
  
  return {
    supabase: createClient(supabaseUrl, supabaseKey)
  }
}

// Endpoint para interacciones
app.post('/api/interacciones', async (req, res) => {
  try {
    // Verificar autorización
    const authHeader = req.headers.authorization
    const expectedToken = process.env.VITE_UNIACC_WEBHOOK_SECRET || 'uniacc_webhook_secret_123'
    
    if (!authHeader || authHeader.replace('Bearer ', '') !== expectedToken) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { whatsapp, mensaje_usuario, respuesta_bot, timestamp, tipo } = req.body

    // Validar datos requeridos
    if (!whatsapp || !mensaje_usuario || !respuesta_bot) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const { supabase } = useSupabase()
    
    // Buscar o crear conversación existente
    let { data: conversacion, error: conversacionError } = await supabase
      .from('conversaciones')
      .select('id, contact_name, prospecto_id')
      .eq('phone_number', whatsapp)
      .single()

    // Si no existe la conversación, crearla
    if (conversacionError || !conversacion) {
      // Buscar prospecto existente por WhatsApp
      const { data: prospecto } = await supabase
        .from('prospectos')
        .select('id, nombre')
        .eq('whatsapp', whatsapp)
        .single()

      const { data: nuevaConversacion, error: crearError } = await supabase
        .from('conversaciones')
        .insert({
          phone_number: whatsapp,
          contact_name: prospecto?.nombre || null,
          prospecto_id: prospecto?.id || null,
          status: 'active',
          last_message_at: new Date(timestamp),
          message_count: 0,
          contact_info: prospecto ? { 
            nombre: prospecto.nombre,
            whatsapp: whatsapp,
            source: 'chatbot' 
          } : {}
        })
        .select('id')
        .single()

      if (crearError) {
        console.error('❌ Error creando conversación:', crearError)
        return res.status(500).json({ error: crearError.message })
      }
      conversacion = nuevaConversacion
    } else {
      // Si la conversación existe pero le faltan datos, actualizarla
      if (!conversacion.contact_name || !conversacion.prospecto_id) {
        const { data: prospecto } = await supabase
          .from('prospectos')
          .select('id, nombre')
          .eq('whatsapp', whatsapp)
          .single()

        if (prospecto) {
          await supabase
            .from('conversaciones')
            .update({
              contact_name: prospecto.nombre,
              prospecto_id: prospecto.id,
              contact_info: {
                nombre: prospecto.nombre,
                whatsapp: whatsapp,
                source: 'chatbot'
              }
            })
            .eq('id', conversacion.id)
        }
      }
    }

    // Insertar mensaje del usuario
    const { error: mensajeUserError } = await supabase
      .from('mensajes')
      .insert({
        conversacion_id: conversacion.id,
        content: mensaje_usuario,
        type: 'user',
        message_type: 'text',
        metadata: {
          source: 'uniacc_chatbot',
          timestamp: timestamp
        }
      })

    if (mensajeUserError) {
      console.error('❌ Error guardando mensaje usuario:', mensajeUserError)
      return res.status(500).json({ error: mensajeUserError.message })
    }

    // Insertar respuesta del bot
    const { error: mensajeBotError } = await supabase
      .from('mensajes')
      .insert({
        conversacion_id: conversacion.id,
        content: respuesta_bot,
        type: 'bot',
        message_type: 'text',
        metadata: {
          source: 'uniacc_chatbot',
          timestamp: timestamp,
          response_length: respuesta_bot.length
        }
      })

    if (mensajeBotError) {
      console.error('❌ Error guardando mensaje bot:', mensajeBotError)
      return res.status(500).json({ error: mensajeBotError.message })
    }

    // Actualizar contador de mensajes - obtener count actual primero
    const { data: currentConversacion } = await supabase
      .from('conversaciones')
      .select('message_count')
      .eq('id', conversacion.id)
      .single()
    
    const newCount = (currentConversacion?.message_count || 0) + 2
    
    const { error: updateError } = await supabase
      .from('conversaciones')
      .update({
        message_count: newCount,
        last_message_at: new Date(timestamp),
        updated_at: new Date()
      })
      .eq('id', conversacion.id)

    if (updateError) {
      console.warn('⚠️ Error actualizando conversación:', updateError)
    }

    console.log(`📊 Interacción registrada: ${whatsapp}`)
    res.json({ success: true, conversacion_id: conversacion.id })

  } catch (error) {
    console.error('💥 Error procesando interacción:', error)
    res.status(500).json({ error: 'Error interno' })
  }
})

// Endpoint para recibir prospectos del chatbot
app.post('/api/prospectos', async (req, res) => {
  try {
    // Verificar autorización
    const authHeader = req.headers.authorization
    const expectedToken = process.env.VITE_UNIACC_WEBHOOK_SECRET || 'uniacc_webhook_secret_123'
    
    if (!authHeader || authHeader.replace('Bearer ', '') !== expectedToken) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { nombre, email, telefono, whatsapp, edad, region, source, carrera_interes, facultad_interes } = req.body

    // Validar datos requeridos
    if (!nombre || !email || !whatsapp) {
      return res.status(400).json({ error: 'Missing required fields: nombre, email, whatsapp' })
    }

    const { supabase } = useSupabase()
    
    // Usar función de upsert si existe, sino insertar normalmente
    try {
      // Intentar usar la función personalizada primero
      const { data, error } = await supabase.rpc('upsert_prospecto_por_whatsapp', {
        p_whatsapp: whatsapp,
        p_nombre: nombre,
        p_email: email,
        p_edad: edad,
        p_region: region,
        p_telefono: telefono,
        p_carrera_interes: carrera_interes,
        p_facultad_interes: facultad_interes
      })

      if (error) throw error

      console.log('✅ Prospecto upsert exitoso:', data)
      res.json({ success: true, prospectoId: data })
    } catch (rpcError) {
      // Fallback: insertar directamente
      console.log('⚠️ RPC falló, intentando insert directo:', rpcError.message)
      
      const { data: prospecto, error: insertError } = await supabase
        .from('prospectos')
        .insert({
          nombre,
          email,
          telefono,
          whatsapp,
          edad,
          region,
          carrera_interes,
          facultad_interes,
          fuente: source || 'whatsapp_bot',
          ultimo_contacto: new Date().toISOString()
        })
        .select('id')
        .single()

      if (insertError) {
        console.error('❌ Error insertando prospecto:', insertError)
        return res.status(500).json({ error: insertError.message })
      }

      console.log('✅ Prospecto creado:', prospecto.id)
      res.json({ success: true, prospectoId: prospecto.id })
    }

  } catch (error) {
    console.error('💥 Error procesando prospecto:', error)
    res.status(500).json({ error: 'Error interno procesando prospecto' })
  }
})

// Endpoint de botpress webhook (redirigir al existente si es necesario)
app.post('/api/botpress-webhook', async (req, res) => {
  // Este endpoint ya existe en el dashboard, solo respondemos OK por ahora
  res.json({ success: true, message: 'Webhook received' })
})

// API Endpoints missing
app.get('/api/stats', async (req, res) => {
  try {
    const { supabase } = useSupabase()
    
    // Obtener estadísticas de prospectos desde Supabase
    const { data: prospectos, error } = await supabase
      .from('prospectos')
      .select('estado')
    
    if (error) {
      console.error('❌ Error obteniendo prospectos:', error)
      return res.json({
        success: true,
        data: {
          total: 0,
          nuevos: 0,
          contactados: 0,
          interesados: 0,
          matriculados: 0,
          descartados: 0,
          conversion_rate: 0
        }
      })
    }

    // Calcular estadísticas
    const stats = {
      total: prospectos.length,
      nuevos: prospectos.filter(p => p.estado === 'nuevo').length,
      contactados: prospectos.filter(p => p.estado === 'contactado').length,
      interesados: prospectos.filter(p => p.estado === 'interesado').length,
      matriculados: prospectos.filter(p => p.estado === 'matriculado').length,
      descartados: prospectos.filter(p => p.estado === 'descartado').length,
      conversion_rate: prospectos.length > 0 ? (prospectos.filter(p => p.estado === 'matriculado').length / prospectos.length) * 100 : 0
    }

    res.json({ success: true, data: stats })
  } catch (error) {
    console.error('💥 Error en /api/stats:', error)
    res.status(500).json({ success: false, error: 'Error interno' })
  }
})

app.get('/api/conversaciones', async (req, res) => {
  try {
    const { supabase } = useSupabase()
    
    // Obtener conversaciones desde Supabase
    const { data: conversaciones, error } = await supabase
      .from('conversaciones')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Error obteniendo conversaciones:', error)
      return res.json({ success: true, data: [] })
    }

    res.json({ success: true, data: conversaciones || [] })
  } catch (error) {
    console.error('💥 Error en /api/conversaciones:', error)
    res.status(500).json({ success: false, error: 'Error interno' })
  }
})

app.get('/api/conversaciones/:id/mensajes', async (req, res) => {
  try {
    const { id } = req.params
    const { supabase } = useSupabase()
    
    // Obtener mensajes de la conversación desde Supabase
    const { data: mensajes, error } = await supabase
      .from('mensajes')
      .select('*')
      .eq('conversacion_id', id)
      .order('created_at', { ascending: true })
    
    if (error) {
      console.error('❌ Error obteniendo mensajes:', error)
      return res.json({ success: true, data: [] })
    }

    res.json({ success: true, data: mensajes || [] })
  } catch (error) {
    console.error('💥 Error en /api/conversaciones/:id/mensajes:', error)
    res.status(500).json({ success: false, error: 'Error interno' })
  }
})

app.get('/api/prospectos', async (req, res) => {
  try {
    const { supabase } = useSupabase()
    
    // Obtener prospectos desde Supabase
    const { data: prospectos, error } = await supabase
      .from('prospectos')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Error obteniendo prospectos:', error)
      return res.json({ success: true, data: [] })
    }

    res.json({ success: true, data: prospectos || [] })
  } catch (error) {
    console.error('💥 Error en /api/prospectos:', error)
    res.status(500).json({ success: false, error: 'Error interno' })
  }
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Dashboard API Server running on http://localhost:${PORT}`)
  console.log(`📋 Endpoints:`)
  console.log(`   POST /api/interacciones - Registro de interacciones del chatbot`)
  console.log(`   POST /api/botpress-webhook - Webhook de Botpress`)
  console.log(`   GET  /health - Health check`)
})

module.exports = app