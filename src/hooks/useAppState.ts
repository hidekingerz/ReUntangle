import { useState, useCallback } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type { FlowNodeData, LayoutType, ComponentInfo } from '@/types';

interface GraphData {
  nodes: Node<FlowNodeData>[];
  edges: Edge[];
}

interface Stats {
  filesScanned: number;
  componentsFound: number;
}

export function useAppState() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [layoutType, setLayoutType] = useState<LayoutType>('tree');
  const [projectName, setProjectName] = useState<string>('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<ComponentInfo | null>(null);

  const updateAnalysisResult = useCallback(
    (name: string, data: GraphData, analysisStats: Stats) => {
      setProjectName(name);
      setGraphData(data);
      setStats(analysisStats);
    },
    []
  );

  const reset = useCallback(() => {
    setGraphData(null);
    setStats(null);
    setProjectName('');
    setSelectedComponent(null);
  }, []);

  const selectComponent = useCallback(
    (nodeId: string) => {
      const node = graphData?.nodes.find((n) => n.id === nodeId);
      if (node) {
        setSelectedComponent(node.data.componentInfo);
      }
    },
    [graphData]
  );

  const clearSelection = useCallback(() => {
    setSelectedComponent(null);
  }, []);

  return {
    // State
    graphData,
    layoutType,
    projectName,
    stats,
    selectedComponent,
    // Actions
    setLayoutType,
    updateAnalysisResult,
    reset,
    selectComponent,
    clearSelection,
  };
}
