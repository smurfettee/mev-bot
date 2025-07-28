import { z } from 'zod';
import { ChainId, DexName } from '../types/chain';

// Token pair validation schema
export const TokenPairSchema = z.object({
  baseToken: z.string().min(1),
  quoteToken: z.string().min(1),
  baseTokenAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  quoteTokenAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  baseTokenDecimals: z.number().int().min(0).max(18),
  quoteTokenDecimals: z.number().int().min(0).max(18),
  pairAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/)
});

// Price data validation schema
export const PriceDataSchema = z.object({
  id: z.string().uuid(),
  chainId: z.nativeEnum(ChainId),
  dexName: z.nativeEnum(DexName),
  tokenPair: z.string().min(1),
  baseToken: z.string().min(1),
  quoteToken: z.string().min(1),
  price: z.number().positive(),
  priceUsd: z.number().positive(),
  liquidity: z.number().nonnegative(),
  volume24h: z.number().nonnegative(),
  timestamp: z.date(),
  blockNumber: z.number().int().positive(),
  gasPrice: z.bigint().optional(),
  feeTier: z.number().int().min(0).max(10000).optional()
});

// Arbitrage opportunity validation schema
export const ArbitrageOpportunitySchema = z.object({
  id: z.string().uuid(),
  tokenPair: z.string().min(1),
  baseToken: z.string().min(1),
  quoteToken: z.string().min(1),
  sourceChain: z.nativeEnum(ChainId),
  sourceDex: z.nativeEnum(DexName),
  targetChain: z.nativeEnum(ChainId),
  targetDex: z.nativeEnum(DexName),
  sourcePrice: z.number().positive(),
  targetPrice: z.number().positive(),
  priceDifference: z.number(),
  priceDifferencePercent: z.number(),
  potentialProfit: z.number(),
  gasCost: z.number().nonnegative(),
  netProfit: z.number(),
  profitMargin: z.number(),
  timestamp: z.date(),
  isProfitable: z.boolean(),
  minProfitThreshold: z.number().positive()
});

// Price update validation schema
export const PriceUpdateSchema = z.object({
  correlationId: z.string().uuid(),
  chainId: z.nativeEnum(ChainId),
  dexName: z.nativeEnum(DexName),
  tokenPair: z.string().min(1),
  price: z.number().positive(),
  liquidity: z.number().nonnegative(),
  timestamp: z.date(),
  blockNumber: z.number().int().positive(),
  gasPrice: z.bigint().optional()
});

// System health validation schema
export const SystemHealthSchema = z.object({
  id: z.string().uuid(),
  chainId: z.nativeEnum(ChainId),
  rpcStatus: z.enum(['healthy', 'degraded', 'down']),
  lastBlockNumber: z.number().int().positive(),
  lastBlockTime: z.date(),
  latency: z.number().nonnegative(),
  errorCount: z.number().int().nonnegative(),
  uptime: z.number().nonnegative(),
  timestamp: z.date()
});

// RPC connection validation schema
export const RpcConnectionSchema = z.object({
  url: z.string().url(),
  isActive: z.boolean(),
  lastUsed: z.date(),
  latency: z.number().nonnegative(),
  errorCount: z.number().int().nonnegative(),
  maxRetries: z.number().int().positive()
});

// Chain configuration validation schema
export const ChainConfigSchema = z.object({
  id: z.nativeEnum(ChainId),
  name: z.string().min(1),
  rpcUrls: z.object({
    http: z.array(z.string().url()),
    ws: z.array(z.string().url())
  }),
  blockTime: z.number().positive(),
  gasLimit: z.number().int().positive(),
  maxPriorityFeePerGas: z.bigint().nonnegative(),
  maxFeePerGas: z.bigint().nonnegative()
});

// DEX configuration validation schema
export const DexConfigSchema = z.object({
  name: z.nativeEnum(DexName),
  chainId: z.nativeEnum(ChainId),
  factoryAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  routerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  version: z.string().min(1),
  feeTier: z.number().int().min(0).max(10000).optional(),
  isActive: z.boolean()
});

// Validation helper functions
export const validateTokenPair = (data: unknown) => {
  return TokenPairSchema.parse(data);
};

export const validatePriceData = (data: unknown) => {
  return PriceDataSchema.parse(data);
};

export const validateArbitrageOpportunity = (data: unknown) => {
  return ArbitrageOpportunitySchema.parse(data);
};

export const validatePriceUpdate = (data: unknown) => {
  return PriceUpdateSchema.parse(data);
};

export const validateSystemHealth = (data: unknown) => {
  return SystemHealthSchema.parse(data);
};

export const validateRpcConnection = (data: unknown) => {
  return RpcConnectionSchema.parse(data);
};

export const validateChainConfig = (data: unknown) => {
  return ChainConfigSchema.parse(data);
};

export const validateDexConfig = (data: unknown) => {
  return DexConfigSchema.parse(data);
}; 