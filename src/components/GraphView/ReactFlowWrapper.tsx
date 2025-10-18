'use client';

import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react';
import type { Node, Edge, OnNodesChange, OnEdgesChange } from '@xyflow/react';
import type { FlowNodeData } from '@/types';
import { nodeTypes } from './nodeTypes';
import { REACT_FLOW_CONFIG, MINIMAP_CONFIG } from './constants';

type ReactFlowWrapperProps = {
  nodes: Node<FlowNodeData>[];
  edges: Edge[];
  onNodesChange: OnNodesChange<Node<FlowNodeData>>;
  onEdgesChange: OnEdgesChange;
  onNodeClick: (event: React.MouseEvent, node: Node<FlowNodeData>) => void;
};

export function ReactFlowWrapper({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onNodeClick,
}: ReactFlowWrapperProps) {
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={onNodeClick}
      fitView
      {...REACT_FLOW_CONFIG}
    >
      <Background />
      <Controls />
      <MiniMap {...MINIMAP_CONFIG} />
    </ReactFlow>
  );
}
