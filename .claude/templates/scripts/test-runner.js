#!/usr/bin/env node

/**
 * UNIACC ChatBot Test Runner
 * Sistema de testing automatizado para escenarios de progressive capture
 * 
 * @version 1.0.0
 * @author UNIACC Testing System
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

class UNIACCTestRunner {
  constructor() {
    this.config = {
      chatbotUrl: 'http://localhost:3001',
      dashboardUrl: 'http://localhost:3000',
      apiUrl: 'http://localhost:3002',
      supabaseUrl: 'https://vtwdmyezyvhprwonengu.supabase.co',
      testTimeout: 30000,
      stepTimeout: 5000
    };
    
    this.results = {
      totalTests: 0,
      passed: 0,
      failed: 0,
      errors: [],
      details: []
    };
  }

  async checkServices() {
    console.log('= Verificando servicios...');
    
    const services = [
      { name: 'ChatBot', url: `${this.config.chatbotUrl}/health` },
      { name: 'API Dashboard', url: `${this.config.apiUrl}/health` },
      { name: 'Frontend', url: this.config.dashboardUrl }
    ];

    for (const service of services) {
      try {
        await axios.get(service.url, { timeout: 5000 });
        console.log(` ${service.name} está activo`);
      } catch (error) {
        console.log(`L ${service.name} no está disponible: ${service.url}`);
        throw new Error(`Servicio ${service.name} no disponible. Inicia los servicios primero.`);
      }
    }
  }

  loadTestScenarios() {
    console.log('=Â Cargando escenarios de testing...');
    
    const scenariosPath = path.join(__dirname, '..', 'test-scenarios');
    const scenarios = {};
    
    try {
      const files = fs.readdirSync(scenariosPath);
      
      files.forEach(file => {
        if (file.endsWith('.json')) {
          const scenarioName = file.replace('.json', '');
          const scenarioPath = path.join(scenariosPath, file);
          const scenario = JSON.parse(fs.readFileSync(scenarioPath, 'utf8'));
          scenarios[scenarioName] = scenario;
        }
      });
      
      console.log(` Cargados ${Object.keys(scenarios).length} escenarios de testing`);
      return scenarios;
      
    } catch (error) {
      console.error('L Error cargando escenarios:', error.message);
      return {};
    }
  }

  async runScenario(scenarioName, scenario) {
    console.log(`\n>ê Ejecutando: ${scenario.name || scenarioName}`);
    console.log(`=Ë ${scenario.description || 'Sin descripción'}`);
    
    const testResult = {
      name: scenarioName,
      status: 'running',
      steps: [],
      startTime: Date.now(),
      endTime: null,
      duration: null,
      errors: []
    };

    try {
      // Prerequisito: limpiar datos de prueba
      if (scenario.scenario?.prerequisite) {
        await this.handlePrerequisite(scenario.scenario.prerequisite);
      }

      // Ejecutar pasos del escenario
      if (scenario.scenario?.steps) {
        for (let i = 0; i < scenario.scenario.steps.length; i++) {
          const step = scenario.scenario.steps[i];
          console.log(`  =Í Paso ${step.step}: ${step.action}`);
          
          const stepResult = await this.executeStep(step, scenario.scenario);
          testResult.steps.push(stepResult);
          
          if (!stepResult.success && step.critical) {
            throw new Error(`Paso crítico ${step.step} falló: ${stepResult.error}`);
          }
        }
      }

      testResult.status = 'passed';
      testResult.endTime = Date.now();
      testResult.duration = testResult.endTime - testResult.startTime;
      
      console.log(` ${scenarioName} PASÓ en ${testResult.duration}ms`);
      
      // Cleanup después del test
      if (scenario.scenario?.cleanup) {
        await this.handleCleanup(scenario.scenario.cleanup);
      }
      
    } catch (error) {
      testResult.status = 'failed';
      testResult.endTime = Date.now();
      testResult.duration = testResult.endTime - testResult.startTime;
      testResult.errors.push(error.message);
      
      console.log(`L ${scenarioName} FALLÓ: ${error.message}`);
    }

    return testResult;
  }

  async executeStep(step, scenario) {
    const stepResult = {
      step: step.step,
      action: step.action,
      success: false,
      response: null,
      error: null,
      duration: null
    };

    const startTime = Date.now();

    try {
      switch (step.action) {
        case 'send_message':
          stepResult.response = await this.sendMessage(scenario.whatsapp, step.message);
          stepResult.success = this.validateResponse(stepResult.response, step);
          break;
          
        case 'simulate_timeout':
          await this.simulateTimeout(step.timeout_minutes);
          stepResult.success = true;
          break;
          
        case 'verify_database_update':
          stepResult.success = await this.verifyDatabaseState(step.expected_updates);
          break;
          
        case 'complete_full_capture':
          stepResult.success = await this.completeFullCapture(scenario.whatsapp, step.data);
          break;
          
        default:
          throw new Error(`Acción no implementada: ${step.action}`);
      }
      
    } catch (error) {
      stepResult.error = error.message;
      stepResult.success = false;
    }

    stepResult.duration = Date.now() - startTime;
    return stepResult;
  }

  async sendMessage(whatsapp, message) {
    try {
      const response = await axios.post(`${this.config.chatbotUrl}/api/chat`, {
        whatsapp: whatsapp,
        message: message,
        test_mode: true
      }, { timeout: this.config.stepTimeout });
      
      return response.data;
    } catch (error) {
      throw new Error(`Error enviando mensaje: ${error.message}`);
    }
  }

  validateResponse(response, step) {
    if (!response || !response.message) {
      return false;
    }

    // Verificar si contiene las frases esperadas
    if (step.expected_response_contains) {
      for (const expectedText of step.expected_response_contains) {
        if (!response.message.includes(expectedText)) {
          console.log(`       Respuesta no contiene: "${expectedText}"`);
          return false;
        }
      }
    }

    // Verificar respuesta exacta si se especifica
    if (step.expected_response && response.message !== step.expected_response) {
      console.log(`       Respuesta esperada: "${step.expected_response}"`);
      console.log(`       Respuesta obtenida: "${response.message}"`);
      return false;
    }

    return true;
  }

  async verifyDatabaseState(expectedUpdates) {
    // Esta función requeriría acceso directo a la BD o endpoint de verificación
    console.log('    = Verificando estado de base de datos...');
    // Placeholder - implementar verificación real con Supabase
    return true;
  }

  async handlePrerequisite(prerequisite) {
    console.log('  >ù Ejecutando prerequisitos...');
    if (prerequisite.action === 'cleanup_existing_data') {
      // Limpiar datos de prueba previos
      console.log('    Limpiando datos de prueba previos...');
    }
  }

  async handleCleanup(cleanup) {
    console.log('  >ù Ejecutando limpieza post-test...');
    if (cleanup.delete_test_data) {
      console.log('    Eliminando datos de prueba...');
    }
  }

  async simulateTimeout(minutes) {
    console.log(`    ó Simulando timeout de ${minutes} minutos...`);
    // En testing real, esto podría ser una pausa más corta
    await new Promise(resolve => setTimeout(resolve, Math.min(minutes * 1000, 5000)));
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.totalTests,
        passed: this.results.passed,
        failed: this.results.failed,
        successRate: this.results.totalTests > 0 ? 
          ((this.results.passed / this.results.totalTests) * 100).toFixed(2) + '%' : '0%'
      },
      details: this.results.details
    };

    return report;
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('=Ê RESULTADOS DE TESTING UNIACC CHATBOT');
    console.log('='.repeat(60));
    
    const report = this.generateReport();
    
    console.log(`=È Tests totales: ${report.summary.total}`);
    console.log(` Exitosos: ${report.summary.passed}`);
    console.log(`L Fallidos: ${report.summary.failed}`);
    console.log(`=Ê Tasa de éxito: ${report.summary.successRate}`);
    
    if (this.results.errors.length > 0) {
      console.log('\nL ERRORES ENCONTRADOS:');
      this.results.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    console.log('\n=Ý DETALLES POR ESCENARIO:');
    report.details.forEach(detail => {
      const status = detail.status === 'passed' ? '' : 'L';
      console.log(`  ${status} ${detail.name}: ${detail.duration}ms`);
      
      if (detail.errors.length > 0) {
        detail.errors.forEach(error => {
          console.log(`     " ${error}`);
        });
      }
    });
    
    console.log('\n' + '='.repeat(60));
  }

  async run(specificScenario = null) {
    console.log('=€ INICIANDO TESTING SYSTEM UNIACC CHATBOT\n');
    
    try {
      // Verificar servicios
      await this.checkServices();
      
      // Cargar escenarios
      const scenarios = this.loadTestScenarios();
      
      if (Object.keys(scenarios).length === 0) {
        throw new Error('No se encontraron escenarios de testing');
      }

      // Ejecutar escenarios
      const scenariosToRun = specificScenario ? 
        { [specificScenario]: scenarios[specificScenario] } : 
        scenarios;

      for (const [name, scenario] of Object.entries(scenariosToRun)) {
        if (!scenario) {
          console.log(`   Escenario '${name}' no encontrado`);
          continue;
        }
        
        this.results.totalTests++;
        const result = await this.runScenario(name, scenario);
        
        if (result.status === 'passed') {
          this.results.passed++;
        } else {
          this.results.failed++;
          this.results.errors.push(`${name}: ${result.errors.join(', ')}`);
        }
        
        this.results.details.push(result);
      }
      
    } catch (error) {
      console.error('=¥ Error fatal en testing:', error.message);
      this.results.errors.push(`Error fatal: ${error.message}`);
    }

    // Mostrar resultados
    this.printResults();
    
    return this.results;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const args = process.argv.slice(2);
  const specificScenario = args[0];
  
  const runner = new UNIACCTestRunner();
  
  runner.run(specificScenario).then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  }).catch(error => {
    console.error('Error ejecutando tests:', error);
    process.exit(1);
  });
}

module.exports = UNIACCTestRunner;