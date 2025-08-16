# CSCD211 Concept Map - Java Educational Example

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/jdoner02/atomic-knowledge-database-system)
[![Test Coverage](https://img.shields.io/badge/coverage-93%25-brightgreen)](target/site/jacoco/index.html)
[![Java Version](https://img.shields.io/badge/java-11-blue)](https://adoptopenjdk.net/)

## 🎯 Educational Project Overview

This project demonstrates **Test-Driven Development (TDD)** and Java best practices for CSCD211 students. It implements a concept mapping system that shows relationships between educational concepts, built entirely using TDD methodology.

## 🏗️ Architecture & Design Patterns

### Clean Architecture Implementation
- **Model Layer**: `Concept`, `Relationship`, `RelationshipType` (POJOs with business logic)
- **Service Layer**: Business operations and validation (coming next)
- **Controller Layer**: REST API endpoints (coming next)
- **Frontend**: HTML/CSS/JavaScript visualization (coming next)

### Design Patterns Demonstrated
- **Encapsulation**: Private fields with public methods
- **Immutable Objects**: `Relationship` class with final fields
- **Defensive Programming**: Comprehensive input validation
- **Enum Usage**: `RelationshipType` for type safety
- **Composition**: `Relationship` contains `Concept` objects

## 📊 Test Coverage Excellence

| Class | Line Coverage | Branch Coverage | Method Coverage |
|-------|--------------|-----------------|-----------------|
| `Concept` | 96.0% (25/26) | 83.3% (15/18) | 100% (8/8) |
| `Relationship` | 89.7% (26/29) | 76.9% (20/26) | 100% (8/8) |
| `RelationshipType` | 100% (7/7) | N/A | 100% (1/1) |
| **Overall** | **93.3%** | **81.0%** | **100%** |

## 🧪 TDD Methodology Demonstrated

### RED → GREEN → REFACTOR Cycles

#### Cycle 1: Concept Class ✅
- **RED**: Wrote 10 failing tests for `Concept` class
- **GREEN**: Implemented minimal code to pass all tests
- **REFACTOR**: Enhanced with documentation and validation

#### Cycle 2: Relationship Class ✅
- **RED**: Wrote 15 failing tests for `Relationship` and `RelationshipType`
- **GREEN**: Implemented minimal code to pass all tests
- **REFACTOR**: Enhanced with comprehensive validation and business logic

## 🎓 Educational Features

### For CSCD211 Students
- ✅ **Constructor Overloading**: Multiple ways to create objects
- ✅ **Input Validation**: Defensive programming practices
- ✅ **equals() & hashCode()**: Proper implementation patterns
- ✅ **Exception Handling**: When and how to throw exceptions
- ✅ **Enum Usage**: Type-safe constants and validation
- ✅ **Immutable Design**: Objects that cannot be modified after creation
- ✅ **Composition**: Objects containing other objects
- ✅ **JavaDoc Documentation**: Professional documentation standards

### Test Examples Include
- ✅ **Parametrized Tests**: Testing multiple inputs efficiently
- ✅ **Exception Testing**: Verifying proper error handling
- ✅ **Equality Testing**: Comprehensive equals() contract verification
- ✅ **Business Logic Testing**: Domain-specific validation rules
- ✅ **Edge Case Testing**: Null inputs, empty strings, self-references

## 🚀 Quick Start

### Prerequisites
- Java 11 or higher
- Maven 3.6 or higher

### Running Tests
```bash
# Run all tests
mvn test

# Run tests with coverage report
mvn clean test jacoco:report

# View coverage report
open target/site/jacoco/index.html
```

### Building the Project
```bash
# Compile and package
mvn clean compile

# Full build with tests
mvn clean package
```

## 📁 Project Structure

```
src/
├── main/java/edu/ewu/cscd211/conceptmap/
│   └── model/
│       ├── Concept.java          # Core concept entity
│       ├── Relationship.java     # Relationship between concepts
│       └── RelationshipType.java # Types of relationships (enum)
└── test/java/edu/ewu/cscd211/conceptmap/
    └── model/
        ├── ConceptTest.java       # 10 comprehensive tests
        └── RelationshipTest.java  # 15 comprehensive tests
```

## 🎯 Current Status & Next Steps

### ✅ Completed (TDD Cycles 1-2)
- [x] Maven project structure with comprehensive testing
- [x] `Concept` class with 96% test coverage
- [x] `Relationship` and `RelationshipType` with 90%+ coverage
- [x] Comprehensive input validation and error handling
- [x] Professional JavaDoc documentation

### 🔄 In Progress (TDD Cycle 3)
- [ ] `ConceptMap` class to manage collections of concepts and relationships
- [ ] Service layer for business operations
- [ ] REST API controller layer
- [ ] HTML/CSS/JavaScript frontend with D3.js visualization

### 🎯 Goals
- Maintain 90%+ test coverage throughout development
- Demonstrate all major Java concepts for CSCD211
- Create scalable architecture for large concept maps
- Provide comprehensive educational examples

## 🛠️ Development Methodology

This project follows strict **Test-Driven Development**:

1. **Write failing tests first** (RED)
2. **Implement minimal code to pass** (GREEN)
3. **Refactor for quality and clarity** (REFACTOR)
4. **Repeat for each new feature**

Every line of production code is driven by a failing test, ensuring high quality and comprehensive coverage.

## 📚 Educational Resources

This project serves as a reference implementation for:
- Java object-oriented programming principles
- Test-driven development methodology
- Professional code documentation standards
- Modern build tool usage (Maven)
- Code quality measurement (JaCoCo coverage)

## 🤝 Contributing

This is an educational project. Students are encouraged to:
1. Study the test patterns and implementation techniques
2. Understand the TDD methodology demonstrated
3. Learn from the comprehensive documentation
4. Practice similar patterns in their own projects

---

**Built with ❤️ for CSCD211 students using Test-Driven Development**
