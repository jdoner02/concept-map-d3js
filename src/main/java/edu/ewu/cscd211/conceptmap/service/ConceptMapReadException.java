package edu.ewu.cscd211.conceptmap.service;

/**
 * Exception thrown when a concept map resource cannot be read.
 * 
 * This exception demonstrates proper exception handling practices for CSCD211 students:
 * - Custom exception classes for specific error conditions
 * - Meaningful exception messages for debugging
 * - Proper inheritance from appropriate base exception classes
 * - Constructor overloading for different use cases
 * 
 * @author Code Improvement Agent
 * @version 1.0
 * @since 1.0
 */
public class ConceptMapReadException extends Exception {
    
    private static final String DEFAULT_MESSAGE = "Failed to read concept map";
    
    /**
     * Default constructor with a standard message.
     */
    public ConceptMapReadException() {
        super(DEFAULT_MESSAGE);
    }
    
    /**
     * Constructor with custom message.
     * 
     * @param message the detail message explaining why the concept map could not be read
     */
    public ConceptMapReadException(final String message) {
        super(message != null ? message : DEFAULT_MESSAGE);
    }
    
    /**
     * Constructor with custom message and cause.
     * 
     * @param message the detail message
     * @param cause the underlying cause of this exception
     */
    public ConceptMapReadException(final String message, final Throwable cause) {
        super(message != null ? message : DEFAULT_MESSAGE, cause);
    }
    
    /**
     * Constructor with cause only.
     * 
     * @param cause the underlying cause of this exception
     */
    public ConceptMapReadException(final Throwable cause) {
        super(DEFAULT_MESSAGE, cause);
    }
}
