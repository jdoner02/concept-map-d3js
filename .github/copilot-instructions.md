# Copilot Instructions for Concept Map D3.js Project

## Architecture Overview

This is a full-stack concept map visualization application with:
- **Backend**: Spring Boot 3.5.4 + Java 17 serving JSON data via REST API
- **Frontend**: React + Vite + D3.js for interactive force-directed graph visualization
- **Data**: Static concept-map.json (3500+ lines) with educational metadata
- **Testing**: JUnit (backend) + Playwright (frontend E2E) + TDD methodology
- **Database**: SQLite with JPA/Hibernate (models exist for future database-driven mode)
- **Quality Assurance**: Comprehensive Test Guardian framework with 90%+ coverage target

## Key Workflows

### Development Setup
```bash
# Start both backend (8080) and frontend (5173) concurrently
./scripts/dev.sh
```
The dev script auto-installs frontend deps, starts Spring Boot backend, then Vite dev server, and opens browser.

### Testing
```bash
# Backend tests (JUnit with 95%+ coverage)
./mvnw test

# Frontend E2E tests (Playwright)
cd frontend && npm run test:e2e
```

## Critical Architecture Patterns

### Backend Data Flow
1. **Controller**: `ConceptMapController` serves static JSON from `src/main/resources/concept-map.json`
2. **Service Layer**: `ConceptMapService` provides JSON parsing capabilities for future database integration
3. **Models**: JPA entities (`ConceptMap`, `Node`, `Link`, `Metadata`) exist for future database-driven mode
4. **Current Mode**: Static file serving (database models ready for migration when needed)
5. **CORS**: Configured in `CorsConfig` for localhost:5173 frontend access
6. **Error Handling**: Deterministic JSON responses for 404/500 scenarios

### Frontend D3.js Integration
- **Entry Point**: `ConceptMapVisualization.jsx` fetches data and orchestrates D3 rendering
- **Force Graph**: `d3/forceGraph.js` exports reusable simulation functions (`createSimulation`, `addArrowhead`, `computeNodeRadius`)
- **Interactions**: Drag nodes, double-click for details panel, zoom/pan with mouse wheel
- **No State Management**: Direct D3 DOM manipulation within React useEffect

### Data Structure Pattern
The concept-map.json follows this schema:
```json
{
  "metadata": { "version", "total_nodes", "total_links", ... },
  "nodes": [{ "id", "name", "description", "category", ... }],
  "links": [{ "source", "target", "label", "description", ... }]
}
```

## Project-Specific Conventions

### Java Code Style
- **Package Structure**: `edu.ewu.cscd211.conceptmap.{controller,model,service,config}`
- **JPA Patterns**: Use `@Entity`, `@OneToMany` cascade, proper validation with `@Valid`
- **Error Responses**: Always return JSON with `{"error": "message"}` format

### CSCD211 Programming Standards (CRITICAL - Must Follow)

#### Defensive Programming Practices
- **Constructor Validation**: All constructors MUST validate parameters with null checks and domain validation
- **Parameter Finality**: Mark method parameters as `final` when they shouldn't be reassigned
- **Field Access**: Use `this.fieldName` for field access to avoid ambiguity (never just `fieldName`)
- **Immutable Objects**: Prefer immutable objects where possible; use defensive copying for mutable fields
- **Null Safety**: Always check for null parameters and throw `IllegalArgumentException` with descriptive messages

#### Object-Oriented Design Principles
- **Encapsulation**: Private fields with public getters/setters only when needed
- **Single Responsibility**: Each class should have one clear purpose
- **Constructor Overloading**: Provide multiple constructors for different use cases
- **Protected Default Constructors**: Use `protected` default constructors for JPA entities
- **Proper equals/hashCode**: Always override both together, use `Objects.equals()` and `Objects.hash()`

#### SOLID Principles Implementation
- **S (Single Responsibility)**: Controllers handle HTTP, Services handle business logic, Models represent data
- **O (Open/Closed)**: Design for extension through interfaces and inheritance
- **L (Liskov Substitution)**: Subclasses must be substitutable for their base classes
- **I (Interface Segregation)**: Create focused, specific interfaces rather than large general ones
- **D (Dependency Inversion)**: Depend on abstractions (interfaces) not concrete implementations

#### DRY (Don't Repeat Yourself) Patterns
- **Constants**: Use `private static final` constants for repeated string literals and magic numbers
- **Helper Methods**: Extract common logic into private helper methods
- **Validation Methods**: Create reusable validation methods for common checks
- **Exception Messages**: Use constants for repeated exception messages

#### Method Design Standards
- **Parameter Validation**: Every public method must validate its parameters
- **Return Value Contracts**: Document and enforce what methods return (never null unless documented)
- **Method Naming**: Use descriptive verb-noun combinations (`parseMetadata`, `validateNode`)
- **Exception Handling**: Throw appropriate exception types with descriptive messages

#### Testing Requirements (TDD Approach)
- **Nested Test Classes**: Organize tests with `@Nested` classes (`ConstructorTests`, `GetterTests`, etc.)
- **Descriptive Test Names**: Use `@DisplayName` with clear, readable descriptions
- **Comprehensive Coverage**: Test happy path, edge cases, and error conditions
- **Assert Messages**: Use `assertAll()` with descriptive messages for multiple assertions

### React/D3 Integration
- **No React State for D3**: D3 manages SVG DOM directly in `useEffect`
- **Modular D3**: Extract reusable functions to `d3/forceGraph.js` module
- **Force Parameters**: Use specific values (charge: -400, link distance: 150) for optimal layout

### Testing Patterns
- **TDD Methodology**: Red-Green-Refactor cycle with comprehensive test coverage (89% instruction, 81% branch)
- **Backend**: Comprehensive unit tests with nested test classes (`ConstructorTests`, `GetterTests`, etc.)
- **Frontend**: Functional E2E tests that wait for DOM elements, test user interactions (drag, click)
- **Test Guardian Framework**: Automated testing infrastructure in `_Test_Guardian_Homebase/`
- **Target Coverage**: 90%+ test coverage with detailed reporting in `logs/test_coverage.md`
- **Test Data**: Tests validate against the actual concept-map.json structure

## External Dependencies

### Critical Integration Points
- **D3.js v7.9.0**: Force simulation, zoom behavior, SVG manipulation
- **Spring Boot**: Auto-configuration, embedded Tomcat, static resource serving
- **Playwright**: Browser automation for E2E testing with viewport size considerations
- **Maven Wrapper**: Use `./mvnw` for consistent Java builds across environments

### Data Validation Tool
The `_Test_Guardian_Homebase/TOOLING/validate_concept_map_nodes.py` script ensures JSON integrity:
- **CLI Usage**: `python validate_concept_map_nodes.py concept-map.json [--check-orphans] [--fix] [--backup]`
- **Features**: Validates link references, detects orphaned nodes, auto-fixes missing nodes
- **Integration**: Part of Test Guardian framework with 69% test coverage
- **Backup System**: Creates timestamped backups before modifications
- **Current Status**: All 55 nodes referenced in 146 links exist (perfect data integrity)

## Development Tips

### When Adding New Features
1. **Backend**: Add endpoints to `ConceptMapController`, create JPA entities in `model/`
2. **Frontend**: Extend D3 interactions in `ConceptMapVisualization.jsx`, extract complex logic to `d3/` modules
3. **Testing**: Add both unit tests (backend) and E2E scenarios (frontend) covering user workflows
4. **Data Integrity**: Run validation tool after modifying concept-map.json
5. **Coverage Target**: Maintain 90%+ test coverage following TDD methodology
6. **Code Quality**: Follow all CSCD211 programming standards above - defensive programming, SOLID principles, and proper OOP design

### Code Review Checklist for CSCD211 Standards
- [ ] All constructor parameters validated with appropriate exception messages
- [ ] Field access uses `this.fieldName` syntax consistently
- [ ] Method parameters marked `final` where appropriate
- [ ] Constants used for string literals and magic numbers
- [ ] Proper equals/hashCode implementation using `Objects` utility methods
- [ ] Comprehensive parameter validation in all public methods
- [ ] Descriptive exception messages with specific problem descriptions
- [ ] Single responsibility maintained in all classes and methods
- [ ] Test coverage includes constructor validation, getter behavior, edge cases, and error conditions

### Common Pitfalls
- **CORS Issues**: Ensure `CorsConfig` allows frontend origin for new endpoints
- **D3 Memory Leaks**: Always call `svg.selectAll('*').remove()` before re-rendering
- **Test Timing**: Use `page.waitForSelector()` in Playwright tests, avoid hardcoded delays
- **JSON Structure**: Changes to concept-map.json may break D3 rendering - validate with Python tool first

### File Organization
- **Keep D3 logic in `frontend/src/components/d3/`** - separate from React components
- **Backend models in `src/main/java/.../model/`** - follow JPA conventions
- **Static resources in `src/main/resources/`** - Spring Boot will serve automatically
