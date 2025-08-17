import * as d3 from 'd3';

// Helpers to keep computeNodeRadius simple (lint: cognitive complexity)
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
function baseRadius(node, MIN) {
  const size = Number(node?.size);
  if (Number.isFinite(size) && size > 0) return MIN + 6 * Math.sqrt(size);
  const deg = typeof node?.degree === 'number' ? node.degree : 0;
  return MIN + 4 * Math.sqrt(Math.max(0, deg));
}
function metadataWeight(node) {
  const cs = typeof node?.cognitive_scaffolding === 'string' ? node.cognitive_scaffolding.toLowerCase() : '';
  const pf = typeof node?.pedagogical_focus === 'string' ? node.pedagogical_focus.toLowerCase() : '';
  let scaffoldingWeight = 1.0;
  if (cs === 'high') scaffoldingWeight = 1.4; else if (cs === 'medium') scaffoldingWeight = 1.2;
  let focusWeight = 1.0;
  if (pf === 'theoretical foundation') focusWeight = 1.3; else if (pf === 'practical application') focusWeight = 1.1;
  return scaffoldingWeight * focusWeight;
}
function levelFactor(level) {
  const lv = Number(level);
  if (!Number.isFinite(lv) || lv < 0) return 1;
  return Math.max(0.6, 1 - 0.1 * Math.min(5, lv));
}

// Accept a node object; use multi-factor sizing based on educational metadata
export function computeNodeRadius(node) {
  const MIN = 20;
  const MAX = 60;
  if (!node) return 25;

  // Respect precomputed radius if provided by upstream (e.g., from dataset normalization)
  if (Number.isFinite(node._radius)) {
    return clamp(Number(node._radius), MIN, MAX);
  }

  // Prefer explicit JSON-provided size when available
  let radius = baseRadius(node, MIN);

  // Educational metadata weighting factors
  radius *= metadataWeight(node);

  // Decomposition clarity: deeper levels render slightly smaller than roots
  radius *= levelFactor(node.level);

  return clamp(radius, MIN, MAX);
}

export function createSimulation(nodes, links, { width, height }) {
  // Resolve an ID string for any node-like value
  const getNodeId = (d) => (d && typeof d === 'object' ? d.id : String(d));
  const n = Array.isArray(nodes) ? nodes : [];
  const l = Array.isArray(links) ? links : [];
  const w = Number.isFinite(width) && width > 0 ? width : 1200;
  const h = Number.isFinite(height) && height > 0 ? height : 800;
  const sim = d3.forceSimulation(n)
    .velocityDecay(0.25)
    .force('link', d3.forceLink(l)
      .id(getNodeId)
      .distance(link => {
        if (typeof link?.distance === 'number') return link.distance;
        // Longer distances for cross-level links to encourage spreading
        const srcLevel = Number(link.source?.level ?? 0);
        const tgtLevel = Number(link.target?.level ?? 0);
        const levelDiff = Math.abs(srcLevel - tgtLevel);
        return 150 + (levelDiff * 50); // Base 150, +50 per level difference
      })
      .strength(0.22))
    .force('charge', d3.forceManyBody().strength(-380).distanceMax(800))
    .force('center', d3.forceCenter(w / 2, h / 2))
    .force('collision', d3.forceCollide().radius(d => computeNodeRadius(d) + 8));

  // Horizontal positioning by level for tree straightening
  sim.force('x', d3.forceX()
    .x(d => {
      const level = Number(d?.level ?? 0);
      const spacing = Math.min(w * 0.15, 120); // Adaptive spacing based on width
      return w / 2 + (level * spacing) - (spacing * 2); // Offset so level 0 is left of center
    })
    .strength(0.08)); // Gentle pull to avoid overriding organic layout

  // Vertical clustering by sibling level
  sim.force('y', d3.forceY()
    .y(d => {
      const level = Number(d?.level ?? 0);
      return h / 2 + ((level % 3) - 1) * 60; // Slight vertical offset by level modulo
    })
    .strength(0.04)); // Very gentle vertical organization

  // Soft diffusion: nudge unconnected nodes away within a local radius
  sim.force('diffusion', diffusionForce(l, { radius: 260, strength: 0.02 }));
  // Gentle radial jitter to keep floaty motion alive when alpha is low
  sim.force('jitter', () => {
    const a = Math.max(0.001, sim.alpha());
    const k = 0.02 * a;
    for (const d of n) {
      const th = Math.random() * Math.PI * 2;
      d.vx = (d.vx || 0) + Math.cos(th) * k;
      d.vy = (d.vy || 0) + Math.sin(th) * k;
    }
  });
  return sim;
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

// Custom force: diffusion away from non-neighbors within a neighborhood radius
export function diffusionForce(links, opts = {}) {
  const radius = Number.isFinite(opts.radius) ? opts.radius : 240;
  const strength = Number.isFinite(opts.strength) ? opts.strength : 0.02;
  let nodes = [];
  let neighborsById = new Map();
  const makeKey = (v) => (v && typeof v === 'object' ? v.id : String(v));
  function rebuildNeighbors(ls) {
    neighborsById = new Map();
    (ls || []).forEach(l => {
      const s = makeKey(l.source);
      const t = makeKey(l.target);
      if (!neighborsById.has(s)) neighborsById.set(s, new Set());
      if (!neighborsById.has(t)) neighborsById.set(t, new Set());
      neighborsById.get(s).add(t);
      neighborsById.get(t).add(s);
    });
  }
  rebuildNeighbors(links);
  function force(alpha) {
    const r2 = radius * radius;
    const k = strength * alpha; // scale with alpha for smoothness
    const N = nodes.length;
    for (let i = 0; i < N; i++) {
      const a = nodes[i];
      const ax = a.x ?? 0, ay = a.y ?? 0;
      const neigh = neighborsById.get(a.id) || new Set();
      let fx = 0, fy = 0;
      for (let j = 0; j < N; j++) {
        if (i === j) continue;
        const b = nodes[j];
        if (neigh.has(b.id)) continue; // ignore neighbors (let link/collision handle them)
        const dx = ax - (b.x ?? 0);
        const dy = ay - (b.y ?? 0);
        const d2 = dx*dx + dy*dy;
        if (d2 > 1e-4 && d2 < r2) {
          const d = Math.sqrt(d2);
          const w = 1 / d; // inverse distance falloff
          fx += dx * w;
          fy += dy * w;
        }
      }
      a.vx = (a.vx || 0) + fx * k;
      a.vy = (a.vy || 0) + fy * k;
    }
  }
  force.initialize = function(initNodes) {
    nodes = initNodes || [];
  };
  force.updateLinks = function(ls) { rebuildNeighbors(ls); };
  return force;
}
