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
   * Convert dependency graph to React Flow format
   */
  buildReactFlowGraph(graph: DependencyGraph): {
    nodes: Node<FlowNodeData>[];
    edges: Edge[];
  } {
    const flowNodes: Node<FlowNodeData>[] = [];
    const flowEdges: Edge[] = [];

    // Create nodes
    for (const [id, node] of graph.nodes) {
      flowNodes.push({
        id,
        type: 'default',
        position: { x: 0, y: 0 }, // Will be set by layout algorithm
        data: {
          label: node.component.name,
          componentInfo: node.component,
          complexity: node.complexity,
          dependencyCount: node.dependencies.length,
          dependentCount: node.dependents.length,
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
        },
      });
    }

    return { nodes: flowNodes, edges: flowEdges };
  }
}
