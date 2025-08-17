package edu.ewu.cscd211.conceptmap.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import edu.ewu.cscd211.conceptmap.model.*;
import edu.ewu.cscd211.conceptmap.util.JsonValidationUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

/**
 * Service layer for concept map data processing and JSON serialization/deserialization.
 * 
 * <p>This service demonstrates the <strong>Service Layer Pattern</strong> by encapsulating
 * business logic and providing a clean API between the controller and data access layers.
 * It follows SOLID principles and demonstrates proper separation of concerns in Spring Boot
 * applications.</p>
 * 
 * <h3>Architecture Pattern: Service Layer</h3>
 * <p>The Service Layer pattern provides several benefits:</p>
 * <ul>
 *   <li><strong>Encapsulation</strong>: Business logic is centralized and reusable</li>
 *   <li><strong>Transaction Management</strong>: Services define transactional boundaries</li>
 *   <li><strong>Security</strong>: Method-level security can be applied</li>
 *   <li><strong>Testing</strong>: Business logic can be unit tested independently</li>
 * </ul>
 * 
 * <h3>JSON Processing Strategy</h3>
 * <p>This service uses Jackson ObjectMapper for JSON processing because:</p>
 * <ul>
 *   <li><strong>Performance</strong>: Stream-based parsing for large datasets</li>
 *   <li><strong>Type Safety</strong>: Automatic mapping to strongly-typed domain objects</li>
 *   <li><strong>Flexibility</strong>: Support for custom serialization/deserialization</li>
 *   <li><strong>Spring Integration</strong>: Seamless integration with Spring Boot auto-configuration</li>
 * </ul>
 * 
 * <h3>Domain Model Mapping</h3>
 * <p>The service converts JSON structures to domain objects:</p>
 * <pre>{@code
 * JSON Structure → Domain Objects
 * {
 *   "metadata": {...}     → Metadata.class
 *   "nodes": [...]        → List<Node>
 *   "links": [...]        → List<Link>
 * }
 * }</pre>
 * 
 * <h3>Error Handling Philosophy</h3>
 * <p>The service implements defensive programming by:</p>
 * <ul>
 *   <li>Validating all inputs using null checks and domain validation</li>
 *   <li>Throwing specific exceptions with detailed error messages</li>
 *   <li>Providing fallback values for optional fields</li>
 *   <li>Logging errors at appropriate levels for debugging</li>
 * </ul>
 * 
 * @author CSCD211 Development Team
 * @version 2.0.0
 * @since 2025-01-20
 * 
 * @see <a href="https://martinfowler.com/eaaCatalog/serviceLayer.html">Service Layer Pattern</a>
 * @see <a href="https://github.com/FasterXML/jackson-docs">Jackson Documentation</a>
 */
@Service
public class ConceptMapService {
    
    // Constants for JSON field names to avoid duplication and improve maintainability
    private static final String DESCRIPTION_FIELD = "description";
    private static final String ID_FIELD = "id";
    private static final String SOURCE_FIELD = "source";
    private static final String TARGET_FIELD = "target";
    private static final String VERSION_FIELD = "version";
    private static final String NAME_FIELD = "name";
    private static final String TYPE_FIELD = "type";
    private static final String METADATA_FIELD = "metadata";
    private static final String NODES_FIELD = "nodes";
    private static final String LINKS_FIELD = "links";
    private static final String DEFAULT_JSON_FILE = "concept-map.json";
    private static final String DEFAULT_RELATIONSHIP_TYPE = "RELATED_TO";
    
    private final ObjectMapper objectMapper;
    
    /**
     * Default constructor that creates a ConceptMapService with standard ObjectMapper configuration.
     * 
     * <p>This constructor demonstrates the <strong>Default Constructor Pattern</strong> and provides
     * a fallback when no custom ObjectMapper is available. The ObjectMapper is configured with
     * sensible defaults for JSON processing.</p>
     * 
     * <h3>Usage in Testing</h3>
     * <p>This constructor is particularly useful for unit testing where you don't need
     * custom JSON configuration:</p>
     * <pre>{@code
     * ConceptMapService service = new ConceptMapService();
     * // Service ready to use with default JSON handling
     * }</pre>
     * 
     * @see ObjectMapper
     * @see <a href="https://github.com/FasterXML/jackson-core">Jackson Core Documentation</a>
     */
    public ConceptMapService() {
        this.objectMapper = new ObjectMapper();
    }
    
    /**
     * Constructor with dependency injection for custom ObjectMapper configuration.
     * 
     * <p>This constructor enables <strong>Dependency Injection</strong> and demonstrates proper
     * use of constructor injection in Spring Boot services. Constructor injection is preferred
     * over field injection because it enables immutable fields and explicit dependencies.</p>
     * 
     * <h3>Benefits of Constructor Injection</h3>
     * <ul>
     *   <li><strong>Immutability</strong>: Final fields prevent accidental modification</li>
     *   <li><strong>Fail-Fast</strong>: Missing dependencies cause startup failures, not runtime errors</li>
     *   <li><strong>Testing</strong>: Easy to provide mock dependencies in unit tests</li>
     *   <li><strong>Thread Safety</strong>: Immutable fields are inherently thread-safe</li>
     * </ul>
     * 
     * <h3>Custom ObjectMapper Configuration Example</h3>
     * <pre>{@code
     * @Configuration
     * public class JacksonConfig {
     *     @Bean
     *     public ObjectMapper objectMapper() {
     *         return new ObjectMapper()
     *             .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
     *             .configure(SerializationFeature.INDENT_OUTPUT, true);
     *     }
     * }
     * }</pre>
     * 
     * @param objectMapper the Jackson ObjectMapper for JSON processing operations
     * @throws IllegalArgumentException if objectMapper is null
     * 
     * @see <a href="https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#beans-constructor-injection">Constructor Injection</a>
     */
    @Autowired
    public ConceptMapService(ObjectMapper objectMapper) {
        if (objectMapper == null) {
            throw new IllegalArgumentException("ObjectMapper cannot be null");
        }
        this.objectMapper = objectMapper;
    }
    
    /**
     * Parses metadata from a JSON node into a Metadata domain object.
     * 
     * @param metadataNode the JSON node containing metadata
     * @return a Metadata object with parsed values
     * @throws IllegalArgumentException if metadataNode is null or invalid
     */
    public Metadata parseMetadata(JsonNode metadataNode) {
        if (metadataNode == null) {
            throw new IllegalArgumentException("Metadata node cannot be null");
        }
        
        // Extract required fields - Metadata only takes version and description
        String version = getRequiredString(metadataNode, VERSION_FIELD);
        String description = getRequiredString(metadataNode, DESCRIPTION_FIELD);
        
        return new Metadata(version, description);
    }
    
    /**
     * Parses a node from a JSON node into a Node domain object.
     * 
     * @param nodeJson the JSON node containing node data
     * @return a Node object with parsed values
     * @throws IllegalArgumentException if nodeJson is null or invalid
     */
    public Node parseNode(JsonNode nodeJson) {
        if (nodeJson == null) {
            throw new IllegalArgumentException("Node JSON cannot be null");
        }
        
        String id = getRequiredString(nodeJson, ID_FIELD);
        String name = getRequiredString(nodeJson, NAME_FIELD); // JSON uses 'name' field
        String description = nodeJson.has(DESCRIPTION_FIELD) ? nodeJson.get(DESCRIPTION_FIELD).asText() : "";
        
        return new Node(id, name, description);
    }
    
    /**
     * Parses a link from a JSON node into a Link domain object.
     * 
     * @param linkJson the JSON node containing link data
     * @return a Link object with parsed values
     * @throws IllegalArgumentException if linkJson is null or invalid
     */
    public Link parseLink(JsonNode linkJson) {
        if (linkJson == null) {
            throw new IllegalArgumentException("Link JSON cannot be null");
        }
        
        String source = getRequiredString(linkJson, SOURCE_FIELD);
        String target = getRequiredString(linkJson, TARGET_FIELD);
        String relationshipType = linkJson.has(TYPE_FIELD) ? 
            linkJson.get(TYPE_FIELD).asText() : DEFAULT_RELATIONSHIP_TYPE;
        
        return new Link(source, target, relationshipType);
    }
    
    /**
     * Loads a complete concept map from the default JSON file (concept-map.json).
     * 
     * @return a ConceptMap object parsed from the default file
     * @throws IOException if the file cannot be read
     * @throws JsonProcessingException if the JSON cannot be parsed
     */
    public ConceptMap loadConceptMapFromJson() throws IOException {
        return loadConceptMapFromJson(DEFAULT_JSON_FILE);
    }
    
    /**
     * Loads a complete concept map from a classpath resource.
     * This method is designed for test scenarios where the JSON file is in the classpath.
     * 
     * @param resourcePath the path to the JSON resource in the classpath
     * @return a ConceptMap object parsed from the classpath resource
     * @throws IOException if the resource cannot be read
     * @throws JsonProcessingException if the JSON cannot be parsed
     * @throws IllegalArgumentException if the resource path is null or the resource is not found
     */
    public ConceptMap loadConceptMapFromClasspath(String resourcePath) throws IOException {
        if (resourcePath == null) {
            throw new IllegalArgumentException("Resource path cannot be null");
        }
        
        // Load resource from classpath
        try (InputStream inputStream = getClass().getClassLoader().getResourceAsStream(resourcePath)) {
            if (inputStream == null) {
                throw new IllegalArgumentException("Resource not found: " + resourcePath);
            }
            
            // Read JSON content from classpath resource
            String jsonContent = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
            
            // Parse and return the concept map
            return parseConceptMapFromJson(jsonContent);
        }
    }
    
    /**
     * Loads a complete concept map from a JSON file.
     * 
     * @param jsonFilePath the path to the JSON file
     * @return a ConceptMap object parsed from the file
     * @throws IOException if the file cannot be read
     * @throws JsonProcessingException if the JSON cannot be parsed
     * @throws IllegalArgumentException if the file path is null or the JSON structure is invalid
     */
    public ConceptMap loadConceptMapFromJson(String jsonFilePath) throws IOException {
        if (jsonFilePath == null) {
            throw new IllegalArgumentException("JSON file path cannot be null");
        }
        return loadConceptMapFromJson(Path.of(jsonFilePath));
    }
    
    /**
     * Loads a complete concept map from a JSON file using a Path object.
     * This method provides better testability and path handling.
     * 
     * @param jsonPath the Path to the JSON file
     * @return a ConceptMap object parsed from the file
     * @throws IOException if the file cannot be read
     * @throws JsonProcessingException if the JSON cannot be parsed
     * @throws IllegalArgumentException if the file path is null or the JSON structure is invalid
     */
    public ConceptMap loadConceptMapFromJson(Path jsonPath) throws IOException {
        if (jsonPath == null) {
            throw new IllegalArgumentException("JSON file path cannot be null");
        }
        
        // Read JSON content from file
        String jsonContent = Files.readString(jsonPath);
        
        // Parse and return the concept map
        return parseConceptMapFromJson(jsonContent);
    }
    
    /**
     * Parses a complete concept map from JSON string content.
     * This method is shared by both file and classpath loading methods.
     * 
     * @param jsonContent the JSON content as a string
     * @return a ConceptMap object parsed from the JSON content
     * @throws IOException if the JSON cannot be parsed
     * @throws JsonProcessingException if the JSON cannot be parsed
     * @throws IllegalArgumentException if the JSON structure is invalid
     */
    private ConceptMap parseConceptMapFromJson(String jsonContent) throws IOException {
        // Parse JSON into JsonNode for structured access
        JsonNode rootNode = objectMapper.readTree(jsonContent);
        
        // Parse metadata
        JsonNode metadataNode = rootNode.get(METADATA_FIELD);
        if (metadataNode == null) {
            throw new IllegalArgumentException("JSON must contain metadata section");
        }
        Metadata metadata = parseMetadata(metadataNode);
        
        // Parse nodes
        List<Node> nodes = new ArrayList<>();
        JsonNode nodesArray = rootNode.get(NODES_FIELD);
        if (nodesArray != null && nodesArray.isArray()) {
            for (JsonNode nodeJson : nodesArray) {
                nodes.add(parseNode(nodeJson));
            }
        }
        
        // Parse links
        List<Link> links = new ArrayList<>();
        JsonNode linksArray = rootNode.get(LINKS_FIELD);
        if (linksArray != null && linksArray.isArray()) {
            for (JsonNode linkJson : linksArray) {
                links.add(parseLink(linkJson));
            }
        }
        
        // Create ConceptMap with metadata and populate it
        ConceptMap conceptMap = new ConceptMap(metadata);
        
        // Add all nodes first
        for (Node node : nodes) {
            conceptMap.addNode(node);
        }
        
        // Add all links (this validates that referenced nodes exist)
        for (Link link : links) {
            conceptMap.addLink(link);
        }
        
        return conceptMap;
    }
    
    /**
     * Helper method to extract required string values from JSON nodes.
     * 
     * @param jsonNode the JSON node to extract from
     * @param fieldName the name of the field to extract
     * @return the string value of the field
     * @throws IllegalArgumentException if the field is missing or not a string
     */
    private String getRequiredString(JsonNode jsonNode, String fieldName) {
        JsonNode fieldNode = jsonNode.get(fieldName);
        if (fieldNode == null || !fieldNode.isTextual()) {
            throw new IllegalArgumentException(String.format("Required field '%s' is missing or not a string", fieldName));
        }
        return fieldNode.asText();
    }
    
    /**
     * Retrieves the concept map JSON content from the classpath resource for API consumption.
     * 
     * <p>This method demonstrates several important software engineering principles:</p>
     * 
     * <h3>Single Responsibility Principle</h3>
     * <p>The method has one clear responsibility: retrieve JSON content. It delegates
     * complex operations (file reading, exception handling) to specialized methods.</p>
     * 
     * <h3>Exception Translation Pattern</h3>
     * <p>The method translates low-level IOException into domain-specific exceptions:</p>
     * <ul>
     *   <li><strong>ConceptMapNotFoundException</strong>: Resource doesn't exist</li>
     *   <li><strong>ConceptMapReadException</strong>: I/O or parsing errors</li>
     * </ul>
     * 
     * <h3>Resource Management Strategy</h3>
     * <p>Uses classpath resource loading for:</p>
     * <ul>
     *   <li><strong>Deployment Flexibility</strong>: Works in JAR files and development</li>
     *   <li><strong>Immutability</strong>: Resources can't be accidentally modified</li>
     *   <li><strong>Performance</strong>: Resources are cached by the JVM</li>
     * </ul>
     * 
     * <h3>Usage Example</h3>
     * <pre>{@code
     * try {
     *     String jsonContent = conceptMapService.getConceptMapJson();
     *     // Process JSON for API response
     *     return ResponseEntity.ok(jsonContent);
     * } catch (ConceptMapNotFoundException e) {
     *     return ResponseEntity.notFound().build();
     * } catch (ConceptMapReadException e) {
     *     return ResponseEntity.internalServerError()
     *         .body("{\"error\":\"Failed to load concept map\"}");
     * }
     * }</pre>
     * 
     * @return the concept map JSON as a String, ready for HTTP response
     * @throws ConceptMapNotFoundException if the concept-map.json resource doesn't exist
     * @throws ConceptMapReadException if an I/O error occurs during resource reading
     * 
     * @see <a href="https://docs.oracle.com/javase/8/docs/api/java/lang/Class.html#getResourceAsStream-java.lang.String-">Class.getResourceAsStream()</a>
     * @see <a href="https://www.baeldung.com/java-custom-exception">Custom Exception Patterns</a>
     */
    public String getConceptMapJson() throws ConceptMapNotFoundException, ConceptMapReadException {
        try {
            return loadConceptMapJsonFromClasspath(DEFAULT_JSON_FILE);
        } catch (ConceptMapNotFoundException e) {
            // Re-throw as-is since it's already the correct exception type
            throw e;
        } catch (IOException e) {
            throw new ConceptMapReadException("Failed to read concept map from classpath", e);
        }
    }
    
    /**
     * Validates JSON string using comprehensive utility validation.
     * 
     * This method delegates to JsonValidationUtils for consistent validation
     * across the application, ensuring proper null checks, empty string handling,
     * and JSON syntax validation.
     * 
     * @param json the JSON string to validate
     * @return true if valid, false otherwise
     */
    public boolean isValidJson(final String json) {
        return JsonValidationUtils.isValidJson(json);
    }
    
    /**
     * Loads concept map JSON content from a classpath resource.
     * 
     * @param resourcePath the classpath resource path
     * @return the JSON content as a String
     * @throws IOException if an error occurs reading the resource
     * @throws ConceptMapNotFoundException if the resource is not found
     */
    private String loadConceptMapJsonFromClasspath(String resourcePath) throws IOException, ConceptMapNotFoundException {
        try (InputStream inputStream = getClass().getClassLoader().getResourceAsStream(resourcePath)) {
            if (inputStream == null) {
                throw new ConceptMapNotFoundException("Resource not found: " + resourcePath);
            }
            return new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
}
