package edu.ewu.cscd211.conceptmap.model;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive test suite for Metadata class following Test Guardian methodology.
 * Targeting 100% instruction and branch coverage through systematic TDD.
 */
class MetadataTest {

    @Nested
    @DisplayName("Constructor Tests")
    class ConstructorTests {

        @Test
        @DisplayName("Valid constructor should create Metadata with proper values")
        void testValidConstructor() {
            // ARRANGE
            String version = "1.0.0";
            String description = "Test concept map";

            // ACT
            Metadata metadata = new Metadata(version, description);

            // ASSERT
            assertEquals(version, metadata.getVersion());
            assertEquals(description, metadata.getDescription());
        }

        @Test
        @DisplayName("Constructor with null version should throw IllegalArgumentException")
        void testConstructorWithNullVersion() {
            // ARRANGE
            String version = null;
            String description = "Valid description";

            // ACT & ASSERT
            IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
                () -> new Metadata(version, description));
            assertEquals("Version cannot be null", exception.getMessage());
        }

        @Test
        @DisplayName("Constructor with null description should throw IllegalArgumentException")
        void testConstructorWithNullDescription() {
            // ARRANGE
            String version = "1.0.0";
            String description = null;

            // ACT & ASSERT
            IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
                () -> new Metadata(version, description));
            assertEquals("Description cannot be null", exception.getMessage());
        }

        @Test
        @DisplayName("Constructor with empty version should throw IllegalArgumentException")
        void testConstructorWithEmptyVersion() {
            // ARRANGE
            String version = "";
            String description = "Valid description";

            // ACT & ASSERT
            IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
                () -> new Metadata(version, description));
            assertEquals("Version cannot be blank", exception.getMessage());
        }

        @Test
        @DisplayName("Constructor with whitespace-only version should throw IllegalArgumentException")
        void testConstructorWithWhitespaceOnlyVersion() {
            // ARRANGE
            String version = "   ";
            String description = "Valid description";

            // ACT & ASSERT
            IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
                () -> new Metadata(version, description));
            assertEquals("Version cannot be blank", exception.getMessage());
        }

        @Test
        @DisplayName("Constructor with whitespace-only description should throw IllegalArgumentException")
        void testConstructorWithWhitespaceOnlyDescription() {
            // ARRANGE
            String version = "1.0.0";
            String description = "   ";

            // ACT & ASSERT
            IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
                () -> new Metadata(version, description));
            assertEquals("Description cannot be blank", exception.getMessage());
        }

        @Test
        @DisplayName("Constructor with version containing whitespace should trim and validate")
        void testConstructorWithVersionContainingWhitespace() {
            // ARRANGE
            String version = "  1.0.0  ";
            String description = "Valid description";

            // ACT & ASSERT
            assertDoesNotThrow(() -> new Metadata(version, description));
        }

        @Test
        @DisplayName("Constructor with long version should succeed")
        void testConstructorWithLongVersion() {
            // ARRANGE
            String version = "1.0.0-beta.1+build.123456789";
            String description = "Long version test";

            // ACT
            Metadata metadata = new Metadata(version, description);

            // ASSERT
            assertEquals(version, metadata.getVersion());
            assertEquals(description, metadata.getDescription());
        }

        @Test
        @DisplayName("Constructor with long description should succeed")
        void testConstructorWithLongDescription() {
            // ARRANGE
            String version = "1.0.0";
            String description = "This is a very long description that contains multiple sentences. " +
                    "It might span several lines and contain various special characters @#$%^&*(). " +
                    "The purpose is to test that the constructor handles long descriptions properly.";

            // ACT
            Metadata metadata = new Metadata(version, description);

            // ASSERT
            assertEquals(version, metadata.getVersion());
            assertEquals(description, metadata.getDescription());
        }
    }

    @Nested
    @DisplayName("Getter Tests")
    class GetterTests {

        @Test
        @DisplayName("getVersion should return the version")
        void testGetVersion() {
            // ARRANGE
            String version = "1.2.3";
            String description = "Test description";
            Metadata metadata = new Metadata(version, description);

            // ACT
            String actualVersion = metadata.getVersion();

            // ASSERT
            assertEquals(version, actualVersion);
        }

        @Test
        @DisplayName("getDescription should return the description")
        void testGetDescription() {
            // ARRANGE
            String version = "1.0.0";
            String description = "Detailed description";
            Metadata metadata = new Metadata(version, description);

            // ACT
            String actualDescription = metadata.getDescription();

            // ASSERT
            assertEquals(description, actualDescription);
        }
    }

    @Nested
    @DisplayName("Equals and HashCode Tests")
    class EqualsAndHashCodeTests {

        @Test
        @DisplayName("equals should return true for same object reference")
        void testEqualsSameReference() {
            // ARRANGE
            Metadata metadata = new Metadata("1.0.0", "Description");

            // ACT & ASSERT
            assertEquals(metadata, metadata);
        }

        @Test
        @DisplayName("equals should return false for null object")
        void testEqualsNull() {
            // ARRANGE
            Metadata metadata = new Metadata("1.0.0", "Description");

            // ACT & ASSERT
            assertNotEquals(metadata, null);
        }

        @Test
        @DisplayName("equals should return false for different class")
        void testEqualsDifferentClass() {
            // ARRANGE
            Metadata metadata = new Metadata("1.0.0", "Description");
            String notMetadata = "Not a Metadata object";

            // ACT & ASSERT
            assertNotEquals(metadata, notMetadata);
        }

        @Test
        @DisplayName("equals should return true for objects with same values")
        void testEqualsSameValues() {
            // ARRANGE
            Metadata metadata1 = new Metadata("1.0.0", "Description");
            Metadata metadata2 = new Metadata("1.0.0", "Description");

            // ACT & ASSERT
            assertEquals(metadata1, metadata2);
        }

        @Test
        @DisplayName("equals should return false for objects with different versions")
        void testEqualsDifferentVersions() {
            // ARRANGE
            Metadata metadata1 = new Metadata("1.0.0", "Description");
            Metadata metadata2 = new Metadata("2.0.0", "Description");

            // ACT & ASSERT
            assertNotEquals(metadata1, metadata2);
        }

        @Test
        @DisplayName("equals should return false for objects with different descriptions")
        void testEqualsDifferentDescriptions() {
            // ARRANGE
            Metadata metadata1 = new Metadata("1.0.0", "Description 1");
            Metadata metadata2 = new Metadata("1.0.0", "Description 2");

            // ACT & ASSERT
            assertNotEquals(metadata1, metadata2);
        }

        @Test
        @DisplayName("hashCode should be equal for objects with same values")
        void testHashCodeSameValues() {
            // ARRANGE
            Metadata metadata1 = new Metadata("1.0.0", "Description");
            Metadata metadata2 = new Metadata("1.0.0", "Description");

            // ACT & ASSERT
            assertEquals(metadata1.hashCode(), metadata2.hashCode());
        }

        @Test
        @DisplayName("hashCode should be different for objects with different values")
        void testHashCodeDifferentValues() {
            // ARRANGE
            Metadata metadata1 = new Metadata("1.0.0", "Description 1");
            Metadata metadata2 = new Metadata("2.0.0", "Description 2");

            // ACT & ASSERT
            assertNotEquals(metadata1.hashCode(), metadata2.hashCode());
        }

        @Test
        @DisplayName("hashCode should be consistent across multiple calls")
        void testHashCodeConsistency() {
            // ARRANGE
            Metadata metadata = new Metadata("1.0.0", "Description");

            // ACT
            int hashCode1 = metadata.hashCode();
            int hashCode2 = metadata.hashCode();

            // ASSERT
            assertEquals(hashCode1, hashCode2);
        }
    }

    @Nested
    @DisplayName("ToString Tests")
    class ToStringTests {

        @Test
        @DisplayName("toString should return formatted string with version and description")
        void testToString() {
            // ARRANGE
            String version = "1.0.0";
            String description = "Test description";
            Metadata metadata = new Metadata(version, description);

            // ACT
            String result = metadata.toString();

            // ASSERT
            String expected = "Metadata{version='1.0.0', description='Test description'}";
            assertEquals(expected, result);
        }

        @Test
        @DisplayName("toString should handle non-empty description")
        void testToStringWithDescription() {
            // ARRANGE
            String version = "2.0.0";
            String description = "Sample description";
            Metadata metadata = new Metadata(version, description);

            // ACT
            String result = metadata.toString();

            // ASSERT
            String expected = "Metadata{version='2.0.0', description='Sample description'}";
            assertEquals(expected, result);
        }

        @Test
        @DisplayName("toString should handle special characters in description")
        void testToStringSpecialCharacters() {
            // ARRANGE
            String version = "1.0.0";
            String description = "Description with 'quotes' and \"double quotes\"";
            Metadata metadata = new Metadata(version, description);

            // ACT
            String result = metadata.toString();

            // ASSERT
            String expected = "Metadata{version='1.0.0', description='Description with 'quotes' and \"double quotes\"'}";
            assertEquals(expected, result);
        }
    }

    @Nested
    @DisplayName("Edge Case Tests")
    class EdgeCaseTests {

        @Test
        @DisplayName("Should handle Unicode characters in version and description")
        void testUnicodeCharacters() {
            // ARRANGE
            String version = "1.0.0-α";
            String description = "Description with émojis 🚀 and ñice characters";

            // ACT
            Metadata metadata = new Metadata(version, description);

            // ASSERT
            assertEquals(version, metadata.getVersion());
            assertEquals(description, metadata.getDescription());
        }

        @Test
        @DisplayName("Should handle very long version string")
        void testVeryLongVersion() {
            // ARRANGE
            String version = "1.0.0".repeat(10); // 50 characters
            String description = "Description";

            // ACT
            Metadata metadata = new Metadata(version, description);

            // ASSERT
            assertEquals(version, metadata.getVersion());
            assertEquals(description, metadata.getDescription());
        }

        @Test
        @DisplayName("Should handle newlines in description")
        void testNewlinesInDescription() {
            // ARRANGE
            String version = "1.0.0";
            String description = "Line 1\nLine 2\nLine 3";

            // ACT
            Metadata metadata = new Metadata(version, description);

            // ASSERT
            assertEquals(version, metadata.getVersion());
            // Description gets trimmed, but newlines in middle should be preserved
            assertEquals("Line 1\nLine 2\nLine 3", metadata.getDescription());
        }
    }
}
