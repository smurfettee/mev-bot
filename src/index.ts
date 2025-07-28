import { v4 as uuidv4 } from 'uuid';
import cron from 'node-cron';
import { logger, createChildLogger, logPerformance } from './utils/logger';
import { getConfig } from './config/env';
import { chainManager } from './services/chainManager';
import { dexMonitor } from './services/dexMonitor';
import { priceCalculator } from './services/priceCalculator';
import { databaseService } from './services/database';
import { SYSTEM_CONSTANTS } from './utils/constants';

class MevBot {
  private logger = logger;
  private config = getConfig();
  private isRunning = false;
  private healthCheckInterval?: NodeJS.Timeout;
  private priceMonitoringInterval?: NodeJS.Timeout;

  constructor() {
    this.logger.info('MEV Bot initializing...');
  }

  /**
   * Starts the MEV bot
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('MEV Bot is already running');
      return;
    }

    try {
      this.logger.info('Starting MEV Bot...');

      // Initialize services
      await this.initializeServices();

      // Start monitoring
      this.startPriceMonitoring();
      this.startHealthChecks();
      this.startScheduledTasks();

      this.isRunning = true;
      this.logger.info('MEV Bot started successfully');

      // Handle graceful shutdown
      this.setupGracefulShutdown();
    } catch (error) {
      this.logger.error('Failed to start MEV Bot', { error });
      throw error;
    }
  }

  /**
   * Stops the MEV bot
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('MEV Bot is not running');
      return;
    }

    this.logger.info('Stopping MEV Bot...');

    // Clear intervals
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.priceMonitoringInterval) {
      clearInterval(this.priceMonitoringInterval);
    }

    // Close services
    await this.cleanupServices();

    this.isRunning = false;
    this.logger.info('MEV Bot stopped');
  }

  /**
   * Initializes all services
   */
  private async initializeServices(): Promise<void> {
    const correlationId = uuidv4();
    const childLogger = createChildLogger(correlationId);

    try {
      childLogger.info('Initializing services...');

      // Test database connection
      const dbConnected = await databaseService.testConnection(correlationId);
      if (!dbConnected) {
        throw new Error('Database connection failed');
      }
      childLogger.info('Database connection established');

      // Test chain connections
      await this.testChainConnections(correlationId);

      childLogger.info('All services initialized successfully');
    } catch (error) {
      childLogger.error('Service initialization failed', { error });
      throw error;
    }
  }

  /**
   * Tests connections to all chains
   */
  private async testChainConnections(correlationId: string): Promise<void> {
    const childLogger = createChildLogger(correlationId);
    const chains = [1, 42161, 137, 8453]; // Ethereum, Arbitrum, Polygon, Base

    for (const chainId of chains) {
      try {
        const provider = await chainManager.getProvider(chainId, correlationId);
        const blockNumber = await provider.getBlockNumber();
        childLogger.info(`Chain ${chainId} connection established`, { blockNumber });
      } catch (error) {
        childLogger.error(`Chain ${chainId} connection failed`, { error });
        throw error;
      }
    }
  }

  /**
   * Starts price monitoring loop
   */
  private startPriceMonitoring(): void {
    this.logger.info('Starting price monitoring...');

    this.priceMonitoringInterval = setInterval(async () => {
      const correlationId = uuidv4();
      const childLogger = createChildLogger(correlationId);

      try {
        const startTime = Date.now();

        // Monitor prices from all DEXs
        await dexMonitor.monitorPrices(correlationId);

        // Get all cached prices
        const allPrices = dexMonitor.getAllCachedPrices();

        if (allPrices.length > 0) {
          // Calculate arbitrage opportunities
          const opportunities = await priceCalculator.calculateArbitrageOpportunities(
            allPrices, 
            correlationId
          );

          const duration = Date.now() - startTime;
          logPerformance('monitoring_cycle', duration, {
            pricesProcessed: allPrices.length,
            opportunitiesFound: opportunities.length
          });

          childLogger.info('Price monitoring cycle completed', {
            pricesProcessed: allPrices.length,
            opportunitiesFound: opportunities.length,
            duration
          });
        }
      } catch (error) {
        childLogger.error('Price monitoring cycle failed', { error });
      }
    }, this.config.system.priceUpdateInterval);
  }

  /**
   * Starts health check monitoring
   */
  private startHealthChecks(): void {
    this.logger.info('Starting health checks...');

    this.healthCheckInterval = setInterval(async () => {
      const correlationId = uuidv4();
      const childLogger = createChildLogger(correlationId);

      try {
        // Perform chain health checks
        await chainManager.performHealthCheck(correlationId);

        // Get connection status
        const connectionStatus = chainManager.getConnectionStatus();
        const healthyChains = Object.values(connectionStatus).filter(Boolean).length;
        const totalChains = Object.keys(connectionStatus).length;

        childLogger.info('Health check completed', {
          healthyChains,
          totalChains,
          connectionStatus
        });

        // Store system health data
        await this.storeSystemHealthData(correlationId);
      } catch (error) {
        childLogger.error('Health check failed', { error });
      }
    }, this.config.system.healthCheckInterval);
  }

  /**
   * Starts scheduled tasks
   */
  private startScheduledTasks(): void {
    this.logger.info('Starting scheduled tasks...');

    // Clean old data daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      const correlationId = uuidv4();
      const childLogger = createChildLogger(correlationId);

      try {
        childLogger.info('Starting daily data cleanup...');
        await databaseService.cleanOldData(correlationId);
        childLogger.info('Daily data cleanup completed');
      } catch (error) {
        childLogger.error('Daily data cleanup failed', { error });
      }
    });

    // Log performance metrics every hour
    cron.schedule('0 * * * *', async () => {
      const correlationId = uuidv4();
      const childLogger = createChildLogger(correlationId);

      try {
        const metrics = await databaseService.getPerformanceMetrics(undefined, 24, correlationId);
        childLogger.info('Performance metrics', { metrics });
      } catch (error) {
        childLogger.error('Failed to get performance metrics', { error });
      }
    });
  }

  /**
   * Stores system health data
   */
  private async storeSystemHealthData(correlationId: string): Promise<void> {
    const childLogger = createChildLogger(correlationId);

    try {
      const connectionDetails = chainManager.getConnectionDetails();
      const chains = [1, 42161, 137, 8453];

      for (const chainId of chains) {
        const details = connectionDetails[chainId];
        if (details) {
          const healthData = {
            id: uuidv4(),
            chainId,
            rpcStatus: details.isHealthy ? 'healthy' : 'down',
            lastBlockNumber: details.lastBlockNumber,
            lastBlockTime: details.lastBlockTime,
            latency: details.connections[details.currentConnectionIndex]?.latency || 0,
            errorCount: details.connections[details.currentConnectionIndex]?.errorCount || 0,
            uptime: Date.now() - details.lastBlockTime.getTime(),
            timestamp: new Date()
          };

          await databaseService.storeSystemHealth(healthData, correlationId);
        }
      }
    } catch (error) {
      childLogger.error('Failed to store system health data', { error });
    }
  }

  /**
   * Sets up graceful shutdown handlers
   */
  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      this.logger.info(`Received ${signal}, shutting down gracefully...`);
      await this.stop();
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught exception', { error });
      this.stop().then(() => process.exit(1));
    });
    process.on('unhandledRejection', (reason) => {
      this.logger.error('Unhandled rejection', { reason });
      this.stop().then(() => process.exit(1));
    });
  }

  /**
   * Cleans up services
   */
  private async cleanupServices(): Promise<void> {
    try {
      // Close chain manager connections
      await chainManager.close();

      // Close database connections
      await databaseService.close();

      this.logger.info('Services cleaned up successfully');
    } catch (error) {
      this.logger.error('Service cleanup failed', { error });
    }
  }

  /**
   * Gets bot status
   */
  getStatus(): any {
    return {
      isRunning: this.isRunning,
      config: {
        priceUpdateInterval: this.config.system.priceUpdateInterval,
        healthCheckInterval: this.config.system.healthCheckInterval,
        minProfitThreshold: this.config.trading.minProfitThreshold
      },
      connections: chainManager.getConnectionStatus(),
      monitoring: dexMonitor.getMonitoringStats(),
      calculation: priceCalculator.getCalculationStats()
    };
  }
}

// Create and start the bot
const bot = new MevBot();

// Start the bot if this file is run directly
if (require.main === module) {
  bot.start()
    .then(() => {
      logger.info('MEV Bot is running');
    })
    .catch((error) => {
      logger.error('Failed to start MEV Bot', { error });
      process.exit(1);
    });
}

export { MevBot }; 