import React, { useRef, useState, useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import { createSimulation, addArrowhead, computeNodeRadius } from './d3/forceGraph';

// Color override constants (module-scoped)
const GROUP_COLOR_OVERRIDES = {
  concept: '#009E73', // Okabe & Ito green
};
const RELATION_COLOR_OVERRIDES = {
  // add explicit relation type -> color overrides here if needed
};

// Simple helper to recognise when a string is an HTTP(S) URL.  We keep
// the check intentionally small and synchronous so it can be reused in
// both the SVG (D3) and React portions of this component without pulling
// in heavier URL parsing utilities.
const isValidHttpUrl = (str) => /^https?:\/\//i.test(String(str).trim());

// ---------------------------------------------------------------------------
// Minimal Markdown renderer
// ---------------------------------------------------------------------------
// Tooltips in the graph accept free‑form text.  To make that text expressive
// without pulling in a large third‑party library we implement a tiny subset of
// Markdown ourselves.  The function below understands a handful of common
// patterns—bold, italics, inline code, links and basic bullet lists.  Every
// step starts by escaping raw HTML so user content cannot inject scripts.
// The goal is not to be perfectly spec‑compliant but to provide just enough
// structure to keep educational snippets readable.
const escapeHtml = (str) => String(str)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

function markdownToHtml(md) {
  let html = escapeHtml(md);

  // Strong emphasis: **bold**
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Emphasis: *italic*
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Inline code: `code`
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Hyperlinks: [label](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Lists: lines starting with - or * become <ul><li>...</li></ul>
  const lines = html.split(/\n/);
  const out = [];
  let inList = false;
  for (const line of lines) {
    const m = line.match(/^\s*[-*]\s+(.*)/);
    if (m) {
      if (!inList) { out.push('<ul>'); inList = true; }
      out.push(`<li>${m[1]}</li>`);
    } else {
      if (inList) { out.push('</ul>'); inList = false; }
      out.push(line);
    }
  }
  if (inList) out.push('</ul>');

  // Paragraphs and line breaks. Two newlines start a new paragraph; single
  // newlines translate to <br/> so stacked thoughts remain readable.
  html = out.join('\n');
  html = html.replace(/\n{2,}/g, '</p><p>');
  html = `<p>${html.replace(/\n/g, '<br/>')}</p>`;
  return html;
}

// React helper component.  We memoise the conversion so re-renders are cheap.
// Consumers can pass inline styles to shape the surrounding container (useful
// for the line‑clamp behaviour in the detailed tooltip).
const Markdown = ({ text, style }) => {
  const html = useMemo(() => markdownToHtml(text || ''), [text]);
  return <div style={style} dangerouslySetInnerHTML={{ __html: html }} />;
};

const ConceptMapVisualization = () => {
  const svgRef = useRef(null);
  const simRef = useRef(null); // keep simulation across renders without touching DOM properties
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [endpointTried, setEndpointTried] = useState('');
  const [groups, setGroups] = useState([]); // all unique group values
  const [selectedGroups, setSelectedGroups] = useState(new Set()); // selected group filters
  const [renderCounts, setRenderCounts] = useState({ nodes: 0, links: 0 });
  const [augmentedNodes, setAugmentedNodes] = useState([]); // ephemeral nodes added via tooltip actions
  const [augmentedLinks, setAugmentedLinks] = useState([]);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, node: null });
  const tooltipDivRef = useRef(null);
  // Whether the tooltip's description is fully revealed.  Starting collapsed
  // keeps the popup compact on small screens but still lets curious users
  // explore more detail on demand.
  const [descExpanded, setDescExpanded] = useState(false);
  // Quick search + tour
  const [search, setSearch] = useState('');
  const idleTourRef = useRef({ timer: null, active: false });
  // Tooltip for link details on hover
  const [linkTooltip, setLinkTooltip] = useState({ visible: false, x: 0, y: 0, key: null, data: null });
  const linkTooltipDivRef = useRef(null);
  // Lightweight tooltip for simple hover info (name + description)
  const [hoverInfo, setHoverInfo] = useState({ visible: false, x: 0, y: 0, node: null });
  const zoomRef = useRef(d3.zoomIdentity);
  // Persist the zoom behavior instance so we can programmatically transform later
  const zoomBehaviorRef = useRef(null);
  // Actual rendered SVG size for precise centering and bounds
  const [viewSize, setViewSize] = useState({ width: 1200, height: 800 });
  // Accessibility live region for screen readers
  const liveStatusRef = useRef(null);
  // Click-activated Sims-like metadata UI
  const activeMetaRef = useRef(null); // { ownerId, bubbles: [...], expandedKey?: string }
  const focusedRef = useRef(null); // { id }
  const draggingRef = useRef(false);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  // Enum-like color overrides to enforce specific mappings are defined at module scope

  // ------------------------------------------------------------------------
  // Dataset management
  const [datasets, setDatasets] = useState([]);          // list of available datasets
  const [selectedDataset, setSelectedDataset] = useState(null); // chosen dataset filename

  /**
   * Add pedagogical scaffolding to each node.  Education research shows that
   * learners progress faster when goals are explicit, misconceptions are
   * surfaced, and assessment criteria are clear (Hattie 2009; Chi 2005;
   * Sadler 1989).  We keep the enrichment lightweight so it can double as a
   * rubric: every string is an atomic check‑point the instructor can tick off.
   */
  const enrichNode = (n) => {
    const concept = n.name || n.id;

    // Learning objectives communicate the "why" and "how" of a concept.
    // Providing defaults ensures even sparse datasets remain instructional.
    if (!n.learning_objectives) {
      n.learning_objectives = [
        `Explain ${concept} in their own words`,
        `Apply ${concept} in a small program`
      ];
    }

    // Misconceptions are powerful diagnostic tools.  Addressing them directly
    // helps students replace incorrect mental models with accurate ones.
    if (!n.common_misconceptions) {
      n.common_misconceptions = [
        `Assuming ${concept} operates in isolation from other concepts`
      ];
    }

    // Criterion‑referenced assessment indicators let us distinguish learning
    // stages.  We encode six progressively sophisticated behaviours aligned to
    // common CS rubrics from novice through mastery.
    if (!n.assessment_indicators) {
      n.assessment_indicators = {
        novice: [`Recalls the definition of ${concept}`],
        basic: [`Identifies where ${concept} is used`],
        developing: [`Uses ${concept} with guidance`],
        proficient: [`Applies ${concept} in novel tasks`],
        advanced: [`Optimises or critiques ${concept} in complex code`],
        mastered: [`Teaches and defends ${concept} design decisions`]
      };
    }

    return n;
  };

  /**
   * Validate and normalise a raw JSON object before feeding it into the D3
   * renderer. Missing required fields cause entries to be skipped while optional
   * ones fall back to friendly defaults. This keeps the visualisation resilient
   * to imperfect data.
   */
  const loadGraphData = (rawJson) => {
    const nodes = [];
    const nodeIds = new Set();
    for (const n of rawJson.nodes || []) {
      if (!n.id || !n.name) {
        console.error('Skipping node with missing id or name:', n);
        continue;
      }
      if (n.category && !n.group) n.group = n.category;
      if (!n.group) n.group = 'default';
      if (!n.size) n.size = 50;
      // Enrich each node so downstream visualisations can rely on pedagogical
      // context even when the source JSON omits it.
      enrichNode(n);
      nodeIds.add(n.id);
      nodes.push(n);
    }
    const links = [];
    for (const l of rawJson.links || []) {
      if (!l.source || !l.target) {
        console.error('Skipping link with missing source/target:', l);
        continue;
      }
      if (!nodeIds.has(l.source) || !nodeIds.has(l.target)) {
        console.warn(`Skipping link ${l.source}\u2192${l.target}: nodes not found`);
        continue;
      }
      links.push(l);
    }
    setAugmentedNodes([]);
    setAugmentedLinks([]);
    simRef.current = null; // reset simulation so layout recomputes
    setData({ ...rawJson, nodes, links });
  };

  // Load the manifest once on mount. We first honour an override JSON URL
  // supplied via query string or environment variable. If that fails we fall
  // back to the manifest, and finally to the legacy single dataset. This makes
  // the app tolerant to stale overrides and lets local filenames like
  // "ewu-course-catalog.json" just work.
  useEffect(() => {
    const loadInitial = async () => {
      // Query and hash parameters let us deep link into a specific dataset.
      // Using both means folks can share either `?dataset=` or `#dataset=` URLs.
      const sp = new URLSearchParams(window.location.search || '');
      const hp = new URLSearchParams(window.location.hash?.slice(1) || '');
      const datasetParam = sp.get('dataset') || hp.get('dataset');
      const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');

      /**
       * Resolve an override string to an actual URL. Absolute URLs are used as
       * is. Bare filenames are assumed to live in our static `data/` folder so
       * users can simply pass `?jsonUrl=foo.json`.
       */
      const resolveUrl = (raw) => {
        if (!raw) return null;
        if (/^https?:/i.test(raw)) return raw;
        // ensure a leading `data/` when a plain filename is provided
        return `${base}/${raw.startsWith('data/') ? raw : `data/${raw}`}`;
      };

      // Try an explicit override first
      const overrideUrl = resolveUrl(sp.get('jsonUrl') || import.meta.env.VITE_JSON_URL);
      if (overrideUrl) {
        try {
          setLoading(true);
          const r = await fetch(overrideUrl);
          if (!r.ok) throw new Error(r.statusText);
          loadGraphData(await r.json());
          setError(null);
          return; // Success, we're done
        } catch (err) {
          console.error('Failed to load override dataset:', err);
          setError(`Failed to load ${overrideUrl}`);
          setEndpointTried(overrideUrl);
          // Intentionally fall through to manifest attempt
        }
      }

      try {
        setLoading(true);
        const res = await fetch(`${base}/data/manifest.json`);
        if (!res.ok) throw new Error(res.status);
        const list = await res.json();
        setDatasets(list);
        // Honour a dataset name from the URL if it matches the manifest.
        // Falling back to the first entry keeps old URLs working.
        const found = datasetParam && list.find(ds => ds.file === datasetParam);
        if (found) {
          setSelectedDataset(found.file);
        } else if (list.length > 0) {
          setSelectedDataset(list[0].file);
        }
        setError(null);
      } catch (err) {
        console.warn('No manifest available, falling back to default dataset.', err);
        try {
          const res = await fetch(`${base}/concept-map.json`);
          if (!res.ok) throw new Error(res.statusText);
          loadGraphData(await res.json());
          setError(null);
        } catch (err2) {
          console.error('Failed to load default dataset:', err2);
          setError('Failed to load default dataset');
          setEndpointTried(`${base}/concept-map.json`);
        }
      } finally {
        setLoading(false);
      }
    };

    loadInitial();
  }, []);

  // Whenever the user picks a dataset from the dropdown we fetch it on demand.
  useEffect(() => {
    if (!selectedDataset) return;
    // Keep the URL in sync with the user's choice so it can be shared.
    // We touch both the query string and hash fragment since some users
    // prefer one style over the other when passing around links.
    const urlObj = new URL(window.location.href);
    urlObj.searchParams.set('dataset', selectedDataset);
    urlObj.hash = `dataset=${encodeURIComponent(selectedDataset)}`;
    window.history.replaceState({}, '', `${urlObj.pathname}${urlObj.search}${urlObj.hash}`);

    // After updating the URL, pull down the actual dataset.
    setLoading(true);
    const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
    const url = `${base}/data/${selectedDataset}`;
    fetch(url)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.statusText)))
      .then((json) => { loadGraphData(json); setError(null); })
      .catch((err) => {
        console.error('Failed to load dataset:', err);
        setError(`Failed to load ${selectedDataset}`);
        setEndpointTried(url);
      })
      .finally(() => setLoading(false));
  }, [selectedDataset]);

  // Derive unique levels from data for filtering/legend (fallback to 'unknown')
  const groupValues = useMemo(() => {
    const vals = (data?.nodes || []).map(n => (Number.isFinite(+n?.level) ? +n.level : 'unknown'));
    const uniq = Array.from(new Set(vals));
    uniq.sort((a, b) => (typeof a === 'number' && typeof b === 'number')
      ? a - b
      : String(a).localeCompare(String(b)));
    return uniq;
  }, [data]);
  useEffect(() => { setGroups(groupValues); }, [groupValues]);

  // Level color scales (sequential for numeric levels, ordinal as fallback)
  const numericLevels = useMemo(() => groupValues.filter(v => typeof v === 'number'), [groupValues]);
  const levelSequential = useMemo(() => {
    if (numericLevels.length >= 2) {
      const min = Math.min(...numericLevels);
      const max = Math.max(...numericLevels);
      // Invert so level 0 (roots) are brighter/warmer than deeper levels
      return d3.scaleSequential(d3.interpolateTurbo).domain([max, min]);
    }
    return null;
  }, [numericLevels]);
  const groupScale = useMemo(() => (
    d3.scaleOrdinal(d3.schemeTableau10).domain(groupValues)
  ), [groupValues]);
  const getGroupColor = (g) => {
    const val = (g == null ? 'unknown' : g);
    const key = String(val).toLowerCase();
    if (GROUP_COLOR_OVERRIDES[key]) return GROUP_COLOR_OVERRIDES[key];
    if (typeof val === 'number' && levelSequential) return levelSequential(val);
    return groupScale(val);
  };

  // Relation key helper and color scale
  const relationKey = (l) => (l ? (l.label || l.relationshipType || l.type || 'relates to') : 'relates to');

  // All links including augmented for color domains/legends
  const allLinks = useMemo(() => {
    const base = data?.links || [];
    return base.concat(augmentedLinks || []);
  }, [data, augmentedLinks]);

  const relationTypes = useMemo(() => (
    Array.from(new Set(allLinks.map(relationKey)))
  ), [allLinks]);

  const relationScale = useMemo(() => (
    d3.scaleOrdinal(d3.schemeSet2).domain(relationTypes)
  ), [relationTypes]);

  const getRelationColor = (t) => {
    const key = (t || 'relates to').toString().toLowerCase();
    return RELATION_COLOR_OVERRIDES[key] || relationScale(t || 'relates to');
  };

  // Node name lookup (includes augmented nodes)
  const nodeNameById = useMemo(() => {
    const map = new Map();
    (data?.nodes || []).forEach(n => map.set(n.id, n.name || n.id));
    (augmentedNodes || []).forEach(n => map.set(n.id, n.name || n.id));
    return map;
  }, [data, augmentedNodes]);

  // Compose nodes/links with filters applied
  const filteredNodes = useMemo(() => {
    const base = (data?.nodes || []).concat(augmentedNodes || []);
    // de-dupe by id
    const byId = new Map();
    base.forEach(n => { if (n && n.id != null) byId.set(n.id, n); });
    const all = Array.from(byId.values());
    if (!selectedGroups || selectedGroups.size === 0) return all;
    return all.filter(n => selectedGroups.has(Number.isFinite(+n?.level) ? +n.level : 'unknown'));
  }, [data, augmentedNodes, selectedGroups]);

  const filteredLinks = useMemo(() => {
    const base = (data?.links || []).concat(augmentedLinks || []);
    if (!filteredNodes.length) return [];
    const allowed = new Set(filteredNodes.map(n => n.id));
    return base.filter(l => allowed.has(typeof l.source === 'object' ? l.source?.id : l.source)
      && allowed.has(typeof l.target === 'object' ? l.target?.id : l.target));
  }, [data, augmentedLinks, filteredNodes]);

  // Top relation legend (by frequency)
  const topRelationLegend = useMemo(() => {
    const counts = new Map();
    (allLinks || []).forEach(l => {
      const k = relationKey(l);
      counts.set(k, (counts.get(k) || 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [allLinks]);

  // Track available viewport size for SVG via ResizeObserver
  useEffect(() => {
    const svgEl = svgRef.current;
    const parent = svgEl?.parentElement;
    if (!svgEl || !parent) return;
    const update = () => {
      const rect = parent.getBoundingClientRect();
      const svgRect = svgEl.getBoundingClientRect();
      const w = Math.max(320, Math.floor(rect.width));
      const h = Math.max(320, Math.floor(window.innerHeight - svgRect.top - 16));
      setViewSize({ width: w, height: h });
    };
    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(parent);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  // D3.js visualization with smooth enter/update/exit transitions
  useEffect(() => {
  if (!svgRef.current) return; // guard against hot refresh timing
  try {
  const svg = d3.select(svgRef.current);
  const width = Math.max(1, viewSize.width || 1200);
  const height = Math.max(1, viewSize.height || 800);
  // Universe: large hamburger (8x width, 4x height)
  const universe = { W: width * 8, H: height * 4 };
    svg
      .attr('width', width)
      .attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', 'Interactive concept map graph. Use arrow keys to pan, plus and minus to zoom, and zero to reset view.')
      .attr('tabindex', 0)
      .attr('focusable', true)
      .style('background', '#1f2329'); // slightly dark for better text contrast

    // Ensure one-time container/zoom/defs setup
    let container = svg.select('g.graph-container');
    if (container.empty()) {
      container = svg.append('g').attr('class', 'graph-container');
      const zoom = d3.zoom()
        .scaleExtent([0.05, 6])
        // allow very large panning area (effectively removes the box feel)
        .translateExtent([[-1e6, -1e6], [1e6, 1e6]])
        .extent([[0, 0], [width, height]])
        .on('zoom', (event) => { zoomRef.current = event.transform; container.attr('transform', event.transform); });
      svg.style('pointer-events', 'all').style('user-select', 'none').call(zoom);
      // Save the zoom behavior for later programmatic transforms
      zoomBehaviorRef.current = zoom;
      svg.on('dblclick.zoom', null);
      // Keyboard controls for zoom/pan/reset
      svg.on('keydown', (event) => {
        const key = event.key;
        const step = 40; // pan step in px
        const factor = 1.15; // zoom factor
        const current = zoomRef.current || d3.zoomIdentity;
        if (key === '+' || key === '=') {
          event.preventDefault();
          const k = Math.min(3, current.k * factor);
          svg.transition().duration(150).call(zoomBehaviorRef.current.scaleTo, k);
        } else if (key === '-' || key === '_') {
          event.preventDefault();
          const k = Math.max(0.1, current.k / factor);
          svg.transition().duration(150).call(zoomBehaviorRef.current.scaleTo, k);
        } else if (key === '0') {
          event.preventDefault();
          svg.transition().duration(150).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
        } else if (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowUp' || key === 'ArrowDown') {
          event.preventDefault();
          const dx = key === 'ArrowLeft' ? step : key === 'ArrowRight' ? -step : 0;
          const dy = key === 'ArrowUp' ? step : key === 'ArrowDown' ? -step : 0;
          const next = current.translate(dx, dy);
          svg.transition().duration(120).call(zoomBehaviorRef.current.transform, next);
        }
      });
      const defsInit = svg.append('defs');
      addArrowhead(defsInit);

      // Background dotted pattern to add depth
      if (defsInit.select('#bg-dots').empty()) {
        defsInit.append('pattern')
          .attr('id', 'bg-dots')
          .attr('width', 20)
          .attr('height', 20)
          .attr('patternUnits', 'userSpaceOnUse')
          .append('circle')
          .attr('cx', 1)
          .attr('cy', 1)
          .attr('r', 1)
          .attr('fill', '#30343a');
      }
      // Backdrop rect using pattern (insert before graph container transforms)
      svg.insert('rect', ':first-child')
        .attr('class', 'bg-tiles')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', width)
        .attr('height', height)
        .attr('fill', 'url(#bg-dots)')
        .attr('opacity', 0.35)
        .lower();

      // Create fixed layering groups (order defines z-index)
      container.append('g').attr('class', 'layer-links');
      container.append('g').attr('class', 'layer-link-labels');
      container.append('g').attr('class', 'layer-nodes');
      container.append('g').attr('class', 'layer-annotations');
    }

    // Ensure layers exist even after HMR
    let linksLayer = container.select('g.layer-links');
    let labelsLayer = container.select('g.layer-link-labels');
    let nodesLayer = container.select('g.layer-nodes');
    let annotationsLayer = container.select('g.layer-annotations');
    if (linksLayer.empty()) linksLayer = container.insert('g', ':first-child').attr('class', 'layer-links');
    if (labelsLayer.empty()) labelsLayer = container.insert('g', ':nth-child(2)').attr('class', 'layer-link-labels');
    if (nodesLayer.empty()) nodesLayer = container.append('g').attr('class', 'layer-nodes');
    if (annotationsLayer.empty()) annotationsLayer = container.append('g').attr('class', 'layer-annotations');

  // Ensure defs exists and add visual defs (glow + per-type markers + node gradients)
    let defs = svg.select('defs');
    if (defs.empty()) defs = svg.append('defs');
    // Node glow filter (idempotent)
    if (defs.select('#node-glow').empty()) {
      const glow = defs.append('filter')
        .attr('id', 'node-glow')
        .attr('height', '200%')
        .attr('width', '200%')
        .attr('x', '-50%')
        .attr('y', '-50%');
      glow.append('feGaussianBlur')
        .attr('in', 'SourceAlpha')
        .attr('stdDeviation', 2)
        .attr('result', 'glow');
      const merge = glow.append('feMerge');
      merge.append('feMergeNode').attr('in', 'glow');
      merge.append('feMergeNode').attr('in', 'SourceGraphic');
    }

    // Text shadow for labels (subtle pop)
    if (defs.select('#text-shadow').empty()) {
      const ts = defs.append('filter')
        .attr('id', 'text-shadow')
        .attr('x', '-20%')
        .attr('y', '-20%')
        .attr('width', '140%')
        .attr('height', '140%');
      ts.append('feGaussianBlur').attr('in', 'SourceAlpha').attr('stdDeviation', 1.2).attr('result', 'blur');
      ts.append('feOffset').attr('dx', 0).attr('dy', 0).attr('result', 'offsetBlur');
      const merge = ts.append('feMerge');
      merge.append('feMergeNode').attr('in', 'offsetBlur');
      merge.append('feMergeNode').attr('in', 'SourceGraphic');
    }

  // Per-relation colored arrowheads
    const slugify = s => (s || 'rel').toString().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const typeSet = new Set(filteredLinks.map(l => (l ? (l.label || l.relationshipType || l.type || 'relates to') : 'relates to')));
    const types = Array.from(typeSet);
    const markerSel = defs.selectAll('marker.relation-arrow').data(types, t => t);
    markerSel.exit().remove();
    const markerEnter = markerSel.enter()
      .append('marker')
      .attr('class', 'relation-arrow')
      .attr('id', t => `arrow-${slugify(t)}`)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 18)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto');
    markerEnter.append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', t => getRelationColor(t))
      .attr('stroke', t => getRelationColor(t));
    markerSel.merge(markerEnter).select('path')
      .attr('fill', t => getRelationColor(t))
      .attr('stroke', t => getRelationColor(t));

    // Shadow for meta cards (idempotent)
    if (defs.select('#card-shadow').empty()) {
      const f = defs.append('filter')
        .attr('id', 'card-shadow')
        .attr('x', '-20%')
        .attr('y', '-20%')
        .attr('width', '140%')
        .attr('height', '140%');
      f.append('feDropShadow')
        .attr('dx', 0)
        .attr('dy', 2)
        .attr('stdDeviation', 2)
        .attr('flood-color', '#000')
        .attr('flood-opacity', 0.3);
    }

    // Compute node degrees from current link set for sizing
    const degreeMap = new Map();
    (filteredLinks || []).forEach(l => {
      const sid = typeof l.source === 'object' ? l.source?.id : l.source;
      const tid = typeof l.target === 'object' ? l.target?.id : l.target;
      if (sid != null) degreeMap.set(sid, (degreeMap.get(sid) || 0) + 1);
      if (tid != null) degreeMap.set(tid, (degreeMap.get(tid) || 0) + 1);
    });
    (filteredNodes || []).forEach(n => { n.degree = degreeMap.get(n.id) || 0; });

    // Precompute per-level radii from JSON size with strict level caps so roots > children visually
    (() => {
      const byLevel = new Map();
      (filteredNodes || []).forEach(n => {
        const lv = Number(n?.level);
        if (Number.isFinite(lv) && lv >= 0) {
          if (!byLevel.has(lv)) byLevel.set(lv, []);
          byLevel.get(lv).push(n);
        } else {
          n._radius = undefined; // leave for default computeNodeRadius
        }
      });
      // Establish decreasing caps by level (MAX at level 0, reduce by delta per level)
      const MAX_R = 60, MIN_R = 20, DELTA = 6;
      byLevel.forEach((nodesAtLevel, lv) => {
        const cap = Math.max(MIN_R, MAX_R - DELTA * lv); // hard upper bound for this level
        const band = Math.max(3, Math.min(10, cap - MIN_R)); // room for within-level variation
        // Determine size range for normalization
        let minS = Infinity, maxS = -Infinity;
        nodesAtLevel.forEach(n => {
          const s = Number.isFinite(+n.size) && +n.size > 0 ? +n.size : (Number.isFinite(+n.degree) ? +n.degree : 0);
          if (s < minS) minS = s;
          if (s > maxS) maxS = s;
        });
        const range = Math.max(1e-6, maxS - minS);
        nodesAtLevel.forEach(n => {
          const s = Number.isFinite(+n.size) && +n.size > 0 ? +n.size : (Number.isFinite(+n.degree) ? +n.degree : 0);
          const norm = (s - minS) / range; // 0..1
          const r = (cap - band) + norm * band;
          n._radius = Math.max(MIN_R, Math.min(MAX_R, r));
        });
      });
    })();

    // Node radial gradients by group (soft center glow)
  const slug = s => (s == null ? 'unknown' : s).toString().toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const groupKeys = Array.from(new Set((filteredNodes || []).map(n => (Number.isFinite(+n?.level) ? +n.level : 'unknown'))));
    const gradSel = defs.selectAll('radialGradient.node-fill').data(groupKeys, d => d);
    gradSel.exit().remove();
    const gradEnter = gradSel.enter()
      .append('radialGradient')
      .attr('class', 'node-fill')
  .attr('id', g => `node-fill-${slug(g)}`)
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '60%');
    gradEnter.append('stop').attr('offset', '0%');
    gradEnter.append('stop').attr('offset', '100%');
    const allGrads = gradEnter.merge(gradSel);
    allGrads.select('stop[offset="0%"]')
      .attr('stop-color', g => {
        const c = d3.color(getGroupColor(g));
        if (!c) return '#fff';
        const hsl = d3.hsl(c);
        hsl.l = Math.min(0.9, hsl.l + 0.25);
        return hsl.formatHex();
      })
      .attr('stop-opacity', 1);
    allGrads.select('stop[offset="100%"]')
      .attr('stop-color', g => getGroupColor(g))
      .attr('stop-opacity', 1);

    // Transition helper
  const t = d3.transition().duration(250).ease(d3.easeCubicOut);

    // If no data, fade everything out
    if (!filteredNodes.length && !filteredLinks.length) {
      container.selectAll('.link').transition(t).attr('opacity', 0).remove();
      container.selectAll('.link-label').transition(t).attr('opacity', 0).remove();
      container.selectAll('.node-group').transition(t).attr('opacity', 0).remove();
      if (simRef.current) {
        const sim = simRef.current;
        sim.nodes([]);
        const lf = sim.force('link');
        if (lf) lf.links([]);
        sim.alpha(0);
      }
      setRenderCounts({ nodes: 0, links: 0 });
      if (liveStatusRef.current) {
        liveStatusRef.current.textContent = 'No nodes or links to display.';
      }
      return;
    }

    // Utility: build undirected adjacency for diameter path
    const buildAdj = (nodesArr, linksArr) => {
      const adj = new Map();
      const idSet = new Set(nodesArr.map(n => n.id));
      nodesArr.forEach(n => adj.set(n.id, new Set()));
      linksArr.forEach(l => {
        const s = typeof l.source === 'object' ? l.source?.id : l.source;
        const t = typeof l.target === 'object' ? l.target?.id : l.target;
        if (!idSet.has(s) || !idSet.has(t)) return;
        adj.get(s).add(t);
        adj.get(t).add(s);
      });
      return adj;
    };
    const bfs = (startId, adj) => {
      const q = [startId];
      const dist = new Map([[startId, 0]]);
      const parent = new Map([[startId, null]]);
      let last = startId;
      while (q.length) {
        const u = q.shift();
        last = u;
        const nbrs = adj.get(u) || new Set();
        for (const v of nbrs) {
          if (!dist.has(v)) {
            dist.set(v, dist.get(u) + 1);
            parent.set(v, u);
            q.push(v);
          }
        }
      }
      return { far: last, dist, parent };
    };
    const longestPathMiddle = (nodesArr, linksArr) => {
      if (!nodesArr.length) return null;
      const adj = buildAdj(nodesArr, linksArr);
      const any = nodesArr[0].id;
      const a = bfs(any, adj).far;
      const bRun = bfs(a, adj);
      const b = bRun.far;
      // reconstruct path a..b
      const path = [];
      let cur = b;
      while (cur != null) { path.push(cur); cur = bRun.parent.get(cur); }
      // pick middle
      const midIdx = Math.floor(path.length / 2);
      const mid = path[midIdx] || a;
      return nodesArr.find(n => n.id === mid) || null;
    };

    // Initialize or update simulation
    let simulation = simRef.current;
    if (!simulation) {
  // Set initial positions for a nicer appearance
      filteredNodes.forEach(n => { if (n.x == null) { n.x = universe.W / 2; n.y = universe.H / 2; } });
      // Choose anchor as middle of longest path
      const mid = longestPathMiddle(filteredNodes, filteredLinks);
      const anchorId = mid?.id;
      simulation = createSimulation(filteredNodes, filteredLinks, { width: universe.W, height: universe.H, anchorId, anchorStrength: 0.25 });
      // Pre-warm only on first creation
      for (let i = 0; i < 60; i += 1) simulation.tick();
      simRef.current = simulation;
      // Center view on anchor at current zoom level
      if (anchorId && zoomBehaviorRef.current) {
        const k = 0.6; // start slightly zoomed out to show more of the universe
        const centerX = width / 2;
        const centerY = height / 2;
        const anchorNode = filteredNodes.find(n => n.id === anchorId);
        const ax = anchorNode?.x ?? (universe.W / 2);
        const ay = anchorNode?.y ?? (universe.H / 2);
        const tx = d3.zoomIdentity.translate(centerX - ax * k, centerY - ay * k).scale(k);
        svg.call(zoomBehaviorRef.current.transform, tx);
        zoomRef.current = tx;
        container.attr('transform', tx);
      }
    } else {
      simulation.nodes(filteredNodes);
      const linkForce = simulation.force('link');
      if (linkForce) linkForce.links(filteredLinks);
  const diff = simulation.force('diffusion');
  if (diff && typeof diff.updateLinks === 'function') diff.updateLinks(filteredLinks);
      simulation.alphaTarget(0.6).restart();
      setTimeout(() => simulation.alphaTarget(0), 350);
    }

    // Stable key for links using id strings regardless of object/string
    const linkKey = (d) => {
      const sid = typeof d.source === 'object' ? d.source?.id : d.source;
      const tid = typeof d.target === 'object' ? d.target?.id : d.target;
      return `${sid}→${tid}`;
    };

  // LINKS (keyed) as curved paths
  const linkSel = linksLayer.selectAll('path.link')
      .data(filteredLinks, linkKey);

    linkSel.exit()
      .transition(t)
      .attr('opacity', 0)
      .remove();

    const linkEnter = linkSel.enter()
  .append('path')
      .attr('class', 'link')
      .attr('fill', 'none')
  .attr('stroke', d => getRelationColor(relationKey(d)))
      .attr('stroke-width', d => {
        const w = Number(d.strength);
        return Number.isFinite(w) ? Math.max(1, Math.min(4, 1 + w * 2)) : 1.6;
      })
      .attr('stroke-linecap', 'round')
      .attr('marker-end', d => `url(#arrow-${slugify(relationKey(d))})`)
  .attr('opacity', 0.0)
  .attr('shape-rendering', 'optimizeSpeed');

    const links = linkEnter.merge(linkSel)
      .attr('stroke', d => getRelationColor(relationKey(d)))
      .attr('marker-end', d => `url(#arrow-${slugify(relationKey(d))})`)
      .attr('stroke-linecap', 'round')
      .attr('shape-rendering', 'optimizeSpeed');
    linkEnter.transition(t).attr('opacity', 0.8);
    // Clear any previous direct handlers on visible links (we'll bind to hit paths)
    links.on('mouseenter', null).on('mouseleave', null);

    // Create invisible, thick hit-paths to enlarge the hover hitbox
    const hitSel = linksLayer.selectAll('path.link-hit')
      .data(filteredLinks, linkKey);

    hitSel.exit().remove();
    const hitEnter = hitSel.enter()
      .append('path')
      .attr('class', 'link-hit')
      .attr('fill', 'none')
      .attr('stroke', '#000')
      .attr('stroke-opacity', 0)
      .attr('pointer-events', 'stroke')
      .attr('stroke-linecap', 'round')
      .attr('shape-rendering', 'optimizeSpeed');

  const hitLinks = hitEnter.merge(hitSel)
      .attr('stroke-width', d => {
        const w = Number(d.strength);
        const base = Number.isFinite(w) ? Math.max(6, Math.min(18, 10 + w * 6)) : 12;
        return base; // wide, but invisible
      });

    // Hover interactions bound to hit paths so entire curve is interactive
    hitLinks
      .on('mouseenter', (event, d) => {
        const key = linkKey(d);
        // Highlight link visually
        linksLayer.selectAll('path.link')
          .filter(x => linkKey(x) === key)
          .attr('opacity', 1)
          .attr('stroke-width', dd => {
            const w = Number(dd.strength);
            return Number.isFinite(w) ? Math.max(2, Math.min(6, 2 + w * 2.5)) : 2.8;
          });
        // Animate dash flow on visible link
        const flow = linksLayer.selectAll('path.link').filter(x => linkKey(x) === key);
        flow
          .attr('stroke-dasharray', '6 8')
          .attr('stroke-linecap', 'round')
          .transition()
          .duration(800)
          .ease(d3.easeLinear)
          .attrTween('stroke-dashoffset', () => d3.interpolateNumber(12, 0))
          .on('end', function repeat() {
            const sel = d3.select(this);
            if (!sel.empty() && sel.classed('link')) {
              sel.attr('stroke-dashoffset', 12)
                .transition()
                .duration(800)
                .ease(d3.easeLinear)
                .attr('stroke-dashoffset', 0)
                .on('end', repeat);
            }
          });
        // Highlight attached nodes (source/target)
        const sid = typeof d.source === 'object' ? d.source?.id : d.source;
        const tid = typeof d.target === 'object' ? d.target?.id : d.target;
        nodesLayer.selectAll('g.node-group')
          .each(function(nd) {
            if (nd.id === sid || nd.id === tid) {
              const c = d3.select(this).select('circle');
              const r = computeNodeRadius(nd);
              c.interrupt().transition().duration(120)
                .attr('r', r + 3)
                .attr('stroke-width', 2);
            }
          });
        // Force-show the label
        labelsLayer
          .selectAll('text.link-label')
          .filter(x => linkKey(x) === key)
          .classed('force-show', true)
          .attr('opacity', 1);
        // Show link details tooltip near cursor initially (will tether on tick)
        const [mx, my] = d3.pointer(event, svg.node());
        const src = sid;
        const dst = tid;
        const type = relationKey(d);
        setLinkTooltip({
          visible: true,
          x: mx,
          y: my,
          key,
          data: {
            source: src,
            target: dst,
            type,
            strength: d.strength,
            description: d.description,
            pedagogical_reasoning: d.pedagogical_reasoning,
            cognitive_bridge: d.cognitive_bridge,
            ...(['mathematical_concepts','atomic_knowledge_components','object_creation_process','analysis_techniques','design_patterns','software_engineering_patterns','testing_strategies','oop_integration','composition_benefits','cscd300_applications','advanced_inheritance','encapsulation_patterns'].reduce((acc, k) => {
              if (Array.isArray(d?.[k])) acc[k] = d[k];
              return acc;
            }, {}))
          }
        });
      })
      .on('mouseleave', (event, d) => {
        const key = linkKey(d);
        // Un-highlight link
        linksLayer.selectAll('path.link')
          .filter(x => linkKey(x) === key)
          .attr('opacity', 0.8)
          .attr('stroke-width', dd => {
            const w = Number(dd.strength);
            return Number.isFinite(w) ? Math.max(1, Math.min(4, 1 + w * 2)) : 1.6;
          })
          .attr('stroke-dasharray', null)
          .attr('stroke-dashoffset', null);
        // Un-highlight nodes
        const sid = typeof d.source === 'object' ? d.source?.id : d.source;
        const tid = typeof d.target === 'object' ? d.target?.id : d.target;
        nodesLayer.selectAll('g.node-group')
          .each(function(nd) {
            if (nd.id === sid || nd.id === tid) {
              const c = d3.select(this).select('circle');
              const r = computeNodeRadius(nd);
              c.interrupt().transition().duration(120)
                .attr('r', r)
                .attr('stroke-width', 1);
            }
          });
        labelsLayer
          .selectAll('text.link-label')
          .filter(x => linkKey(x) === key)
          .classed('force-show', false);
        setLinkTooltip(prev => ({ ...prev, visible: false }));
      });

    // LINK LABELS (keyed)
  const labelSel = labelsLayer.selectAll('text.link-label')
      .data(filteredLinks, linkKey);

    labelSel.exit()
      .transition(t)
      .attr('opacity', 0)
      .remove();

    const labelEnter = labelSel.enter()
      .append('text')
      .attr('class', 'link-label')
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .style('paint-order', 'stroke')
  .style('pointer-events', 'none')
      .attr('stroke', '#fff')
      .attr('stroke-width', 3)
      .attr('stroke-linejoin', 'round')
      .attr('fill', d => getRelationColor(relationKey(d)))
      .attr('font-weight', 'bold')
      .attr('opacity', 0)
      .each(function(d) {
        // Word wrap within ~140px using real SVG text measurement
        const textSel = d3.select(this);
        const raw = d.label || d.relationshipType || d.type || 'relates to';
        const words = String(raw).split(/\s+/).filter(Boolean).reverse();
        const maxWidth = 140;
        const lineHeight = 12;
  let line = [];
        let tspan = textSel.append('tspan').attr('x', 0).attr('dy', 0);
        let word = words.pop();
        while (word) {
          line.push(word);
          tspan.text(line.join(' '));
          // Measure current line
          if (tspan.node() && tspan.node().getComputedTextLength() > maxWidth && line.length > 1) {
            // backtrack one word
            line.pop();
            tspan.text(line.join(' '));
            line = [word];
            tspan = textSel.append('tspan')
              .attr('x', 0)
              .attr('dy', lineHeight)
              .text(word);
          }
          word = words.pop();
        }
      });

  const linkLabels = labelEnter.merge(labelSel)
      .attr('fill', d => getRelationColor(relationKey(d)));
    labelEnter.transition(t).attr('opacity', 1);

    // NODES (keyed)
  const nodeSel = nodesLayer.selectAll('g.node-group')
      .data(filteredNodes, d => d.id);

    nodeSel.exit()
      .each(function() {
        // shrink circle before removal
        d3.select(this).select('circle')
          .transition(t)
          .attr('r', 0);
      })
      .transition(t)
      .attr('opacity', 0)
      .remove();

    const nodeEnter = nodeSel.enter()
      .append('g')
      .attr('class', 'node-group')
      .attr('data-node-id', d => d.id)
      .attr('opacity', 0)
      .call(d3.drag()
        .on('start', (event, d) => {
            draggingRef.current = true;
            // Temporarily disable zoom to prevent interference
            if (zoomBehaviorRef.current && svg) svg.on('.zoom', null);
            // Kick the simulation harder to ensure visible motion in tests
            simulation.alphaTarget(0.9);
            if (simulation.alpha() < 0.6) simulation.alpha(0.6).restart();
            const tr = zoomRef.current || d3.zoomIdentity;
            const invX = (event.x - tr.x) / tr.k;
            const invY = (event.y - tr.y) / tr.k;
            d._dragDX = (d.x ?? 0) - invX;
            d._dragDY = (d.y ?? 0) - invY;
            d.fx = d.x; d.fy = d.y; d.vx = 0; d.vy = 0;
        })
        .on('drag', (event, d) => {
            // Convert pointer to simulation coordinates by inverting zoom transform
            const tr = zoomRef.current || d3.zoomIdentity;
            const invX = (event.x - tr.x) / tr.k;
            const invY = (event.y - tr.y) / tr.k;
            const dx = typeof d._dragDX === 'number' ? d._dragDX : 0;
            const dy = typeof d._dragDY === 'number' ? d._dragDY : 0;
            d.fx = invX + dx;
            d.fy = invY + dy;
        })
        .on('end', (event, d) => {
          simulation.alphaTarget(0);
            d.fx = null; d.fy = null; delete d._dragDX; delete d._dragDY; draggingRef.current = false;
          // Re-enable zoom after drag ends
          if (zoomBehaviorRef.current && svg) svg.call(zoomBehaviorRef.current);
        }));

  // Coloring by group/type with overrides; ID-hash colors not used anymore

    nodeEnter.append('circle')
      .attr('class', 'node')
      .attr('data-node-id', d => d.id)
      .attr('data-node-name', d => d.name || d.id)
      .attr('r', 0)
  .attr('fill', d => `url(#node-fill-${slug(Number.isFinite(+d.level) ? +d.level : 'unknown')})`)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .attr('filter', 'url(#node-glow)')
      // If a node advertises an external URL we swap the cursor to a pointer
      // so users get a visual hint that something will open when activated.
      .style('cursor', d => isValidHttpUrl(d.url) ? 'pointer' : 'grab')
      .on('mouseenter', function() {
        const c = d3.select(this);
        c.interrupt().transition().duration(120)
          .attr('stroke-width', 2)
          .attr('r', dd => computeNodeRadius(dd) + 3);
      })
  .on('mouseleave', function() {
        const c = d3.select(this);
        c.interrupt().transition().duration(120)
          .attr('stroke-width', 1)
          .attr('r', dd => computeNodeRadius(dd));
      });

    nodeEnter.append('text')
      .attr('class', 'node-label')
      .attr('text-anchor', 'middle')
      .attr('dy', 5)
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('fill', '#fff')
      .style('pointer-events', 'none')
      .text(d => d.name || d.id);

  const nodeGroups = nodeEnter.merge(nodeSel);
  nodeGroups.attr('data-node-id', d => d.id);
  nodeEnter.transition(t).attr('opacity', 1);
  nodeEnter.select('circle').transition(t).attr('r', d => computeNodeRadius(d));

    // Helper: destroy any existing meta UI
    const destroyMetaUI = () => {
      annotationsLayer.selectAll('g.meta-ring').remove();
      annotationsLayer.selectAll('g.meta-panel').remove();
      // release pinned node if any
      const ownerId = activeMetaRef.current?.ownerId;
      if (ownerId) {
        const n = (filteredNodes || []).find(n => n.id === ownerId);
        if (n) { n.fx = null; n.fy = null; }
        if (simulation) simulation.alphaTarget(0).alpha(0.2);
      }
      activeMetaRef.current = null;
    };

    // Helper: word wrap into tspans within a given max width
    const wrapTspans = (textSel, raw, maxWidth, lineHeight) => {
      const words = String(raw).split(/\s+/).filter(Boolean).reverse();
      let line = [];
      let tspan = textSel.append('tspan').attr('x', 0).attr('dy', 0);
      let word = words.pop();
      while (word) {
        line.push(word);
        tspan.text(line.join(' '));
        if (tspan.node() && tspan.node().getComputedTextLength() > maxWidth && line.length > 1) {
          line.pop();
          tspan.text(line.join(' '));
          line = [word];
          tspan = textSel.append('tspan').attr('x', 0).attr('dy', lineHeight).text(word);
        }
        word = words.pop();
      }
    };

  // Build Sims-like bubbles ring for a node (styled)
    const buildMetaRing = (d) => {
      // Ignore non‑pedagogical or internal bookkeeping fields so the ring
      // only surfaces educationally meaningful metadata.
      const EXCLUDE = new Set([
        'id','name','description','group','level','size','degree','index',
        'x','y','vx','vy','fx','fy','radius','_radius'
      ]);
      const entries = Object.entries(d)
        .filter(([k, v]) => !EXCLUDE.has(k) && v != null && (typeof v === 'string' || Array.isArray(v) || typeof v === 'number' || (typeof v === 'object' && Object.keys(v).length > 0)));
      if (entries.length === 0) return destroyMetaUI();

      const priority = [
        'learning_objectives',
        'common_misconceptions',
        'assessment_indicators',
        'pedagogical_focus',
        'cognitive_scaffolding',
        'overloading_rules',
        'design_benefits',
        'common_patterns',
        'resolution_process',
        'mental_model_bridges'
      ];
      entries.sort(([a], [b]) => {
        const ai = priority.indexOf(a);
        const bi = priority.indexOf(b);
        if (ai === -1 && bi === -1) return a.localeCompare(b);
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      });

      // One bubble per remaining metadata entry. We evenly space them
      // around the circle so every fact gets a spot in the orbit.
      const count = entries.length;
      const startAngle = -90; // Start at top of the circle for aesthetic balance
      const step = 360 / count;
      const bubbles = entries.map(([key, value], i) => ({
        ownerId: d.id,
        key,
        value,
        angle: startAngle + i * step,
        r: (window.innerWidth <= 480 ? 16 : 20)
      }));

      activeMetaRef.current = { ownerId: d.id, bubbles, expandedKey: null };

  // Precompute colors used throughout to avoid TDZ issues when referenced below
  const baseColor = d3.color(getGroupColor(Number.isFinite(+d.level) ? +d.level : 'unknown')) || d3.color('#9ca3af');
  const bubbleFill = (() => { const h = d3.hsl(baseColor); h.l = Math.min(0.95, h.l + 0.35); return h.formatHex(); })();

      // Clear existing and create ring container
      annotationsLayer.selectAll('g.meta-ring').remove();
      annotationsLayer.selectAll('g.meta-panel').remove();
      const ring = annotationsLayer.append('g').attr('class', 'meta-ring').attr('data-owner', d.id);
      // Base orbit circle (tethered on tick)
      ring.append('circle')
        .attr('class', 'meta-ring-base')
        .attr('fill', 'none')
  .attr('stroke', d3.color(getGroupColor(Number.isFinite(+d.level) ? +d.level : 'unknown'))?.copy({ opacity: 0.3 }) || '#9ca3af')
        .attr('stroke-dasharray', '2 6')
        .attr('stroke-width', 2)
        .attr('pointer-events', 'none');

      const bub = ring.selectAll('g.meta-bubble')
        .data(bubbles, b => `${b.ownerId}:${b.key}`)
        .enter()
        .append('g')
        .attr('class', 'meta-bubble')
        .attr('data-testid', 'meta-bubble')
        .attr('opacity', 0)
        .attr('role', 'button')
        .attr('tabindex', 0)
        .attr('aria-label', b => `${b.key.replace(/_/g, ' ')} for ${d.name || d.id}`)
        .style('cursor', 'pointer')
        .on('keydown', (event) => {
          // Allow keyboard users to activate the tooltip using Enter or Space,
          // mirroring native button behaviour.
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            d3.select(event.currentTarget).dispatch('mouseenter', { bubbles: true });
          }
        })
        .on('focus', (event) => {
          d3.select(event.currentTarget).dispatch('mouseenter', { bubbles: true });
        })
        .on('mouseenter', (event, b) => {
          // Hovering a bubble should surface the descriptive tooltip panel.
          event.stopPropagation();
          if (activeMetaRef.current?.expandedKey === b.key) return;
          activeMetaRef.current.expandedKey = b.key;
          annotationsLayer.selectAll('g.meta-panel').remove();
          const panel = annotationsLayer.append('g').attr('class', 'meta-panel').attr('opacity', 0);
          panel.on('mouseleave', ev => {
            if (!ev.relatedTarget || !ev.relatedTarget.closest('g.meta-bubble')) {
              activeMetaRef.current.expandedKey = null;
              annotationsLayer.selectAll('g.meta-panel').remove();
            }
          });
          const padding = { x: 12, y: 10 };
          const minWidth = 220, maxWidth = 360;
          const initialW = maxWidth;
          const bg = panel.append('rect')
            .attr('class', 'panel-bg')
            .attr('x', 0)
            .attr('y', 0)
            // Rounded corners mirror the standard node tooltip so the UI feels
            // consistent across interaction modes.
            .attr('rx', 8)
            .attr('ry', 8)
            .attr('width', initialW)
            .attr('height', 120)
            // Match the styling used by other tooltips (subtle grey border and
            // slightly translucent white background with a soft drop shadow).
            .attr('fill', 'rgba(255,255,255,0.98)')
            .attr('stroke', '#e0e0e0')
            .attr('filter', 'url(#card-shadow)')
            .attr('role', 'dialog')
            .attr('tabindex', 0)
            .on('keydown', (ev) => { if (ev.key === 'Escape') { destroyMetaUI(); } });
          panel.append('rect')
            .attr('class', 'panel-accent')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', initialW)
            .attr('height', 3)
            .attr('fill', baseColor?.formatHex?.() || '#9ca3af');
          const title = panel.append('text')
            .attr('class', 'panel-title')
            .attr('x', padding.x)
            .attr('y', padding.y + 14)
            .attr('font-weight', '700')
            .attr('font-size', 13)
            .attr('fill', '#111827')
            .text(b.key.replace(/_/g, ' '));
          const contentY = padding.y + 14 + 8;
          const contentGroup = panel.append('g').attr('class', 'panel-content');
          if (b.key === 'assessment_indicators' && b.value && typeof b.value === 'object') {
            // Render rubric-like indicators grouped by proficiency level.
            const levels = ['novice','basic','developing','proficient','advanced','mastered'];
            let y = contentY + 8;
            levels.forEach(level => {
              const indicators = Array.isArray(b.value[level]) ? b.value[level] : [];
              if (!indicators.length) return;
              const heading = contentGroup.append('text')
                .attr('x', padding.x)
                .attr('y', y)
                .attr('font-size', 12)
                .attr('font-weight', '600')
                .attr('fill', '#111827')
                .text(level.charAt(0).toUpperCase() + level.slice(1));
              const hbb = heading.node()?.getBBox();
              y += (hbb?.height || 12) + 4;
              indicators.forEach(ind => {
                const textLine = contentGroup.append('text')
                  .attr('x', padding.x + 10)
                  .attr('y', y)
                  .attr('font-size', 12)
                  .attr('fill', '#374151');
                wrapTspans(textLine, `• ${ind}`, maxWidth - (padding.x * 2) - 10, 14);
                const tspans = textLine.selectAll('tspan').nodes();
                const lines = Math.max(1, tspans.length);
                y += lines * 14;
              });
              y += 6; // breathing room before the next level
            });
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            contentGroup.selectAll('text').each(function() {
              const bb = this.getBBox();
              minX = Math.min(minX, bb.x);
              maxX = Math.max(maxX, bb.x + bb.width);
              minY = Math.min(minY, bb.y);
              maxY = Math.max(maxY, bb.y + bb.height);
            });
            const contentW = Math.max(0, maxX - minX) + padding.x;
            const desiredW = Math.max(minWidth, Math.min(maxWidth, Math.max(contentW, title.node()?.getBBox?.().width + padding.x * 2)));
            bg.attr('width', desiredW);
            panel.select('rect.panel-accent').attr('width', desiredW);
            const totalH = Math.max(110, (maxY - (padding.y - 2)) + padding.y);
            panel.select('rect.panel-bg').attr('height', totalH);
          } else if (Array.isArray(b.value)) {
            const items = b.value.slice(0, 8);
            let y = contentY + 8;
            items.forEach(item => {
              const str = String(item);
              // Heuristic: treat plain URLs as links so they can be clicked.
              const isUrl = isValidHttpUrl(str);
              const parent = isUrl
                ? contentGroup.append('a')
                    .attr('href', str)
                    .attr('target', '_blank')
                    .attr('rel', 'noopener noreferrer')
                : contentGroup;
              const textLine = parent.append('text')
                .attr('x', padding.x)
                .attr('y', y)
                .attr('font-size', 12)
                .attr('fill', isUrl ? '#2563eb' : '#374151')
                .style('text-decoration', isUrl ? 'underline' : null);
              wrapTspans(textLine, `• ${str}`, maxWidth - (padding.x * 2), 14);
              const tspans = textLine.selectAll('tspan').nodes();
              const lines = Math.max(1, tspans.length);
              y += lines * 14;
            });
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            contentGroup.selectAll('text').each(function() {
              const bb = this.getBBox();
              minX = Math.min(minX, bb.x);
              maxX = Math.max(maxX, bb.x + bb.width);
              minY = Math.min(minY, bb.y);
              maxY = Math.max(maxY, bb.y + bb.height);
            });
            const contentW = Math.max(0, maxX - minX) + padding.x;
            const desiredW = Math.max(minWidth, Math.min(maxWidth, Math.max(contentW, title.node()?.getBBox?.().width + padding.x * 2)));
            bg.attr('width', desiredW);
            panel.select('rect.panel-accent').attr('width', desiredW);
            const totalH = Math.max(110, (maxY - (padding.y - 2)) + padding.y);
            panel.select('rect.panel-bg').attr('height', totalH);
          } else {
            const val = String(b.value);
            const isUrl = isValidHttpUrl(val);
            const parent = isUrl
              ? contentGroup.append('a')
                  .attr('href', val)
                  .attr('target', '_blank')
                  .attr('rel', 'noopener noreferrer')
              : contentGroup;
            const textLine = parent.append('text')
              .attr('x', padding.x)
              .attr('y', contentY + 8)
              .attr('font-size', 12)
              .attr('fill', isUrl ? '#2563eb' : '#374151')
              .style('text-decoration', isUrl ? 'underline' : null);
            wrapTspans(textLine, val, maxWidth - (padding.x * 2), 14);
            const bb = contentGroup.node()?.getBBox?.();
            const desiredW = Math.max(minWidth, Math.min(maxWidth, Math.max((bb?.width || 0) + padding.x * 2, title.node()?.getBBox?.().width + padding.x * 2)));
            bg.attr('width', desiredW);
            panel.select('rect.panel-accent').attr('width', desiredW);
            const totalH = Math.max(110, ((bb?.height || 0) + padding.y * 2 + 18));
            panel.select('rect.panel-bg').attr('height', totalH);
          }
          panel.append('path')
            .attr('class', 'panel-connector')
            .attr('stroke', '#d1d5db')
            .attr('stroke-width', 1.5)
            .attr('fill', 'none')
            .attr('pointer-events', 'none');
          // Compute initial tooltip position relative to the bubble. We work in
          // screen-space first (taking current zoom/pan into account) and then
          // convert back into graph coordinates. This avoids the panel jumping
          // to the origin when the graph is heavily translated.
          const ownerX = d.x ?? 0, ownerY = d.y ?? 0;
          const ringRadius = activeMetaRef.current.ringRadius || computeNodeRadius(d) + (window.innerWidth <= 480 ? 52 : 70);
          const angleRad = (b.angle * Math.PI) / 180;
          const bubbleX = ownerX + Math.cos(angleRad) * ringRadius;
          const bubbleY = ownerY + Math.sin(angleRad) * ringRadius;
          const dx = Math.sign(bubbleX - ownerX) || 1;
          const dy = Math.sign(bubbleY - ownerY) || 1;
          const panW = +bg.attr('width') || minWidth;
          const panH = +panel.select('rect.panel-bg').attr('height') || 120;
          const gap = 20;
          const t = zoomRef.current || d3.zoomIdentity; // current screen transform
          const [sbx, sby] = t.apply([bubbleX, bubbleY]); // bubble in screen coords
          const rawSX = sbx + (dx > 0 ? gap : -(panW + gap));
          const rawSY = sby + (dy > 0 ? gap : -(panH + gap));
          const [rawX, rawY] = t.invert([rawSX, rawSY]);
          panel.attr('transform', `translate(${rawX},${rawY})`);
          const anchorSX = rawSX + (dx > 0 ? 0 : panW);
          const anchorSY = rawSY + (dy > 0 ? 0 : panH);
          const [anchorX, anchorY] = t.invert([anchorSX, anchorSY]);
          panel.select('path.panel-connector').attr('d', `M${bubbleX - rawX},${bubbleY - rawY} L${anchorX - rawX},${anchorY - rawY}`);
          panel.transition().duration(160).attr('opacity', 1);
        })
        .on('mouseleave', (event) => {
          if (!event.relatedTarget || !event.relatedTarget.closest('g.meta-panel')) {
            activeMetaRef.current.expandedKey = null;
            annotationsLayer.selectAll('g.meta-panel').remove();
          }
        });

      bub.append('path')
        .attr('class', 'connector')
        .attr('stroke', '#d1d5db')
        .attr('stroke-width', 1.5)
        .attr('fill', 'none')
        .attr('pointer-events', 'none');

      // Outward spike from bubble edge to label anchor
      bub.append('path')
        .attr('class', 'label-spike')
        .attr('data-testid', 'label-spike')
        .attr('stroke', baseColor?.formatHex?.() || '#9ca3af')
        .attr('stroke-width', 1.5)
        .attr('fill', 'none')
        .attr('pointer-events', 'none');
      bub.append('circle')
        .attr('r', b => b.r)
        .attr('fill', bubbleFill)
        .attr('stroke', baseColor?.formatHex?.() || '#e5e7eb')
        .attr('filter', 'url(#card-shadow)');

      // Label pill with text glow
  const lbl = bub.append('g').attr('class', 'bubble-label').attr('data-testid', 'bubble-label').attr('opacity', 0);
      lbl.append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', 12)
        .attr('font-weight', 600)
        .attr('fill', '#111827')
        .attr('filter', 'url(#text-shadow)')
        .text(b => {
          const t = b.key.replace(/_/g, ' ');
          // store full label; truncation handled by zoom-aware rendering
          return t;
        })
        .style('pointer-events', 'none');
      // Measure and add rounded background
      lbl.each(function(b) {
        const g = d3.select(this);
        const t = g.select('text');
        const bb = t.node()?.getBBox?.();
        const padX = 8, padY = 4;
        const w = (bb?.width || 30) + padX * 2;
        const h = (bb?.height || 12) + padY * 2;
        // Position group under bubble
        b.spike = 14; // outward spike length
        b.labelOffset = 0; // extra outward offset for collision resolve
        g.attr('transform', `translate(0, ${b.r + b.spike + 10})`);
        g.insert('rect', 'text')
          .attr('x', -w / 2)
          .attr('y', -(h / 2))
          .attr('rx', 8)
          .attr('ry', 8)
          .attr('width', w)
          .attr('height', h)
          .attr('fill', '#ffffff')
          .attr('stroke', baseColor?.formatHex?.() || '#e5e7eb')
          .attr('stroke-width', 1.25)
          .attr('filter', 'url(#card-shadow)')
          .attr('data-testid', 'label-pill');
        // cache label metrics for collision handling
        const bb2 = g.node()?.getBBox?.();
        b.labelW = (bb2?.width || w);
        b.labelH = (bb2?.height || h);
      });

      lbl.transition().duration(200).attr('opacity', 1);
      bub.transition().duration(180).attr('opacity', 1);

      // Initial positioning so tests and UI have geometry before first tick
      const ownerX = d.x ?? 0, ownerY = d.y ?? 0;
  const ringRadius = computeNodeRadius(d) + (window.innerWidth <= 480 ? 52 : 70);
      activeMetaRef.current.ringRadius = ringRadius;
      ring.select('circle.meta-ring-base')
        .attr('cx', ownerX)
        .attr('cy', ownerY)
        .attr('r', ringRadius);
      ring.selectAll('g.meta-bubble').each(function(b) {
        const angleRad = (b.angle * Math.PI) / 180;
        const cx = ownerX + Math.cos(angleRad) * ringRadius;
        const cy = ownerY + Math.sin(angleRad) * ringRadius;
        b.cx = cx; b.cy = cy;
        const sel = d3.select(this);
        sel.attr('transform', `translate(${cx},${cy})`);
        // center connector to owner
        sel.select('path.connector').attr('d', `M${ownerX - cx},${ownerY - cy} L0,0`);
        // spike from bubble edge to label anchor
        const sx = Math.cos(angleRad) * (b.r || 20);
        const sy = Math.sin(angleRad) * (b.r || 20);
        const lx = Math.cos(angleRad) * ((b.r || 20) + (b.spike || 14));
        const ly = Math.sin(angleRad) * ((b.r || 20) + (b.spike || 14));
        sel.select('path.label-spike').attr('d', `M${sx},${sy} L${lx},${ly}`);
        // label at spike end + half height + small gap
  const rect = sel.select('g.bubble-label rect');
        const h = +rect.attr('height') || (b.labelH || 20);
        const centerDist = (b.r || 20) + (b.spike || 14) + (h / 2) + 2 + (b.labelOffset || 0);
        const localCx = Math.cos(angleRad) * centerDist;
        const localCy = Math.sin(angleRad) * centerDist;
        sel.select('g.bubble-label').attr('transform', `translate(${localCx},${localCy})`);
      });

      // Once all labels are positioned, nudge any overlapping ones apart.
      // This quick pass avoids the common case where long labels stack on
      // top of each other, which would otherwise obscure the text.
      const labels = ring.selectAll('g.meta-bubble g.bubble-label');
      const boxes = [];
      labels.each(function(bb) {
        const angleRad = (bb.angle * Math.PI) / 180;
        const ux = Math.cos(angleRad), uy = Math.sin(angleRad);
        const rect = d3.select(this).select('rect');
        const w = +rect.attr('width') || (bb.labelW || 60);
        const h = +rect.attr('height') || (bb.labelH || 20);
        const centerDist = (bb.r || 20) + (bb.spike || 14) + (h / 2) + 2 + (bb.labelOffset || 0);
        const localCx = ux * centerDist;
        const localCy = uy * centerDist;
        d3.select(this).attr('transform', `translate(${localCx},${localCy})`);
        const absCx = ownerX + localCx;
        const absCy = ownerY + localCy;
        boxes.push({ sel: d3.select(this), data: bb, ux, uy, w, h, x: absCx - w / 2, y: absCy - h / 2 });
      });
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          const A = boxes[i], B = boxes[j];
          const ix = Math.max(0, Math.min(A.x + A.w, B.x + B.w) - Math.max(A.x, B.x));
          const iy = Math.max(0, Math.min(A.y + A.h, B.y + B.h) - Math.max(A.y, B.y));
          if (ix > 0 && iy > 0) {
            const bdat = B.data;
            bdat.labelOffset = Math.min(36, (bdat.labelOffset || 0) + 6);
            const centerDist = (bdat.r || 20) + (bdat.spike || 14) + (B.h / 2) + 2 + (bdat.labelOffset || 0);
            const localCx = B.ux * centerDist;
            const localCy = B.uy * centerDist;
            B.sel.attr('transform', `translate(${localCx},${localCy})`);
          }
        }
      }

      // Freeze focus owner in place while ring is open to prevent jitter
      if (simulation && typeof d.x === 'number' && typeof d.y === 'number') {
        d.fx = d.x; d.fy = d.y;
        simulation.alphaTarget(0);
      }
    };

    // Focus mode: bring selected node and its neighbors forward
    const clearFocus = () => {
      focusedRef.current = null;
      // Reset nodes
      nodesLayer.selectAll('g.node-group')
        .classed('is-focus', false)
        .transition(t)
        .attr('opacity', 1);
      nodesLayer.selectAll('g.node-group circle.node')
        .transition(t)
        .attr('r', d => computeNodeRadius(d))
        .attr('stroke-width', 1.0);
      // Reset links and labels
      linksLayer.selectAll('path.link')
        .classed('focus-link', false)
        .transition(t)
        .attr('opacity', 0.8)
        .attr('stroke-width', d => {
          const w = Number(d.strength);
          return Number.isFinite(w) ? Math.max(1, Math.min(4, 1 + w * 2)) : 1.6;
        });
      container.select('.layer-link-labels').selectAll('text.link-label')
        .transition(t)
        .attr('opacity', 0.6);
      // Remove focus card
      annotationsLayer.selectAll('g.focus-card').remove();
    };

    const applyFocus = (focusNode) => {
      if (!focusNode) return;
      focusedRef.current = { id: focusNode.id };
      const focusId = focusNode.id;
      // Build neighbor set
      const neighbors = new Set();
      (filteredLinks || []).forEach(l => {
        const sid = typeof l.source === 'object' ? l.source?.id : l.source;
        const tid = typeof l.target === 'object' ? l.target?.id : l.target;
        if (sid === focusId) neighbors.add(tid);
        if (tid === focusId) neighbors.add(sid);
      });
      // Nodes
      nodesLayer.selectAll('g.node-group')
        .transition(t)
        .attr('opacity', d => (d.id === focusId ? 1 : (neighbors.has(d.id) ? 0.8 : 0.12)));
      nodesLayer.selectAll('g.node-group')
        .classed('is-focus', d => d.id === focusId);
      nodesLayer.selectAll('g.node-group circle.node')
        .transition(t)
        .attr('r', d => d.id === focusId ? computeNodeRadius(d) * 1.5 : (neighbors.has(d.id) ? computeNodeRadius(d) * 1.15 : computeNodeRadius(d)))
        .attr('stroke-width', d => d.id === focusId ? 2.2 : 1.0);
      // Links
      linksLayer.selectAll('path.link')
        .classed('focus-link', d => {
          const sid = typeof d.source === 'object' ? d.source?.id : d.source;
          const tid = typeof d.target === 'object' ? d.target?.id : d.target;
          return sid === focusId || tid === focusId;
        })
        .transition(t)
        .attr('opacity', d => {
          const sid = typeof d.source === 'object' ? d.source?.id : d.source;
          const tid = typeof d.target === 'object' ? d.target?.id : d.target;
          return (sid === focusId || tid === focusId) ? 1 : 0.08;
        })
        .attr('stroke-width', d => {
          const sid = typeof d.source === 'object' ? d.source?.id : d.source;
          const tid = typeof d.target === 'object' ? d.target?.id : d.target;
          if (sid === focusId || tid === focusId) return 3.2;
          const w = Number(d.strength);
          return Number.isFinite(w) ? Math.max(1, Math.min(2, 1 + w * 0.75)) : 1.2;
        });
      // Link labels
      container.select('.layer-link-labels').selectAll('text.link-label')
        .transition(t)
        .attr('opacity', lbl => {
          const sid = typeof lbl.source === 'object' ? lbl.source?.id : lbl.source;
          const tid = typeof lbl.target === 'object' ? lbl.target?.id : lbl.target;
          return (sid === focusId || tid === focusId) ? 0.95 : 0.15;
        })
        .attr('font-weight', lbl => {
          const sid = typeof lbl.source === 'object' ? lbl.source?.id : lbl.source;
          const tid = typeof lbl.target === 'object' ? lbl.target?.id : lbl.target;
          return (sid === focusId || tid === focusId) ? '700' : '400';
        });
      // Focus card with definition
      annotationsLayer.selectAll('g.focus-card').remove();
      const focusData = (filteredNodes || []).find(n => n.id === focusId) || focusNode;
      const desc = focusData.description || focusData.definition || '';
      if (desc) {
        const card = annotationsLayer.append('g').attr('class', 'focus-card').attr('opacity', 0);
        const panelWidth = 260; const padding = { x: 10, y: 8 };
        card.append('rect')
          .attr('rx', 8).attr('ry', 8)
          .attr('width', panelWidth)
          .attr('height', 110)
          .attr('fill', '#111827')
          .attr('stroke', '#374151')
          .attr('filter', 'url(#card-shadow)');
        card.append('text')
          .attr('x', padding.x)
          .attr('y', padding.y + 14)
          .attr('font-weight', '700')
          .attr('font-size', 13)
          .attr('fill', '#f9fafb')
          .text(focusData.name || focusData.id);
        const descText = card.append('text')
          .attr('x', padding.x)
          .attr('y', padding.y + 14 + 8 + 6)
          .attr('font-size', 12)
          .attr('fill', '#e5e7eb');
        const snippet = String(desc).length > 220 ? String(desc).slice(0, 220) + '…' : String(desc);
        wrapTspans(descText, snippet, panelWidth - (padding.x * 2), 14);
        const bbox = card.node()?.getBBox?.();
        if (bbox) card.select('rect').attr('height', Math.max(90, bbox.height + 2));
        card.transition().duration(160).attr('opacity', 1);
      }
    };

    const toggleMetaRing = (d) => {
      if (activeMetaRef.current?.ownerId === d.id) {
        destroyMetaUI();
      } else {
        buildMetaRing(d);
      }
    };
    // Node hover displays a lightweight tooltip with just the name and description
    nodeGroups.on('mouseover', (event, d) => {
      const [mx, my] = d3.pointer(event, svg.node());
      setHoverInfo({ visible: true, x: mx, y: my, node: { ...d } });
    });
    // Reposition tooltip as the pointer moves so it tracks the cursor
    nodeGroups.on('mousemove', (event) => {
      const [mx, my] = d3.pointer(event, svg.node());
      setHoverInfo((prev) => (prev.visible ? { ...prev, x: mx, y: my } : prev));
    });
    // Hide tooltip when leaving the node
    nodeGroups.on('mouseout', () => {
      setHoverInfo({ visible: false, x: 0, y: 0, node: null });
    });
    // Node double-click opens the rich tooltip with mini-tree on desktop.
    // Touch screens typically reserve double-tap for zooming, so we skip
    // this handler when the device doesn't support hover.
    nodeGroups.on('dblclick', (event, d) => {
      const lacksHover = window.matchMedia('(hover: none)').matches || navigator.maxTouchPoints > 0; // heuristic: touch device
      if (lacksHover) return; // mobile uses single tap handled below
      const [mx, my] = d3.pointer(event, svg.node());
      // Hide hover tooltip to avoid overlap with the detailed panel
      setHoverInfo({ visible: false, x: 0, y: 0, node: null });
      // Open the focused tooltip and reset any prior expansion state so each
      // node starts with the compact view.
      setDescExpanded(false);
      setTooltip({ visible: true, x: mx, y: my, node: { ...d } });
      // Minimal legacy info-panel content to keep tests happy
      const info = document.getElementById('info-panel');
      if (info) {
        info.textContent = `${d.name || d.id}${d.description ? ` — ${d.description}` : ''}`;
      }
    });

    // Helper: spawn a ripple effect at x,y
    const spawnRipple = (x, y, color) => {
      const r = annotationsLayer.append('circle')
        .attr('class', 'click-ripple')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', 0)
        .attr('fill', 'none')
        .attr('stroke', color || '#9ca3af')
        .attr('stroke-width', 2)
        .attr('opacity', 0.35);
      r.transition().duration(650)
        .attr('r', 160)
        .attr('opacity', 0)
        .on('end', () => r.remove());
    };

    // Clicking a node serves two roles: on desktop it toggles the
    // Sims-like metadata ring, while on touch devices it acts like a
    // double-click and opens the rich tooltip since "hover" doesn't
    // exist there.
    nodeGroups.on('click', (event, d) => {
      event.stopPropagation();
      const lacksHover = window.matchMedia('(hover: none)').matches || navigator.maxTouchPoints > 0; // heuristic: touch device

      // Any click shifts focus away from the lightweight hover tooltip.
      setHoverInfo({ visible: false, x: 0, y: 0, node: null });

      // Smooth zoom/pan to center the clicked node for spatial context.
      const nodeX = d.x || 0;
      const nodeY = d.y || 0;
      const centerX = width / 2;
      const centerY = height / 2;
      const currentTransform = zoomRef.current || d3.zoomIdentity;
      const targetTransform = d3.zoomIdentity
        .translate(centerX - nodeX * currentTransform.k, centerY - nodeY * currentTransform.k)
        .scale(currentTransform.k);

      if (zoomBehaviorRef.current) {
        svg.transition()
          .duration(750)
          .ease(d3.easeCubicOut)
          .call(zoomBehaviorRef.current.transform, targetTransform);
      }
      // Immediate fallback keeps the transform visible even if the
      // transition above is interrupted (helps in tests/browsers).
      zoomRef.current = targetTransform;
      container.interrupt().attr('transform', targetTransform);
      // Small ripple provides visual feedback for the tap/click.
      spawnRipple(nodeX, nodeY, getGroupColor(Number.isFinite(+d.level) ? +d.level : 'unknown'));

      if (lacksHover) {
        // Mobile/touch: show the detailed tooltip near the tap location.
        const [mx, my] = d3.pointer(event, svg.node());
        // Show the simplified tooltip for touch users, again collapsing any
        // lingering expanded state from previous interactions.
        setDescExpanded(false);
        setTooltip({ visible: true, x: mx, y: my, node: { ...d } });
        // Preserve minimal info-panel text for legacy tests.
        const info = document.getElementById('info-panel');
        if (info) {
          info.textContent = `${d.name || d.id}${d.description ? ` — ${d.description}` : ''}`;
        }
      } else {
        // Desktop: toggle metadata ring UI elements.
        toggleMetaRing(d);
      }

      // In both cases we consider this node "focused" for keyboard users.
      applyFocus(d);
    });

    // Clicking empty space closes the ring (ignore events that bubbled from nodes/bubbles)
  svg.on('click', (event) => {
      const target = event.target;
      // Only close if the click is on the SVG background area
      if (target === svg.node()) {
    if (activeMetaRef.current) { destroyMetaUI(); }
    clearFocus();
      }
    });

  // On update, ensure circle radius and color update when data changes
    nodeGroups.select('circle')
  .attr('fill', d => `url(#node-fill-${slug(Number.isFinite(+d.level) ? +d.level : 'unknown')})`)
      .transition(t)
      .attr('r', d => computeNodeRadius(d));
    // Reapply focus styling after updates
    if (focusedRef.current?.id) {
      const f = (filteredNodes || []).find(n => n.id === focusedRef.current.id);
      if (f) applyFocus(f);
    }

    // TICK handler (set once)
  simulation.on('tick', () => {
      // Let the simulation push nodes wherever the physics demands.
      // Earlier versions hemmed every node inside the SVG's width and height,
      // a form of invisible wall.  By omitting that clamp here we allow
      // positions to wander beyond the initial viewport, illustrating that
      // force‑directed layouts have no inherent edges.
      // Curved path calculation (quadratic Bezier with perpendicular offset)
      const qPath = (sx, sy, tx, ty) => {
        const dx = tx - sx;
        const dy = ty - sy;
        const mx = (sx + tx) / 2;
        const my = (sy + ty) / 2;
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len; // unit normal
        const ny = dx / len;
        const offset = Math.min(40, 10 + len * 0.08); // mild curvature by distance
        const cx = mx + nx * offset;
        const cy = my + ny * offset;
        return `M${sx},${sy} Q${cx},${cy} ${tx},${ty}`;
      };

      links.attr('d', d => qPath(d.source?.x ?? 0, d.source?.y ?? 0, d.target?.x ?? 0, d.target?.y ?? 0));
      // Keep hit-paths aligned with visible paths
      if (typeof hitLinks !== 'undefined') {
        hitLinks.attr('d', d => qPath(d.source?.x ?? 0, d.source?.y ?? 0, d.target?.x ?? 0, d.target?.y ?? 0));
      }

  if (!linkLabels.empty()) {
        linkLabels
          // bias toward target node so label feels more "on top" of the node
          .attr('transform', d => {
            const x = 0.35 * (d.source?.x ?? 0) + 0.65 * (d.target?.x ?? 0);
            const y = 0.35 * (d.source?.y ?? 0) + 0.65 * (d.target?.y ?? 0) - 8;
            return `translate(${x},${y})`;
          })
          .each(function(d) {
            // Zoom/length-aware opacity and halo thickness
            const k = (zoomRef.current && typeof zoomRef.current.k === 'number') ? zoomRef.current.k : 1;
            // Hide at far zoom; ramp in between 0.6 and 1.2
            const zoomAlpha = Math.max(0, Math.min(1, (k - 0.5) / 0.7));
            const sx = d.source?.x ?? 0, sy = d.source?.y ?? 0;
            const tx = d.target?.x ?? 0, ty = d.target?.y ?? 0;
            const len = Math.hypot(tx - sx, ty - sy);
            const lenFactor = Math.max(0.25, Math.min(1, (len - 70) / 80));
            const forced = d3.select(this).classed('force-show');
            const opacity = forced ? 1 : (zoomAlpha * lenFactor);
            d3.select(this)
              .attr('opacity', opacity)
              .attr('stroke-width', Math.max(1.5, 3 / Math.max(0.75, k))); // thicker halo when zoomed out
          });
      }

      if (!nodeGroups.empty()) {
        nodeGroups.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`);
      }

      // Tether Sims-like ring and any open panel to the node
      if (!annotationsLayer.empty() && activeMetaRef.current?.ownerId) {
        const owner = filteredNodes.find(n => n.id === activeMetaRef.current.ownerId);
        if (owner) {
          const ring = annotationsLayer.select('g.meta-ring');
          if (!ring.empty()) {
            // Tether base circle
            const ringRadius = computeNodeRadius(owner) + 70;
            activeMetaRef.current.ringRadius = ringRadius;
            ring.select('circle.meta-ring-base')
              .attr('cx', owner.x ?? 0)
              .attr('cy', owner.y ?? 0)
              .attr('r', ringRadius);
            ring.selectAll('g.meta-bubble').each(function(b) {
              const angleRad = (b.angle * Math.PI) / 180;
              const dist = ringRadius;
              const cx = (owner.x ?? 0) + Math.cos(angleRad) * dist;
              const cy = (owner.y ?? 0) + Math.sin(angleRad) * dist;
              // cache absolute bubble center for connectors/panel placement
              b.cx = cx; b.cy = cy;
              d3.select(this).attr('transform', `translate(${cx},${cy})`);
              // Draw connector in local coordinates of this bubble (origin at cx,cy)
              const mx = (owner.x ?? 0) - cx;
              const my = (owner.y ?? 0) - cy;
              d3.select(this).select('path.connector').attr('d', `M${mx},${my} L0,0`);
              // update spike from bubble edge to label anchor (outward along angle)
              const lx = Math.cos(angleRad) * ((b.r || 20) + (b.spike || 14));
              const ly = Math.sin(angleRad) * ((b.r || 20) + (b.spike || 14));
              d3.select(this).select('path.label-spike').attr('d', `M${Math.cos(angleRad) * (b.r || 20)},${Math.sin(angleRad) * (b.r || 20)} L${lx},${ly}`);
            });
            // Zoom-aware label LOD and simple collision avoidance between labels
            const k = (zoomRef.current && typeof zoomRef.current.k === 'number') ? zoomRef.current.k : 1;
            const labels = ring.selectAll('g.bubble-label');
            labels.each(function(bb) {
              const sel = d3.select(this).select('text');
              const str = bb.key?.replace(/_/g, ' ') || '';
              if (k < 0.7) {
                sel.text('');
              } else if (k < 1.2) {
                sel.text(str.length > 10 ? str.slice(0, 10) + '…' : str);
              } else if (k < 2) {
                sel.text(str.length > 16 ? str.slice(0, 16) + '…' : str);
              } else {
                sel.text(str);
              }
            });
            // Position labels at spike endpoints with outward offset so spike touches pill edge
            const boxes = [];
            labels.each(function(bb) {
              const angleRad = (bb.angle * Math.PI) / 180;
              const ux = Math.cos(angleRad), uy = Math.sin(angleRad);
              const rect = d3.select(this).select('rect');
              const w = +rect.attr('width') || (bb.labelW || 60);
              const h = +rect.attr('height') || (bb.labelH || 20);
              const centerDist = (bb.r || 20) + (bb.spike || 14) + (h / 2) + 2 + (bb.labelOffset || 0);
              const localCx = ux * centerDist;
              const localCy = uy * centerDist;
              d3.select(this).attr('transform', `translate(${localCx},${localCy})`);
              const absCx = (owner.x ?? 0) + localCx;
              const absCy = (owner.y ?? 0) + localCy;
              boxes.push({ sel: d3.select(this), data: bb, ux, uy, w, h, x: absCx - w/2, y: absCy - h/2 });
            });
            // simple O(n^2) collision resolve in absolute graph coords
            for (let i = 0; i < boxes.length; i++) {
              for (let j = i + 1; j < boxes.length; j++) {
                const A = boxes[i], B = boxes[j];
                const ix = Math.max(0, Math.min(A.x + A.w, B.x + B.w) - Math.max(A.x, B.x));
                const iy = Math.max(0, Math.min(A.y + A.h, B.y + B.h) - Math.max(A.y, B.y));
                if (ix > 0 && iy > 0) {
                  const bdat = B.data;
                  bdat.labelOffset = Math.min(36, (bdat.labelOffset || 0) + 6);
                  const centerDist = (bdat.r || 20) + (bdat.spike || 14) + (B.h / 2) + 2 + (bdat.labelOffset || 0);
                  const localCx = B.ux * centerDist;
                  const localCy = B.uy * centerDist;
                  B.sel.attr('transform', `translate(${localCx},${localCy})`);
                }
              }
            }
          }
          const panel = annotationsLayer.select('g.meta-panel');
          if (!panel.empty() && activeMetaRef.current.expandedKey) {
            const sel = (activeMetaRef.current.bubbles || []).find(b => b.key === activeMetaRef.current.expandedKey);
            if (sel) {
              const bubbleX = sel.cx ?? ((owner.x ?? 0) + Math.cos((sel.angle * Math.PI)/180) * (activeMetaRef.current.ringRadius || (computeNodeRadius(owner) + 70)));
              const bubbleY = sel.cy ?? ((owner.y ?? 0) + Math.sin((sel.angle * Math.PI)/180) * (activeMetaRef.current.ringRadius || (computeNodeRadius(owner) + 70)));
              // Move the panel by working in screen space first so clamping is
              // intuitive for users regardless of pan/zoom level.
              // desired panel anchor corner based on quadrant (graph coords)
              const dx = Math.sign(bubbleX - (owner.x ?? 0)) || 1;
              const dy = Math.sign(bubbleY - (owner.y ?? 0)) || 1;
              const panW = +panel.select('rect.panel-bg').attr('width') || 220;
              const panH = +panel.select('rect.panel-bg').attr('height') || 120;
              const gap = 20;
              const t = zoomRef.current || d3.zoomIdentity;
              // bubble in screen coordinates
              const [sbx, sby] = t.apply([bubbleX, bubbleY]);
              // proposed panel location in screen space
              let psx = sbx + (dx > 0 ? gap : -(panW + gap));
              let psy = sby + (dy > 0 ? gap : -(panH + gap));
              // clamp within viewport in screen coordinates
              const pad = 16;
              psx = Math.max(pad, Math.min(psx, width - panW - pad));
              psy = Math.max(pad, Math.min(psy, height - panH - pad));
              const [clampedX, clampedY] = t.invert([psx, psy]);
              panel.attr('transform', `translate(${clampedX},${clampedY})`);
              // connector from bubble to nearest panel corner
              const anchorSX = psx + (dx > 0 ? 0 : panW);
              const anchorSY = psy + (dy > 0 ? 0 : panH);
              const [anchorX, anchorY] = t.invert([anchorSX, anchorSY]);
              panel.select('path.panel-connector').attr('d', `M${bubbleX - clampedX},${bubbleY - clampedY} L${anchorX - clampedX},${anchorY - clampedY}`);
            }
          }
        }
      }

      // Tether focus card to focused node
      if (!annotationsLayer.empty() && focusedRef.current?.id) {
        const focus = filteredNodes.find(n => n.id === focusedRef.current.id);
        if (focus) {
          const card = annotationsLayer.select('g.focus-card');
          if (!card.empty()) {
            const offset = computeNodeRadius(focus) + 18;
            const x = (focus.x ?? 0) + offset;
            const y = (focus.y ?? 0) - offset;
            card.attr('transform', `translate(${x},${y})`);
          }
        }
      }

      // Tether tooltip to selected node position (screen coords)
      if (tooltip.visible && tooltip.node && tooltipDivRef.current) {
        const focus = filteredNodes.find(n => n.id === tooltip.node.id);
        if (focus && typeof focus.x === 'number' && typeof focus.y === 'number') {
          const t = zoomRef.current || d3.zoomIdentity;
          const pt = t.apply([focus.x, focus.y]);
          // Start with a point slightly offset from the node so the tooltip
          // does not obscure it.
          let left = pt[0] + 16;
          let top = pt[1] + 16;
          // Clamp the position so the card stays fully visible within the
          // viewport; eight pixels of padding keeps it from kissing edges.
          const margin = 8;
          const w = tooltipDivRef.current.offsetWidth;
          const h = tooltipDivRef.current.offsetHeight;
          left = Math.min(Math.max(margin, left), window.innerWidth - w - margin);
          top = Math.min(Math.max(margin, top), window.innerHeight - h - margin);
          tooltipDivRef.current.style.left = `${left}px`;
          tooltipDivRef.current.style.top = `${top}px`;
        }
      }

      // Tether link tooltip to current mid-point under zoom
      if (linkTooltip.visible && linkTooltipDivRef.current && linkTooltip.key) {
        const l = (filteredLinks || []).find(x => {
          const sid = typeof x.source === 'object' ? x.source?.id : x.source;
          const tid = typeof x.target === 'object' ? x.target?.id : x.target;
          return `${sid}→${tid}` === linkTooltip.key;
        });
  if (l?.source && l?.target) {
          const sx = typeof l.source === 'object' ? l.source.x : 0;
          const sy = typeof l.source === 'object' ? l.source.y : 0;
          const tx = typeof l.target === 'object' ? l.target.x : 0;
          const ty = typeof l.target === 'object' ? l.target.y : 0;
          const x = 0.35 * (sx ?? 0) + 0.65 * (tx ?? 0);
          const y = 0.35 * (sy ?? 0) + 0.65 * (ty ?? 0) - 10;
          const tr = zoomRef.current || d3.zoomIdentity;
          const pt = tr.apply([x, y]);
          linkTooltipDivRef.current.style.left = `${pt[0] + 12}px`;
          linkTooltipDivRef.current.style.top = `${pt[1] + 12}px`;
        }
      }
    });

    setRenderCounts({ nodes: filteredNodes.length, links: filteredLinks.length });
    if (liveStatusRef.current) {
      liveStatusRef.current.textContent = `${filteredNodes.length} nodes and ${filteredLinks.length} links rendered.`;
    }

    // cleanup not removing container/zoom; simulation persists on svg property
    return () => {};
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Visualization error:', e);
    setError(e?.message || String(e));
  } finally {
    // no-op
  }
  }, [filteredNodes, filteredLinks, viewSize]);

  // Idle tour: auto-center on random node every few seconds when idle (skips in tests)
  useEffect(() => {
    const skip = typeof navigator !== 'undefined' && navigator.webdriver;
    if (skip) return;
    const root = svgRef.current;
    if (!root) return;
    const markActive = () => {
      idleTourRef.current.active = true;
      if (idleTourRef.current.timer) { clearTimeout(idleTourRef.current.timer); }
      idleTourRef.current.timer = setTimeout(() => { idleTourRef.current.active = false; }, 6000);
    };
    const resetIdle = () => {
      if (idleTourRef.current.timer) { clearTimeout(idleTourRef.current.timer); }
      idleTourRef.current.timer = setTimeout(() => {
        // Only tour if no tooltip/panel open
        if (!activeMetaRef.current && !tooltip.visible) {
          const pool = filteredNodes || [];
          if (pool.length) {
            const pick = pool[Math.floor(Math.random() * pool.length)];
            // Programmatically center and open ring
            const svg = d3.select(svgRef.current);
            const width = viewSize.width || 1200;
            const height = viewSize.height || 800;
            const k = (zoomRef.current?.k) ?? 1;
            const centerX = width / 2;
            const centerY = height / 2;
            const tx = d3.zoomIdentity.translate(centerX - (pick.x || 0) * k, centerY - (pick.y || 0) * k).scale(k);
            if (zoomBehaviorRef.current) {
              svg.transition().duration(900).ease(d3.easeCubicOut)
                .call(zoomBehaviorRef.current.transform, tx)
                .on('end', () => {
                  // trigger UI
                  activeMetaRef.current = null;
                  // open ring via simulated toggle
                  // eslint-disable-next-line no-unused-expressions
                  pick && (function(){ const event = new Event('click', { bubbles: true }); svgRef.current?.dispatchEvent(event); })();
                });
            }
          }
        }
      }, 12000);
    };
    // Any interaction cancels/defers the tour
    const listeners = ['pointerdown','pointermove','wheel','keydown'].map(evt => {
      const fn = () => { markActive(); resetIdle(); };
      root.addEventListener(evt, fn, { passive: true });
      return { evt, fn };
    });
    resetIdle();
    return () => {
      listeners.forEach(({evt, fn}) => root.removeEventListener(evt, fn));
      if (idleTourRef.current.timer) clearTimeout(idleTourRef.current.timer);
    };
  }, [filteredNodes, tooltip.visible, viewSize]);

  // The earlier build displayed a miniature tree of related nodes inside the
  // tooltip. The current approach removes that extra visualization to keep the
  // card lightweight and focused on a single concept.

  // Until the API responds we show a lightweight loading screen.
  // Accessibility hints (`role`, `aria-*`) keep screen readers informed.
  if (loading) {
    return (
      <div
        className="concept-map-loading"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        {/* CSS-only spinner keeps the bundle small yet signals progress */}
        <div className="concept-map-spinner" />
        <h2>Loading Concept Map...</h2>
        <p>Fetching data...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="concept-map-error">
        <h2>Error Loading Concept Map</h2>
        <p>Error: {error}</p>
        <p>
          Ensure the backend server is reachable. Last endpoint tried:{' '}
          <code>{endpointTried || 'http://127.0.0.1:8080/api/concept-map'}</code>.{' '}
          Also verify CORS allows this origin.
        </p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="concept-map-container" id="main" style={{ position: 'relative' }}>
        {/* The slim header floats above the canvas so the map remains the focus. */}
        <div className="concept-map-header">
          {/* Dropdown to swap datasets without dominating the viewport */}
          {datasets.length > 0 && (
            <select
              id="dataset-select"
              aria-label="Dataset"
              value={selectedDataset || ''}
              onChange={(e) => setSelectedDataset(e.target.value)}
            >
              {datasets.map((ds) => (
                <option key={ds.file} value={ds.file}>{ds.name}</option>
              ))}
            </select>
          )}
          {/* Real-time counts reassure users about the rendered graph size */}
          {data?.metadata && (
            <div className="metadata">
              <span data-testid="rendered-nodes">Nodes: {renderCounts.nodes}</span>
              <span>•</span>
              <span data-testid="rendered-links">Links: {renderCounts.links}</span>
            </div>
          )}
        </div>
        {/* Context legend stays subtle yet informative */}
        {(groups.length > 0 || topRelationLegend.length > 0) && (
          <div className="legend-bar desktop-only">
            {groups.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <strong style={{ marginRight: 4 }}>Levels:</strong>
                {groups.slice(0, 10).map(g => (
                  <span key={g} style={{ display: 'inline-flex', alignItems: 'center', marginRight: 10, fontSize: 12 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: getGroupColor(Number.isFinite(+g) ? +g : 'unknown'), display: 'inline-block', marginRight: 4 }} />
                    {String(g)}
                  </span>
                ))}
              </div>
            )}
            {topRelationLegend.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <strong style={{ marginRight: 4 }}>Relations:</strong>
                {topRelationLegend.map(([k]) => (
                  <span key={k} style={{ display: 'inline-flex', alignItems: 'center', marginRight: 10, fontSize: 12 }}>
                    <span style={{ width: 12, height: 3, borderRadius: 2, background: getRelationColor(k), display: 'inline-block', marginRight: 4 }} />
                    {k}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
        {groups.length > 0 && (
          <div className="filters desktop-only" style={{ background: '#fff', padding: '8px 12px', borderTop: '1px solid #e0e0e0' }}>
      <strong>Levels:</strong>{' '}
            {groups.map(g => (
              <label key={g} style={{ marginRight: 12 }}>
                <input
                  type="checkbox"
          checked={selectedGroups.has(g)}
                  onChange={(e) => {
                    const next = new Set(selectedGroups);
                    if (e.target.checked) next.add(g); else next.delete(g);
                    setSelectedGroups(next);
                  }}
                />{' '}{g}
              </label>
            ))}
          </div>
        )}
      {/* Controls + live status for a11y */}
      <div className="controls" aria-label="Display controls">
        <button type="button" onClick={() => svgRef.current && d3.select(svgRef.current).call(zoomBehaviorRef.current.scaleBy, 1.15)} aria-label="Zoom in">＋</button>
        <button type="button" onClick={() => svgRef.current && d3.select(svgRef.current).call(zoomBehaviorRef.current.scaleBy, 1/1.15)} aria-label="Zoom out">－</button>
        <button type="button" onClick={() => svgRef.current && d3.select(svgRef.current).call(zoomBehaviorRef.current.transform, d3.zoomIdentity)} aria-label="Reset view">Reset</button>
        <span aria-live="polite" aria-atomic="true" ref={liveStatusRef} className="visually-hidden" />
      </div>

      {/* Quick search + surprise me */}
  <div className="desktop-only" style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 8, zIndex: 15 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search node…"
          aria-label="Search node"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const btn = e.currentTarget.nextElementSibling;
              if (btn && typeof btn.click === 'function') btn.click();
            }
          }}
          style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #d1d5db', minWidth: 180 }}
        />
        <button
          onClick={() => {
            const q = search.trim().toLowerCase();
            if (!q) return;
            const found = (filteredNodes || []).find(n => (n.name || n.id || '').toLowerCase().includes(q));
            if (!found) return;
            // center and open ring
            const svg = d3.select(svgRef.current);
            const width = viewSize.width || 1200;
            const height = viewSize.height || 800;
            const k = (zoomRef.current?.k) ?? 1;
            const centerX = width / 2;
            const centerY = height / 2;
            const tx = d3.zoomIdentity.translate(centerX - (found.x || 0) * k, centerY - (found.y || 0) * k).scale(k);
            if (zoomBehaviorRef.current) {
              svg.transition().duration(700).ease(d3.easeCubicOut)
                .call(zoomBehaviorRef.current.transform, tx)
                .on('end', () => {
                  // open meta ring via stateful toggle
                  setDescExpanded(false);
                  setTooltip({ visible: false, x: 0, y: 0, node: null });
                  activeMetaRef.current = null;
                  const sel = document.querySelector(`g.node-group[data-node-id='${CSS.escape(String(found.id))}']`);
                  sel && sel.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                });
            }
          }}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}
        >Go</button>
        <button
          onClick={() => {
            const pool = filteredNodes || [];
            if (!pool.length) return;
            const pick = pool[Math.floor(Math.random() * pool.length)];
            const svg = d3.select(svgRef.current);
            const width = viewSize.width || 1200;
            const height = viewSize.height || 800;
            const k = (zoomRef.current?.k) ?? 1;
            const centerX = width / 2;
            const centerY = height / 2;
            const tx = d3.zoomIdentity.translate(centerX - (pick.x || 0) * k, centerY - (pick.y || 0) * k).scale(k);
            if (zoomBehaviorRef.current) {
              svg.transition().duration(700).ease(d3.easeCubicOut)
                .call(zoomBehaviorRef.current.transform, tx)
                .on('end', () => {
                  const sel = document.querySelector(`g.node-group[data-node-id='${CSS.escape(String(pick.id))}']`);
                  sel && sel.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                });
            }
          }}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}
        >Surprise me</button>
      </div>
      <svg ref={svgRef}></svg>
      {/* Mobile FAB and bottom sheet */}
      <button className="fab mobile-only" aria-label="Open options" onClick={() => setMobilePanelOpen(true)}>☰</button>
      {mobilePanelOpen && (
        <>
          <div className="mobile-panel-backdrop" onClick={() => setMobilePanelOpen(false)} aria-hidden="true" />
          <div className="mobile-panel" role="dialog" aria-modal="true" aria-label="Options and filters" tabIndex={0} onKeyDown={(e)=>{ if(e.key==='Escape') setMobilePanelOpen(false); }}>
            <div className="handle" />
            <div className="content">
              {datasets.length > 0 && (
                <div className="section">
                  <h3>Dataset</h3>
                  {/**
                   * Reuse the same stateful dropdown as the desktop header but
                   * style it for touch.  Constraining the width keeps long
                   * dataset names readable without forcing sideways scrolling.
                   */}
                  <select
                    id="dataset-select-mobile"
                    aria-label="Dataset"
                    value={selectedDataset || ''}
                    onChange={(e) => setSelectedDataset(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8 }}
                  >
                    {datasets.map((ds) => (
                      <option key={ds.file} value={ds.file}>{ds.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {data?.metadata && (
                <div className="section" style={{ fontSize: 14 }}>
                  <h3>Rendered</h3>
                  {/**
                   * Mirror the live node/link counts so mobile users can gauge
                   * graph size without hunting for the desktop-only header.
                   */}
                  <p>Nodes: {renderCounts.nodes} • Links: {renderCounts.links}</p>
                </div>
              )}
              <div className="section">
                <h3>Search</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search node…" aria-label="Search node" style={{ flex: 1, padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8 }} />
                  <button onClick={() => {
                    const q = search.trim().toLowerCase();
                    if (!q) return;
                    const found = (filteredNodes || []).find(n => (n.name || n.id || '').toLowerCase().includes(q));
                    if (!found) return;
                    const svg = d3.select(svgRef.current);
                    const width = viewSize.width || 1200;
                    const height = viewSize.height || 800;
                    const k = (zoomRef.current?.k) ?? 1;
                    const centerX = width / 2;
                    const centerY = height / 2;
                    const tx = d3.zoomIdentity.translate(centerX - (found.x || 0) * k, centerY - (found.y || 0) * k).scale(k);
                    if (zoomBehaviorRef.current) {
                      svg.transition().duration(600).ease(d3.easeCubicOut)
                        .call(zoomBehaviorRef.current.transform, tx)
                        .on('end', () => setMobilePanelOpen(false));
                    }
                  }} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', background: '#fff' }}>Go</button>
                </div>
              </div>

        {groups.length > 0 && (
                <div className="section">
          <h3>Levels</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {groups.map(g => (
                      <label key={g} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f8f8f8', border: '1px solid #eee', padding: '4px 8px', borderRadius: 12 }}>
                        <input
                          type="checkbox"
                          checked={selectedGroups.has(g)}
                          onChange={(e) => {
                            const next = new Set(selectedGroups);
                            if (e.target.checked) next.add(g); else next.delete(g);
                            setSelectedGroups(next);
                          }}
                        />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: getGroupColor(Number.isFinite(+g) ? +g : 'unknown'), display: 'inline-block' }} />
            <span style={{ fontSize: 13 }}>{String(g)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {topRelationLegend.length > 0 && (
                <div className="section">
                  <h3>Relations</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {topRelationLegend.map(([k]) => (
                      <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f8f8f8', border: '1px solid #eee', padding: '4px 8px', borderRadius: 12 }}>
                        <span style={{ width: 12, height: 3, borderRadius: 2, background: getRelationColor(k), display: 'inline-block' }} />
                        <span style={{ fontSize: 13 }}>{k}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="section" style={{ textAlign: 'right' }}>
                <button onClick={() => setMobilePanelOpen(false)} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #ddd', background: '#fff' }}>Close</button>
              </div>
            </div>
          </div>
        </>
      )}
      {/* Lightweight node tooltip that follows the cursor */}
      {hoverInfo.visible && hoverInfo.node && (
        <div
          style={{
            position: 'absolute',
            left: hoverInfo.x + 12,
            top: hoverInfo.y + 12,
            background: 'rgba(255,255,255,0.95)',
            border: '1px solid #e0e0e0',
            borderRadius: 6,
            padding: '6px 8px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            pointerEvents: 'none', // let mouse events reach the SVG beneath
            zIndex: 8
          }}
          role="tooltip"
        >
          <div style={{ fontWeight: 600, fontSize: 13 }}>{hoverInfo.node.name || hoverInfo.node.id}</div>
          {hoverInfo.node.description && (
            <Markdown
              text={hoverInfo.node.description}
              style={{ fontSize: 12, color: '#444', marginTop: 2 }}
            />
          )}
        </div>
      )}
      {/* Link tooltip on hover */}
      {linkTooltip.visible && linkTooltip.data && (
        <div
          ref={linkTooltipDivRef}
          style={{
            position: 'absolute',
            left: linkTooltip.x + 12,
            top: linkTooltip.y + 12,
            background: 'rgba(255,255,255,0.98)',
            border: '1px solid #e0e0e0',
            borderRadius: 8,
            padding: '10px 12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            maxWidth: 360,
            zIndex: 9
          }}
          onMouseEnter={() => setLinkTooltip(prev => ({ ...prev, visible: true }))}
          onMouseLeave={() => setLinkTooltip(prev => ({ ...prev, visible: false }))}
          aria-live="polite"
          role="tooltip"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{
              display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
              background: getRelationColor(linkTooltip.data.type)
            }} />
            <strong style={{ fontSize: 14 }}>
              {nodeNameById.get(linkTooltip.data.source) || linkTooltip.data.source}
              {' '}
              <span style={{ color: '#888' }}>→</span>
              {' '}
              {nodeNameById.get(linkTooltip.data.target) || linkTooltip.data.target}
            </strong>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: '#555' }}>{linkTooltip.data.type}</span>
          </div>
          {linkTooltip.data.description && (
            <Markdown
              text={linkTooltip.data.description}
              style={{ margin: '4px 0 6px 0', color: '#333', fontSize: 13 }}
            />
          )}
          {linkTooltip.data.pedagogical_reasoning && (
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontWeight: 600, fontSize: 12, color: '#444' }}>Why it matters</div>
              <Markdown
                text={linkTooltip.data.pedagogical_reasoning}
                style={{ fontSize: 12, color: '#333' }}
              />
            </div>
          )}
          {linkTooltip.data.cognitive_bridge && (
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontWeight: 600, fontSize: 12, color: '#444' }}>Cognitive bridge</div>
              <Markdown
                text={linkTooltip.data.cognitive_bridge}
                style={{ fontSize: 12, color: '#333' }}
              />
            </div>
          )}
          {/* Render any array-based details generically */}
          {(() => {
            const base = new Set(['source','target','type','strength','label','relationshipType','description','pedagogical_reasoning','cognitive_bridge']);
            const entries = Object.entries(linkTooltip.data).filter(([k, v]) => Array.isArray(v) && !base.has(k));
            return entries.map(([k, arr]) => (
              <div key={k} style={{ marginBottom: 6 }}>
                <div style={{ fontWeight: 600, fontSize: 12, color: '#444' }}>{k.replace(/_/g, ' ')}</div>
                <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                  {arr.map((item) => (
                    <li key={String(item)} style={{ fontSize: 12, color: '#333' }}>{item}</li>
                  ))}
                </ul>
              </div>
            ));
          })()}
        </div>
      )}
      {/* Tooltip focused on title and description */}
      {tooltip.visible && tooltip.node && (
        <div
          ref={tooltipDivRef}
          data-testid="node-tooltip"
          /*
           * Visually this container resembles a small card.  Cards are a
           * familiar pattern across mobile and desktop UIs, so reusing the
           * style makes the tooltip feel instantly recognisable and polished.
           */
          style={{
            position: 'absolute',
            left: tooltip.x + 16,
            top: tooltip.y + 16,
            background: 'rgba(255,255,255,0.98)',
            border: '1px solid #e0e0e0',
            borderRadius: 8,
            padding: '12px 14px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            maxWidth: 280,
            zIndex: 10
          }}
          role="dialog"
          aria-modal="true"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setDescExpanded(false);
              setTooltip({ visible: false, x: 0, y: 0, node: null });
            }
          }}
          onDoubleClick={e => e.stopPropagation()}
        >
          {/* Close control – always give users a clear escape hatch */}
          <button
            onClick={() => {
              setDescExpanded(false);
              setTooltip({ visible: false, x: 0, y: 0, node: null });
            }}
            style={{
              position: 'absolute',
              top: 4,
              right: 6,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 18
            }}
            aria-label="Close"
            title="Close"
          >
            ×
          </button>

          {/* Title: short and bold so it anchors the user's attention */}
          <div
            style={{
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: 16,
              marginBottom: 8,
              color: '#111'
            }}
          >
            {tooltip.node.name || tooltip.node.id}
          </div>

          {/*
           * Description: initially collapsed to a two‑line preview.  A
           * dedicated button lets touch users expand it without needing a
           * precise gesture.  The button toggles via aria-expanded for screen
           * readers.
           */}
          {tooltip.node.description && (
            <div style={{ textAlign: 'center' }}>
              <Markdown
                text={tooltip.node.description}
                style={{
                  margin: 0,
                  color: '#444',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: descExpanded ? 'unset' : 2,
                  WebkitBoxOrient: 'vertical'
                }}
              />
              {tooltip.node.description.length > 120 && (
                <button
                  onClick={() => setDescExpanded(prev => !prev)}
                  aria-expanded={descExpanded}
                  style={{
                    marginTop: 8,
                    padding: '6px 12px',
                    fontSize: 13,
                    borderRadius: 6,
                    border: '1px solid #d1d5db',
                    background: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  {descExpanded ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>
          )}
        </div>
      )}
      {/* Legacy info panel fallback, kept for compatibility */}
      <div id="info-panel" style={{ marginTop: 12, fontSize: 14, color: '#333' }} />
    </div>
  );
};

export default ConceptMapVisualization;
