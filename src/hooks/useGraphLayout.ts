import { useEffect } from 'react';
import { useNodesState, useEdgesState, type Node, type Edge } from '@xyflow/react';
import { applyLayout } from '@/lib/graph/layoutAlgorithm';
import type { FlowNodeData, LayoutType } from '@/types';

/**
 * Custom hook to manage graph nodes and edges with automatic layout application
 */
export function useGraphLayout(
  initialNodes: Node<FlowNodeData>[],
  initialEdges: Edge[],
  layoutType: LayoutType
) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Apply layout whenever nodes, edges, or layout type changes
  useEffect(() => {
    const layoutedNodes = applyLayout(initialNodes, initialEdges, layoutType);
    setNodes(layoutedNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, layoutType, setNodes, setEdges]);

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
  };
}
