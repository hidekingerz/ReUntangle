import { useMemo } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type { FlowNodeData, SearchOptions, FilterOptions } from '@/types';

type UseGraphFilterProps = {
  nodes: Node<FlowNodeData>[];
  edges: Edge[];
  searchOptions: SearchOptions;
  filterOptions: FilterOptions;
};

type UseGraphFilterResult = {
  filteredNodes: Node<FlowNodeData>[];
  filteredEdges: Edge[];
  matchedNodeIds: Set<string>;
  stats: {
    total: number;
    filtered: number;
    hidden: number;
  };
};

export function useGraphFilter({
  nodes,
  edges,
  searchOptions,
  filterOptions,
}: UseGraphFilterProps): UseGraphFilterResult {
  return useMemo(() => {
    // Step 1: Apply search filter
    const matchedNodes = new Set<string>();

    if (searchOptions.query) {
      const query = searchOptions.query.trim();

      nodes.forEach((node) => {
        const component = node.data.componentInfo;
        let isMatch = false;

        try {
          if (searchOptions.useRegex) {
            const regex = new RegExp(query, 'i');
            if (searchOptions.searchIn === 'name' || searchOptions.searchIn === 'both') {
              isMatch = isMatch || regex.test(component.name);
            }
            if (searchOptions.searchIn === 'path' || searchOptions.searchIn === 'both') {
              isMatch = isMatch || regex.test(component.filePath);
            }
          } else {
            const lowerQuery = query.toLowerCase();
            if (searchOptions.searchIn === 'name' || searchOptions.searchIn === 'both') {
              isMatch = isMatch || component.name.toLowerCase().includes(lowerQuery);
            }
            if (searchOptions.searchIn === 'path' || searchOptions.searchIn === 'both') {
              isMatch = isMatch || component.filePath.toLowerCase().includes(lowerQuery);
            }
          }
        } catch {
          // Invalid regex, treat as plain text
          const lowerQuery = query.toLowerCase();
          if (searchOptions.searchIn === 'name' || searchOptions.searchIn === 'both') {
            isMatch = isMatch || component.name.toLowerCase().includes(lowerQuery);
          }
          if (searchOptions.searchIn === 'path' || searchOptions.searchIn === 'both') {
            isMatch = isMatch || component.filePath.toLowerCase().includes(lowerQuery);
          }
        }

        if (isMatch) {
          matchedNodes.add(node.id);
        }
      });
    } else {
      // No search query, all nodes match
      nodes.forEach((node) => matchedNodes.add(node.id));
    }

    // Step 2: Apply filters
    const filteredNodes = nodes.filter((node) => {
      // Must match search first
      if (!matchedNodes.has(node.id)) {
        return false;
      }

      const component = node.data.componentInfo;
      const complexity = node.data.complexity;

      // Complexity range filter
      if (
        complexity < filterOptions.complexityRange.min ||
        complexity > filterOptions.complexityRange.max
      ) {
        return false;
      }

      // Component type filter
      if (
        filterOptions.componentTypes.length > 0 &&
        !filterOptions.componentTypes.includes(component.type)
      ) {
        return false;
      }

      // File extension filter
      if (filterOptions.fileExtensions.length > 0) {
        const extension = component.filePath.slice(component.filePath.lastIndexOf('.')) as
          | '.tsx'
          | '.jsx'
          | '.ts'
          | '.js';
        if (!filterOptions.fileExtensions.includes(extension)) {
          return false;
        }
      }

      // Unused filter
      if (!filterOptions.showUnused && node.data.dependentCount === 0) {
        // Check if it's a root component (should always be shown)
        const fileName = component.filePath.split('/').pop() || '';
        const isRoot =
          fileName === 'page.tsx' || fileName === 'layout.tsx' || fileName === 'route.ts';
        if (!isRoot) {
          return false;
        }
      }

      // Circular dependency filter
      if (!filterOptions.showCircular) {
        const border = node.style?.border;
        const hasCircularDep = typeof border === 'string' && border.includes('#dc2626');
        if (hasCircularDep) {
          return false;
        }
      }

      return true;
    });

    // Step 3: Filter edges to only show connections between visible nodes
    const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
    const filteredEdges = edges.filter(
      (edge) => filteredNodeIds.has(edge.source) && filteredNodeIds.has(edge.target)
    );

    // Step 4: Calculate stats
    const stats = {
      total: nodes.length,
      filtered: filteredNodes.length,
      hidden: nodes.length - filteredNodes.length,
    };

    // Return matched node IDs (for highlighting)
    const searchMatchedIds = new Set<string>();
    if (searchOptions.query) {
      filteredNodes.forEach((node) => {
        if (matchedNodes.has(node.id)) {
          searchMatchedIds.add(node.id);
        }
      });
    }

    return {
      filteredNodes,
      filteredEdges,
      matchedNodeIds: searchMatchedIds,
      stats,
    };
  }, [nodes, edges, searchOptions, filterOptions]);
}
