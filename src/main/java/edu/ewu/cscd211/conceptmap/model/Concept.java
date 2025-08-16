package edu.ewu.cscd211.conceptmap.model;

import java.util.Objects;

/**
 * Represents a concept in the concept map.
 * 
 * This class demonstrates key Java principles for CSCD211 students:
 * - Encapsulation with private fields and public methods
 * - Input validation and defensive programming
 * - Proper implementation of equals() and hashCode()
 * - JavaDoc documentation standards
 * - Constructor overloading
 * 
 * @author Test Guardian Agent
 * @version 1.0
 * @since 1.0
 */
public class Concept {
    
    /** The unique identifier for this concept */
    private final String id;
    
    /** The human-readable name of this concept */
    private final String name;
    
    /** Optional description providing more details about this concept */
    private String description;
    
    /**
     * Creates a new concept with the specified ID and name.
     * 
     * This constructor demonstrates input validation patterns that students
     * should learn for defensive programming.
     * 
     * @param id the unique identifier for this concept (cannot be null or empty)
     * @param name the human-readable name (cannot be null or empty)
     * @throws IllegalArgumentException if id or name is null, empty, or blank
     */
    public Concept(String id, String name) {
        // Input validation - defensive programming practice
        if (id == null) {
            throw new IllegalArgumentException("ID cannot be null");
        }
        if (name == null) {
            throw new IllegalArgumentException("Name cannot be null");
        }
        if (id.trim().isEmpty()) {
            throw new IllegalArgumentException("ID cannot be empty or blank");
        }
        if (name.trim().isEmpty()) {
            throw new IllegalArgumentException("Name cannot be empty or blank");
        }
        
        this.id = id.trim();
        this.name = name.trim();
    }
    
    /**
     * Gets the unique identifier for this concept.
     * 
     * @return the concept ID (never null or empty)
     */
    public String getId() {
        return id;
    }
    
    /**
     * Gets the human-readable name of this concept.
     * 
     * @return the concept name (never null or empty)
     */
    public String getName() {
        return name;
    }
    
    /**
     * Gets the description of this concept.
     * 
     * @return the description, or null if no description has been set
     */
    public String getDescription() {
        return description;
    }
    
    /**
     * Sets the description for this concept.
     * 
     * @param description the new description (can be null to clear)
     */
    public void setDescription(String description) {
        this.description = description;
    }
    
    /**
     * Compares this concept with another object for equality.
     * 
     * Two concepts are considered equal if they have the same ID and name.
     * This demonstrates proper equals() implementation for students.
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
        Concept concept = (Concept) obj;
        return Objects.equals(id, concept.id) && 
               Objects.equals(name, concept.name);
    }
    
    /**
     * Returns a hash code for this concept.
     * 
     * This implementation follows the contract that equal objects
     * must have equal hash codes.
     * 
     * @return the hash code
     */
    @Override
    public int hashCode() {
        return Objects.hash(id, name);
    }
    
    /**
     * Returns a string representation of this concept.
     * 
     * @return a string containing the ID and name of this concept
     */
    @Override
    public String toString() {
        return String.format("Concept{id='%s', name='%s'}", id, name);
    }
}
