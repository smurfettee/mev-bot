import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

// Custom format for correlation IDs
const correlationIdFormat = winston.format((info) => {
  if (!info.correlationId) {
    info.correlationId = uuidv4();
  }
  return info;
});

// Custom format for structured logging
const structuredFormat = winston.format.combine(
  correlationIdFormat(),
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  correlationIdFormat(),
  winston.format.timestamp(),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, correlationId, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${correlationId}] ${level}: ${message} ${metaStr}`;
  })
);

export const createLogger = (level: string = 'info') => {
  const transports: winston.transport[] = [
    new winston.transports.Console({
      format: consoleFormat,
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
    })
  ];

  // Add file transport for production
  if (process.env.NODE_ENV === 'production') {
    transports.push(
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: structuredFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: structuredFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5
      })
    );
  }

  return winston.createLogger({
    level,
    format: structuredFormat,
    transports,
    exitOnError: false
  });
};

export const logger = createLogger(process.env.LOG_LEVEL || 'info');

// Helper function to create child logger with correlation ID
export const createChildLogger = (correlationId: string, context?: Record<string, any>) => {
  return logger.child({ correlationId, ...context });
};

// Helper function to log performance metrics
export const logPerformance = (operation: string, duration: number, metadata?: Record<string, any>) => {
  logger.info(`Performance: ${operation} completed in ${duration}ms`, {
    operation,
    duration,
    ...metadata
  });
};

// Helper function to log errors with context
export const logError = (error: Error, context?: Record<string, any>) => {
  logger.error(`Error: ${error.message}`, {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    ...context
  });
};

// Helper function to log arbitrage opportunities
export const logArbitrageOpportunity = (opportunity: any) => {
  logger.info('Arbitrage opportunity detected', {
    opportunity: {
      tokenPair: opportunity.tokenPair,
      profitMargin: opportunity.profitMargin,
      netProfit: opportunity.netProfit,
      sourceChain: opportunity.sourceChain,
      targetChain: opportunity.targetChain
    }
  });
}; 