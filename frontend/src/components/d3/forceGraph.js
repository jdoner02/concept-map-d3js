import * as d3 from 'd3';

// Helpers to keep computeNodeRadius simple (lint: cognitive complexity)
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
function baseRadius(node, MIN) {
  const size = Number(node?.size);
  if (Number.isFinite(size) && size > 0) {
    // Much smaller scaling factor for JSON size values (300 -> ~7 range)
    return MIN + Math.sqrt(size) * 0.8;
  }
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
  const MIN = 8;  // Smaller minimum radius
  const MAX = 35; // Smaller maximum radius
  if (!node) return 15;

  // Respect precomputed radius if provided by upstream (e.g., from dataset normalization)
  if (Number.isFinite(node._radius)) {
    return clamp(Number(node._radius), MIN, MAX);
  }

  // Prefer explicit JSON-provided size when available
  let radius = baseRadius(node, MIN);

  // Educational metadata weighting factors
  radius *= metadataWeight(node);
  radius *= levelFactor(node?.level);

  return clamp(radius, MIN, MAX);
}

// Small utility force to pull one specific node toward a target point
function createAnchorForce(anchorId, targetX, targetY, strength = 0.15) {
  let nodes = [];
  let byId = new Map();
  function force(alpha) {
    if (!nodes.length || !anchorId) return;
    const n = byId.get(anchorId);
    if (!n) return;
    const k = strength * alpha;
    const dx = (targetX - (n.x || 0));
    const dy = (targetY - (n.y || 0));
    n.vx = (n.vx || 0) + dx * k;
    n.vy = (n.vy || 0) + dy * k;
  }
  force.initialize = function(initNodes) {
    nodes = initNodes || [];
    byId = new Map(nodes.map(nd => [String(nd.id), nd]));
  };
  return force;
}

const getNodeId = (d) => (d && typeof d === 'object' ? String(d.id) : String(d));

export function createSimulation(nodes, links, opts = {}) {
  const n = Array.isArray(nodes) ? nodes : [];
  const l = Array.isArray(links) ? links : [];
  const W = Number.isFinite(opts.width) && opts.width > 0 ? opts.width : 2000;
  const H = Number.isFinite(opts.height) && opts.height > 0 ? opts.height : 1200;
  const anchorId = opts.anchorId ? String(opts.anchorId) : null;
  const anchorStrength = Number.isFinite(opts.anchorStrength) ? opts.anchorStrength : 0.15;

  const sim = d3.forceSimulation(n)
    .velocityDecay(0.25)
    .force('link', d3.forceLink(l)
      .id(getNodeId)
      .distance(link => {
        const sLvl = Number(link?.source?.level ?? 0);
        const tLvl = Number(link?.target?.level ?? 0);
        const levelDiff = Math.abs(sLvl - tLvl);
        return 200 + levelDiff * 80;
      })
      .strength(0.3))
    .force('charge', d3.forceManyBody().strength(-1200).distanceMax(2000))
    .force('collision', d3.forceCollide().radius(d => computeNodeRadius(d) + 15).strength(0.9));

  // Level-based horizontal positioning centered across the universe width
  const levels = n.map(d => Number.isFinite(+d?.level) ? +d.level : 0);
  const minLevel = levels.length ? Math.min(...levels) : 0;
  const maxLevel = levels.length ? Math.max(...levels) : 0;
  const spacing = 240;
  const totalWidth = Math.max(spacing, (maxLevel - minLevel) * spacing);
  const startX = (W - totalWidth) / 2;
  sim.force('x', d3.forceX()
    .x(d => {
      const lvl = Number(d?.level ?? 0);
      const idx = Math.max(0, lvl - minLevel);
      return startX + idx * spacing;
    })
    .strength(0.2));

  // Organic vertical distribution centered around universe middle
  sim.force('y', d3.forceY()
    .y(d => {
      const nodeId = String(d?.id || '');
      let hash = 0;
      for (let i = 0; i < nodeId.length; i++) {
        hash = ((hash << 5) - hash + nodeId.charCodeAt(i)) | 0;
      }
      const verticalOffset = ((Math.abs(hash) % 400) - 200); // ±200
      return (H / 2) + verticalOffset;
    })
    .strength(0.04));

  // Enhanced diffusion: push away non-neighbors within a radius
  sim.force('diffusion', diffusionForce(l, { radius: 320, strength: 0.1 }));

  // Gentle Brownian motion for life-like movement
  sim.force('brownian', () => {
    const a = Math.max(0.001, sim.alpha());
    const k = 0.015 * a;
    for (const d of n) {
      const th = Math.random() * Math.PI * 2;
      d.vx = (d.vx || 0) + Math.cos(th) * k;
      d.vy = (d.vy || 0) + Math.sin(th) * k;
    }
  });

  // Optional: anchor one node toward the universe center
  if (anchorId) {
    sim.force('anchor', createAnchorForce(anchorId, W / 2, H / 2, anchorStrength));
  }

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
