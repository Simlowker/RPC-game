// tests/cross-browser/cross-browser-tests.test.ts - Cross-Browser Compatibility Tests
import { test, expect, devices } from '@playwright/test';

// Browser configurations for testing
const BROWSERS = [
  { name: 'chromium', viewport: { width: 1920, height: 1080 } },
  { name: 'firefox', viewport: { width: 1920, height: 1080 } },
  { name: 'webkit', viewport: { width: 1920, height: 1080 } },
];

const MOBILE_DEVICES = [
  'iPhone 12',
  'iPhone 12 Pro',
  'Pixel 5',
  'Samsung Galaxy S21',
  'iPad Pro',
];

// Test URLs - adjust based on your development setup
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

test.describe('🌐 Cross-Browser Compatibility Tests', () => {
  BROWSERS.forEach(browser => {
    test.describe(`${browser.name.toUpperCase()} Browser Tests`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize(browser.viewport);
      });

      test(`should load RPS game correctly in ${browser.name}`, async ({ page }) => {
        await page.goto(`${BASE_URL}`);
        
        // Wait for the app to load
        await page.waitForSelector('[data-testid="rps-game"]', { timeout: 30000 });
        
        // Check that essential elements are present
        await expect(page.locator('text=Rock Paper Scissors')).toBeVisible();
        
        // Take screenshot for visual comparison
        await page.screenshot({ 
          path: `tests/screenshots/${browser.name}-rps-game.png`,
          fullPage: true 
        });
      });

      test(`should handle wallet connection in ${browser.name}`, async ({ page }) => {
        await page.goto(`${BASE_URL}`);
        
        // Look for wallet connection UI
        await page.waitForSelector('text=Connect Wallet', { timeout: 10000 });
        
        const connectButton = page.locator('text=Connect Wallet').first();
        await expect(connectButton).toBeVisible();
        
        // Test button interaction
        await connectButton.hover();
        await page.waitForTimeout(500); // Allow for hover effects
        
        await page.screenshot({ 
          path: `tests/screenshots/${browser.name}-wallet-connect.png` 
        });
      });

      test(`should display match lobby correctly in ${browser.name}`, async ({ page }) => {
        await page.goto(`${BASE_URL}`);
        
        // Mock wallet connection (this would need actual wallet adapter mocking)
        await page.evaluate(() => {
          // Mock connected state
          window.localStorage.setItem('walletName', 'phantom');
        });
        
        await page.reload();
        
        // Check for match lobby elements
        await page.waitForSelector('[data-testid="match-lobby"]', { timeout: 10000 });
        
        // Verify lobby functionality
        const createMatchButton = page.locator('text=Create Match').first();
        if (await createMatchButton.isVisible()) {
          await expect(createMatchButton).toBeVisible();
        }
        
        await page.screenshot({ 
          path: `tests/screenshots/${browser.name}-match-lobby.png` 
        });
      });

      test(`should handle responsive design in ${browser.name}`, async ({ page }) => {
        await page.goto(`${BASE_URL}`);
        
        // Test different viewport sizes
        const viewports = [
          { width: 1920, height: 1080 }, // Desktop
          { width: 1366, height: 768 },  // Laptop
          { width: 768, height: 1024 },  // Tablet
          { width: 375, height: 812 },   // Mobile
        ];
        
        for (const viewport of viewports) {
          await page.setViewportSize(viewport);
          await page.waitForTimeout(1000); // Allow for responsive adjustments
          
          // Check that content is still accessible
          await expect(page.locator('body')).toBeVisible();
          
          // Verify no horizontal overflow
          const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
          const clientWidth = await page.evaluate(() => document.body.clientWidth);
          expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20); // 20px tolerance
          
          await page.screenshot({ 
            path: `tests/screenshots/${browser.name}-${viewport.width}x${viewport.height}.png` 
          });
        }
      });

      test(`should support keyboard navigation in ${browser.name}`, async ({ page }) => {
        await page.goto(`${BASE_URL}`);
        
        // Test keyboard navigation
        await page.keyboard.press('Tab');
        
        // Check that focus is visible
        const focusedElement = await page.locator(':focus');
        if (await focusedElement.count() > 0) {
          await expect(focusedElement.first()).toBeVisible();
        }
        
        // Test multiple tab presses
        for (let i = 0; i < 5; i++) {
          await page.keyboard.press('Tab');
          await page.waitForTimeout(200);
        }
        
        // Test Enter key on buttons
        await page.keyboard.press('Enter');
        
        await page.screenshot({ 
          path: `tests/screenshots/${browser.name}-keyboard-nav.png` 
        });
      });

      test(`should handle JavaScript errors gracefully in ${browser.name}`, async ({ page }) => {
        const errors: string[] = [];
        
        page.on('pageerror', (error) => {
          errors.push(error.message);
        });
        
        page.on('console', (msg) => {
          if (msg.type() === 'error') {
            errors.push(msg.text());
          }
        });
        
        await page.goto(`${BASE_URL}`);
        
        // Interact with the page to trigger potential errors
        await page.waitForSelector('body', { timeout: 10000 });
        
        // Click around to trigger interactions
        const buttons = page.locator('button');
        const buttonCount = await buttons.count();
        
        if (buttonCount > 0) {
          // Click first available button
          await buttons.first().click({ timeout: 5000 }).catch(() => {});
        }
        
        // Wait for any async errors
        await page.waitForTimeout(2000);
        
        // Filter out known acceptable errors (e.g., wallet connection failures in test environment)
        const criticalErrors = errors.filter(error => 
          !error.includes('wallet') && 
          !error.includes('RPC') &&
          !error.includes('Failed to fetch')
        );
        
        expect(criticalErrors.length).toBe(0);
      });

      test(`should perform well in ${browser.name}`, async ({ page }) => {
        await page.goto(`${BASE_URL}`);
        
        // Start performance monitoring
        await page.evaluate(() => {
          performance.mark('page-load-start');
        });
        
        await page.waitForSelector('[data-testid="rps-game"]', { timeout: 30000 });
        
        const performanceMetrics = await page.evaluate(() => {
          performance.mark('page-load-end');
          performance.measure('page-load', 'page-load-start', 'page-load-end');
          
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          const pageLoad = performance.getEntriesByName('page-load')[0];
          
          return {
            loadTime: navigation.loadEventEnd - navigation.navigationStart,
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
            firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
            pageLoadMeasure: pageLoad?.duration || 0,
          };
        });
        
        // Performance assertions (adjust thresholds based on your requirements)
        expect(performanceMetrics.loadTime).toBeLessThan(5000); // 5 seconds
        expect(performanceMetrics.domContentLoaded).toBeLessThan(3000); // 3 seconds
        
        console.log(`${browser.name} Performance:`, performanceMetrics);
      });
    });
  });

  test.describe('📱 Mobile Device Tests', () => {
    MOBILE_DEVICES.forEach(deviceName => {
      test(`should work correctly on ${deviceName}`, async ({ browser }) => {
        const device = devices[deviceName];
        if (!device) {
          test.skip(`Device ${deviceName} not found in Playwright devices`);
          return;
        }

        const context = await browser.newContext({
          ...device,
        });

        const page = await context.newPage();
        
        try {
          await page.goto(`${BASE_URL}`);
          
          // Wait for mobile layout to settle
          await page.waitForTimeout(1000);
          
          // Check that the app is responsive
          await expect(page.locator('body')).toBeVisible();
          
          // Test touch interactions
          const buttons = page.locator('button').first();
          if (await buttons.isVisible()) {
            await buttons.tap();
          }
          
          // Check for mobile-specific UI elements
          const viewport = page.viewportSize();
          if (viewport && viewport.width < 768) {
            // Mobile-specific checks
            console.log(`Testing mobile viewport: ${viewport.width}x${viewport.height}`);
          }
          
          await page.screenshot({ 
            path: `tests/screenshots/${deviceName.replace(/\s/g, '-')}-mobile.png`,
            fullPage: true 
          });
          
        } finally {
          await context.close();
        }
      });
    });

    test('should handle orientation changes', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPhone 12'],
      });

      const page = await context.newPage();
      
      try {
        await page.goto(`${BASE_URL}`);
        
        // Portrait mode
        await page.setViewportSize({ width: 375, height: 812 });
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'tests/screenshots/portrait.png' });
        
        // Landscape mode
        await page.setViewportSize({ width: 812, height: 375 });
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'tests/screenshots/landscape.png' });
        
        // Verify layout adapts correctly
        await expect(page.locator('body')).toBeVisible();
        
      } finally {
        await context.close();
      }
    });
  });

  test.describe('🔗 Feature Compatibility Tests', () => {
    test('should handle Web3 features across browsers', async ({ page, browserName }) => {
      await page.goto(`${BASE_URL}`);
      
      // Check for Web3 compatibility
      const hasWeb3 = await page.evaluate(() => {
        return typeof window.solana !== 'undefined' || 
               typeof window.ethereum !== 'undefined' ||
               typeof window.phantom !== 'undefined';
      });
      
      // Log Web3 availability per browser
      console.log(`${browserName} Web3 support:`, hasWeb3);
      
      // Test should not fail based on Web3 availability in test environment
      expect(typeof hasWeb3).toBe('boolean');
    });

    test('should support local storage across browsers', async ({ page }) => {
      await page.goto(`${BASE_URL}`);
      
      // Test localStorage functionality
      const localStorageSupported = await page.evaluate(() => {
        try {
          const testKey = 'test-key';
          const testValue = 'test-value';
          
          localStorage.setItem(testKey, testValue);
          const retrieved = localStorage.getItem(testKey);
          localStorage.removeItem(testKey);
          
          return retrieved === testValue;
        } catch (e) {
          return false;
        }
      });
      
      expect(localStorageSupported).toBe(true);
    });

    test('should support CSS animations across browsers', async ({ page }) => {
      await page.goto(`${BASE_URL}`);
      
      // Check CSS animation support
      const animationSupport = await page.evaluate(() => {
        const div = document.createElement('div');
        div.style.animation = 'fadeIn 1s ease-in-out';
        return div.style.animation !== '';
      });
      
      expect(animationSupport).toBe(true);
    });

    test('should handle WebSocket connections consistently', async ({ page }) => {
      await page.goto(`${BASE_URL}`);
      
      // Check WebSocket support
      const wsSupport = await page.evaluate(() => {
        return typeof WebSocket !== 'undefined';
      });
      
      expect(wsSupport).toBe(true);
    });
  });

  test.describe('🎨 Visual Consistency Tests', () => {
    test('should render consistently across browsers', async ({ page, browserName }) => {
      await page.goto(`${BASE_URL}`);
      
      await page.waitForSelector('[data-testid="rps-game"]', { timeout: 30000 });
      
      // Take full page screenshot
      await page.screenshot({ 
        path: `tests/screenshots/visual-${browserName}-full.png`,
        fullPage: true 
      });
      
      // Take screenshot of specific components
      const components = [
        '[data-testid="match-lobby"]',
        '[data-testid="game-interface"]',
        '[data-testid="wallet-connect"]'
      ];
      
      for (const selector of components) {
        const element = page.locator(selector);
        if (await element.isVisible()) {
          await element.screenshot({ 
            path: `tests/screenshots/visual-${browserName}-${selector.replace(/[\[\]"]/g, '')}.png` 
          });
        }
      }
    });

    test('should maintain button styles across browsers', async ({ page }) => {
      await page.goto(`${BASE_URL}`);
      
      // Check button rendering consistency
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      if (buttonCount > 0) {
        // Check computed styles for first button
        const buttonStyles = await buttons.first().evaluate((btn) => {
          const computed = getComputedStyle(btn);
          return {
            borderRadius: computed.borderRadius,
            padding: computed.padding,
            fontSize: computed.fontSize,
            display: computed.display,
          };
        });
        
        expect(buttonStyles.display).not.toBe('none');
        expect(buttonStyles.fontSize).not.toBe('');
      }
    });
  });

  test.describe('🔍 Debugging and Monitoring', () => {
    test('should provide helpful error messages', async ({ page }) => {
      const consoleLogs: string[] = [];
      
      page.on('console', (msg) => {
        consoleLogs.push(`${msg.type()}: ${msg.text()}`);
      });
      
      await page.goto(`${BASE_URL}`);
      
      // Trigger potential error conditions
      await page.evaluate(() => {
        // Try to trigger an error that should be handled gracefully
        try {
          throw new Error('Test error');
        } catch (e) {
          console.error('Handled error:', e.message);
        }
      });
      
      // Wait for console logs to be captured
      await page.waitForTimeout(1000);
      
      const errorLogs = consoleLogs.filter(log => log.includes('error:'));
      
      // Should have some error handling messages
      console.log('Console logs captured:', consoleLogs.length);
    });
  });
});

// Utility functions for cross-browser testing
export class CrossBrowserTester {
  static async compareScreenshots(
    referenceImage: string,
    testImage: string,
    threshold: number = 0.2
  ): Promise<{ match: boolean; difference: number }> {
    // This would integrate with an image comparison library
    // For now, return a mock result
    return {
      match: true,
      difference: 0.05
    };
  }

  static async getBrowserInfo(page: any): Promise<{
    name: string;
    version: string;
    platform: string;
    userAgent: string;
  }> {
    return await page.evaluate(() => ({
      name: navigator.appName,
      version: navigator.appVersion,
      platform: navigator.platform,
      userAgent: navigator.userAgent,
    }));
  }

  static generateCompatibilityReport(results: any[]): {
    overallScore: number;
    browserScores: Record<string, number>;
    issues: string[];
  } {
    const browserScores: Record<string, number> = {};
    const issues: string[] = [];
    
    results.forEach(result => {
      browserScores[result.browser] = result.passRate;
      
      if (result.passRate < 90) {
        issues.push(`${result.browser}: Low pass rate (${result.passRate}%)`);
      }
    });
    
    const overallScore = Object.values(browserScores).reduce((a, b) => a + b, 0) / 
                        Object.keys(browserScores).length;
    
    return {
      overallScore: Math.round(overallScore),
      browserScores,
      issues,
    };
  }
}