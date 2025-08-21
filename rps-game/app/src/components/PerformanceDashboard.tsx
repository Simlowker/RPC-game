/**
 * Performance Dashboard Component
 * Real-time performance monitoring and metrics visualization
 */

import React from 'react';
import { performanceTracker, PerformanceMetric } from '../utils/performance';
import { useSolanaOptimizer } from '../utils/solana-optimization';

interface PerformanceStats {
  lcp: number;
  fid: number;
  cls: number;
  ttfb: number;
  memoryUsage: number;
  cacheHitRate: number;
  solanaResponseTime: number;
}

const PerformanceDashboard: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ 
  isOpen, 
  onClose 
}) => {
  const [metrics, setMetrics] = React.useState<PerformanceMetric[]>([]);
  const [stats, setStats] = React.useState<PerformanceStats | null>(null);
  const [report, setReport] = React.useState<string>('');
  const { getCacheStats } = useSolanaOptimizer();

  // Update metrics every 5 seconds
  React.useEffect(() => {
    if (!isOpen) return;

    const updateMetrics = () => {
      const allMetrics = performanceTracker.getMetrics();
      setMetrics(allMetrics.slice(-50)); // Last 50 metrics

      // Calculate current stats
      const now = Date.now();
      const recentMetrics = allMetrics.filter(m => now - m.timestamp < 60000); // Last minute

      const lcpMetrics = recentMetrics.filter(m => m.name === 'LCP');
      const fidMetrics = recentMetrics.filter(m => m.name === 'FID');
      const clsMetrics = recentMetrics.filter(m => m.name === 'CLS');
      const ttfbMetrics = recentMetrics.filter(m => m.name === 'Page Load');
      const memoryMetrics = recentMetrics.filter(m => m.name === 'Memory Usage');
      const solanaMetrics = recentMetrics.filter(m => m.name.includes('Solana'));

      const cacheStats = getCacheStats();

      setStats({
        lcp: lcpMetrics.length > 0 ? lcpMetrics[lcpMetrics.length - 1].value : 0,
        fid: fidMetrics.length > 0 ? fidMetrics[fidMetrics.length - 1].value : 0,
        cls: clsMetrics.length > 0 ? clsMetrics[clsMetrics.length - 1].value : 0,
        ttfb: ttfbMetrics.length > 0 ? ttfbMetrics[ttfbMetrics.length - 1].details?.ttfb || 0 : 0,
        memoryUsage: memoryMetrics.length > 0 ? 
          (memoryMetrics[memoryMetrics.length - 1].details?.usagePercentage || 0) : 0,
        cacheHitRate: cacheStats.hitRate,
        solanaResponseTime: solanaMetrics.length > 0 ? 
          solanaMetrics.reduce((acc, m) => acc + m.value, 0) / solanaMetrics.length : 0
      });
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);

    return () => clearInterval(interval);
  }, [isOpen, getCacheStats]);

  const generateReport = () => {
    const reportData = performanceTracker.generateReport();
    setReport(reportData);
  };

  const getRatingColor = (value: number, thresholds: { good: number; poor: number }) => {
    if (value <= thresholds.good) return 'text-green-400';
    if (value <= thresholds.poor) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRatingText = (value: number, thresholds: { good: number; poor: number }) => {
    if (value <= thresholds.good) return 'Good';
    if (value <= thresholds.poor) return 'Needs Improvement';
    return 'Poor';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <div className="w-3 h-3 bg-green-400 rounded-full mr-3 animate-pulse"></div>
            Performance Dashboard
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Core Web Vitals */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Core Web Vitals</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {stats && (
              <>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">LCP (Largest Contentful Paint)</div>
                  <div className={`text-2xl font-bold ${getRatingColor(stats.lcp, { good: 2500, poor: 4000 })}`}>
                    {stats.lcp.toFixed(0)}ms
                  </div>
                  <div className={`text-xs ${getRatingColor(stats.lcp, { good: 2500, poor: 4000 })}`}>
                    {getRatingText(stats.lcp, { good: 2500, poor: 4000 })}
                  </div>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">FID (First Input Delay)</div>
                  <div className={`text-2xl font-bold ${getRatingColor(stats.fid, { good: 100, poor: 300 })}`}>
                    {stats.fid.toFixed(0)}ms
                  </div>
                  <div className={`text-xs ${getRatingColor(stats.fid, { good: 100, poor: 300 })}`}>
                    {getRatingText(stats.fid, { good: 100, poor: 300 })}
                  </div>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">CLS (Cumulative Layout Shift)</div>
                  <div className={`text-2xl font-bold ${getRatingColor(stats.cls, { good: 0.1, poor: 0.25 })}`}>
                    {stats.cls.toFixed(3)}
                  </div>
                  <div className={`text-xs ${getRatingColor(stats.cls, { good: 0.1, poor: 0.25 })}`}>
                    {getRatingText(stats.cls, { good: 0.1, poor: 0.25 })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Additional Metrics */}
          <h3 className="text-lg font-semibold text-white mb-4">Additional Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats && (
              <>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">TTFB</div>
                  <div className="text-xl font-bold text-blue-400">{stats.ttfb.toFixed(0)}ms</div>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Memory Usage</div>
                  <div className={`text-xl font-bold ${stats.memoryUsage > 80 ? 'text-red-400' : 'text-green-400'}`}>
                    {stats.memoryUsage.toFixed(1)}%
                  </div>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Cache Hit Rate</div>
                  <div className="text-xl font-bold text-purple-400">{stats.cacheHitRate.toFixed(1)}%</div>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Solana RPC Avg</div>
                  <div className={`text-xl font-bold ${stats.solanaResponseTime > 1000 ? 'text-red-400' : 'text-green-400'}`}>
                    {stats.solanaResponseTime.toFixed(0)}ms
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Recent Metrics List */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
            <button
              onClick={generateReport}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Generate Report
            </button>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4 max-h-60 overflow-y-auto">
            {metrics.slice(-10).reverse().map((metric, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    metric.rating === 'good' ? 'bg-green-400' :
                    metric.rating === 'needs-improvement' ? 'bg-yellow-400' :
                    metric.rating === 'poor' ? 'bg-red-400' : 'bg-gray-400'
                  }`}></div>
                  <span className="text-white text-sm">{metric.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-gray-300 text-sm">{metric.value.toFixed(2)}ms</div>
                  <div className="text-gray-500 text-xs">
                    {new Date(metric.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Report Modal */}
          {report && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Performance Report</h3>
              <div className="bg-gray-800 rounded-lg p-4">
                <pre className="text-sm text-gray-300 whitespace-pre-wrap overflow-x-auto">
                  {report}
                </pre>
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(report);
                      // You could add a toast notification here
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    Copy Report
                  </button>
                  <button
                    onClick={() => setReport('')}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    Close Report
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard;