# Concept Map JSON Schema Contract

## Overview
This document defines the standardized interface contract for concept map data files. All JSON files must conform to this schema to ensure compatibility with D3.js visualization and programmatic generation.

## Schema Version
**Current Version**: 1.0  
**Last Updated**: August 16, 2025

## JSON Structure Requirements

### Root Object
```json
{
  "metadata": { ... },     // Required: File metadata
  "nodes": [ ... ],        // Required: Array of concept nodes
  "links": [ ... ]         // Required: Array of relationships
}
```

### Metadata Object
```json
{
  "version": "1.0",                          // Required: Schema version
  "created": "2025-08-16T12:00:00Z",        // Required: ISO 8601 date
  "description": "Brief file description",   // Required: Max 200 characters
  "last_modified": "2025-08-16T12:00:00Z",  // Optional: ISO 8601 date
  "author": "Documentation Curator Agent",   // Optional: Creator identification
  "total_nodes": 5,                          // Auto-calculated: Node count
  "total_links": 4                           // Auto-calculated: Link count
}
```

### Node Object (Required Fields)
```json
{
  "id": "kebab-case-identifier",             // Required: Unique, lowercase, hyphenated
  "name": "Human Readable Display Name",     // Required: 1-50 characters
  "group": "category-name"                   // Required: Visual grouping category
}
```

### Node Object (Optional Fields)
```json
{
  "description": "Brief concept description", // Optional: 1-200 characters, for tooltips
  "level": 2,                                // Optional: Hierarchy level (0-5)
  "size": 15,                                // Optional: Visual size weight (5-30)
  "color": "#ff6b6b",                        // Optional: Custom color override
  "fixed": false,                            // Optional: Fixed position in layout
  "x": 100,                                  // Optional: X coordinate if fixed
  "y": 200                                   // Optional: Y coordinate if fixed
}
```

### Link Object (Required Fields)
```json
{
  "source": "source-node-id",               // Required: Must match existing node id
  "target": "target-node-id",               // Required: Must match existing node id
  "type": "prerequisite"                    // Required: Relationship type (see below)
}
```

### Link Object (Optional Fields)
```json
{
  "strength": 0.8,                          // Optional: Link strength (0.1-1.0)
  "distance": 50,                           // Optional: Preferred link distance
  "description": "Relationship explanation" // Optional: 1-100 characters
}
```

## Standardized Values

### Node Groups (Categories)
- `"course"` - Academic courses (CSCD211, MATH101)
- `"concept"` - Abstract programming concepts (OOP, recursion)
- `"skill"` - Practical abilities (debugging, testing)
- `"language"` - Programming languages (Java, Python)
- `"tool"` - Development tools (IDE, Git)
- `"paradigm"` - Programming paradigms (functional, procedural)
- `"structure"` - Data structures (array, linked list)
- `"algorithm"` - Algorithms (sorting, searching)

### Relationship Types
- `"prerequisite"` - Source must be learned before target
- `"enables"` - Source knowledge unlocks/enables target
- `"related"` - Conceptual connection, no strict ordering
- `"part-of"` - Source is a component/part of target
- `"implements"` - Source is an implementation of target
- `"uses"` - Source uses/depends on target

### Hierarchy Levels
- `0` - Root concepts (courses, major paradigms)
- `1` - Primary concepts (main course topics)
- `2` - Supporting concepts (detailed implementations)
- `3` - Specific techniques (detailed methods)
- `4` - Implementation details (specific syntax)
- `5` - Micro-concepts (individual operators, keywords)

## ID Naming Conventions

### Format Rules
- **Case**: All lowercase
- **Separators**: Use hyphens (-) only
- **Length**: 3-30 characters
- **Characters**: Letters, numbers, hyphens only
- **Start/End**: Must start and end with letter or number

### Examples
✅ **Good IDs**:
- `"cscd211"`
- `"object-oriented-programming"`
- `"java-inheritance"`
- `"while-loop"`
- `"junit-testing"`

❌ **Bad IDs**:
- `"CSCD211"` (uppercase)
- `"object_oriented_programming"` (underscores)
- `"OOP"` (acronym without expansion)
- `"java-inheritance-"` (ends with hyphen)
- `"very-long-concept-name-that-exceeds-reasonable-length"` (too long)

## Validation Rules

### Node Validation
1. All node IDs must be unique within the file
2. Node names must be unique within the same group
3. All required fields must be present and non-empty
4. All IDs must follow naming conventions
5. Group values must match standardized categories

### Link Validation
1. Source and target IDs must reference existing nodes
2. No self-referencing links (source ≠ target)
3. No duplicate links with same source/target/type combination
4. Relationship types must match standardized values
5. Strength values must be between 0.1 and 1.0

### Structural Validation
1. Must contain at least one node
2. Links are optional but recommended
3. No circular prerequisite chains
4. Hierarchy levels should be consistent with relationships

## Best Practices

### Naming Guidelines
- **Clarity**: Use clear, unambiguous names
- **Consistency**: Maintain consistent terminology across concepts
- **Length**: Keep names concise but descriptive (under 40 characters)
- **Audience**: Write for target learning audience

### Relationship Guidelines
- **Prerequisites**: Only include direct, necessary prerequisites
- **Granularity**: Match relationship granularity to concept level
- **Bidirectional**: Consider adding reverse relationships where appropriate
- **Validation**: Ensure relationships reflect actual learning dependencies

### Expansion Strategy
- **Incremental**: Add 3-5 concepts per iteration
- **Logical Chunks**: Group related concepts together
- **Validation**: Test visualization after each expansion
- **Documentation**: Record rationale for each addition

## Error Handling
Implementations should validate:
1. JSON syntax correctness
2. Required field presence
3. ID uniqueness and format
4. Reference integrity (links point to existing nodes)
5. Value constraints (string lengths, numeric ranges)

## Future Extensions
Schema designed for extensibility:
- Additional node/link properties can be added
- New groups and relationship types can be defined
- Custom visualization properties can be included
- Metadata can be extended with additional fields

---
**Schema Version**: 1.0  
**Maintained by**: Documentation Curator Agent  
**Last Review**: August 16, 2025
