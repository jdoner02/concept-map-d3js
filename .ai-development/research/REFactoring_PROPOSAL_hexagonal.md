# Refactoring Proposal: Hexagonal Architecture (Ports & Adapters) for Concept Map D3.js

Executive Summary
- Adopt a ports-and-adapters structure incrementally, preserving current behavior (Open/Closed Principle).
- Isolate domain and use cases from web/IO concerns; introduce input/output ports for data access and serving.
- Frontend: treat D3 as an adapter; React orchestrates, D3 owns SVG; standardize feature-folder + barrel files.
- Testing: keep current suites; add golden-master checks for controller JSON and D3 render invariants.

Why now
- Clear boundaries enable safer enhancements (DB mode, alternate data sources) without breaking existing UI.
- Improves testability, coverage, and maintainability.

Sources (selected)
- Wikipedia: Hexagonal Architecture; Open–closed principle.
- Alistair Cockburn: Ports and Adapters.
- Baeldung (2025): package-info.java usage for package docs/annotations.
- Playwright best practices: auto-waiting; avoid hard waits.
- React structure 2025 guidance: feature-based + barrel files; services modules; absolute imports.
- MapStruct DTO mapping (compile-time, type-safe) for future DB-backed mode.

Backend target structure (Java / Spring Boot)
- edu.ewu.cscd211.conceptmap.domain
  - model/ (Node, Link, Metadata, ConceptMap)
  - port/
    - in/ (UseCases)
    - out/ (ConceptMapReader)
  - service/ (UseCase implementations)
  - package-info.java (Javadoc + @NonNullApi)
- edu.ewu.cscd211.conceptmap.adapters
  - in/web/ (REST controllers)
  - out/filesystem/ (Resource loader-based reader)
  - out/sqlite/ (future JPA repository-based reader)
- edu.ewu.cscd211.conceptmap.config (CorsConfig, Jackson, exception mappers)

Frontend target structure (React + Vite + D3)
- src/
  - features/conceptMap/
    - components/ (ConceptMapVisualization)
    - d3/ (forceGraph.js, helpers)
    - api/ (client to /api/concept-map)
    - index.ts (barrel)
  - lib/ (shared utils)
  - styles/

Testing
- Backend: keep existing JUnit; introduce port-level tests; maintain deterministic error JSON.
- Frontend: Playwright E2E; avoid hard waits; web-first assertions; D3 DOM probes via data-testid.

Migration plan
- 1) Add ports and adapters alongside existing classes; wire controller to port.
- 2) Move filesystem JSON read into an adapter implementing ConceptMapReader.
- 3) Keep existing models intact; document packages with package-info.java.
- 4) Frontend: add feature folder and barrel; keep current import paths working.
- 5) Coverage gate >=90% maintained.

UML-like interface contracts (abridged)
- port.out.ConceptMapReader
  - ConceptMap load();
- port.in.GetConceptMapUseCase
  - ConceptMapDto execute();
- adapters.out.filesystem.ResourceConceptMapReader implements ConceptMapReader
  - reads classpath resource; throws DomainNotFound mapped to 404 JSON.

Notes
- No behavioral changes; only internal redirections.
- Future: MapStruct for DTOs; database adapter; caching port.
