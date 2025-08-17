package edu.ewu.cscd211.conceptmap.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import edu.ewu.cscd211.conceptmap.model.ConceptMap;
import edu.ewu.cscd211.conceptmap.model.Metadata;
import edu.ewu.cscd211.conceptmap.model.Node;
import edu.ewu.cscd211.conceptmap.model.Link;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.io.IOException;
import java.io.InputStream;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Tests for JSON deserialization of concept-map.json into domain models.
 * This ensures the Spring Boot application can correctly parse the JSON data.
 */
@SpringBootTest
class ConceptMapJsonDeserializationTest {

    @Autowired
    private ObjectMapper objectMapper;

    private JsonNode conceptMapJson;

    @BeforeEach
    void setUp() throws IOException {
        // Load the concept-map.json file from classpath resources
        InputStream resourceStream = getClass().getClassLoader().getResourceAsStream("concept-map.json");
        if (resourceStream == null) {
            throw new IOException("concept-map.json not found in classpath resources");
        }
        conceptMapJson = objectMapper.readTree(resourceStream);
    }

    @Test
    @DisplayName("Should parse concept-map.json successfully")
    void shouldParseConceptMapJson() {
        // This test will initially fail because we don't have a JSON parsing service yet
        assertThat(conceptMapJson).isNotNull();
        assertThat(conceptMapJson.has("metadata")).isTrue();
        assertThat(conceptMapJson.has("nodes")).isTrue();
        assertThat(conceptMapJson.has("links")).isTrue();
    }

    @Test
    @DisplayName("Should deserialize metadata from JSON")
    void shouldDeserializeMetadata() {
        // This test will fail initially - we need a service to convert JSON to domain objects
        JsonNode metadataNode = conceptMapJson.get("metadata");
        
        // Expected: A service that can convert JSON to Metadata domain object
        ConceptMapService service = new ConceptMapService(objectMapper);
        Metadata metadata = service.parseMetadata(metadataNode);
        
        assertThat(metadata).isNotNull();
        assertThat(metadata.getVersion()).isEqualTo("6.3");
        assertThat(metadata.getDescription()).contains("CSCD211-centered concept map");
    }

    @Test
    @DisplayName("Should deserialize nodes from JSON")
    void shouldDeserializeNodes() {
        // This test will fail initially - we need a service to convert JSON nodes
        JsonNode nodesArray = conceptMapJson.get("nodes");
        
        ConceptMapService service = new ConceptMapService(objectMapper);
        Node firstNode = service.parseNode(nodesArray.get(0));
        
        assertThat(firstNode).isNotNull();
        assertThat(firstNode.getId()).isNotBlank();
        assertThat(firstNode.getName()).isNotBlank();
        assertThat(firstNode.getDescription()).isNotNull();
    }

    @Test
    @DisplayName("Should deserialize links from JSON")
    void shouldDeserializeLinks() {
        // This test will fail initially - we need a service to convert JSON links
        JsonNode linksArray = conceptMapJson.get("links");
        
        ConceptMapService service = new ConceptMapService(objectMapper);
        Link firstLink = service.parseLink(linksArray.get(0));
        
        assertThat(firstLink).isNotNull();
        assertThat(firstLink.getSourceId()).isNotBlank();
        assertThat(firstLink.getTargetId()).isNotBlank();
        assertThat(firstLink.getRelationshipType()).isNotBlank();
    }

    @Test
    @DisplayName("Should create complete ConceptMap from JSON")
    void shouldCreateCompleteConceptMapFromJson() throws IOException {
        // Load from classpath resource instead of file system
        ConceptMapService service = new ConceptMapService(objectMapper);
        ConceptMap conceptMap = service.loadConceptMapFromClasspath("concept-map.json");
        
        assertThat(conceptMap).isNotNull();
        assertThat(conceptMap.getMetadata()).isNotNull();
        assertThat(conceptMap.getNodes()).isNotEmpty();
        assertThat(conceptMap.getLinks()).isNotEmpty();
        
        // Compute expected counts dynamically based on unique elements in JSON
        // This avoids brittleness if the JSON is updated or contains duplicates
        java.util.Set<String> uniqueNodeIds = new java.util.HashSet<>();
        for (JsonNode node : conceptMapJson.get("nodes")) {
            JsonNode idNode = node.get("id");
            if (idNode != null && idNode.isTextual()) {
                uniqueNodeIds.add(idNode.asText());
            }
        }
        assertThat(conceptMap.getNodes())
            .withFailMessage("Expected %s unique nodes, but got %s", uniqueNodeIds.size(), conceptMap.getNodes().size())
            .hasSize(uniqueNodeIds.size());

        java.util.Set<String> uniqueLinks = new java.util.HashSet<>();
        for (JsonNode link : conceptMapJson.get("links")) {
            String src = link.has("source") ? link.get("source").asText() : "";
            String tgt = link.has("target") ? link.get("target").asText() : "";
            String typ = link.has("type") ? link.get("type").asText() : "";
            uniqueLinks.add(src + "->" + tgt + ":" + typ);
        }
        assertThat(conceptMap.getLinks())
            .withFailMessage("Expected %s unique links, but got %s", uniqueLinks.size(), conceptMap.getLinks().size())
            .hasSize(uniqueLinks.size());
        
        // Verify that all links reference existing nodes
        for (Link link : conceptMap.getLinks()) {
            assertThat(conceptMap.findNodeById(link.getSourceId()))
                .withFailMessage("Source node %s not found for link", link.getSourceId())
                .isNotNull();
            assertThat(conceptMap.findNodeById(link.getTargetId()))
                .withFailMessage("Target node %s not found for link", link.getTargetId())
                .isNotNull();
        }
    }

    @Test
    @DisplayName("Should throw when classpath resource missing")
    void shouldThrowWhenClasspathResourceMissing() {
        ConceptMapService service = new ConceptMapService(objectMapper);
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> service.loadConceptMapFromClasspath("nope-does-not-exist.json"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Resource not found");
    }

    @Test
    @DisplayName("Should throw for invalid JSON (missing metadata)")
    void shouldThrowForInvalidJsonMissingMetadata() {
        ConceptMapService service = new ConceptMapService(objectMapper);
        String invalid = "{\n  \"nodes\": [],\n  \"links\": []\n}"; // no metadata
        java.nio.file.Path tmp;
        try {
            tmp = java.nio.file.Files.createTempFile("bad-concept-map", ".json");
            java.nio.file.Files.writeString(tmp, invalid);
        } catch (java.io.IOException e) {
            throw new RuntimeException(e);
        }
        try {
            org.assertj.core.api.Assertions.assertThatThrownBy(() -> service.loadConceptMapFromJson(tmp))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("metadata");
        } finally {
            try { java.nio.file.Files.deleteIfExists(tmp); } catch (java.io.IOException ignored) { /* best-effort cleanup */ }
        }
    }

    @Test
    @DisplayName("Should throw when node is missing required 'name'")
    void shouldThrowWhenNodeMissingName() throws Exception {
        ConceptMapService service = new ConceptMapService(objectMapper);
        String json = "{\n  \"id\": \"n1\"\n}"; // missing name
        JsonNode node = objectMapper.readTree(json);
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> service.parseNode(node))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("name");
    }

    @Test
    @DisplayName("Should throw when link is missing required 'source'")
    void shouldThrowWhenLinkMissingSource() throws Exception {
        ConceptMapService service = new ConceptMapService(objectMapper);
        String json = "{\n  \"target\": \"n2\"\n}"; // missing source
        JsonNode link = objectMapper.readTree(json);
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> service.parseLink(link))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("source");
    }

    @Test
    @DisplayName("Should throw when metadata fields are non-textual or missing")
    void shouldThrowWhenMetadataInvalidFields() throws Exception {
        ConceptMapService service = new ConceptMapService(objectMapper);
        // version is numeric, description missing
        String json = "{\n  \"version\": 123\n}";
        JsonNode metadataNode = objectMapper.readTree(json);
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> service.parseMetadata(metadataNode))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("version");
    }

    @Test
    @DisplayName("Should throw when JSON file path String is null")
    void shouldThrowWhenJsonFilePathStringNull() {
        ConceptMapService service = new ConceptMapService(objectMapper);
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> service.loadConceptMapFromJson((String) null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("path");
    }

    @Test
    @DisplayName("Should throw when JSON file Path is null")
    void shouldThrowWhenJsonFilePathNull() {
        ConceptMapService service = new ConceptMapService(objectMapper);
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> service.loadConceptMapFromJson((java.nio.file.Path) null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("path");
    }

    @Test
    @DisplayName("Should throw IOException when reading a directory as JSON file")
    void shouldThrowIOExceptionWhenReadingDirectoryAsFile() throws Exception {
        ConceptMapService service = new ConceptMapService(objectMapper);
        java.nio.file.Path dir = java.nio.file.Files.createTempDirectory("concept-map-dir");
        try {
            org.assertj.core.api.Assertions.assertThatThrownBy(() -> service.loadConceptMapFromJson(dir))
                .isInstanceOf(java.io.IOException.class);
        } finally {
            try { 
                java.nio.file.Files.deleteIfExists(dir); 
            } catch (java.io.IOException ignored) { 
                // Best-effort cleanup only; non-fatal if deletion fails in tests
            }
        }
    }
}
