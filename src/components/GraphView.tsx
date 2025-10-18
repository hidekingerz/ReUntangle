'use client';

import '@xyflow/react/dist/style.css';
import { useMemo } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type { FlowNodeData, LayoutType } from '@/types';
import { useGraphLayout } from '@/hooks/useGraphLayout';
import { useNodeClickHandler } from '@/hooks/useNodeClickHandler';
import { ReactFlowWrapper } from './GraphView/ReactFlowWrapper';

type GraphViewProps = {
  nodes: Node<FlowNodeData>[];
  edges: Edge[];
  layoutType: LayoutType;
  highlightedNodeIds?: Set<string>;
  onNodeClick?: (nodeId: string) => void;
};

export default function GraphView({
  nodes: initialNodes,
  edges: initialEdges,
  layoutType,
  highlightedNodeIds,
  onNodeClick,
}: GraphViewProps) {
  // Apply highlighting to nodes
  const highlightedNodes = useMemo(() => {
    if (!highlightedNodeIds || highlightedNodeIds.size === 0) {
      return initialNodes;
    }

    return initialNodes.map((node) => {
      const isHighlighted = highlightedNodeIds.has(node.id);
      const isDimmed = !isHighlighted;

      return {
        ...node,
        style: {
          ...node.style,
          opacity: isDimmed ? 0.3 : 1,
          boxShadow: isHighlighted
            ? '0 0 0 3px #fbbf24, 0 4px 6px rgba(0, 0, 0, 0.1)'
            : node.style?.boxShadow,
        },
      };
    });
  }, [initialNodes, highlightedNodeIds]);

  const { nodes, edges, onNodesChange, onEdgesChange } = useGraphLayout(
    highlightedNodes,
    initialEdges,
    layoutType
  );

  const handleNodeClick = useNodeClickHandler(onNodeClick);

  return (
    <div className="w-full h-full bg-gray-50">
      <ReactFlowWrapper
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
      />
    </div>
  );
}
