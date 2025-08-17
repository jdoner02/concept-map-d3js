package edu.ewu.cscd211.conceptmap.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.Objects;

/**
 * Domain entity representing a concept node in the educational concept map visualization.
 * 
 * <p>This class demonstrates several key enterprise development patterns and follows
 * CSCD211 programming standards for defensive programming and proper object-oriented design.</p>
 * 
 * <h3>Enterprise Patterns Implemented</h3>
 * <ul>
 *   <li><strong>Entity Pattern</strong>: Represents a core business object with identity</li>
 *   <li><strong>Value Object Characteristics</strong>: Immutable after construction</li>
 *   <li><strong>Domain Validation</strong>: Business rules enforced at object creation</li>
 *   <li><strong>JPA Entity</strong>: Database persistence with proper annotations</li>
 * </ul>
 * 
 * <h3>CSCD211 Programming Standards Demonstrated</h3>
 * <ul>
 *   <li><strong>Defensive Programming</strong>: All constructor parameters validated</li>
 *   <li><strong>Null Safety</strong>: Explicit null checks with descriptive error messages</li>
 *   <li><strong>Field Access</strong>: Uses {@code this.fieldName} syntax consistently</li>
 *   <li><strong>Immutability</strong>: No setters, object state fixed after construction</li>
 *   <li><strong>equals/hashCode Contract</strong>: Properly implemented using Objects utility</li>
 * </ul>
 * 
 * <h3>Database Design Considerations</h3>
 * <p>The JPA annotations demonstrate proper database design:</p>
 * <ul>
 *   <li><strong>Primary Key</strong>: String ID for natural business identifiers</li>
 *   <li><strong>Indexing</strong>: Index on name field for search performance</li>
 *   <li><strong>Constraints</strong>: NOT NULL constraints for required fields</li>
 *   <li><strong>Versioning</strong>: Optimistic locking with @Version annotation</li>
 * </ul>
 * 
 * <h3>Validation Strategy</h3>
 * <p>Multi-layered validation approach:</p>
 * <ol>
 *   <li><strong>Constructor Validation</strong>: Immediate null and empty checks</li>
 *   <li><strong>JPA Validation</strong>: {@code @NotBlank} and {@code @NotNull} annotations</li>
 *   <li><strong>Database Constraints</strong>: Column-level constraints for data integrity</li>
 * </ol>
 * 
 * <h3>Usage Example</h3>
 * <pre>{@code
 * // Create a concept node
 * Node variablesNode = new Node(
 *     "variables",
 *     "Variables and Data Types", 
 *     "Storage containers for data values in programming"
 * );
 * 
 * // Node is immutable after creation
 * String nodeId = variablesNode.getId();
 * String nodeName = variablesNode.getName();
 * }</pre>
 * 
 * @author CSCD211 Development Team
 * @version 2.0.0
 * @since 2025-01-20
 * 
 * @see <a href="https://martinfowler.com/eaaCatalog/domainModel.html">Domain Model Pattern</a>
 * @see <a href="https://docs.oracle.com/javaee/7/tutorial/persistence-intro.htm">JPA Persistence</a>
 */
@Entity
@Table(name = "nodes", 
       indexes = {@Index(name = "idx_node_name", columnList = "name")})
public class Node {
    
    @Id
    @NotBlank(message = "Node ID cannot be blank")
    @Column(name = "id", length = 100, nullable = false)
    private String id;
    
    @NotBlank(message = "Node name cannot be blank")
    @Column(name = "name", length = 255, nullable = false)
    private String name;
    
    @NotNull(message = "Description cannot be null")
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Version
    private Long version;

    // Default constructor for JPA
    protected Node() {}

    public Node(String id, String name, String description) {
        // Null validation with proper exception type
        if (id == null) {
            throw new IllegalArgumentException("ID cannot be null");
        }
        if (name == null) {
            throw new IllegalArgumentException("Name cannot be null");
        }
        if (description == null) {
            throw new IllegalArgumentException("Description cannot be null");
        }
        
        // Domain validation
        if (id.trim().isEmpty()) {
            throw new IllegalArgumentException("ID cannot be empty");
        }
        if (name.trim().isEmpty()) {
            throw new IllegalArgumentException("Name cannot be empty");
        }
        
        // Set fields after validation
        this.id = id;
        this.name = name;
        this.description = description;
        // Description can be empty but not null
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }
    
    public Long getVersion() {
        return version;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Node node = (Node) o;
        return Objects.equals(id, node.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return String.format("Node{id='%s', name='%s'}", id, name);
    }
}
