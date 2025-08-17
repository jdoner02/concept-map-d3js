import { test, expect } from '@playwright/test';
import { ConceptMapPage } from '../../page-objects/ConceptMapPage';
import { MINIMAL_CONCEPT_MAP, createDataUrl, VIEWPORTS } from '../../fixtures/testData';

/**
 * Data integration tests for the concept map application.
 * 
 * These tests verify the application's ability to load and render
 * different data sources, including JSON URL overrides and data URLs.
 * 
 * @author Generated following CSCD211 standards
 */

test.describe('Data Integration', () => {
  let conceptMap: ConceptMapPage;

  test.beforeEach(async ({ page }) => {
    conceptMap = new ConceptMapPage(page);
  });

  test('can load via raw JSON override (data URL)', async () => {
    const dataUrl = createDataUrl(MINIMAL_CONCEPT_MAP);
    
    await conceptMap.goto({ 
      jsonUrl: dataUrl, 
      viewport: VIEWPORTS.COMPACT 
    });

    // Wait for SVG to be visible
    await expect(conceptMap.svg).toBeVisible();
    
    // Wait for nodes to render with the test data
    await conceptMap.waitForSelector('svg .node-group', { state: 'attached' });
    
    // Verify we have the expected number of nodes from our test data
    const nodeCount = await conceptMap.nodeGroups.count();
    expect(nodeCount).toBeGreaterThan(0);
  });

  test('handles malformed JSON gracefully', async ({ page }) => {
    const malformedUrl = 'data:application/json,{invalid json}';
    
    // Navigate with malformed JSON
    await conceptMap.goto({ jsonUrl: malformedUrl });
    
    // Should still show the application structure, possibly with fallback data
    await expect(conceptMap.svg).toBeVisible();
    
    // Check that the app doesn't crash (basic smoke test)
    const title = page.getByText(/Interactive Concept Map/);
    await expect(title).toBeVisible({ timeout: 10000 });
  });

  test('loads default data when no JSON URL provided', async () => {
    await conceptMap.goto({ viewport: VIEWPORTS.DEFAULT });
    await conceptMap.waitForLoad();
    
    // Should load with substantial data (not just test data)
    const nodeCount = await conceptMap.nodeCircles.count();
    expect(nodeCount).toBeGreaterThan(5); // Expecting real dataset
    
    const linkCount = await conceptMap.links.count();
    expect(linkCount).toBeGreaterThan(5); // Expecting real dataset
  });

  test('preserves data integrity after interactions', async () => {
    await conceptMap.goto({ viewport: VIEWPORTS.DEFAULT });
    await conceptMap.waitForLoad();
    
    // Get initial counts
    const initialCounts = await conceptMap.getRenderedCounts();
    
    // Perform various interactions
    await conceptMap.zoomIn();
    await conceptMap.pan();
    await conceptMap.doubleClickFirstNode();
    
    // Wait for any animations to settle
    await conceptMap.waitForTimeout(500);
    
    // Verify counts remain stable
    const finalCounts = await conceptMap.getRenderedCounts();
    expect(finalCounts.nodes).toBe(initialCounts.nodes);
    expect(finalCounts.links).toBe(initialCounts.links);
  });
});
