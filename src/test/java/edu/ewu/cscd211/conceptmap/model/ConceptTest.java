package edu.ewu.cscd211.conceptmap.model;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Test class for Concept model using Test-Driven Development.
 * 
 * This test class demonstrates TDD principles for CSCD211 students:
 * 1. Write tests first (RED phase)
 * 2. Implement minimal code to pass (GREEN phase)  
 * 3. Refactor for better design (REFACTOR phase)
 * 
 * @author Test Guardian Agent
 * @version 1.0
 */
class ConceptTest {

    @Test
    @DisplayName("Should create concept with valid id and name")
    void shouldCreateConceptWithValidIdAndName() {
        // Arrange - This will FAIL initially since Concept doesn't exist yet
        String expectedId = "cscd211";
        String expectedName = "Computer Science Fundamentals II";
        
        // Act - This should create a new Concept object
        Concept concept = new Concept(expectedId, expectedName);
        
        // Assert - Verify the concept was created correctly
        assertNotNull(concept, "Concept should not be null");
        assertEquals(expectedId, concept.getId(), "Concept ID should match");
        assertEquals(expectedName, concept.getName(), "Concept name should match");
    }

    @Test
    @DisplayName("Should throw exception when creating concept with null id")
    void shouldThrowExceptionWhenIdIsNull() {
        // Arrange
        String nullId = null;
        String validName = "Valid Name";
        
        // Act & Assert - Should throw IllegalArgumentException
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> new Concept(nullId, validName),
            "Should throw IllegalArgumentException for null ID"
        );
        
        assertTrue(exception.getMessage().contains("ID cannot be null"),
                  "Exception message should mention null ID");
    }

    @Test
    @DisplayName("Should throw exception when creating concept with null name")
    void shouldThrowExceptionWhenNameIsNull() {
        // Arrange
        String validId = "valid-id";
        String nullName = null;
        
        // Act & Assert
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> new Concept(validId, nullName),
            "Should throw IllegalArgumentException for null name"
        );
        
        assertTrue(exception.getMessage().contains("Name cannot be null"),
                  "Exception message should mention null name");
    }

    @ParameterizedTest
    @DisplayName("Should throw exception for empty or blank strings")
    @ValueSource(strings = {"", "   ", "\t", "\n"})
    void shouldThrowExceptionForEmptyOrBlankStrings(String invalidInput) {
        // This demonstrates parametrized testing - a key concept for students
        assertThrows(
            IllegalArgumentException.class,
            () -> new Concept(invalidInput, "Valid Name"),
            "Should throw exception for empty/blank ID: '" + invalidInput + "'"
        );
        
        assertThrows(
            IllegalArgumentException.class,
            () -> new Concept("valid-id", invalidInput),
            "Should throw exception for empty/blank name: '" + invalidInput + "'"
        );
    }

    @Test
    @DisplayName("Should implement equals and hashCode correctly")
    void shouldImplementEqualsAndHashCodeCorrectly() {
        // Arrange - Create concepts with same and different data
        Concept concept1 = new Concept("cscd211", "Fundamentals II");
        Concept concept2 = new Concept("cscd211", "Fundamentals II");
        Concept concept3 = new Concept("cscd212", "Data Structures");
        
        // Act & Assert - Test equals contract
        assertEquals(concept1, concept2, "Concepts with same data should be equal");
        assertNotEquals(concept1, concept3, "Concepts with different data should not be equal");
        assertEquals(concept1.hashCode(), concept2.hashCode(), 
                    "Equal objects should have same hash code");
    }

    @Test
    @DisplayName("Should provide meaningful toString representation")
    void shouldProvideMeaningfulToStringRepresentation() {
        // Arrange
        Concept concept = new Concept("cscd211", "Computer Science Fundamentals II");
        
        // Act
        String toString = concept.toString();
        
        // Assert
        assertNotNull(toString, "toString should not return null");
        assertTrue(toString.contains("cscd211"), "toString should contain ID");
        assertTrue(toString.contains("Computer Science Fundamentals II"), 
                  "toString should contain name");
    }

    @Test
    @DisplayName("Should support setting and getting description")
    void shouldSupportSettingAndGettingDescription() {
        // Arrange
        Concept concept = new Concept("cscd211", "Fundamentals II");
        String expectedDescription = "Advanced programming concepts including data structures and algorithms";
        
        // Act
        concept.setDescription(expectedDescription);
        
        // Assert
        assertEquals(expectedDescription, concept.getDescription(),
                    "Description should be set and retrieved correctly");
    }
}
