/**
 * Test fixtures and data for concept map E2E tests.
 * 
 * Provides reusable test data and utility functions following DRY principle
 * and CSCD211 defensive programming standards.
 * 
 * @author Generated following CSCD211 standards
 * @version 1.0.0
 */

/**
 * Minimal valid concept map JSON for testing overrides.
 */
export const MINIMAL_CONCEPT_MAP = {
  metadata: { 
    version: 'test', 
    total_nodes: 2, 
    total_links: 1 
  },
  nodes: [
    { id: 'A', name: 'Node A', group: 'concept', description: 'Test node A' },
    { id: 'B', name: 'Node B', group: 'concept', description: 'Test node B' },
  ],
  links: [
    { source: 'A', target: 'B', label: 'relates to' }
  ],
};

/**
 * Create a data URL from JSON object.
 * @param json The JSON object to encode
 * @returns Data URL string
 */
export function createDataUrl(json: object): string {
  return 'data:application/json,' + encodeURIComponent(JSON.stringify(json));
}

/**
 * Default viewport sizes for different test scenarios.
 */
export const VIEWPORTS = {
  DEFAULT: { width: 1400, height: 900 },
  COMPACT: { width: 1200, height: 800 },
  LARGE: { width: 1600, height: 1000 },
} as const;

/**
 * Test timeouts for various operations.
 */
export const TIMEOUTS = {
  ELEMENT_ATTACH: 20000,
  META_RING: 6000,
  SETTLE: 150,
  TRANSITION: 400,
} as const;

/**
 * Expected node radius bounds based on the application's design.
 */
export const NODE_RADIUS_BOUNDS = {
  MIN: 18,
  MAX: 65,
  MIN_SPREAD: 8, // Minimum difference between smallest and largest nodes
} as const;

/**
 * CSS selectors commonly used in tests.
 */
export const SELECTORS = {
  SVG: 'svg',
  NODE_GROUP: 'svg .node-group',
  NODE_CIRCLE: 'svg .node-group circle.node',
  LINK: 'svg .link',
  LINK_LABEL: 'svg .link-label',
  GRAPH_CONTAINER: 'svg g.graph-container',
  META_RING: 'svg g.meta-ring',
  META_PANEL: 'svg g.meta-panel',
} as const;

/**
 * Test IDs used for reliable element selection.
 */
export const TEST_IDS = {
  NODE_TOOLTIP: 'node-tooltip',
  META_BUBBLE: 'meta-bubble',
  BUBBLE_LABEL: 'bubble-label',
  LABEL_SPIKE: 'label-spike',
  MINI_LEAF: 'mini-leaf',
  RENDERED_NODES: 'rendered-nodes',
  RENDERED_LINKS: 'rendered-links',
} as const;

/**
 * Regular expressions for text matching.
 */
export const PATTERNS = {
  INTERACTIVE_CONCEPT_MAP: /^Interactive Concept Map$/,
  VERSION: /Version:/,
  PATH_ATTRIBUTE: /^M/i,
} as const;
