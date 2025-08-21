/**
 * Performance monitoring and optimization utilities
 * Tracks Core Web Vitals, custom metrics, and provides performance optimization helpers
 */

interface PerformanceMetric {
  name: string;
  value: number;
  rating?: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  url: string;
  details?: Record<string, any>;
}

interface SolanaPerformanceMetric extends PerformanceMetric {
  rpcEndpoint?: string;
  operation?: string;
  blockHash?: string;
}

class PerformanceTracker {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];
  
  constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    if (!('PerformanceObserver' in window)) {
      console.warn('PerformanceObserver not supported');
      return;
    }

    try {
      // Long Task Observer for blocking operations
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric({
            name: 'Long Task',
            value: entry.duration,
            rating: entry.duration > 50 ? 'poor' : 'good',
            details: {
              startTime: entry.startTime,
              name: entry.name
            }
          });
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.push(longTaskObserver);

      // Memory usage tracking
      if ('memory' in performance) {
        setInterval(() => {
          const memory = (performance as any).memory;
          this.recordMetric({
            name: 'Memory Usage',
            value: memory.usedJSHeapSize,
            details: {
              usedJSHeapSize: memory.usedJSHeapSize,
              totalJSHeapSize: memory.totalJSHeapSize,
              jsHeapSizeLimit: memory.jsHeapSizeLimit,
              usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
            }
          });
        }, 30000); // Check every 30 seconds
      }
    } catch (error) {
      console.warn('Performance observers setup failed:', error);
    }
  }

  recordMetric(metric: Omit<PerformanceMetric, 'timestamp' | 'url'>) {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: Date.now(),
      url: window.location.href
    };
    
    this.metrics.push(fullMetric);
    
    // Keep only last 100 metrics in memory
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
    
    // Store in localStorage for persistence
    this.persistMetrics();
    
    // Log critical performance issues
    if (metric.rating === 'poor') {
      console.warn(`Performance issue detected: ${metric.name}`, fullMetric);
    }
  }

  recordSolanaMetric(metric: Omit<SolanaPerformanceMetric, 'timestamp' | 'url'>) {
    this.recordMetric(metric);
  }

  private persistMetrics() {
    try {
      const storedMetrics = JSON.parse(localStorage.getItem('performance-metrics') || '[]');
      const allMetrics = [...storedMetrics, ...this.metrics.slice(-10)]; // Add last 10 new metrics
      localStorage.setItem('performance-metrics', JSON.stringify(allMetrics.slice(-200))); // Keep last 200
    } catch (error) {
      console.warn('Failed to persist metrics:', error);
    }
  }

  getMetrics(filter?: string): PerformanceMetric[] {
    const allMetrics = [
      ...JSON.parse(localStorage.getItem('performance-metrics') || '[]'),
      ...this.metrics
    ];
    
    if (filter) {
      return allMetrics.filter(m => m.name.toLowerCase().includes(filter.toLowerCase()));
    }
    
    return allMetrics;
  }

  generateReport(): string {
    const metrics = this.getMetrics();
    const now = Date.now();
    const last24h = metrics.filter(m => now - m.timestamp < 24 * 60 * 60 * 1000);
    
    const report = {
      timestamp: new Date().toISOString(),
      totalMetrics: metrics.length,
      last24hMetrics: last24h.length,
      performance: this.analyzePerformance(last24h),
      recommendations: this.generateRecommendations(last24h)
    };
    
    return JSON.stringify(report, null, 2);
  }

  private analyzePerformance(metrics: PerformanceMetric[]) {
    const byName = metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) acc[metric.name] = [];
      acc[metric.name].push(metric);
      return acc;
    }, {} as Record<string, PerformanceMetric[]>);

    const analysis: Record<string, any> = {};
    
    Object.entries(byName).forEach(([name, metricList]) => {
      const values = metricList.map(m => m.value);
      const ratings = metricList.map(m => m.rating).filter(Boolean);
      
      analysis[name] = {
        count: metricList.length,
        average: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        ratings: {
          good: ratings.filter(r => r === 'good').length,
          needsImprovement: ratings.filter(r => r === 'needs-improvement').length,
          poor: ratings.filter(r => r === 'poor').length
        }
      };
    });
    
    return analysis;
  }

  private generateRecommendations(metrics: PerformanceMetric[]): string[] {
    const recommendations: string[] = [];
    const analysis = this.analyzePerformance(metrics);
    
    // Check LCP
    if (analysis['LCP'] && analysis['LCP'].average > 2500) {
      recommendations.push('LCP is slower than recommended. Consider optimizing images and reducing server response time.');
    }
    
    // Check FID
    if (analysis['FID'] && analysis['FID'].average > 100) {
      recommendations.push('FID is high. Consider reducing JavaScript execution time and breaking up long tasks.');
    }
    
    // Check CLS
    if (analysis['CLS'] && analysis['CLS'].average > 0.1) {
      recommendations.push('CLS is high. Ensure images and ads have size attributes and avoid inserting content above existing content.');
    }
    
    // Check Long Tasks
    if (analysis['Long Task'] && analysis['Long Task'].count > 0) {
      recommendations.push('Long tasks detected. Consider using Web Workers or breaking up JavaScript execution.');
    }
    
    // Check Memory Usage
    if (analysis['Memory Usage']) {
      const avgMemoryUsage = analysis['Memory Usage'].details?.[0]?.usagePercentage || 0;
      if (avgMemoryUsage > 80) {
        recommendations.push('High memory usage detected. Consider optimizing data structures and cleaning up unused objects.');
      }
    }
    
    return recommendations;
  }

  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// React hooks for performance monitoring
export function usePerformanceTracking() {
  const tracker = new PerformanceTracker();
  
  const trackSolanaOperation = (
    operation: string,
    rpcEndpoint: string,
    startTime: number,
    endTime: number,
    success: boolean,
    details?: Record<string, any>
  ) => {
    const duration = endTime - startTime;
    tracker.recordSolanaMetric({
      name: `Solana ${operation}`,
      value: duration,
      rating: duration < 1000 ? 'good' : duration < 3000 ? 'needs-improvement' : 'poor',
      rpcEndpoint,
      operation,
      details: {
        ...details,
        success,
        duration
      }
    });
  };

  const trackCustomMetric = (name: string, value: number, details?: Record<string, any>) => {
    tracker.recordMetric({ name, value, details });
  };

  return { trackSolanaOperation, trackCustomMetric, tracker };
}

// Debounced function utility for performance
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttled function utility for performance
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Lazy loading utility for components
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) {
  const LazyComponent = React.lazy(importFn);
  
  return function LazyWrapper(props: React.ComponentProps<T>) {
    return (
      <React.Suspense fallback={fallback ? React.createElement(fallback) : <div>Loading...</div>}>
        <LazyComponent {...props} />
      </React.Suspense>
    );
  };
}

// Image optimization utility
export function optimizeImage(
  src: string,
  width?: number,
  height?: number,
  quality: number = 85
): string {
  // For production, you might want to use a service like Cloudinary or ImageKit
  // This is a placeholder for image optimization logic
  if (width || height) {
    return `${src}?w=${width || ''}&h=${height || ''}&q=${quality}`;
  }
  return src;
}

// Resource preloading utility
export function preloadResource(href: string, as: string) {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  document.head.appendChild(link);
}

// Create and export singleton instance
export const performanceTracker = new PerformanceTracker();

// Export types
export type { PerformanceMetric, SolanaPerformanceMetric };