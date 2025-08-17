#!/usr/bin/env python3
"""
Integration test for concept map validation against the actual project files.
This test validates the real concept-map.json file in the project.
"""

import sys
import os
import tempfile
import json
from pathlib import Path

# Add the TOOLING directory to sys.path to import the validation module
sys.path.insert(0, str(Path(__file__).parent.parent))
import validate_concept_map_nodes as validator


def test_real_concept_map_validation():
    """Test validation against the actual concept-map.json file."""
    # Find the actual concept-map.json file
    project_root = Path(__file__).parent.parent.parent.parent
    concept_map_path = project_root / "src" / "main" / "resources" / "concept-map.json"

    if not concept_map_path.exists():
        # Try alternative locations
        alt_path = project_root / "concept-map.json"
        if alt_path.exists():
            concept_map_path = alt_path
        else:
            print(f"Concept map file not found at {concept_map_path}")
            return False

    print(f"Testing concept map at: {concept_map_path}")

    # Test validation
    is_valid = validator.validate_concept_map(str(concept_map_path))
    print(f"Validation result: {'PASS' if is_valid else 'FAIL'}")

    if not is_valid:
        missing_nodes = validator.get_missing_nodes(str(concept_map_path))
        print(f"Missing nodes: {sorted(missing_nodes)}")

    # Test orphan detection
    orphaned_nodes = validator.find_orphaned_nodes(str(concept_map_path))
    if orphaned_nodes:
        print(f"Orphaned nodes: {sorted(orphaned_nodes)}")
    else:
        print("No orphaned nodes found")

    # Load and display summary statistics
    try:
        with open(concept_map_path, "r") as f:
            data = json.load(f)

        total_nodes = len(data.get("nodes", []))
        total_links = len(data.get("links", []))

        print("\nConcept Map Statistics:")
        print(f"  Total nodes: {total_nodes}")
        print(f"  Total links: {total_links}")

        # Check for any auto-generated nodes
        auto_generated = [
            node for node in data.get("nodes", []) if node.get("auto_generated", False)
        ]
        if auto_generated:
            print(f"  Auto-generated nodes: {len(auto_generated)}")
            for node in auto_generated:
                print(f"    - {node['id']}: {node['name']}")
        else:
            print("  No auto-generated nodes found")

        return is_valid

    except Exception as e:
        print(f"Error reading concept map file: {e}")
        return False


def test_concept_map_auto_fix_dry_run():
    """Test auto-fix functionality without modifying the original file."""
    project_root = Path(__file__).parent.parent.parent.parent
    concept_map_path = project_root / "src" / "main" / "resources" / "concept-map.json"

    if not concept_map_path.exists():
        print("Concept map file not found for auto-fix test")
        return False

    # Create a temporary copy for testing
    with open(concept_map_path, "r") as f:
        original_data = json.load(f)

    with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
        json.dump(original_data, f)
        temp_file = f.name

    try:
        # Test the auto-fix functionality (should do nothing if no missing nodes)
        print("\nTesting auto-fix functionality...")
        result = validator.auto_fix_concept_map(temp_file, create_backup=True)
        print(f"Auto-fix result: {'SUCCESS' if result else 'FAILED'}")

        # Verify the file structure is maintained
        with open(temp_file, "r") as f:
            fixed_data = json.load(f)

        original_node_count = len(original_data.get("nodes", []))
        fixed_node_count = len(fixed_data.get("nodes", []))

        print(
            f"Node count - Original: {original_node_count}, Fixed: {fixed_node_count}"
        )

        return result

    finally:
        # Clean up
        if os.path.exists(temp_file):
            os.unlink(temp_file)

        # Clean up any backup files
        backup_files = [
            f
            for f in os.listdir(os.path.dirname(temp_file))
            if f.startswith(os.path.basename(temp_file) + ".backup.")
        ]
        for backup_file in backup_files:
            backup_path = os.path.join(os.path.dirname(temp_file), backup_file)
            if os.path.exists(backup_path):
                os.unlink(backup_path)


if __name__ == "__main__":
    print("=== Concept Map Validation Integration Test ===")

    # Test validation
    validation_result = test_real_concept_map_validation()

    # Test auto-fix
    autofix_result = test_concept_map_auto_fix_dry_run()

    print("\n=== Integration Test Results ===")
    print(f"Validation: {'PASS' if validation_result else 'FAIL'}")
    print(f"Auto-fix: {'PASS' if autofix_result else 'FAIL'}")

    overall_result = validation_result and autofix_result
    print(f"Overall: {'PASS' if overall_result else 'FAIL'}")

    sys.exit(0 if overall_result else 1)
