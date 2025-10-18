import type { Node, Edge } from '@xyflow/react';
import type { LayoutType } from '@/types';

/**
 * Apply layout algorithm to nodes
 */
export function applyLayout<T extends Record<string, unknown> = Record<string, unknown>>(
  nodes: Node<T>[],
  edges: Edge[],
  layoutType: LayoutType
): Node<T>[] {
  switch (layoutType) {
    case 'tree':
      return applyTreeLayout(nodes, edges);
    case 'force':
      return applyForceLayout(nodes);
    default:
      return nodes;
  }
}

/**
 * Tree layout - hierarchical top-down
 */
function applyTreeLayout<T extends Record<string, unknown> = Record<string, unknown>>(nodes: Node<T>[], edges: Edge[]): Node<T>[] {
  const levels: Map<string, number> = new Map();
  const childrenMap = new Map<string, string[]>();

  // Build children map
  for (const edge of edges) {
    if (!childrenMap.has(edge.source)) {
      childrenMap.set(edge.source, []);
    }
    childrenMap.get(edge.source)!.push(edge.target);
  }

  // Find root nodes (nodes with no incoming edges)
  const hasIncoming = new Set(edges.map((e) => e.target));
  const rootNodes = nodes.filter((n) => !hasIncoming.has(n.id));

  // Calculate levels (BFS)
  const queue: Array<{ id: string; level: number }> = rootNodes.map((n) => ({
    id: n.id,
    level: 0,
  }));

  while (queue.length > 0) {
    const { id, level } = queue.shift()!;
    levels.set(id, level);

    const children = childrenMap.get(id) || [];
    for (const childId of children) {
      if (!levels.has(childId)) {
        queue.push({ id: childId, level: level + 1 });
      }
    }
  }

  // Assign positions
  const levelGroups = new Map<number, string[]>();
  for (const [nodeId, level] of levels) {
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level)!.push(nodeId);
  }

  const LEVEL_HEIGHT = 200;
  const NODE_WIDTH = 200;

  return nodes.map((node) => {
    const level = levels.get(node.id) ?? 0;
    const nodesInLevel = levelGroups.get(level) || [];
    const indexInLevel = nodesInLevel.indexOf(node.id);
    const totalInLevel = nodesInLevel.length;

    return {
      ...node,
      position: {
        x: (indexInLevel - totalInLevel / 2) * NODE_WIDTH + 400,
        y: level * LEVEL_HEIGHT + 50,
      },
    };
  });
}

/**
 * Force-directed layout - simplified version
 */
function applyForceLayout<T extends Record<string, unknown> = Record<string, unknown>>(nodes: Node<T>[]): Node<T>[] {
  // Simple circular layout as a starting point
  const radius = Math.max(200, nodes.length * 30);
  const angleStep = (2 * Math.PI) / nodes.length;

  return nodes.map((node, index) => {
    const angle = index * angleStep;
    return {
      ...node,
      position: {
        x: Math.cos(angle) * radius + 400,
        y: Math.sin(angle) * radius + 400,
      },
    };
  });
}
