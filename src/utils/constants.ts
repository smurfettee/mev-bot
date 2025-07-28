import { ChainId, DexName } from '../types/chain';

// Chain IDs
export const CHAIN_IDS = {
  ETHEREUM: 1,
  ARBITRUM: 42161,
  POLYGON: 137,
  BASE: 8453
} as const;

// Token addresses
export const TOKEN_ADDRESSES = {
  // Ethereum
  ETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
  USDC: '0xA0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8',
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
  
  // Arbitrum
  ARB_WETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
  ARB_USDC: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
  ARB_USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
  ARB_WBTC: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
  
  // Polygon
  POL_WETH: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
  POL_USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
  POL_USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
  POL_WBTC: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',
  
  // Base
  BASE_WETH: '0x4200000000000000000000000000000000000006',
  BASE_USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  BASE_USDbC: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
  BASE_WBTC: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22'
} as const;

// DEX Factory and Router addresses
export const DEX_ADDRESSES = {
  // Ethereum
  [ChainId.ETHEREUM]: {
    [DexName.UNISWAP_V2]: {
      factory: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
      router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'
    },
    [DexName.UNISWAP_V3]: {
      factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      router: '0xE592427A0AEce92De3Edee1F18E0157C05861564'
    },
    [DexName.SUSHISWAP]: {
      factory: '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac',
      router: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F'
    }
  },
  
  // Arbitrum
  [ChainId.ARBITRUM]: {
    [DexName.UNISWAP_V3]: {
      factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      router: '0xE592427A0AEce92De3Edee1F18E0157C05861564'
    },
    [DexName.SUSHISWAP]: {
      factory: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
      router: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506'
    },
    [DexName.CAMELOT]: {
      factory: '0x6EcCab422D763aC031210895C81787E87B43A652',
      router: '0xc873fEcbd354f5A56E00E71B0D8b3bdcDC261F1F'
    }
  },
  
  // Polygon
  [ChainId.POLYGON]: {
    [DexName.UNISWAP_V3]: {
      factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      router: '0xE592427A0AEce92De3Edee1F18E0157C05861564'
    },
    [DexName.SUSHISWAP]: {
      factory: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
      router: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506'
    },
    [DexName.QUICKSWAP]: {
      factory: '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32',
      router: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff'
    }
  },
  
  // Base
  [ChainId.BASE]: {
    [DexName.UNISWAP_V3]: {
      factory: '0x33128a8fc17869897dE68FC026a6bCbBfbC6C3c0',
      router: '0x2626664c2603336E57B271c5C0b26F421741e481'
    },
    [DexName.AERODROME]: {
      factory: '0x420DD381b31aEf6683db6B902084cB0FFECe40Da',
      router: '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43'
    },
    [DexName.BASESWAP]: {
      factory: '0xFDa619b6d20975be80A10332cD39b9a4b0FAa8BB',
      router: '0x327Df1E6de05895d2ab08513aaDD9313Fe505d86'
    }
  }
} as const;

// Token pairs to monitor
export const TOKEN_PAIRS = [
  {
    baseToken: 'ETH',
    quoteToken: 'USDC',
    baseTokenAddress: TOKEN_ADDRESSES.ETH,
    quoteTokenAddress: TOKEN_ADDRESSES.USDC,
    baseTokenDecimals: 18,
    quoteTokenDecimals: 6,
    pairAddress: '' // Will be calculated dynamically
  },
  {
    baseToken: 'ETH',
    quoteToken: 'USDT',
    baseTokenAddress: TOKEN_ADDRESSES.ETH,
    quoteTokenAddress: TOKEN_ADDRESSES.USDT,
    baseTokenDecimals: 18,
    quoteTokenDecimals: 6,
    pairAddress: ''
  },
  {
    baseToken: 'WBTC',
    quoteToken: 'USDC',
    baseTokenAddress: TOKEN_ADDRESSES.WBTC,
    quoteTokenAddress: TOKEN_ADDRESSES.USDC,
    baseTokenDecimals: 8,
    quoteTokenDecimals: 6,
    pairAddress: ''
  },
  {
    baseToken: 'WBTC',
    quoteToken: 'ETH',
    baseTokenAddress: TOKEN_ADDRESSES.WBTC,
    quoteTokenAddress: TOKEN_ADDRESSES.ETH,
    baseTokenDecimals: 8,
    quoteTokenDecimals: 18,
    pairAddress: ''
  }
] as const;

// Gas price constants (in gwei)
export const GAS_PRICES = {
  [ChainId.ETHEREUM]: {
    maxPriorityFeePerGas: 2n * 10n ** 9n, // 2 gwei
    maxFeePerGas: 50n * 10n ** 9n, // 50 gwei
    gasLimit: 300000
  },
  [ChainId.ARBITRUM]: {
    maxPriorityFeePerGas: 1n * 10n ** 8n, // 0.1 gwei
    maxFeePerGas: 5n * 10n ** 8n, // 0.5 gwei
    gasLimit: 1000000
  },
  [ChainId.POLYGON]: {
    maxPriorityFeePerGas: 30n * 10n ** 9n, // 30 gwei
    maxFeePerGas: 100n * 10n ** 9n, // 100 gwei
    gasLimit: 500000
  },
  [ChainId.BASE]: {
    maxPriorityFeePerGas: 1n * 10n ** 7n, // 0.01 gwei
    maxFeePerGas: 1n * 10n ** 8n, // 0.1 gwei
    gasLimit: 500000
  }
} as const;

// Block time constants (in seconds)
export const BLOCK_TIMES = {
  [ChainId.ETHEREUM]: 12,
  [ChainId.ARBITRUM]: 1,
  [ChainId.POLYGON]: 2,
  [ChainId.BASE]: 2
} as const;

// Uniswap V3 fee tiers
export const UNISWAP_V3_FEE_TIERS = {
  LOW: 500, // 0.05%
  MEDIUM: 3000, // 0.3%
  HIGH: 10000 // 1%
} as const;

// System constants
export const SYSTEM_CONSTANTS = {
  MAX_RETRIES: 3,
  CONNECTION_TIMEOUT: 10000,
  PRICE_UPDATE_INTERVAL: 1000,
  HEALTH_CHECK_INTERVAL: 30000,
  MIN_PROFIT_THRESHOLD: 2.0, // 2%
  MAX_GAS_COST: 100, // $100
  MIN_LIQUIDITY_THRESHOLD: 10000, // $10,000
  PRICE_DECAY_TIME: 300000, // 5 minutes
  MAX_PRICE_AGE: 60000, // 1 minute
  CORRELATION_ID_LENGTH: 36,
  MAX_CONCURRENT_REQUESTS: 10,
  RATE_LIMIT_DELAY: 100 // 100ms between requests
} as const;

// Error messages
export const ERROR_MESSAGES = {
  RPC_CONNECTION_FAILED: 'RPC connection failed',
  PRICE_FETCH_FAILED: 'Failed to fetch price data',
  DATABASE_CONNECTION_FAILED: 'Database connection failed',
  INVALID_TOKEN_PAIR: 'Invalid token pair',
  INSUFFICIENT_LIQUIDITY: 'Insufficient liquidity',
  PRICE_TOO_OLD: 'Price data is too old',
  GAS_COST_TOO_HIGH: 'Gas cost exceeds maximum threshold',
  PROFIT_TOO_LOW: 'Profit margin below minimum threshold'
} as const;

// Log levels
export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
} as const;

// Database table names
export const TABLE_NAMES = {
  PRICES: 'prices',
  OPPORTUNITIES: 'opportunities',
  SYSTEM_HEALTH: 'system_health',
  PRICE_ALERTS: 'price_alerts'
} as const; 