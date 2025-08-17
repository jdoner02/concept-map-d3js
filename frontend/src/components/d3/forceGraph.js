import * as d3 from 'd3';

// Accept a node object; use multi-factor sizing based on educational metadata
export function computeNodeRadius(node) {
  const MIN = 20;
  const MAX = 60;
  if (!node) return 25;

  // Base radius from connection degree
  const deg = typeof node.degree === 'number' ? node.degree : 0;
  let radius = MIN + 4 * Math.sqrt(Math.max(0, deg));

  // Educational metadata weighting factors
  const cs = typeof node.cognitive_scaffolding === 'string' ? node.cognitive_scaffolding.toLowerCase() : '';
  const pf = typeof node.pedagogical_focus === 'string' ? node.pedagogical_focus.toLowerCase() : '';
  const scaffoldingWeight = cs === 'high' ? 1.4 : cs === 'medium' ? 1.2 : 1.0;
  const focusWeight = pf === 'theoretical foundation' ? 1.3 : pf === 'practical application' ? 1.1 : 1.0;

  // Apply weights and constrain to bounds
  radius *= scaffoldingWeight * focusWeight;
  return Math.max(MIN, Math.min(MAX, radius));
}

export function createSimulation(nodes, links, { width, height }) {
  // Resolve an ID string for any node-like value
  const getNodeId = (d) => (d && typeof d === 'object' ? d.id : String(d));
  const n = Array.isArray(nodes) ? nodes : [];
  const l = Array.isArray(links) ? links : [];
  const w = Number.isFinite(width) && width > 0 ? width : 1200;
  const h = Number.isFinite(height) && height > 0 ? height : 800;
  return d3.forceSimulation(n)
    .velocityDecay(0.35)
    .force('link', d3.forceLink(l)
      .id(getNodeId)
      .distance(link => (typeof link?.distance === 'number' ? link.distance : 150))
      .strength(0.22))
    .force('charge', d3.forceManyBody().strength(-400).distanceMax(600))
    .force('center', d3.forceCenter(w / 2, h / 2))
    .force('collision', d3.forceCollide().radius(d => computeNodeRadius(d) + 8));
}

export function addArrowhead(defs) {
  if (!defs || typeof defs.select !== 'function') return;
  const existing = defs.select('#arrowhead');
  if (!existing.empty()) return existing;
  const m = defs.append('marker')
    .attr('id', 'arrowhead')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 28)
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto');
  m.append('path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#666');
  return m;
}
