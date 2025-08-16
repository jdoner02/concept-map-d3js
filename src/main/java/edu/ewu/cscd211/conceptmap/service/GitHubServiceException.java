package edu.ewu.cscd211.conceptmap.service;

/**
 * Exception thrown when GitHub API operations fail.
 * 
 * This custom exception demonstrates exception handling best practices for CSCD211 students:
 * - Custom exception classes for domain-specific errors
 * - Proper exception chaining to preserve root cause
 * - Meaningful error messages for debugging
 * - Documentation of when and why exceptions are thrown
 * 
 * @author Test Guardian Agent
 * @version 1.0
 * @since 1.0
 */
public class GitHubServiceException extends Exception {

    /**
     * Creates a new GitHubServiceException with the specified message.
     * 
     * @param message the detail message explaining what went wrong
     */
    public GitHubServiceException(String message) {
        super(message);
    }

    /**
     * Creates a new GitHubServiceException with the specified message and cause.
     * 
     * This constructor demonstrates exception chaining - preserving the original
     * exception that caused this problem for better debugging.
     * 
     * @param message the detail message explaining what went wrong
     * @param cause the underlying exception that caused this problem
     */
    public GitHubServiceException(String message, Throwable cause) {
        super(message, cause);
    }

    /**
     * Creates a new GitHubServiceException wrapping the specified cause.
     * 
     * @param cause the underlying exception that caused this problem
     */
    public GitHubServiceException(Throwable cause) {
        super(cause);
    }
}
