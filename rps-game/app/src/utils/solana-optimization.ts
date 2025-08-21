/**
 * Solana blockchain optimization utilities
 * Provides caching, connection pooling, and performance optimizations for Solana operations
 */

import { Connection, PublicKey, Commitment, ConfirmOptions } from '@solana/web3.js';
import { performanceTracker } from './performance';

interface SolanaConfig {
  rpcEndpoint: string;
  commitment: Commitment;
  maxRetries: number;
  retryDelay: number;
  cacheTimeout: number;
}

interface CachedResponse<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class SolanaOptimizer {
  private connections: Map<string, Connection> = new Map();
  private cache: Map<string, CachedResponse<any>> = new Map();
  private config: SolanaConfig;
  private requestQueue: Map<string, Promise<any>> = new Map();

  constructor(config: Partial<SolanaConfig> = {}) {
    this.config = {
      rpcEndpoint: 'https://api.devnet.solana.com',
      commitment: 'confirmed',
      maxRetries: 3,
      retryDelay: 1000,
      cacheTimeout: 30000, // 30 seconds
      ...config
    };
  }

  // Connection pool management
  getConnection(endpoint?: string): Connection {
    const rpc = endpoint || this.config.rpcEndpoint;
    
    if (!this.connections.has(rpc)) {
      const connection = new Connection(rpc, {
        commitment: this.config.commitment,
        wsEndpoint: this.getWebSocketEndpoint(rpc),
        // Enable connection pooling
        confirmTransactionInitialTimeout: 60000,
        disableRetryOnRateLimit: false
      });
      
      this.connections.set(rpc, connection);
    }
    
    return this.connections.get(rpc)!;
  }

  private getWebSocketEndpoint(rpcEndpoint: string): string {
    // Convert HTTP RPC endpoints to WebSocket endpoints
    if (rpcEndpoint.includes('mainnet-beta')) {
      return rpcEndpoint.replace('https://', 'wss://').replace('http://', 'ws://');
    }
    if (rpcEndpoint.includes('devnet')) {
      return rpcEndpoint.replace('https://', 'wss://').replace('http://', 'ws://');
    }
    if (rpcEndpoint.includes('testnet')) {
      return rpcEndpoint.replace('https://', 'wss://').replace('http://', 'ws://');
    }
    return rpcEndpoint.replace('https://', 'wss://').replace('http://', 'ws://');
  }

  // Cached RPC calls with request deduplication
  async cachedRequest<T>(
    key: string,
    requestFn: () => Promise<T>,
    cacheTimeout: number = this.config.cacheTimeout
  ): Promise<T> {
    // Check cache first
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }

    // Check if request is already in progress (deduplication)
    if (this.requestQueue.has(key)) {
      return this.requestQueue.get(key)!;
    }

    // Make new request
    const startTime = Date.now();
    const requestPromise = this.withRetry(requestFn)
      .then((data) => {
        const endTime = Date.now();
        
        // Cache successful response
        this.cache.set(key, {
          data,
          timestamp: startTime,
          expiry: endTime + cacheTimeout
        });
        
        // Track performance
        performanceTracker.recordSolanaMetric({
          name: 'Solana RPC Call',
          value: endTime - startTime,
          rating: endTime - startTime < 1000 ? 'good' : endTime - startTime < 3000 ? 'needs-improvement' : 'poor',
          rpcEndpoint: this.config.rpcEndpoint,
          operation: key,
          details: {
            cached: false,
            duration: endTime - startTime
          }
        });
        
        return data;
      })
      .finally(() => {
        // Remove from queue when done
        this.requestQueue.delete(key);
      });

    this.requestQueue.set(key, requestPromise);
    return requestPromise;
  }

  // Retry mechanism with exponential backoff
  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain errors
        if (error instanceof Error && (
          error.message.includes('Invalid') ||
          error.message.includes('not found') ||
          error.message.includes('403') ||
          error.message.includes('401')
        )) {
          throw error;
        }
        
        if (attempt < this.config.maxRetries - 1) {
          const delay = this.config.retryDelay * Math.pow(2, attempt); // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError!;
  }

  // Optimized account info fetching with batching
  async getAccountInfo(publicKey: PublicKey | string, commitment?: Commitment): Promise<any> {
    const key = typeof publicKey === 'string' ? publicKey : publicKey.toBase58();
    const cacheKey = `account_info_${key}_${commitment || this.config.commitment}`;
    
    return this.cachedRequest(cacheKey, async () => {
      const connection = this.getConnection();
      const pubKey = typeof publicKey === 'string' ? new PublicKey(publicKey) : publicKey;
      return connection.getAccountInfo(pubKey, commitment || this.config.commitment);
    });
  }

  // Optimized balance fetching
  async getBalance(publicKey: PublicKey | string, commitment?: Commitment): Promise<number> {
    const key = typeof publicKey === 'string' ? publicKey : publicKey.toBase58();
    const cacheKey = `balance_${key}_${commitment || this.config.commitment}`;
    
    return this.cachedRequest(cacheKey, async () => {
      const connection = this.getConnection();
      const pubKey = typeof publicKey === 'string' ? new PublicKey(publicKey) : publicKey;
      return connection.getBalance(pubKey, commitment || this.config.commitment);
    }, 10000); // Shorter cache for balance (10 seconds)
  }

  // Optimized transaction confirmation with caching
  async confirmTransaction(signature: string, commitment?: Commitment): Promise<any> {
    const cacheKey = `confirm_tx_${signature}_${commitment || this.config.commitment}`;
    
    return this.cachedRequest(cacheKey, async () => {
      const connection = this.getConnection();
      return connection.confirmTransaction(signature, commitment || this.config.commitment);
    }, 60000); // Cache confirmed transactions for 1 minute
  }

  // Batch multiple RPC calls
  async batchRequests<T>(requests: Array<() => Promise<T>>): Promise<T[]> {
    const startTime = Date.now();
    
    try {
      // Execute requests in parallel with limited concurrency
      const maxConcurrency = 5;
      const results: T[] = [];
      
      for (let i = 0; i < requests.length; i += maxConcurrency) {
        const batch = requests.slice(i, i + maxConcurrency);
        const batchResults = await Promise.all(batch.map(request => request()));
        results.push(...batchResults);
      }
      
      const endTime = Date.now();
      performanceTracker.recordSolanaMetric({
        name: 'Solana Batch Request',
        value: endTime - startTime,
        rating: endTime - startTime < 2000 ? 'good' : endTime - startTime < 5000 ? 'needs-improvement' : 'poor',
        rpcEndpoint: this.config.rpcEndpoint,
        operation: 'batch',
        details: {
          requestCount: requests.length,
          duration: endTime - startTime
        }
      });
      
      return results;
    } catch (error) {
      performanceTracker.recordSolanaMetric({
        name: 'Solana Batch Request Error',
        value: Date.now() - startTime,
        rating: 'poor',
        rpcEndpoint: this.config.rpcEndpoint,
        operation: 'batch',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          requestCount: requests.length
        }
      });
      throw error;
    }
  }

  // Get latest blockhash with caching
  async getLatestBlockhash(commitment?: Commitment): Promise<any> {
    const cacheKey = `latest_blockhash_${commitment || this.config.commitment}`;
    
    return this.cachedRequest(cacheKey, async () => {
      const connection = this.getConnection();
      return connection.getLatestBlockhash(commitment || this.config.commitment);
    }, 5000); // Short cache for blockhash (5 seconds)
  }

  // Optimized transaction simulation
  async simulateTransaction(transaction: any, commitment?: Commitment): Promise<any> {
    const startTime = Date.now();
    
    try {
      const connection = this.getConnection();
      const result = await connection.simulateTransaction(transaction, {
        commitment: commitment || this.config.commitment,
        sigVerify: false // Skip signature verification for faster simulation
      });
      
      const endTime = Date.now();
      performanceTracker.recordSolanaMetric({
        name: 'Solana Transaction Simulation',
        value: endTime - startTime,
        rating: endTime - startTime < 500 ? 'good' : endTime - startTime < 1500 ? 'needs-improvement' : 'poor',
        rpcEndpoint: this.config.rpcEndpoint,
        operation: 'simulate',
        details: {
          success: !result.value.err,
          duration: endTime - startTime
        }
      });
      
      return result;
    } catch (error) {
      performanceTracker.recordSolanaMetric({
        name: 'Solana Transaction Simulation Error',
        value: Date.now() - startTime,
        rating: 'poor',
        rpcEndpoint: this.config.rpcEndpoint,
        operation: 'simulate',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      throw error;
    }
  }

  // Clean up cache and connections
  cleanup() {
    this.cache.clear();
    this.requestQueue.clear();
    this.connections.clear();
  }

  // Clear expired cache entries
  clearExpiredCache() {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now >= cached.expiry) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getCacheStats() {
    const now = Date.now();
    const total = this.cache.size;
    const expired = Array.from(this.cache.values()).filter(cached => now >= cached.expiry).length;
    const active = total - expired;
    
    return {
      total,
      active,
      expired,
      hitRate: total > 0 ? (active / total) * 100 : 0
    };
  }
}

// Create and export singleton instance
export const solanaOptimizer = new SolanaOptimizer({
  rpcEndpoint: process.env.VITE_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com',
  commitment: 'confirmed',
  maxRetries: 3,
  retryDelay: 1000,
  cacheTimeout: 30000
});

// React hook for Solana operations
export function useSolanaOptimizer() {
  return {
    getConnection: solanaOptimizer.getConnection.bind(solanaOptimizer),
    getAccountInfo: solanaOptimizer.getAccountInfo.bind(solanaOptimizer),
    getBalance: solanaOptimizer.getBalance.bind(solanaOptimizer),
    confirmTransaction: solanaOptimizer.confirmTransaction.bind(solanaOptimizer),
    getLatestBlockhash: solanaOptimizer.getLatestBlockhash.bind(solanaOptimizer),
    simulateTransaction: solanaOptimizer.simulateTransaction.bind(solanaOptimizer),
    batchRequests: solanaOptimizer.batchRequests.bind(solanaOptimizer),
    getCacheStats: solanaOptimizer.getCacheStats.bind(solanaOptimizer)
  };
}

export default SolanaOptimizer;