package edu.ewu.cscd211.conceptmap.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Test class for GitHubDataService using Test-Driven Development.
 * 
 * This test class demonstrates TDD principles for integrating with GitHub APIs:
 * 1. Write tests first to define expected behavior (RED phase)
 * 2. Implement minimal code to pass tests (GREEN phase)  
 * 3. Refactor for better design and performance (REFACTOR phase)
 * 
 * Educational focus areas:
 * - HTTP client usage and testing
 * - JSON parsing and error handling
 * - Service layer design patterns
 * - Mocking external dependencies
 * 
 * @author Test Guardian Agent
 * @version 1.0
 */
class GitHubDataServiceTest {

    private GitHubDataService githubService;
    private static final String TEST_REPO_OWNER = "jdoner02";
    private static final String TEST_REPO_NAME = "cscd211-concept-map-d3js";
    private static final String TEST_FILE_PATH = "concept-map.json";

    @BeforeEach
    void setUp() {
        // This will FAIL initially since GitHubDataService doesn't exist yet
        githubService = new GitHubDataService();
    }

    @Test
    @DisplayName("Should create GitHubDataService with default configuration")
    void shouldCreateGitHubDataServiceWithDefaults() {
        // Arrange & Act - Service should be created in setUp()
        
        // Assert
        assertNotNull(githubService, "GitHubDataService should not be null");
        assertTrue(githubService.isConfigured(), "Service should be properly configured");
    }

    @Test
    @DisplayName("Should fetch concept map JSON from GitHub repository")
    void shouldFetchConceptMapFromGitHub() throws GitHubServiceException {
        // Arrange
        // Note: This test may require actual network access or mocking
        
        // Act - This should fetch the JSON content from GitHub
        String jsonContent = githubService.fetchConceptMapData(
            TEST_REPO_OWNER, TEST_REPO_NAME, TEST_FILE_PATH
        );
        
        // Assert
        assertNotNull(jsonContent, "JSON content should not be null");
        assertFalse(jsonContent.trim().isEmpty(), "JSON content should not be empty");
        assertTrue(jsonContent.contains("nodes"), "JSON should contain nodes array");
        assertTrue(jsonContent.contains("links"), "JSON should contain links array");
    }

    @Test
    @DisplayName("Should handle network errors gracefully")
    void shouldHandleNetworkErrorsGracefully() {
        // Arrange - Use invalid repository that will cause 404
        String invalidRepo = "nonexistent-repo-12345";
        
        // Act & Assert - Should throw appropriate exception
        assertThrows(
            GitHubServiceException.class,
            () -> githubService.fetchConceptMapData(TEST_REPO_OWNER, invalidRepo, TEST_FILE_PATH),
            "Should throw GitHubServiceException for invalid repository"
        );
    }

    @Test
    @DisplayName("Should validate repository parameters")
    void shouldValidateRepositoryParameters() {
        // Test null owner
        assertThrows(
            IllegalArgumentException.class,
            () -> githubService.fetchConceptMapData(null, TEST_REPO_NAME, TEST_FILE_PATH),
            "Should throw IllegalArgumentException for null owner"
        );

        // Test empty repository name
        assertThrows(
            IllegalArgumentException.class,
            () -> githubService.fetchConceptMapData(TEST_REPO_OWNER, "", TEST_FILE_PATH),
            "Should throw IllegalArgumentException for empty repository name"
        );

        // Test null file path
        assertThrows(
            IllegalArgumentException.class,
            () -> githubService.fetchConceptMapData(TEST_REPO_OWNER, TEST_REPO_NAME, null),
            "Should throw IllegalArgumentException for null file path"
        );
    }

    @ParameterizedTest
    @ValueSource(strings = {"", " ", "\t", "\n"})
    @DisplayName("Should reject blank parameters")
    void shouldRejectBlankParameters(String blankValue) {
        // Test blank owner
        assertThrows(
            IllegalArgumentException.class,
            () -> githubService.fetchConceptMapData(blankValue, TEST_REPO_NAME, TEST_FILE_PATH),
            "Should throw IllegalArgumentException for blank owner: '" + blankValue + "'"
        );
    }

    @Test
    @DisplayName("Should decode base64 encoded content from GitHub API")
    void shouldDecodeBase64ContentFromGitHubAPI() {
        // Arrange - GitHub API returns base64 encoded content
        String base64Content = "eyJub2RlcyI6W10sImxpbmtzIjpbXX0="; // {"nodes":[],"links":[]}
        
        // Act
        String decodedContent = githubService.decodeBase64Content(base64Content);
        
        // Assert
        assertNotNull(decodedContent, "Decoded content should not be null");
        assertEquals("{\"nodes\":[],\"links\":[]}", decodedContent, "Should correctly decode base64 content");
    }

    @Test
    @DisplayName("Should cache fetched data to reduce API calls")
    void shouldCacheFetchedDataToReduceAPICalls() throws GitHubServiceException {
        // Arrange - First call should fetch from API
        String jsonContent1 = githubService.fetchConceptMapData(
            TEST_REPO_OWNER, TEST_REPO_NAME, TEST_FILE_PATH
        );
        
        // Act - Second call should return cached data
        String jsonContent2 = githubService.fetchConceptMapData(
            TEST_REPO_OWNER, TEST_REPO_NAME, TEST_FILE_PATH
        );
        
        // Assert
        assertEquals(jsonContent1, jsonContent2, "Cached content should match original");
        assertTrue(githubService.isCacheHit(), "Second call should be a cache hit");
    }

    @Test
    @DisplayName("Should provide cache invalidation mechanism")
    void shouldProvideCacheInvalidationMechanism() throws GitHubServiceException {
        // Arrange - Load initial data
        githubService.fetchConceptMapData(TEST_REPO_OWNER, TEST_REPO_NAME, TEST_FILE_PATH);
        assertTrue(githubService.isCached(TEST_REPO_OWNER, TEST_REPO_NAME, TEST_FILE_PATH));
        
        // Act - Clear cache
        githubService.clearCache();
        
        // Assert
        assertFalse(githubService.isCached(TEST_REPO_OWNER, TEST_REPO_NAME, TEST_FILE_PATH),
                   "Cache should be cleared after clearCache() call");
    }

    @Test
    @DisplayName("Should build correct GitHub API URL")
    void shouldBuildCorrectGitHubAPIUrl() {
        // Arrange
        String expectedUrl = "https://api.github.com/repos/jdoner02/cscd211-concept-map-d3js/contents/concept-map.json";
        
        // Act
        String actualUrl = githubService.buildGitHubApiUrl(TEST_REPO_OWNER, TEST_REPO_NAME, TEST_FILE_PATH);
        
        // Assert
        assertEquals(expectedUrl, actualUrl, "Should build correct GitHub API URL");
    }
}
