import { z } from 'zod';

export const EnvironmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // Database
  DATABASE_PATH: z.string().default('./data/mev_bot.db'),
  
  // RPC URLs
  ETHEREUM_RPC_HTTP: z.string(),
  ETHEREUM_RPC_WS: z.string(),
  ARBITRUM_RPC_HTTP: z.string(),
  ARBITRUM_RPC_WS: z.string(),
  POLYGON_RPC_HTTP: z.string(),
  POLYGON_RPC_WS: z.string(),
  BASE_RPC_HTTP: z.string(),
  BASE_RPC_WS: z.string(),
  
  // Alert Configuration
  ALERT_WEBHOOK_URL: z.string().optional(),
  ALERT_DISCORD_WEBHOOK: z.string().optional(),
  ALERT_TELEGRAM_BOT_TOKEN: z.string().optional(),
  ALERT_TELEGRAM_CHAT_ID: z.string().optional(),
  
  // Trading Configuration
  MIN_PROFIT_THRESHOLD: z.string().transform(Number).default('2.0'),
  MAX_GAS_COST: z.string().transform(Number).default('100'),
  MIN_LIQUIDITY_THRESHOLD: z.string().transform(Number).default('10000'),
  
  // System Configuration
  PRICE_UPDATE_INTERVAL: z.string().transform(Number).default('1000'),
  HEALTH_CHECK_INTERVAL: z.string().transform(Number).default('30000'),
  MAX_RETRIES: z.string().transform(Number).default('3'),
  CONNECTION_TIMEOUT: z.string().transform(Number).default('10000'),
  
  // API Keys (optional)
  ETHERSCAN_API_KEY: z.string().optional(),
  POLYGONSCAN_API_KEY: z.string().optional(),
  ARBISCAN_API_KEY: z.string().optional(),
  BASESCAN_API_KEY: z.string().optional(),
});

export type Environment = z.infer<typeof EnvironmentSchema>;

export interface AppConfig {
  environment: Environment;
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
  logLevel: string;
  database: {
    path: string;
  };
  rpc: {
    ethereum: {
      http: string;
      ws: string;
    };
    arbitrum: {
      http: string;
      ws: string;
    };
    polygon: {
      http: string;
      ws: string;
    };
    base: {
      http: string;
      ws: string;
    };
  };
  alerts: {
    webhookUrl?: string;
    discordWebhook?: string;
    telegramBotToken?: string;
    telegramChatId?: string;
  };
  trading: {
    minProfitThreshold: number;
    maxGasCost: number;
    minLiquidityThreshold: number;
  };
  system: {
    priceUpdateInterval: number;
    healthCheckInterval: number;
    maxRetries: number;
    connectionTimeout: number;
  };
  apiKeys: {
    etherscan?: string;
    polygonscan?: string;
    arbiscan?: string;
    basescan?: string;
  };
} 