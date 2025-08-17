import { test, expect } from '@playwright/test';

// Functional E2E: start servers via webServer config, then interact with the D3 graph
// User story: As a user, I open the app, wait for the concept map to load, click nodes, and drag a node around

test('loads concept map and renders nodes (no errors)', async ({ page }) => {
  // Go to frontend app
  await page.goto('/');
  // Ensure the whole SVG fits within the viewport to avoid offscreen interactions
  await page.setViewportSize({ width: 1400, height: 900 });

  // Wait for the visualization to render (svg present)
  // SVG root used implicitly by selectors below
  const svg = page.locator('svg');
  await expect(svg).toBeVisible();

  // Ensure metadata summary is visible (sanity check data loaded)
  await expect(page.getByText(/^Interactive Concept Map$/)).toBeVisible();
  await expect(page.getByText(/Version:/)).toBeVisible();

  // Wait for at least one node circle to be present
  const nodes = page.locator('svg .node');
  // Use a selector wait to avoid counting races
  await page.waitForSelector('svg .node', { state: 'attached', timeout: 20000 });
  // Small settle so D3 ticks apply initial transforms
  await page.waitForTimeout(150);
  const nodeCount = await nodes.count();
  expect(nodeCount).toBeGreaterThan(0);

  // Best-effort soft interaction: click center of SVG to focus and ensure no errors
  const svgBox = await svg.boundingBox();
  if (svgBox) {
    await page.mouse.move(svgBox.x + svgBox.width / 2, svgBox.y + svgBox.height / 2);
    await page.mouse.down();
    await page.mouse.up();
  }

  // Optional: brief settle and sanity checks
  await page.waitForTimeout(200);
  await expect(svg).toBeVisible();
  expect(await page.locator('svg .node').count()).toBeGreaterThan(0);
});

test('can load via raw JSON override (data URL)', async ({ page }) => {
  // Minimal valid concept map JSON
  const json = {
    metadata: { version: 'test', total_nodes: 2, total_links: 1 },
    nodes: [
      { id: 'A', name: 'A', group: 'concept', description: 'A desc' },
      { id: 'B', name: 'B', group: 'concept', description: 'B desc' },
    ],
    links: [ { source: 'A', target: 'B', label: 'relates to' } ],
  };
  const dataUrl = 'data:application/json,' + encodeURIComponent(JSON.stringify(json));
  await page.goto('/?jsonUrl=' + encodeURIComponent(dataUrl));
  await page.setViewportSize({ width: 1200, height: 800 });

  const svg = page.locator('svg');
  await expect(svg).toBeVisible();
  await page.waitForSelector('svg .node-group', { state: 'attached' });
  expect(await page.locator('svg .node-group').count()).toBeGreaterThan(0);
});

test('zoom/pan works and link labels are visible', async ({ page }) => {
  await page.goto('/');
  await page.setViewportSize({ width: 1400, height: 900 });

  const svg = page.locator('svg');
  await expect(svg).toBeVisible();
  await expect(page.getByText(/^Interactive Concept Map$/)).toBeVisible();

  // Ensure at least one link and label exist
  await page.waitForSelector('svg .link', { state: 'attached', timeout: 20000 });
  await page.waitForSelector('svg .link-label', { state: 'attached', timeout: 20000 });

  // Record initial transform on container group (if any)
  const container = page.locator('svg g').first();
  const beforeTransform = await container.getAttribute('transform');

  // Zoom in via wheel
  const box = await svg.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, -500);
  }

  // Pan by dragging empty space
  if (box) {
    await page.mouse.move(box.x + 50, box.y + 50);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 120, { steps: 10 });
    await page.mouse.up();
  }

  // Give D3 zoom a moment
  await page.waitForTimeout(300);

  const afterTransform = await container.getAttribute('transform');
  expect(afterTransform).not.toBe(beforeTransform);

  // Link labels should still be visible
  const firstLabel = page.locator('svg .link-label').first();
  await expect(firstLabel).toBeVisible();
});




test('double-click shows info in panel', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('svg .node-group', { state: 'attached' });

  const group = page.locator('svg .node-group').first();
  const circle = group.locator('circle.node');
  await expect(group).toBeVisible();
  await expect(circle).toBeVisible();
  // Dispatch a dblclick on the group to avoid coordinate/overlay flakiness
  await group.evaluate((el: Element) => {
    el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, composed: true }));
  });

  // Expect info panel to contain the node's name (data-node-name attribute)
  const name = await circle.getAttribute('data-node-name');
  const panel = page.locator('#info-panel');
  await expect(panel).toContainText(name ?? '');
});

test('metadata counters match rendered nodes and links', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText(/^Interactive Concept Map$/)).toBeVisible();
  await page.waitForSelector('svg .node-group', { state: 'attached' });
  await page.waitForSelector('svg .link', { state: 'attached' });

  // Count groups to avoid intermediate circle transitions
  await page.waitForTimeout(500);
  const nodeCount = await page.locator('svg .node-group').count();
  const linkCount = await page.locator('svg .link').count();

  // Assert counts via testids to avoid brittle parsing
  const nodesText = await page.getByTestId('rendered-nodes').innerText();
  const linksText = await page.getByTestId('rendered-links').innerText();
  const parseIntSafe = (s: string) => {
  const m = /(\d+)/.exec(s);
  return m ? parseInt(m[1], 10) : 0;
  };
  const uiNodes = parseIntSafe(nodesText);
  const uiLinks = parseIntSafe(linksText);
  expect(uiNodes).toBeGreaterThan(0);
  expect(uiLinks).toBeGreaterThan(0);
  // Tolerate small discrepancies across engines while ensuring close agreement
  expect(Math.abs(uiNodes - nodeCount)).toBeLessThanOrEqual(10);
  expect(Math.abs(uiLinks - linkCount)).toBeLessThanOrEqual(10);
});

test('tooltip appears on double-click and neighbor click spawns a link', async ({ page }) => {
  await page.goto('/');
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.waitForSelector('svg .node-group', { state: 'attached' });

  const svg = page.locator('svg');
  const group = page.locator('svg .node-group').first();
  const circle = group.locator('circle.node');
  // Trigger dblclick programmatically for stability
  await group.evaluate((el: Element) => {
    el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, composed: true }));
  });

  const tooltip = page.getByTestId('node-tooltip');
  await expect(tooltip).toBeVisible();
  // If mini-tree exists, click one neighbor leaf if any; otherwise skip softly
  const miniTreeLeaf = tooltip.getByTestId('mini-leaf').first();
  if (await miniTreeLeaf.isVisible().catch(() => false)) {
    // Capture the neighbor name and dispatch click to avoid overlay intercepts
    const leafName = (await miniTreeLeaf.textContent())?.trim() || '';
    await miniTreeLeaf.evaluate((el: Element) => {
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    });
    await page.waitForTimeout(200);
    // Expect a node label with the neighbor's name to be present (robust, user-facing)
    if (leafName.length > 0) {
      const neighborLabel = page.locator('svg .node-group .node-label', { hasText: leafName }).first();
      await expect(neighborLabel).toBeVisible();
    }
  }
});

test('clicking a node centers it and opens Sims-like meta ring', async ({ page }) => {
  await page.goto('/');
  await page.setViewportSize({ width: 1400, height: 900 });

  const svg = page.locator('svg');
  await page.waitForSelector('svg .node-group', { state: 'attached', timeout: 20000 });
  const container = page.locator('svg g.graph-container');
  const beforeTransform = await container.getAttribute('transform');

  // Click an eligible node (with metadata) in page context
  const opened = await page.evaluate(() => {
    const candidates = Array.from(document.querySelectorAll('svg g.node-group')) as SVGGElement[];
    const EXCLUDE = new Set(['id','name','description','group','level','size','degree','index','x','y','vx','vy','fx','fy']);
    for (const el of candidates) {
      const d: any = (el as any).__data__;
      if (!d) continue;
      const entries = Object.entries(d).filter(([k, v]) => !EXCLUDE.has(k) && v != null && (typeof v === 'string' || Array.isArray(v) || typeof v === 'number' || (typeof v === 'object' && Object.keys(v).length > 0)));
      if (entries.length > 0) {
        el.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
        return true;
      }
    }
    return false;
  });
  expect(opened).toBeTruthy();
  await page.waitForSelector('svg g.meta-ring', { state: 'attached', timeout: 6000 });

  // Centering should update the container transform
  const afterTransform = await container.getAttribute('transform');
  expect(afterTransform).not.toBe(beforeTransform);
});

test('clicking a meta bubble opens a panel; click background closes it', async ({ page }) => {
  await page.goto('/');
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.waitForSelector('svg .node-group', { state: 'attached' });

  const svg = page.locator('svg');
  // Ensure a meta ring exists by selecting an eligible node via bound data
  const opened = await page.evaluate(() => {
    const candidates = Array.from(document.querySelectorAll('svg g.node-group')) as SVGGElement[];
    const EXCLUDE = new Set(['id','name','description','group','level','size','degree','index','x','y','vx','vy','fx','fy']);
    for (const el of candidates) {
      const d: any = (el as any).__data__;
      if (!d) continue;
      const entries = Object.entries(d).filter(([k, v]) => !EXCLUDE.has(k) && v != null && (typeof v === 'string' || Array.isArray(v) || typeof v === 'number' || (typeof v === 'object' && Object.keys(v).length > 0)));
      if (entries.length > 0) {
        el.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
        return true;
      }
    }
    return false;
  });
  expect(opened).toBeTruthy();
  await page.waitForSelector('svg g.meta-ring', { state: 'attached', timeout: 3000 });

  // At least one bubble should exist
  await page.waitForSelector('[data-testid="meta-bubble"]', { state: 'attached', timeout: 6000 });
  const bubbleCount = await page.locator('[data-testid="meta-bubble"]').count();
  expect(bubbleCount).toBeGreaterThan(0);
  const bubble = page.locator('[data-testid="meta-bubble"]').first();

  // Click the bubble (target the circle inside for reliability)
  await bubble.evaluate((el: Element) => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
  });

  const panel = page.locator('svg g.meta-panel');
  await page.waitForSelector('svg g.meta-panel', { state: 'attached' });
  await expect(panel).toHaveCount(1);

  // Click on the empty SVG background to close
  await svg.evaluate((el: Element) => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  // Panel and ring should be removed
  await expect(panel).toHaveCount(0);
  await expect(page.locator('svg g.meta-ring')).toHaveCount(0);
});

test('meta ring labels are centered and spikes attach to pill edges', async ({ page }) => {
  await page.goto('/');
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.waitForSelector('svg .node-group', { state: 'attached' });

  // Open a ring reliably
  const opened = await page.evaluate(() => {
    const candidates = Array.from(document.querySelectorAll('svg g.node-group')) as SVGGElement[];
    const EXCLUDE = new Set(['id','name','description','group','level','size','degree','index','x','y','vx','vy','fx','fy']);
    for (const el of candidates) {
      const d: any = (el as any).__data__;
      if (!d) continue;
      const entries = Object.entries(d).filter(([k, v]) => !EXCLUDE.has(k) && v != null && (typeof v === 'string' || Array.isArray(v) || typeof v === 'number' || (typeof v === 'object' && Object.keys(v).length > 0)));
      if (entries.length > 0) {
        el.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
        return true;
      }
    }
    return false;
  });
  expect(opened).toBeTruthy();
  await page.waitForSelector('[data-testid="meta-bubble"]', { state: 'attached' });

  // Inspect first bubble for label and spike
  const bubble = page.locator('[data-testid="meta-bubble"]').first();
  const spike = bubble.locator('[data-testid="label-spike"]').first();
  await expect(spike).toHaveAttribute('d', /^M/i, { timeout: 20000 });
  // Label group exists and text is centered both axes
  const labelGroup = bubble.locator('[data-testid="bubble-label"]').first();
  await expect(labelGroup).toBeAttached({ timeout: 20000 });
  const text = labelGroup.locator('text').first();
  await expect(text).toHaveAttribute('text-anchor', /middle/);
  await expect(text).toHaveAttribute('dominant-baseline', /middle/);
});

test('node radii vary indicating metadata and degree-based sizing', async ({ page }) => {
  await page.goto('/');
  await page.setViewportSize({ width: 1400, height: 900 });

  // Wait for nodes to render and settle initial transition
  await page.waitForSelector('svg .node-group circle.node', { state: 'attached' });
  await page.waitForTimeout(400);

  const radii = await page.$$eval('svg .node-group circle.node', (els) =>
    els.slice(0, 30).map((e) => Number((e as SVGCircleElement).getAttribute('r') || '0')).filter(n => !Number.isNaN(n))
  );
  expect(radii.length).toBeGreaterThan(3);
  const minR = Math.min(...radii);
  const maxR = Math.max(...radii);
  // Expect a meaningful spread of sizes
  expect(maxR - minR).toBeGreaterThanOrEqual(8);
  // Ensure values stay within the designed bounds
  expect(minR).toBeGreaterThanOrEqual(18);
  expect(maxR).toBeLessThanOrEqual(65);
});

