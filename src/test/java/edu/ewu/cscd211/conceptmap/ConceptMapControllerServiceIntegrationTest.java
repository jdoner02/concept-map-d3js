package edu.ewu.cscd211.conceptmap;

import edu.ewu.cscd211.conceptmap.service.ConceptMapService;
import edu.ewu.cscd211.conceptmap.service.ConceptMapNotFoundException;
import edu.ewu.cscd211.conceptmap.service.ConceptMapReadException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ConceptMapController with service layer integration.
 * 
 * These tests demonstrate proper CSCD211 testing practices:
 * - Nested test classes for organization
 * - Comprehensive exception handling testing
 * - Service layer mocking with Mockito
 * - Response validation for HTTP status codes and headers
 * - Meaningful test names with @DisplayName
 * 
 * @author Code Improvement Agent
 * @version 1.0
 * @since 1.0
 */
class ConceptMapControllerServiceIntegrationTest {

    @Mock
    private ConceptMapService conceptMapService;
    
    private ConceptMapController controller;
    
    private static final String SAMPLE_JSON = "{\"metadata\":{\"version\":\"test\"},\"nodes\":[],\"links\":[]}";
    private static final String CONTENT_TYPE_HEADER = "Content-Type";
    private static final String APPLICATION_JSON = "application/json";
    
    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        controller = new ConceptMapController(conceptMapService);
    }
    
    @Nested
    @DisplayName("Constructor Tests")
    class ConstructorTests {
        
        @Test
        @DisplayName("Should throw NullPointerException when service is null")
        void shouldThrowExceptionWhenServiceIsNull() {
            // Act & Assert
            NullPointerException exception = assertThrows(
                NullPointerException.class,
                () -> new ConceptMapController(null),
                "Should throw NullPointerException for null service"
            );
            
            assertEquals("ConceptMapService cannot be null", exception.getMessage(),
                        "Should have descriptive error message");
        }
        
        @Test
        @DisplayName("Should create controller with valid service")
        void shouldCreateControllerWithValidService() {
            // Act
            ConceptMapController testController = new ConceptMapController(conceptMapService);
            
            // Assert
            assertNotNull(testController, "Controller should be created successfully");
        }
    }
    
    @Nested
    @DisplayName("Get Concept Map Tests")
    class GetConceptMapTests {
        
        @Test
        @DisplayName("Should return 200 with JSON when service returns valid data")
        void shouldReturn200WithValidJson() throws ConceptMapNotFoundException, ConceptMapReadException {
            // Arrange
            when(conceptMapService.getConceptMapJson()).thenReturn(SAMPLE_JSON);
            when(conceptMapService.isValidJson(SAMPLE_JSON)).thenReturn(true);
            
            // Act
            ResponseEntity<String> response = controller.getConceptMap();
            
            // Assert
            assertEquals(HttpStatus.OK, response.getStatusCode(),
                        "Should return HTTP 200 OK");
            assertEquals(APPLICATION_JSON, response.getHeaders().getFirst(CONTENT_TYPE_HEADER),
                        "Should set Content-Type header to application/json");
            assertEquals(SAMPLE_JSON, response.getBody(),
                        "Should return the JSON content from service");
            
            // Verify service interactions
            verify(conceptMapService).getConceptMapJson();
            verify(conceptMapService).isValidJson(SAMPLE_JSON);
        }
        
        @Test
        @DisplayName("Should return 404 when resource not found")
        void shouldReturn404WhenResourceNotFound() throws ConceptMapNotFoundException, ConceptMapReadException {
            // Arrange
            when(conceptMapService.getConceptMapJson()).thenThrow(new ConceptMapNotFoundException("Resource not found"));
            
            // Act
            ResponseEntity<String> response = controller.getConceptMap();
            
            // Assert
            assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode(),
                        "Should return HTTP 404 NOT FOUND");
            assertEquals(APPLICATION_JSON, response.getHeaders().getFirst(CONTENT_TYPE_HEADER),
                        "Should set Content-Type header to application/json");
            assertEquals("{\"error\":\"concept map not found\"}", response.getBody(),
                        "Should return standardized error JSON");
            
            verify(conceptMapService).getConceptMapJson();
        }
        
        @Test
        @DisplayName("Should return 500 when read error occurs")
        void shouldReturn500WhenReadErrorOccurs() throws ConceptMapNotFoundException, ConceptMapReadException {
            // Arrange
            when(conceptMapService.getConceptMapJson()).thenThrow(new ConceptMapReadException("Read failed"));
            
            // Act
            ResponseEntity<String> response = controller.getConceptMap();
            
            // Assert
            assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode(),
                        "Should return HTTP 500 INTERNAL SERVER ERROR");
            assertEquals(APPLICATION_JSON, response.getHeaders().getFirst(CONTENT_TYPE_HEADER),
                        "Should set Content-Type header to application/json");
            assertEquals("{\"error\":\"failed to read concept map\"}", response.getBody(),
                        "Should return standardized error JSON");
            
            verify(conceptMapService).getConceptMapJson();
        }
        
        @Test
        @DisplayName("Should return 500 when JSON is invalid")
        void shouldReturn500WhenJsonIsInvalid() throws ConceptMapNotFoundException, ConceptMapReadException {
            // Arrange
            String invalidJson = "";
            when(conceptMapService.getConceptMapJson()).thenReturn(invalidJson);
            when(conceptMapService.isValidJson(invalidJson)).thenReturn(false);
            
            // Act
            ResponseEntity<String> response = controller.getConceptMap();
            
            // Assert
            assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode(),
                        "Should return HTTP 500 INTERNAL SERVER ERROR for invalid JSON");
            assertEquals(APPLICATION_JSON, response.getHeaders().getFirst(CONTENT_TYPE_HEADER),
                        "Should set Content-Type header to application/json");
            assertEquals("{\"error\":\"failed to read concept map\"}", response.getBody(),
                        "Should return standardized error JSON");
            
            verify(conceptMapService).getConceptMapJson();
            verify(conceptMapService).isValidJson(invalidJson);
        }
    }
}
