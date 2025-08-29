"use strict";
// TypeScript para Chat Demo UNIACC
// Compilar con: tsc src/frontend/chat-demo.ts --outDir public/js --target ES2020
class UNIACCChatDemo {
    constructor() {
        this.currentUserId = null;
        this.timeoutCheckInterval = null;
        this.currentPhone = '56912345809';
        this.initializeElements();
        this.setupEventListeners();
        this.createTestButtons();
        console.log('🚀 [CHAT-DEMO] UNIACC Chat Demo inicializado');
        console.log(`📱 [CHAT-DEMO] Teléfono asignado: ${this.currentPhone}`);
    }
    initializeElements() {
        this.resultsDiv = document.getElementById('results');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.testButtonsContainer = document.getElementById('testButtons');
        if (!this.resultsDiv || !this.messageInput || !this.sendBtn) {
            throw new Error('Elementos del DOM no encontrados');
        }
        // Auto-focus en el input
        this.messageInput.focus();
    }
    setupEventListeners() {
        // Click en botón enviar
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        // Enter key support
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
    }
    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message)
            return;
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
            const data = await response.json();
            this.addChatMessage(data);
        }
        catch (error) {
            console.error('❌ [SEND-MESSAGE] Error:', error);
            this.addErrorMessage('No se pudo enviar el mensaje: ' + error.message);
        }
        finally {
            this.messageInput.disabled = false;
            this.sendBtn.disabled = false;
            this.messageInput.focus();
        }
    }
    addChatMessage(data) {
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
    addTimeoutMessage(message, type) {
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
    addErrorMessage(error) {
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
    startTimeoutChecking() {
        console.log(`🚀 [TIMEOUT-INIT] Iniciando timeout checking para: ${this.currentPhone}`);
        this.currentUserId = this.currentPhone;
        // Verificar cada 3 segundos
        this.timeoutCheckInterval = window.setInterval(() => {
            this.checkForTimeoutMessages();
        }, 3000);
        console.log(`⏰ [POLLING] Sistema iniciado - Verificando cada 3s - Interval ID: ${this.timeoutCheckInterval}`);
    }
    async checkForTimeoutMessages() {
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
            const data = await response.json();
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
            }
            else {
                console.log('🔍 [POLLING] Sin mensajes pendientes');
            }
        }
        catch (error) {
            console.error('🔍 [POLLING] Error verificando timeout:', error);
        }
    }
    stopTimeoutChecking() {
        if (this.timeoutCheckInterval) {
            clearInterval(this.timeoutCheckInterval);
            this.timeoutCheckInterval = null;
        }
        this.currentUserId = null;
        console.log('⏰ [POLLING] Sistema de timeout detenido');
    }
    createTestButtons() {
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
    async forceTimeout() {
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
            const data = await response.json();
            console.log('🧪 [FORCE-TIMEOUT] Respuesta:', data);
            if (data.message) {
                this.addTimeoutMessage(data.message, 'timeout');
                this.stopTimeoutChecking();
            }
        }
        catch (error) {
            console.error('🧪 [FORCE-TIMEOUT] Error:', error);
            alert('Error forzando timeout: ' + error.message);
        }
    }
    async testPolling() {
        const testPhone = this.currentUserId || this.currentPhone;
        console.log(`🔍 [TEST] Testeando polling manual para: ${testPhone}`);
        try {
            const response = await fetch(`/check-timeout/${testPhone}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            console.log('🔍 [TEST] Respuesta del endpoint:', data);
            if (data.message) {
                alert(`Mensaje encontrado: ${data.message.substring(0, 50)}...`);
                this.addTimeoutMessage(data.message, data.status);
            }
            else {
                alert('No hay mensajes pendientes');
            }
        }
        catch (error) {
            console.error('🔍 [TEST] Error:', error);
            alert('Error testeando polling: ' + error.message);
        }
    }
    clearChat() {
        this.resultsDiv.innerHTML = `
      <div class="text-center text-gray-500 text-sm">
        💬 Chat limpiado. Escribe "hola" para comenzar...
      </div>
    `;
        this.stopTimeoutChecking();
        console.log('🧹 [CLEAR] Chat limpiado');
    }
    scrollToBottom() {
        setTimeout(() => {
            this.resultsDiv.scrollTop = this.resultsDiv.scrollHeight;
        }, 100);
    }
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new UNIACCChatDemo();
});
//# sourceMappingURL=chat-demo.js.map