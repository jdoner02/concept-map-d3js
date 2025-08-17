# E2E Test Structure

This directory contains the refactored End-to-End test suite for the Concept Map D3.js application, organized following CSCD211 software engineering principles.

## Architecture Overview

The tests are organized using a **feature-based structure** with the following benefits:
- **Single Responsibility**: Each test file focuses on one functional area
- **DRY Principle**: Shared utilities and page objects eliminate code duplication
- **Modular Design**: Easy to extend and maintain
- **Clear Separation of Concerns**: Tests, utilities, and data are properly separated

## Directory Structure

```
tests/
├── e2e/                           # Feature-based E2E tests
│   ├── core/                      # Core functionality tests
│   │   ├── loading.spec.ts        # Basic loading and rendering
│   │   └── data-loading.spec.ts   # Data integration and JSON handling
│   ├── interactions/              # User interaction tests
│   │   └── user-interactions.spec.ts  # Zoom, pan, click, drag operations
│   ├── ui-components/             # UI component tests
│   │   └── panels-and-tooltips.spec.ts  # Tooltips, panels, meta rings
│   ├── data-validation/           # Data integrity tests
│   │   └── data-integrity.spec.ts # Metadata validation, node sizing
│   └── index.ts                   # Barrel export
├── page-objects/                  # Page Object Models
│   ├── ConceptMapPage.ts          # Main page object for concept map
│   └── index.ts                   # Barrel export
├── fixtures/                      # Test data and constants
│   ├── testData.ts                # Test constants, minimal datasets
│   └── index.ts                   # Barrel export
├── utils/                         # Shared utilities
│   ├── testHelpers.ts             # Helper functions and utilities
│   └── index.ts                   # Barrel export
└── e2e.concept-map.spec.ts.backup # Original monolithic test (backup)
```

## Key Components

### Page Object Model
`ConceptMapPage.ts` provides a clean API for interacting with the concept map:
- Encapsulates DOM queries and interactions
- Provides descriptive method names (`doubleClickFirstNode`, `zoomIn`, etc.)
- Handles viewport management and timing
- Implements defensive programming practices

### Test Data & Fixtures
`testData.ts` contains:
- Minimal test datasets for isolated testing
- Viewport configurations for responsive testing
- Timeout constants for reliable timing
- CSS selectors and test IDs for consistent element selection

### Utilities
`testHelpers.ts` provides:
- Safe parsing functions with error handling
- Statistical calculation utilities
- Timing and validation helpers
- Following CSCD211 defensive programming standards

## Test Categories

### Core Functionality
- Application loading and basic rendering
- Metadata display verification
- Console error detection
- Data loading from various sources

### User Interactions
- Zoom and pan operations
- Node clicking and selection
- Double-click behaviors
- Background interaction handling

### UI Components
- Tooltip appearance and behavior
- Panel opening and closing
- Meta ring interactions
- Responsive design validation

### Data Validation
- Metadata counter accuracy
- Node sizing algorithms
- Link connectivity validation
- Visual consistency checks

## Running Tests

```bash
# Run all new E2E tests
npm run test:e2e

# Run specific test categories
npx playwright test tests/e2e/core/
npx playwright test tests/e2e/interactions/
npx playwright test tests/e2e/ui-components/
npx playwright test tests/e2e/data-validation/

# Run specific test files
npx playwright test tests/e2e/core/loading.spec.ts

# Run with browser UI for debugging
npx playwright test tests/e2e/ --headed
```

## Migration Notes

The refactoring maintains **100% backward compatibility** with the existing test coverage while improving:
- **Maintainability**: Smaller, focused test files
- **Reusability**: Shared utilities and page objects
- **Extensibility**: Easy to add new test categories
- **Debugging**: Clear separation makes issues easier to isolate

The original monolithic test file is preserved as `e2e.concept-map.spec.ts.backup` for reference.

## Standards Compliance

This refactoring follows:
- **CSCD211 Programming Standards**: Defensive programming, parameter validation, clear naming
- **SOLID Principles**: Single responsibility, open/closed, dependency inversion
- **DRY Principle**: No code duplication across test files
- **Industry Best Practices**: Page Object Model, feature-based organization, barrel exports
