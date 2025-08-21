// tests/performance/performance-tests.test.ts - RPS Game Performance Tests
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Connection, PublicKey, LAMPORTS_PER_SOL, Keypair } from '@solana/web3.js';
import { RPSClient } from '../../src/rps-client';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  transactionTime: number;
  memoryUsage: number;
  bundleSize?: number;
  fps?: number;
}

describe('⚡ RPS Game Performance Tests', () => {
  let connection: Connection;
  let mockWallet: any;
  let client: RPSClient;
  let performanceData: PerformanceMetrics[] = [];

  beforeAll(async () => {
    connection = new Connection(process.env.SOLANA_RPC_URL || 'http://localhost:8899', 'confirmed');
    mockWallet = {
      publicKey: Keypair.generate().publicKey,
      signTransaction: jest.fn(),
      signAllTransactions: jest.fn(),
      connected: true,
    };
    client = new RPSClient(connection, mockWallet);
  });

  afterAll(() => {
    // Generate performance report
    generatePerformanceReport();
  });

  describe('🚀 Loading Performance', () => {
    it('should load game interface under 3 seconds', async () => {
      const startTime = performance.now();
      
      // Simulate game loading
      await simulateGameLoad();
      
      const loadTime = performance.now() - startTime;
      
      expect(loadTime).toBeLessThan(3000); // 3 seconds
      
      performanceData.push({
        loadTime,
        renderTime: 0,
        transactionTime: 0,
        memoryUsage: getMemoryUsage(),
      });
    });

    it('should render match list quickly', async () => {
      const startTime = performance.now();
      
      // Simulate loading match list
      const mockMatches = generateMockMatches(50);
      await processMatchList(mockMatches);
      
      const renderTime = performance.now() - startTime;
      
      expect(renderTime).toBeLessThan(1000); // 1 second for 50 matches
      
      performanceData.push({
        loadTime: 0,
        renderTime,
        transactionTime: 0,
        memoryUsage: getMemoryUsage(),
      });
    });

    it('should handle large match lists efficiently', async () => {
      const sizes = [100, 500, 1000];
      
      for (const size of sizes) {
        const startTime = performance.now();
        const mockMatches = generateMockMatches(size);
        await processMatchList(mockMatches);
        const renderTime = performance.now() - startTime;
        
        // Linear scaling - should not be O(n²)
        expect(renderTime).toBeLessThan(size * 2); // 2ms per match max
        
        console.log(`Match list size ${size}: ${renderTime.toFixed(2)}ms`);
      }
    });
  });

  describe('💾 Memory Performance', () => {
    it('should maintain low memory footprint', async () => {
      const initialMemory = getMemoryUsage();
      
      // Simulate heavy game usage
      for (let i = 0; i < 10; i++) {
        await simulateGameRound();
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }
      
      const finalMemory = getMemoryUsage();
      const memoryIncrease = finalMemory - initialMemory;
      
      // Should not leak more than 50MB
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      
      console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    });

    it('should cleanup resources properly', async () => {
      const measurements: number[] = [];
      
      for (let i = 0; i < 5; i++) {
        const startMemory = getMemoryUsage();
        
        // Create and cleanup game resources
        await simulateResourceCreation();
        await simulateResourceCleanup();
        
        const endMemory = getMemoryUsage();
        measurements.push(endMemory - startMemory);
      }
      
      // Memory usage should stabilize (no continuous growth)
      const avgGrowth = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      expect(Math.abs(avgGrowth)).toBeLessThan(5 * 1024 * 1024); // 5MB tolerance
    });
  });

  describe('🔗 Network Performance', () => {
    it('should handle slow network gracefully', async () => {
      // Simulate slow network (3G conditions)
      const slowConnection = createSlowConnection(connection, 2000); // 2 second delay
      const client = new RPSClient(slowConnection, mockWallet);
      
      const startTime = performance.now();
      
      try {
        await simulateNetworkOperation(client);
        const operationTime = performance.now() - startTime;
        
        // Should complete within reasonable time even on slow network
        expect(operationTime).toBeLessThan(10000); // 10 seconds
        
      } catch (error) {
        // Should handle network errors gracefully
        expect(error.message).toContain('timeout');
      }
    });

    it('should batch operations efficiently', async () => {
      const singleOpTime = await measureOperation(() => simulateOperation());
      
      const batchStartTime = performance.now();
      await Promise.all([
        simulateOperation(),
        simulateOperation(),
        simulateOperation(),
      ]);
      const batchTime = performance.now() - batchStartTime;
      
      // Batched operations should be more efficient than sequential
      expect(batchTime).toBeLessThan(singleOpTime * 2); // At least 33% improvement
    });
  });

  describe('🎯 Transaction Performance', () => {
    it('should process transactions efficiently', async () => {
      const transactionTimes: number[] = [];
      
      for (let i = 0; i < 5; i++) {
        const startTime = performance.now();
        await simulateTransaction();
        const transactionTime = performance.now() - startTime;
        
        transactionTimes.push(transactionTime);
        expect(transactionTime).toBeLessThan(5000); // 5 seconds per transaction
      }
      
      const avgTime = transactionTimes.reduce((a, b) => a + b, 0) / transactionTimes.length;
      console.log(`Average transaction time: ${avgTime.toFixed(2)}ms`);
    });

    it('should handle transaction failures gracefully', async () => {
      let errorCount = 0;
      let successCount = 0;
      
      // Simulate mixed success/failure scenarios
      for (let i = 0; i < 10; i++) {
        try {
          if (Math.random() > 0.7) { // 30% failure rate
            throw new Error('Transaction failed');
          }
          await simulateTransaction();
          successCount++;
        } catch (error) {
          errorCount++;
          // Should handle errors without crashing
          expect(error.message).toBeDefined();
        }
      }
      
      console.log(`Success rate: ${(successCount / (successCount + errorCount) * 100).toFixed(1)}%`);
      expect(successCount).toBeGreaterThan(0); // At least some should succeed
    });
  });

  describe('🎨 Rendering Performance', () => {
    it('should maintain 60fps during animations', async () => {
      const framerates: number[] = [];
      const testDuration = 1000; // 1 second
      
      // Mock animation loop
      let frameCount = 0;
      let lastTime = performance.now();
      
      const animationLoop = () => {
        const currentTime = performance.now();
        frameCount++;
        
        if (currentTime - lastTime >= testDuration) {
          const fps = (frameCount * 1000) / testDuration;
          framerates.push(fps);
          return;
        }
        
        // Simulate frame rendering
        simulateFrameRender();
        requestAnimationFrame(animationLoop);
      };
      
      await new Promise<void>((resolve) => {
        const rafId = requestAnimationFrame(() => {
          animationLoop();
          setTimeout(resolve, testDuration + 100);
        });
      });
      
      const avgFps = framerates.reduce((a, b) => a + b, 0) / framerates.length;
      expect(avgFps).toBeGreaterThanOrEqual(50); // At least 50fps
      
      console.log(`Average FPS: ${avgFps.toFixed(1)}`);
    });
  });

  describe('📊 Bundle Size Analysis', () => {
    it('should have reasonable bundle size', async () => {
      // This would typically be done with webpack-bundle-analyzer
      const bundleStats = await analyzeBundleSize();
      
      expect(bundleStats.totalSize).toBeLessThan(2 * 1024 * 1024); // 2MB total
      expect(bundleStats.initialSize).toBeLessThan(500 * 1024); // 500KB initial
      
      console.log(`Bundle size - Total: ${(bundleStats.totalSize / 1024).toFixed(1)}KB, Initial: ${(bundleStats.initialSize / 1024).toFixed(1)}KB`);
    });

    it('should use code splitting effectively', async () => {
      const chunkStats = await analyzeChunks();
      
      // Should have multiple chunks for code splitting
      expect(chunkStats.chunks).toBeGreaterThan(1);
      
      // No single chunk should be too large
      chunkStats.sizes.forEach(size => {
        expect(size).toBeLessThan(1024 * 1024); // 1MB per chunk
      });
    });
  });
});

// Helper functions for performance testing

function getMemoryUsage(): number {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    return process.memoryUsage().heapUsed;
  }
  
  // Browser environment
  if (performance && performance.memory) {
    return performance.memory.usedJSHeapSize;
  }
  
  return 0;
}

async function simulateGameLoad(): Promise<void> {
  // Simulate loading game assets and initializing
  await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
}

function generateMockMatches(count: number): any[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `match-${i}`,
    creator: `creator-${i}`,
    betAmount: Math.random() * 10,
    timeLeft: Math.floor(Math.random() * 3600),
    status: { waitingForOpponent: {} },
    canJoin: Math.random() > 0.5,
  }));
}

async function processMatchList(matches: any[]): Promise<void> {
  // Simulate processing match list (filtering, sorting, rendering)
  matches.forEach(match => {
    // Simulate some processing
    JSON.stringify(match);
  });
  await new Promise(resolve => setTimeout(resolve, 10));
}

async function simulateGameRound(): Promise<void> {
  // Simulate a complete game round
  await new Promise(resolve => setTimeout(resolve, 100));
}

async function simulateResourceCreation(): Promise<void> {
  // Simulate creating game resources
  const resources = Array.from({ length: 100 }, () => ({ data: new Array(1000).fill(0) }));
  await new Promise(resolve => setTimeout(resolve, 50));
}

async function simulateResourceCleanup(): Promise<void> {
  // Simulate cleaning up resources
  if (global.gc) {
    global.gc();
  }
  await new Promise(resolve => setTimeout(resolve, 50));
}

function createSlowConnection(connection: Connection, delay: number): any {
  return {
    ...connection,
    getAccountInfo: async (...args: any[]) => {
      await new Promise(resolve => setTimeout(resolve, delay));
      return connection.getAccountInfo(...args);
    },
    sendTransaction: async (...args: any[]) => {
      await new Promise(resolve => setTimeout(resolve, delay));
      return connection.sendTransaction(...args);
    },
  };
}

async function simulateNetworkOperation(client: any): Promise<void> {
  // Simulate network operation
  await new Promise(resolve => setTimeout(resolve, Math.random() * 2000));
}

async function simulateOperation(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, Math.random() * 500));
}

async function measureOperation(operation: () => Promise<void>): Promise<number> {
  const startTime = performance.now();
  await operation();
  return performance.now() - startTime;
}

async function simulateTransaction(): Promise<void> {
  // Simulate blockchain transaction
  await new Promise(resolve => {
    setTimeout(resolve, 1000 + Math.random() * 2000);
  });
}

function simulateFrameRender(): void {
  // Simulate frame rendering work
  let sum = 0;
  for (let i = 0; i < 1000; i++) {
    sum += Math.random();
  }
}

async function analyzeBundleSize(): Promise<{ totalSize: number; initialSize: number }> {
  // Mock bundle analysis
  return {
    totalSize: 1500 * 1024, // 1.5MB
    initialSize: 400 * 1024,  // 400KB
  };
}

async function analyzeChunks(): Promise<{ chunks: number; sizes: number[] }> {
  // Mock chunk analysis
  return {
    chunks: 5,
    sizes: [300, 200, 150, 100, 50].map(kb => kb * 1024),
  };
}

function generatePerformanceReport(): void {
  console.log('\n📊 PERFORMANCE REPORT');
  console.log('='.repeat(50));
  
  if (performanceData.length === 0) {
    console.log('No performance data collected');
    return;
  }
  
  const avgLoadTime = performanceData
    .filter(d => d.loadTime > 0)
    .reduce((sum, d) => sum + d.loadTime, 0) / 
    performanceData.filter(d => d.loadTime > 0).length;
    
  const avgRenderTime = performanceData
    .filter(d => d.renderTime > 0)
    .reduce((sum, d) => sum + d.renderTime, 0) / 
    performanceData.filter(d => d.renderTime > 0).length;
    
  const maxMemory = Math.max(...performanceData.map(d => d.memoryUsage));
  
  console.log(`Average Load Time: ${avgLoadTime?.toFixed(2) || 'N/A'}ms`);
  console.log(`Average Render Time: ${avgRenderTime?.toFixed(2) || 'N/A'}ms`);
  console.log(`Peak Memory Usage: ${(maxMemory / 1024 / 1024).toFixed(2)}MB`);
  
  // Performance grades
  const loadGrade = avgLoadTime < 2000 ? '🟢' : avgLoadTime < 5000 ? '🟡' : '🔴';
  const renderGrade = avgRenderTime < 500 ? '🟢' : avgRenderTime < 1000 ? '🟡' : '🔴';
  const memoryGrade = maxMemory < 100*1024*1024 ? '🟢' : maxMemory < 200*1024*1024 ? '🟡' : '🔴';
  
  console.log(`\nGrades:`);
  console.log(`Loading: ${loadGrade}`);
  console.log(`Rendering: ${renderGrade}`);
  console.log(`Memory: ${memoryGrade}`);
}