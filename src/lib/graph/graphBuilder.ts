import type {
  ComponentInfo,
  DependencyGraph,
  DependencyNode,
  DependencyEdge,
} from '@/types';
import type { Node, Edge } from '@xyflow/react';
import type { FlowNodeData } from '@/types';

/**
 * Build a dependency graph from component information
 */
export class GraphBuilder {
  /**
   * Build dependency graph from components
   */
  buildGraph(components: ComponentInfo[]): DependencyGraph {
    const nodes = new Map<string, DependencyNode>();
    const edges: DependencyEdge[] = [];

    // Create nodes
    for (const component of components) {
      nodes.set(component.id, {
        id: component.id,
        component,
        dependencies: [],
        dependents: [],
        depth: 0,
        complexity: component.complexity,
      });
    }

    // Build component name to ID mapping
    const nameToId = new Map<string, string>();
    for (const component of components) {
      nameToId.set(component.name, component.id);
    }

    // Create edges and update dependencies
    for (const component of components) {
      const node = nodes.get(component.id)!;

      for (const depName of component.dependencies) {
        const depId = nameToId.get(depName);
        if (depId && depId !== component.id) {
          // Add to dependencies
          node.dependencies.push(depId);

          // Add to dependent's dependents list
          const depNode = nodes.get(depId);
          if (depNode) {
            depNode.dependents.push(component.id);
          }

          // Create edge
          const existingEdge = edges.find(
            (e) => e.from === component.id && e.to === depId
          );
          if (existingEdge) {
            existingEdge.strength++;
          } else {
            edges.push({
              from: component.id,
              to: depId,
              strength: 1,
            });
          }
        }
      }
    }

    // Calculate depths
    this.calculateDepths(nodes);

    return { nodes, edges };
  }

  /**
   * Calculate depth for each node (topological ordering)
   */
  private calculateDepths(nodes: Map<string, DependencyNode>): void {
    const visited = new Set<string>();
    const temp = new Set<string>();

    const visit = (nodeId: string, depth: number = 0): number => {
      if (temp.has(nodeId)) {
        // Circular dependency detected
        return depth;
      }
      if (visited.has(nodeId)) {
        return nodes.get(nodeId)!.depth;
      }

      temp.add(nodeId);
      const node = nodes.get(nodeId)!;
      let maxDepth = depth;

      for (const depId of node.dependencies) {
        const depDepth = visit(depId, depth + 1);
        maxDepth = Math.max(maxDepth, depDepth);
      }

      temp.delete(nodeId);
      visited.add(nodeId);
      node.depth = maxDepth;

      return maxDepth;
    };

    for (const nodeId of nodes.keys()) {
      if (!visited.has(nodeId)) {
        visit(nodeId);
      }
    }
  }

  /**
   * Check if a component is a root component (entry point)
   * Root components are page.tsx, layout.tsx, or have no dependents but are actually used
   */
  private isRootComponent(filePath: string): boolean {
    const fileName = filePath.split('/').pop() || '';
    // Next.js App Router entry points
    return fileName === 'page.tsx' || fileName === 'layout.tsx' || fileName === 'route.ts';
  }

  /**
   * Get node color based on complexity
   * - Root: Purple (Entry points)
   * - 0-30: Green (Simple)
   * - 31-60: Blue (Standard)
   * - 61-80: Yellow (Complex)
   * - 81-100: Orange (Very Complex)
   * - Circular: Red (Error)
   * - Unused: Gray
   */
  private getNodeColor(
    complexity: number,
    isUnused: boolean,
    hasCircularDep: boolean,
    isRoot: boolean
  ): string {
    if (hasCircularDep) return '#ef4444'; // Red for circular dependency
    if (isRoot) return '#8b5cf6'; // Purple for root components (distinct from green)
    if (isUnused) return '#9ca3af'; // Gray for unused
    if (complexity <= 30) return '#22c55e'; // Green (simple)
    if (complexity <= 60) return '#3b82f6'; // Blue (standard)
    if (complexity <= 80) return '#eab308'; // Yellow (complex)
    return '#f97316'; // Orange for very complex
  }

  /**
   * Get node size based on complexity
   */
  private getNodeSize(complexity: number): number {
    // Size range: 40px to 100px based on complexity
    return 40 + (complexity / 100) * 60;
  }

  /**
   * Convert dependency graph to React Flow format
   */
  buildReactFlowGraph(graph: DependencyGraph): {
    nodes: Node<FlowNodeData>[];
    edges: Edge[];
  } {
    const flowNodes: Node<FlowNodeData>[] = [];
    const flowEdges: Edge[] = [];

    // Detect circular dependencies
    const circularNodes = this.detectCircularDependencies(graph);

    // Create nodes
    for (const [id, node] of graph.nodes) {
      const isUnused = node.dependents.length === 0;
      const hasCircularDep = circularNodes.has(id);
      const isRoot = this.isRootComponent(node.component.filePath);
      const color = this.getNodeColor(node.complexity, isUnused, hasCircularDep, isRoot);
      const size = this.getNodeSize(node.complexity);

      flowNodes.push({
        id,
        type: 'default',
        position: { x: 0, y: 0 }, // Will be set by layout algorithm
        data: {
          label: '', // Empty label - we'll use a custom label below the node
          componentInfo: node.component,
          complexity: node.complexity,
          dependencyCount: node.dependencies.length,
          dependentCount: node.dependents.length,
        },
        style: {
          backgroundColor: color,
          width: size,
          height: size,
          borderRadius: '50%',
          border: hasCircularDep ? '3px solid #dc2626' : '2px solid #fff',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          // Display complexity score inside the node
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '11px',
          fontWeight: 'bold',
        },
      });
    }

    // Create edges
    for (const edge of graph.edges) {
      flowEdges.push({
        id: `${edge.from}-${edge.to}`,
        source: edge.from,
        target: edge.to,
        animated: edge.strength > 1,
        style: {
          strokeWidth: Math.min(edge.strength, 5),
          stroke: '#94a3b8',
        },
      });
    }

    return { nodes: flowNodes, edges: flowEdges };
  }

  /**
   * Detect circular dependencies using DFS
   */
  private detectCircularDependencies(graph: DependencyGraph): Set<string> {
    const circularNodes = new Set<string>();
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) {
        // Found a cycle
        circularNodes.add(nodeId);
        return true;
      }
      if (visited.has(nodeId)) {
        return false;
      }

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const node = graph.nodes.get(nodeId);
      if (node) {
        for (const depId of node.dependencies) {
          if (dfs(depId)) {
            circularNodes.add(nodeId);
          }
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const nodeId of graph.nodes.keys()) {
      if (!visited.has(nodeId)) {
        dfs(nodeId);
      }
    }

    return circularNodes;
  }
}
