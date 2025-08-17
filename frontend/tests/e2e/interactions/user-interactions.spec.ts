import { test, expect } from '@playwright/test';
import { ConceptMapPage } from '../../page-objects/ConceptMapPage';
import { VIEWPORTS, TIMEOUTS } from '../../fixtures/testData';

/**
 * User interaction tests for the concept map application.
 * 
 * These tests verify zoom, pan, click, and drag operations work correctly
 * and maintain the visualization state appropriately.
 * 
 * @author Generated following CSCD211 standards
 */

test.describe('User Interactions', () => {
  let conceptMap: ConceptMapPage;

  test.beforeEach(async ({ page }) => {
    conceptMap = new ConceptMapPage(page);
    await conceptMap.goto({ viewport: VIEWPORTS.DEFAULT });
    await conceptMap.waitForLoad();
  });

  test('zoom/pan works and link labels remain visible', async () => {
    // Ensure links and labels are present before interaction
    await conceptMap.waitForSelector('svg .link', { state: 'attached', timeout: TIMEOUTS.ELEMENT_ATTACH });
    await conceptMap.waitForSelector('svg .link-label', { state: 'attached', timeout: TIMEOUTS.ELEMENT_ATTACH });

    // Record initial transform
    const beforeTransform = await conceptMap.getGraphTransform();

    // Perform zoom operation
    await conceptMap.zoomIn();

    // Perform pan operation
    await conceptMap.pan();

    // Give D3 zoom time to process
    await conceptMap.waitForTimeout(300);

    // Verify transform has changed
    const afterTransform = await conceptMap.getGraphTransform();
    expect(afterTransform).not.toBe(beforeTransform);

    // Verify link labels are still visible
    const firstLabel = conceptMap.linkLabels.first();
    await expect(firstLabel).toBeVisible();
  });

  test('double-click shows info in panel', async () => {
    await conceptMap.waitForSelector('svg .node-group', { state: 'attached' });

    const group = conceptMap.nodeGroups.first();
    const circle = group.locator('circle.node');
    await expect(group).toBeVisible();
    await expect(circle).toBeVisible();

    // Get node name for verification
    const nodeName = await circle.getAttribute('data-node-name');

    // Trigger double-click
    await conceptMap.doubleClickFirstNode();

    // Verify info panel appears with correct content
    await expect(conceptMap.infoPanel).toContainText(nodeName ?? '');
  });

  test('clicking node centers it and opens meta ring', async () => {
    const beforeTransform = await conceptMap.getGraphTransform();

    // Click a node with metadata
    const nodeClicked = await conceptMap.clickNodeWithMetadata();
    expect(nodeClicked).toBeTruthy();

    // Wait for meta ring to appear
    await conceptMap.waitForSelector('svg g.meta-ring', { state: 'attached', timeout: TIMEOUTS.META_RING });

    // Verify centering occurred (transform changed)
    const afterTransform = await conceptMap.getGraphTransform();
    expect(afterTransform).not.toBe(beforeTransform);

    // Verify meta ring is visible
    await expect(conceptMap.metaRing).toBeVisible();
  });

  test('clicking background closes panels and rings', async () => {
    // First, open a meta ring
    const nodeClicked = await conceptMap.clickNodeWithMetadata();
    expect(nodeClicked).toBeTruthy();
    
    await conceptMap.waitForSelector('svg g.meta-ring', { state: 'attached', timeout: TIMEOUTS.META_RING });
    await expect(conceptMap.metaRing).toBeVisible();

    // Click background to close
    await conceptMap.clickBackground();

    // Verify meta ring is closed
    await expect(conceptMap.metaRing).toHaveCount(0);
  });

  test('interactions preserve visualization integrity', async () => {
    // Get initial state
    const initialNodeCount = await conceptMap.nodeCircles.count();
    const initialLinkCount = await conceptMap.links.count();

    // Perform multiple interactions
    await conceptMap.zoomIn();
    await conceptMap.pan();
    await conceptMap.doubleClickFirstNode();
    
    // Try to open meta ring
    await conceptMap.clickNodeWithMetadata();
    await conceptMap.waitForTimeout(TIMEOUTS.SETTLE);
    
    // Close everything
    await conceptMap.clickBackground();
    await conceptMap.waitForTimeout(TIMEOUTS.SETTLE);

    // Verify counts remain the same
    const finalNodeCount = await conceptMap.nodeCircles.count();
    const finalLinkCount = await conceptMap.links.count();

    expect(finalNodeCount).toBe(initialNodeCount);
    expect(finalLinkCount).toBe(initialLinkCount);

    // Verify basic elements are still functional
    await expect(conceptMap.svg).toBeVisible();
    expect(finalNodeCount).toBeGreaterThan(0);
    expect(finalLinkCount).toBeGreaterThan(0);
  });
});
