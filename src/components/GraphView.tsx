'use client';

import '@xyflow/react/dist/style.css';
import { useMemo, useCallback, useEffect } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type { FlowNodeData, LayoutType } from '@/types';
import { useGraphLayout } from '@/hooks/useGraphLayout';
import { useNodeClickHandler } from '@/hooks/useNodeClickHandler';
import { useScouterMode } from '@/hooks/useScouterMode';
import { ReactFlowWrapper } from './GraphView/ReactFlowWrapper';
import ScouterModeIndicator from './ScouterModeIndicator';

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
  // スカウターモードフック（initialShowAllDescendantsのデフォルトはtrue）
  const {
    isScouterMode,
    centerNodeId,
    showAllDescendants,
    activateScouterMode,
    deactivateScouterMode,
    toggleShowAllDescendants,
    filteredNodes: scouterFilteredNodes,
    filteredEdges: scouterFilteredEdges,
  } = useScouterMode<FlowNodeData>({
    nodes: initialNodes,
    edges: initialEdges,
    initialShowAllDescendants: true,
  });

  // ノードにハイライトを適用
  const highlightedNodes = useMemo((): Node<FlowNodeData>[] => {
    const nodesToHighlight = isScouterMode ? scouterFilteredNodes : initialNodes;

    if (!highlightedNodeIds || highlightedNodeIds.size === 0) {
      return nodesToHighlight;
    }

    return nodesToHighlight.map((node) => {
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
  }, [initialNodes, scouterFilteredNodes, highlightedNodeIds, isScouterMode]);

  const edgesToUse = isScouterMode ? scouterFilteredEdges : initialEdges;

  const { nodes, edges, onNodesChange, onEdgesChange } = useGraphLayout(
    highlightedNodes,
    edgesToUse,
    layoutType
  );

  const handleNodeClick = useNodeClickHandler(onNodeClick);

  // スカウターモード用のノードダブルクリックハンドラー
  const handleNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: Node<FlowNodeData>) => {
      if (isScouterMode && node.id === centerNodeId) {
        // 中心ノードをダブルクリックするとスカウターモードを解除
        deactivateScouterMode();
      } else {
        activateScouterMode(node.id);
      }
    },
    [isScouterMode, centerNodeId, activateScouterMode, deactivateScouterMode]
  );

  // ESCキーでスカウターモードを解除
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isScouterMode) {
        deactivateScouterMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isScouterMode, deactivateScouterMode]);

  return (
    <div className="w-full h-full bg-gray-50 relative">
      {/* スカウターモードインジケーター */}
      {isScouterMode && (
        <ScouterModeIndicator
          centerNodeId={centerNodeId}
          onDeactivate={deactivateScouterMode}
          showAllDescendants={showAllDescendants}
          onToggleShowAllDescendants={toggleShowAllDescendants}
        />
      )}

      <ReactFlowWrapper
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
      />
    </div>
  );
}
