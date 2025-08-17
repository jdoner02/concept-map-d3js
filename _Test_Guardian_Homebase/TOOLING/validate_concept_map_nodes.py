#!/usr/bin/env python3
"""
Concept Map Node Validation and Auto-Fix Script
==============================================

Validates that all nodes referenced in source/target relationships exist as actual nodes
in the concept map, and provides functionality to automatically create missing nodes.

This script ensures data integrity in concept map JSON files by:
1. Checking that all link source/target IDs have corresponding node definitions
2. Identifying orphaned nodes (defined but never referenced)
3. Auto-fixing missing nodes by creating minimal placeholder nodes
4. Creating backups before modifications

Author: Test Guardian Agent
Date: August 16, 2025
"""

import json
import shutil
from pathlib import Path
from typing import Dict, List, Set, Tuple, Any
from datetime import datetime


def validate_concept_map(file_path: str) -> bool:
    """
    Validate that all nodes referenced in links exist as actual nodes.

    Args:
        file_path: Path to the concept map JSON file

    Returns:
        True if all referenced nodes exist, False otherwise
    """
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return False

    # Extract node IDs
    node_ids = {node["id"] for node in data.get("nodes", [])}

    # Extract referenced IDs from links
    referenced_ids = set()
    for link in data.get("links", []):
        referenced_ids.add(link["source"])
        referenced_ids.add(link["target"])

    # Check if all referenced IDs exist as nodes
    missing_nodes = referenced_ids - node_ids

    return len(missing_nodes) == 0


def auto_fix_concept_map(file_path: str, create_backup: bool = False) -> bool:
    """
    Automatically fix missing nodes by creating minimal placeholder nodes.

    Args:
        file_path: Path to the concept map JSON file
        create_backup: Whether to create a backup before modification

    Returns:
        True if fixes were applied successfully, False otherwise
    """
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return False

    # Create backup if requested
    if create_backup:
        backup_path = f"{file_path}.backup.{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        shutil.copy2(file_path, backup_path)
        print(f"Backup created: {backup_path}")

    # Extract existing node IDs
    node_ids = {node["id"] for node in data.get("nodes", [])}

    # Extract referenced IDs from links
    referenced_ids = set()
    for link in data.get("links", []):
        referenced_ids.add(link["source"])
        referenced_ids.add(link["target"])

    # Find missing nodes
    missing_nodes = referenced_ids - node_ids

    if not missing_nodes:
        print("No missing nodes found.")
        return True

    # Create missing nodes
    for node_id in missing_nodes:
        new_node = create_minimal_node(node_id, _generate_name_from_id(node_id))
        data["nodes"].append(new_node)
        print(f"Created missing node: {node_id}")

    # Update metadata if it exists
    if "metadata" in data:
        data["metadata"]["total_nodes"] = len(data["nodes"])
        data["metadata"]["last_updated"] = datetime.now().isoformat() + "Z"

        # Add fix information to metadata
        if "fix_history" not in data["metadata"]:
            data["metadata"]["fix_history"] = []

        data["metadata"]["fix_history"].append(
            {
                "timestamp": datetime.now().isoformat() + "Z",
                "action": "auto_fix_missing_nodes",
                "nodes_created": list(missing_nodes),
                "total_created": len(missing_nodes),
            }
        )

    # Write the updated data back to file
    try:
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Successfully updated {file_path} with {len(missing_nodes)} new nodes.")
        return True
    except Exception as e:
        print(f"Error writing file: {e}")
        return False


def create_minimal_node(node_id: str, name: str) -> Dict[str, Any]:
    """
    Create a minimal node template with required fields.

    Args:
        node_id: Unique identifier for the node
        name: Display name for the node

    Returns:
        Dictionary representing a minimal node
    """
    return {
        "id": node_id,
        "name": name,
        "description": f"Auto-generated placeholder node for {name}. This node was created automatically to resolve missing references and should be manually updated with proper content.",
        "group": "auto-generated",
        "level": 1,
        "size": 8,
        "auto_generated": True,
        "creation_timestamp": datetime.now().isoformat() + "Z",
        "status": "placeholder",
    }


def _generate_name_from_id(node_id: str) -> str:
    """
    Generate a human-readable name from a node ID.

    Args:
        node_id: The node identifier

    Returns:
        Human-readable name derived from the ID
    """
    # Replace hyphens and underscores with spaces, then title case
    name = node_id.replace("-", " ").replace("_", " ")
    return " ".join(word.capitalize() for word in name.split())


def find_orphaned_nodes(file_path: str) -> Set[str]:
    """
    Find nodes that are defined but never referenced in links.

    Args:
        file_path: Path to the concept map JSON file

    Returns:
        Set of node IDs that are orphaned
    """
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return set()

    # Extract node IDs
    node_ids = {node["id"] for node in data.get("nodes", [])}

    # Extract referenced IDs from links
    referenced_ids = set()
    for link in data.get("links", []):
        referenced_ids.add(link["source"])
        referenced_ids.add(link["target"])

    # Return orphaned nodes
    return node_ids - referenced_ids


def get_missing_nodes(file_path: str) -> Set[str]:
    """
    Get nodes that are referenced in links but don't exist as nodes.

    Args:
        file_path: Path to the concept map JSON file

    Returns:
        Set of node IDs that are missing
    """
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return set()

    # Extract node IDs
    node_ids = {node["id"] for node in data.get("nodes", [])}

    # Extract referenced IDs from links
    referenced_ids = set()
    for link in data.get("links", []):
        referenced_ids.add(link["source"])
        referenced_ids.add(link["target"])

    # Return missing nodes
    return referenced_ids - node_ids


def _handle_validation_results(
    file_path: str, is_valid: bool, should_fix: bool, create_backup: bool
):
    """Handle validation results and optionally fix issues."""
    if not is_valid:
        missing = get_missing_nodes(file_path)
        print(f"Missing nodes: {sorted(missing)}")

        if should_fix:
            print("Attempting to fix missing nodes...")
            success = auto_fix_concept_map(file_path, create_backup)
            if success:
                print("Fix completed successfully!")
                # Re-validate
                is_valid_after_fix = validate_concept_map(file_path)
                print(
                    f"Post-fix validation: {'PASS' if is_valid_after_fix else 'FAIL'}"
                )
            else:
                print("Fix failed!")


def _check_orphaned_nodes(file_path: str):
    """Check and report orphaned nodes."""
    orphans = find_orphaned_nodes(file_path)
    if orphans:
        print(f"Orphaned nodes (defined but not referenced): {sorted(orphans)}")
    else:
        print("No orphaned nodes found.")


def main():
    """Main function for command-line usage."""
    import argparse

    parser = argparse.ArgumentParser(description="Validate and fix concept map nodes")
    parser.add_argument("file_path", help="Path to the concept map JSON file")
    parser.add_argument("--fix", action="store_true", help="Auto-fix missing nodes")
    parser.add_argument(
        "--backup", action="store_true", help="Create backup before fixing"
    )
    parser.add_argument(
        "--check-orphans", action="store_true", help="Check for orphaned nodes"
    )

    args = parser.parse_args()

    print(f"Processing: {args.file_path}")

    # Validate the concept map
    is_valid = validate_concept_map(args.file_path)
    print(f"Validation result: {'PASS' if is_valid else 'FAIL'}")

    _handle_validation_results(args.file_path, is_valid, args.fix, args.backup)

    if args.check_orphans:
        _check_orphaned_nodes(args.file_path)


if __name__ == "__main__":
    main()
