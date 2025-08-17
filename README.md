# Interactive Concept Map Visualization

A full-stack web application that transforms abstract programming concepts into interactive visual networks, making complex computer science topics more accessible through dynamic graph visualization.

## 🎯 Purpose & Educational Value

This project bridges the gap between theoretical programming concepts and practical understanding by:

- **Visual Learning**: Converting abstract relationships into interactive node-link diagrams
- **Cognitive Scaffolding**: Providing multiple pathways to explore interconnected concepts
- **Progressive Complexity**: Supporting learners from basic variables to advanced design patterns
- **Active Exploration**: Enabling discovery through drag-and-drop interaction and dynamic filtering

## 🏗️ Architecture Overview

```
┌─────────────────┐    HTTP/REST    ┌──────────────────┐
│   React + D3.js │◄───────────────►│  Spring Boot API │
│   Frontend      │                 │  Backend         │
│                 │                 │                  │
│ ├─ Visualization│                 │ ├─ JSON Data     │
│ ├─ Interactions │                 │ ├─ Validation    │
│ └─ UI Controls  │                 │ └─ CORS Config   │
└─────────────────┘                 └──────────────────┘
                                              │
                                              ▼
                                    ┌──────────────────┐
                                    │   Concept Map    │
                                    │   JSON Data      │
                                    │  (3500+ lines)   │
                                    └──────────────────┘
```

### Technology Stack Rationale

**Backend: Spring Boot 3.5.4 + Java 17**
- Mature enterprise framework with excellent JSON handling
- Built-in CORS support for cross-origin requests
- Comprehensive testing ecosystem (JUnit 5, Mockito)
- Easy deployment to various cloud platforms

**Frontend: React 18 + Vite + D3.js 7**
- React provides component structure and state management
- Vite offers fast development builds and hot module replacement
- D3.js handles complex graph visualization and force simulations
- Direct DOM manipulation for optimal rendering performance

**Data Format: Structured JSON**
- Human-readable and easily extensible
- Version-controlled educational content
- Standardized node/link relationship format
- Rich metadata for educational context

## 🚀 Quick Start

### Prerequisites
- **Java 17+** - [Download OpenJDK](https://adoptium.net/)
- **Node.js 18+** - [Download Node.js](https://nodejs.org/)
- **Git** - [Install Git](https://git-scm.com/)

### Development Setup

1. **Clone the repository**
   ```bash
  git clone https://github.com/jdoner02/concept-map-d3js.git
   cd concept-map-d3js
   ```

2. **Start both servers (automated)**
   ```bash
   ./scripts/dev.sh
   ```
   This script will:
   - Install frontend dependencies automatically
   - Start Spring Boot backend on `http://localhost:8080`
   - Start Vite development server on `http://localhost:5173`
   - Open the application in your default browser

3. **Manual setup (alternative)**
   ```bash
   # Terminal 1: Backend
   ./mvnw spring-boot:run
   
   # Terminal 2: Frontend
   cd frontend
   npm install
   npm run dev
   ```

### Testing

```bash
# Backend tests (JUnit + Integration tests)
./mvnw test

# Frontend E2E tests (Playwright)
cd frontend && npm run test:e2e

# Coverage reports available in target/site/jacoco/
```

## 📚 API Documentation

### Core Endpoint

**GET** `/api/concept-map`
- **Purpose**: Retrieves the complete concept map data structure
- **Response**: JSON object with metadata, nodes, and links
- **CORS**: Configured for localhost development and GitHub Pages deployment

```bash
# Example usage
curl http://localhost:8080/api/concept-map
```

### Data Structure

```json
{
  "metadata": {
    "version": "6.3",
    "total_nodes": 55,
    "total_links": 146,
    "description": "Comprehensive programming concept map..."
  },
  "nodes": [
    {
      "id": "variables",
      "name": "Variables and Data Types",
      "description": "Containers that store data values...",
      "category": "fundamentals"
    }
  ],
  "links": [
    {
      "source": "variables",
      "target": "memory-model",
      "label": "allocated in",
      "description": "Variables are storage locations..."
    }
  ]
}
```

## 🎮 User Interface Guide

### Visualization Features

- **Node Interaction**: Drag nodes to reorganize the layout
- **Information Panel**: Double-click any node to view detailed explanations
- **Zoom Controls**: Mouse wheel or pinch to zoom in/out
- **Pan Navigation**: Click and drag on empty space to pan around
- **Force Physics**: Nodes automatically position based on relationship strength

### Visual Design Principles

- **Color Coding**: Different categories use distinct colors for quick identification
- **Size Mapping**: Node size reflects the number of connections (centrality)
- **Edge Labels**: Relationship descriptions appear on hover
- **Responsive Layout**: Adapts to different screen sizes and orientations

## 🔧 Development Workflow

### Adding New Concepts

1. **Update JSON data** in `src/main/resources/concept-map.json`
2. **Add validation** for new node/link structures
3. **Create tests** for the new content
4. **Update visualization** if new categories are introduced

### Code Quality Standards

- **Defensive Programming**: All constructors validate parameters
- **Comprehensive Testing**: Target 90%+ test coverage
- **Documentation**: Every public method includes JavaDoc
- **Error Handling**: Graceful degradation with user-friendly messages

### Testing Strategy

```bash
# Run specific test suites
./mvnw test -Dtest=JsonValidationUtilsTest
./mvnw test -Dtest=ConceptMapControllerTest

# Generate coverage reports
./mvnw jacoco:report
```

## 🌐 Deployment Options

### GitHub Pages (Static Hosting)

The frontend can be deployed as a static site to GitHub Pages:

Note: On GitHub Pages you can direct the app to fetch from a public raw JSON without the backend by setting a repository variable `VITE_JSON_URL` (or by appending `?jsonUrl=` to the site URL). The frontend prioritizes this raw source and falls back to backend endpoints if needed.

- Live (with explicit raw JSON override):
  https://jdoner02.github.io/concept-map-d3js/?jsonUrl=https://raw.githubusercontent.com/jdoner02/concept-map-d3js/refs/heads/main/src/main/resources/concept-map.json

- Preview dataset (published with Pages artifact):
  https://jdoner02.github.io/concept-map-d3js/?jsonUrl=https://jdoner02.github.io/concept-map-d3js/concept-map-preview.json

Layout vision (preview JSON):
- Center node: `ewu-root` with college nodes radiating outward (force-directed).
- Each college decomposes into departments; CSEE then decomposes into degree levels and programs.
- Courses decompose into domains and then atomic skills. The force parameters aim to push unrelated nodes apart to reveal natural sequences.

```bash
# Build for production
cd frontend
npm run build

# Deploy to GitHub Pages (automated via GitHub Actions)
git push origin main
```

### Full-Stack Deployment

For complete backend functionality:

- **Heroku**: `heroku create your-app-name`
- **AWS**: Deploy using AWS Elastic Beanstalk
- **DigitalOcean**: Use App Platform for automatic deployments
- **Docker**: `docker build -t concept-map .`

## 📈 Educational Impact

### Learning Outcomes

Students using this visualization will:

1. **Understand Relationships**: See how programming concepts interconnect
2. **Identify Prerequisites**: Discover what knowledge builds on what
3. **Explore Progressively**: Move from simple to complex concepts naturally
4. **Retain Information**: Visual associations improve memory recall

### Pedagogical Features

- **Multiple Entry Points**: Start exploration from any familiar concept
- **Scaffolded Complexity**: Color and size coding guide difficulty progression  
- **Contextual Learning**: Rich descriptions provide background and examples
- **Discovery Learning**: Interactive exploration encourages curiosity

## 🤝 Contributing

### Code Contributions

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Follow existing code style and testing patterns
4. Add tests for new functionality
5. Submit a pull request with clear description

### Educational Content

- **Suggest Concepts**: Open an issue to propose new nodes or relationships
- **Improve Descriptions**: Help make explanations clearer and more accessible
- **Add Examples**: Contribute code examples that illustrate concepts
- **Test Usability**: Provide feedback on the learning experience

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **D3.js Community**: For powerful visualization capabilities
- **Spring Boot Team**: For robust backend framework
- **React Community**: For component-based UI development
- **Educational Research**: Inspired by cognitive load theory and visual learning principles

---

**Live Demo**: [View on GitHub Pages](https://jdoner02.github.io/concept-map-d3js/)  
**API Documentation**: [OpenAPI Specification](docs/api.md)  
**Development Guide**: [Contributing Guidelines](CONTRIBUTING.md)
