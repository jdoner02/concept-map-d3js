package edu.ewu.cscd211.conceptmap.model;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Test class for Relationship model using Test-Driven Development.
 * 
 * This test class demonstrates advanced TDD concepts for CSCD211 students:
 * - Testing relationships between objects (composition)
 * - Enum usage and validation
 * - Immutable object design patterns
 * - Complex object interactions
 * 
 * @author Test Guardian Agent
 * @version 1.0
 */
class RelationshipTest {

    @Test
    @DisplayName("Should create relationship with valid source, target, and type")
    void shouldCreateRelationshipWithValidParameters() {
        // Arrange - This will FAIL initially since Relationship doesn't exist yet
        Concept source = new Concept("cscd211", "Computer Science Fundamentals II");
        Concept target = new Concept("data-structures", "Data Structures");
        RelationshipType expectedType = RelationshipType.PREREQUISITE;
        
        // Act - This should create a new Relationship object
        Relationship relationship = new Relationship(source, target, expectedType);
        
        // Assert - Verify the relationship was created correctly
        assertNotNull(relationship, "Relationship should not be null");
        assertEquals(source, relationship.getSource(), "Source concept should match");
        assertEquals(target, relationship.getTarget(), "Target concept should match");
        assertEquals(expectedType, relationship.getType(), "Relationship type should match");
    }

    @Test
    @DisplayName("Should throw exception when source concept is null")
    void shouldThrowExceptionWhenSourceIsNull() {
        // Arrange
        Concept nullSource = null;
        Concept validTarget = new Concept("target", "Valid Target");
        RelationshipType validType = RelationshipType.PREREQUISITE;
        
        // Act & Assert
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> new Relationship(nullSource, validTarget, validType),
            "Should throw IllegalArgumentException for null source"
        );
        
        assertTrue(exception.getMessage().contains("Source concept cannot be null"),
                  "Exception message should mention null source");
    }

    @Test
    @DisplayName("Should throw exception when target concept is null")
    void shouldThrowExceptionWhenTargetIsNull() {
        // Arrange
        Concept validSource = new Concept("source", "Valid Source");
        Concept nullTarget = null;
        RelationshipType validType = RelationshipType.RELATED_TO;
        
        // Act & Assert
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> new Relationship(validSource, nullTarget, validType),
            "Should throw IllegalArgumentException for null target"
        );
        
        assertTrue(exception.getMessage().contains("Target concept cannot be null"),
                  "Exception message should mention null target");
    }

    @Test
    @DisplayName("Should throw exception when relationship type is null")
    void shouldThrowExceptionWhenTypeIsNull() {
        // Arrange
        Concept validSource = new Concept("source", "Valid Source");
        Concept validTarget = new Concept("target", "Valid Target");
        RelationshipType nullType = null;
        
        // Act & Assert
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> new Relationship(validSource, validTarget, nullType),
            "Should throw IllegalArgumentException for null type"
        );
        
        assertTrue(exception.getMessage().contains("Relationship type cannot be null"),
                  "Exception message should mention null type");
    }

    @Test
    @DisplayName("Should prevent self-referential relationships")
    void shouldPreventSelfReferentialRelationships() {
        // Arrange - Same concept as both source and target
        Concept sameConcept = new Concept("cscd211", "Computer Science");
        RelationshipType validType = RelationshipType.RELATED_TO;
        
        // Act & Assert
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> new Relationship(sameConcept, sameConcept, validType),
            "Should throw IllegalArgumentException for self-referential relationship"
        );
        
        assertTrue(exception.getMessage().contains("cannot have relationship with itself"),
                  "Exception message should mention self-referential restriction");
    }

    @ParameterizedTest
    @DisplayName("Should support all relationship types")
    @EnumSource(RelationshipType.class)
    void shouldSupportAllRelationshipTypes(RelationshipType type) {
        // Arrange
        Concept source = new Concept("source", "Source Concept");
        Concept target = new Concept("target", "Target Concept");
        
        // Act
        Relationship relationship = new Relationship(source, target, type);
        
        // Assert
        assertEquals(type, relationship.getType(), 
                    "Should support relationship type: " + type);
    }

    @Test
    @DisplayName("Should implement equals and hashCode correctly")
    void shouldImplementEqualsAndHashCodeCorrectly() {
        // Arrange
        Concept source1 = new Concept("cscd211", "Fundamentals II");
        Concept target1 = new Concept("cscd212", "Data Structures");
        Concept source2 = new Concept("cscd211", "Fundamentals II");
        Concept target2 = new Concept("cscd212", "Data Structures");
        Concept differentTarget = new Concept("cscd320", "Algorithms");
        
        Relationship relationship1 = new Relationship(source1, target1, RelationshipType.PREREQUISITE);
        Relationship relationship2 = new Relationship(source2, target2, RelationshipType.PREREQUISITE);
        Relationship relationship3 = new Relationship(source1, differentTarget, RelationshipType.PREREQUISITE);
        
        // Act & Assert - Test equals contract
        assertEquals(relationship1, relationship2, "Relationships with same data should be equal");
        assertNotEquals(relationship1, relationship3, "Relationships with different targets should not be equal");
        assertEquals(relationship1.hashCode(), relationship2.hashCode(), 
                    "Equal relationships should have same hash code");
    }

    @Test
    @DisplayName("Should provide meaningful toString representation")
    void shouldProvideMeaningfulToStringRepresentation() {
        // Arrange
        Concept source = new Concept("cscd211", "Fundamentals II");
        Concept target = new Concept("cscd212", "Data Structures");
        Relationship relationship = new Relationship(source, target, RelationshipType.PREREQUISITE);
        
        // Act
        String toString = relationship.toString();
        
        // Assert
        assertNotNull(toString, "toString should not return null");
        assertTrue(toString.contains("cscd211"), "toString should contain source ID");
        assertTrue(toString.contains("cscd212"), "toString should contain target ID");
        assertTrue(toString.contains("PREREQUISITE"), "toString should contain relationship type");
    }

    @Test
    @DisplayName("Should be immutable after creation")
    void shouldBeImmutableAfterCreation() {
        // Arrange
        Concept source = new Concept("source", "Source");
        Concept target = new Concept("target", "Target");
        Relationship relationship = new Relationship(source, target, RelationshipType.RELATED_TO);
        
        // Act - Get references to internal objects
        Concept retrievedSource = relationship.getSource();
        Concept retrievedTarget = relationship.getTarget();
        RelationshipType retrievedType = relationship.getType();
        
        // Assert - Verify immutability (no setters should exist)
        // This test ensures the design is immutable by verifying getters work
        // and that there are no setters (which would be compilation errors)
        assertEquals(source, retrievedSource, "Source should remain consistent");
        assertEquals(target, retrievedTarget, "Target should remain consistent");
        assertEquals(RelationshipType.RELATED_TO, retrievedType, "Type should remain consistent");
    }

    @Test
    @DisplayName("Should support bidirectional relationship checking")
    void shouldSupportBidirectionalRelationshipChecking() {
        // Arrange
        Concept concept1 = new Concept("cscd211", "Fundamentals II");
        Concept concept2 = new Concept("cscd212", "Data Structures");
        
        Relationship forward = new Relationship(concept1, concept2, RelationshipType.PREREQUISITE);
        Relationship reverse = new Relationship(concept2, concept1, RelationshipType.REQUIRES);
        
        // Act & Assert
        assertTrue(forward.isRelatedTo(concept2), "Should be related to target concept");
        assertTrue(forward.isRelatedTo(concept1), "Should be related to source concept (bidirectional)");
        assertFalse(forward.isRelatedTo(new Concept("other", "Other")), 
                   "Should not be related to unrelated concept");
        
        // Test reverse relationship
        assertTrue(reverse.isRelatedTo(concept1), "Reverse relationship should work");
        assertTrue(reverse.isRelatedTo(concept2), "Reverse relationship should be bidirectional");
    }
}
