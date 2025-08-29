/**
 * 📊 SISTEMA DE LOGGING EXTENDIDO - UNIACC CHATBOT
 * 
 * Sistema completo de logging para debugging y monitoreo de flujos
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO', 
  WARN = 'WARN',
  ERROR = 'ERROR',
  FLOW = 'FLOW',
  DB = 'DB',
  USER = 'USER'
}

export enum LogCategory {
  FLOW = 'FLOW',
  DATABASE = 'DB',
  USER_STATE = 'USER',
  TIMEOUT = 'TIMEOUT', 
  INTEGRATION = 'INTEGRATION',
  ADVISOR = 'ADVISOR',
  MENU = 'MENU',
  CONVERSATION = 'CONV'
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  category: LogCategory
  userId?: string
  message: string
  data?: any
  flowInfo?: {
    currentFlow?: string
    currentStep?: string
    selectedOption?: string
    userData?: any
  }
}

class EnhancedLogger {
  private logs: LogEntry[] = []
  private maxLogs = 1000 // Mantener últimos 1000 logs
  
  private formatTimestamp(): string {
    return new Date().toISOString().replace('T', ' ').substring(0, 19)
  }
  
  private createEntry(
    level: LogLevel,
    category: LogCategory,
    message: string,
    userId?: string,
    data?: any,
    flowInfo?: any
  ): LogEntry {
    return {
      timestamp: this.formatTimestamp(),
      level,
      category,
      userId,
      message,
      data,
      flowInfo
    }
  }
  
  private addLog(entry: LogEntry) {
    this.logs.push(entry)
    
    // Mantener solo los últimos maxLogs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }
    
    // Output a consola con formato
    this.outputToConsole(entry)
  }
  
  private outputToConsole(entry: LogEntry) {
    const emoji = this.getCategoryEmoji(entry.category)
    const userStr = entry.userId ? ` [${entry.userId.substring(0, 8)}...]` : ''
    const flowStr = entry.flowInfo ? ` (${entry.flowInfo.currentFlow}/${entry.flowInfo.currentStep})` : ''
    
    const output = `${emoji} [${entry.level}]${userStr}${flowStr} ${entry.message}`
    
    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(output, entry.data || '')
        break
      case LogLevel.WARN:
        console.warn(output, entry.data || '')
        break
      case LogLevel.FLOW:
        console.log(`🔄 ${output}`, entry.data || '')
        break
      case LogLevel.DB:
        console.log(`💾 ${output}`, entry.data || '')
        break
      default:
        console.log(output, entry.data || '')
    }
  }
  
  private getCategoryEmoji(category: LogCategory): string {
    const emojis = {
      [LogCategory.FLOW]: '🔄',
      [LogCategory.DATABASE]: '💾',
      [LogCategory.USER_STATE]: '👤',
      [LogCategory.TIMEOUT]: '⏰',
      [LogCategory.INTEGRATION]: '🔗',
      [LogCategory.ADVISOR]: '🎯',
      [LogCategory.MENU]: '📋',
      [LogCategory.CONVERSATION]: '💬'
    }
    return emojis[category] || '📊'
  }
  
  // ========================================
  // MÉTODOS PÚBLICOS DE LOGGING
  // ========================================
  
  /**
   * Log de cambios de flujo
   */
  logFlowChange(userId: string, fromFlow: string, toFlow: string, step: string, reason?: string) {
    this.addLog(this.createEntry(
      LogLevel.FLOW,
      LogCategory.FLOW,
      `Flujo cambiado: ${fromFlow} → ${toFlow} | Paso: ${step}${reason ? ` | Razón: ${reason}` : ''}`,
      userId,
      { fromFlow, toFlow, step, reason },
      { currentFlow: toFlow, currentStep: step }
    ))
  }
  
  /**
   * Log de procesamiento de mensajes
   */
  logMessageProcessing(userId: string, message: string, currentFlow: string, currentStep: string) {
    this.addLog(this.createEntry(
      LogLevel.INFO,
      LogCategory.USER_STATE,
      `Procesando mensaje: "${message.substring(0, 30)}..." | Flujo: ${currentFlow}`,
      userId,
      { message, currentFlow, currentStep },
      { currentFlow, currentStep }
    ))
  }
  
  /**
   * Log de selección de opciones de menú
   */
  logMenuSelection(userId: string, option: string, menuType: string, currentFlow: string) {
    this.addLog(this.createEntry(
      LogLevel.INFO,
      LogCategory.MENU,
      `Opción seleccionada: ${option} en ${menuType}`,
      userId,
      { option, menuType, currentFlow },
      { currentFlow, selectedOption: option }
    ))
  }
  
  /**
   * Log de flujo de asesor
   */
  logAdvisorFlow(userId: string, step: string, missingData: string[], existingData: any) {
    this.addLog(this.createEntry(
      LogLevel.FLOW,
      LogCategory.ADVISOR,
      `Flujo asesor - Paso: ${step} | Datos faltantes: [${missingData.join(', ')}]`,
      userId,
      { step, missingData, existingData },
      { currentFlow: 'advisor_connection', currentStep: step }
    ))
  }
  
  /**
   * Log de operaciones de base de datos
   */
  logDatabaseOperation(operation: string, table: string, success: boolean, data?: any, error?: string) {
    this.addLog(this.createEntry(
      success ? LogLevel.INFO : LogLevel.ERROR,
      LogCategory.DATABASE,
      `${operation} en ${table}: ${success ? 'ÉXITO' : 'ERROR'}${error ? ` - ${error}` : ''}`,
      data?.userId || data?.whatsapp,
      { operation, table, success, data, error }
    ))
  }
  
  /**
   * Log de timeout
   */
  logTimeout(userId: string, type: 'warning' | 'final', message: string) {
    this.addLog(this.createEntry(
      LogLevel.WARN,
      LogCategory.TIMEOUT,
      `Timeout ${type}: ${message}`,
      userId,
      { type, message }
    ))
  }
  
  /**
   * Log de reconocimiento de usuarios
   */
  logUserRecognition(userId: string, isReturning: boolean, userData?: any) {
    this.addLog(this.createEntry(
      LogLevel.INFO,
      LogCategory.USER_STATE,
      `Usuario ${isReturning ? 'RECONOCIDO' : 'NUEVO'}: ${userData?.nombre || 'sin nombre'}`,
      userId,
      { isReturning, userData }
    ))
  }
  
  /**
   * Log de conversaciones
   */
  logConversation(userId: string, userMessage: string, botResponse: string, conversationId?: string) {
    this.addLog(this.createEntry(
      LogLevel.INFO,
      LogCategory.CONVERSATION,
      `Mensaje guardado - User: "${userMessage.substring(0, 20)}..." | Bot: "${botResponse.substring(0, 20)}..."`,
      userId,
      { userMessage, botResponse, conversationId }
    ))
  }
  
  /**
   * Log de errores críticos
   */
  logError(category: LogCategory, message: string, error: any, userId?: string) {
    this.addLog(this.createEntry(
      LogLevel.ERROR,
      category,
      message,
      userId,
      { error: error.message || error, stack: error.stack }
    ))
  }
  
  /**
   * Log de datos de prospecto
   */
  logProspectData(userId: string, action: string, data: any, success: boolean) {
    this.addLog(this.createEntry(
      success ? LogLevel.INFO : LogLevel.ERROR,
      LogCategory.DATABASE,
      `Prospecto ${action}: ${success ? 'ÉXITO' : 'ERROR'}`,
      userId,
      { action, data, success }
    ))
  }
  
  // ========================================
  // MÉTODOS DE CONSULTA
  // ========================================
  
  /**
   * Obtener logs por usuario
   */
  getLogsByUser(userId: string, limit = 50): LogEntry[] {
    return this.logs
      .filter(log => log.userId?.includes(userId.substring(0, 8)))
      .slice(-limit)
  }
  
  /**
   * Obtener logs por categoría
   */
  getLogsByCategory(category: LogCategory, limit = 50): LogEntry[] {
    return this.logs
      .filter(log => log.category === category)
      .slice(-limit)
  }
  
  /**
   * Obtener logs de errores
   */
  getErrorLogs(limit = 20): LogEntry[] {
    return this.logs
      .filter(log => log.level === LogLevel.ERROR)
      .slice(-limit)
  }
  
  /**
   * Obtener resumen de actividad
   */
  getActivitySummary(): any {
    const last100 = this.logs.slice(-100)
    
    return {
      totalLogs: this.logs.length,
      errorCount: last100.filter(l => l.level === LogLevel.ERROR).length,
      warningCount: last100.filter(l => l.level === LogLevel.WARN).length,
      flowChanges: last100.filter(l => l.category === LogCategory.FLOW).length,
      databaseOps: last100.filter(l => l.category === LogCategory.DATABASE).length,
      uniqueUsers: [...new Set(last100.map(l => l.userId).filter(Boolean))].length,
      lastActivity: this.logs[this.logs.length - 1]?.timestamp || 'No activity'
    }
  }
  
  /**
   * Exportar logs para análisis
   */
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.logs, null, 2)
    }
    
    // CSV format
    const headers = 'timestamp,level,category,userId,message'
    const rows = this.logs.map(log => 
      `"${log.timestamp}","${log.level}","${log.category}","${log.userId || ''}","${log.message.replace(/"/g, '""')}"`
    )
    
    return [headers, ...rows].join('\n')
  }
}

// Singleton instance
export const logger = new EnhancedLogger()

// Export para uso fácil
export default logger
