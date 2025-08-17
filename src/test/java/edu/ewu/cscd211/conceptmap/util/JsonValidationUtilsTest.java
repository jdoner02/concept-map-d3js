package edu.ewu.cscd211.conceptmap.util;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;

import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationTargetException;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * Comprehensive unit tests for JsonValidationUtils following CSCD211 TDD standards.
 * 
 * These tests demonstrate:
 * - Nested test classes for logical organization
 * - Parameterized tests for testing multiple inputs efficiently
 * - Exception testing with specific exception types and messages
 * - Comprehensive coverage of edge cases and error conditions
 * 
 * @author Code Improvement Agent
 * @version 1.0
 * @since 1.0
 */
class JsonValidationUtilsTest {

    private static final String VALID_JSON = "{\"key\":\"value\",\"number\":42}";
    private static final String EMPTY_OBJECT_JSON = "{}";
    private static final String ARRAY_JSON = "[1,2,3]";
    
    @Nested
    @DisplayName("Constructor Tests")
    class ConstructorTests {
        
        @Test
        @DisplayName("Should throw exception when trying to instantiate utility class")
        void shouldThrowExceptionWhenInstantiating() throws Exception {
            final Constructor<JsonValidationUtils> constructor = JsonValidationUtils.class.getDeclaredConstructor();
            constructor.setAccessible(true);
            
            final InvocationTargetException exception = assertThrows(InvocationTargetException.class, 
                constructor::newInstance, "Should prevent instantiation of utility class");
            
            assertThat(exception.getCause()).isInstanceOf(UnsupportedOperationException.class);
            assertThat(exception.getCause().getMessage()).isEqualTo("Utility class cannot be instantiated");
        }
    }
    
    @Nested
    @DisplayName("isValidJson Tests")
    class IsValidJsonTests {
        
        @Test
        @DisplayName("Should return true for valid JSON object")
        void shouldReturnTrueForValidJsonObject() {
            assertTrue(JsonValidationUtils.isValidJson(VALID_JSON),
                      "Should accept valid JSON object");
        }
        
        @Test
        @DisplayName("Should return true for valid empty JSON object")
        void shouldReturnTrueForValidEmptyJsonObject() {
            assertTrue(JsonValidationUtils.isValidJson(EMPTY_OBJECT_JSON),
                      "Should accept valid empty JSON object");
        }
        
        @Test
        @DisplayName("Should return true for valid JSON array")
        void shouldReturnTrueForValidJsonArray() {
            assertTrue(JsonValidationUtils.isValidJson(ARRAY_JSON),
                      "Should accept valid JSON array");
        }
        
        @ParameterizedTest
        @DisplayName("Should return false for invalid JSON")
        @ValueSource(strings = {
            "{invalid}", 
            "{\"key\":}", 
            "{\"key\"\"value\"}", 
            "not json at all",
            "   ",
            ""
        })
        void shouldReturnFalseForInvalidJson(String invalidJson) {
            assertFalse(JsonValidationUtils.isValidJson(invalidJson),
                       "Should reject invalid JSON: " + invalidJson);
        }
        
        @Test
        @DisplayName("Should throw NullPointerException for null input")
        void shouldThrowExceptionForNullInput() {
            NullPointerException exception = assertThrows(
                NullPointerException.class,
                () -> JsonValidationUtils.isValidJson(null),
                "Should throw NullPointerException for null input"
            );
            
            assertEquals("JSON string cannot be null", exception.getMessage(),
                        "Should have descriptive error message");
        }
    }
    
    @Nested
    @DisplayName("validateJsonOrThrow Tests")
    class ValidateJsonOrThrowTests {
        
        @Test
        @DisplayName("Should not throw for valid JSON")
        void shouldNotThrowForValidJson() {
            assertDoesNotThrow(() -> JsonValidationUtils.validateJsonOrThrow(VALID_JSON),
                              "Should not throw for valid JSON");
        }
        
        @Test
        @DisplayName("Should throw IllegalArgumentException for null JSON")
        void shouldThrowForNullJson() {
            NullPointerException exception = assertThrows(
                NullPointerException.class,
                () -> JsonValidationUtils.validateJsonOrThrow(null),
                "Should throw NullPointerException for null JSON"
            );
            
            assertEquals("JSON string cannot be null", exception.getMessage());
        }
        
        @ParameterizedTest
        @DisplayName("Should throw IllegalArgumentException for empty or whitespace JSON")
        @ValueSource(strings = {"", "   ", "\\t", "\\n"})
        void shouldThrowForEmptyJson(String emptyJson) {
            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> JsonValidationUtils.validateJsonOrThrow(emptyJson),
                "Should throw IllegalArgumentException for empty JSON"
            );
            
            // Accept either empty string validation or JSON parsing error for edge cases
            assertThat(exception.getMessage())
                .satisfiesAnyOf(
                    message -> assertThat(message).isEqualTo("JSON string cannot be empty"),
                    message -> assertThat(message).startsWith("Invalid JSON format:")
                );
        }
        
        @Test
        @DisplayName("Should throw IllegalArgumentException for invalid JSON syntax")
        void shouldThrowForInvalidJsonSyntax() {
            String invalidJson = "{invalid json}";
            
            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> JsonValidationUtils.validateJsonOrThrow(invalidJson),
                "Should throw IllegalArgumentException for invalid JSON syntax"
            );
            
            assertTrue(exception.getMessage().startsWith("Invalid JSON format:"),
                      "Should have descriptive error message starting with 'Invalid JSON format:'");
        }
    }
    
    @Nested
    @DisplayName("parseJson Tests")
    class ParseJsonTests {
        
        @Test
        @DisplayName("Should successfully parse valid JSON")
        void shouldParseValidJson() {
            var jsonNode = JsonValidationUtils.parseJson(VALID_JSON);
            
            assertNotNull(jsonNode, "Should return non-null JsonNode");
            assertTrue(jsonNode.isObject(), "Should parse as JSON object");
            assertEquals("value", jsonNode.get("key").asText(), "Should parse field values correctly");
            assertEquals(42, jsonNode.get("number").asInt(), "Should parse numeric values correctly");
        }
        
        @Test
        @DisplayName("Should throw IllegalArgumentException for invalid JSON")
        void shouldThrowForInvalidJson() {
            String invalidJson = "{invalid}";
            
            IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> JsonValidationUtils.parseJson(invalidJson),
                "Should throw IllegalArgumentException for invalid JSON"
            );
            
            assertTrue(exception.getMessage().startsWith("Invalid JSON format:"),
                      "Should have descriptive error message");
        }
    }
    
    @Nested
    @DisplayName("hasRequiredFields Tests")
    class HasRequiredFieldsTests {
        
        @Test
        @DisplayName("Should return true when all required fields are present")
        void shouldReturnTrueWhenAllFieldsPresent() {
            assertTrue(JsonValidationUtils.hasRequiredFields(VALID_JSON, "key", "number"),
                      "Should return true when all required fields are present");
        }
        
        @Test
        @DisplayName("Should return false when required field is missing")
        void shouldReturnFalseWhenFieldMissing() {
            assertFalse(JsonValidationUtils.hasRequiredFields(VALID_JSON, "key", "missing"),
                       "Should return false when required field is missing");
        }
        
        @Test
        @DisplayName("Should return true for empty requirements")
        void shouldReturnTrueForEmptyRequirements() {
            assertTrue(JsonValidationUtils.hasRequiredFields(VALID_JSON),
                      "Should return true when no fields are required");
        }
        
        @Test
        @DisplayName("Should throw NullPointerException for null required fields array")
        void shouldThrowForNullRequiredFields() {
            NullPointerException exception = assertThrows(
                NullPointerException.class,
                () -> JsonValidationUtils.hasRequiredFields(VALID_JSON, (String[]) null),
                "Should throw NullPointerException for null required fields"
            );
            
            assertEquals("Required fields array cannot be null", exception.getMessage());
        }
    }
}
