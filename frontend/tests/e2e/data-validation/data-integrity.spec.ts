import { test, expect } from '@playwright/test';
import { ConceptMapPage } from '../../page-objects/ConceptMapPage';
import { VIEWPORTS, NODE_RADIUS_BOUNDS } from '../../fixtures/testData';
import { approximatelyEqual, calculateStats } from '../../utils/testHelpers';

/**
 * Data validation tests for the concept map application.
 * 
 * These tests verify that the rendered visualization accurately reflects
 * the underlying data and maintains data integrity.
 * 
 * @author Generated following CSCD211 standards
 */

test.describe('Data Validation', () => {
  let conceptMap: ConceptMapPage;

  test.beforeEach(async ({ page }) => {
    conceptMap = new ConceptMapPage(page);
    await conceptMap.goto({ viewport: VIEWPORTS.DEFAULT });
    await conceptMap.waitForLoad();
  });

  test('metadata counters match rendered nodes and links', async () => {
    // Wait for complete rendering
    await conceptMap.waitForSelector('svg .node-group', { state: 'attached' });
    await conceptMap.waitForSelector('svg .link', { state: 'attached' });

    // Get counts from UI display
    const uiCounts = await conceptMap.getUICounts();
    
    // Get actual rendered counts
    const renderedCounts = await conceptMap.getRenderedCounts();

    // Verify counts are reasonable
    expect(uiCounts.nodes).toBeGreaterThan(0);
    expect(uiCounts.links).toBeGreaterThan(0);
    expect(renderedCounts.nodes).toBeGreaterThan(0);
    expect(renderedCounts.links).toBeGreaterThan(0);

    // Allow for small discrepancies between different counting methods
    // but ensure they're in close agreement
    expect(approximatelyEqual(uiCounts.nodes, renderedCounts.nodes)).toBeTruthy();
    expect(approximatelyEqual(uiCounts.links, renderedCounts.links)).toBeTruthy();
  });

  test('node radii vary indicating metadata and degree-based sizing', async () => {
    // Wait for nodes to render and transitions to settle
    await conceptMap.waitForSelector('svg .node-group circle.node', { state: 'attached' });
    await conceptMap.waitForTimeout(400);

    const radii = await conceptMap.getNodeRadii(30);
    
    // Verify we got meaningful data
    expect(radii.length).toBeGreaterThan(3);
    
    // Calculate statistics
    const stats = calculateStats(radii);
    
    // Expect meaningful variation in node sizes
    expect(stats.spread).toBeGreaterThanOrEqual(NODE_RADIUS_BOUNDS.MIN_SPREAD);
    
    // Ensure values stay within designed bounds
    expect(stats.min).toBeGreaterThanOrEqual(NODE_RADIUS_BOUNDS.MIN);
    expect(stats.max).toBeLessThanOrEqual(NODE_RADIUS_BOUNDS.MAX);
  });

  test('links connect valid nodes', async ({ page }) => {
    await conceptMap.waitForSelector('svg .link', { state: 'attached' });
    await conceptMap.waitForSelector('svg .node-group', { state: 'attached' });

    // Verify that all links have source and target references
    const linkValidation = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('svg .link'));
      const nodes = Array.from(document.querySelectorAll('svg .node-group'));
      
      // Get all node IDs from data
      const nodeIds = new Set(
        nodes.map(node => (node as any).__data__?.id).filter(Boolean)
      );

      // Check each link's source and target
      const invalidLinks = links.filter(link => {
        const linkData = (link as any).__data__;
        if (!linkData) return true;
        
        const sourceId = linkData.source?.id || linkData.source;
        const targetId = linkData.target?.id || linkData.target;
        
        return !nodeIds.has(sourceId) || !nodeIds.has(targetId);
      });

      return {
        totalLinks: links.length,
        invalidLinks: invalidLinks.length,
        totalNodes: nodeIds.size
      };
    });

    // All links should have valid source and target nodes
    expect(linkValidation.invalidLinks).toBe(0);
    expect(linkValidation.totalLinks).toBeGreaterThan(0);
    expect(linkValidation.totalNodes).toBeGreaterThan(0);
  });

  test('visual elements maintain consistent properties', async () => {
    // Verify nodes have consistent styling
    const nodeStyles = await conceptMap.nodeCircles.first().evaluate(el => {
      const computedStyle = window.getComputedStyle(el);
      return {
        fill: computedStyle.fill,
        stroke: computedStyle.stroke,
        cursor: computedStyle.cursor
      };
    });

    // Basic styling should be applied (cursor can be pointer or grab for draggable elements)
    expect(['pointer', 'grab'].includes(nodeStyles.cursor)).toBeTruthy();
    
    // Verify links have proper styling
    const linkStyles = await conceptMap.links.first().evaluate(el => {
      const computedStyle = window.getComputedStyle(el);
      return {
        stroke: computedStyle.stroke,
        strokeWidth: computedStyle.strokeWidth
      };
    });

    // Links should have stroke properties
    expect(linkStyles.stroke).not.toBe('none');
    expect(linkStyles.strokeWidth).not.toBe('0px');
  });

  test('data structure integrity after user interactions', async () => {
    // Get initial data snapshot
    const initialData = await conceptMap.evaluate(() => {
      const nodeCount = document.querySelectorAll('svg .node-group').length;
      const linkCount = document.querySelectorAll('svg .link').length;
      const nodeIds = Array.from(document.querySelectorAll('svg .node-group'))
        .map(node => (node as any).__data__?.id)
        .filter(Boolean);
      
      return { nodeCount, linkCount, nodeIds };
    });

    // Perform interactions
    await conceptMap.zoomIn();
    await conceptMap.pan();
    await conceptMap.doubleClickFirstNode();
    
    // Try meta ring if possible
    await conceptMap.clickNodeWithMetadata();
    await conceptMap.waitForTimeout(200);
    await conceptMap.clickBackground();

    // Verify data integrity is maintained
    const finalData = await conceptMap.evaluate(() => {
      const nodeCount = document.querySelectorAll('svg .node-group').length;
      const linkCount = document.querySelectorAll('svg .link').length;
      const nodeIds = Array.from(document.querySelectorAll('svg .node-group'))
        .map(node => (node as any).__data__?.id)
        .filter(Boolean);
      
      return { nodeCount, linkCount, nodeIds };
    });

    // Data should remain consistent
    expect(finalData.nodeCount).toBe(initialData.nodeCount);
    expect(finalData.linkCount).toBe(initialData.linkCount);
    expect(finalData.nodeIds).toEqual(initialData.nodeIds);
  });
});
