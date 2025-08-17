package edu.ewu.cscd211.conceptmap.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import java.util.Objects;

/**
 * Link entity representing a relationship between two nodes in the concept map.
 * Enterprise-ready JPA entity with proper validation and database mapping.
 */
@Entity
@Table(name = "links",
       indexes = {
           @Index(name = "idx_link_source", columnList = "source_id"),
           @Index(name = "idx_link_target", columnList = "target_id"),
           @Index(name = "idx_link_type", columnList = "relationship_type")
       })
public class Link {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Source ID cannot be blank")
    @Column(name = "source_id", length = 100, nullable = false)
    private String sourceId;
    
    @NotBlank(message = "Target ID cannot be blank")
    @Column(name = "target_id", length = 100, nullable = false)
    private String targetId;
    
    @NotBlank(message = "Relationship type cannot be blank")
    @Column(name = "relationship_type", length = 100, nullable = false)
    private String relationshipType;
    
    @Version
    private Long version;

    // Default constructor for JPA
    protected Link() {}

    public Link(String sourceId, String targetId, String relationshipType) {
        // Null validation with proper exception type
        if (sourceId == null) {
            throw new IllegalArgumentException("Source ID cannot be null");
        }
        if (targetId == null) {
            throw new IllegalArgumentException("Target ID cannot be null");
        }
        if (relationshipType == null) {
            throw new IllegalArgumentException("Relationship type cannot be null");
        }
        
        // Domain validation
        if (sourceId.trim().isEmpty()) {
            throw new IllegalArgumentException("Source ID cannot be empty");
        }
        if (targetId.trim().isEmpty()) {
            throw new IllegalArgumentException("Target ID cannot be empty");
        }
        if (relationshipType.trim().isEmpty()) {
            throw new IllegalArgumentException("Relationship type cannot be empty");
        }
        
        // Set fields after validation
        this.sourceId = sourceId;
        this.targetId = targetId;
        this.relationshipType = relationshipType;
    }

    public Long getId() {
        return id;
    }

    public String getSourceId() {
        return sourceId;
    }

    public String getTargetId() {
        return targetId;
    }

    public String getRelationshipType() {
        return relationshipType;
    }
    
    public Long getVersion() {
        return version;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Link link = (Link) o;
        return Objects.equals(sourceId, link.sourceId) &&
               Objects.equals(targetId, link.targetId) &&
               Objects.equals(relationshipType, link.relationshipType);
    }

    @Override
    public int hashCode() {
        return Objects.hash(sourceId, targetId, relationshipType);
    }

    @Override
    public String toString() {
        return String.format("Link{sourceId='%s', targetId='%s', type='%s'}", 
                           sourceId, targetId, relationshipType);
    }
}
