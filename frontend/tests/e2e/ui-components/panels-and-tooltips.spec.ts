import { test, expect } from '@playwright/test';
import { ConceptMapPage } from '../../page-objects/ConceptMapPage';
import { VIEWPORTS, TIMEOUTS, TEST_IDS, PATTERNS } from '../../fixtures/testData';

/**
 * UI Components tests for the concept map application.
 * 
 * These tests verify the behavior of interactive UI components like
 * tooltips, panels, meta rings, and their visual elements.
 * 
 * @author Generated following CSCD211 standards
 */

test.describe('UI Components', () => {
  let conceptMap: ConceptMapPage;

  test.beforeEach(async ({ page }) => {
    conceptMap = new ConceptMapPage(page);
    await conceptMap.goto({ viewport: VIEWPORTS.DEFAULT });
    await conceptMap.waitForLoad();
  });

  test('tooltip appears on double-click and neighbor interaction works', async ({ page }) => {
    await conceptMap.waitForSelector('svg .node-group', { state: 'attached' });

    // Trigger double-click to show tooltip
    await conceptMap.doubleClickFirstNode();

    const tooltip = page.getByTestId(TEST_IDS.NODE_TOOLTIP);
    await expect(tooltip).toBeVisible();
    
    // Try to interact with mini-tree if present
    const miniTreeLeaf = tooltip.getByTestId(TEST_IDS.MINI_LEAF).first();
    const isLeafVisible = await miniTreeLeaf.isVisible().catch(() => false);
    
    if (isLeafVisible) {
      // Capture the neighbor name and click
      const leafName = (await miniTreeLeaf.textContent())?.trim() || '';
      await miniTreeLeaf.evaluate((el: Element) => {
        el.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      });
      
      await conceptMap.waitForTimeout(200);
      
      // Verify neighbor node is highlighted/visible
      if (leafName.length > 0) {
        const neighborLabel = page.locator('svg .node-group .node-label', { hasText: leafName }).first();
        await expect(neighborLabel).toBeVisible();
      }
    }
  });

  test('meta bubble interaction opens and closes panels', async ({ page }) => {
    // Open a meta ring first
    const nodeClicked = await conceptMap.clickNodeWithMetadata();
    expect(nodeClicked).toBeTruthy();
    
    await conceptMap.waitForSelector('svg g.meta-ring', { state: 'attached', timeout: TIMEOUTS.META_RING });

    // Verify meta bubbles are present
    await conceptMap.waitForSelector(`[data-testid="${TEST_IDS.META_BUBBLE}"]`, { 
      state: 'attached', 
      timeout: TIMEOUTS.META_RING 
    });
    
    const bubbleCount = await conceptMap.metaBubbles.count();
    expect(bubbleCount).toBeGreaterThan(0);

    // Click the first bubble
    const bubble = conceptMap.metaBubbles.first();
    await bubble.evaluate((el: Element) => {
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    });

    // Verify meta panel appears
    await conceptMap.waitForSelector('svg g.meta-panel', { state: 'attached' });
    await expect(conceptMap.metaPanel).toHaveCount(1);

    // Click background to close
    await conceptMap.clickBackground();
    
    // Verify both panel and ring are closed
    await expect(conceptMap.metaPanel).toHaveCount(0);
    await expect(conceptMap.metaRing).toHaveCount(0);
  });

  test('meta ring labels are centered and spikes attach properly', async ({ page }) => {
    // Open a meta ring
    const nodeClicked = await conceptMap.clickNodeWithMetadata();
    expect(nodeClicked).toBeTruthy();
    
    await conceptMap.waitForSelector(`[data-testid="${TEST_IDS.META_BUBBLE}"]`, { state: 'attached' });

    // Inspect first bubble for proper label and spike formatting
    const bubble = conceptMap.metaBubbles.first();
    const spike = bubble.locator(`[data-testid="${TEST_IDS.LABEL_SPIKE}"]`).first();
    
    // Verify spike has a path (SVG path element)
    await expect(spike).toHaveAttribute('d', PATTERNS.PATH_ATTRIBUTE, { timeout: TIMEOUTS.ELEMENT_ATTACH });
    
    // Verify label group exists and text is properly centered
    const labelGroup = bubble.locator(`[data-testid="${TEST_IDS.BUBBLE_LABEL}"]`).first();
    await expect(labelGroup).toBeAttached({ timeout: TIMEOUTS.ELEMENT_ATTACH });
    
    const text = labelGroup.locator('text').first();
    await expect(text).toHaveAttribute('text-anchor', /middle/);
    await expect(text).toHaveAttribute('dominant-baseline', /middle/);
  });

  test('info panel displays node information correctly', async () => {
    await conceptMap.doubleClickFirstNode();
    
    // Verify info panel contains meaningful content
    await expect(conceptMap.infoPanel).toBeVisible();
    
    // Panel should contain some text content
    const panelText = await conceptMap.infoPanel.textContent();
    expect(panelText).toBeTruthy();
    expect(panelText?.length).toBeGreaterThan(0);
  });

  test('UI components are responsive to viewport changes', async ({ page }) => {
    // Test with compact viewport
    await conceptMap.goto({ viewport: VIEWPORTS.COMPACT });
    await conceptMap.waitForLoad();
    
    // Verify elements still render properly
    await expect(conceptMap.svg).toBeVisible();
    
    const nodeCount = await conceptMap.nodeCircles.count();
    expect(nodeCount).toBeGreaterThan(0);
    
    // Test interactions still work
    await conceptMap.doubleClickFirstNode();
    await expect(conceptMap.infoPanel).toBeVisible();
  });
});
