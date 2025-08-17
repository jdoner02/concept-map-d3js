# Refactoring Plan: Hexagonal Architecture, SOLID, and DRY

This plan describes how to iteratively refactor the Concept Map project into a cleaner, modular, and testable structure using Hexagonal Architecture (Ports and Adapters) while honoring the Open/Closed Principle (no breaking changes to existing behavior).

## Goals

- Preserve existing behavior and public APIs; add new abstractions alongside existing code.
- Introduce clear boundaries between domain, application (use cases), and infrastructure.
- Improve modularity on both backend (Spring Boot) and frontend (React + Vite + D3).
- Increase testability with focused units and higher coverage, keeping E2E tests stable.
- Establish naming conventions and file organization aligned with industry standards.

## Backend (Spring Boot) — Hexagonal Layers

- Domain (core): Pure Java domain models, value objects, and domain services.
  - Package: `edu.ewu.cscd211.conceptmap.domain.*`
  - Entities: `ConceptMap`, `Node`, `Link`, `Metadata` remain but migrate to `domain.model` when feasible (keep old package until adapters are ready).
  - Domain services: Parsing, validation, and invariants as pure logic with tests.
- Application (use cases): Orchestrate domain services; no framework dependencies.
  - Package: `edu.ewu.cscd211.conceptmap.application.*`
  - Use cases: `LoadConceptMap`, `ValidateConceptMap`, etc. Expose `ports` as Java interfaces.
- Ports (interfaces): Define boundaries the domain/application depend on.
  - Inbound ports: what the application offers (e.g., `GetConceptMapQuery`).
  - Outbound ports: what the application needs (e.g., `ConceptMapReader` to read JSON/DB).
- Adapters (infrastructure): Framework details implementing ports.
  - Web adapters: Spring MVC controllers implementing inbound ports.
  - Persistence adapters: JSON file reader, future DB repositories for outbound ports.
  - Package: `edu.ewu.cscd211.conceptmap.adapters.{web,persistence}`

### Initial Backend Steps (non-breaking)

1. Define ports
   - `application.port.in.GetConceptMapQuery` (method: `ConceptMapDto get()`)
   - `application.port.out.ReadConceptMapPort` (method: `ConceptMapDto read()`)
   - DTOs under `application.dto` to decouple from JPA/domain entities.
2. Implement adapters next to existing code
   - Web adapter that maps `/api/concept-map` but delegates to `GetConceptMapQuery` rather than directly to service; keep existing controller intact until adapter is validated, then wire it in via Spring config.
   - File adapter implementing `ReadConceptMapPort` that reads `concept-map.json` (wrap existing `ConceptMapService` logic without changing it).
3. Composition
   - Spring `@Configuration` to wire port implementations; keep existing beans so current endpoints continue working (feature flag or bean qualifier to switch).
4. Tests
   - Unit tests for ports/adapters with mocks; integration test assures endpoint output unchanged (Golden Master snapshot of JSON, tolerant to whitespace).

## Frontend (React + Vite + D3) — Modularity and Barrels

- Feature-based structure with barrels (index files) to reduce import noise.
- Domain (pure TypeScript types and helpers) separate from UI and D3.
- Adapters for API access and environment concerns.

Recommended structure under `frontend/src/`:

- `domain/`
  - `types/` (Node, Link, ConceptMap types)
  - `logic/` (pure functions: compute node radius, validators)
  - `index.ts` (barrel re-exports)
- `application/`
  - `usecases/` (fetchConceptMap.ts: orchestrates adapters and domain)
  - `index.ts`
- `adapters/`
  - `http/` (apiClient.ts, conceptMapApi.ts)
  - `d3/` (forceGraph.ts split by responsibility: simulation, markers, interactions)
  - `index.ts`
- `components/`
  - `ConceptMapVisualization/` (component + hooks; D3 manipulates within effect)
  - `common/` (Buttons, Panels)
  - `index.ts`

Notes:
- Use `index.ts` barrels per folder for ergonomic imports: `import { createSimulation } from "@/adapters/d3"`.
- Keep D3 DOM mutations isolated; React state remains for UI only (details panel open, selection).
- Add unit tests for pure functions (domain/logic) and Playwright tests remain as E2E.

## Naming Conventions

- Java packages: lower-case, layered by hexagonal role: `application.port.in`, `application.port.out`, `adapters.web`, `adapters.persistence`, `domain.model`.
- Java files: nouns for models, verbs for use cases (e.g., `LoadConceptMap`), `*Port` suffix for ports, `*Adapter` for adapters.
- TypeScript: kebab-case files, PascalCase components, barrel `index.ts` per folder.
- DTOs: `ConceptMapDto`, `NodeDto`, `LinkDto` for API payloads.

## Iterative Plan (safe, OCP-friendly)

1. Baseline snapshot
   - Use `scripts/snapshot_repo_tree.py` to record structure (already added).
2. Introduce ports and DTOs (no behavior change)
   - Add interfaces and DTOs; write unit tests.
3. Wrap existing service as an adapter
   - Implement `ReadConceptMapPort` by delegating to current `ConceptMapService`.
4. Add a web adapter
   - New controller delegates to inbound port; temporarily mounted at `/api/hex/concept-map`.
5. Wire via Spring config
   - Create configuration to compose adapter + use case; add feature flag to switch endpoints.
6. Frontend structure
   - Extract `domain/types` and `adapters/http` without changing behavior; add barrels.
7. D3 modularization
   - Split `forceGraph.ts` into `simulation.ts`, `markers.ts`, `interactions.ts` with a small `index.ts` barrel. Keep existing entry API stable.
8. Tests and coverage
   - New unit tests for split logic; keep Playwright tests green.
9. Incremental endpoint swap
   - Move `/api/concept-map` to the new adapter when parity proven by Golden Master tests.

## Package-level Documentation

- Add `package-info.java` files to each package explaining purpose and dependencies.
- Short README per major frontend folder describing barrels and responsibilities.

## Risks and Mitigations

- Risk: Regressions during wiring.
  - Mitigation: Golden Master tests against JSON output; keep both paths during transition.
- Risk: Import churn in frontend.
  - Mitigation: Barrels ensure import stability; deprecate old paths with codemods.

## Done Criteria

- No changes to public responses or UI behavior.
- New structure in place with ports/adapters; old services remain intact or are wrapped.
- Tests pass with >=90% coverage target intact.
- Documentation and barrels present; snapshot shows clearer hierarchy.
