package edu.ewu.cscd211.conceptmap.model;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive test suite for Link entity.
 * Following Test Guardian methodology with exhaustive coverage.
 * 
 * Test Categories:
 * 1. Constructor validation and behavior
 * 2. Getter methods
 * 3. Equals and hashCode contracts
 * 4. toString behavior
 * 5. Edge cases and error conditions
 */
class LinkTest {

    private Link validLink;
    private final String VALID_SOURCE_ID = "node-001";
    private final String VALID_TARGET_ID = "node-002";
    private final String VALID_RELATIONSHIP_TYPE = "prerequisite";

    @BeforeEach
    void setUp() {
        validLink = new Link(VALID_SOURCE_ID, VALID_TARGET_ID, VALID_RELATIONSHIP_TYPE);
    }

    @Nested
    @DisplayName("Constructor Tests")
    class ConstructorTests {

        @Test
        @DisplayName("Valid constructor creates link with all required fields")
        void testValidConstruction() {
            // Arrange & Act
            Link link = new Link("source-123", "target-456", "implements");
            
            // Assert
            assertAll("Link should be properly constructed",
                () -> assertEquals("source-123", link.getSourceId()),
                () -> assertEquals("target-456", link.getTargetId()),
                () -> assertEquals("implements", link.getRelationshipType()),
                () -> assertNull(link.getId(), "ID should be null for new entity"),
                () -> assertNull(link.getVersion(), "Version should be null for new entity")
            );
        }

        @Test
        @DisplayName("Constructor with null sourceId throws IllegalArgumentException")
        void testConstructorWithNullSourceId() {
            // Arrange & Act & Assert
            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new Link(null, VALID_TARGET_ID, VALID_RELATIONSHIP_TYPE)
            );
            assertEquals("Source ID cannot be null", exception.getMessage());
        }

        @Test
        @DisplayName("Constructor with null targetId throws IllegalArgumentException")
        void testConstructorWithNullTargetId() {
            // Arrange & Act & Assert
            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new Link(VALID_SOURCE_ID, null, VALID_RELATIONSHIP_TYPE)
            );
            assertEquals("Target ID cannot be null", exception.getMessage());
        }

        @Test
        @DisplayName("Constructor with null relationshipType throws IllegalArgumentException")
        void testConstructorWithNullRelationshipType() {
            // Arrange & Act & Assert
            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new Link(VALID_SOURCE_ID, VALID_TARGET_ID, null)
            );
            assertEquals("Relationship type cannot be null", exception.getMessage());
        }

        @Test
        @DisplayName("Constructor with empty sourceId throws IllegalArgumentException")
        void testConstructorWithEmptySourceId() {
            // Arrange & Act & Assert
            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new Link("", VALID_TARGET_ID, VALID_RELATIONSHIP_TYPE)
            );
            assertEquals("Source ID cannot be empty", exception.getMessage());
        }

        @Test
        @DisplayName("Constructor with whitespace-only sourceId throws IllegalArgumentException")
        void testConstructorWithWhitespaceOnlySourceId() {
            // Arrange & Act & Assert
            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new Link("   ", VALID_TARGET_ID, VALID_RELATIONSHIP_TYPE)
            );
            assertEquals("Source ID cannot be empty", exception.getMessage());
        }

        @Test
        @DisplayName("Constructor with empty targetId throws IllegalArgumentException")
        void testConstructorWithEmptyTargetId() {
            // Arrange & Act & Assert
            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new Link(VALID_SOURCE_ID, "", VALID_RELATIONSHIP_TYPE)
            );
            assertEquals("Target ID cannot be empty", exception.getMessage());
        }

        @Test
        @DisplayName("Constructor with whitespace-only targetId throws IllegalArgumentException")
        void testConstructorWithWhitespaceOnlyTargetId() {
            // Arrange & Act & Assert
            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new Link(VALID_SOURCE_ID, "   ", VALID_RELATIONSHIP_TYPE)
            );
            assertEquals("Target ID cannot be empty", exception.getMessage());
        }

        @Test
        @DisplayName("Constructor with empty relationshipType throws IllegalArgumentException")
        void testConstructorWithEmptyRelationshipType() {
            // Arrange & Act & Assert
            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new Link(VALID_SOURCE_ID, VALID_TARGET_ID, "")
            );
            assertEquals("Relationship type cannot be empty", exception.getMessage());
        }

        @Test
        @DisplayName("Constructor with whitespace-only relationshipType throws IllegalArgumentException")
        void testConstructorWithWhitespaceOnlyRelationshipType() {
            // Arrange & Act & Assert
            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> new Link(VALID_SOURCE_ID, VALID_TARGET_ID, "   ")
            );
            assertEquals("Relationship type cannot be empty", exception.getMessage());
        }

        @Test
        @DisplayName("Constructor with same sourceId and targetId succeeds")
        void testConstructorWithSameSourceAndTarget() {
            // Arrange & Act
            Link selfLink = new Link("same-node", "same-node", "self-reference");
            
            // Assert
            assertAll("Self-referencing link should be allowed",
                () -> assertEquals("same-node", selfLink.getSourceId()),
                () -> assertEquals("same-node", selfLink.getTargetId()),
                () -> assertEquals("self-reference", selfLink.getRelationshipType())
            );
        }
    }

    @Nested
    @DisplayName("Getter Tests")
    class GetterTests {

        @Test
        @DisplayName("getId returns null for new entity")
        void testGetIdForNewEntity() {
            assertNull(validLink.getId());
        }

        @Test
        @DisplayName("getSourceId returns correct source ID")
        void testGetSourceId() {
            assertEquals(VALID_SOURCE_ID, validLink.getSourceId());
        }

        @Test
        @DisplayName("getTargetId returns correct target ID")
        void testGetTargetId() {
            assertEquals(VALID_TARGET_ID, validLink.getTargetId());
        }

        @Test
        @DisplayName("getRelationshipType returns correct relationship type")
        void testGetRelationshipType() {
            assertEquals(VALID_RELATIONSHIP_TYPE, validLink.getRelationshipType());
        }

        @Test
        @DisplayName("getVersion returns null for new entity")
        void testGetVersionForNewEntity() {
            assertNull(validLink.getVersion());
        }
    }

    @Nested
    @DisplayName("Equals and HashCode Tests")
    class EqualsAndHashCodeTests {

        @Test
        @DisplayName("equals returns true for same object reference")
        void testEqualsWithSameReference() {
            assertTrue(validLink.equals(validLink));
        }

        @Test
        @DisplayName("equals returns true for links with same source, target, and type")
        void testEqualsWithSameFields() {
            // Arrange
            Link otherLink = new Link(VALID_SOURCE_ID, VALID_TARGET_ID, VALID_RELATIONSHIP_TYPE);
            
            // Act & Assert
            assertTrue(validLink.equals(otherLink));
        }

        @Test
        @DisplayName("equals returns false for links with different source ID")
        void testEqualsWithDifferentSourceId() {
            // Arrange
            Link otherLink = new Link("different-source", VALID_TARGET_ID, VALID_RELATIONSHIP_TYPE);
            
            // Act & Assert
            assertFalse(validLink.equals(otherLink));
        }

        @Test
        @DisplayName("equals returns false for links with different target ID")
        void testEqualsWithDifferentTargetId() {
            // Arrange
            Link otherLink = new Link(VALID_SOURCE_ID, "different-target", VALID_RELATIONSHIP_TYPE);
            
            // Act & Assert
            assertFalse(validLink.equals(otherLink));
        }

        @Test
        @DisplayName("equals returns false for links with different relationship type")
        void testEqualsWithDifferentRelationshipType() {
            // Arrange
            Link otherLink = new Link(VALID_SOURCE_ID, VALID_TARGET_ID, "different-type");
            
            // Act & Assert
            assertFalse(validLink.equals(otherLink));
        }

        @Test
        @DisplayName("equals returns false for null")
        void testEqualsWithNull() {
            assertFalse(validLink.equals(null));
        }

        @Test
        @DisplayName("equals returns false for different class")
        void testEqualsWithDifferentClass() {
            assertFalse(validLink.equals("not a link"));
        }

        @Test
        @DisplayName("hashCode is consistent for same object")
        void testHashCodeConsistency() {
            // Arrange
            int initialHashCode = validLink.hashCode();
            
            // Act & Assert
            assertEquals(initialHashCode, validLink.hashCode());
        }

        @Test
        @DisplayName("hashCode is equal for links with same fields")
        void testHashCodeForEqualLinks() {
            // Arrange
            Link otherLink = new Link(VALID_SOURCE_ID, VALID_TARGET_ID, VALID_RELATIONSHIP_TYPE);
            
            // Act & Assert
            assertEquals(validLink.hashCode(), otherLink.hashCode());
        }

        @Test
        @DisplayName("hashCode is different for links with different fields")
        void testHashCodeForDifferentLinks() {
            // Arrange
            Link otherLink = new Link("different-source", VALID_TARGET_ID, VALID_RELATIONSHIP_TYPE);
            
            // Act & Assert
            assertNotEquals(validLink.hashCode(), otherLink.hashCode());
        }
    }

    @Nested
    @DisplayName("ToString Tests")
    class ToStringTests {

        @Test
        @DisplayName("toString returns expected format")
        void testToString() {
            // Arrange
            String expected = "Link{sourceId='node-001', targetId='node-002', type='prerequisite'}";
            
            // Act
            String actual = validLink.toString();
            
            // Assert
            assertEquals(expected, actual);
        }

        @Test
        @DisplayName("toString handles special characters")
        void testToStringWithSpecialCharacters() {
            // Arrange
            Link linkWithSpecialChars = new Link("node-'test'", "node-\"quote\"", "type-&-symbol");
            String expected = "Link{sourceId='node-'test'', targetId='node-\"quote\"', type='type-&-symbol'}";
            
            // Act
            String actual = linkWithSpecialChars.toString();
            
            // Assert
            assertEquals(expected, actual);
        }
    }

    @Nested
    @DisplayName("Edge Case Tests")
    class EdgeCaseTests {

        @Test
        @DisplayName("Link with maximum length values")
        void testLinkWithMaxLengthValues() {
            // Arrange
            String maxSourceId = "a".repeat(100); // Assuming 100 char limit based on @Column annotation
            String maxTargetId = "b".repeat(100);
            String maxRelationshipType = "c".repeat(100);
            
            // Act
            Link link = new Link(maxSourceId, maxTargetId, maxRelationshipType);
            
            // Assert
            assertAll("Link should handle maximum length values",
                () -> assertEquals(maxSourceId, link.getSourceId()),
                () -> assertEquals(maxTargetId, link.getTargetId()),
                () -> assertEquals(maxRelationshipType, link.getRelationshipType())
            );
        }

        @Test
        @DisplayName("Link with Unicode characters")
        void testLinkWithUnicodeCharacters() {
            // Arrange
            String unicodeSourceId = "node-测试-🔬";
            String unicodeTargetId = "node-Тест-🧪";
            String unicodeRelationshipType = "relationship-ñoñó-🔗";
            
            // Act
            Link link = new Link(unicodeSourceId, unicodeTargetId, unicodeRelationshipType);
            
            // Assert
            assertAll("Link should handle Unicode characters",
                () -> assertEquals(unicodeSourceId, link.getSourceId()),
                () -> assertEquals(unicodeTargetId, link.getTargetId()),
                () -> assertEquals(unicodeRelationshipType, link.getRelationshipType())
            );
        }

        @Test
        @DisplayName("Link with various relationship types")
        void testLinkWithVariousRelationshipTypes() {
            // Arrange
            String[] relationshipTypes = {
                "prerequisite", "enables", "implements", "extends", "requires",
                "supports", "conflicts", "supersedes", "similar-to", "part-of"
            };
            
            // Act & Assert
            for (String type : relationshipTypes) {
                assertDoesNotThrow(() -> {
                    Link link = new Link("source", "target", type);
                    assertEquals(type, link.getRelationshipType());
                }, "Should accept relationship type: " + type);
            }
        }
    }
}
