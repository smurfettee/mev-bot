import dotenv from 'dotenv';
import { EnvironmentSchema, type Environment, type AppConfig } from '../types/config';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

/**
 * Validates and loads environment variables
 */
export const loadEnvironment = (): Environment => {
  try {
    const env = EnvironmentSchema.parse(process.env);
    logger.info('Environment variables loaded successfully');
    return env;
  } catch (error) {
    logger.error('Failed to load environment variables', { error });
    throw new Error('Invalid environment configuration');
  }
};

/**
 * Creates application configuration from environment variables
 */
export const createAppConfig = (): AppConfig => {
  const env = loadEnvironment();
  
  return {
    environment: env,
    isDevelopment: env.NODE_ENV === 'development',
    isProduction: env.NODE_ENV === 'production',
    isTest: env.NODE_ENV === 'test',
    logLevel: env.LOG_LEVEL,
    database: {
      path: env.DATABASE_PATH
    },
    rpc: {
      ethereum: {
        http: env.ETHEREUM_RPC_HTTP,
        ws: env.ETHEREUM_RPC_WS
      },
      arbitrum: {
        http: env.ARBITRUM_RPC_HTTP,
        ws: env.ARBITRUM_RPC_WS
      },
      polygon: {
        http: env.POLYGON_RPC_HTTP,
        ws: env.POLYGON_RPC_WS
      },
      base: {
        http: env.BASE_RPC_HTTP,
        ws: env.BASE_RPC_WS
      }
    },
    alerts: {
      webhookUrl: env.ALERT_WEBHOOK_URL,
      discordWebhook: env.ALERT_DISCORD_WEBHOOK,
      telegramBotToken: env.ALERT_TELEGRAM_BOT_TOKEN,
      telegramChatId: env.ALERT_TELEGRAM_CHAT_ID
    },
    trading: {
      minProfitThreshold: env.MIN_PROFIT_THRESHOLD,
      maxGasCost: env.MAX_GAS_COST,
      minLiquidityThreshold: env.MIN_LIQUIDITY_THRESHOLD
    },
    system: {
      priceUpdateInterval: env.PRICE_UPDATE_INTERVAL,
      healthCheckInterval: env.HEALTH_CHECK_INTERVAL,
      maxRetries: env.MAX_RETRIES,
      connectionTimeout: env.CONNECTION_TIMEOUT
    },
    apiKeys: {
      etherscan: env.ETHERSCAN_API_KEY,
      polygonscan: env.POLYGONSCAN_API_KEY,
      arbiscan: env.ARBISCAN_API_KEY,
      basescan: env.BASESCAN_API_KEY
    }
  };
};

/**
 * Validates that all required environment variables are present
 */
export const validateEnvironment = (): void => {
  const requiredVars = [
    'ETHEREUM_RPC_HTTP',
    'ETHEREUM_RPC_WS',
    'ARBITRUM_RPC_HTTP',
    'ARBITRUM_RPC_WS',
    'POLYGON_RPC_HTTP',
    'POLYGON_RPC_WS',
    'BASE_RPC_HTTP',
    'BASE_RPC_WS'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    const error = `Missing required environment variables: ${missingVars.join(', ')}`;
    logger.error(error);
    throw new Error(error);
  }
};

/**
 * Gets the current environment configuration
 */
export const getConfig = (): AppConfig => {
  validateEnvironment();
  return createAppConfig();
}; 