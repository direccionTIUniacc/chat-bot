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

function showQuickCommands() {
  console.log('  🚀 npm run dev (en cada carpeta para levantar servicios)');
  console.log('  🧪 Probar chat: http://localhost:3001/chat');
  console.log('  📊 Dashboard: http://localhost:3000');  
  console.log('  🔍 Health checks: /health en cada puerto');
  console.log('  📈 Stats del bot: http://localhost:3001/stats');
}

// Función para mostrar health status
function checkServicesHealth() {
  console.log('\n🏥 VERIFICANDO SALUD DE SERVICIOS...\n');
  
  const services = [
    { name: 'ChatBot Backend', url: 'http://localhost:3001/health' },
    { name: 'Dashboard Frontend', url: 'http://localhost:3000' },
    { name: 'Dashboard API', url: 'http://localhost:3002/health' }
  ];
  
  // Esta función podría hacer requests HTTP para verificar
  // pero por ahora solo muestra las URLs a verificar
  services.forEach(service => {
    console.log(`🔗 ${service.name}: ${service.url}`);
  });
  
  console.log('\n💡 TIP: Abre estas URLs para verificar que los servicios estén corriendo');
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
  console.log('   📚 Consulta .claude/README.md para más detalles técnicos\n');
}

// Ejecutar
main();