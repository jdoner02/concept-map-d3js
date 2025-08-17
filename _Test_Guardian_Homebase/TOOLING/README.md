# Concept Map Node Validation Tool

## Overview

The `validate_concept_map_nodes.py` script ensures data integrity in concept map JSON files by validating that all nodes referenced in source/target relationships exist as actual node definitions, and provides functionality to automatically create missing nodes when needed.

## Features

- **Node Validation**: Checks that all link source/target IDs have corresponding node definitions
- **Orphan Detection**: Identifies nodes that are defined but never referenced in links
- **Auto-Fix**: Automatically creates minimal placeholder nodes for missing references
- **Backup Creation**: Creates timestamped backups before modifications
- **Metadata Updates**: Updates metadata fields when fixing issues
- **Comprehensive Testing**: 69% test coverage with unit, integration, and error handling tests

## Usage

### Command Line Interface

```bash
# Basic validation
python validate_concept_map_nodes.py path/to/concept-map.json

# Check for orphaned nodes
python validate_concept_map_nodes.py path/to/concept-map.json --check-orphans

# Auto-fix missing nodes
python validate_concept_map_nodes.py path/to/concept-map.json --fix

# Auto-fix with backup
python validate_concept_map_nodes.py path/to/concept-map.json --fix --backup
```

### Python API

```python
import validate_concept_map_nodes as validator

# Validate concept map
is_valid = validator.validate_concept_map("concept-map.json")

# Find missing nodes
missing = validator.get_missing_nodes("concept-map.json")

# Find orphaned nodes
orphaned = validator.find_orphaned_nodes("concept-map.json")

# Auto-fix missing nodes
success = validator.auto_fix_concept_map("concept-map.json", create_backup=True)

# Create minimal node template
node = validator.create_minimal_node("node-id", "Node Name")
```

## File Structure

```
_Test_Guardian_Homebase/TOOLING/
├── validate_concept_map_nodes.py     # Main validation script
└── tests/
    ├── test_concept_map_validator.py  # Comprehensive unit tests
    └── test_integration.py            # Integration tests with real data
```

## Test Coverage

The validation tool has comprehensive test coverage (69%) including:

- **Basic Validation Tests**: Valid/invalid concept maps, missing files, malformed JSON
- **Auto-Fix Tests**: Missing node creation, existing node preservation, backup creation
- **Helper Function Tests**: Orphan detection, missing node identification, error handling
- **Metadata Tests**: Metadata updates, fix history tracking
- **Integration Tests**: Real concept-map.json validation and statistics

### Running Tests

```bash
# Run all tests
cd _Test_Guardian_Homebase/TOOLING
python -m pytest tests/ -v

# Run with coverage
python -m pytest tests/ --cov=validate_concept_map_nodes --cov-report=term-missing

# Run integration test
python tests/test_integration.py
```

## Auto-Generated Node Format

When auto-fixing missing nodes, the tool creates placeholder nodes with the following structure:

```json
{
  "id": "missing-node-id",
  "name": "Missing Node Id",
  "description": "Auto-generated placeholder node for Missing Node Id. This node was created automatically to resolve missing references and should be manually updated with proper content.",
  "group": "auto-generated",
  "level": 1,
  "size": 8,
  "auto_generated": true,
  "creation_timestamp": "2025-08-16T14:38:19Z",
  "status": "placeholder"
}
```

## Metadata Updates

When fixing issues, the tool updates metadata fields:

- `total_nodes`: Updated to reflect new node count
- `last_updated`: Set to current timestamp
- `fix_history`: Array of fix operations with details

## Error Handling

The tool gracefully handles various error conditions:

- Missing or inaccessible files
- Malformed JSON
- Permission errors during file operations
- Missing metadata sections

## Integration with Project

The validation tool is specifically designed for the concept-map-d3js project and:

- Works with the concept-map.json file in `src/main/resources/`
- Follows TDD principles with comprehensive test coverage
- Maintains data integrity for the D3.js visualization
- Provides both interactive and automated validation workflows

## Current Status

Based on the latest validation of the project's concept-map.json file:

- ✅ **55 nodes** defined
- ✅ **146 links** connecting nodes
- ✅ **All referenced nodes exist** (no missing nodes)
- ✅ **No orphaned nodes** found
- ✅ **No auto-generated nodes** present
- ✅ **Data integrity confirmed**

The concept map is currently in excellent condition with perfect referential integrity.

## Maintenance

This tool is part of the Test Guardian Agent's responsibilities and follows TDD principles:

1. **Red**: Write failing tests for new functionality
2. **Green**: Implement minimal code to pass tests
3. **Refactor**: Improve code quality while maintaining all tests

For any issues or enhancements, run the comprehensive test suite to ensure no regressions are introduced.
