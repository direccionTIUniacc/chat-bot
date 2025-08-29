// Web Component para Chat UNIACC
// Uso: <uniacc-chat api-url="http://localhost:3001"></uniacc-chat>
class UniaccChatComponent extends HTMLElement {
    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: 'open' });
        this.config = {
            apiUrl: this.getAttribute('api-url') || 'http://localhost:3001',
            phone: this.getAttribute('phone') || this.generatePhone(),
            theme: this.getAttribute('theme') || 'light'
        };
    }
    connectedCallback() {
        this.render();
        this.initializeChat();
    }
    render() {
        this.shadow.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        .chat-container {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          background: white;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .chat-header {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: white;
          padding: 16px;
          text-align: center;
        }
        
        .chat-messages {
          height: 400px;
          overflow-y: auto;
          padding: 16px;
          background: #f9fafb;
        }
        
        .chat-input {
          padding: 16px;
          border-top: 1px solid #e5e7eb;
          background: white;
        }
        
        .input-group {
          display: flex;
          gap: 8px;
        }
        
        input {
          flex: 1;
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          outline: none;
        }
        
        input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        button {
          padding: 12px 24px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        }
        
        button:hover {
          background: #2563eb;
        }
        
        button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }
        
        .test-buttons {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }
        
        .test-btn {
          padding: 8px 16px;
          font-size: 12px;
          border-radius: 6px;
        }
        
        .test-btn.warning { background: #f59e0b; }
        .test-btn.danger { background: #ef4444; }
        .test-btn.info { background: #06b6d4; }
      </style>
      
      <div class="chat-container">
        <div class="chat-header">
          <h3>🎓 UNIACC ChatBot</h3>
          <p>Tel: ${this.config.phone}</p>
        </div>
        
        <div class="chat-messages" id="messages">
          <div style="text-align: center; color: #6b7280; font-size: 14px;">
            💬 Escribe "hola" para comenzar...
          </div>
        </div>
        
        <div class="chat-input">
          <div class="input-group">
            <input type="text" id="message-input" placeholder="Escribe tu mensaje..." />
            <button id="send-btn">Enviar</button>
          </div>
          
          <div class="test-buttons">
            <button class="test-btn warning" id="test-polling">🔍 Test</button>
            <button class="test-btn danger" id="force-timeout">⏰ Timeout</button>
            <button class="test-btn info" id="clear-chat">🧹 Limpiar</button>
          </div>
        </div>
      </div>
    `;
    }
    initializeChat() {
        // Integrar con UNIACCChatDemo o crear lógica simplificada
        const messageInput = this.shadow.getElementById('message-input');
        const sendBtn = this.shadow.getElementById('send-btn');
        const messagesDiv = this.shadow.getElementById('messages');
        sendBtn.addEventListener('click', () => this.sendMessage());
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter')
                this.sendMessage();
        });
        // Test buttons
        this.shadow.getElementById('test-polling')?.addEventListener('click', () => this.testPolling());
        this.shadow.getElementById('force-timeout')?.addEventListener('click', () => this.forceTimeout());
        this.shadow.getElementById('clear-chat')?.addEventListener('click', () => this.clearChat());
    }
    async sendMessage() {
        const input = this.shadow.getElementById('message-input');
        const message = input.value.trim();
        if (!message)
            return;
        const messagesDiv = this.shadow.getElementById('messages');
        // Add user message
        this.addMessage(messagesDiv, message, 'user');
        input.value = '';
        try {
            const response = await fetch(`${this.config.apiUrl}/test-chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: this.config.phone, message })
            });
            const data = await response.json();
            // Add bot response
            this.addMessage(messagesDiv, data.conversation.bot_response, 'bot');
        }
        catch (error) {
            this.addMessage(messagesDiv, 'Error: No se pudo enviar el mensaje', 'error');
        }
    }
    addMessage(container, text, type) {
        const div = document.createElement('div');
        div.style.cssText = `
      margin-bottom: 12px;
      padding: 8px 12px;
      border-radius: 18px;
      max-width: 80%;
      word-wrap: break-word;
      ${type === 'user'
            ? 'background: #dcf8c6; margin-left: auto; text-align: right;'
            : type === 'error'
                ? 'background: #fee2e2; color: #dc2626;'
                : 'background: white; border: 1px solid #e5e7eb;'}
    `;
        div.textContent = text;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }
    async testPolling() {
        try {
            const response = await fetch(`${this.config.apiUrl}/check-timeout/${this.config.phone}`);
            const data = await response.json();
            if (data.message) {
                const messagesDiv = this.shadow.getElementById('messages');
                this.addMessage(messagesDiv, `[TEST] ${data.message}`, 'bot');
            }
            else {
                alert('No hay mensajes pendientes');
            }
        }
        catch (error) {
            alert('Error en test: ' + error.message);
        }
    }
    async forceTimeout() {
        try {
            const response = await fetch(`${this.config.apiUrl}/force-timeout/${this.config.phone}`, {
                method: 'POST'
            });
            const data = await response.json();
            if (data.message) {
                const messagesDiv = this.shadow.getElementById('messages');
                this.addMessage(messagesDiv, `[TIMEOUT] ${data.message}`, 'bot');
            }
        }
        catch (error) {
            alert('Error forzando timeout: ' + error.message);
        }
    }
    clearChat() {
        const messagesDiv = this.shadow.getElementById('messages');
        messagesDiv.innerHTML = `
      <div style="text-align: center; color: #6b7280; font-size: 14px;">
        💬 Chat limpiado. Escribe "hola" para comenzar...
      </div>
    `;
    }
    generatePhone() {
        return '56912345' + Math.floor(Math.random() * 1000);
    }
    // Getters/Setters para atributos
    get apiUrl() { return this.config.apiUrl; }
    set apiUrl(value) {
        this.config.apiUrl = value;
        this.setAttribute('api-url', value);
    }
}
// Registrar el Web Component
customElements.define('uniacc-chat', UniaccChatComponent);
export default UniaccChatComponent;
//# sourceMappingURL=uniacc-chat.js.map