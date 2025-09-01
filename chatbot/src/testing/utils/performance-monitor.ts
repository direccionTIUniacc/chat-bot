/**
 * Monitor de performance en tiempo real para testing concurrente
 * Rastrea métricas del sistema durante la ejecución de tests
 */

import { EventEmitter } from 'events'
import * as os from 'os'

interface SystemMetrics {
  timestamp: Date
  memory: {
    used: number
    free: number
    total: number
    percentage: number
    heap: {
      used: number
      total: number
      percentage: number
    }
  }
  cpu: {
    usage: number
    load: number[]
    cores: number
  }
  connections: {
    active: number
    total: number
    peak: number
  }
  performance: {
    averageResponseTime: number
    throughput: number
    errorRate: number
    p95ResponseTime: number
    p99ResponseTime: number
  }
}

interface AlertThreshold {
  metric: string
  threshold: number
  type: 'warning' | 'critical'
  message: string
}

export class PerformanceMonitor extends EventEmitter {
  private isMonitoring: boolean = false
  private interval: NodeJS.Timeout | null = null
  private metrics: SystemMetrics[] = []
  private responseTimes: number[] = []
  private errorCount: number = 0
  private requestCount: number = 0
  private startTime: Date = new Date()
  private activeConnections: number = 0
  private peakConnections: number = 0
  private alerts: AlertThreshold[] = []

  constructor(private updateInterval: number = 1000) {
    super()
    this.setupDefaultAlerts()
  }

  /**
   * Inicia el monitoreo de performance
   */
  start(): void {
    if (this.isMonitoring) {
      console.warn('⚠️ Monitor ya está ejecutándose')
      return
    }

    console.log('📊 Iniciando monitor de performance...')
    this.isMonitoring = true
    this.startTime = new Date()
    this.resetCounters()

    this.interval = setInterval(() => {
      this.collectMetrics()
    }, this.updateInterval)

    this.emit('started')
  }

  /**
   * Detiene el monitoreo
   */
  stop(): void {
    if (!this.isMonitoring) {
      return
    }

    console.log('🛑 Deteniendo monitor de performance...')
    this.isMonitoring = false

    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }

    this.emit('stopped', this.generateReport())
  }

  /**
   * Registra tiempo de respuesta de una request
   */
  recordResponseTime(responseTime: number): void {
    this.responseTimes.push(responseTime)
    this.requestCount++

    // Mantener solo las últimas 1000 mediciones
    if (this.responseTimes.length > 1000) {
      this.responseTimes.shift()
    }
  }

  /**
   * Registra un error
   */
  recordError(): void {
    this.errorCount++
  }

  /**
   * Actualiza el número de conexiones activas
   */
  updateActiveConnections(count: number): void {
    this.activeConnections = count
    if (count > this.peakConnections) {
      this.peakConnections = count
    }
  }

  /**
   * Recopila métricas del sistema
   */
  private collectMetrics(): void {
    const memoryUsage = process.memoryUsage()
    const systemMemory = {
      total: os.totalmem(),
      free: os.freemem()
    }
    
    const metric: SystemMetrics = {
      timestamp: new Date(),
      memory: {
        used: systemMemory.total - systemMemory.free,
        free: systemMemory.free,
        total: systemMemory.total,
        percentage: ((systemMemory.total - systemMemory.free) / systemMemory.total) * 100,
        heap: {
          used: memoryUsage.heapUsed,
          total: memoryUsage.heapTotal,
          percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
        }
      },
      cpu: {
        usage: await this.getCpuUsage(),
        load: os.loadavg(),
        cores: os.cpus().length
      },
      connections: {
        active: this.activeConnections,
        total: this.requestCount,
        peak: this.peakConnections
      },
      performance: {
        averageResponseTime: this.calculateAverageResponseTime(),
        throughput: this.calculateThroughput(),
        errorRate: this.calculateErrorRate(),
        p95ResponseTime: this.calculatePercentile(95),
        p99ResponseTime: this.calculatePercentile(99)
      }
    }

    this.metrics.push(metric)

    // Mantener solo las últimas 300 métricas (5 minutos con intervalo de 1s)
    if (this.metrics.length > 300) {
      this.metrics.shift()
    }

    // Verificar alertas
    this.checkAlerts(metric)

    // Emitir evento con métricas actuales
    this.emit('metrics', metric)
  }

  /**
   * Calcula uso de CPU
   */
  private async getCpuUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage()
      
      setTimeout(() => {
        const endUsage = process.cpuUsage(startUsage)
        const totalUsage = (endUsage.user + endUsage.system) / 1000 // microsegundos a milisegundos
        const cpuPercent = (totalUsage / this.updateInterval) * 100
        resolve(Math.min(100, cpuPercent))
      }, 100)
    })
  }

  /**
   * Calcula tiempo promedio de respuesta
   */
  private calculateAverageResponseTime(): number {
    if (this.responseTimes.length === 0) return 0
    return this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length
  }

  /**
   * Calcula throughput (requests por segundo)
   */
  private calculateThroughput(): number {
    const durationInSeconds = (Date.now() - this.startTime.getTime()) / 1000
    return durationInSeconds > 0 ? this.requestCount / durationInSeconds : 0
  }

  /**
   * Calcula tasa de error
   */
  private calculateErrorRate(): number {
    return this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0
  }

  /**
   * Calcula percentil de tiempo de respuesta
   */
  private calculatePercentile(percentile: number): number {
    if (this.responseTimes.length === 0) return 0
    
    const sorted = [...this.responseTimes].sort((a, b) => a - b)
    const index = Math.ceil((percentile / 100) * sorted.length) - 1
    return sorted[index] || 0
  }

  /**
   * Configura alertas por defecto
   */
  private setupDefaultAlerts(): void {
    this.alerts = [
      {
        metric: 'memory.percentage',
        threshold: 80,
        type: 'warning',
        message: 'Alto uso de memoria del sistema (>80%)'
      },
      {
        metric: 'memory.percentage',
        threshold: 95,
        type: 'critical',
        message: 'Uso crítico de memoria del sistema (>95%)'
      },
      {
        metric: 'memory.heap.percentage',
        threshold: 85,
        type: 'warning',
        message: 'Alto uso de heap de Node.js (>85%)'
      },
      {
        metric: 'cpu.usage',
        threshold: 80,
        type: 'warning',
        message: 'Alto uso de CPU (>80%)'
      },
      {
        metric: 'performance.averageResponseTime',
        threshold: 2000,
        type: 'warning',
        message: 'Tiempo de respuesta alto (>2s)'
      },
      {
        metric: 'performance.averageResponseTime',
        threshold: 5000,
        type: 'critical',
        message: 'Tiempo de respuesta crítico (>5s)'
      },
      {
        metric: 'performance.errorRate',
        threshold: 5,
        type: 'warning',
        message: 'Tasa de error elevada (>5%)'
      },
      {
        metric: 'performance.errorRate',
        threshold: 10,
        type: 'critical',
        message: 'Tasa de error crítica (>10%)'
      }
    ]
  }

  /**
   * Verifica alertas contra métricas actuales
   */
  private checkAlerts(metrics: SystemMetrics): void {
    this.alerts.forEach(alert => {
      const value = this.getMetricValue(metrics, alert.metric)
      
      if (value > alert.threshold) {
        this.emit('alert', {
          ...alert,
          currentValue: value,
          timestamp: metrics.timestamp
        })
      }
    })
  }

  /**
   * Obtiene valor de métrica por path
   */
  private getMetricValue(metrics: SystemMetrics, path: string): number {
    const keys = path.split('.')
    let value: any = metrics
    
    for (const key of keys) {
      value = value[key]
      if (value === undefined) return 0
    }
    
    return typeof value === 'number' ? value : 0
  }

  /**
   * Genera reporte de performance
   */
  generateReport(): any {
    if (this.metrics.length === 0) {
      return { message: 'No hay métricas disponibles' }
    }

    const latestMetric = this.metrics[this.metrics.length - 1]
    const duration = (Date.now() - this.startTime.getTime()) / 1000

    return {
      summary: {
        duration: `${duration.toFixed(1)}s`,
        totalRequests: this.requestCount,
        totalErrors: this.errorCount,
        peakConnections: this.peakConnections,
        finalMetrics: latestMetric
      },
      performance: {
        averageResponseTime: latestMetric.performance.averageResponseTime,
        p95ResponseTime: latestMetric.performance.p95ResponseTime,
        p99ResponseTime: latestMetric.performance.p99ResponseTime,
        throughput: latestMetric.performance.throughput,
        errorRate: latestMetric.performance.errorRate
      },
      resources: {
        peakMemoryUsage: Math.max(...this.metrics.map(m => m.memory.percentage)),
        peakHeapUsage: Math.max(...this.metrics.map(m => m.memory.heap.percentage)),
        averageCpuUsage: this.metrics.reduce((sum, m) => sum + m.cpu.usage, 0) / this.metrics.length
      },
      timeline: this.metrics.map(m => ({
        timestamp: m.timestamp,
        memory: m.memory.percentage,
        cpu: m.cpu.usage,
        responseTime: m.performance.averageResponseTime,
        connections: m.connections.active
      }))
    }
  }

  /**
   * Muestra métricas en tiempo real en consola
   */
  startConsoleDisplay(): void {
    this.on('metrics', (metrics: SystemMetrics) => {
      console.clear()
      this.displayMetricsInConsole(metrics)
    })

    this.on('alert', (alert: any) => {
      const icon = alert.type === 'critical' ? '🚨' : '⚠️'
      console.log(`\n${icon} ALERTA ${alert.type.toUpperCase()}: ${alert.message}`)
      console.log(`   Valor actual: ${alert.currentValue.toFixed(2)}`)
    })
  }

  /**
   * Muestra métricas formateadas en consola
   */
  private displayMetricsInConsole(metrics: SystemMetrics): void {
    const duration = (Date.now() - this.startTime.getTime()) / 1000

    console.log('╔══════════════════════════════════════════════════════════╗')
    console.log('║                  📊 MONITOR DE PERFORMANCE                ║')
    console.log('╠══════════════════════════════════════════════════════════╣')
    console.log(`║ Duración: ${duration.toFixed(1)}s | Requests: ${this.requestCount} | Errores: ${this.errorCount} ║`)
    console.log('╠══════════════════════════════════════════════════════════╣')
    console.log(`║ 🧠 Memoria Sistema: ${metrics.memory.percentage.toFixed(1)}% (${(metrics.memory.used / 1024 / 1024 / 1024).toFixed(2)}GB)`)
    console.log(`║ 🔥 Heap Node.js: ${metrics.memory.heap.percentage.toFixed(1)}% (${(metrics.memory.heap.used / 1024 / 1024).toFixed(2)}MB)`)
    console.log(`║ ⚡ CPU: ${metrics.cpu.usage.toFixed(1)}% | Load: [${metrics.cpu.load.map(l => l.toFixed(2)).join(', ')}]`)
    console.log(`║ 👥 Conexiones: ${metrics.connections.active} activas | Pico: ${metrics.connections.peak}`)
    console.log('╠══════════════════════════════════════════════════════════╣')
    console.log(`║ 🕐 Tiempo Respuesta: ${metrics.performance.averageResponseTime.toFixed(0)}ms (avg)`)
    console.log(`║ 📈 P95: ${metrics.performance.p95ResponseTime.toFixed(0)}ms | P99: ${metrics.performance.p99ResponseTime.toFixed(0)}ms`)
    console.log(`║ ⚡ Throughput: ${metrics.performance.throughput.toFixed(1)} req/s`)
    console.log(`║ ❌ Tasa Error: ${metrics.performance.errorRate.toFixed(2)}%`)
    console.log('╚══════════════════════════════════════════════════════════╝')

    // Gráfico simple de memoria en ASCII
    const memoryBar = this.createProgressBar(metrics.memory.percentage, 30)
    console.log(`\nMemoria: ${memoryBar} ${metrics.memory.percentage.toFixed(1)}%`)
    
    const cpuBar = this.createProgressBar(metrics.cpu.usage, 30)
    console.log(`CPU:     ${cpuBar} ${metrics.cpu.usage.toFixed(1)}%`)
  }

  /**
   * Crea barra de progreso en ASCII
   */
  private createProgressBar(percentage: number, width: number): string {
    const filled = Math.round((percentage / 100) * width)
    const empty = width - filled
    
    let color = '█' // Verde por defecto
    if (percentage > 80) color = '█' // Rojo
    else if (percentage > 60) color = '█' // Amarillo
    
    return '[' + color.repeat(filled) + '░'.repeat(empty) + ']'
  }

  /**
   * Exporta métricas a archivo
   */
  async exportMetrics(filename: string = 'performance-metrics'): Promise<void> {
    const report = this.generateReport()
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filepath = `${filename}-${timestamp}.json`
    
    try {
      const fs = await import('fs/promises')
      await fs.writeFile(filepath, JSON.stringify(report, null, 2))
      console.log(`💾 Métricas exportadas a: ${filepath}`)
    } catch (error) {
      console.error(`❌ Error exportando métricas: ${error}`)
    }
  }

  /**
   * Reinicia contadores
   */
  private resetCounters(): void {
    this.metrics = []
    this.responseTimes = []
    this.errorCount = 0
    this.requestCount = 0
    this.activeConnections = 0
    this.peakConnections = 0
  }

  // Getters públicos
  get isRunning(): boolean {
    return this.isMonitoring
  }

  get currentMetrics(): SystemMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null
  }

  get allMetrics(): SystemMetrics[] {
    return [...this.metrics]
  }
}
