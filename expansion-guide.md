# Concept Map Expansion Guide

## Quick Reference for Adding New Concepts

### 1. Choose Next Logical Group
Review `expansion-log.md` for planned additions:
- Programming fundamentals (variables, control flow)
- Data structures (arrays, linked lists)  
- Algorithm concepts (recursion, analysis)
- Advanced OOP (polymorphism, interfaces)

### 2. Add 3-5 Related Concepts Per Iteration
Keep expansions focused and manageable:
```bash
# Example: Adding programming fundamentals
{
  "id": "variables",
  "name": "Variables and Data Types", 
  "description": "Storage containers for data values",
  "group": "concept",
  "level": 2,
  "size": 14
}
```

### 3. Follow Naming Conventions
- **IDs**: lowercase, kebab-case, descriptive
- **Names**: Clear, under 50 characters
- **Groups**: Use standardized categories

### 4. Add Logical Relationships
```bash
# Prerequisites: What must be learned first
{
  "source": "variables",
  "target": "object-oriented-programming", 
  "type": "prerequisite",
  "strength": 0.8
}

# Part-of: Components of larger concepts
{
  "source": "encapsulation",
  "target": "object-oriented-programming",
  "type": "part-of", 
  "strength": 0.9
}
```

### 5. Validate and Test
```bash
cd /Users/jessicadoner/Projects/concept-map-d3js
python validate.py concept-map.json
```

### 6. Update Documentation
- Add entries to `expansion-log.md`
- Update metadata counts in JSON
- Record design decisions

### 7. Visualize Results
Open `visualize.html` in browser to see changes:
```bash
open visualize.html
```

## Common Patterns

### Course Prerequisites
```json
{
  "source": "cscd210",
  "target": "cscd211", 
  "type": "prerequisite"
}
```

### Concept Hierarchies
```json
{
  "source": "object-oriented-programming",
  "target": "inheritance",
  "type": "enables"
}
```

### Implementation Technologies
```json
{
  "source": "java-programming",
  "target": "cscd211",
  "type": "implements"
}
```

## Quality Checklist

Before each expansion:
- [ ] All IDs follow kebab-case convention
- [ ] No duplicate IDs or names within groups
- [ ] All relationships reference existing nodes
- [ ] No circular prerequisite chains
- [ ] Descriptions under 200 characters
- [ ] Groups use standardized categories
- [ ] Links have appropriate types and strengths

## Next Iteration Templates

### Programming Fundamentals Expansion
```json
{
  "id": "control-flow",
  "name": "Control Flow Structures",
  "description": "Conditional statements and loops that control program execution",
  "group": "concept", 
  "level": 2,
  "size": 16
}
```

### Data Structures Expansion  
```json
{
  "id": "arrays",
  "name": "Arrays",
  "description": "Ordered collections of elements of the same type",
  "group": "structure",
  "level": 2, 
  "size": 15
}
```

### Advanced OOP Expansion
```json
{
  "id": "polymorphism", 
  "name": "Polymorphism",
  "description": "Ability for objects of different types to be treated uniformly",
  "group": "concept",
  "level": 2,
  "size": 15
}
```

---
**Maintained by**: Documentation Curator Agent  
**Use**: Reference for systematic concept map expansion
