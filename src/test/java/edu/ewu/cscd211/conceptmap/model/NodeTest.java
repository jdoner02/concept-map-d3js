package edu.ewu.cscd211.conceptmap.model;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive test suite for Node entity.
 * Following Test Guardian methodology with exhaustive coverage.
 * 
 * Test Categories:
 * 1. Constructor validation and behavior
 * 2. Getter methods
 * 3. Equals and hashCode contracts
 * 4. toString behavior
 * 5. Edge cases and error conditions
 */
class NodeTest {

    private Node validNode;
    private final String VALID_ID = "node-001";
    private final String VALID_NAME = "Object-Oriented Programming";
    private final String VALID_DESCRIPTION = "Core programming paradigm focusing on objects and classes";

    @BeforeEach
    void setUp() {
        validNode = new Node(VALID_ID, VALID_NAME, VALID_DESCRIPTION);
    }

    @Nested
    @DisplayName("Constructor Tests")
    class ConstructorTests {

        @Test
        @DisplayName("Valid constructor creates node with all required fields")
        void testValidConstruction() {
            // Arrange & Act
            Node node = new Node("test-id", "Test Name", "Test Description");
            
            // Assert
            assertAll("Node should be properly constructed",
                () -> assertEquals("test-id", node.getId()),
                () -> assertEquals("Test Name", node.getName()),
                () -> assertEquals("Test Description", node.getDescription()),
                () -> assertNull(node.getVersion(), "Version should be null for new entity")
            );
        }

        @Test
        @DisplayName("Constructor with null ID throws IllegalArgumentException")
        void testConstructorWithNullId() {
            // Arrange & Act & Assert
            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new Node(null, VALID_NAME, VALID_DESCRIPTION)
            );
            assertEquals("ID cannot be null", exception.getMessage());
        }

        @Test
        @DisplayName("Constructor with null name throws IllegalArgumentException")
        void testConstructorWithNullName() {
            // Arrange & Act & Assert
            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new Node(VALID_ID, null, VALID_DESCRIPTION)
            );
            assertEquals("Name cannot be null", exception.getMessage());
        }

        @Test
        @DisplayName("Constructor with null description throws IllegalArgumentException")
        void testConstructorWithNullDescription() {
            // Arrange & Act & Assert
            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new Node(VALID_ID, VALID_NAME, null)
            );
            assertEquals("Description cannot be null", exception.getMessage());
        }

        @Test
        @DisplayName("Constructor with empty ID throws IllegalArgumentException")
        void testConstructorWithEmptyId() {
            // Arrange & Act & Assert
            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new Node("", VALID_NAME, VALID_DESCRIPTION)
            );
            assertEquals("ID cannot be empty", exception.getMessage());
        }

        @Test
        @DisplayName("Constructor with whitespace-only ID throws IllegalArgumentException")
        void testConstructorWithWhitespaceOnlyId() {
            // Arrange & Act & Assert
            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new Node("   ", VALID_NAME, VALID_DESCRIPTION)
            );
            assertEquals("ID cannot be empty", exception.getMessage());
        }

        @Test
        @DisplayName("Constructor with empty name throws IllegalArgumentException")
        void testConstructorWithEmptyName() {
            // Arrange & Act & Assert
            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new Node(VALID_ID, "", VALID_DESCRIPTION)
            );
            assertEquals("Name cannot be empty", exception.getMessage());
        }

        @Test
        @DisplayName("Constructor with whitespace-only name throws IllegalArgumentException")
        void testConstructorWithWhitespaceOnlyName() {
            // Arrange & Act & Assert
            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new Node(VALID_ID, "   ", VALID_DESCRIPTION)
            );
            assertEquals("Name cannot be empty", exception.getMessage());
        }

        @Test
        @DisplayName("Constructor accepts empty description")
        void testConstructorWithEmptyDescription() {
            // Arrange & Act
            Node node = new Node(VALID_ID, VALID_NAME, "");
            
            // Assert
            assertEquals("", node.getDescription());
        }
    }

    @Nested
    @DisplayName("Getter Tests")
    class GetterTests {

        @Test
        @DisplayName("getId returns correct ID")
        void testGetId() {
            assertEquals(VALID_ID, validNode.getId());
        }

        @Test
        @DisplayName("getName returns correct name")
        void testGetName() {
            assertEquals(VALID_NAME, validNode.getName());
        }

        @Test
        @DisplayName("getDescription returns correct description")
        void testGetDescription() {
            assertEquals(VALID_DESCRIPTION, validNode.getDescription());
        }

        @Test
        @DisplayName("getVersion returns null for new entity")
        void testGetVersionForNewEntity() {
            assertNull(validNode.getVersion());
        }
    }

    @Nested
    @DisplayName("Equals and HashCode Tests")
    class EqualsAndHashCodeTests {

        @Test
        @DisplayName("equals returns true for same object reference")
        void testEqualsWithSameReference() {
            assertTrue(validNode.equals(validNode));
        }

        @Test
        @DisplayName("equals returns true for nodes with same ID")
        void testEqualsWithSameId() {
            // Arrange
            Node otherNode = new Node(VALID_ID, "Different Name", "Different Description");
            
            // Act & Assert
            assertTrue(validNode.equals(otherNode));
        }

        @Test
        @DisplayName("equals returns false for nodes with different ID")
        void testEqualsWithDifferentId() {
            // Arrange
            Node otherNode = new Node("different-id", VALID_NAME, VALID_DESCRIPTION);
            
            // Act & Assert
            assertFalse(validNode.equals(otherNode));
        }

        @Test
        @DisplayName("equals returns false for null")
        void testEqualsWithNull() {
            assertFalse(validNode.equals(null));
        }

        @Test
        @DisplayName("equals returns false for different class")
        void testEqualsWithDifferentClass() {
            assertFalse(validNode.equals("not a node"));
        }

        @Test
        @DisplayName("hashCode is consistent for same object")
        void testHashCodeConsistency() {
            // Arrange
            int initialHashCode = validNode.hashCode();
            
            // Act & Assert
            assertEquals(initialHashCode, validNode.hashCode());
        }

        @Test
        @DisplayName("hashCode is equal for nodes with same ID")
        void testHashCodeForEqualNodes() {
            // Arrange
            Node otherNode = new Node(VALID_ID, "Different Name", "Different Description");
            
            // Act & Assert
            assertEquals(validNode.hashCode(), otherNode.hashCode());
        }

        @Test
        @DisplayName("hashCode is different for nodes with different ID")
        void testHashCodeForDifferentNodes() {
            // Arrange
            Node otherNode = new Node("different-id", VALID_NAME, VALID_DESCRIPTION);
            
            // Act & Assert
            assertNotEquals(validNode.hashCode(), otherNode.hashCode());
        }
    }

    @Nested
    @DisplayName("ToString Tests")
    class ToStringTests {

        @Test
        @DisplayName("toString returns expected format")
        void testToString() {
            // Arrange
            String expected = "Node{id='node-001', name='Object-Oriented Programming'}";
            
            // Act
            String actual = validNode.toString();
            
            // Assert
            assertEquals(expected, actual);
        }

        @Test
        @DisplayName("toString handles special characters in ID and name")
        void testToStringWithSpecialCharacters() {
            // Arrange
            Node nodeWithSpecialChars = new Node("node-'test'", "Name with \"quotes\"", "Description");
            String expected = "Node{id='node-'test'', name='Name with \"quotes\"'}";
            
            // Act
            String actual = nodeWithSpecialChars.toString();
            
            // Assert
            assertEquals(expected, actual);
        }
    }

    @Nested
    @DisplayName("Edge Case Tests")
    class EdgeCaseTests {

        @Test
        @DisplayName("Node with maximum length values")
        void testNodeWithMaxLengthValues() {
            // Arrange
            String maxId = "a".repeat(100); // Assuming 100 char limit based on @Column annotation
            String maxName = "b".repeat(255); // Assuming 255 char limit based on @Column annotation
            String longDescription = "c".repeat(1000); // TEXT column should handle this
            
            // Act
            Node node = new Node(maxId, maxName, longDescription);
            
            // Assert
            assertAll("Node should handle maximum length values",
                () -> assertEquals(maxId, node.getId()),
                () -> assertEquals(maxName, node.getName()),
                () -> assertEquals(longDescription, node.getDescription())
            );
        }

        @Test
        @DisplayName("Node with Unicode characters")
        void testNodeWithUnicodeCharacters() {
            // Arrange
            String unicodeId = "node-测试-🔬";
            String unicodeName = "Тест ñoñó 🧪";
            String unicodeDescription = "Description with émojis 🔬🧬 and spëcial chars";
            
            // Act
            Node node = new Node(unicodeId, unicodeName, unicodeDescription);
            
            // Assert
            assertAll("Node should handle Unicode characters",
                () -> assertEquals(unicodeId, node.getId()),
                () -> assertEquals(unicodeName, node.getName()),
                () -> assertEquals(unicodeDescription, node.getDescription())
            );
        }
    }
}
