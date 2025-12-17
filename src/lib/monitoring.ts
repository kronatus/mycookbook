/**
 * Monitoring and Error Tracking Configuration
 * 
 * Provides centralized error tracking, performance monitoring,
 * and logging capabilities for the application.
 * 
 * Requirements: 8.4
 */

export interface ErrorContext {
  userId?: string;
  url?: string;
  method?: string;
  statusCode?: number;
  timestamp: Date;
  environment: string;
  [key: string]: unknown;
}

export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

class MonitoringService {
  private environment: string;
  private isProduction: boolean;

  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.isProduction = this.environment === 'production';
  }

  /**
   * Log an error with context
   */
  logError(error: Error, context?: Partial<ErrorContext>): void {
    const errorData = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      timestamp: new Date().toISOString(),
      environment: this.environment,
      ...context,
    };

    // In production, this would send to a service like Sentry, LogRocket, etc.
    if (this.isProduction) {
      // TODO: Integrate with error tracking service
      console.error('[ERROR]', JSON.stringify(errorData, null, 2));
    } else {
      console.error('[ERROR]', error);
      if (context) {
        console.error('[CONTEXT]', context);
      }
    }

    // Store in Vercel logs
    this.sendToVercelLogs('error', errorData);
  }

  /**
   * Log a warning
   */
  logWarning(message: string, context?: Record<string, unknown>): void {
    const warningData = {
      message,
      timestamp: new Date().toISOString(),
      environment: this.environment,
      ...context,
    };

    console.warn('[WARNING]', warningData);
    this.sendToVercelLogs('warning', warningData);
  }

  /**
   * Log an info message
   */
  logInfo(message: string, context?: Record<string, unknown>): void {
    const infoData = {
      message,
      timestamp: new Date().toISOString(),
      environment: this.environment,
      ...context,
    };

    console.info('[INFO]', infoData);
    this.sendToVercelLogs('info', infoData);
  }

  /**
   * Track a performance metric
   */
  trackPerformance(metric: PerformanceMetric): void {
    const performanceData = {
      ...metric,
      timestamp: metric.timestamp.toISOString(),
      environment: this.environment,
    };

    if (this.isProduction) {
      // TODO: Send to analytics service
      console.log('[PERFORMANCE]', performanceData);
    }

    this.sendToVercelLogs('performance', performanceData);
  }

  /**
   * Track an API request
   */
  trackApiRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    userId?: string
  ): void {
    const requestData = {
      method,
      path,
      statusCode,
      duration,
      userId,
      timestamp: new Date().toISOString(),
      environment: this.environment,
    };

    // Log slow requests
    if (duration > 1000) {
      this.logWarning('Slow API request detected', requestData);
    }

    this.sendToVercelLogs('api_request', requestData);
  }

  /**
   * Track a database query
   */
  trackDatabaseQuery(
    query: string,
    duration: number,
    success: boolean
  ): void {
    const queryData = {
      query: query.substring(0, 200), // Truncate long queries
      duration,
      success,
      timestamp: new Date().toISOString(),
      environment: this.environment,
    };

    // Log slow queries
    if (duration > 500) {
      this.logWarning('Slow database query detected', queryData);
    }

    if (!success) {
      this.logError(new Error('Database query failed'), queryData);
    }

    this.sendToVercelLogs('db_query', queryData);
  }

  /**
   * Send logs to Vercel's logging system
   */
  private sendToVercelLogs(
    level: string,
    data: Record<string, unknown>
  ): void {
    // Vercel automatically captures console output
    // Format for structured logging
    const logEntry = {
      level,
      ...data,
    };

    // Use console methods that Vercel captures
    switch (level) {
      case 'error':
        console.error(JSON.stringify(logEntry));
        break;
      case 'warning':
        console.warn(JSON.stringify(logEntry));
        break;
      case 'performance':
      case 'api_request':
      case 'db_query':
        console.log(JSON.stringify(logEntry));
        break;
      default:
        console.info(JSON.stringify(logEntry));
    }
  }

  /**
   * Create a performance timer
   */
  startTimer(name: string): () => void {
    const startTime = Date.now();

    return () => {
      const duration = Date.now() - startTime;
      this.trackPerformance({
        name,
        duration,
        timestamp: new Date(),
      });
    };
  }

  /**
   * Wrap an async function with error tracking
   */
  wrapAsync<T>(
    fn: () => Promise<T>,
    context?: Partial<ErrorContext>
  ): Promise<T> {
    return fn().catch((error) => {
      this.logError(error, context);
      throw error;
    });
  }

  /**
   * Track user action
   */
  trackUserAction(
    action: string,
    userId?: string,
    metadata?: Record<string, unknown>
  ): void {
    const actionData = {
      action,
      userId,
      timestamp: new Date().toISOString(),
      environment: this.environment,
      ...metadata,
    };

    this.sendToVercelLogs('user_action', actionData);
  }
}

// Export singleton instance
export const monitoring = new MonitoringService();

// Export helper functions
export const logError = (error: Error, context?: Partial<ErrorContext>) =>
  monitoring.logError(error, context);

export const logWarning = (message: string, context?: Record<string, unknown>) =>
  monitoring.logWarning(message, context);

export const logInfo = (message: string, context?: Record<string, unknown>) =>
  monitoring.logInfo(message, context);

export const trackPerformance = (metric: PerformanceMetric) =>
  monitoring.trackPerformance(metric);

export const trackApiRequest = (
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  userId?: string
) => monitoring.trackApiRequest(method, path, statusCode, duration, userId);

export const startTimer = (name: string) => monitoring.startTimer(name);

export const wrapAsync = <T>(
  fn: () => Promise<T>,
  context?: Partial<ErrorContext>
) => monitoring.wrapAsync(fn, context);
