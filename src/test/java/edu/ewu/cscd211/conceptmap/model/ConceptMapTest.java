package edu.ewu.cscd211.conceptmap.model;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.BeforeEach;
import static org.junit.jupiter.api.Assertions.*;

@DisplayName("ConceptMap Domain Model Tests")
class ConceptMapTest {

    private Metadata testMetadata;
    private ConceptMap conceptMap;

    @BeforeEach
    void setUp() {
        testMetadata = new Metadata("3.0", "Test concept map");
        conceptMap = new ConceptMap(testMetadata);
    }

    @Test
    @DisplayName("Should create ConceptMap with metadata and empty collections")
    void shouldCreateConceptMapWithMetadataAndEmptyCollections() {
        // Arrange
        Metadata metadata = new Metadata("3.0", "Test concept map");
        
        // Act
        ConceptMap newConceptMap = new ConceptMap(metadata);
        
        // Assert
        assertNotNull(newConceptMap);
        assertEquals(metadata, newConceptMap.getMetadata());
        assertNotNull(newConceptMap.getNodes());
        assertNotNull(newConceptMap.getLinks());
        assertTrue(newConceptMap.getNodes().isEmpty());
        assertTrue(newConceptMap.getLinks().isEmpty());
        assertTrue(newConceptMap.isEmpty());
    }

    @Test
    @DisplayName("Should throw exception when creating ConceptMap with null metadata")
    void shouldThrowExceptionWhenCreatingConceptMapWithNullMetadata() {
        // Act & Assert
        assertThrows(NullPointerException.class, () -> new ConceptMap(null));
    }

    @Test
    @DisplayName("Should add node to concept map")
    void shouldAddNodeToConceptMap() {
        // Arrange
        Node node = new Node("test-id", "Test Node", "Test description");
        
        // Act
        conceptMap.addNode(node);
        
        // Assert
        assertEquals(1, conceptMap.getNodes().size());
        assertTrue(conceptMap.getNodes().contains(node));
        assertFalse(conceptMap.isEmpty());
    }

    @Test
    @DisplayName("Should throw exception when adding null node")
    void shouldThrowExceptionWhenAddingNullNode() {
        // Act & Assert
        assertThrows(NullPointerException.class, () -> conceptMap.addNode(null));
    }

    @Test
    @DisplayName("Should not add duplicate nodes")
    void shouldNotAddDuplicateNodes() {
        // Arrange
        Node node = new Node("test-id", "Test Node", "Test description");
        
        // Act
        conceptMap.addNode(node);
        conceptMap.addNode(node); // Add same node again
        
        // Assert
        assertEquals(1, conceptMap.getNodes().size());
        assertTrue(conceptMap.getNodes().contains(node));
    }

    @Test
    @DisplayName("Should add link to concept map")
    void shouldAddLinkToConceptMap() {
        // Arrange
        Node sourceNode = new Node("source", "Source", "Source node");
        Node targetNode = new Node("target", "Target", "Target node");
        conceptMap.addNode(sourceNode);
        conceptMap.addNode(targetNode);
        Link link = new Link("source", "target", "prerequisite");
        
        // Act
        conceptMap.addLink(link);
        
        // Assert
        assertEquals(1, conceptMap.getLinks().size());
        assertTrue(conceptMap.getLinks().contains(link));
    }

    @Test
    @DisplayName("Should throw exception when adding null link")
    void shouldThrowExceptionWhenAddingNullLink() {
        // Act & Assert
        assertThrows(NullPointerException.class, () -> conceptMap.addLink(null));
    }

    @Test
    @DisplayName("Should throw exception when adding link with non-existent source node")
    void shouldThrowExceptionWhenAddingLinkWithNonExistentSourceNode() {
        // Arrange
        Node targetNode = new Node("target", "Target", "Target node");
        conceptMap.addNode(targetNode);
        Link link = new Link("non-existent-source", "target", "prerequisite");
        
        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
            () -> conceptMap.addLink(link));
        assertTrue(exception.getMessage().contains("Source node non-existent-source not found"));
    }

    @Test
    @DisplayName("Should throw exception when adding link with non-existent target node")
    void shouldThrowExceptionWhenAddingLinkWithNonExistentTargetNode() {
        // Arrange
        Node sourceNode = new Node("source", "Source", "Source node");
        conceptMap.addNode(sourceNode);
        Link link = new Link("source", "non-existent-target", "prerequisite");
        
        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
            () -> conceptMap.addLink(link));
        assertTrue(exception.getMessage().contains("Target node non-existent-target not found"));
    }

    @Test
    @DisplayName("Should not add duplicate links")
    void shouldNotAddDuplicateLinks() {
        // Arrange
        Node sourceNode = new Node("source", "Source", "Source node");
        Node targetNode = new Node("target", "Target", "Target node");
        conceptMap.addNode(sourceNode);
        conceptMap.addNode(targetNode);
        Link link = new Link("source", "target", "prerequisite");
        
        // Act
        conceptMap.addLink(link);
        conceptMap.addLink(link); // Add same link again
        
        // Assert
        assertEquals(1, conceptMap.getLinks().size());
        assertTrue(conceptMap.getLinks().contains(link));
    }

    @Test
    @DisplayName("Should find node by id")
    void shouldFindNodeById() {
        // Arrange
        Node node = new Node("test-id", "Test Node", "Test description");
        conceptMap.addNode(node);
        
        // Act
        Node foundNode = conceptMap.findNodeById("test-id");
        
        // Assert
        assertNotNull(foundNode);
        assertEquals(node, foundNode);
    }

    @Test
    @DisplayName("Should return null when node not found")
    void shouldReturnNullWhenNodeNotFound() {
        // Act
        Node foundNode = conceptMap.findNodeById("non-existent");
        
        // Assert
        assertNull(foundNode);
    }

    @Test
    @DisplayName("Should return null when searching for node with null id")
    void shouldReturnNullWhenSearchingForNodeWithNullId() {
        // Arrange
        Node node = new Node("test-id", "Test Node", "Test description");
        conceptMap.addNode(node);
        
        // Act
        Node foundNode = conceptMap.findNodeById(null);
        
        // Assert
        assertNull(foundNode);
    }

    @Test
    @DisplayName("Should return true when concept map is empty")
    void shouldReturnTrueWhenConceptMapIsEmpty() {
        // Assert
        assertTrue(conceptMap.isEmpty());
    }

    @Test
    @DisplayName("Should return false when concept map has nodes")
    void shouldReturnFalseWhenConceptMapHasNodes() {
        // Arrange
        Node node = new Node("test-id", "Test Node", "Test description");
        conceptMap.addNode(node);
        
        // Assert
        assertFalse(conceptMap.isEmpty());
    }

    @Test
    @DisplayName("Should return defensive copy of nodes list")
    void shouldReturnDefensiveCopyOfNodesList() {
        // Arrange
        Node node = new Node("test-id", "Test Node", "Test description");
        conceptMap.addNode(node);
        
        // Act
        var nodesList = conceptMap.getNodes();
        
        // Assert
        assertEquals(1, nodesList.size());
        
        // Modify returned list should not affect internal state
        nodesList.clear();
        assertEquals(1, conceptMap.getNodes().size());
    }

    @Test
    @DisplayName("Should return defensive copy of links list")
    void shouldReturnDefensiveCopyOfLinksList() {
        // Arrange
        Node sourceNode = new Node("source", "Source", "Source node");
        Node targetNode = new Node("target", "Target", "Target node");
        conceptMap.addNode(sourceNode);
        conceptMap.addNode(targetNode);
        Link link = new Link("source", "target", "prerequisite");
        conceptMap.addLink(link);
        
        // Act
        var linksList = conceptMap.getLinks();
        
        // Assert
        assertEquals(1, linksList.size());
        
        // Modify returned list should not affect internal state
        linksList.clear();
        assertEquals(1, conceptMap.getLinks().size());
    }

    @Test
    @DisplayName("Should implement equals correctly")
    void shouldImplementEqualsCorrectly() {
        // Arrange
        ConceptMap conceptMap1 = new ConceptMap(testMetadata);
        ConceptMap conceptMap2 = new ConceptMap(testMetadata);
        
        // Act & Assert
        assertEquals(conceptMap1, conceptMap1); // reflexive
        assertNotEquals(conceptMap1, conceptMap2); // different instances with no ID
        assertNotEquals(conceptMap1, null); // null check
        assertNotEquals(conceptMap1, "string"); // different class
    }

    @Test
    @DisplayName("Should implement hashCode correctly")
    void shouldImplementHashCodeCorrectly() {
        // Arrange
        ConceptMap newConceptMap = new ConceptMap(testMetadata);
        
        // Act & Assert
        assertEquals(newConceptMap.hashCode(), newConceptMap.hashCode()); // consistent
        // Note: hashCode equality not guaranteed for different instances without ID
    }

    @Test
    @DisplayName("Should generate meaningful toString")
    void shouldGenerateMeaningfulToString() {
        // Arrange
        Node node = new Node("test-id", "Test Node", "Test description");
        conceptMap.addNode(node);
        
        // Act
        String result = conceptMap.toString();
        
        // Assert
        assertNotNull(result);
        assertTrue(result.contains("ConceptMap"));
        assertTrue(result.contains("1 nodes"));
        assertTrue(result.contains("0 links"));
        assertTrue(result.contains(testMetadata.toString()));
    }

    @Test
    @DisplayName("Should handle version field properly")
    void shouldHandleVersionFieldProperly() {
        // Assert - version should be null for new entities
        assertNull(conceptMap.getVersion());
    }
}
