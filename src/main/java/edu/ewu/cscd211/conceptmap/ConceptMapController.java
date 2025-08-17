package edu.ewu.cscd211.conceptmap;

import edu.ewu.cscd211.conceptmap.service.ConceptMapService;
import edu.ewu.cscd211.conceptmap.service.ConceptMapNotFoundException;
import edu.ewu.cscd211.conceptmap.service.ConceptMapReadException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Objects;

/**
 * REST Controller providing HTTP access to concept map visualization data.
 * 
 * <p>This controller exemplifies modern web API design patterns through:</p>
 * <ul>
 *   <li><strong>Layered Architecture</strong>: Separates HTTP concerns from business logic</li>
 *   <li><strong>Dependency Injection</strong>: Constructor-based injection for testability</li>
 *   <li><strong>Error Handling</strong>: Proper HTTP status codes with descriptive JSON responses</li>
 *   <li><strong>CORS Support</strong>: Configured for cross-origin web application access</li>
 * </ul>
 * 
 * <h3>API Design Philosophy</h3>
 * <p>The endpoint design follows RESTful principles where resources are nouns and 
 * HTTP methods indicate actions. The concept map is treated as a single, cacheable 
 * resource that clients can retrieve and process locally for visualization.</p>
 * 
 * <h3>Error Response Format</h3>
 * <pre>{@code
 * {
 *   "error": "descriptive message explaining what went wrong"
 * }
 * }</pre>
 * 
 * @author Educational Concept Map Project
 * @version 2.0
 * @since 1.0
 * @see ConceptMapService
 * @see <a href="https://restfulapi.net/">RESTful API Design Guidelines</a>
 */
@RestController
@RequestMapping("/api")
public class ConceptMapController {
    
    private final ConceptMapService conceptMapService;
    
    // Constants following CSCD211 standards
    private static final String HEADER_CONTENT_TYPE = "Content-Type";
    private static final String MEDIA_TYPE_JSON = "application/json";
    private static final String ERROR_NOT_FOUND = "{\"error\":\"concept map not found\"}";
    private static final String ERROR_READ_FAILURE = "{\"error\":\"failed to read concept map\"}";
    private static final String ERROR_NULL_SERVICE = "ConceptMapService cannot be null";
    
    /**
     * Initializes the controller with required dependencies using constructor injection.
     * 
     * <p>Constructor injection is preferred over field injection because it:</p>
     * <ul>
     *   <li>Makes dependencies explicit and prevents null pointer exceptions</li>
     *   <li>Enables immutable fields for thread safety</li>
     *   <li>Facilitates unit testing by allowing mock injection</li>
     *   <li>Follows the dependency inversion principle</li>
     * </ul>
     * 
     * @param conceptMapService service layer for concept map business operations
     * @throws IllegalArgumentException if conceptMapService is null, preventing runtime failures
     * 
     * @see <a href="https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#beans-constructor-injection">Spring Constructor Injection</a>
     */
    public ConceptMapController(final ConceptMapService conceptMapService) {
        this.conceptMapService = Objects.requireNonNull(conceptMapService, ERROR_NULL_SERVICE);
    }
    
    /**
     * Retrieves the complete concept map data as JSON for visualization rendering.
     * 
     * <p>This endpoint serves as the primary data source for the interactive concept map 
     * visualization. The response includes metadata, nodes (concepts), and links (relationships) 
     * in a format optimized for D3.js force-directed graph rendering.</p>
     * 
     * <h3>Response Structure</h3>
     * <pre>{@code
     * {
     *   "metadata": {
     *     "version": "6.3",
     *     "total_nodes": 55,
     *     "total_links": 146,
     *     "description": "Comprehensive programming concept map..."
     *   },
     *   "nodes": [
     *     {
     *       "id": "variables", 
     *       "name": "Variables and Data Types",
     *       "description": "Storage containers for data values...",
     *       "category": "fundamentals"
     *     }
     *   ],
     *   "links": [
     *     {
     *       "source": "variables",
     *       "target": "memory-model", 
     *       "label": "allocated in",
     *       "description": "Variables exist as memory locations..."
     *     }
     *   ]
     * }
     * }</pre>
     * 
     * <h3>Error Handling Strategy</h3>
     * <p>The method implements defensive error handling with specific HTTP status codes:</p>
     * <ul>
     *   <li><strong>404 Not Found</strong>: When the concept map resource doesn't exist</li>
     *   <li><strong>500 Internal Server Error</strong>: When file reading or parsing fails</li>
     *   <li><strong>200 OK</strong>: When data is successfully retrieved and validated</li>
     * </ul>
     * 
     * @return ResponseEntity containing concept map JSON data with appropriate HTTP status
     *         and Content-Type headers for optimal browser compatibility
     * 
     * @see <a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Status">HTTP Status Codes Reference</a>
     * @see <a href="https://tools.ietf.org/html/rfc7231#section-6">RFC 7231 Response Status Codes</a>
     */
    @GetMapping("/concept-map")
    public ResponseEntity<String> getConceptMap() {
        try {
            final String conceptMapJson = this.conceptMapService.getConceptMapJson();
            
            // Additional validation to ensure JSON is not empty
            if (!this.conceptMapService.isValidJson(conceptMapJson)) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .header(HEADER_CONTENT_TYPE, MEDIA_TYPE_JSON)
                        .body(ERROR_READ_FAILURE);
            }
            
            return ResponseEntity.ok()
                    .header(HEADER_CONTENT_TYPE, MEDIA_TYPE_JSON)
                    .body(conceptMapJson);
                    
        } catch (ConceptMapNotFoundException e) {
            // Resource not found -> 404 with deterministic JSON error body
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .header(HEADER_CONTENT_TYPE, MEDIA_TYPE_JSON)
                    .body(ERROR_NOT_FOUND);
                    
        } catch (ConceptMapReadException e) {
            // Read failure -> 500 with deterministic JSON error body
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .header(HEADER_CONTENT_TYPE, MEDIA_TYPE_JSON)
                    .body(ERROR_READ_FAILURE);
        }
    }
}
