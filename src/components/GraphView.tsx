'use client';

import '@xyflow/react/dist/style.css';
import type { Node, Edge } from '@xyflow/react';
import type { FlowNodeData, LayoutType } from '@/types';
import { useGraphLayout } from '@/hooks/useGraphLayout';
import { useNodeClickHandler } from '@/hooks/useNodeClickHandler';
import { ReactFlowWrapper } from './GraphView/ReactFlowWrapper';

interface GraphViewProps {
  nodes: Node<FlowNodeData>[];
  edges: Edge[];
  layoutType: LayoutType;
  onNodeClick?: (nodeId: string) => void;
}

export default function GraphView({
  nodes: initialNodes,
  edges: initialEdges,
  layoutType,
  onNodeClick,
}: GraphViewProps) {
  const { nodes, edges, onNodesChange, onEdgesChange } = useGraphLayout(
    initialNodes,
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
