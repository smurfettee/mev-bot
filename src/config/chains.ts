import { ChainId, DexName, type ChainConfig, type DexConfig } from '../types/chain';
import { GAS_PRICES, BLOCK_TIMES, DEX_ADDRESSES } from '../utils/constants';

/**
 * Chain configurations for all supported networks
 */
export const CHAIN_CONFIGS: Record<ChainId, ChainConfig> = {
  [ChainId.ETHEREUM]: {
    id: ChainId.ETHEREUM,
    name: 'Ethereum',
    rpcUrls: {
      http: [
        process.env.ETHEREUM_RPC_HTTP || 'https://eth-mainnet.alchemyapi.io/v2/your-api-key',
        'https://mainnet.infura.io/v3/your-project-id',
        'https://rpc.ankr.com/eth'
      ],
      ws: [
        process.env.ETHEREUM_RPC_WS || 'wss://eth-mainnet.ws.alchemyapi.io/v2/your-api-key',
        'wss://mainnet.infura.io/ws/v3/your-project-id'
      ]
    },
    blockTime: BLOCK_TIMES[ChainId.ETHEREUM],
    gasLimit: GAS_PRICES[ChainId.ETHEREUM].gasLimit,
    maxPriorityFeePerGas: GAS_PRICES[ChainId.ETHEREUM].maxPriorityFeePerGas,
    maxFeePerGas: GAS_PRICES[ChainId.ETHEREUM].maxFeePerGas
  },
  
  [ChainId.ARBITRUM]: {
    id: ChainId.ARBITRUM,
    name: 'Arbitrum',
    rpcUrls: {
      http: [
        process.env.ARBITRUM_RPC_HTTP || 'https://arb-mainnet.g.alchemy.com/v2/your-api-key',
        'https://arb1.arbitrum.io/rpc',
        'https://rpc.ankr.com/arbitrum'
      ],
      ws: [
        process.env.ARBITRUM_RPC_WS || 'wss://arb-mainnet.g.alchemy.com/v2/your-api-key',
        'wss://arb1.arbitrum.io/ws'
      ]
    },
    blockTime: BLOCK_TIMES[ChainId.ARBITRUM],
    gasLimit: GAS_PRICES[ChainId.ARBITRUM].gasLimit,
    maxPriorityFeePerGas: GAS_PRICES[ChainId.ARBITRUM].maxPriorityFeePerGas,
    maxFeePerGas: GAS_PRICES[ChainId.ARBITRUM].maxFeePerGas
  },
  
  [ChainId.POLYGON]: {
    id: ChainId.POLYGON,
    name: 'Polygon',
    rpcUrls: {
      http: [
        process.env.POLYGON_RPC_HTTP || 'https://polygon-mainnet.g.alchemy.com/v2/your-api-key',
        'https://polygon-rpc.com',
        'https://rpc.ankr.com/polygon'
      ],
      ws: [
        process.env.POLYGON_RPC_WS || 'wss://polygon-mainnet.g.alchemy.com/v2/your-api-key',
        'wss://polygon-rpc.com/ws'
      ]
    },
    blockTime: BLOCK_TIMES[ChainId.POLYGON],
    gasLimit: GAS_PRICES[ChainId.POLYGON].gasLimit,
    maxPriorityFeePerGas: GAS_PRICES[ChainId.POLYGON].maxPriorityFeePerGas,
    maxFeePerGas: GAS_PRICES[ChainId.POLYGON].maxFeePerGas
  },
  
  [ChainId.BASE]: {
    id: ChainId.BASE,
    name: 'Base',
    rpcUrls: {
      http: [
        process.env.BASE_RPC_HTTP || 'https://mainnet.base.org',
        'https://base.blockpi.network/v1/rpc/public',
        'https://1rpc.io/base'
      ],
      ws: [
        process.env.BASE_RPC_WS || 'wss://mainnet.base.org',
        'wss://base.blockpi.network/v1/rpc/public'
      ]
    },
    blockTime: BLOCK_TIMES[ChainId.BASE],
    gasLimit: GAS_PRICES[ChainId.BASE].gasLimit,
    maxPriorityFeePerGas: GAS_PRICES[ChainId.BASE].maxPriorityFeePerGas,
    maxFeePerGas: GAS_PRICES[ChainId.BASE].maxFeePerGas
  }
};

/**
 * DEX configurations for all supported exchanges
 */
export const DEX_CONFIGS: DexConfig[] = [
  // Ethereum DEXs
  {
    name: DexName.UNISWAP_V2,
    chainId: ChainId.ETHEREUM,
    factoryAddress: DEX_ADDRESSES[ChainId.ETHEREUM][DexName.UNISWAP_V2].factory,
    routerAddress: DEX_ADDRESSES[ChainId.ETHEREUM][DexName.UNISWAP_V2].router,
    version: 'v2',
    isActive: true
  },
  {
    name: DexName.UNISWAP_V3,
    chainId: ChainId.ETHEREUM,
    factoryAddress: DEX_ADDRESSES[ChainId.ETHEREUM][DexName.UNISWAP_V3].factory,
    routerAddress: DEX_ADDRESSES[ChainId.ETHEREUM][DexName.UNISWAP_V3].router,
    version: 'v3',
    feeTier: 3000, // 0.3%
    isActive: true
  },
  {
    name: DexName.SUSHISWAP,
    chainId: ChainId.ETHEREUM,
    factoryAddress: DEX_ADDRESSES[ChainId.ETHEREUM][DexName.SUSHISWAP].factory,
    routerAddress: DEX_ADDRESSES[ChainId.ETHEREUM][DexName.SUSHISWAP].router,
    version: 'v2',
    isActive: true
  },
  
  // Arbitrum DEXs
  {
    name: DexName.UNISWAP_V3,
    chainId: ChainId.ARBITRUM,
    factoryAddress: DEX_ADDRESSES[ChainId.ARBITRUM][DexName.UNISWAP_V3].factory,
    routerAddress: DEX_ADDRESSES[ChainId.ARBITRUM][DexName.UNISWAP_V3].router,
    version: 'v3',
    feeTier: 3000, // 0.3%
    isActive: true
  },
  {
    name: DexName.SUSHISWAP,
    chainId: ChainId.ARBITRUM,
    factoryAddress: DEX_ADDRESSES[ChainId.ARBITRUM][DexName.SUSHISWAP].factory,
    routerAddress: DEX_ADDRESSES[ChainId.ARBITRUM][DexName.SUSHISWAP].router,
    version: 'v2',
    isActive: true
  },
  {
    name: DexName.CAMELOT,
    chainId: ChainId.ARBITRUM,
    factoryAddress: DEX_ADDRESSES[ChainId.ARBITRUM][DexName.CAMELOT].factory,
    routerAddress: DEX_ADDRESSES[ChainId.ARBITRUM][DexName.CAMELOT].router,
    version: 'v2',
    isActive: true
  },
  
  // Polygon DEXs
  {
    name: DexName.UNISWAP_V3,
    chainId: ChainId.POLYGON,
    factoryAddress: DEX_ADDRESSES[ChainId.POLYGON][DexName.UNISWAP_V3].factory,
    routerAddress: DEX_ADDRESSES[ChainId.POLYGON][DexName.UNISWAP_V3].router,
    version: 'v3',
    feeTier: 3000, // 0.3%
    isActive: true
  },
  {
    name: DexName.SUSHISWAP,
    chainId: ChainId.POLYGON,
    factoryAddress: DEX_ADDRESSES[ChainId.POLYGON][DexName.SUSHISWAP].factory,
    routerAddress: DEX_ADDRESSES[ChainId.POLYGON][DexName.SUSHISWAP].router,
    version: 'v2',
    isActive: true
  },
  {
    name: DexName.QUICKSWAP,
    chainId: ChainId.POLYGON,
    factoryAddress: DEX_ADDRESSES[ChainId.POLYGON][DexName.QUICKSWAP].factory,
    routerAddress: DEX_ADDRESSES[ChainId.POLYGON][DexName.QUICKSWAP].router,
    version: 'v2',
    isActive: true
  },
  
  // Base DEXs
  {
    name: DexName.UNISWAP_V3,
    chainId: ChainId.BASE,
    factoryAddress: DEX_ADDRESSES[ChainId.BASE][DexName.UNISWAP_V3].factory,
    routerAddress: DEX_ADDRESSES[ChainId.BASE][DexName.UNISWAP_V3].router,
    version: 'v3',
    feeTier: 3000, // 0.3%
    isActive: true
  },
  {
    name: DexName.AERODROME,
    chainId: ChainId.BASE,
    factoryAddress: DEX_ADDRESSES[ChainId.BASE][DexName.AERODROME].factory,
    routerAddress: DEX_ADDRESSES[ChainId.BASE][DexName.AERODROME].router,
    version: 'v2',
    isActive: true
  },
  {
    name: DexName.BASESWAP,
    chainId: ChainId.BASE,
    factoryAddress: DEX_ADDRESSES[ChainId.BASE][DexName.BASESWAP].factory,
    routerAddress: DEX_ADDRESSES[ChainId.BASE][DexName.BASESWAP].router,
    version: 'v2',
    isActive: true
  }
];

/**
 * Gets chain configuration by chain ID
 */
export const getChainConfig = (chainId: ChainId): ChainConfig => {
  const config = CHAIN_CONFIGS[chainId];
  if (!config) {
    throw new Error(`Chain configuration not found for chain ID: ${chainId}`);
  }
  return config;
};

/**
 * Gets DEX configurations for a specific chain
 */
export const getDexConfigsForChain = (chainId: ChainId): DexConfig[] => {
  return DEX_CONFIGS.filter(dex => dex.chainId === chainId && dex.isActive);
};

/**
 * Gets all active DEX configurations
 */
export const getActiveDexConfigs = (): DexConfig[] => {
  return DEX_CONFIGS.filter(dex => dex.isActive);
};

/**
 * Gets DEX configuration by name and chain
 */
export const getDexConfig = (chainId: ChainId, dexName: DexName): DexConfig => {
  const config = DEX_CONFIGS.find(
    dex => dex.chainId === chainId && dex.name === dexName && dex.isActive
  );
  if (!config) {
    throw new Error(`DEX configuration not found for ${dexName} on chain ${chainId}`);
  }
  return config;
}; 