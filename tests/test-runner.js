#!/usr/bin/env node
/**
 * RPS Game Test Runner - Production-Ready Testing Suite
 * Runs comprehensive tests for the Rock Paper Scissors game
 */

const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  timeout: 30000,
  retries: 2,
  coverage: {
    threshold: 80,
    reports: ['text', 'json', 'html']
  },
  browsers: ['chromium', 'firefox', 'webkit'],
  viewports: [
    { width: 1920, height: 1080 }, // Desktop
    { width: 768, height: 1024 },  // Tablet
    { width: 375, height: 812 },   // Mobile
  ]
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Utility functions
function log(message, color = colors.blue) {
  console.log(`${color}[${new Date().toISOString()}]${colors.reset} ${message}`);
}

function success(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function error(message) {
  console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

function warning(message) {
  console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

// Test results tracking
let testResults = {
  timestamp: new Date().toISOString(),
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  suites: {},
  performance: {},
  coverage: null,
  environment: {
    node: process.version,
    platform: process.platform,
    arch: process.arch
  }
};

// Create test results directory
function setupTestEnvironment() {
  const dirs = [
    'test-results',
    'test-results/coverage',
    'test-results/screenshots', 
    'test-results/reports',
    'test-results/artifacts'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// Run a test suite with error handling
async function runTestSuite(name, command, optional = false) {
  log(`Running ${name}...`);
  const startTime = Date.now();
  
  try {
    testResults.total++;
    
    const output = execSync(command, { 
      encoding: 'utf8', 
      timeout: TEST_CONFIG.timeout,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    const duration = Date.now() - startTime;
    testResults.passed++;
    testResults.suites[name] = {
      status: 'passed',
      duration,
      output: output.substring(0, 1000) // Limit output size
    };
    
    success(`${name} passed (${duration}ms)`);
    return true;
    
  } catch (err) {
    const duration = Date.now() - startTime;
    
    if (optional) {
      testResults.skipped++;
      testResults.suites[name] = {
        status: 'skipped',
        duration,
        error: err.message.substring(0, 500)
      };
      warning(`${name} skipped: ${err.message.split('\n')[0]}`);
      return true;
    } else {
      testResults.failed++;
      testResults.suites[name] = {
        status: 'failed',
        duration,
        error: err.message.substring(0, 500)
      };
      error(`${name} failed: ${err.message.split('\n')[0]}`);
      return false;
    }
  }
}

// Check if dependencies are available
function checkDependencies() {
  const deps = [
    { name: 'Node.js', check: () => process.version },
    { name: 'NPM', check: () => execSync('npm --version', { encoding: 'utf8' }).trim() }
  ];
  
  log('Checking dependencies...');
  
  deps.forEach(dep => {
    try {
      const version = dep.check();
      log(`${dep.name}: ${version}`);
    } catch (err) {
      error(`${dep.name} not available`);
    }
  });
}

// Validate project structure
function validateProjectStructure() {
  log('Validating project structure...');
  
  const requiredFiles = [
    'package.json',
    'src/games/RPS/index.tsx',
    'src/rps-client/index.ts',
    'tests/integration/rps-integration.test.ts',
    'tests/game-logic/rps-game-logic.test.ts'
  ];
  
  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
  
  if (missingFiles.length > 0) {
    warning(`Missing files: ${missingFiles.join(', ')}`);
  } else {
    success('Project structure validated');
  }
  
  return missingFiles.length === 0;
}

// Run unit tests
async function runUnitTests() {
  log('📋 Running Unit Tests');
  console.log('━'.repeat(50));
  
  // Check if vitest is available
  try {
    execSync('npx vitest --version', { stdio: 'ignore' });
  } catch (err) {
    warning('Vitest not found, installing...');
    try {
      execSync('npm install --save-dev vitest @vitest/ui', { stdio: 'inherit' });
    } catch (installErr) {
      error('Failed to install Vitest');
      return false;
    }
  }
  
  // Run game logic tests
  await runTestSuite(
    'Game Logic Tests',
    'npx vitest run tests/game-logic/ --reporter=json --outputFile=test-results/game-logic.json'
  );
  
  // Run integration tests
  await runTestSuite(
    'Integration Tests',
    'npx vitest run tests/integration/ --reporter=json --outputFile=test-results/integration.json',
    true
  );
  
  return true;
}

// Run performance tests
async function runPerformanceTests() {
  log('⚡ Running Performance Tests');
  console.log('━'.repeat(50));
  
  await runTestSuite(
    'Performance Tests',
    'npx vitest run tests/performance/ --reporter=json --outputFile=test-results/performance.json',
    true
  );
  
  return true;
}

// Run accessibility tests
async function runAccessibilityTests() {
  log('♿ Running Accessibility Tests');
  console.log('━'.repeat(50));
  
  await runTestSuite(
    'Accessibility Tests', 
    'npx vitest run tests/accessibility/ --reporter=json --outputFile=test-results/accessibility.json',
    true
  );
  
  return true;
}

// Analyze bundle size
async function analyzeBundleSize() {
  log('📦 Analyzing Bundle Size');
  console.log('━'.repeat(50));
  
  if (!fs.existsSync('dist')) {
    warning('No build output found, skipping bundle analysis');
    return true;
  }
  
  try {
    const stats = fs.statSync('dist');
    const bundleSize = execSync('du -sh dist', { encoding: 'utf8' }).trim();
    
    testResults.performance.bundleSize = bundleSize;
    success(`Bundle size: ${bundleSize}`);
    
    // Check if bundle is reasonable size
    const sizeMatch = bundleSize.match(/^(\d+(?:\.\d+)?)(K|M|G)?/);
    if (sizeMatch) {
      const [, size, unit] = sizeMatch;
      const sizeNum = parseFloat(size);
      
      if (unit === 'M' && sizeNum > 10) {
        warning('Bundle size is larger than 10MB');
      } else if (unit === 'G') {
        warning('Bundle size is larger than 1GB');
      }
    }
    
    return true;
  } catch (err) {
    warning('Could not analyze bundle size');
    return true;
  }
}

// Generate comprehensive report
function generateReport() {
  log('📊 Generating Test Report');
  console.log('━'.repeat(50));
  
  const report = {
    ...testResults,
    summary: {
      passRate: testResults.total > 0 ? (testResults.passed / testResults.total * 100).toFixed(2) : 0,
      duration: Object.values(testResults.suites).reduce((sum, suite) => sum + (suite.duration || 0), 0),
      status: testResults.failed === 0 ? 'PASS' : 'FAIL'
    },
    recommendations: []
  };
  
  // Add recommendations based on results
  if (testResults.failed > 0) {
    report.recommendations.push('Fix failing tests before deployment');
  }
  
  if (testResults.skipped > 0) {
    report.recommendations.push('Review skipped tests and address missing dependencies');
  }
  
  if (!testResults.coverage || testResults.coverage.percentage < TEST_CONFIG.coverage.threshold) {
    report.recommendations.push(`Improve test coverage to at least ${TEST_CONFIG.coverage.threshold}%`);
  }
  
  // Save detailed report
  fs.writeFileSync('test-results/comprehensive-report.json', JSON.stringify(report, null, 2));
  
  // Generate HTML report
  const htmlReport = generateHTMLReport(report);
  fs.writeFileSync('test-results/report.html', htmlReport);
  
  return report;
}

// Generate HTML report
function generateHTMLReport(report) {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>RPS Game Test Report</title>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 3px solid #4CAF50; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; border-left: 4px solid #4CAF50; }
        .metric.failed { border-left-color: #f44336; }
        .metric.warning { border-left-color: #ff9800; }
        .metric h3 { margin: 0 0 10px 0; font-size: 2em; color: #333; }
        .metric p { margin: 0; color: #666; font-weight: bold; }
        .status { display: inline-block; padding: 5px 15px; border-radius: 20px; font-weight: bold; text-transform: uppercase; }
        .status.pass { background: #4CAF50; color: white; }
        .status.fail { background: #f44336; color: white; }
        .test-suite { margin: 15px 0; padding: 15px; border: 1px solid #ddd; border-radius: 4px; }
        .test-suite.passed { border-left: 4px solid #4CAF50; }
        .test-suite.failed { border-left: 4px solid #f44336; }
        .test-suite.skipped { border-left: 4px solid #ff9800; }
        .test-suite h4 { margin: 0 0 10px 0; }
        .test-suite .duration { color: #666; font-size: 0.9em; }
        .recommendations { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 15px; margin: 20px 0; }
        .recommendations ul { margin: 10px 0; padding-left: 20px; }
        pre { background: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto; font-size: 0.9em; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎮 RPS Game Test Report</h1>
        <p><strong>Generated:</strong> ${new Date(report.timestamp).toLocaleString()}</p>
        <p><strong>Overall Status:</strong> <span class="status ${report.summary.status.toLowerCase()}">${report.summary.status}</span></p>
        
        <div class="summary">
            <div class="metric">
                <h3>${report.total}</h3>
                <p>Total Tests</p>
            </div>
            <div class="metric">
                <h3>${report.passed}</h3>
                <p>Passed</p>
            </div>
            <div class="metric ${report.failed > 0 ? 'failed' : ''}">
                <h3>${report.failed}</h3>
                <p>Failed</p>
            </div>
            <div class="metric ${report.skipped > 0 ? 'warning' : ''}">
                <h3>${report.skipped}</h3>
                <p>Skipped</p>
            </div>
            <div class="metric">
                <h3>${report.summary.passRate}%</h3>
                <p>Pass Rate</p>
            </div>
            <div class="metric">
                <h3>${(report.summary.duration / 1000).toFixed(1)}s</h3>
                <p>Duration</p>
            </div>
        </div>
        
        ${report.recommendations.length > 0 ? `
        <div class="recommendations">
            <h3>📋 Recommendations</h3>
            <ul>
                ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        </div>
        ` : ''}
        
        <h2>📝 Test Suites</h2>
        ${Object.entries(report.suites).map(([name, suite]) => `
        <div class="test-suite ${suite.status}">
            <h4>${name} <span class="duration">(${suite.duration}ms)</span></h4>
            <p><strong>Status:</strong> ${suite.status.toUpperCase()}</p>
            ${suite.error ? `<pre>${suite.error}</pre>` : ''}
        </div>
        `).join('')}
        
        <h2>🔧 Environment</h2>
        <ul>
            <li><strong>Node.js:</strong> ${report.environment.node}</li>
            <li><strong>Platform:</strong> ${report.environment.platform}</li>
            <li><strong>Architecture:</strong> ${report.environment.arch}</li>
        </ul>
        
        ${report.performance.bundleSize ? `
        <h2>📦 Performance</h2>
        <ul>
            <li><strong>Bundle Size:</strong> ${report.performance.bundleSize}</li>
        </ul>
        ` : ''}
        
        <div class="footer">
            <p>Generated by RPS Game Test Runner | ${new Date().getFullYear()}</p>
        </div>
    </div>
</body>
</html>
  `;
}

// Main execution
async function main() {
  console.log(`${colors.bright}${colors.cyan}
╔══════════════════════════════════════════════════════════════╗
║                    RPS GAME TEST RUNNER                     ║
║              Production-Ready Testing Suite                 ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`);
  
  const startTime = Date.now();
  
  try {
    // Setup
    setupTestEnvironment();
    checkDependencies();
    
    if (!validateProjectStructure()) {
      error('Project structure validation failed');
      process.exit(1);
    }
    
    // Run test suites
    await runUnitTests();
    await runPerformanceTests();
    await runAccessibilityTests();
    await analyzeBundleSize();
    
    // Generate report
    const report = generateReport();
    const totalDuration = Date.now() - startTime;
    
    // Display final results
    console.log(`\n${colors.bright}🎯 FINAL RESULTS${colors.reset}`);
    console.log('═'.repeat(60));
    console.log(`Total Duration: ${(totalDuration / 1000).toFixed(1)}s`);
    console.log(`Tests Run: ${report.total}`);
    console.log(`Passed: ${colors.green}${report.passed}${colors.reset}`);
    console.log(`Failed: ${report.failed > 0 ? colors.red : colors.green}${report.failed}${colors.reset}`);
    console.log(`Skipped: ${report.skipped > 0 ? colors.yellow : colors.green}${report.skipped}${colors.reset}`);
    console.log(`Pass Rate: ${report.summary.passRate}%`);
    console.log(`Status: ${report.summary.status === 'PASS' ? colors.green : colors.red}${report.summary.status}${colors.reset}`);
    
    if (report.summary.status === 'PASS') {
      success('\n🎉 All tests passed! RPS Game is ready for production!');
      console.log(`\n📊 View detailed report: test-results/report.html`);
      process.exit(0);
    } else {
      error('\n💥 Some tests failed. Check the report for details.');
      console.log(`\n📊 View detailed report: test-results/report.html`);
      process.exit(1);
    }
    
  } catch (err) {
    error(`Test runner failed: ${err.message}`);
    console.error(err.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  runTestSuite,
  generateReport,
  TEST_CONFIG,
  testResults
};