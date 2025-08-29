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

class UNIACCChatDemo {
  private currentPhone: string;
  private currentUserId: string | null = null;
  private timeoutCheckInterval: number | null = null;
  private resultsDiv!: HTMLElement;
  private messageInput!: HTMLInputElement;
  private sendBtn!: HTMLButtonElement;
  private testButtonsContainer!: HTMLElement;

  constructor() {
    this.currentPhone = '56912345809';
    this.initializeElements();
    this.setupEventListeners();
    this.createTestButtons();
    
    console.log('🚀 [CHAT-DEMO] UNIACC Chat Demo inicializado');
    console.log(`📱 [CHAT-DEMO] Teléfono asignado: ${this.currentPhone}`);
  }

  private initializeElements(): void {
    this.resultsDiv = document.getElementById('results') as HTMLElement;
    this.messageInput = document.getElementById('messageInput') as HTMLInputElement;
    this.sendBtn = document.getElementById('sendBtn') as HTMLButtonElement;
    this.testButtonsContainer = document.getElementById('testButtons') as HTMLElement;

    if (!this.resultsDiv || !this.messageInput || !this.sendBtn) {
      throw new Error('Elementos del DOM no encontrados');
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
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  new UNIACCChatDemo();
});
