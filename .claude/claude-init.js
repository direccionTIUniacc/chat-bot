const fs = require('fs');
const path = require('path');

function showProjectContext() {
  console.log('🎓 ========= UNIACC CHATBOT - CONTEXTO PARA CLAUDE ========= 🎓\n');
  
  // Leer contexto principal
  try {
    const contextPath = path.join(__dirname, './project-context.json');
    const context = JSON.parse(fs.readFileSync(contextPath, 'utf8'));
    
    console.log(`📦 Proyecto: ${context.project.name}`);
    console.log(`🏗️ Arquitectura: ${context.architecture.pattern} (${context.architecture.services.length} servicios)`);
    console.log(`🛠️ Stack: ${context.project.stack.join(', ')}`);
    console.log(`📊 Estado: ${context.project.status}`);
    console.log(`📅 Última actualización: ${context.lastUpdated}\n`);
    
    console.log('🚀 SERVICIOS ACTIVOS:');
    context.architecture.services.forEach(service => {
      console.log(`  🔗 ${service.name} (Puerto ${service.port}) - ${service.tech}`);
      console.log(`      └─ ${service.purpose}`);
    });
    
    console.log(`\n🗄️ BASE DE DATOS: ${context.architecture.database.provider}`);
    console.log(`   └─ URL: ${context.architecture.database.url}`);
    console.log(`   └─ Tablas: ${context.architecture.database.tables.join(', ')}`);
    console.log(`   └─ RPC: ${context.architecture.database.rpc_functions.join(', ')}`);
    
    console.log('\n✅ FUNCIONALIDADES COMPLETADAS:');
    context.currentSprint.completedFeatures.forEach(feature => 
      console.log(`  ${feature}`)
    );
    
    console.log('\n🔄 PRÓXIMA FASE:');
    context.currentSprint.nextPhase.forEach(task => 
      console.log(`  ${task}`)
    );
    
    console.log('\n🤖 FLUJOS DEL CHATBOT:');
    context.businessLogic.chatbotFlows.forEach(flow => 
      console.log(`  ${flow}`)
    );
    
    console.log('\n🎓 FACULTADES UNIACC:');
    context.businessLogic.facultades.forEach(facultad => 
      console.log(`  ${facultad}`)
    );
    
    console.log('\n🔧 URLS DE DESARROLLO:');
    Object.entries(context.environment.development.urls).forEach(([key, url]) =>
      console.log(`  📍 ${key}: ${url}`)
    );
    
  } catch (error) {
    console.log('⚠️ No se pudo leer el contexto del proyecto');
    console.log(`   Error: ${error.message}`);
  }
  
  // Mostrar estructura del proyecto
  console.log('\n📁 ESTRUCTURA RELEVANTE:');
  showServiceStructure();
  
  // Mostrar archivos críticos
  console.log('\n🔥 ARCHIVOS CRÍTICOS:');
  showCriticalFiles();
  
  // NUEVO: Mostrar archivos dinámicos
  console.log('\n📊 ARCHIVOS DINÁMICOS DE DEBUGGING:');
  showDynamicFiles();
  
  // Mostrar comandos útiles
  console.log('\n⚡ COMANDOS RÁPIDOS:');
  showQuickCommands();
}

function showServiceStructure() {
  const services = [
    {
      name: 'chatbot/',
      path: '../chatbot',
      key_files: ['src/index.ts', 'src/actions/uniacc-scripts.ts', 'src/data/programas-uniacc.ts']
    },
    {
      name: 'dashboard/',
      path: '../dashboard', 
      key_files: ['src/main.ts', 'server.js', 'src/composables/useChat.ts']
    }
  ];
  
  services.forEach(service => {
    console.log(`  📂 ${service.name}`);
    service.key_files.forEach(file => {
      const fullPath = path.join(service.path, file);
      if (fs.existsSync(fullPath)) {
        console.log(`    ✅ ${file}`);
      } else {
        console.log(`    ❌ ${file} (no encontrado)`);
      }
    });
  });
}

function showCriticalFiles() {
  const criticalFiles = [
    {
      path: '../chatbot/src/actions/uniacc-scripts.ts',
      description: 'Lógica principal del bot - 5 flujos conversacionales'
    },
    {
      path: '../chatbot/src/data/programas-uniacc.ts', 
      description: 'Datos oficiales UNIACC - facultades y carreras'
    },
    {
      path: '../dashboard/server.js',
      description: 'API Server - integración con Supabase'
    },
    {
      path: '../dashboard/src/composables/useChat.ts',
      description: 'Lógica del chat en tiempo real'
    },
    {
      path: '../arquitectura.md',
      description: 'Documentación técnica completa'
    }
  ];
  
  criticalFiles.forEach(file => {
    if (fs.existsSync(file.path)) {
      console.log(`  ✅ ${file.path}`);
      console.log(`      └─ ${file.description}`);
    } else {
      console.log(`  ⚠️ ${file.path} (verificar ubicación)`);
    }
  });
}

// NUEVA FUNCIÓN: Mostrar archivos dinámicos
function showDynamicFiles() {
  const dynamicFiles = [
    {
      path: './log_chatbot.txt',
      description: 'Logs tiempo real ChatBot Backend (Puerto 3001)',
      type: 'logs'
    },
    {
      path: './log_dashboard_api.txt',
      description: 'Logs tiempo real Dashboard + API (Puertos 3000/3002)', 
      type: 'logs'
    },
    {
      path: './supabase_config_actual.sql',
      description: 'Schema actualizado BD con constraints y RPC functions',
      type: 'database'
    }
  ];
  
  dynamicFiles.forEach(file => {
    if (fs.existsSync(file.path)) {
      const stats = fs.statSync(file.path);
      const lastModified = stats.mtime.toLocaleString();
      const sizeKB = Math.round(stats.size / 1024);
      
      console.log(`  📊 ${file.path} (${sizeKB}KB)`);
      console.log(`      └─ ${file.description}`);
      console.log(`      └─ Actualizado: ${lastModified}`);
      
      if (file.type === 'logs') {
        // Mostrar últimas líneas de logs si existen
        try {
          const content = fs.readFileSync(file.path, 'utf8');
          const lines = content.split('\n').filter(line => line.trim());
          const recentLines = lines.slice(-3);
          if (recentLines.length > 0) {
            console.log(`      └─ Últimas entradas:`);
            recentLines.forEach(line => {
              const shortLine = line.length > 60 ? line.substring(0, 60) + '...' : line;
              console.log(`          ${shortLine}`);
            });
          }
        } catch (err) {
          console.log(`      └─ No se pudieron leer logs recientes`);
        }
      }
      
      if (file.type === 'database') {
        // Mostrar info del schema
        try {
          const content = fs.readFileSync(file.path, 'utf8');
          const tableCount = (content.match(/create table/gi) || []).length;
          const constraintCount = (content.match(/constraint/gi) || []).length;
          const rpcCount = (content.match(/create.*function/gi) || []).length;
          
          console.log(`      └─ Tablas: ${tableCount}, Constraints: ${constraintCount}, RPC: ${rpcCount}`);
        } catch (err) {
          console.log(`      └─ No se pudo analizar schema`);
        }
      }
    } else {
      console.log(`  ⚠️ ${file.path} (archivo dinámico no encontrado)`);
      console.log(`      └─ ${file.description}`);
      console.log(`      └─ Se creará cuando sea necesario para debugging`);
    }
  });
}

function showQuickCommands() {
  console.log('  🚀 npm run dev (en cada carpeta para levantar servicios)');
  console.log('  🧪 Probar chat: http://localhost:3001/chat');
  console.log('  📊 Dashboard: http://localhost:3000');  
  console.log('  🔍 Health checks: /health en cada puerto');
  console.log('  📈 Stats del bot: http://localhost:3001/stats');
  console.log('\n📊 COMANDOS DE DEBUGGING:');
  console.log('  📋 npm run debug-logs (ver logs recientes)');
  console.log('  🏥 npm run check-services (verificar servicios)');
  console.log('  🧪 npm run test-chat (abrir interfaz de testing)');
  console.log('  📈 npm run pre-testing (contexto + health check)');
  console.log('  🔍 npm run analyze-errors (buscar errores en logs)');
}

// Función para mostrar health status
function checkServicesHealth() {
  console.log('\n🏥 VERIFICANDO SALUD DE SERVICIOS...\n');
  
  const services = [
    { name: 'ChatBot Backend', url: 'http://localhost:3001/health' },
    { name: 'Dashboard Frontend', url: 'http://localhost:3000' },
    { name: 'Dashboard API', url: 'http://localhost:3002/health' }
  ];
  
  services.forEach(service => {
    console.log(`🔗 ${service.name}: ${service.url}`);
  });
  
  console.log('\n💡 TIP: Abre estas URLs para verificar que los servicios estén corriendo');
  console.log('💡 TIP: Usa "npm run debug-logs" para ver logs recientes de todos los servicios');
  console.log('💡 TIP: Usa "npm run analyze-errors" para buscar errores específicos');
}

// Función principal
function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--health')) {
    checkServicesHealth();
  } else {
    showProjectContext();
  }
  
  console.log('\n🎯 ¡Contexto cargado! Claude Code está listo para trabajar en UNIACC ChatBot');
  console.log('   📚 Consulta .claude/CLAUDE.md para memory bank principal');
  console.log('   📊 Usa archivos dinámicos (.claude/log_*.txt) para debugging en tiempo real');
  console.log('   🔧 Comandos disponibles: /project-status, /analyze-logs, /uniacc-system-audit\n');
}

// Ejecutar
main();