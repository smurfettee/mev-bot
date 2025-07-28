import { ethers } from 'ethers';
import WebSocket from 'ws';
import pRetry from 'p-retry';
import { logger, createChildLogger, logPerformance } from '../utils/logger';
import { ChainId, type ChainConnection, type RpcConnection } from '../types/chain';
import { getChainConfig } from '../config/chains';
import { getConfig } from '../config/env';
import { SYSTEM_CONSTANTS } from '../utils/constants';

export class ChainManager {
  private connections: Map<ChainId, ChainConnection> = new Map();
  private logger = logger;
  private config = getConfig();

  constructor() {
    this.initializeConnections();
  }

  /**
   * Initializes connections for all supported chains
   */
  private initializeConnections(): void {
    const chains = [ChainId.ETHEREUM, ChainId.ARBITRUM, ChainId.POLYGON, ChainId.BASE];
    
    for (const chainId of chains) {
      try {
        const chainConfig = getChainConfig(chainId);
        const connections = this.createRpcConnections(chainConfig);
        
        const chainConnection: ChainConnection = {
          chainId,
          provider: null,
          wsProvider: null,
          connections,
          currentConnectionIndex: 0,
          isHealthy: false,
          lastBlockNumber: 0,
          lastBlockTime: new Date()
        };

        this.connections.set(chainId, chainConnection);
        this.logger.info(`Initialized chain manager for ${chainConfig.name}`, { chainId });
      } catch (error) {
        this.logger.error(`Failed to initialize chain manager for chain ${chainId}`, { error });
      }
    }
  }

  /**
   * Creates RPC connections for a chain
   */
  private createRpcConnections(chainConfig: any): RpcConnection[] {
    const connections: RpcConnection[] = [];
    
    // HTTP connections
    for (const url of chainConfig.rpcUrls.http) {
      connections.push({
        url,
        isActive: true,
        lastUsed: new Date(),
        latency: 0,
        errorCount: 0,
        maxRetries: SYSTEM_CONSTANTS.MAX_RETRIES
      });
    }

    // WebSocket connections
    for (const url of chainConfig.rpcUrls.ws) {
      connections.push({
        url,
        isActive: true,
        lastUsed: new Date(),
        latency: 0,
        errorCount: 0,
        maxRetries: SYSTEM_CONSTANTS.MAX_RETRIES
      });
    }

    return connections;
  }

  /**
   * Gets a provider for a specific chain with automatic failover
   */
  async getProvider(chainId: ChainId, correlationId?: string): Promise<ethers.Provider> {
    const childLogger = correlationId ? createChildLogger(correlationId) : this.logger;
    const connection = this.connections.get(chainId);
    
    if (!connection) {
      throw new Error(`No connection found for chain ${chainId}`);
    }

    // Try to get existing provider
    if (connection.provider && connection.isHealthy) {
      return connection.provider;
    }

    // Try to establish new connection with failover
    return await this.establishConnection(chainId, connection, childLogger);
  }

  /**
   * Establishes a connection with automatic failover
   */
  private async establishConnection(
    chainId: ChainId, 
    connection: ChainConnection, 
    logger: any
  ): Promise<ethers.Provider> {
    const chainConfig = getChainConfig(chainId);
    const startTime = Date.now();

    for (let i = 0; i < connection.connections.length; i++) {
      const rpcConnection = connection.connections[i];
      
      if (!rpcConnection.isActive || rpcConnection.errorCount >= rpcConnection.maxRetries) {
        continue;
      }

      try {
        logger.debug(`Attempting to connect to ${rpcConnection.url}`, { chainId });
        
        const provider = await pRetry(
          async () => {
            const start = Date.now();
            const provider = new ethers.JsonRpcProvider(rpcConnection.url);
            
            // Test the connection
            await provider.getBlockNumber();
            
            const latency = Date.now() - start;
            rpcConnection.latency = latency;
            rpcConnection.lastUsed = new Date();
            rpcConnection.errorCount = 0;
            
            logger.debug(`Successfully connected to ${rpcConnection.url}`, { 
              chainId, 
              latency 
            });
            
            return provider;
          },
          {
            retries: 2,
            onFailedAttempt: (error) => {
              logger.warn(`Connection attempt failed for ${rpcConnection.url}`, { 
                chainId, 
                error: error.message 
              });
              rpcConnection.errorCount++;
            }
          }
        );

        // Update connection state
        connection.provider = provider;
        connection.currentConnectionIndex = i;
        connection.isHealthy = true;
        connection.lastBlockTime = new Date();

        const duration = Date.now() - startTime;
        logPerformance(`chain_connection_${chainId}`, duration, { chainId, rpcUrl: rpcConnection.url });

        return provider;
      } catch (error) {
        logger.error(`Failed to connect to ${rpcConnection.url}`, { 
          chainId, 
          error: error.message 
        });
        rpcConnection.errorCount++;
        rpcConnection.isActive = false;
      }
    }

    // All connections failed
    connection.isHealthy = false;
    throw new Error(`All RPC connections failed for chain ${chainId}`);
  }

  /**
   * Gets WebSocket provider for real-time updates
   */
  async getWebSocketProvider(chainId: ChainId, correlationId?: string): Promise<ethers.WebSocketProvider> {
    const childLogger = correlationId ? createChildLogger(correlationId) : this.logger;
    const connection = this.connections.get(chainId);
    
    if (!connection) {
      throw new Error(`No connection found for chain ${chainId}`);
    }

    // Try to get existing WebSocket provider
    if (connection.wsProvider && connection.isHealthy) {
      return connection.wsProvider;
    }

    // Find WebSocket connection
    const wsConnections = connection.connections.filter(conn => 
      conn.url.startsWith('wss://') && conn.isActive
    );

    if (wsConnections.length === 0) {
      throw new Error(`No active WebSocket connections for chain ${chainId}`);
    }

    // Try to establish WebSocket connection
    for (const wsConnection of wsConnections) {
      try {
        childLogger.debug(`Attempting WebSocket connection to ${wsConnection.url}`, { chainId });
        
        const wsProvider = new ethers.WebSocketProvider(wsConnection.url);
        
        // Test the connection
        await wsProvider.getBlockNumber();
        
        wsConnection.latency = 0;
        wsConnection.lastUsed = new Date();
        wsConnection.errorCount = 0;
        
        connection.wsProvider = wsProvider;
        connection.isHealthy = true;
        
        childLogger.info(`WebSocket connection established for chain ${chainId}`, { 
          url: wsConnection.url 
        });
        
        return wsProvider;
      } catch (error) {
        childLogger.error(`WebSocket connection failed for ${wsConnection.url}`, { 
          chainId, 
          error: error.message 
        });
        wsConnection.errorCount++;
        wsConnection.isActive = false;
      }
    }

    throw new Error(`All WebSocket connections failed for chain ${chainId}`);
  }

  /**
   * Updates block information for a chain
   */
  async updateBlockInfo(chainId: ChainId, correlationId?: string): Promise<void> {
    const childLogger = correlationId ? createChildLogger(correlationId) : this.logger;
    const connection = this.connections.get(chainId);
    
    if (!connection) {
      return;
    }

    try {
      const provider = await this.getProvider(chainId, correlationId);
      const blockNumber = await provider.getBlockNumber();
      const block = await provider.getBlock(blockNumber);
      
      connection.lastBlockNumber = Number(blockNumber);
      connection.lastBlockTime = new Date(Number(block?.timestamp) * 1000);
      
      childLogger.debug(`Updated block info for chain ${chainId}`, { 
        blockNumber, 
        blockTime: connection.lastBlockTime 
      });
    } catch (error) {
      childLogger.error(`Failed to update block info for chain ${chainId}`, { error });
      connection.isHealthy = false;
    }
  }

  /**
   * Gets the current block number for a chain
   */
  async getBlockNumber(chainId: ChainId, correlationId?: string): Promise<number> {
    const provider = await this.getProvider(chainId, correlationId);
    const blockNumber = await provider.getBlockNumber();
    return Number(blockNumber);
  }

  /**
   * Gets gas price for a chain
   */
  async getGasPrice(chainId: ChainId, correlationId?: string): Promise<bigint> {
    const provider = await this.getProvider(chainId, correlationId);
    const gasPrice = await provider.getFeeData();
    return gasPrice.gasPrice || 0n;
  }

  /**
   * Checks if a chain is healthy
   */
  isChainHealthy(chainId: ChainId): boolean {
    const connection = this.connections.get(chainId);
    return connection?.isHealthy || false;
  }

  /**
   * Gets connection status for all chains
   */
  getConnectionStatus(): Record<ChainId, boolean> {
    const status: Record<ChainId, boolean> = {};
    
    for (const [chainId, connection] of this.connections) {
      status[chainId] = connection.isHealthy;
    }
    
    return status;
  }

  /**
   * Gets detailed connection information
   */
  getConnectionDetails(): Record<ChainId, any> {
    const details: Record<ChainId, any> = {};
    
    for (const [chainId, connection] of this.connections) {
      details[chainId] = {
        isHealthy: connection.isHealthy,
        lastBlockNumber: connection.lastBlockNumber,
        lastBlockTime: connection.lastBlockTime,
        currentConnectionIndex: connection.currentConnectionIndex,
        connections: connection.connections.map(conn => ({
          url: conn.url,
          isActive: conn.isActive,
          latency: conn.latency,
          errorCount: conn.errorCount,
          lastUsed: conn.lastUsed
        }))
      };
    }
    
    return details;
  }

  /**
   * Performs health check for all chains
   */
  async performHealthCheck(correlationId?: string): Promise<void> {
    const childLogger = correlationId ? createChildLogger(correlationId) : this.logger;
    
    for (const [chainId, connection] of this.connections) {
      try {
        await this.updateBlockInfo(chainId, correlationId);
        childLogger.debug(`Health check passed for chain ${chainId}`);
      } catch (error) {
        childLogger.error(`Health check failed for chain ${chainId}`, { error });
        connection.isHealthy = false;
      }
    }
  }

  /**
   * Closes all connections
   */
  async close(): Promise<void> {
    for (const [chainId, connection] of this.connections) {
      try {
        if (connection.provider) {
          await connection.provider.destroy();
        }
        if (connection.wsProvider) {
          await connection.wsProvider.destroy();
        }
        this.logger.info(`Closed connections for chain ${chainId}`);
      } catch (error) {
        this.logger.error(`Error closing connections for chain ${chainId}`, { error });
      }
    }
  }
}

// Export singleton instance
export const chainManager = new ChainManager(); 