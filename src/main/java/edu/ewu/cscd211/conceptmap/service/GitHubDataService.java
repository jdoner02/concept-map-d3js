package edu.ewu.cscd211.conceptmap.service;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Service class for fetching concept map data from GitHub repositories.
 * 
 * This class demonstrates several important concepts for CSCD211 students:
 * - Service layer design pattern
 * - HTTP client usage and API integration
 * - Exception handling and error recovery
 * - Caching patterns for performance optimization
 * - Input validation and defensive programming
 * - JSON parsing and data transformation
 * 
 * @author Test Guardian Agent
 * @version 1.0
 * @since 1.0
 */
public class GitHubDataService {

    /** Base URL for GitHub API */
    private static final String GITHUB_API_BASE = "https://api.github.com";
    
    /** HTTP client for making requests */
    private final HttpClient httpClient;
    
    /** JSON parser for processing API responses */
    private final ObjectMapper objectMapper;
    
    /** Cache for storing fetched data to reduce API calls */
    private final Map<String, CacheEntry> cache;
    
    /** Timeout for HTTP requests in seconds */
    private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(30);
    
    /** Cache expiration time in milliseconds (5 minutes) */
    private static final long CACHE_EXPIRATION_MS = 5L * 60 * 1000;
    
    /** Flag to track if last request was a cache hit */
    private boolean lastRequestWasCacheHit = false;

    /**
     * Creates a new GitHubDataService with default configuration.
     * 
     * This constructor demonstrates initialization patterns and dependency setup.
     */
    public GitHubDataService() {
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(REQUEST_TIMEOUT)
            .build();
        this.objectMapper = new ObjectMapper();
        this.cache = new ConcurrentHashMap<>();
    }

    /**
     * Checks if the service is properly configured and ready to use.
     * 
     * @return true if the service is configured, false otherwise
     */
    public boolean isConfigured() {
        return httpClient != null && objectMapper != null && cache != null;
    }

    /**
     * Fetches concept map data from a GitHub repository.
     * 
     * This method demonstrates HTTP client usage, error handling, and caching patterns.
     * 
     * @param owner the repository owner (e.g., "jdoner02")
     * @param repository the repository name (e.g., "cscd211-concept-map-d3js")
     * @param filePath the path to the JSON file (e.g., "concept-map.json")
     * @return the JSON content as a string
     * @throws GitHubServiceException if the request fails or data is invalid
     * @throws IllegalArgumentException if any parameter is null or blank
     */
    public String fetchConceptMapData(String owner, String repository, String filePath) 
            throws GitHubServiceException {
        
        // Input validation - defensive programming practice
        validateParameters(owner, repository, filePath);
        
        // Check cache first
        String cacheKey = buildCacheKey(owner, repository, filePath);
        CacheEntry cachedEntry = cache.get(cacheKey);
        
        if (cachedEntry != null && !cachedEntry.isExpired()) {
            lastRequestWasCacheHit = true;
            return cachedEntry.content;
        }
        
        lastRequestWasCacheHit = false;
        
        try {
            // Build API URL
            String apiUrl = buildGitHubApiUrl(owner, repository, filePath);
            
            // Create HTTP request
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(apiUrl))
                .header("Accept", "application/vnd.github.v3+json")
                .header("User-Agent", "CSCD211-ConceptMap/1.0")
                .timeout(REQUEST_TIMEOUT)
                .GET()
                .build();
            
            // Send request and get response
            HttpResponse<String> response = httpClient.send(request, 
                HttpResponse.BodyHandlers.ofString());
            
            // Check response status
            if (response.statusCode() != 200) {
                throw new GitHubServiceException(
                    String.format("GitHub API request failed with status %d: %s",
                        response.statusCode(), response.body())
                );
            }
            
            // Parse JSON response to extract content
            String content = extractContentFromResponse(response.body());
            
            // Cache the result
            cache.put(cacheKey, new CacheEntry(content));
            
            return content;
            
        } catch (IOException e) {
            throw new GitHubServiceException("Failed to fetch data from GitHub", e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new GitHubServiceException("Request was interrupted", e);
        }
    }

    /**
     * Validates input parameters for null and blank values.
     * 
     * @param owner the repository owner
     * @param repository the repository name
     * @param filePath the file path
     * @throws IllegalArgumentException if any parameter is invalid
     */
    private void validateParameters(String owner, String repository, String filePath) {
        if (owner == null) {
            throw new IllegalArgumentException("Owner cannot be null");
        }
        if (repository == null) {
            throw new IllegalArgumentException("Repository cannot be null");
        }
        if (filePath == null) {
            throw new IllegalArgumentException("File path cannot be null");
        }
        if (owner.trim().isEmpty()) {
            throw new IllegalArgumentException("Owner cannot be empty or blank");
        }
        if (repository.trim().isEmpty()) {
            throw new IllegalArgumentException("Repository cannot be empty or blank");
        }
        if (filePath.trim().isEmpty()) {
            throw new IllegalArgumentException("File path cannot be empty or blank");
        }
    }

    /**
     * Builds the GitHub API URL for fetching file contents.
     * 
     * @param owner the repository owner
     * @param repository the repository name
     * @param filePath the file path
     * @return the complete API URL
     */
    public String buildGitHubApiUrl(String owner, String repository, String filePath) {
        return String.format("%s/repos/%s/%s/contents/%s",
            GITHUB_API_BASE, 
            URLEncoder.encode(owner, StandardCharsets.UTF_8),
            URLEncoder.encode(repository, StandardCharsets.UTF_8),
            URLEncoder.encode(filePath, StandardCharsets.UTF_8)
        );
    }

    /**
     * Extracts the file content from GitHub API JSON response.
     * 
     * GitHub API returns file content as base64 encoded data, so we need to
     * parse the JSON and decode the content.
     * 
     * @param responseBody the JSON response from GitHub API
     * @return the decoded file content
     * @throws GitHubServiceException if JSON parsing fails
     */
    private String extractContentFromResponse(String responseBody) throws GitHubServiceException {
        try {
            JsonNode jsonNode = objectMapper.readTree(responseBody);
            String encodedContent = jsonNode.get("content").asText();
            return decodeBase64Content(encodedContent);
        } catch (Exception e) {
            throw new GitHubServiceException("Failed to parse GitHub API response", e);
        }
    }

    /**
     * Decodes base64 encoded content from GitHub API.
     * 
     * This method demonstrates base64 decoding and string handling.
     * 
     * @param base64Content the base64 encoded content
     * @return the decoded content as a string
     */
    public String decodeBase64Content(String base64Content) {
        // Remove whitespace and newlines that GitHub API includes
        String cleanedContent = base64Content.replaceAll("\\s", "");
        byte[] decodedBytes = Base64.getDecoder().decode(cleanedContent);
        return new String(decodedBytes, StandardCharsets.UTF_8);
    }

    /**
     * Checks if the last request was served from cache.
     * 
     * @return true if the last request was a cache hit, false otherwise
     */
    public boolean isCacheHit() {
        return lastRequestWasCacheHit;
    }

    /**
     * Checks if specific data is cached and not expired.
     * 
     * @param owner the repository owner
     * @param repository the repository name
     * @param filePath the file path
     * @return true if data is cached, false otherwise
     */
    public boolean isCached(String owner, String repository, String filePath) {
        String cacheKey = buildCacheKey(owner, repository, filePath);
        CacheEntry entry = cache.get(cacheKey);
        return entry != null && !entry.isExpired();
    }

    /**
     * Clears all cached data.
     */
    public void clearCache() {
        cache.clear();
    }

    /**
     * Builds a cache key from the repository parameters.
     * 
     * @param owner the repository owner
     * @param repository the repository name
     * @param filePath the file path
     * @return a unique cache key
     */
    private String buildCacheKey(String owner, String repository, String filePath) {
        return String.format("%s/%s/%s", owner, repository, filePath);
    }

    /**
     * Internal class for storing cached entries with expiration time.
     */
    private static class CacheEntry {
        private final String content;
        private final long timestamp;

        public CacheEntry(String content) {
            this.content = content;
            this.timestamp = System.currentTimeMillis();
        }

        public boolean isExpired() {
            return System.currentTimeMillis() - timestamp > CACHE_EXPIRATION_MS;
        }
    }
}
