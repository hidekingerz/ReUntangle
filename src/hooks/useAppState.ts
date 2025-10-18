import { useState, useCallback } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type {
  FlowNodeData,
  LayoutType,
  ComponentInfo,
  ProjectMetrics,
  SearchOptions,
  FilterOptions,
} from '@/types';

type GraphData = {
  nodes: Node<FlowNodeData>[];
  edges: Edge[];
};

type Stats = {
  filesScanned: number;
  componentsFound: number;
};

export function useAppState() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [layoutType, setLayoutType] = useState<LayoutType>('tree');
  const [projectName, setProjectName] = useState<string>('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [metrics, setMetrics] = useState<ProjectMetrics | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<ComponentInfo | null>(null);
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    query: '',
    searchIn: 'both',
    useRegex: false,
  });
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    complexityRange: { min: 0, max: 100 },
    depthRange: { min: 0, max: 100 },
    componentTypes: [],
    fileExtensions: [],
    showUnused: true,
    showCircular: true,
  });

  const updateAnalysisResult = useCallback(
    (name: string, data: GraphData, analysisStats: Stats, projectMetrics: ProjectMetrics) => {
      setProjectName(name);
      setGraphData(data);
      setStats(analysisStats);
      setMetrics(projectMetrics);
      // Reset filters with new max values
      setFilterOptions({
        complexityRange: { min: 0, max: projectMetrics.maxComplexity },
        depthRange: { min: 0, max: 100 },
        componentTypes: [],
        fileExtensions: [],
        showUnused: true,
        showCircular: true,
      });
      // Reset search
      setSearchOptions({
        query: '',
        searchIn: 'both',
        useRegex: false,
      });
    },
    []
  );

  const reset = useCallback(() => {
    setGraphData(null);
    setStats(null);
    setMetrics(null);
    setProjectName('');
    setSelectedComponent(null);
    setSearchOptions({ query: '', searchIn: 'both', useRegex: false });
    setFilterOptions({
      complexityRange: { min: 0, max: 100 },
      depthRange: { min: 0, max: 100 },
      componentTypes: [],
      fileExtensions: [],
      showUnused: true,
      showCircular: true,
    });
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
    metrics,
    selectedComponent,
    searchOptions,
    filterOptions,
    // Actions
    setLayoutType,
    setSearchOptions,
    setFilterOptions,
    updateAnalysisResult,
    reset,
    selectComponent,
    clearSelection,
  };
}
