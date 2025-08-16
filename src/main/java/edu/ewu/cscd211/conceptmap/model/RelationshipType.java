package edu.ewu.cscd211.conceptmap.model;

/**
 * Enumeration of different types of relationships between concepts.
 * 
 * This enum demonstrates for CSCD211 students:
 * - Proper enum usage and design
 * - Meaningful naming conventions
 * - JavaDoc documentation for enum values
 * - Type safety and validation
 * 
 * @author Test Guardian Agent
 * @version 1.0
 * @since 1.0
 */
public enum RelationshipType {
    
    /**
     * Indicates that the source concept is a prerequisite for the target concept.
     * Example: "CSCD211" is a PREREQUISITE for "CSCD212"
     */
    PREREQUISITE,
    
    /**
     * Indicates that the source concept requires the target concept.
     * Example: "Data Structures" REQUIRES "Programming Fundamentals"
     */
    REQUIRES,
    
    /**
     * Indicates a general relationship between concepts.
     * Example: "Algorithms" is RELATED_TO "Data Structures"
     */
    RELATED_TO,
    
    /**
     * Indicates that the source concept is part of the target concept.
     * Example: "Arrays" is PART_OF "Data Structures"
     */
    PART_OF,
    
    /**
     * Indicates that the source concept is similar to the target concept.
     * Example: "ArrayList" is SIMILAR_TO "LinkedList"
     */
    SIMILAR_TO,
    
    /**
     * Indicates that the source concept depends on the target concept.
     * Example: "Sorting Algorithm" DEPENDS_ON "Comparison Operation"
     */
    DEPENDS_ON
}
