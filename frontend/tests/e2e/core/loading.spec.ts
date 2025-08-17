import { test, expect } from '@playwright/test';
import { ConceptMapPage } from '../../page-objects/ConceptMapPage';
import { VIEWPORTS, TIMEOUTS } from '../../fixtures/testData';

/**
 * Core functionality tests for the concept map application.
 * 
 * These tests verify the fundamental loading and rendering capabilities
 * of the D3.js visualization, ensuring the application starts correctly
 * and displays the expected elements.
 * 
 * @author Generated following CSCD211 standards
 */

test.describe('Core Functionality', () => {
  let conceptMap: ConceptMapPage;

  test.beforeEach(async ({ page }) => {
    conceptMap = new ConceptMapPage(page);
  });

  test('loads concept map and renders nodes (no errors)', async ({ page }) => {
    // Navigate to the application with default settings
    await conceptMap.goto({ viewport: VIEWPORTS.DEFAULT });
    
    // Wait for complete loading
    await conceptMap.waitForLoad();
    
    // Verify nodes are present and rendered
    const nodeCount = await conceptMap.nodeCircles.count();
    expect(nodeCount).toBeGreaterThan(0);

    // Best-effort interaction to verify no JavaScript errors
    const svgBox = await conceptMap.svg.boundingBox();
    if (svgBox) {
      await page.mouse.move(svgBox.x + svgBox.width / 2, svgBox.y + svgBox.height / 2);
      await page.mouse.down();
      await page.mouse.up();
    }

    // Final verification that elements remain visible
    await page.waitForTimeout(TIMEOUTS.SETTLE);
    await expect(conceptMap.svg).toBeVisible();
    expect(await conceptMap.nodeCircles.count()).toBeGreaterThan(0);
  });

  test('displays metadata information correctly', async ({ page }) => {
    await conceptMap.goto({ viewport: VIEWPORTS.DEFAULT });
    await conceptMap.waitForLoad();

    // Verify metadata display elements are present
    await expect(page.getByText(/^Interactive Concept Map$/)).toBeVisible();
    await expect(page.getByText(/Version:/)).toBeVisible();
    
    // Verify that metadata counters are displayed
    const uiCounts = await conceptMap.getUICounts();
    expect(uiCounts.nodes).toBeGreaterThan(0);
    expect(uiCounts.links).toBeGreaterThan(0);
  });

  test('renders without console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await conceptMap.goto({ viewport: VIEWPORTS.DEFAULT });
    await conceptMap.waitForLoad();

    // Perform basic interaction to trigger any lazy-loaded errors
    await conceptMap.doubleClickFirstNode();
    await page.waitForTimeout(TIMEOUTS.SETTLE);

    // Assert no console errors occurred
    expect(consoleErrors).toHaveLength(0);
  });
});
