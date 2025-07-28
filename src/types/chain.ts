export enum ChainId {
  ETHEREUM = 1,
  ARBITRUM = 42161,
  POLYGON = 137,
  BASE = 8453
}

export enum DexName {
  UNISWAP_V2 = 'uniswap_v2',
  UNISWAP_V3 = 'uniswap_v3',
  SUSHISWAP = 'sushiswap',
  CAMELOT = 'camelot',
  QUICKSWAP = 'quickswap',
  AERODROME = 'aerodrome',
  BASESWAP = 'baseswap'
}

export interface ChainConfig {
  id: ChainId;
  name: string;
  rpcUrls: {
    http: string[];
    ws: string[];
  };
  blockTime: number;
  gasLimit: number;
  maxPriorityFeePerGas: bigint;
  maxFeePerGas: bigint;
}

export interface DexConfig {
  name: DexName;
  chainId: ChainId;
  factoryAddress: string;
  routerAddress: string;
  version: string;
  feeTier?: number;
  isActive: boolean;
}

export interface RpcConnection {
  url: string;
  isActive: boolean;
  lastUsed: Date;
  latency: number;
  errorCount: number;
  maxRetries: number;
}

export interface ChainConnection {
  chainId: ChainId;
  provider: any; // ethers.js provider
  wsProvider?: any; // WebSocket provider
  connections: RpcConnection[];
  currentConnectionIndex: number;
  isHealthy: boolean;
  lastBlockNumber: number;
  lastBlockTime: Date;
} 