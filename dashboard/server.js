const express = require('express')
const cors = require('cors')
const { createClient } = require('@supabase/supabase-js')


const app = express()
const PORT = 3002 // Puerto para API (dashboard frontend está en 3000)

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
      // Buscar prospecto existente por WhatsApp en la tabla correcta
      const { data: prospecto } = await supabase
        .from('prospecto_actual')
        .select('whatsapp, nombre')
        .eq('whatsapp', whatsapp)
        .single()

      const { data: nuevaConversacion, error: crearError } = await supabase
        .from('conversaciones')
        .insert({
          phone_number: whatsapp,
          contact_name: prospecto?.nombre || null,
          prospecto_id: null, // En prospecto_actual no hay ID, usar WhatsApp como referencia
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
      if (!conversacion.contact_name) {
        const { data: prospecto } = await supabase
          .from('prospecto_actual')
          .select('whatsapp, nombre')
          .eq('whatsapp', whatsapp)
          .single()

        if (prospecto) {
          await supabase
            .from('conversaciones')
            .update({
              contact_name: prospecto.nombre,
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

// 🆕 Endpoint mejorado para Progressive Capture
app.post('/api/prospectos', async (req, res) => {
  try {
    // Verificar autorización
    const authHeader = req.headers.authorization
    const expectedToken = process.env.VITE_UNIACC_WEBHOOK_SECRET || 'uniacc_webhook_secret_123'
    
    if (!authHeader || authHeader.replace('Bearer ', '') !== expectedToken) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { 
      nombre, 
      email, 
      telefono, 
      whatsapp, 
      edad, 
      region, 
      source, 
      carrera_interes, 
      facultad_interes,
      tipo_consulta,  // 🆕 Progressive Capture
      nivel_interes,
      prospecto_id  // 🆕 Para actualizaciones existentes
    } = req.body

    // 🔄 Validación flexible para Progressive Capture
    if (!whatsapp) {
      return res.status(400).json({ error: 'Missing required field: whatsapp' })
    }

    // Para progressive capture, puede que solo tengamos nombre inicialmente
    if (!nombre && !prospecto_id) {
      return res.status(400).json({ error: 'Missing required field: nombre or prospecto_id' })
    }

    const { supabase } = useSupabase()
    
    try {
      let result;
      
      // 🆕 Si es una actualización de prospecto existente
      if (prospecto_id) {
        console.log(`🔄 Actualizando prospecto existente: ${prospecto_id}`)
        
        const updateData = {}
        if (nombre) updateData.nombre = nombre
        if (email) updateData.email = email
        if (telefono) updateData.telefono = telefono
        if (edad) updateData.edad = edad
        if (region) updateData.region = region
        if (carrera_interes) updateData.carrera_interes = carrera_interes
        if (facultad_interes) updateData.facultad_interes = facultad_interes
        if (tipo_consulta) updateData.tipo_consulta = tipo_consulta
        if (nivel_interes) updateData.nivel_interes = nivel_interes
        
        updateData.updated_at = new Date().toISOString()
        
        const { data, error } = await supabase
          .from('prospectos')
          .update(updateData)
          .eq('id', prospecto_id)
          .select('id')
          .single()

      if (error) throw error
        result = data
        
      } else {
        // 🆕 Crear nuevo prospecto usando la función especializada
        console.log(`📝 Creando nuevo prospecto para WhatsApp: ${whatsapp}`)
        
        const { data: resultado, error: insertError } = await supabase.rpc('insertar_sesion_prospecto', {
          p_whatsapp: whatsapp,
          p_nombre: nombre,
          p_email: email || null,
          p_telefono: telefono || null,
          p_edad: edad || null,
          p_region: region || null,
          p_carrera_interes: carrera_interes || 'Sin especificar',
          p_facultad_interes: facultad_interes || '',
          p_tipo_consulta: tipo_consulta || 'captura en proceso',
          p_nivel_interes: nivel_interes || 'medio',
          p_fuente: source || 'uniacc_chatbot',
          p_datos_capturados: JSON.stringify({
            timestamp: new Date().toISOString(),
            source: 'dashboard_api'
          }),
          p_mensajes: 1,
          p_flujo_completado: false,
          p_razon_finalizacion: 'en_progreso'
        })

        if (insertError) throw insertError
        
        // La función devuelve el ID del historial, pero necesitamos el whatsapp para compatibilidad
        result = { id: whatsapp, whatsapp: whatsapp }
      }

      console.log('✅ Prospecto guardado exitosamente:', result.id)
      res.json({ success: true, prospectoId: result.id })

    } catch (dbError) {
      console.error('❌ Error en base de datos:', dbError)
      return res.status(500).json({ error: dbError.message })
    }

  } catch (error) {
    console.error('💥 Error procesando prospecto:', error)
    res.status(500).json({ error: 'Error interno procesando prospecto' })
  }
})

// Mapear flujo del chatbot al tipo de consulta para la DB
function mapearFlujoATipoConsulta(flujoActual) {
  const mapeo = {
    // Mapeos originales
    'conocer_carreras': 'info_carreras',
    'proceso_admision': 'info_admision', 
    'costos_becas': 'info_costos',
    'modalidades_estudio': 'info_modalidades',
    'hablar_asesor': 'solicitar_asesor',
    
    // Mapeos adicionales por si llegan otros flujos
    'exploracion_carreras': 'info_carreras',
    'detalle_carrera': 'info_carreras',
    'captura_datos': 'solicitar_asesor',
    'captura_inicial': 'ingreso solo datos basicos',
    'menu_principal': 'consulta multiple general',
    
    // 🆕 Mapeos para progressive capture - NO deberían llegar aquí
    // pero incluimos por seguridad
    'timeout_session': 'abandono incompleto',
    'abandono_parcial': 'abandono incompleto'
  }
  
  return mapeo[flujoActual] || 'consulta multiple general'
}

// Determinar nivel de interés basado en el tipo de consulta
function determinarNivelInteres(tipoConsulta, nivelOriginal) {
  if (tipoConsulta === 'solicitud de asesor') {
    return 'urgente'
  }
  return nivelOriginal || 'alto'
}

// Endpoint de botpress webhook con lógica completa
app.post('/api/botpress-webhook', async (req, res) => {
  try {
    // Verificar autorización
    const authHeader = req.headers.authorization
    const expectedToken = process.env.VITE_UNIACC_WEBHOOK_SECRET || 'uniacc_webhook_secret_123'
    
    if (!authHeader || authHeader.replace('Bearer ', '') !== expectedToken) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const eventData = req.body
    console.log('📊 Procesando prospecto UNIACC:', eventData)
    console.log('🔧 DEBUG - flujo_actual recibido:', eventData.flujo_actual)
    
    // Priorizar tipo_consulta del chatbot, sino mapear desde flujo_actual
    const tipoConsulta = eventData.tipo_consulta || mapearFlujoATipoConsulta(eventData.flujo_actual)
    console.log('🔧 DEBUG - tipo_consulta usado:', tipoConsulta, eventData.tipo_consulta ? '(del chatbot)' : '(mapeado)')

    const { supabase } = useSupabase()

    // Crear prospecto usando la función especializada
    const { data, error } = await supabase.rpc('insertar_sesion_prospecto', {
      p_whatsapp: eventData.whatsapp,
      p_nombre: eventData.nombre,
      p_email: eventData.email,
      p_telefono: eventData.telefono,
      p_edad: eventData.edad,
      p_region: eventData.region,
      p_carrera_interes: eventData.carrera_interes || 'Sin especificar',
      p_facultad_interes: eventData.facultad_interes || '',
      p_tipo_consulta: tipoConsulta,
      p_nivel_interes: determinarNivelInteres(tipoConsulta, eventData.nivel_interes),
      p_fuente: eventData.source || 'uniacc_chatbot',
      p_datos_capturados: JSON.stringify({
          bot_source: 'uniacc_direct',
          conversation_flow: eventData.flujo_actual,
          utm_source: eventData.utm_source,
          utm_medium: eventData.utm_medium,
          utm_campaign: eventData.utm_campaign,
        timestamp: eventData.timestamp,
          ...eventData.datos_adicionales
      }),
      p_mensajes: 1,
      p_flujo_completado: true,
      p_razon_finalizacion: 'completado'
      })

    if (error) {
      console.error('❌ Error creando prospecto UNIACC:', error)
      return res.status(500).json({ success: false, error: error.message })
    }

    console.log('✅ Prospecto UNIACC guardado:', data || 'sin ID')
    
    // Crear notificación para ejecutivos (opcional, solo si existe tabla notificaciones)
    try {
    await supabase
      .from('notificaciones')
      .insert({
        tipo: 'nuevo_prospecto',
          titulo: `Nuevo prospecto: ${eventData.nombre}`,
          mensaje: `Interesado en ${eventData.carrera_interes || 'consulta general'}`,
          datos: { whatsapp: eventData.whatsapp },
        created_at: new Date()
      })
    } catch (notifError) {
      // No es crítico si falla la notificación
      console.warn('⚠️ No se pudo crear notificación:', notifError.message)
    }

    res.json({ success: true, prospecto_whatsapp: eventData.whatsapp, data })

  } catch (error) {
    console.error('💥 Error procesando lead UNIACC:', error)
    res.status(500).json({ success: false, error: 'Error interno procesando prospecto' })
  }
})

// 🆕 Endpoint de reconocimiento mejorado para Progressive Capture
app.get('/api/prospectos/reconocimiento/:whatsapp', async (req, res) => {
  try {
    const { whatsapp } = req.params
    const { supabase } = useSupabase()
    
    if (!whatsapp) {
      return res.status(400).json({ success: false, error: 'whatsapp parameter required' })
    }
    
    console.log(`🔍 Buscando historial para WhatsApp: ${whatsapp}`)
    
    // 🔄 Obtener historial completo ordenado por fecha (más reciente primero)
    const { data: historial, error: historialError } = await supabase
      .from('prospecto_historial')
      .select(`
        id,
        whatsapp,
        sesion_numero,
        nombre, 
        email, 
        telefono,
        edad,
        region,
        carrera_interes, 
        facultad_interes,
        tipo_consulta, 
        nivel_interes,
        flujo_completado,
        razon_finalizacion,
        paso_abandono,
        created_at,
        sesion_fin
      `)
      .eq('whatsapp', whatsapp)
      .order('created_at', { ascending: false })

    // También obtener estado actual
    const { data: actual, error: actualError } = await supabase
      .from('prospecto_actual')
      .select(`
        whatsapp,
        nombre,
        email,
        telefono,
        edad,
        region,
        carrera_interes,
        facultad_interes,
        nivel_interes,
        estado,
        tipo_consulta_actual,
        total_sesiones,
        primera_interaccion,
        ultima_interaccion,
        perfil_usuario,
        es_prioritario
      `)
      .eq('whatsapp', whatsapp)
      .single()

    if (historialError && actualError) {
      console.error('❌ Error obteniendo datos:', { historialError, actualError })
      return res.json({ success: false, error: 'No se encontraron datos' })
    }

    // 🆕 Análisis de reconocimiento mejorado
    const esUsuarioRecurrente = (historial && historial.length > 0) || actual
    const ultimaSessionHistorial = historial?.[0] || null
    const prospectoCompleto = historial?.find(p => 
      p.tipo_consulta === 'captura completa' && 
      p.nombre && p.email && p.telefono
    )
    
    // 🔄 Determinar estado del usuario usando datos actuales e históricos
    let estadoReconocimiento = 'nuevo'
    let ultimoCampoGuardado = null
    
    // Priorizar estado actual si existe
    const referenciaProspecto = actual || ultimaSessionHistorial
    
    if (referenciaProspecto) {
      const tipoConsulta = actual?.tipo_consulta_actual || ultimaSessionHistorial?.tipo_consulta
      
      if (tipoConsulta?.includes('abandono')) {
        estadoReconocimiento = 'abandono_previo'
        ultimoCampoGuardado = determinarUltimoCampo(referenciaProspecto)
      } else if (tipoConsulta === 'captura completa') {
        estadoReconocimiento = 'completo_previo'
      } else if (tipoConsulta === 'captura en proceso') {
        estadoReconocimiento = 'proceso_previo'
        ultimoCampoGuardado = determinarUltimoCampo(referenciaProspecto)
      }
    }

    const respuesta = {
      success: true,
      data: {
        es_usuario_recurrente: esUsuarioRecurrente,
        estado_reconocimiento: estadoReconocimiento,
        prospecto_actual: actual,
        ultimo_historial: ultimaSessionHistorial,
        prospecto_completo: prospectoCompleto,
        ultimo_campo_guardado: ultimoCampoGuardado,
        total_registros: historial?.length || 0,
        total_sesiones: actual?.total_sesiones || historial?.length || 0,
        historial_reciente: historial?.slice(0, 3) || [],
        puede_continuar_captura: !!referenciaProspecto && 
          (actual?.tipo_consulta_actual !== 'captura completa' && 
           ultimaSessionHistorial?.tipo_consulta !== 'captura completa')
      }
    }

    console.log(`✅ Reconocimiento completado para ${whatsapp}:`, {
      recurrente: esUsuarioRecurrente,
      estado: estadoReconocimiento,
      registros: historial?.length || 0,
      sesiones: actual?.total_sesiones || 0
    })

    res.json(respuesta)
    
  } catch (error) {
    console.error('💥 Error en reconocimiento:', error)
    res.status(500).json({ success: false, error: 'Error interno' })
  }
})

// 🛠️ Función auxiliar para determinar último campo guardado
function determinarUltimoCampo(prospecto) {
  if (prospecto.region) return 'region'
  if (prospecto.edad) return 'edad'  
  if (prospecto.telefono) return 'telefono'
  if (prospecto.email) return 'email'
  if (prospecto.nombre) return 'nombre'
  return null
}

// Endpoint para consultar prospectos por WhatsApp (mantener compatibilidad)
app.get('/api/prospectos', async (req, res) => {
  try {
    const { supabase } = useSupabase()
    const { whatsapp } = req.query
    
    if (whatsapp) {
      // Redirigir al nuevo endpoint de reconocimiento
      return res.redirect(`/api/prospectos/reconocimiento/${whatsapp}`)
    }
    
    // Sin filtro de WhatsApp, devolver todos los prospectos directamente de la tabla
    const { data: prospectos, error } = await supabase
      .from('prospecto_actual')
      .select('*')
      .order('ultima_interaccion', { ascending: false })
    
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

// API Endpoints missing
app.get('/api/stats', async (req, res) => {
  try {
    const { supabase } = useSupabase()
    
    // Obtener estadísticas de prospectos desde Supabase usando la tabla actual
    const { data: prospectos, error } = await supabase
      .from('prospecto_actual')
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

// ENDPOINT ELIMINADO - usando el endpoint completo más abajo

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

// 📋 Endpoint para obtener ejecutivos
app.get('/api/ejecutivos', async (req, res) => {
  try {
    const { supabase } = useSupabase()

    const { data: ejecutivos, error } = await supabase
      .from('ejecutivos')
      .select('*')
      .eq('activo', true)
      .order('nombre')

    if (error) {
      throw error
    }

    res.json({
      success: true,
      data: ejecutivos || []
    })

  } catch (error) {
    console.error('❌ Error obteniendo ejecutivos:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor'
    })
  }
})

// Cache simple para conversaciones (5 segundos)
let conversacionesCache = null
let lastCacheTime = 0
const CACHE_DURATION = 10000 // 10 segundos

// 🎯 Endpoint para obtener conversaciones
app.get('/api/conversaciones', async (req, res) => {
  try {
    const { supabase } = useSupabase()
    const now = Date.now()

    // Usar cache si está disponible y vigente
    if (conversacionesCache && (now - lastCacheTime) < CACHE_DURATION) {
      console.log('📋 Usando conversaciones desde cache')
      return res.json(conversacionesCache)
    }

    console.log('📞 Consultando conversaciones desde BD...')

    // Obtener conversaciones y luego buscar prospectos manualmente
    const { data: conversaciones, error } = await supabase
      .from('conversaciones')
      .select(`
        *,
        ejecutivo:ejecutivos(id, nombre, email)
      `)
      .order('last_message_at', { ascending: false })

    if (error) {
      throw error
    }

    // Enriquecer con datos de prospectos buscando por phone_number
    const conversacionesConProspectos = await Promise.all(
      (conversaciones || []).map(async (conversacion) => {
        try {
          // Buscar prospecto por WhatsApp/teléfono (log reducido)
          // console.log(`🔍 Buscando prospecto para ${conversacion.id.substring(0, 8)}`)
          
          // Intentar búsqueda directa primero
          let prospecto = null
          let prospectoError = null
          
          // Búsqueda 1: Número exacto como viene
          const { data: prospectoDirecto, error: errorDirecto } = await supabase
            .from('prospecto_actual')
            .select(`
              whatsapp, 
              nombre, 
              email,
              carrera_interes, 
              nivel_interes,
              estado,
              perfil_usuario,
              es_prioritario,
              total_sesiones,
              tipo_consulta_actual
            `)
            .eq('whatsapp', conversacion.phone_number)
            .maybeSingle()
            
          if (prospectoDirecto) {
            prospecto = prospectoDirecto
                          // console.log(`✅ Encontrado con búsqueda directa`)
          } else {
            // console.log(`❌ No encontrado con búsqueda directa, error:`, errorDirecto?.message)
            
            // Búsqueda 2: Limpiar número chileno (quitar +56 o 56 del inicio)
            let telefonoLimpio = conversacion.phone_number?.replace(/^\+?56/, '')
            if (telefonoLimpio && telefonoLimpio !== conversacion.phone_number) {
              const { data: prospectoLimpio, error: errorLimpio } = await supabase
                .from('prospecto_actual')
                .select(`
                  whatsapp, 
                  nombre, 
                  email,
                  carrera_interes, 
                  nivel_interes,
                  estado,
                  perfil_usuario,
                  es_prioritario,
                  total_sesiones,
                  tipo_consulta_actual
                `)
                .eq('whatsapp', `56${telefonoLimpio}`)
                .maybeSingle()
                
              if (prospectoLimpio) {
                prospecto = prospectoLimpio
                // console.log(`✅ Encontrado con número limpio: 56${telefonoLimpio}`)
              } else {
                // console.log(`❌ No encontrado con número limpio, error:`, errorLimpio?.message)
                prospectoError = errorLimpio
              }
            }
          }

          // console.log(`📋 Prospecto para ${conversacion.id.substring(0, 8)}: ${prospecto?.nombre || 'No encontrado'}`)

          // Buscar último mensaje de la conversación
          let ultimoMensaje = null
          try {
            const { data: mensaje, error: mensajeError } = await supabase
              .from('mensajes')
              .select('content, created_at, type, message_type')
              .eq('conversacion_id', conversacion.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle()
              
            if (mensaje && !mensajeError) {
              ultimoMensaje = {
                content: mensaje.content,
                timestamp: mensaje.created_at,
                role: mensaje.type, // En BD es 'type', no 'role'
                message_type: mensaje.message_type
              }
              // console.log(`✅ Mensaje: ${mensaje.content.substring(0, 30)}...`)
            } else {
              // console.log(`❌ Sin mensaje para ${conversacion.id.substring(0, 8)}`)
            }
          } catch (mensajeSearchError) {
            console.log(`⚠️ Error buscando último mensaje:`, mensajeSearchError.message)
          }

          return {
            ...conversacion,
            prospecto: prospecto || null,
            last_message: ultimoMensaje?.content || null,
            last_message_at: ultimoMensaje?.timestamp || conversacion.last_message_at,
            last_message_role: ultimoMensaje?.role || null
          }
        } catch (searchError) {
          console.log(`⚠️ Error en búsqueda de prospecto:`, searchError.message)
          return {
            ...conversacion,
            prospecto: null,
            last_message: null
          }
        }
      })
    )

    console.log(`📋 Conversaciones procesadas: ${conversacionesConProspectos?.length || 0}`)
    
    // Preparar respuesta final
    const respuesta = {
      success: true,
      data: conversacionesConProspectos || []
    }
    
    // Guardar en cache
    conversacionesCache = respuesta
    lastCacheTime = now

    res.json(respuesta)

  } catch (error) {
    console.error('❌ Error obteniendo conversaciones:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor'
    })
  }
})

// 💬 Endpoint para obtener mensajes de una conversación
app.get('/api/conversaciones/:id/mensajes', async (req, res) => {
  try {
    const { id: conversacionId } = req.params
    const { supabase } = useSupabase()

    const { data: mensajes, error } = await supabase
      .from('mensajes')
      .select('*')
      .eq('conversacion_id', conversacionId)
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    res.json({
      success: true,
      data: mensajes || []
    })

  } catch (error) {
    console.error('❌ Error obteniendo mensajes:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor'
    })
  }
})

// 🎯 Endpoint para asignar conversación a ejecutivo
app.post('/api/conversaciones/:id/asignar', async (req, res) => {
  try {
    const { id: conversacionId } = req.params
    const { ejecutivoId, priority, notes } = req.body

    console.log(`🎯 Asignando conversación ${conversacionId} a ejecutivo ${ejecutivoId}`)

    const { supabase } = useSupabase()
    console.log('📊 Supabase client created:', !!supabase)

    // 1️⃣ Actualizar conversación
    const { data: conversacion, error: updateError } = await supabase
      .from('conversaciones')
      .update({
        assigned_to: ejecutivoId,
        handoff_status: 'agent',
        handoff_accepted_at: new Date().toISOString(),
        agent_last_activity: new Date().toISOString(),
        priority: priority || 'normal',
        notas: notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversacionId)
      .select(`
        *,
        ejecutivo:ejecutivos(id, nombre, email, avatar_url),
        prospecto:prospecto_actual(whatsapp, nombre, carrera_interes, nivel_interes)
      `)
      .single()

    if (updateError) {
      throw updateError
    }

    // 2️⃣ Enviar mensaje de transición
    const mensajeTransicion = {
      conversacion_id: conversacionId,
      type: 'bot',
      content: `🔄 Te he conectado con ${conversacion.ejecutivo.nombre}, uno de nuestros asesores especializados. En un momento te atenderá para resolver todas tus consultas. ¡Gracias por tu paciencia! 😊`,
      message_type: 'text',
      sender_name: 'UNIACC Bot',
      metadata: {
        is_transition: true,
        ejecutivo_asignado: ejecutivoId,
        timestamp_handoff: new Date().toISOString()
      }
    }

    const { error: messageError } = await supabase
      .from('mensajes')
      .insert(mensajeTransicion)

    if (messageError) {
      console.warn('⚠️ No se pudo enviar mensaje de transición:', messageError)
    }

    // 3️⃣ Respuesta exitosa
    console.log('✅ Asignación completada. Datos de respuesta:', {
      conversacion_id: conversacionId,
      ejecutivo_asignado: conversacion.ejecutivo,
      handoff_timestamp: conversacion.handoff_accepted_at
    })

    res.json({
      success: true,
      data: {
        conversacion_id: conversacionId,
        ejecutivo_asignado: conversacion.ejecutivo,
        prospecto_info: conversacion.prospecto,
        handoff_timestamp: conversacion.handoff_accepted_at,
        context_transferido: true
      }
    })

  } catch (error) {
    console.error('❌ Error asignando conversación:', error)
    console.error('📋 Error stack:', error.stack)
    res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor'
    })
  }
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// Endpoint para actualizar datos de prospecto
app.put('/api/prospectos/:whatsapp', async (req, res) => {
  try {
    const { supabase } = useSupabase()
    const { whatsapp } = req.params
    const datosActualizar = req.body

    console.log(`📝 Actualizando prospecto ${whatsapp}:`, Object.keys(datosActualizar))

    // Preparar datos para actualización (solo campos permitidos)
    const camposPermitidos = [
      'nombre', 'email', 'telefono', 'edad', 'region', 'ciudad',
      'carrera_interes', 'nivel_interes', 'modalidad_preferida', 'horario_preferido',
      'estado', 'perfil_usuario', 'es_prioritario', 'proximo_seguimiento', 'notas'
    ]

    const datosLimpios = {}
    for (const campo of camposPermitidos) {
      if (datosActualizar[campo] !== undefined) {
        datosLimpios[campo] = datosActualizar[campo]
      }
    }

    // Agregar timestamp de actualización
    datosLimpios.updated_at = new Date().toISOString()

    // Actualizar en la base de datos
    const { data: prospectoActualizado, error } = await supabase
      .from('prospecto_actual')
      .update(datosLimpios)
      .eq('whatsapp', whatsapp)
      .select()
      .single()

    if (error) {
      console.error('❌ Error actualizando prospecto:', error)
      throw error
    }

    console.log(`✅ Prospecto ${whatsapp} actualizado exitosamente`)

    // Limpiar cache de conversaciones para que se recarguen
    conversacionesCache = null

    res.json({
      success: true,
      data: prospectoActualizado,
      message: 'Prospecto actualizado exitosamente'
    })

  } catch (error) {
    console.error('❌ Error en actualización de prospecto:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor'
    })
  }
})

// Test endpoint para verificar búsqueda de prospectos
app.get('/api/test-prospecto/:phone', async (req, res) => {
  try {
    const { supabase } = useSupabase()
    const phone = req.params.phone
    
    console.log(`🧪 Test búsqueda prospecto para: ${phone}`)
    
    // Búsqueda directa
    const { data: directa, error: errorDirecta } = await supabase
      .from('prospecto_actual')
      .select('whatsapp, nombre, email')
      .eq('whatsapp', phone)
      .maybeSingle()
    
    // También intentar con LIKE para ver si hay problemas de formato
    const { data: todos, error: errorTodos } = await supabase
      .from('prospecto_actual')
      .select('whatsapp, nombre, email')
      .limit(5)
    
    res.json({
      phone_buscado: phone,
      busqueda_directa: {
        encontrado: !!directa,
        data: directa,
        error: errorDirecta?.message
      },
      todos_los_prospectos: {
        total: todos?.length || 0,
        data: todos,
        error: errorTodos?.message
      }
    })
  } catch (error) {
    console.error('❌ Error en test prospecto:', error)
    res.status(500).json({ error: error.message })
  }
})

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Dashboard API Server running on http://localhost:${PORT}`)
  console.log(`📋 Endpoints:`)
  console.log(`   GET  /api/ejecutivos - Obtener ejecutivos`)
  console.log(`   GET  /api/conversaciones - Obtener conversaciones`)
  console.log(`   GET  /api/conversaciones/:id/mensajes - Obtener mensajes de conversación`)
  console.log(`   POST /api/conversaciones/:id/asignar - Asignar conversación a ejecutivo`)
  console.log(`   POST /api/interacciones - Registro de interacciones del chatbot`)
  console.log(`   POST /api/botpress-webhook - Webhook de Botpress`)
  console.log(`   GET  /health - Health check`)
})

module.exports = app