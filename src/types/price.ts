import { ChainId, DexName } from './chain';

export interface TokenPair {
  baseToken: string;
  quoteToken: string;
  baseTokenAddress: string;
  quoteTokenAddress: string;
  baseTokenDecimals: number;
  quoteTokenDecimals: number;
  pairAddress: string;
}

export interface PriceData {
  id: string;
  chainId: ChainId;
  dexName: DexName;
  tokenPair: string;
  baseToken: string;
  quoteToken: string;
  price: number;
  priceUsd: number;
  liquidity: number;
  volume24h: number;
  timestamp: Date;
  blockNumber: number;
  gasPrice?: bigint;
  feeTier?: number;
}

export interface ArbitrageOpportunity {
  id: string;
  tokenPair: string;
  baseToken: string;
  quoteToken: string;
  sourceChain: ChainId;
  sourceDex: DexName;
  targetChain: ChainId;
  targetDex: DexName;
  sourcePrice: number;
  targetPrice: number;
  priceDifference: number;
  priceDifferencePercent: number;
  potentialProfit: number;
  gasCost: number;
  netProfit: number;
  profitMargin: number;
  timestamp: Date;
  isProfitable: boolean;
  minProfitThreshold: number;
}

export interface PriceUpdate {
  correlationId: string;
  chainId: ChainId;
  dexName: DexName;
  tokenPair: string;
  price: number;
  liquidity: number;
  timestamp: Date;
  blockNumber: number;
  gasPrice?: bigint;
}

export interface PriceAlert {
  id: string;
  opportunityId: string;
  tokenPair: string;
  profitMargin: number;
  netProfit: number;
  sourceChain: ChainId;
  targetChain: ChainId;
  timestamp: Date;
  isNotified: boolean;
  notificationSentAt?: Date;
}

export interface SystemHealth {
  id: string;
  chainId: ChainId;
  rpcStatus: 'healthy' | 'degraded' | 'down';
  lastBlockNumber: number;
  lastBlockTime: Date;
  latency: number;
  errorCount: number;
  uptime: number;
  timestamp: Date;
} 