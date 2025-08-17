import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for the Concept Map visualization.
 * 
 * This class encapsulates all interactions with the concept map UI,
 * providing a clean API for test scenarios while following the DRY principle.
 * 
 * @author Generated following CSCD211 standards
 * @version 1.0.0
 */
export class ConceptMapPage {
  private readonly page: Page;
  private readonly defaultViewport = { width: 1400, height: 900 };

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to the concept map application.
   * @param options - Navigation options including viewport size and JSON URL override
   */
  async goto(options: {
    jsonUrl?: string;
    viewport?: { width: number; height: number };
  } = {}): Promise<void> {
    const { jsonUrl, viewport = this.defaultViewport } = options;
    
    await this.page.setViewportSize(viewport);
    
    let url = '/';
    if (jsonUrl) {
      url += `?jsonUrl=${encodeURIComponent(jsonUrl)}`;
    }
    
    await this.page.goto(url);
  }

  /**
   * Wait for the concept map to fully load and render.
   */
  async waitForLoad(): Promise<void> {
    await expect(this.svg).toBeVisible();
    await expect(this.page.getByText(/^Interactive Concept Map$/)).toBeVisible();
    await expect(this.page.getByText(/Version:/)).toBeVisible();
    await this.page.waitForSelector('svg .node', { state: 'attached', timeout: 20000 });
    // Small settle for D3 initial positioning
    await this.page.waitForTimeout(150);
  }

  /**
   * Get the main SVG element.
   */
  get svg(): Locator {
    return this.page.locator('svg').first();
  }

  /**
   * Get all node groups.
   */
  get nodeGroups(): Locator {
    return this.page.locator('svg .node-group');
  }

  /**
   * Get all node circles.
   */
  get nodeCircles(): Locator {
    return this.page.locator('svg .node-group circle.node');
  }

  /**
   * Get all links.
   */
  get links(): Locator {
    return this.page.locator('svg .link');
  }

  /**
   * Get all link labels.
   */
  get linkLabels(): Locator {
    return this.page.locator('svg .link-label');
  }

  /**
   * Get the graph container group (for transforms).
   */
  get graphContainer(): Locator {
    return this.page.locator('svg g.graph-container');
  }

  /**
   * Get the info panel.
   */
  get infoPanel(): Locator {
    return this.page.locator('#info-panel');
  }

  /**
   * Get the tooltip.
   */
  get tooltip(): Locator {
    return this.page.getByTestId('node-tooltip');
  }

  /**
   * Get meta ring.
   */
  get metaRing(): Locator {
    return this.page.locator('svg g.meta-ring');
  }

  /**
   * Get meta bubbles.
   */
  get metaBubbles(): Locator {
    return this.page.locator('[data-testid="meta-bubble"]');
  }

  /**
   * Get meta panel.
   */
  get metaPanel(): Locator {
    return this.page.locator('svg g.meta-panel');
  }

  /**
   * Double-click the first node to trigger info panel.
   */
  async doubleClickFirstNode(): Promise<void> {
    const firstGroup = this.nodeGroups.first();
    await expect(firstGroup).toBeVisible();
    
    await firstGroup.evaluate((el: Element) => {
      el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, composed: true }));
    });
  }

  /**
   * Click a node with metadata to trigger meta ring.
   */
  async clickNodeWithMetadata(): Promise<boolean> {
    return await this.page.evaluate(() => {
      const candidates = Array.from(document.querySelectorAll('svg g.node-group')) as SVGGElement[];
      const EXCLUDE = new Set(['id','name','description','group','level','size','degree','index','x','y','vx','vy','fx','fy']);
      
      for (const el of candidates) {
        const d: any = (el as any).__data__;
        if (!d) continue;
        const entries = Object.entries(d).filter(([k, v]) => 
          !EXCLUDE.has(k) && v != null && 
          (typeof v === 'string' || Array.isArray(v) || typeof v === 'number' || 
           (typeof v === 'object' && Object.keys(v).length > 0))
        );
        if (entries.length > 0) {
          el.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
          return true;
        }
      }
      return false;
    });
  }

  /**
   * Perform zoom operation via mouse wheel.
   */
  async zoomIn(): Promise<void> {
    const box = await this.svg.boundingBox();
    if (box) {
      await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await this.page.mouse.wheel(0, -500);
    }
  }

  /**
   * Perform pan operation via drag.
   */
  async pan(): Promise<void> {
    const box = await this.svg.boundingBox();
    if (box) {
      await this.page.mouse.move(box.x + 50, box.y + 50);
      await this.page.mouse.down();
      await this.page.mouse.move(box.x + 200, box.y + 120, { steps: 10 });
      await this.page.mouse.up();
    }
  }

  /**
   * Click on the SVG background to close panels.
   */
  async clickBackground(): Promise<void> {
    await this.svg.evaluate((el: Element) => {
      el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
  }

  /**
   * Get the current transform of the graph container.
   */
  async getGraphTransform(): Promise<string | null> {
    return await this.graphContainer.getAttribute('transform');
  }

  /**
   * Get node and link counts from the UI.
   */
  async getUICounts(): Promise<{ nodes: number; links: number }> {
    const nodesText = await this.page.getByTestId('rendered-nodes').innerText();
    const linksText = await this.page.getByTestId('rendered-links').innerText();
    
    const parseIntSafe = (s: string) => {
      const m = /(\d+)/.exec(s);
      return m ? parseInt(m[1], 10) : 0;
    };
    
    return {
      nodes: parseIntSafe(nodesText),
      links: parseIntSafe(linksText)
    };
  }

  /**
   * Get rendered node and link counts from DOM.
   */
  async getRenderedCounts(): Promise<{ nodes: number; links: number }> {
    // Wait for elements to settle
    await this.page.waitForTimeout(500);
    
    return {
      nodes: await this.nodeGroups.count(),
      links: await this.links.count()
    };
  }

  /**
   * Validate that a number is within expected bounds.
   * @param value The number to validate
   * @param min Minimum allowed value
   * @param max Maximum allowed value
   * @returns True if value is within bounds
   */
  async getNodeRadii(limit: number = 30): Promise<number[]> {
    await this.page.waitForTimeout(400); // Let transitions settle
    
    return await this.page.$$eval('svg .node-group circle.node', (els, limit) =>
      els.slice(0, limit)
        .map((e) => Number((e as SVGCircleElement).getAttribute('r') || '0'))
        .filter(n => !Number.isNaN(n))
    , limit);
  }

  /**
   * Wait for a specific selector to be attached.
   */
  async waitForSelector(selector: string, options: { state?: 'attached' | 'detached' | 'visible' | 'hidden'; timeout?: number } = {}): Promise<void> {
    await this.page.waitForSelector(selector, options);
  }

  /**
   * Wait for a specified timeout.
   */
  async waitForTimeout(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms);
  }

  /**
   * Evaluate JavaScript in the page context.
   */
  async evaluate<T>(fn: () => T | Promise<T>): Promise<T> {
    return await this.page.evaluate(fn);
  }
}
