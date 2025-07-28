import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import { logger, createChildLogger, logPerformance } from '../utils/logger';
import { ChainId, DexName } from '../types/chain';
import { type PriceData, type PriceUpdate } from '../types/price';
import { getDexConfig, getActiveDexConfigs } from '../config/chains';
import { chainManager } from './chainManager';
import { databaseService } from './database';
import { SYSTEM_CONSTANTS, TOKEN_PAIRS } from '../utils/constants';

// DEX-specific ABI fragments
const UNISWAP_V2_PAIR_ABI = [
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)'
];

const UNISWAP_V3_POOL_ABI = [
  'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function liquidity() external view returns (uint128)'
];

const ERC20_ABI = [
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
  'function name() external view returns (string)'
];

export class DexMonitor {
  private logger = logger;
  private activeDexConfigs = getActiveDexConfigs();
  private priceCache = new Map<string, PriceData>();
  private lastUpdateTime = new Map<string, number>();

  constructor() {
    this.logger.info('DEX Monitor initialized', { 
      activeDexes: this.activeDexConfigs.length 
    });
  }

  /**
   * Monitors prices for all active DEXs and token pairs
   */
  async monitorPrices(correlationId?: string): Promise<void> {
    const childLogger = correlationId ? createChildLogger(correlationId) : this.logger;
    const startTime = Date.now();

    try {
      const promises: Promise<void>[] = [];

      for (const dexConfig of this.activeDexConfigs) {
        for (const tokenPair of TOKEN_PAIRS) {
          promises.push(
            this.fetchPriceForDex(dexConfig, tokenPair, correlationId)
          );
        }
      }

      await Promise.allSettled(promises);
      
      const duration = Date.now() - startTime;
      logPerformance('dex_monitor_batch', duration, { 
        dexCount: this.activeDexConfigs.length,
        tokenPairCount: TOKEN_PAIRS.length 
      });

      childLogger.debug('Price monitoring batch completed', { 
        duration,
        processedPairs: promises.length 
      });
    } catch (error) {
      childLogger.error('Price monitoring batch failed', { error });
    }
  }

  /**
   * Fetches price for a specific DEX and token pair
   */
  private async fetchPriceForDex(
    dexConfig: any,
    tokenPair: any,
    correlationId?: string
  ): Promise<void> {
    const childLogger = correlationId ? createChildLogger(correlationId) : this.logger;
    const cacheKey = `${dexConfig.chainId}-${dexConfig.name}-${tokenPair.baseToken}-${tokenPair.quoteToken}`;
    const now = Date.now();

    // Check if we have recent data
    const lastUpdate = this.lastUpdateTime.get(cacheKey) || 0;
    if (now - lastUpdate < SYSTEM_CONSTANTS.PRICE_UPDATE_INTERVAL) {
      return;
    }

    try {
      const startTime = Date.now();
      const provider = await chainManager.getProvider(dexConfig.chainId, correlationId);
      const blockNumber = await provider.getBlockNumber();
      const gasPrice = await provider.getFeeData();

      let priceData: PriceData;

      switch (dexConfig.name) {
        case DexName.UNISWAP_V2:
          priceData = await this.fetchUniswapV2Price(
            dexConfig, tokenPair, provider, blockNumber, gasPrice.gasPrice, correlationId
          );
          break;
        case DexName.UNISWAP_V3:
          priceData = await this.fetchUniswapV3Price(
            dexConfig, tokenPair, provider, blockNumber, gasPrice.gasPrice, correlationId
          );
          break;
        case DexName.SUSHISWAP:
          priceData = await this.fetchSushiSwapPrice(
            dexConfig, tokenPair, provider, blockNumber, gasPrice.gasPrice, correlationId
          );
          break;
        default:
          childLogger.warn(`Unsupported DEX: ${dexConfig.name}`, { chainId: dexConfig.chainId });
          return;
      }

      if (priceData) {
        // Cache the price data
        this.priceCache.set(cacheKey, priceData);
        this.lastUpdateTime.set(cacheKey, now);

        // Store in database
        await databaseService.storePriceData(priceData, correlationId);

        const duration = Date.now() - startTime;
        logPerformance(`price_fetch_${dexConfig.name}`, duration, {
          chainId: dexConfig.chainId,
          dexName: dexConfig.name,
          tokenPair: tokenPair.baseToken + '/' + tokenPair.quoteToken
        });

        childLogger.debug('Price fetched successfully', {
          chainId: dexConfig.chainId,
          dexName: dexConfig.name,
          tokenPair: priceData.tokenPair,
          price: priceData.price,
          liquidity: priceData.liquidity
        });
      }
    } catch (error) {
      childLogger.error('Failed to fetch price', {
        chainId: dexConfig.chainId,
        dexName: dexConfig.name,
        tokenPair: tokenPair.baseToken + '/' + tokenPair.quoteToken,
        error: error.message
      });

      // Store performance metric for failed operation
      await databaseService.storePerformanceMetric(
        `price_fetch_${dexConfig.name}`,
        Date.now() - startTime,
        false,
        dexConfig.chainId,
        dexConfig.name,
        error.message,
        correlationId
      );
    }
  }

  /**
   * Fetches price from Uniswap V2
   */
  private async fetchUniswapV2Price(
    dexConfig: any,
    tokenPair: any,
    provider: ethers.Provider,
    blockNumber: number,
    gasPrice: bigint,
    correlationId?: string
  ): Promise<PriceData> {
    const childLogger = correlationId ? createChildLogger(correlationId) : this.logger;

    try {
      // Get pair address (this would need to be calculated or stored)
      const pairAddress = await this.getPairAddress(dexConfig, tokenPair, provider);
      
      if (!pairAddress) {
        throw new Error('Pair address not found');
      }

      const pairContract = new ethers.Contract(pairAddress, UNISWAP_V2_PAIR_ABI, provider);
      const reserves = await pairContract.getReserves();
      const token0 = await pairContract.token0();
      const token1 = await pairContract.token1();

      // Determine which token is which
      const isToken0Base = token0.toLowerCase() === tokenPair.baseTokenAddress.toLowerCase();
      const reserve0 = reserves[0];
      const reserve1 = reserves[1];

      const baseReserve = isToken0Base ? reserve0 : reserve1;
      const quoteReserve = isToken0Base ? reserve1 : reserve0;

      // Calculate price
      const price = Number(quoteReserve) / Number(baseReserve);
      const liquidity = Number(baseReserve) + Number(quoteReserve);

      return {
        id: uuidv4(),
        chainId: dexConfig.chainId,
        dexName: dexConfig.name,
        tokenPair: `${tokenPair.baseToken}/${tokenPair.quoteToken}`,
        baseToken: tokenPair.baseToken,
        quoteToken: tokenPair.quoteToken,
        price,
        priceUsd: price, // Would need USD conversion
        liquidity,
        volume24h: 0, // Would need to fetch from API
        timestamp: new Date(),
        blockNumber,
        gasPrice,
        feeTier: undefined
      };
    } catch (error) {
      childLogger.error('Failed to fetch Uniswap V2 price', { error });
      throw error;
    }
  }

  /**
   * Fetches price from Uniswap V3
   */
  private async fetchUniswapV3Price(
    dexConfig: any,
    tokenPair: any,
    provider: ethers.Provider,
    blockNumber: number,
    gasPrice: bigint,
    correlationId?: string
  ): Promise<PriceData> {
    const childLogger = correlationId ? createChildLogger(correlationId) : this.logger;

    try {
      // Get pool address (this would need to be calculated or stored)
      const poolAddress = await this.getPoolAddress(dexConfig, tokenPair, provider);
      
      if (!poolAddress) {
        throw new Error('Pool address not found');
      }

      const poolContract = new ethers.Contract(poolAddress, UNISWAP_V3_POOL_ABI, provider);
      const slot0 = await poolContract.slot0();
      const liquidity = await poolContract.liquidity();

      // Calculate price from sqrtPriceX96
      const sqrtPriceX96 = slot0[0];
      const price = this.calculateUniswapV3Price(sqrtPriceX96);

      return {
        id: uuidv4(),
        chainId: dexConfig.chainId,
        dexName: dexConfig.name,
        tokenPair: `${tokenPair.baseToken}/${tokenPair.quoteToken}`,
        baseToken: tokenPair.baseToken,
        quoteToken: tokenPair.quoteToken,
        price,
        priceUsd: price, // Would need USD conversion
        liquidity: Number(liquidity),
        volume24h: 0, // Would need to fetch from API
        timestamp: new Date(),
        blockNumber,
        gasPrice,
        feeTier: dexConfig.feeTier
      };
    } catch (error) {
      childLogger.error('Failed to fetch Uniswap V3 price', { error });
      throw error;
    }
  }

  /**
   * Fetches price from SushiSwap (similar to Uniswap V2)
   */
  private async fetchSushiSwapPrice(
    dexConfig: any,
    tokenPair: any,
    provider: ethers.Provider,
    blockNumber: number,
    gasPrice: bigint,
    correlationId?: string
  ): Promise<PriceData> {
    // SushiSwap uses the same logic as Uniswap V2
    return this.fetchUniswapV2Price(dexConfig, tokenPair, provider, blockNumber, gasPrice, correlationId);
  }

  /**
   * Calculates price from Uniswap V3 sqrtPriceX96
   */
  private calculateUniswapV3Price(sqrtPriceX96: bigint): number {
    const Q96 = 2n ** 96n;
    const price = Number(sqrtPriceX96 * sqrtPriceX96 * Q96) / Number(Q96 * Q96);
    return price;
  }

  /**
   * Gets pair address for a token pair (placeholder implementation)
   */
  private async getPairAddress(
    dexConfig: any,
    tokenPair: any,
    provider: ethers.Provider
  ): Promise<string | null> {
    // This would need to be implemented based on the specific DEX factory
    // For now, return null as placeholder
    return null;
  }

  /**
   * Gets pool address for a token pair (placeholder implementation)
   */
  private async getPoolAddress(
    dexConfig: any,
    tokenPair: any,
    provider: ethers.Provider
  ): Promise<string | null> {
    // This would need to be implemented based on the specific DEX factory
    // For now, return null as placeholder
    return null;
  }

  /**
   * Gets cached price data
   */
  getCachedPrice(chainId: ChainId, dexName: DexName, tokenPair: string): PriceData | null {
    const cacheKey = `${chainId}-${dexName}-${tokenPair}`;
    return this.priceCache.get(cacheKey) || null;
  }

  /**
   * Gets all cached prices
   */
  getAllCachedPrices(): PriceData[] {
    return Array.from(this.priceCache.values());
  }

  /**
   * Clears price cache
   */
  clearCache(): void {
    this.priceCache.clear();
    this.lastUpdateTime.clear();
    this.logger.info('Price cache cleared');
  }

  /**
   * Gets monitoring statistics
   */
  getMonitoringStats(): any {
    return {
      activeDexes: this.activeDexConfigs.length,
      cachedPrices: this.priceCache.size,
      lastUpdateTimes: Object.fromEntries(this.lastUpdateTime)
    };
  }
}

// Export singleton instance
export const dexMonitor = new DexMonitor(); 