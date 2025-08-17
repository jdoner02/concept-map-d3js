package edu.ewu.cscd211.conceptmap.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Objects;

/**
 * Utility class for JSON validation and processing following CSCD211 standards.
 * 
 * This utility class demonstrates advanced Java principles for CSCD211 students:
 * - Static utility methods for common operations
 * - Proper exception handling with meaningful messages
 * - Input validation with defensive programming
 * - Use of final class to prevent inheritance
 * - Private constructor to prevent instantiation
 * 
 * @author Code Improvement Agent
 * @version 1.0
 * @since 1.0
 */
public final class JsonValidationUtils {
    
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    
    // Error messages as constants following CSCD211 standards
    private static final String ERROR_NULL_JSON = "JSON string cannot be null";
    private static final String ERROR_EMPTY_JSON = "JSON string cannot be empty";
    private static final String ERROR_INVALID_JSON = "Invalid JSON format";
    
    /**
     * Private constructor to prevent instantiation of utility class.
     * This follows the utility class pattern in CSCD211.
     */
    private JsonValidationUtils() {
        throw new UnsupportedOperationException("Utility class cannot be instantiated");
    }
    
    /**
     * Validates that a JSON string is not null, not empty, and has valid JSON syntax.
     * 
     * This method demonstrates:
     * - Input validation with comprehensive checks
     * - Exception handling for JSON parsing
     * - Defensive programming practices
     * 
     * @param json the JSON string to validate
     * @return true if the JSON is valid, false otherwise
     * @throws IllegalArgumentException if json is null
     */
    public static boolean isValidJson(final String json) {
        Objects.requireNonNull(json, ERROR_NULL_JSON);
        
        // Check for empty or whitespace-only strings
        if (json.trim().isEmpty()) {
            return false;
        }
        
        // Attempt to parse JSON to validate syntax
        try {
            OBJECT_MAPPER.readTree(json);
            return true;
        } catch (JsonProcessingException e) {
            return false;
        }
    }
    
    /**
     * Validates JSON and throws descriptive exceptions for invalid inputs.
     * 
     * This method provides more detailed error information than isValidJson()
     * and demonstrates proper exception handling patterns.
     * 
     * @param json the JSON string to validate
     * @throws IllegalArgumentException if json is null, empty, or invalid
     */
    public static void validateJsonOrThrow(final String json) {
        Objects.requireNonNull(json, ERROR_NULL_JSON);
        
        if (json.trim().isEmpty()) {
            throw new IllegalArgumentException(ERROR_EMPTY_JSON);
        }
        
        try {
            OBJECT_MAPPER.readTree(json);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException(ERROR_INVALID_JSON + ": " + e.getMessage(), e);
        }
    }
    
    /**
     * Parses JSON string into a JsonNode for further processing.
     * 
     * @param json the JSON string to parse
     * @return JsonNode representation of the JSON
     * @throws IllegalArgumentException if json is null, empty, or invalid
     */
    public static JsonNode parseJson(final String json) {
        validateJsonOrThrow(json);
        
        try {
            return OBJECT_MAPPER.readTree(json);
        } catch (JsonProcessingException e) {
            // This should not happen since we validated above, but handle defensively
            throw new IllegalArgumentException(ERROR_INVALID_JSON + ": " + e.getMessage(), e);
        }
    }
    
    /**
     * Checks if JSON string contains required fields.
     * 
     * @param json the JSON string to check
     * @param requiredFields array of field names that must be present
     * @return true if all required fields are present, false otherwise
     * @throws IllegalArgumentException if json is invalid or requiredFields is null
     */
    public static boolean hasRequiredFields(final String json, final String... requiredFields) {
        Objects.requireNonNull(requiredFields, "Required fields array cannot be null");
        
        final JsonNode jsonNode = parseJson(json);
        
        for (final String field : requiredFields) {
            if (!jsonNode.has(field)) {
                return false;
            }
        }
        
        return true;
    }
}
