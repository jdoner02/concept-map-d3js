package edu.ewu.cscd211.conceptmap.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.Objects;

/**
 * Metadata entity for concept maps containing version and description information.
 * Enterprise-ready JPA entity with proper validation and database mapping.
 */
@Embeddable
public class Metadata {
    
    @NotBlank(message = "Version cannot be blank")
    @Column(name = "metadata_version", length = 50, nullable = false)
    private String version;
    
    @NotNull(message = "Description cannot be null")
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    // Default constructor for JPA
    protected Metadata() {}

    public Metadata(String version, String description) {
        // Check for null parameters first
        if (version == null) {
            throw new IllegalArgumentException("Version cannot be null");
        }
        if (description == null) {
            throw new IllegalArgumentException("Description cannot be null");
        }
        
        // Version cannot be blank
        if (version.trim().isEmpty()) {
            throw new IllegalArgumentException("Version cannot be blank");
        }
        
        // Description can be empty but if it has content it cannot be just whitespace
        if (!description.isEmpty() && description.trim().isEmpty()) {
            throw new IllegalArgumentException("Description cannot be blank");
        }
        
        this.version = version.trim();
        this.description = description.trim();
    }

    public String getVersion() {
        return version;
    }

    public String getDescription() {
        return description;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Metadata metadata = (Metadata) o;
        return Objects.equals(version, metadata.version) &&
               Objects.equals(description, metadata.description);
    }

    @Override
    public int hashCode() {
        return Objects.hash(version, description);
    }

    @Override
    public String toString() {
        return "Metadata{" +
               "version='" + version + '\'' +
               ", description='" + description + '\'' +
               '}';
    }
}
