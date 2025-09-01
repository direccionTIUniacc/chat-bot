// TypeScript para Chat Demo UNIACC
// Compilar con: tsc src/frontend/chat-demo.ts --outDir public/js --target ES2020

interface ChatResponse {
  status: string;
  demo: boolean;
  conversation: {
    phone: string;
    user_message: string;
    bot_response: string;
    timestamp: string;
  };
  prospecto: {
    data: any;
    guardado: boolean;
    id: string | null;
  };
}

interface TimeoutCheckResponse {
  status: 'warning' | 'timeout' | 'active';
  message: string | null;
  timestamp: string;
}

interface ForceTimeoutResponse {
  status: string;
  message: string;
  phone: string;
  timestamp: string;
}

interface TestResult {
  success: boolean;
  duration: number;
  responses?: string[];
  error?: string;
  userId?: string;
}

interface ConcurrentTestResult {
  totalUsers: number;
  successfulUsers: number;
  failedUsers: number;
  totalDuration: number;
  throughput: number;
  results: TestResult[];
}

interface TestMetrics {
  totalTests: number;
  successRate: number;
  avgResponseTime: number;
  concurrentActive: number;
}

interface FlowTestCase {
  name: string;
  flowType: string;
  messages: string[];
  expectedKeywords: string[];
  description: string;
}

class UNIACCChatDemo {
  private currentPhone: string;
  private currentUserId: string | null = null;
  private timeoutCheckInterval: number | null = null;
  private resultsDiv!: HTMLElement;
  private messageInput!: HTMLInputElement;
  private sendBtn!: HTMLButtonElement;
  private testButtonsContainer!: HTMLElement;
  
  // Testing Panel Elements
  private testLogsDiv!: HTMLElement;
  private testStatusDiv!: HTMLElement;
  private stopTestsBtn!: HTMLElement;
  private testHistoryDiv!: HTMLElement;
  
  // Metrics Elements
  private totalTestsSpan!: HTMLElement;
  private successRateSpan!: HTMLElement;
  private avgResponseTimeSpan!: HTMLElement;
  private concurrentActiveSpan!: HTMLElement;
  
  // Testing State
  private currentTests: Map<string, any> = new Map();
  private testMetrics: TestMetrics = {
    totalTests: 0,
    successRate: 0,
    avgResponseTime: 0,
    concurrentActive: 0
  };
  private isTestingMode: boolean = false;
  
  // Flow Test Definitions
  private flowTestCases: Map<string, FlowTestCase> = new Map();

  constructor() {
    this.currentPhone = '56912345809';
    this.initializeElements();
    this.setupEventListeners();
    this.setupTabs();
    this.createTestButtons();
    this.setupTestingPanel();
    this.initializeFlowTests();
    
    console.log('🚀 [CHAT-DEMO] UNIACC Chat Demo inicializado');
    console.log(`📱 [CHAT-DEMO] Teléfono asignado: ${this.currentPhone}`);
  }

  private initializeElements(): void {
    // Chat elements
    this.resultsDiv = document.getElementById('results') as HTMLElement;
    this.messageInput = document.getElementById('messageInput') as HTMLInputElement;
    this.sendBtn = document.getElementById('sendBtn') as HTMLButtonElement;
    this.testButtonsContainer = document.getElementById('testButtons') as HTMLElement;

    // Testing panel elements
    this.testLogsDiv = document.getElementById('testLogs') as HTMLElement;
    this.testStatusDiv = document.getElementById('testStatus') as HTMLElement;
    this.stopTestsBtn = document.getElementById('stopTests') as HTMLElement;
    this.testHistoryDiv = document.getElementById('testHistory') as HTMLElement;

    // Metrics elements
    this.totalTestsSpan = document.getElementById('totalTests') as HTMLElement;
    this.successRateSpan = document.getElementById('successRate') as HTMLElement;
    this.avgResponseTimeSpan = document.getElementById('avgResponseTime') as HTMLElement;
    this.concurrentActiveSpan = document.getElementById('concurrentActive') as HTMLElement;

    if (!this.resultsDiv || !this.messageInput || !this.sendBtn) {
      throw new Error('Elementos del DOM principales no encontrados');
    }

    // Auto-focus en el input
    this.messageInput.focus();
  }

  private setupEventListeners(): void {
    // Click en botón enviar
    this.sendBtn.addEventListener('click', () => this.sendMessage());

    // Enter key support
    this.messageInput.addEventListener('keypress', (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        this.sendMessage();
      }
    });
  }

  private async sendMessage(): Promise<void> {
    const message = this.messageInput.value.trim();
    if (!message) return;

    // Iniciar polling de timeout si es el primer mensaje
    if (message.toLowerCase() === 'hola' || message.toLowerCase() === 'hi') {
      console.log('🚀 [INIT] Iniciando polling de timeout...');
      setTimeout(() => {
        this.startTimeoutChecking();
      }, 1000);
    }

    this.messageInput.value = '';
    this.messageInput.disabled = true;
    this.sendBtn.disabled = true;

    try {
      const response = await fetch('/test-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: this.currentPhone, 
          message 
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ChatResponse = await response.json();
      this.addChatMessage(data);

    } catch (error) {
      console.error('❌ [SEND-MESSAGE] Error:', error);
      this.addErrorMessage('No se pudo enviar el mensaje: ' + (error as Error).message);
    } finally {
      this.messageInput.disabled = false;
      this.sendBtn.disabled = false;
      this.messageInput.focus();
    }
  }

  private addChatMessage(data: ChatResponse): void {
    const div = document.createElement('div');
    div.className = 'chat-message space-y-2';
    
    div.innerHTML = `
      <div class="message-bubble-user">
        <div class="text-sm text-gray-800">${this.escapeHtml(data.conversation.user_message)}</div>
        <div class="message-time text-right">Tú</div>
      </div>
      <div class="message-bubble-bot">
        <div class="text-sm text-gray-800 whitespace-pre-line">${this.escapeHtml(data.conversation.bot_response)}</div>
        <div class="message-time">ChatBot UNIACC 🤖</div>
      </div>
    `;
    
    this.resultsDiv.appendChild(div);
    this.scrollToBottom();
  }

  private addTimeoutMessage(message: string, type: 'warning' | 'timeout'): void {
    const div = document.createElement('div');
    div.className = 'chat-message';
    
    const emoji = type === 'warning' ? '⚠️' : '⏰';
    const title = type === 'warning' ? 'Advertencia de Timeout' : 'Sesión Finalizada';
    
    div.innerHTML = `
      <div class="message-bubble-bot border-l-4 ${type === 'warning' ? 'border-yellow-400 bg-yellow-50' : 'border-red-400 bg-red-50'}">
        <div class="text-sm font-semibold text-gray-800 mb-1">${emoji} ${title}</div>
        <div class="text-sm text-gray-800 whitespace-pre-line">${this.escapeHtml(message)}</div>
        <div class="message-time">Sistema Automático 🤖</div>
      </div>
    `;
    
    this.resultsDiv.appendChild(div);
    this.scrollToBottom();
  }

  private addErrorMessage(error: string): void {
    const div = document.createElement('div');
    div.className = 'chat-message';
    
    div.innerHTML = `
      <div class="message-bubble-bot border-l-4 border-red-400 bg-red-50">
        <div class="text-sm text-red-800">❌ Error: ${this.escapeHtml(error)}</div>
        <div class="message-time">Sistema</div>
      </div>
    `;
    
    this.resultsDiv.appendChild(div);
    this.scrollToBottom();
  }

  private startTimeoutChecking(): void {
    console.log(`🚀 [TIMEOUT-INIT] Iniciando timeout checking para: ${this.currentPhone}`);
    
    this.currentUserId = this.currentPhone;
    
    // Verificar cada 3 segundos
    this.timeoutCheckInterval = window.setInterval(() => {
      this.checkForTimeoutMessages();
    }, 3000);
    
    console.log(`⏰ [POLLING] Sistema iniciado - Verificando cada 3s - Interval ID: ${this.timeoutCheckInterval}`);
  }

  private async checkForTimeoutMessages(): Promise<void> {
    if (!this.currentUserId) {
      console.log('🔍 [POLLING] Sin usuario activo - saltando verificación');
      return;
    }

    console.log(`🔍 [POLLING] Verificando timeouts para: ${this.currentUserId}`);

    try {
      const response = await fetch(`/check-timeout/${this.currentUserId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: TimeoutCheckResponse = await response.json();
      console.log('🔍 [POLLING] Respuesta del servidor:', data);

      if (data.status === 'warning' || data.status === 'timeout') {
        console.log(`🎯 [POLLING] ¡Mensaje encontrado! Tipo: ${data.status}`);
        
        if (data.message) {
          this.addTimeoutMessage(data.message, data.status);
          console.log(`⚠️ [TIMEOUT] Mensaje mostrado - Tipo: ${data.status} - Usuario: ${this.currentUserId}`);
        }
        
        // Si es timeout final, detener el polling
        if (data.status === 'timeout') {
          console.log('⏰ [TIMEOUT-FINAL] Deteniendo polling - sesión terminada');
          this.stopTimeoutChecking();
        }
      } else {
        console.log('🔍 [POLLING] Sin mensajes pendientes');
      }

    } catch (error) {
      console.error('🔍 [POLLING] Error verificando timeout:', error);
    }
  }

  private stopTimeoutChecking(): void {
    if (this.timeoutCheckInterval) {
      clearInterval(this.timeoutCheckInterval);
      this.timeoutCheckInterval = null;
    }
    this.currentUserId = null;
    console.log('⏰ [POLLING] Sistema de timeout detenido');
  }

  private createTestButtons(): void {
    // Botón para forzar timeout
    const forceTimeoutBtn = document.createElement('button');
    forceTimeoutBtn.textContent = '🧪 Forzar Timeout';
    forceTimeoutBtn.className = 'px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 mr-2';
    forceTimeoutBtn.onclick = () => this.forceTimeout();

    // Botón para test polling
    const testPollingBtn = document.createElement('button');
    testPollingBtn.textContent = '🔍 Test Polling';
    testPollingBtn.className = 'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2';
    testPollingBtn.onclick = () => this.testPolling();

    // Botón para limpiar chat
    const clearChatBtn = document.createElement('button');
    clearChatBtn.textContent = '🧹 Limpiar Chat';
    clearChatBtn.className = 'px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600';
    clearChatBtn.onclick = () => this.clearChat();

    this.testButtonsContainer.appendChild(forceTimeoutBtn);
    this.testButtonsContainer.appendChild(testPollingBtn);
    this.testButtonsContainer.appendChild(clearChatBtn);
  }

  private async forceTimeout(): Promise<void> {
    if (!this.currentUserId) {
      alert('Inicia una conversación primero escribiendo "hola"');
      return;
    }

    try {
      const response = await fetch(`/force-timeout/${this.currentUserId}`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ForceTimeoutResponse = await response.json();
      console.log('🧪 [FORCE-TIMEOUT] Respuesta:', data);

      if (data.message) {
        this.addTimeoutMessage(data.message, 'timeout');
        this.stopTimeoutChecking();
      }

    } catch (error) {
      console.error('🧪 [FORCE-TIMEOUT] Error:', error);
      alert('Error forzando timeout: ' + (error as Error).message);
    }
  }

  private async testPolling(): Promise<void> {
    const testPhone = this.currentUserId || this.currentPhone;
    console.log(`🔍 [TEST] Testeando polling manual para: ${testPhone}`);

    try {
      const response = await fetch(`/check-timeout/${testPhone}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: TimeoutCheckResponse = await response.json();
      console.log('🔍 [TEST] Respuesta del endpoint:', data);

      if (data.message) {
        alert(`Mensaje encontrado: ${data.message.substring(0, 50)}...`);
        this.addTimeoutMessage(data.message, data.status as 'warning' | 'timeout');
      } else {
        alert('No hay mensajes pendientes');
      }

    } catch (error) {
      console.error('🔍 [TEST] Error:', error);
      alert('Error testeando polling: ' + (error as Error).message);
    }
  }

  private clearChat(): void {
    this.resultsDiv.innerHTML = `
      <div class="text-center text-gray-500 text-sm">
        💬 Chat limpiado. Escribe "hola" para comenzar...
      </div>
    `;
    this.stopTimeoutChecking();
    console.log('🧹 [CLEAR] Chat limpiado');
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      this.resultsDiv.scrollTop = this.resultsDiv.scrollHeight;
    }, 100);
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ==========================================
  // TESTING PANEL FUNCTIONALITY
  // ==========================================

  private setupTabs(): void {
    const chatTab = document.getElementById('chatTab');
    const testingTab = document.getElementById('testingTab');
    const metricsTab = document.getElementById('metricsTab');
    
    const chatContent = document.getElementById('chatContent');
    const testingContent = document.getElementById('testingContent');
    const metricsContent = document.getElementById('metricsContent');

    if (!chatTab || !testingTab || !metricsTab || !chatContent || !testingContent || !metricsContent) {
      console.warn('⚠️ [TABS] Algunos elementos de pestañas no encontrados');
      return;
    }

    chatTab.addEventListener('click', () => {
      this.switchTab('chat', chatTab, [testingTab, metricsTab], chatContent, [testingContent, metricsContent]);
    });

    testingTab.addEventListener('click', () => {
      this.switchTab('testing', testingTab, [chatTab, metricsTab], testingContent, [chatContent, metricsContent]);
    });

    metricsTab.addEventListener('click', () => {
      this.switchTab('metrics', metricsTab, [chatTab, testingTab], metricsContent, [chatContent, testingContent]);
    });
  }

  private switchTab(tabName: string, activeTab: HTMLElement, otherTabs: HTMLElement[], activeContent: HTMLElement, otherContents: HTMLElement[]): void {
    // Update tab styles
    activeTab.className = 'flex-1 p-4 text-center font-semibold border-b-2 border-blue-500 text-blue-600 bg-blue-50';
    otherTabs.forEach(tab => {
      tab.className = 'flex-1 p-4 text-center font-semibold border-b-2 border-transparent text-gray-600 hover:text-gray-800';
    });

    // Show/hide content
    activeContent.classList.remove('hidden');
    otherContents.forEach(content => {
      content.classList.add('hidden');
    });

    console.log(`🔄 [TABS] Switched to ${tabName} tab`);
  }

  private setupTestingPanel(): void {
    // Testing control buttons
    const testBasicBtn = document.getElementById('testBasic');
    const testPerformanceBtn = document.getElementById('testPerformance');
    const testConcurrentBtn = document.getElementById('testConcurrent');
    const clearLogsBtn = document.getElementById('clearLogs');

    testBasicBtn?.addEventListener('click', () => this.runBasicTest());
    testPerformanceBtn?.addEventListener('click', () => this.runPerformanceTest());
    testConcurrentBtn?.addEventListener('click', () => this.runConcurrentTest());
    clearLogsBtn?.addEventListener('click', () => this.clearTestLogs());
    this.stopTestsBtn?.addEventListener('click', () => this.stopAllTests());

    // Flow-specific test buttons
    document.getElementById('testCapturaInicial')?.addEventListener('click', () => this.runFlowTest('captura_inicial'));
    document.getElementById('testMenuPrincipal')?.addEventListener('click', () => this.runFlowTest('menu_principal'));
    document.getElementById('testExploracionCarreras')?.addEventListener('click', () => this.runFlowTest('exploracion_carreras'));
    document.getElementById('testDetalleCarrera')?.addEventListener('click', () => this.runFlowTest('detalle_carrera'));
    document.getElementById('testProcesoAdmision')?.addEventListener('click', () => this.runFlowTest('proceso_admision'));
    document.getElementById('testBusquedaDirecta')?.addEventListener('click', () => this.runFlowTest('busqueda_directa'));
    document.getElementById('testCostosBecas')?.addEventListener('click', () => this.runFlowTest('costos_becas'));
    document.getElementById('testModalidades')?.addEventListener('click', () => this.runFlowTest('modalidades'));
    document.getElementById('testMenuContextual')?.addEventListener('click', () => this.runFlowTest('menu_contextual'));
    document.getElementById('testCapturaAsesor')?.addEventListener('click', () => this.runFlowTest('captura_asesor'));

    console.log('🧪 [TESTING] Panel de testing configurado con flujos específicos');
  }

  private async runBasicTest(): Promise<void> {
    this.logToTestPanel('🧪 Iniciando test básico...', 'info');
    this.updateTestStatus('🧪 Ejecutando test básico...', true);

    try {
      const result = await this.executeBasicTest();
      
      if (result.success) {
        this.logToTestPanel(`✅ Test básico exitoso (${result.duration}ms)`, 'success');
        this.addToTestHistory(`Test Básico`, true, result.duration);
      } else {
        this.logToTestPanel(`❌ Test básico falló: ${result.error}`, 'error');
        this.addToTestHistory(`Test Básico`, false, result.duration);
      }

      this.updateMetrics();
      
    } catch (error) {
      this.logToTestPanel(`💥 Error ejecutando test básico: ${error}`, 'error');
    } finally {
      this.updateTestStatus('⏸️ Sin tests ejecutándose', false);
    }
  }

  private async runPerformanceTest(): Promise<void> {
    this.logToTestPanel('⚡ Iniciando test de performance...', 'info');
    this.updateTestStatus('⚡ Ejecutando test de performance...', true);

    try {
      const iterations = 5;
      const times: number[] = [];
      const testUserId = `perf-test-${Date.now()}`;

      for (let i = 0; i < iterations; i++) {
        this.logToTestPanel(`⚡ Iteración ${i + 1}/${iterations}...`, 'info');
        
        const startTime = performance.now();
        await this.sendTestMessage(testUserId, 'Hola');
        const duration = performance.now() - startTime;
        
        times.push(duration);
        await this.sleep(100); // Small delay between iterations
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);

      this.logToTestPanel(`✅ Performance test completado:`, 'success');
      this.logToTestPanel(`   📊 Promedio: ${avgTime.toFixed(2)}ms`, 'info');
      this.logToTestPanel(`   📈 Máximo: ${maxTime.toFixed(2)}ms`, 'info');
      this.logToTestPanel(`   📉 Mínimo: ${minTime.toFixed(2)}ms`, 'info');
      this.logToTestPanel(`   ⚡ Throughput: ${(1000 / avgTime).toFixed(1)} req/s`, 'info');

      this.addToTestHistory(`Performance Test`, true, avgTime);
      this.updateMetrics();

    } catch (error) {
      this.logToTestPanel(`💥 Error en test de performance: ${error}`, 'error');
    } finally {
      this.updateTestStatus('⏸️ Sin tests ejecutándose', false);
    }
  }

  private async runConcurrentTest(): Promise<void> {
    const concurrentUsersSelect = document.getElementById('concurrentUsers') as HTMLSelectElement;
    const userCount = parseInt(concurrentUsersSelect.value) || 5;

    this.logToTestPanel(`🚀 Iniciando test concurrente con ${userCount} usuarios...`, 'info');
    this.updateTestStatus(`🚀 Ejecutando ${userCount} usuarios concurrentes...`, true);

    try {
      const startTime = Date.now();
      const userPromises: Promise<TestResult>[] = [];

      // Create concurrent users
      for (let i = 0; i < userCount; i++) {
        const userId = `concurrent-user-${i + 1}-${Date.now()}`;
        userPromises.push(this.runConcurrentUserTest(userId, i + 1));
      }

      // Update concurrent active count
      this.testMetrics.concurrentActive = userCount;
      this.updateMetricsDisplay();

      // Wait for all users to complete
      const results = await Promise.all(userPromises);
      const endTime = Date.now();
      const totalDuration = endTime - startTime;

      // Calculate results
      const successfulUsers = results.filter(r => r.success).length;
      const failedUsers = results.filter(r => !r.success).length;
      const throughput = (userCount * 3) / (totalDuration / 1000); // Assuming 3 messages per user

      this.logToTestPanel(`✅ Test concurrente completado:`, 'success');
      this.logToTestPanel(`   👥 Usuarios exitosos: ${successfulUsers}/${userCount}`, 'info');
      this.logToTestPanel(`   ❌ Usuarios fallidos: ${failedUsers}`, failedUsers > 0 ? 'warning' : 'info');
      this.logToTestPanel(`   ⏱️ Duración total: ${totalDuration}ms`, 'info');
      this.logToTestPanel(`   ⚡ Throughput: ${throughput.toFixed(1)} msg/s`, 'info');

      this.addToTestHistory(`${userCount} Usuarios Concurrentes`, successfulUsers === userCount, totalDuration);
      this.updateMetrics();

    } catch (error) {
      this.logToTestPanel(`💥 Error en test concurrente: ${error}`, 'error');
    } finally {
      this.testMetrics.concurrentActive = 0;
      this.updateMetricsDisplay();
      this.updateTestStatus('⏸️ Sin tests ejecutándose', false);
    }
  }

  private async runConcurrentUserTest(userId: string, userNumber: number): Promise<TestResult> {
    const startTime = performance.now();
    
    try {
      this.logToTestPanel(`👤 Usuario ${userNumber}: Iniciando...`, 'info');
      
      // Simulate realistic user flow
      await this.sendTestMessage(userId, 'Hola');
      await this.sleep(500); // User thinking time
      
      await this.sendTestMessage(userId, `Usuario ${userNumber}`);
      await this.sleep(300);
      
      await this.sendTestMessage(userId, `user${userNumber}@test.com`);
      
      const duration = performance.now() - startTime;
      this.logToTestPanel(`✅ Usuario ${userNumber}: Exitoso (${duration.toFixed(0)}ms)`, 'success');
      
      return { success: true, duration, userId };
      
    } catch (error) {
      const duration = performance.now() - startTime;
      this.logToTestPanel(`❌ Usuario ${userNumber}: Error - ${error}`, 'error');
      
      return { 
        success: false, 
        duration, 
        userId, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  }

  private async executeBasicTest(): Promise<TestResult> {
    const startTime = performance.now();
    const testUserId = `basic-test-${Date.now()}`;
    const responses: string[] = [];

    try {
      this.logToTestPanel('📤 Enviando: "Hola"', 'info');
      const response1 = await this.sendTestMessage(testUserId, 'Hola');
      responses.push(response1);

      if (!response1.includes('nombre') && !response1.includes('teléfono')) {
        throw new Error('Primera respuesta no contiene palabras clave esperadas');
      }

      this.logToTestPanel('📤 Enviando: "Test Usuario"', 'info');
      const response2 = await this.sendTestMessage(testUserId, 'Test Usuario');
      responses.push(response2);

      if (!response2.includes('email') && !response2.includes('teléfono')) {
        this.logToTestPanel('ℹ️ Segunda respuesta no tiene flujo esperado, continuando...', 'warning');
      }

      this.logToTestPanel('📤 Enviando: "test@email.com"', 'info');
      const response3 = await this.sendTestMessage(testUserId, 'test@email.com');
      responses.push(response3);

      const duration = performance.now() - startTime;
      return { success: true, duration, responses };

    } catch (error) {
      const duration = performance.now() - startTime;
      return { 
        success: false, 
        duration, 
        responses, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  }

  private async sendTestMessage(userId: string, message: string): Promise<string> {
    const response = await fetch('/test-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        phone: userId, 
        message 
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: ChatResponse = await response.json();
    return data.conversation.bot_response;
  }

  private logToTestPanel(message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info'): void {
    if (!this.testLogsDiv) return;

    const timestamp = new Date().toLocaleTimeString();
    const logLine = document.createElement('div');
    logLine.className = `log-${type}`;
    logLine.innerHTML = `<span class="log-timestamp">[${timestamp}]</span> ${this.escapeHtml(message)}`;
    
    this.testLogsDiv.appendChild(logLine);
    this.testLogsDiv.scrollTop = this.testLogsDiv.scrollHeight;

    // Remove old logs if too many
    const maxLogs = 100;
    const logs = this.testLogsDiv.children;
    if (logs.length > maxLogs) {
      for (let i = 0; i < logs.length - maxLogs; i++) {
        logs[0].remove();
      }
    }
  }

  private clearTestLogs(): void {
    if (!this.testLogsDiv) return;
    this.testLogsDiv.innerHTML = '<div class="text-gray-500">🧪 Logs de testing aparecerán aquí...</div>';
  }

  private updateTestStatus(message: string, isActive: boolean): void {
    if (!this.testStatusDiv || !this.stopTestsBtn) return;

    this.testStatusDiv.innerHTML = isActive ? 
      `<span class="pulse-dot">🔄</span> ${message}` : 
      message;

    if (isActive) {
      this.stopTestsBtn.classList.remove('hidden');
    } else {
      this.stopTestsBtn.classList.add('hidden');
    }

    this.isTestingMode = isActive;
  }

  private stopAllTests(): void {
    this.logToTestPanel('🛑 Deteniendo todos los tests...', 'warning');
    this.currentTests.clear();
    this.testMetrics.concurrentActive = 0;
    this.updateTestStatus('⏸️ Tests detenidos por usuario', false);
    this.updateMetricsDisplay();
  }

  private addToTestHistory(testName: string, success: boolean, duration: number): void {
    if (!this.testHistoryDiv) return;

    const timestamp = new Date().toLocaleTimeString();
    const historyItem = document.createElement('div');
    historyItem.className = 'flex justify-between items-center py-1 px-2 bg-white rounded text-xs border';
    
    const statusIcon = success ? '✅' : '❌';
    const statusColor = success ? 'text-green-600' : 'text-red-600';
    
    historyItem.innerHTML = `
      <span>${statusIcon} ${testName}</span>
      <span class="text-gray-500">${duration.toFixed(0)}ms</span>
      <span class="text-gray-400">${timestamp}</span>
    `;
    
    // Add to beginning
    if (this.testHistoryDiv.firstChild && this.testHistoryDiv.firstChild.textContent?.includes('No hay resultados')) {
      this.testHistoryDiv.innerHTML = '';
    }
    
    this.testHistoryDiv.insertBefore(historyItem, this.testHistoryDiv.firstChild);

    // Keep only last 10 items
    const items = this.testHistoryDiv.children;
    if (items.length > 10) {
      for (let i = 10; i < items.length; i++) {
        items[i].remove();
      }
    }
  }

  private updateMetrics(): void {
    this.testMetrics.totalTests++;
    
    // Calculate success rate based on recent history
    const historyItems = this.testHistoryDiv?.children || [];
    let successCount = 0;
    let totalCount = 0;
    
    for (let i = 0; i < Math.min(historyItems.length, 10); i++) {
      const item = historyItems[i];
      if (item.textContent?.includes('✅')) successCount++;
      totalCount++;
    }
    
    this.testMetrics.successRate = totalCount > 0 ? (successCount / totalCount) * 100 : 0;
    
    this.updateMetricsDisplay();
  }

  private updateMetricsDisplay(): void {
    if (!this.totalTestsSpan || !this.successRateSpan || !this.avgResponseTimeSpan || !this.concurrentActiveSpan) return;

    this.totalTestsSpan.textContent = this.testMetrics.totalTests.toString();
    this.successRateSpan.textContent = `${this.testMetrics.successRate.toFixed(1)}%`;
    this.avgResponseTimeSpan.textContent = `${this.testMetrics.avgResponseTime.toFixed(0)}ms`;
    this.concurrentActiveSpan.textContent = this.testMetrics.concurrentActive.toString();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==========================================
  // FLOW-SPECIFIC TESTING
  // ==========================================

  private initializeFlowTests(): void {
    // Definir todos los casos de prueba por flujo
    this.flowTestCases.set('captura_inicial', {
      name: 'Captura Inicial de Datos',
      flowType: 'captura_inicial',
      messages: ['Hola', 'Juan Pérez', 'juan@test.com', '25', 'Metropolitana'],
      expectedKeywords: ['nombre', 'email', 'edad', 'región'],
      description: 'Test completo del flujo de captura inicial de prospectos'
    });

    this.flowTestCases.set('menu_principal', {
      name: 'Navegación Menú Principal',
      flowType: 'menu_principal',
      messages: ['Hola', 'Test Usuario', 'test@email.com', '1'],
      expectedKeywords: ['opciones', 'menú', 'elegir', 'carreras'],
      description: 'Test del menú principal y navegación de opciones'
    });

    this.flowTestCases.set('exploracion_carreras', {
      name: 'Exploración de Carreras',
      flowType: 'exploracion_carreras',
      messages: ['Hola', 'Test Usuario', 'test@email.com', '1', '1'],
      expectedKeywords: ['carreras', 'facultad', 'programas', 'ingeniería'],
      description: 'Test de exploración y búsqueda de carreras'
    });

    this.flowTestCases.set('detalle_carrera', {
      name: 'Detalle de Carrera Específica',
      flowType: 'detalle_carrera',
      messages: ['Hola', 'Test Usuario', 'test@email.com', '1', '1', '1'],
      expectedKeywords: ['carrera', 'detalle', 'información', 'duración'],
      description: 'Test de visualización de detalles de carrera'
    });

    this.flowTestCases.set('proceso_admision', {
      name: 'Proceso de Admisión',
      flowType: 'proceso_admision',
      messages: ['Hola', 'Test Usuario', 'test@email.com', '2'],
      expectedKeywords: ['admisión', 'requisitos', 'proceso', 'documentos'],
      description: 'Test del flujo de información de admisión'
    });

    this.flowTestCases.set('busqueda_directa', {
      name: 'Búsqueda Directa de Carrera',
      flowType: 'busqueda_directa',
      messages: ['Hola', 'Test Usuario', 'test@email.com', 'ingeniería'],
      expectedKeywords: ['búsqueda', 'encontrado', 'resultados', 'ingeniería'],
      description: 'Test de búsqueda directa por nombre de carrera'
    });

    this.flowTestCases.set('costos_becas', {
      name: 'Consulta Costos y Becas',
      flowType: 'costos_becas',
      messages: ['Hola', 'Test Usuario', 'test@email.com', '3'],
      expectedKeywords: ['costos', 'becas', 'financiamiento', 'arancel'],
      description: 'Test del flujo de información financiera'
    });

    this.flowTestCases.set('modalidades', {
      name: 'Modalidades de Estudio',
      flowType: 'modalidades',
      messages: ['Hola', 'Test Usuario', 'test@email.com', '4'],
      expectedKeywords: ['modalidades', 'presencial', 'online', 'horarios'],
      description: 'Test de información sobre modalidades de estudio'
    });

    this.flowTestCases.set('menu_contextual', {
      name: 'Menú Contextual',
      flowType: 'menu_contextual',
      messages: ['Hola', 'Test Usuario', 'test@email.com', '5'],
      expectedKeywords: ['universidad', 'campus', 'sedes', 'ubicación'],
      description: 'Test del menú contextual de información universitaria'
    });

    this.flowTestCases.set('captura_asesor', {
      name: 'Conexión con Asesor',
      flowType: 'captura_asesor',
      messages: ['Hola', 'Test Usuario', 'test@email.com', 'asesor'],
      expectedKeywords: ['asesor', 'contacto', 'ejecutivo', 'llamada'],
      description: 'Test del flujo de conexión con asesor educativo'
    });

    console.log(`🎯 [FLOW-TESTS] ${this.flowTestCases.size} casos de prueba por flujo inicializados`);
  }

  private async runFlowTest(flowType: string): Promise<void> {
    const testCase = this.flowTestCases.get(flowType);
    if (!testCase) {
      this.logToTestPanel(`❌ Caso de prueba no encontrado para: ${flowType}`, 'error');
      return;
    }

    this.logToTestPanel(`🎯 Iniciando test de flujo: ${testCase.name}`, 'info');
    this.logToTestPanel(`📝 Descripción: ${testCase.description}`, 'info');
    this.updateTestStatus(`🎯 Ejecutando ${testCase.name}...`, true);

    try {
      const result = await this.executeFlowTest(testCase);
      
      if (result.success) {
        this.logToTestPanel(`✅ ${testCase.name} exitoso (${result.duration.toFixed(0)}ms)`, 'success');
        this.logToTestPanel(`📊 Mensajes enviados: ${testCase.messages.length}`, 'info');
        this.logToTestPanel(`🎯 Palabras clave encontradas: ${result.foundKeywords || 'N/A'}`, 'info');
        this.addToTestHistory(testCase.name, true, result.duration);
      } else {
        this.logToTestPanel(`❌ ${testCase.name} falló: ${result.error}`, 'error');
        this.addToTestHistory(testCase.name, false, result.duration);
      }

      this.updateMetrics();
      
    } catch (error) {
      this.logToTestPanel(`💥 Error ejecutando ${testCase.name}: ${error}`, 'error');
    } finally {
      this.updateTestStatus('⏸️ Sin tests ejecutándose', false);
    }
  }

  private async executeFlowTest(testCase: FlowTestCase): Promise<TestResult & { foundKeywords?: string }> {
    const startTime = performance.now();
    const testUserId = `${testCase.flowType}-test-${Date.now()}`;
    const responses: string[] = [];
    const foundKeywords: string[] = [];

    try {
      this.logToTestPanel(`👤 Iniciando flujo para usuario: ${testUserId}`, 'info');
      
      for (let i = 0; i < testCase.messages.length; i++) {
        const message = testCase.messages[i];
        this.logToTestPanel(`📤 Paso ${i + 1}/${testCase.messages.length}: "${message}"`, 'info');
        
        const response = await this.sendTestMessage(testUserId, message);
        responses.push(response);
        
        // Verificar palabras clave esperadas en la respuesta
        const keywordsInResponse = testCase.expectedKeywords.filter(keyword => 
          response.toLowerCase().includes(keyword.toLowerCase())
        );
        
        if (keywordsInResponse.length > 0) {
          foundKeywords.push(...keywordsInResponse);
          this.logToTestPanel(`🎯 Palabras clave encontradas: ${keywordsInResponse.join(', ')}`, 'success');
        }
        
        // Pausa realista entre mensajes
        if (i < testCase.messages.length - 1) {
          await this.sleep(300);
        }
      }

      const duration = performance.now() - startTime;
      
      // Evaluar éxito basado en si encontramos al menos algunas palabras clave
      const keywordRatio = foundKeywords.length / testCase.expectedKeywords.length;
      const success = keywordRatio >= 0.3; // Al menos 30% de palabras clave encontradas
      
      this.logToTestPanel(`📊 Ratio de palabras clave: ${(keywordRatio * 100).toFixed(1)}%`, success ? 'success' : 'warning');
      
      return { 
        success, 
        duration, 
        responses, 
        foundKeywords: foundKeywords.join(', ') || 'Ninguna' 
      };

    } catch (error) {
      const duration = performance.now() - startTime;
      return { 
        success: false, 
        duration, 
        responses, 
        error: error instanceof Error ? error.message : String(error),
        foundKeywords: foundKeywords.join(', ') || 'Ninguna'
      };
    }
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  new UNIACCChatDemo();
});
