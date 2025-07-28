import { promises as fs } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { logger, createChildLogger } from '../utils/logger';
import { 
  type PriceData, 
  type ArbitrageOpportunity, 
  type SystemHealth,
  type PriceAlert 
} from '../types/price';
import { ChainId, DexName } from '../types/chain';
import { getConfig } from '../config/env';

interface DatabaseData {
  prices: PriceData[];
  opportunities: ArbitrageOpportunity[];
  systemHealth: SystemHealth[];
  priceAlerts: PriceAlert[];
  performanceMetrics: any[];
}

export class DatabaseService {
  private dataPath: string;
  private data: DatabaseData;
  private logger = logger;
  private isInitialized = false;

  constructor() {
    const config = getConfig();
    this.dataPath = config.database.path.replace('.db', '.json');
    this.data = {
      prices: [],
      opportunities: [],
      systemHealth: [],
      priceAlerts: [],
      performanceMetrics: []
    };
  }

  /**
   * Initializes the database by loading existing data or creating new file
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Ensure data directory exists
      const dataDir = join(this.dataPath, '..');
      await fs.mkdir(dataDir, { recursive: true });

      // Try to load existing data
      try {
        const fileContent = await fs.readFile(this.dataPath, 'utf8');
        this.data = JSON.parse(fileContent);
        this.logger.info('Database loaded from file', { path: this.dataPath });
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          // File doesn't exist, create new database
          await this.saveData();
          this.logger.info('New database created', { path: this.dataPath });
        } else {
          throw error;
        }
      }

      this.isInitialized = true;
    } catch (error) {
      this.logger.error('Failed to initialize database', { error });
      throw error;
    }
  }

  /**
   * Saves data to file
   */
  private async saveData(): Promise<void> {
    try {
      await fs.writeFile(this.dataPath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      this.logger.error('Failed to save database', { error });
      throw error;
    }
  }

  /**
   * Stores price data
   */
  async storePriceData(priceData: PriceData, correlationId?: string): Promise<void> {
    await this.initialize();
    
    const childLogger = correlationId ? createChildLogger(correlationId) : this.logger;
    const startTime = Date.now();

    try {
      // Add to in-memory data
      this.data.prices.push(priceData);
      
      // Keep only last 10000 prices to prevent memory issues
      if (this.data.prices.length > 10000) {
        this.data.prices = this.data.prices.slice(-10000);
      }

      await this.saveData();
      
      const duration = Date.now() - startTime;
      childLogger.debug('Price data stored', {
        priceData: priceData.id,
        duration
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      childLogger.error('Failed to store price data', {
        priceData: priceData.id,
        duration,
        error
      });
      throw error;
    }
  }

  /**
   * Stores arbitrage opportunity
   */
  async storeArbitrageOpportunity(
    opportunity: ArbitrageOpportunity, 
    correlationId?: string
  ): Promise<void> {
    await this.initialize();
    
    const childLogger = correlationId ? createChildLogger(correlationId) : this.logger;
    const startTime = Date.now();

    try {
      this.data.opportunities.push(opportunity);
      
      // Keep only last 1000 opportunities
      if (this.data.opportunities.length > 1000) {
        this.data.opportunities = this.data.opportunities.slice(-1000);
      }

      await this.saveData();
      
      const duration = Date.now() - startTime;
      childLogger.debug('Arbitrage opportunity stored', {
        opportunity: opportunity.id,
        duration
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      childLogger.error('Failed to store arbitrage opportunity', {
        opportunity: opportunity.id,
        duration,
        error
      });
      throw error;
    }
  }

  /**
   * Stores system health data
   */
  async storeSystemHealth(health: SystemHealth, correlationId?: string): Promise<void> {
    await this.initialize();
    
    const childLogger = correlationId ? createChildLogger(correlationId) : this.logger;
    const startTime = Date.now();

    try {
      this.data.systemHealth.push(health);
      
      // Keep only last 1000 health records
      if (this.data.systemHealth.length > 1000) {
        this.data.systemHealth = this.data.systemHealth.slice(-1000);
      }

      await this.saveData();
      
      const duration = Date.now() - startTime;
      childLogger.debug('System health stored', {
        health: health.id,
        duration
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      childLogger.error('Failed to store system health', {
        health: health.id,
        duration,
        error
      });
      throw error;
    }
  }

  /**
   * Stores price alert
   */
  async storePriceAlert(alert: PriceAlert, correlationId?: string): Promise<void> {
    await this.initialize();
    
    const childLogger = correlationId ? createChildLogger(correlationId) : this.logger;
    const startTime = Date.now();

    try {
      this.data.priceAlerts.push(alert);
      
      // Keep only last 500 alerts
      if (this.data.priceAlerts.length > 500) {
        this.data.priceAlerts = this.data.priceAlerts.slice(-500);
      }

      await this.saveData();
      
      const duration = Date.now() - startTime;
      childLogger.debug('Price alert stored', {
        alert: alert.id,
        duration
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      childLogger.error('Failed to store price alert', {
        alert: alert.id,
        duration,
        error
      });
      throw error;
    }
  }

  /**
   * Gets recent prices for a specific token pair
   */
  async getRecentPrices(
    tokenPair: string, 
    limit: number = 100,
    correlationId?: string
  ): Promise<PriceData[]> {
    await this.initialize();
    
    const childLogger = correlationId ? createChildLogger(correlationId) : this.logger;
    const startTime = Date.now();

    try {
      const filteredPrices = this.data.prices
        .filter(p => p.tokenPair === tokenPair)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);

      const duration = Date.now() - startTime;
      childLogger.debug('Recent prices retrieved', {
        tokenPair,
        count: filteredPrices.length,
        duration
      });

      return filteredPrices;
    } catch (error) {
      const duration = Date.now() - startTime;
      childLogger.error('Failed to get recent prices', {
        tokenPair,
        duration,
        error
      });
      throw error;
    }
  }

  /**
   * Gets prices for a specific chain and DEX
   */
  async getPricesByChainAndDex(
    chainId: ChainId,
    dexName: DexName,
    limit: number = 50,
    correlationId?: string
  ): Promise<PriceData[]> {
    await this.initialize();
    
    const childLogger = correlationId ? createChildLogger(correlationId) : this.logger;
    const startTime = Date.now();

    try {
      const filteredPrices = this.data.prices
        .filter(p => p.chainId === chainId && p.dexName === dexName)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);

      const duration = Date.now() - startTime;
      childLogger.debug('Prices by chain and DEX retrieved', {
        chainId,
        dexName,
        count: filteredPrices.length,
        duration
      });

      return filteredPrices;
    } catch (error) {
      const duration = Date.now() - startTime;
      childLogger.error('Failed to get prices by chain and DEX', {
        chainId,
        dexName,
        duration,
        error
      });
      throw error;
    }
  }

  /**
   * Gets profitable opportunities
   */
  async getProfitableOpportunities(
    minProfitMargin: number = 2.0,
    limit: number = 50,
    correlationId?: string
  ): Promise<ArbitrageOpportunity[]> {
    await this.initialize();
    
    const childLogger = correlationId ? createChildLogger(correlationId) : this.logger;
    const startTime = Date.now();

    try {
      const filteredOpportunities = this.data.opportunities
        .filter(o => o.isProfitable && o.profitMargin >= minProfitMargin)
        .sort((a, b) => b.profitMargin - a.profitMargin)
        .slice(0, limit);

      const duration = Date.now() - startTime;
      childLogger.debug('Profitable opportunities retrieved', {
        minProfitMargin,
        count: filteredOpportunities.length,
        duration
      });

      return filteredOpportunities;
    } catch (error) {
      const duration = Date.now() - startTime;
      childLogger.error('Failed to get profitable opportunities', {
        minProfitMargin,
        duration,
        error
      });
      throw error;
    }
  }

  /**
   * Gets system health for all chains
   */
  async getSystemHealth(correlationId?: string): Promise<SystemHealth[]> {
    await this.initialize();
    
    const childLogger = correlationId ? createChildLogger(correlationId) : this.logger;
    const startTime = Date.now();

    try {
      const healthData = this.data.systemHealth
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      const duration = Date.now() - startTime;
      childLogger.debug('System health retrieved', {
        count: healthData.length,
        duration
      });

      return healthData;
    } catch (error) {
      const duration = Date.now() - startTime;
      childLogger.error('Failed to get system health', {
        duration,
        error
      });
      throw error;
    }
  }

  /**
   * Gets unprocessed price alerts
   */
  async getUnprocessedAlerts(correlationId?: string): Promise<PriceAlert[]> {
    await this.initialize();
    
    const childLogger = correlationId ? createChildLogger(correlationId) : this.logger;
    const startTime = Date.now();

    try {
      const unprocessedAlerts = this.data.priceAlerts
        .filter(a => !a.isNotified)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      const duration = Date.now() - startTime;
      childLogger.debug('Unprocessed alerts retrieved', {
        count: unprocessedAlerts.length,
        duration
      });

      return unprocessedAlerts;
    } catch (error) {
      const duration = Date.now() - startTime;
      childLogger.error('Failed to get unprocessed alerts', {
        duration,
        error
      });
      throw error;
    }
  }

  /**
   * Marks a price alert as notified
   */
  async markAlertAsNotified(alertId: string, correlationId?: string): Promise<void> {
    await this.initialize();
    
    const childLogger = correlationId ? createChildLogger(correlationId) : this.logger;
    const startTime = Date.now();

    try {
      const alert = this.data.priceAlerts.find(a => a.id === alertId);
      if (alert) {
        alert.isNotified = true;
        alert.notificationSentAt = new Date();
        await this.saveData();
      }

      const duration = Date.now() - startTime;
      childLogger.debug('Alert marked as notified', {
        alertId,
        duration
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      childLogger.error('Failed to mark alert as notified', {
        alertId,
        duration,
        error
      });
      throw error;
    }
  }

  /**
   * Gets performance metrics
   */
  async getPerformanceMetrics(
    operation?: string,
    hours: number = 24,
    correlationId?: string
  ): Promise<any[]> {
    await this.initialize();
    
    const childLogger = correlationId ? createChildLogger(correlationId) : this.logger;
    const startTime = Date.now();

    try {
      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
      
      let metrics = this.data.performanceMetrics
        .filter(m => new Date(m.timestamp) > cutoffTime);

      if (operation) {
        metrics = metrics.filter(m => m.operation === operation);
      }

      const duration = Date.now() - startTime;
      childLogger.debug('Performance metrics retrieved', {
        operation,
        hours,
        count: metrics.length,
        duration
      });

      return metrics;
    } catch (error) {
      const duration = Date.now() - startTime;
      childLogger.error('Failed to get performance metrics', {
        operation,
        hours,
        duration,
        error
      });
      throw error;
    }
  }

  /**
   * Stores performance metric
   */
  async storePerformanceMetric(
    operation: string,
    duration: number,
    success: boolean,
    chainId?: ChainId,
    dexName?: DexName,
    errorMessage?: string,
    correlationId?: string
  ): Promise<void> {
    await this.initialize();
    
    const childLogger = correlationId ? createChildLogger(correlationId) : this.logger;
    const startTime = Date.now();

    try {
      const metric = {
        id: uuidv4(),
        operation,
        duration_ms: duration,
        chain_id: chainId,
        dex_name: dexName,
        success,
        error_message: errorMessage,
        timestamp: new Date().toISOString()
      };

      this.data.performanceMetrics.push(metric);
      
      // Keep only last 1000 metrics
      if (this.data.performanceMetrics.length > 1000) {
        this.data.performanceMetrics = this.data.performanceMetrics.slice(-1000);
      }

      await this.saveData();
      
      const saveDuration = Date.now() - startTime;
      childLogger.debug('Performance metric stored', {
        operation,
        duration: saveDuration
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      childLogger.error('Failed to store performance metric', {
        operation,
        duration,
        error
      });
      throw error;
    }
  }

  /**
   * Cleans old data
   */
  async cleanOldData(correlationId?: string): Promise<void> {
    await this.initialize();
    
    const childLogger = correlationId ? createChildLogger(correlationId) : this.logger;
    const startTime = Date.now();

    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Clean old prices (7 days)
      this.data.prices = this.data.prices.filter(p => p.timestamp > sevenDaysAgo);
      
      // Clean old opportunities (30 days)
      this.data.opportunities = this.data.opportunities.filter(o => o.timestamp > thirtyDaysAgo);
      
      // Clean old system health (7 days)
      this.data.systemHealth = this.data.systemHealth.filter(h => h.timestamp > sevenDaysAgo);
      
      // Clean old performance metrics (30 days)
      this.data.performanceMetrics = this.data.performanceMetrics.filter(m => new Date(m.timestamp) > thirtyDaysAgo);
      
      // Clean old price alerts (7 days)
      this.data.priceAlerts = this.data.priceAlerts.filter(a => a.timestamp > sevenDaysAgo);

      await this.saveData();
      
      const duration = Date.now() - startTime;
      childLogger.info('Old data cleaned', { duration });
    } catch (error) {
      const duration = Date.now() - startTime;
      childLogger.error('Failed to clean old data', {
        duration,
        error
      });
    }
  }

  /**
   * Tests database connection
   */
  async testConnection(correlationId?: string): Promise<boolean> {
    try {
      await this.initialize();
      return true;
    } catch (error) {
      this.logger.error('Database connection test failed', { error });
      return false;
    }
  }

  /**
   * Closes the database connection
   */
  async close(): Promise<void> {
    try {
      await this.saveData();
      this.logger.info('Database connection closed');
    } catch (error) {
      this.logger.error('Error closing database', { error });
    }
  }
}

// Export singleton instance
export const databaseService = new DatabaseService(); 