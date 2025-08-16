package edu.ewu.cscd211.conceptmap.model;

import java.util.Objects;

/**
 * Represents a relationship between two concepts in the concept map.
 * 
 * This class demonstrates advanced Java principles for CSCD211 students:
 * - Immutable object design (no setters after construction)
 * - Composition (contains Concept objects)
 * - Defensive programming with comprehensive validation
 * - Proper equals() and hashCode() implementation for complex objects
 * - Business logic methods (isRelatedTo)
 * 
 * @author Test Guardian Agent
 * @version 1.0
 * @since 1.0
 */
public class Relationship {
    
    /** The source concept in this relationship */
    private final Concept source;
    
    /** The target concept in this relationship */
    private final Concept target;
    
    /** The type of relationship between source and target */
    private final RelationshipType type;
    
    /**
     * Creates a new relationship between two concepts.
     * 
     * This constructor demonstrates comprehensive input validation
     * and immutable design patterns for students.
     * 
     * @param source the source concept (cannot be null)
     * @param target the target concept (cannot be null)
     * @param type the type of relationship (cannot be null)
     * @throws IllegalArgumentException if any parameter is null or if source equals target
     */
    public Relationship(Concept source, Concept target, RelationshipType type) {
        // Comprehensive input validation - defensive programming
        if (source == null) {
            throw new IllegalArgumentException("Source concept cannot be null");
        }
        if (target == null) {
            throw new IllegalArgumentException("Target concept cannot be null");
        }
        if (type == null) {
            throw new IllegalArgumentException("Relationship type cannot be null");
        }
        
        // Business rule: prevent self-referential relationships
        if (source.equals(target)) {
            throw new IllegalArgumentException("A concept cannot have relationship with itself");
        }
        
        // Assign to final fields (immutable design)
        this.source = source;
        this.target = target;
        this.type = type;
    }
    
    /**
     * Gets the source concept of this relationship.
     * 
     * @return the source concept (never null)
     */
    public Concept getSource() {
        return source;
    }
    
    /**
     * Gets the target concept of this relationship.
     * 
     * @return the target concept (never null)
     */
    public Concept getTarget() {
        return target;
    }
    
    /**
     * Gets the type of this relationship.
     * 
     * @return the relationship type (never null)
     */
    public RelationshipType getType() {
        return type;
    }
    
    /**
     * Checks if this relationship involves the specified concept.
     * 
     * This method demonstrates business logic implementation
     * and shows students how to create meaningful utility methods.
     * 
     * @param concept the concept to check
     * @return true if the concept is either the source or target of this relationship
     */
    public boolean isRelatedTo(Concept concept) {
        if (concept == null) {
            return false;
        }
        return source.equals(concept) || target.equals(concept);
    }
    
    /**
     * Compares this relationship with another object for equality.
     * 
     * Two relationships are considered equal if they have the same
     * source, target, and type. This demonstrates proper equals()
     * implementation for complex objects with multiple fields.
     * 
     * @param obj the object to compare with
     * @return true if the objects are equal, false otherwise
     */
    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }
        if (obj == null || getClass() != obj.getClass()) {
            return false;
        }
        Relationship that = (Relationship) obj;
        return Objects.equals(source, that.source) &&
               Objects.equals(target, that.target) &&
               type == that.type;
    }
    
    /**
     * Returns a hash code for this relationship.
     * 
     * This implementation follows the contract that equal objects
     * must have equal hash codes. Shows students how to properly
     * implement hashCode() for multi-field objects.
     * 
     * @return the hash code
     */
    @Override
    public int hashCode() {
        return Objects.hash(source, target, type);
    }
    
    /**
     * Returns a string representation of this relationship.
     * 
     * @return a string showing the source, target, and type of this relationship
     */
    @Override
    public String toString() {
        return String.format("Relationship{source=%s, target=%s, type=%s}", 
                           source.getId(), target.getId(), type);
    }
}
