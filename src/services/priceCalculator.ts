import { v4 as uuidv4 } from 'uuid';
import { logger, createChildLogger, logPerformance, logArbitrageOpportunity } from '../utils/logger';
import { ChainId, DexName } from '../types/chain';
import { type PriceData, type ArbitrageOpportunity } from '../types/price';
import { getConfig } from '../config/env';
import { databaseService } from './database';
import { chainManager } from './chainManager';
import { GAS_PRICES, SYSTEM_CONSTANTS } from '../utils/constants';

export class PriceCalculator {
  private logger = logger;
  private config = getConfig();

  constructor() {
    this.logger.info('Price Calculator initialized');
  }

  /**
   * Calculates arbitrage opportunities from price data
   */
  async calculateArbitrageOpportunities(
    priceData: PriceData[],
    correlationId?: string
  ): Promise<ArbitrageOpportunity[]> {
    const childLogger = correlationId ? createChildLogger(correlationId) : this.logger;
    const startTime = Date.now();
    const opportunities: ArbitrageOpportunity[] = [];

    try {
      // Group prices by token pair
      const pricesByPair = this.groupPricesByPair(priceData);

      for (const [tokenPair, prices] of pricesByPair) {
        const pairOpportunities = await this.calculatePairOpportunities(
          tokenPair, 
          prices, 
          correlationId
        );
        opportunities.push(...pairOpportunities);
      }

      const duration = Date.now() - startTime;
      logPerformance('arbitrage_calculation', duration, {
        inputPrices: priceData.length,
        opportunitiesFound: opportunities.length
      });

      childLogger.info('Arbitrage calculation completed', {
        inputPrices: priceData.length,
        opportunitiesFound: opportunities.length,
        duration
      });

      return opportunities;
    } catch (error) {
      childLogger.error('Arbitrage calculation failed', { error });
      throw error;
    }
  }

  /**
   * Groups price data by token pair
   */
  private groupPricesByPair(priceData: PriceData[]): Map<string, PriceData[]> {
    const grouped = new Map<string, PriceData[]>();

    for (const price of priceData) {
      const key = price.tokenPair;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(price);
    }

    return grouped;
  }

  /**
   * Calculates arbitrage opportunities for a specific token pair
   */
  private async calculatePairOpportunities(
    tokenPair: string,
    prices: PriceData[],
    correlationId?: string
  ): Promise<ArbitrageOpportunity[]> {
    const childLogger = correlationId ? createChildLogger(correlationId) : this.logger;
    const opportunities: ArbitrageOpportunity[] = [];

    // Filter out old prices
    const recentPrices = prices.filter(price => 
      Date.now() - price.timestamp.getTime() < SYSTEM_CONSTANTS.MAX_PRICE_AGE
    );

    if (recentPrices.length < 2) {
      return opportunities;
    }

    // Compare all price combinations
    for (let i = 0; i < recentPrices.length; i++) {
      for (let j = i + 1; j < recentPrices.length; j++) {
        const sourcePrice = recentPrices[i];
        const targetPrice = recentPrices[j];

        // Skip if same chain and DEX
        if (sourcePrice.chainId === targetPrice.chainId && 
            sourcePrice.dexName === targetPrice.dexName) {
          continue;
        }

        const opportunity = await this.calculateOpportunity(
          sourcePrice, 
          targetPrice, 
          correlationId
        );

        if (opportunity && opportunity.isProfitable) {
          opportunities.push(opportunity);
          
          // Log profitable opportunity
          logArbitrageOpportunity(opportunity);
          
          // Store in database
          await databaseService.storeArbitrageOpportunity(opportunity, correlationId);
        }
      }
    }

    return opportunities;
  }

  /**
   * Calculates a single arbitrage opportunity between two prices
   */
  private async calculateOpportunity(
    sourcePrice: PriceData,
    targetPrice: PriceData,
    correlationId?: string
  ): Promise<ArbitrageOpportunity | null> {
    const childLogger = correlationId ? createChildLogger(correlationId) : this.logger;

    try {
      // Calculate price difference
      const priceDifference = Math.abs(sourcePrice.price - targetPrice.price);
      const priceDifferencePercent = (priceDifference / Math.min(sourcePrice.price, targetPrice.price)) * 100;

      // Check if difference is significant enough
      if (priceDifferencePercent < this.config.trading.minProfitThreshold) {
        return null;
      }

      // Determine which is the buy and which is the sell
      const isSourceCheaper = sourcePrice.price < targetPrice.price;
      const buyPrice = isSourceCheaper ? sourcePrice.price : targetPrice.price;
      const sellPrice = isSourceCheaper ? targetPrice.price : sourcePrice.price;
      const buyChain = isSourceCheaper ? sourcePrice.chainId : targetPrice.chainId;
      const sellChain = isSourceCheaper ? targetPrice.chainId : sourcePrice.chainId;
      const buyDex = isSourceCheaper ? sourcePrice.dexName : targetPrice.dexName;
      const sellDex = isSourceCheaper ? targetPrice.dexName : sourcePrice.dexName;

      // Calculate potential profit
      const potentialProfit = (sellPrice - buyPrice) * sourcePrice.liquidity;

      // Estimate gas costs
      const buyGasCost = await this.estimateGasCost(buyChain, correlationId);
      const sellGasCost = await this.estimateGasCost(sellChain, correlationId);
      const totalGasCost = buyGasCost + sellGasCost;

      // Calculate net profit
      const netProfit = potentialProfit - totalGasCost;
      const profitMargin = (netProfit / potentialProfit) * 100;

      // Check if profitable after gas costs
      const isProfitable = netProfit > 0 && 
                          profitMargin >= this.config.trading.minProfitThreshold &&
                          totalGasCost <= this.config.trading.maxGasCost;

      const opportunity: ArbitrageOpportunity = {
        id: uuidv4(),
        tokenPair: sourcePrice.tokenPair,
        baseToken: sourcePrice.baseToken,
        quoteToken: sourcePrice.quoteToken,
        sourceChain: buyChain,
        sourceDex: buyDex,
        targetChain: sellChain,
        targetDex: sellDex,
        sourcePrice: buyPrice,
        targetPrice: sellPrice,
        priceDifference,
        priceDifferencePercent,
        potentialProfit,
        gasCost: totalGasCost,
        netProfit,
        profitMargin,
        timestamp: new Date(),
        isProfitable,
        minProfitThreshold: this.config.trading.minProfitThreshold
      };

      childLogger.debug('Arbitrage opportunity calculated', {
        tokenPair: opportunity.tokenPair,
        profitMargin: opportunity.profitMargin,
        netProfit: opportunity.netProfit,
        isProfitable: opportunity.isProfitable
      });

      return opportunity;
    } catch (error) {
      childLogger.error('Failed to calculate arbitrage opportunity', { error });
      return null;
    }
  }

  /**
   * Estimates gas cost for a transaction on a specific chain
   */
  private async estimateGasCost(chainId: ChainId, correlationId?: string): Promise<number> {
    try {
      const gasConfig = GAS_PRICES[chainId];
      const provider = await chainManager.getProvider(chainId, correlationId);
      const gasPrice = await provider.getFeeData();

      // Estimate gas limit for a swap transaction
      const estimatedGasLimit = gasConfig.gasLimit;
      const gasCostWei = (gasPrice.gasPrice || 0n) * BigInt(estimatedGasLimit);
      
      // Convert to USD (simplified - would need price feed)
      const gasCostEth = Number(gasCostWei) / 1e18;
      const ethPrice = 2000; // Placeholder - would need real ETH price
      const gasCostUsd = gasCostEth * ethPrice;

      return gasCostUsd;
    } catch (error) {
      this.logger.error('Failed to estimate gas cost', { chainId, error });
      return 0;
    }
  }

  /**
   * Calculates optimal trade size based on liquidity
   */
  private calculateOptimalTradeSize(
    sourceLiquidity: number,
    targetLiquidity: number,
    priceDifference: number
  ): number {
    // Simple calculation - could be more sophisticated
    const maxTradeSize = Math.min(sourceLiquidity, targetLiquidity) * 0.1; // 10% of liquidity
    const profitBasedSize = priceDifference * 1000; // Scale based on price difference
    
    return Math.min(maxTradeSize, profitBasedSize);
  }

  /**
   * Validates if an opportunity is still valid
   */
  async validateOpportunity(
    opportunity: ArbitrageOpportunity,
    correlationId?: string
  ): Promise<boolean> {
    const childLogger = correlationId ? createChildLogger(correlationId) : this.logger;

    try {
      // Check if prices are still current
      const maxAge = SYSTEM_CONSTANTS.MAX_PRICE_AGE;
      const opportunityAge = Date.now() - opportunity.timestamp.getTime();
      
      if (opportunityAge > maxAge) {
        childLogger.debug('Opportunity too old', { 
          opportunityId: opportunity.id,
          age: opportunityAge 
        });
        return false;
      }

      // Recalculate gas costs
      const currentGasCost = await this.estimateGasCost(opportunity.sourceChain, correlationId) +
                           await this.estimateGasCost(opportunity.targetChain, correlationId);

      // Check if still profitable
      const currentNetProfit = opportunity.potentialProfit - currentGasCost;
      const currentProfitMargin = (currentNetProfit / opportunity.potentialProfit) * 100;

      const isValid = currentNetProfit > 0 && 
                     currentProfitMargin >= this.config.trading.minProfitThreshold &&
                     currentGasCost <= this.config.trading.maxGasCost;

      childLogger.debug('Opportunity validation result', {
        opportunityId: opportunity.id,
        isValid,
        currentNetProfit,
        currentProfitMargin
      });

      return isValid;
    } catch (error) {
      childLogger.error('Failed to validate opportunity', { 
        opportunityId: opportunity.id, 
        error 
      });
      return false;
    }
  }

  /**
   * Gets calculation statistics
   */
  getCalculationStats(): any {
    return {
      minProfitThreshold: this.config.trading.minProfitThreshold,
      maxGasCost: this.config.trading.maxGasCost,
      minLiquidityThreshold: this.config.trading.minLiquidityThreshold
    };
  }
}

// Export singleton instance
export const priceCalculator = new PriceCalculator(); 