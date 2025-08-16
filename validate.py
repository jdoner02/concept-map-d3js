#!/usr/bin/env python3
"""
Concept Map JSON Validator

Validates concept-map.json files against the schema contract.
Ensures D3.js compatibility and standardization compliance.
"""

import json
import re
from datetime import datetime
from typing import Dict, List, Any, Set


class ConceptMapValidator:
    """Validates concept map JSON files against schema requirements."""

    def __init__(self):
        self.errors = []
        self.warnings = []

        # Schema constants
        self.VALID_GROUPS = {
            "course",
            "concept",
            "skill",
            "language",
            "tool",
            "paradigm",
            "structure",
            "algorithm",
        }

        self.VALID_RELATIONSHIP_TYPES = {
            "prerequisite",
            "enables",
            "related",
            "part-of",
            "implements",
            "uses",
        }

        self.ID_PATTERN = re.compile(r"^[a-z0-9]([a-z0-9-]*[a-z0-9])?$")

    def validate_file(self, filepath: str) -> Dict[str, Any]:
        """Validate a concept map JSON file."""
        try:
            with open(filepath, "r") as f:
                data = json.load(f)
        except json.JSONDecodeError as e:
            return {"valid": False, "errors": [f"Invalid JSON: {e}"]}
        except FileNotFoundError:
            return {"valid": False, "errors": [f"File not found: {filepath}"]}

        self.errors = []
        self.warnings = []

        # Validate structure
        self._validate_root_structure(data)
        self._validate_metadata(data.get("metadata", {}))
        nodes = data.get("nodes", [])
        links = data.get("links", [])
        self._validate_nodes(nodes)
        self._validate_links(links, nodes)
        self._validate_relationships(nodes, links)

        return {
            "valid": len(self.errors) == 0,
            "errors": self.errors,
            "warnings": self.warnings,
            "stats": self._calculate_stats(nodes, links),
        }

    def _validate_root_structure(self, data: Dict):
        """Validate root JSON structure."""
        required_keys = {"metadata", "nodes", "links"}
        missing = required_keys - set(data.keys())
        if missing:
            self.errors.append(f"Missing required root keys: {missing}")

        if not isinstance(data.get("nodes"), list):
            self.errors.append("'nodes' must be an array")

        if not isinstance(data.get("links"), list):
            self.errors.append("'links' must be an array")

    def _validate_metadata(self, metadata: Dict):
        """Validate metadata section."""
        required = {"version", "created", "description"}
        missing = required - set(metadata.keys())
        if missing:
            self.errors.append(f"Missing required metadata keys: {missing}")

        # Validate date format
        created = metadata.get("created", "")
        if created:
            try:
                datetime.fromisoformat(created.replace("Z", "+00:00"))
            except ValueError:
                self.errors.append(f"Invalid created date format: {created}")

        # Validate description length
        desc = metadata.get("description", "")
        if len(desc) > 200:
            self.errors.append(f"Description too long: {len(desc)} > 200 chars")

    def _validate_nodes(self, nodes: List[Dict]):
        """Validate all nodes."""
        if not nodes:
            self.errors.append("Must contain at least one node")
            return

        node_ids = set()
        for i, node in enumerate(nodes):
            self._validate_node(node, i, node_ids)

    def _validate_node(self, node: Dict, index: int, seen_ids: Set[str]):
        """Validate individual node."""
        # Required fields
        required = {"id", "name", "group"}
        missing = required - set(node.keys())
        if missing:
            self.errors.append(f"Node {index}: Missing required fields {missing}")
            return

        # Validate ID
        node_id = node.get("id", "")
        if not self.ID_PATTERN.match(node_id):
            self.errors.append(f"Node {index}: Invalid ID format '{node_id}'")

        if len(node_id) > 30:
            self.errors.append(f"Node {index}: ID too long '{node_id}'")

        if node_id in seen_ids:
            self.errors.append(f"Node {index}: Duplicate ID '{node_id}'")
        seen_ids.add(node_id)

        # Validate name
        name = node.get("name", "")
        if not 1 <= len(name) <= 50:
            self.errors.append(f"Node {node_id}: Name length must be 1-50 chars")

        # Validate group
        group = node.get("group", "")
        if group not in self.VALID_GROUPS:
            self.errors.append(f"Node {node_id}: Invalid group '{group}'")

        # Validate optional fields
        if "description" in node:
            desc = node["description"]
            if len(desc) > 200:
                self.errors.append(f"Node {node_id}: Description too long")

        if "level" in node:
            level = node["level"]
            if not isinstance(level, int) or level < 0 or level > 5:
                self.errors.append(f"Node {node_id}: Level must be 0-5")

        if "size" in node:
            size = node["size"]
            if not isinstance(size, (int, float)) or size < 5 or size > 30:
                self.errors.append(f"Node {node_id}: Size must be 5-30")

    def _validate_links(self, links: List[Dict], nodes: List[Dict]):
        """Validate all links."""
        node_ids = {node.get("id") for node in nodes}
        link_signatures = set()

        for i, link in enumerate(links):
            self._validate_link(link, i, node_ids, link_signatures)

    def _validate_link(
        self, link: Dict, index: int, node_ids: Set[str], signatures: Set[str]
    ):
        """Validate individual link."""
        # Required fields
        required = {"source", "target", "type"}
        missing = required - set(link.keys())
        if missing:
            self.errors.append(f"Link {index}: Missing required fields {missing}")
            return

        source = link.get("source", "")
        target = link.get("target", "")
        link_type = link.get("type", "")

        # Validate node references
        if source not in node_ids:
            self.errors.append(f"Link {index}: Unknown source node '{source}'")

        if target not in node_ids:
            self.errors.append(f"Link {index}: Unknown target node '{target}'")

        # No self-referencing
        if source == target:
            self.errors.append(f"Link {index}: Self-referencing link '{source}'")

        # Validate type
        if link_type not in self.VALID_RELATIONSHIP_TYPES:
            self.errors.append(f"Link {index}: Invalid type '{link_type}'")

        # Check for duplicates
        signature = f"{source}:{target}:{link_type}"
        if signature in signatures:
            self.errors.append(f"Link {index}: Duplicate link {signature}")
        signatures.add(signature)

        # Validate optional fields
        if "strength" in link:
            strength = link["strength"]
            if not isinstance(strength, (int, float)) or not 0.1 <= strength <= 1.0:
                self.errors.append(f"Link {index}: Strength must be 0.1-1.0")

        if "description" in link:
            desc = link["description"]
            if len(desc) > 100:
                self.errors.append(f"Link {index}: Description too long")

    def _validate_relationships(self, nodes: List[Dict], links: List[Dict]):
        """Validate relationship logic."""
        # Check for circular prerequisites
        prereq_links = [l for l in links if l.get("type") == "prerequisite"]
        if self._has_circular_prerequisites(prereq_links):
            self.errors.append("Circular prerequisite dependencies detected")

    def _has_circular_prerequisites(self, prereq_links: List[Dict]) -> bool:
        """Check for circular prerequisite chains."""
        # Build adjacency list
        graph = {}
        for link in prereq_links:
            source = link.get("source")
            target = link.get("target")
            if target not in graph:
                graph[target] = []
            graph[target].append(source)

        # DFS to detect cycles
        visited = set()
        rec_stack = set()

        def has_cycle(node):
            if node in rec_stack:
                return True
            if node in visited:
                return False

            visited.add(node)
            rec_stack.add(node)

            for neighbor in graph.get(node, []):
                if has_cycle(neighbor):
                    return True

            rec_stack.remove(node)
            return False

        for node in graph:
            if has_cycle(node):
                return True

        return False

    def _calculate_stats(self, nodes: List[Dict], links: List[Dict]) -> Dict:
        """Calculate file statistics."""
        groups = {}
        levels = {}
        for node in nodes:
            group = node.get("group", "unknown")
            groups[group] = groups.get(group, 0) + 1

            level = node.get("level", -1)
            levels[level] = levels.get(level, 0) + 1

        return {
            "total_nodes": len(nodes),
            "total_links": len(links),
            "groups": groups,
            "levels": levels,
            "avg_connections": len(links) / len(nodes) if nodes else 0,
        }


def main():
    """Command line interface."""
    import sys

    if len(sys.argv) != 2:
        print("Usage: python validate.py <concept-map.json>")
        sys.exit(1)

    filepath = sys.argv[1]
    validator = ConceptMapValidator()
    result = validator.validate_file(filepath)

    print(f"Validation Results for {filepath}")
    print("=" * 50)

    if result["valid"]:
        print("✅ VALID - All checks passed!")
    else:
        print("❌ INVALID - Errors found:")
        for error in result["errors"]:
            print(f"  • {error}")

    if result.get("warnings"):
        print("\n⚠️  Warnings:")
        for warning in result["warnings"]:
            print(f"  • {warning}")

    print("\n📊 Statistics:")
    stats = result["stats"]
    print(f"  Nodes: {stats['total_nodes']}")
    print(f"  Links: {stats['total_links']}")
    print(f"  Avg Connections: {stats['avg_connections']:.2f}")
    print(f"  Groups: {dict(stats['groups'])}")
    print(f"  Levels: {dict(stats['levels'])}")


if __name__ == "__main__":
    main()
