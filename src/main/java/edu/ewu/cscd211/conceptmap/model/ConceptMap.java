package edu.ewu.cscd211.conceptmap.model;

import jakarta.persistence.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * ConceptMap aggregate root containing metadata, nodes, and links.
 * Enterprise-ready JPA entity with proper validation and database mapping.
 */
@Entity
@Table(name = "concept_maps")
public class ConceptMap {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Valid
    @Embedded
    @NotNull(message = "Metadata cannot be null")
    private Metadata metadata;
    
    @OneToMany(cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @JoinColumn(name = "concept_map_id")
    private List<Node> nodes = new ArrayList<>();
    
    @OneToMany(cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @JoinColumn(name = "concept_map_id")
    private List<Link> links = new ArrayList<>();
    
    @Version
    private Long version;

    // Default constructor for JPA
    protected ConceptMap() {}

    public ConceptMap(Metadata metadata) {
        this.metadata = Objects.requireNonNull(metadata, "Metadata cannot be null");
        this.nodes = new ArrayList<>();
        this.links = new ArrayList<>();
    }

    public Long getId() {
        return id;
    }

    public Metadata getMetadata() {
        return metadata;
    }

    public List<Node> getNodes() {
        return new ArrayList<>(nodes); // Return defensive copy
    }

    public List<Link> getLinks() {
        return new ArrayList<>(links); // Return defensive copy
    }
    
    public Long getVersion() {
        return version;
    }

    public void addNode(Node node) {
        Objects.requireNonNull(node, "Node cannot be null");
        if (!nodes.contains(node)) {
            nodes.add(node);
        }
    }

    public void addLink(Link link) {
        Objects.requireNonNull(link, "Link cannot be null");
        
        // Domain validation: ensure referenced nodes exist
        if (findNodeById(link.getSourceId()) == null) {
            throw new IllegalArgumentException("Source node " + link.getSourceId() + " not found");
        }
        if (findNodeById(link.getTargetId()) == null) {
            throw new IllegalArgumentException("Target node " + link.getTargetId() + " not found");
        }
        
        if (!links.contains(link)) {
            links.add(link);
        }
    }

    /**
     * Finds a node by its ID.
     * 
     * @param nodeId the ID to search for
     * @return the node if found, null otherwise
     */
    public Node findNodeById(String nodeId) {
        if (nodeId == null) {
            return null;
        }
        return nodes.stream()
            .filter(node -> nodeId.equals(node.getId()))
            .findFirst()
            .orElse(null);
    }

    /**
     * Checks if the concept map is empty (contains no nodes).
     * 
     * @return true if the concept map has no nodes
     */
    public boolean isEmpty() {
        return nodes.isEmpty();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ConceptMap that = (ConceptMap) o;
        
        // If both have IDs, compare by ID (database identity)
        if (id != null && that.id != null) {
            return Objects.equals(id, that.id);
        }
        
        // For transient entities (no ID) or mixed cases, they are not equal
        return false;
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "ConceptMap{" +
               "id=" + id +
               ", metadata=" + metadata +
               ", nodes=" + nodes.size() + " nodes" +
               ", links=" + links.size() + " links" +
               '}';
    }
}
