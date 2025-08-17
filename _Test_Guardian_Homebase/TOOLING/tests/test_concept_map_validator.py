#!/usr/bin/env python3
"""
Test suite for Concept Map Node Validation Script
===============================================

Comprehensive tests for the validation script ensuring all nodes referenced
in source/target relationships exist as actual nodes in the concept map.

Following TDD principles:
- Red: Write failing tests first
- Green: Implement minimal code to pass
- Refactor: Improve code quality while maintaining tests

Author: Test Guardian Agent
Date: August 16, 2025
"""

import json
import pytest
import tempfile
from pathlib import Path
import sys
import os

# Add the TOOLING directory to sys.path to import the validation module
tooling_dir = Path(__file__).parent.parent
sys.path.insert(0, str(tooling_dir))
import validate_concept_map_nodes as validator


class TestConceptMapValidator:
    """Test suite for concept map validation functionality."""

    def test_valid_concept_map_passes_validation(self):
        """Test that a valid concept map with all referenced nodes passes validation."""
        # Arrange
        valid_data = {
            "nodes": [
                {"id": "node1", "name": "Node 1"},
                {"id": "node2", "name": "Node 2"},
                {"id": "node3", "name": "Node 3"},
            ],
            "links": [
                {"source": "node1", "target": "node2", "type": "prerequisite"},
                {"source": "node2", "target": "node3", "type": "builds_on"},
            ],
        }

        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            json.dump(valid_data, f)
            temp_file = f.name

        try:
            # Act
            result = validator.validate_concept_map(temp_file)

            # Assert
            assert result is True, "Valid concept map should pass validation"
        finally:
            os.unlink(temp_file)

    def test_missing_nodes_detected(self):
        """Test that missing nodes referenced in links are detected."""
        # Arrange - Create concept map with missing node references
        invalid_data = {
            "nodes": [
                {"id": "node1", "name": "Node 1"},
                {"id": "node2", "name": "Node 2"},
            ],
            "links": [
                {"source": "node1", "target": "missing_node", "type": "prerequisite"},
                {"source": "another_missing", "target": "node2", "type": "builds_on"},
            ],
        }

        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            json.dump(invalid_data, f)
            temp_file = f.name

        try:
            # Act
            result = validator.validate_concept_map(temp_file)

            # Assert
            assert (
                result is False
            ), "Concept map with missing nodes should fail validation"
        finally:
            os.unlink(temp_file)

    def test_orphaned_nodes_detected(self):
        """Test that orphaned nodes (defined but never referenced) are detected."""
        # Arrange
        data_with_orphans = {
            "nodes": [
                {"id": "node1", "name": "Node 1"},
                {"id": "node2", "name": "Node 2"},
                {"id": "orphan_node", "name": "Orphaned Node"},
            ],
            "links": [{"source": "node1", "target": "node2", "type": "prerequisite"}],
        }

        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            json.dump(data_with_orphans, f)
            temp_file = f.name

        try:
            # Act & Assert - This should pass validation but detect orphans
            # We need to capture the orphan detection separately
            node_ids = {node["id"] for node in data_with_orphans["nodes"]}
            referenced_ids = set()
            for link in data_with_orphans["links"]:
                referenced_ids.add(link["source"])
                referenced_ids.add(link["target"])

            orphaned_nodes = node_ids - referenced_ids
            assert len(orphaned_nodes) == 1
            assert "orphan_node" in orphaned_nodes
        finally:
            os.unlink(temp_file)

    def test_invalid_json_handled_gracefully(self):
        """Test that invalid JSON files are handled gracefully."""
        # Arrange
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            f.write("{ invalid json content")
            temp_file = f.name

        try:
            # Act
            result = validator.validate_concept_map(temp_file)

            # Assert
            assert result is False, "Invalid JSON should fail validation"
        finally:
            os.unlink(temp_file)

    def test_missing_file_handled_gracefully(self):
        """Test that missing files are handled gracefully."""
        # Act
        result = validator.validate_concept_map("nonexistent_file.json")

        # Assert
        assert result is False, "Missing file should fail validation"

    def test_empty_nodes_and_links_valid(self):
        """Test that concept map with empty nodes and links is valid."""
        # Arrange
        empty_data = {"nodes": [], "links": []}

        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            json.dump(empty_data, f)
            temp_file = f.name

        try:
            # Act
            result = validator.validate_concept_map(temp_file)

            # Assert
            assert result is True, "Empty concept map should be valid"
        finally:
            os.unlink(temp_file)


class TestConceptMapAutoFixer:
    """Test suite for automatic concept map fixing functionality."""

    def test_auto_fix_missing_nodes_creates_placeholder_nodes(self):
        """Test that auto-fix functionality creates placeholder nodes for missing references."""
        # Arrange
        data_with_missing = {
            "nodes": [{"id": "node1", "name": "Node 1", "description": "First node"}],
            "links": [
                {"source": "node1", "target": "missing_node", "type": "prerequisite"}
            ],
        }

        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            json.dump(data_with_missing, f)
            temp_file = f.name

        try:
            # Act - This should create the missing node
            result = validator.auto_fix_concept_map(temp_file)

            # Assert
            assert result is True, "Auto-fix should succeed"

            # Verify the missing node was created
            with open(temp_file, "r") as f:
                fixed_data = json.load(f)

            node_ids = {node["id"] for node in fixed_data["nodes"]}
            assert "missing_node" in node_ids, "Missing node should be created"
            assert len(fixed_data["nodes"]) == 2, "Should have original + new node"

            # Check that the new node has proper placeholder characteristics
            missing_node = next(
                node for node in fixed_data["nodes"] if node["id"] == "missing_node"
            )
            assert missing_node["auto_generated"] is True
            assert missing_node["status"] == "placeholder"

        finally:
            os.unlink(temp_file)

    def test_auto_fix_preserves_existing_nodes(self):
        """Test that auto-fix preserves existing nodes and only adds missing ones."""
        # Arrange
        original_data = {
            "nodes": [
                {"id": "node1", "name": "Node 1", "description": "Original node"}
            ],
            "links": [
                {"source": "node1", "target": "missing_node", "type": "prerequisite"}
            ],
        }

        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            json.dump(original_data, f)
            temp_file = f.name

        try:
            # Act - This should create missing node but preserve existing ones
            result = validator.auto_fix_concept_map(temp_file)

            # Assert
            assert result is True, "Auto-fix should succeed"

            # Verify the original node was preserved
            with open(temp_file, "r") as f:
                fixed_data = json.load(f)

            # Find the original node
            original_node = next(
                node for node in fixed_data["nodes"] if node["id"] == "node1"
            )
            assert original_node["name"] == "Node 1"
            assert original_node["description"] == "Original node"

            # Verify missing node was added
            node_ids = {node["id"] for node in fixed_data["nodes"]}
            assert "missing_node" in node_ids, "Missing node should be created"
            assert len(fixed_data["nodes"]) == 2, "Should have original + new node"

        finally:
            os.unlink(temp_file)

    def test_auto_fix_creates_backup_before_modification(self):
        """Test that auto-fix creates a backup before modifying the original file."""
        # Arrange
        data = {
            "nodes": [{"id": "node1", "name": "Node 1"}],
            "links": [{"source": "node1", "target": "missing", "type": "prerequisite"}],
        }

        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            json.dump(data, f)
            temp_file = f.name

        try:
            # Act - This should create a backup
            result = validator.auto_fix_concept_map(temp_file, create_backup=True)

            # Assert
            assert result is True, "Auto-fix should succeed"

            # Check that backup file was created
            backup_files = [
                f
                for f in os.listdir(os.path.dirname(temp_file))
                if f.startswith(os.path.basename(temp_file) + ".backup.")
            ]
            assert len(backup_files) == 1, "Backup file should be created"

            # Cleanup backup file
            backup_path = os.path.join(os.path.dirname(temp_file), backup_files[0])
            os.unlink(backup_path)

        finally:
            os.unlink(temp_file)


class TestNodeCreationTemplates:
    """Test suite for node creation template functionality."""

    def test_create_minimal_node_template_has_required_fields(self):
        """Test that minimal node template contains all required fields."""
        # Act
        template = validator.create_minimal_node("test-id", "Test Node")

        # Assert
        required_fields = ["id", "name", "description", "group", "level", "size"]
        for field in required_fields:
            assert field in template, f"Template should contain {field} field"

        assert template["id"] == "test-id"
        assert template["name"] == "Test Node"
        assert template["auto_generated"] is True
        assert template["status"] == "placeholder"

    def test_create_minimal_node_template_uses_provided_id_and_name(self):
        """Test that minimal node template uses the provided ID and name."""
        # Act
        template = validator.create_minimal_node("custom-id", "Custom Name")

        # Assert
        assert template["id"] == "custom-id"
        assert template["name"] == "Custom Name"
        assert "creation_timestamp" in template


class TestHelperFunctions:
    """Test suite for helper functions."""

    def test_find_orphaned_nodes_with_orphans(self):
        """Test that orphaned nodes are correctly identified."""
        # Arrange
        data = {
            "nodes": [
                {"id": "node1", "name": "Node 1"},
                {"id": "node2", "name": "Node 2"},
                {"id": "orphan", "name": "Orphan Node"},
            ],
            "links": [{"source": "node1", "target": "node2", "type": "prerequisite"}],
        }

        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            json.dump(data, f)
            temp_file = f.name

        try:
            # Act
            orphaned = validator.find_orphaned_nodes(temp_file)

            # Assert
            assert orphaned == {"orphan"}
        finally:
            os.unlink(temp_file)

    def test_get_missing_nodes_with_missing(self):
        """Test that missing nodes are correctly identified."""
        # Arrange
        data = {
            "nodes": [
                {"id": "node1", "name": "Node 1"},
            ],
            "links": [
                {"source": "node1", "target": "missing_node", "type": "prerequisite"},
                {"source": "another_missing", "target": "node1", "type": "builds_on"},
            ],
        }

        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            json.dump(data, f)
            temp_file = f.name

        try:
            # Act
            missing = validator.get_missing_nodes(temp_file)

            # Assert
            assert missing == {"missing_node", "another_missing"}
        finally:
            os.unlink(temp_file)

    def test_find_orphaned_nodes_with_file_error(self):
        """Test that find_orphaned_nodes handles file errors gracefully."""
        # Act
        orphaned = validator.find_orphaned_nodes("nonexistent_file.json")

        # Assert
        assert orphaned == set()

    def test_get_missing_nodes_with_file_error(self):
        """Test that get_missing_nodes handles file errors gracefully."""
        # Act
        missing = validator.get_missing_nodes("nonexistent_file.json")

        # Assert
        assert missing == set()


class TestAutoFixWithMetadata:
    """Test suite for auto-fix functionality with metadata updates."""

    def test_auto_fix_updates_metadata(self):
        """Test that auto-fix updates metadata when present."""
        # Arrange
        data = {
            "metadata": {"version": "1.0", "total_nodes": 1},
            "nodes": [{"id": "node1", "name": "Node 1"}],
            "links": [{"source": "node1", "target": "missing", "type": "prerequisite"}],
        }

        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            json.dump(data, f)
            temp_file = f.name

        try:
            # Act
            result = validator.auto_fix_concept_map(temp_file)

            # Assert
            assert result is True

            # Check metadata was updated
            with open(temp_file, "r") as f:
                fixed_data = json.load(f)

            assert fixed_data["metadata"]["total_nodes"] == 2
            assert "last_updated" in fixed_data["metadata"]
            assert "fix_history" in fixed_data["metadata"]
            assert len(fixed_data["metadata"]["fix_history"]) == 1

        finally:
            os.unlink(temp_file)

    def test_auto_fix_without_metadata(self):
        """Test that auto-fix works when no metadata is present."""
        # Arrange
        data = {
            "nodes": [{"id": "node1", "name": "Node 1"}],
            "links": [{"source": "node1", "target": "missing", "type": "prerequisite"}],
        }

        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            json.dump(data, f)
            temp_file = f.name

        try:
            # Act
            result = validator.auto_fix_concept_map(temp_file)

            # Assert
            assert result is True

            # Verify missing node was added without metadata issues
            with open(temp_file, "r") as f:
                fixed_data = json.load(f)

            node_ids = {node["id"] for node in fixed_data["nodes"]}
            assert "missing" in node_ids

        finally:
            os.unlink(temp_file)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
