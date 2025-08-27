const fs = require('fs');
const path = require('path');

/**
 * Script para actualizar el contexto de Claude Code
 * Uso: node scripts/update-context.js [--task "descripción"] [--completed "tarea completada"]
 */

function updateProjectContext() {
  const contextPath = path.join(__dirname, './project-context.json');
  
  try {
    // Leer contexto actual
    const context = JSON.parse(fs.readFileSync(contextPath, 'utf8'));
    
    // Actualizar fecha
    context.lastUpdated = new Date().toISOString().split('T')[0];
    
    // Procesar argumentos de línea de comandos
    const args = process.argv.slice(2);
    const taskIndex = args.findIndex(arg => arg === '--task');
    const completedIndex = args.findIndex(arg => arg === '--completed');
    const phaseIndex = args.findIndex(arg => arg === '--phase');
    
    // Agregar nueva tarea en progreso
    if (taskIndex !== -1 && taskIndex + 1 < args.length) {
      const newTask = args[taskIndex + 1];
      if (!context.currentSprint.inProgress.includes(newTask)) {
        context.currentSprint.inProgress.push(newTask);
        console.log(`✅ Agregada tarea en progreso: "${newTask}"`);
      }
    }
    
    // Mover tarea a completadas
    if (completedIndex !== -1 && completedIndex + 1 < args.length) {
      const completedTask = args[completedIndex + 1];
      
      // Buscar en inProgress y mover a completedFeatures
      const inProgressIndex = context.currentSprint.inProgress.findIndex(task => 
        task.toLowerCase().includes(completedTask.toLowerCase())
      );
      
      if (inProgressIndex !== -1) {
        const task = context.currentSprint.inProgress.splice(inProgressIndex, 1)[0];
        context.currentSprint.completedFeatures.push(`✅ ${task}`);
        console.log(`🎉 Tarea completada: "${task}"`);
      } else {
        // Si no está en progreso, agregar directamente a completadas
        context.currentSprint.completedFeatures.push(`✅ ${completedTask}`);
        console.log(`🎉 Nueva funcionalidad completada: "${completedTask}"`);
      }
    }
    
    // Cambiar fase del proyecto
    if (phaseIndex !== -1 && phaseIndex + 1 < args.length) {
      const newPhase = args[phaseIndex + 1];
      context.currentSprint.phase = newPhase;
      console.log(`🚀 Fase actualizada: "${newPhase}"`);
    }
    
    // Detectar cambios automáticos en el proyecto
    detectProjectChanges(context);
    
    // Guardar contexto actualizado
    fs.writeFileSync(contextPath, JSON.stringify(context, null, 2));
    
    console.log(`📅 Contexto actualizado: ${context.lastUpdated}`);
    
    // Actualizar README de Claude
    updateClaudeReadme(context);
    
  } catch (error) {
    console.error('❌ Error actualizando contexto:', error.message);
    process.exit(1);
  }
}

function detectProjectChanges(context) {
  const changes = [];
  
  // Verificar si hay nuevos archivos importantes
  const importantPaths = [
    './chatbot/src/actions/',
    './chatbot/src/data/', 
    './dashboard/src/components/',
    './dashboard/src/composables/',
    './dashboard/src/views/'
  ];
  
  importantPaths.forEach(dirPath => {
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);
      const newFiles = files.filter(file => 
        file.endsWith('.ts') || file.endsWith('.vue')
      );
      
      if (newFiles.length > 0) {
        changes.push(`Detectados ${newFiles.length} archivos en ${dirPath}`);
      }
    }
  });
  
  // Verificar package.json para nuevas dependencias
  const packagePaths = ['../chatbot/package.json', '../dashboard/package.json'];
  packagePaths.forEach(pkgPath => {
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const depCount = Object.keys(pkg.dependencies || {}).length + 
                      Object.keys(pkg.devDependencies || {}).length;
      
      if (depCount > 10) { // Threshold arbitrario
        changes.push(`${depCount} dependencias en ${pkgPath}`);
      }
    }
  });
  
  if (changes.length > 0) {
    console.log('\n🔍 Cambios detectados automáticamente:');
    changes.forEach(change => console.log(`  - ${change}`));
  }
}

function updateClaudeReadme(context) {
  const readmePath = path.join(__dirname, './README.md');
  
  try {
    let readmeContent = fs.readFileSync(readmePath, 'utf8');
    
    // Actualizar fecha en README
    readmeContent = readmeContent.replace(
      /- \*\*Última sesión\*\*: \d{4}-\d{2}-\d{2}/,
      `- **Última sesión**: ${context.lastUpdated}`
    );
    
    // Actualizar fase actual
    readmeContent = readmeContent.replace(
      /- \*\*Fase\*\*: .*/,
      `- **Fase**: ${context.currentSprint.phase}`
    );
    
    fs.writeFileSync(readmePath, readmeContent);
    console.log('📝 README de Claude actualizado');
    
  } catch (error) {
    console.log('⚠️ No se pudo actualizar el README de Claude');
  }
}

function showUsage() {
  console.log(`
🎯 Update Context Script - UNIACC ChatBot

Uso:
  node scripts/update-context.js                           # Actualizar solo fecha
  node scripts/update-context.js --task "Nueva funcionalidad"     # Agregar tarea en progreso  
  node scripts/update-context.js --completed "Integración API"    # Marcar tarea como completada
  node scripts/update-context.js --phase "Deploy a producción"    # Cambiar fase del proyecto

Ejemplos:
  node scripts/update-context.js --task "Agregar WebSockets al dashboard"
  node scripts/update-context.js --completed "Tests automatizados"
  node scripts/update-context.js --phase "Producción - Deploy AWS"
  
📚 El contexto se guarda en .claude/project-context.json
  `);
}

function generateProgressReport() {
  const contextPath = path.join(__dirname, './project-context.json');
  
  if (!fs.existsSync(contextPath)) {
    console.log('❌ No se encontró el archivo de contexto');
    return;
  }
  
  const context = JSON.parse(fs.readFileSync(contextPath, 'utf8'));
  
  console.log('\n📊 REPORTE DE PROGRESO - UNIACC CHATBOT\n');
  console.log(`🎯 Fase actual: ${context.currentSprint.phase}`);
  console.log(`📅 Última actualización: ${context.lastUpdated}\n`);
  
  console.log(`✅ COMPLETADO (${context.currentSprint.completedFeatures.length} items):`);
  context.currentSprint.completedFeatures.forEach((feature, index) => {
    console.log(`  ${index + 1}. ${feature}`);
  });
  
  if (context.currentSprint.inProgress.length > 0) {
    console.log(`\n🔄 EN PROGRESO (${context.currentSprint.inProgress.length} items):`);
    context.currentSprint.inProgress.forEach((task, index) => {
      console.log(`  ${index + 1}. ${task}`);
    });
  }
  
  if (context.currentSprint.nextPhase.length > 0) {
    console.log(`\n🔮 PRÓXIMA FASE (${context.currentSprint.nextPhase.length} items):`);
    context.currentSprint.nextPhase.forEach((task, index) => {
      console.log(`  ${index + 1}. ${task}`);
    });
  }
}

// Función principal
function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    showUsage();
  } else if (args.includes('--report')) {
    generateProgressReport();
  } else {
    updateProjectContext();
  }
}

// Ejecutar
main();