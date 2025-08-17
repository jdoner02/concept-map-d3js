# Concept Map API Documentation

This document provides comprehensive documentation for the Concept Map REST API, designed for educational technology applications that need to visualize and explore programming concepts through interactive graph representations.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Authentication](#authentication)
- [Base URL](#base-url)
- [Endpoints](#endpoints)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Examples](#examples)

## Overview

The Concept Map API provides programmatic access to educational concept map data, enabling developers to:

- Retrieve structured concept map data for visualization
- Access metadata about concept relationships and learning progressions
- Integrate concept maps into learning management systems (LMS)
- Build custom educational tools and analytics dashboards

### Key Features

- **RESTful Design**: Follows REST architectural principles for predictable, cacheable responses
- **JSON Format**: All responses use standardized JSON format optimized for JavaScript consumption
- **Educational Metadata**: Rich metadata including learning objectives, prerequisites, and difficulty levels
- **Graph Structure**: Nodes (concepts) and links (relationships) optimized for force-directed graph visualization
- **CORS Support**: Cross-origin resource sharing enabled for frontend integration

## Architecture

The API follows a layered architecture pattern:

```
┌─────────────────┐
│   Frontend      │  React + D3.js visualization
│   (Port 5173)   │
└─────────────────┘
         │ HTTP/CORS
         ▼
┌─────────────────┐
│   REST API      │  Spring Boot controller layer
│   (Port 8080)   │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│   Service       │  Business logic and JSON processing
│   Layer         │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│   Static JSON   │  Concept map data store
│   Resource      │
└─────────────────┘
```

## Authentication

**Current Version**: No authentication required  
**Future Versions**: Will support API key authentication for rate limiting and usage analytics.

## Base URL

**Development**: `http://localhost:8080/api`  
**Production**: `https://your-domain.com/api`

## Endpoints

### GET /concept-map

Retrieves the complete concept map data including metadata, nodes, and relationships.

#### Request

```http
GET /api/concept-map
Accept: application/json
```

#### Response

**Status**: `200 OK`  
**Content-Type**: `application/json`

```json
{
  "metadata": {
    "version": "6.3",
    "total_nodes": 55,
    "total_links": 146,
    "description": "Comprehensive programming concept map...",
    "created_date": "2024-08-15",
    "difficulty_range": {
      "min": 1,
      "max": 10
    },
    "educational_level": "undergraduate",
    "learning_objectives": [
      "Understand fundamental programming concepts",
      "Recognize relationships between programming paradigms"
    ]
  },
  "nodes": [
    {
      "id": "variables",
      "name": "Variables and Data Types",
      "description": "Storage containers for data values in programming languages",
      "category": "fundamentals",
      "difficulty": 2,
      "prerequisites": [],
      "learning_time_minutes": 30,
      "concepts": ["storage", "typing", "memory"]
    }
  ],
  "links": [
    {
      "source": "variables",
      "target": "memory-model",
      "label": "allocated in",
      "description": "Variables exist as named memory locations",
      "relationship_type": "IMPLEMENTS",
      "strength": 0.8,
      "bidirectional": false
    }
  ]
}
```

#### Error Responses

**404 Not Found**
```json
{
  "error": "Concept map resource not found",
  "code": "RESOURCE_NOT_FOUND",
  "timestamp": "2025-01-20T15:30:45Z"
}
```

**500 Internal Server Error**
```json
{
  "error": "Failed to load concept map data",
  "code": "INTERNAL_ERROR",
  "timestamp": "2025-01-20T15:30:45Z"
}
```

## Data Models

### Metadata

Provides information about the concept map structure and educational context.

| Field | Type | Description |
|-------|------|-------------|
| `version` | string | Semantic version of the concept map data |
| `total_nodes` | number | Count of concept nodes in the map |
| `total_links` | number | Count of relationships between concepts |
| `description` | string | Human-readable description of the concept map |
| `created_date` | string | ISO date when the map was created |
| `difficulty_range` | object | Min/max difficulty levels present |
| `educational_level` | string | Target educational level (e.g., "undergraduate") |
| `learning_objectives` | array | Educational goals addressed by this map |

### Node (Concept)

Represents an individual programming concept in the learning map.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier for the concept (kebab-case) |
| `name` | string | Display name for the concept |
| `description` | string | Detailed explanation of the concept |
| `category` | string | Conceptual category (e.g., "fundamentals", "advanced") |
| `difficulty` | number | Difficulty level (1-10 scale) |
| `prerequisites` | array | Array of concept IDs that should be learned first |
| `learning_time_minutes` | number | Estimated time to understand this concept |
| `concepts` | array | Related keywords and terms |

### Link (Relationship)

Represents the relationship between two concepts in the learning progression.

| Field | Type | Description |
|-------|------|-------------|
| `source` | string | ID of the source concept |
| `target` | string | ID of the target concept |
| `label` | string | Human-readable relationship description |
| `description` | string | Detailed explanation of the relationship |
| `relationship_type` | string | Type of relationship (e.g., "IMPLEMENTS", "REQUIRES") |
| `strength` | number | Relationship strength (0.0-1.0) for visualization |
| `bidirectional` | boolean | Whether the relationship works in both directions |

## Error Handling

The API uses standard HTTP status codes and provides detailed error information:

### Error Response Format

```json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_ERROR_CODE",
  "timestamp": "ISO timestamp",
  "details": {
    "additional": "context information"
  }
}
```

### Common Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `BAD_REQUEST` | Invalid request parameters |
| 404 | `RESOURCE_NOT_FOUND` | Requested resource doesn't exist |
| 500 | `INTERNAL_ERROR` | Server-side processing error |
| 503 | `SERVICE_UNAVAILABLE` | Service temporarily unavailable |

## Rate Limiting

**Current Version**: No rate limiting  
**Future Versions**: Will implement rate limiting based on IP address or API key.

Expected limits:
- **Anonymous**: 100 requests/hour
- **Authenticated**: 1000 requests/hour

## Examples

### JavaScript Fetch

```javascript
async function loadConceptMap() {
  try {
    const response = await fetch('http://localhost:8080/api/concept-map');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const conceptMap = await response.json();
    
    console.log(`Loaded ${conceptMap.metadata.total_nodes} concepts`);
    return conceptMap;
    
  } catch (error) {
    console.error('Failed to load concept map:', error);
    throw error;
  }
}
```

### React Hook

```javascript
import { useState, useEffect } from 'react';

function useConceptMap() {
  const [conceptMap, setConceptMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchConceptMap() {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8080/api/concept-map');
        const data = await response.json();
        setConceptMap(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchConceptMap();
  }, []);

  return { conceptMap, loading, error };
}
```

### D3.js Integration

```javascript
import * as d3 from 'd3';

async function createConceptMapVisualization(containerId) {
  // Load data from API
  const response = await fetch('http://localhost:8080/api/concept-map');
  const data = await response.json();
  
  // Create SVG
  const svg = d3.select(`#${containerId}`)
    .append('svg')
    .attr('width', 800)
    .attr('height', 600);
  
  // Create force simulation
  const simulation = d3.forceSimulation(data.nodes)
    .force('link', d3.forceLink(data.links).id(d => d.id))
    .force('charge', d3.forceManyBody().strength(-400))
    .force('center', d3.forceCenter(400, 300));
  
  // Render links
  const links = svg.selectAll('.link')
    .data(data.links)
    .enter()
    .append('line')
    .attr('class', 'link');
  
  // Render nodes
  const nodes = svg.selectAll('.node')
    .data(data.nodes)
    .enter()
    .append('circle')
    .attr('class', 'node')
    .attr('r', 10);
  
  // Update positions on simulation tick
  simulation.on('tick', () => {
    links
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);
    
    nodes
      .attr('cx', d => d.x)
      .attr('cy', d => d.y);
  });
}
```

## Integration Patterns

### Learning Management System (LMS)

```javascript
// Example integration with an LMS progress tracking system
class ConceptMapLMSIntegration {
  constructor(apiUrl, userId) {
    this.apiUrl = apiUrl;
    this.userId = userId;
  }

  async getPersonalizedConceptMap() {
    // Load base concept map
    const conceptMap = await this.loadConceptMap();
    
    // Enhance with user progress data
    const userProgress = await this.loadUserProgress();
    
    // Mark completed concepts
    conceptMap.nodes.forEach(node => {
      node.completed = userProgress.completedConcepts.includes(node.id);
      node.progress = userProgress.conceptProgress[node.id] || 0;
    });
    
    return conceptMap;
  }
}
```

### Analytics Dashboard

```javascript
// Example analytics integration
class ConceptMapAnalytics {
  async getLearningPathMetrics() {
    const conceptMap = await fetch('/api/concept-map').then(r => r.json());
    
    return {
      totalConcepts: conceptMap.metadata.total_nodes,
      totalRelationships: conceptMap.metadata.total_links,
      averageDifficulty: this.calculateAverageDifficulty(conceptMap.nodes),
      learningPaths: this.identifyLearningPaths(conceptMap),
      prerequisites: this.analyzePrerequisites(conceptMap)
    };
  }
}
```

## Versioning

The API follows semantic versioning principles:

- **Major Version**: Breaking changes to data structure or API endpoints
- **Minor Version**: New features, additional fields (backward compatible)  
- **Patch Version**: Bug fixes, documentation updates

Current API Version: **v1.0.0**

## Support

For API support, bug reports, or feature requests:

- **GitHub Issues**: [https://github.com/your-org/concept-map-d3js/issues](https://github.com/your-org/concept-map-d3js/issues)
- **Documentation**: [README.md](./README.md)
- **Educational Resources**: [docs/EDUCATIONAL_GUIDE.md](./docs/EDUCATIONAL_GUIDE.md)

## Contributing

We welcome contributions to improve the API documentation and functionality. Please see our [Contributing Guidelines](./CONTRIBUTING.md) for details on:

- Code style and standards
- Testing requirements
- Documentation updates
- Educational content guidelines

---

*This API documentation follows OpenAPI 3.0 principles and is designed for educational technology applications. For production deployments, consider implementing authentication, rate limiting, and comprehensive monitoring.*
