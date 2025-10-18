'use client';

import { useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import CustomNode from './CustomNode';
import type { FlowNodeData, LayoutType } from '@/types';
import { applyLayout } from '@/lib/graph/layoutAlgorithm';

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
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Apply layout when layout type changes
  useEffect(() => {
    const layoutedNodes = applyLayout(nodes, edges, layoutType);
    setNodes(layoutedNodes);
  }, [layoutType, edges, setNodes]);

  // Update nodes when initialNodes change
  useEffect(() => {
    const layoutedNodes = applyLayout(initialNodes, initialEdges, layoutType);
    setNodes(layoutedNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, layoutType, setNodes, setEdges]);

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node<FlowNodeData>) => {
      if (onNodeClick) {
        onNodeClick(node.id);
      }
    },
    [onNodeClick]
  );

  // Define custom node types
  const nodeTypes = useMemo(
    () => ({
      default: CustomNode,
    }),
    []
  );

  return (
    <div className="w-full h-full bg-gray-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        fitView
        attributionPosition="bottom-left"
        minZoom={0.1}
        maxZoom={2}
      >
        <Background />
        <Controls />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
        />
      </ReactFlow>
    </div>
  );
}
