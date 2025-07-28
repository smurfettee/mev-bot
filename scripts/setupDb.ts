import { promises as fs } from 'fs';
import { join } from 'path';
import { logger } from '../src/utils/logger';
import { getConfig } from '../src/config/env';

interface DatabaseData {
  prices: any[];
  opportunities: any[];
  systemHealth: any[];
  priceAlerts: any[];
  performanceMetrics: any[];
  tokenPairs: any[];
  dexConfigs: any[];
}

async function setupDatabase(): Promise<void> {
  const config = getConfig();
  
  // Ensure data directory exists
  const dataPath = config.database.path.replace('.db', '.json');
  const dataDir = join(dataPath, '..');
  await fs.mkdir(dataDir, { recursive: true });
  
  try {
    logger.info('Starting database setup...');

    // Create initial database structure
    const initialData: DatabaseData = {
      prices: [],
      opportunities: [],
      systemHealth: [],
      priceAlerts: [],
      performanceMetrics: [],
      tokenPairs: [],
      dexConfigs: []
    };

    // Insert initial token pairs
    await insertInitialTokenPairs(initialData);
    
    // Insert initial DEX configurations
    await insertInitialDexConfigs(initialData);

    // Save to file
    await fs.writeFile(dataPath, JSON.stringify(initialData, null, 2));

    logger.info('Database setup completed successfully', { path: dataPath });
  } catch (error) {
    logger.error('Database setup failed', { error });
    throw error;
  }
}

async function insertInitialTokenPairs(data: DatabaseData): Promise<void> {
  const tokenPairs = [
    {
      id: require('uuid').v4(),
      base_token: 'ETH',
      quote_token: 'USDC',
      base_token_address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      quote_token_address: '0xA0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8',
      base_token_decimals: 18,
      quote_token_decimals: 6,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: require('uuid').v4(),
      base_token: 'ETH',
      quote_token: 'USDT',
      base_token_address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      quote_token_address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      base_token_decimals: 18,
      quote_token_decimals: 6,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: require('uuid').v4(),
      base_token: 'WBTC',
      quote_token: 'USDC',
      base_token_address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      quote_token_address: '0xA0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8',
      base_token_decimals: 8,
      quote_token_decimals: 6,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: require('uuid').v4(),
      base_token: 'WBTC',
      quote_token: 'ETH',
      base_token_address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      quote_token_address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      base_token_decimals: 8,
      quote_token_decimals: 18,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  data.tokenPairs = tokenPairs;
  logger.info('Initial token pairs inserted');
}

async function insertInitialDexConfigs(data: DatabaseData): Promise<void> {
  const dexConfigs = [
    // Ethereum DEXs
    {
      id: require('uuid').v4(),
      name: 'uniswap_v2',
      chain_id: 1,
      factory_address: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
      router_address: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      version: 'v2',
      fee_tier: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: require('uuid').v4(),
      name: 'uniswap_v3',
      chain_id: 1,
      factory_address: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      router_address: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      version: 'v3',
      fee_tier: 3000,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: require('uuid').v4(),
      name: 'sushiswap',
      chain_id: 1,
      factory_address: '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac',
      router_address: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
      version: 'v2',
      fee_tier: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    
    // Arbitrum DEXs
    {
      id: require('uuid').v4(),
      name: 'uniswap_v3',
      chain_id: 42161,
      factory_address: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      router_address: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      version: 'v3',
      fee_tier: 3000,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: require('uuid').v4(),
      name: 'sushiswap',
      chain_id: 42161,
      factory_address: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
      router_address: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
      version: 'v2',
      fee_tier: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: require('uuid').v4(),
      name: 'camelot',
      chain_id: 42161,
      factory_address: '0x6EcCab422D763aC031210895C81787E87B43A652',
      router_address: '0xc873fEcbd354f5A56E00E71B0D8b3bdcDC261F1F',
      version: 'v2',
      fee_tier: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    
    // Polygon DEXs
    {
      id: require('uuid').v4(),
      name: 'uniswap_v3',
      chain_id: 137,
      factory_address: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      router_address: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      version: 'v3',
      fee_tier: 3000,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: require('uuid').v4(),
      name: 'sushiswap',
      chain_id: 137,
      factory_address: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
      router_address: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
      version: 'v2',
      fee_tier: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: require('uuid').v4(),
      name: 'quickswap',
      chain_id: 137,
      factory_address: '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32',
      router_address: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
      version: 'v2',
      fee_tier: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    
    // Base DEXs
    {
      id: require('uuid').v4(),
      name: 'uniswap_v3',
      chain_id: 8453,
      factory_address: '0x33128a8fc17869897dE68FC026a6bCbBfbC6C3c0',
      router_address: '0x2626664c2603336E57B271c5C0b26F421741e481',
      version: 'v3',
      fee_tier: 3000,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: require('uuid').v4(),
      name: 'aerodrome',
      chain_id: 8453,
      factory_address: '0x420DD381b31aEf6683db6B902084cB0FFECe40Da',
      router_address: '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43',
      version: 'v2',
      fee_tier: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: require('uuid').v4(),
      name: 'baseswap',
      chain_id: 8453,
      factory_address: '0xFDa619b6d20975be80A10332cD39b9a4b0FAa8BB',
      router_address: '0x327Df1E6de05895d2ab08513aaDD9313Fe505d86',
      version: 'v2',
      fee_tier: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  data.dexConfigs = dexConfigs;
  logger.info('Initial DEX configurations inserted');
}

// Run setup if called directly
if (require.main === module) {
  setupDatabase()
    .then(() => {
      logger.info('Database setup completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Database setup failed', { error });
      process.exit(1);
    });
}

export { setupDatabase }; 