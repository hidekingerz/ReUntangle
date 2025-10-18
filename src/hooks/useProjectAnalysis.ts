import { useState, useCallback } from 'react';
import { scanDirectory } from '@/lib/fileSystem';
import { ComponentParser } from '@/lib/parser/componentParser';
import { GraphBuilder } from '@/lib/graph/graphBuilder';
import type { Node, Edge } from '@xyflow/react';
import type { FlowNodeData } from '@/types';

interface AnalysisResult {
  nodes: Node<FlowNodeData>[];
  edges: Edge[];
  filesScanned: number;
  componentsFound: number;
}

export function useProjectAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeProject = useCallback(
    async (directoryHandle: FileSystemDirectoryHandle): Promise<AnalysisResult> => {
      setIsAnalyzing(true);

      try {
        // Scan directory for React files
        const files = await scanDirectory(directoryHandle);

        // Parse files to extract components
        const parser = new ComponentParser();
        const allComponents = [];

        for (const file of files) {
          const components = parser.parseFile(file);
          allComponents.push(...components);
        }

        // Build dependency graph
        const graphBuilder = new GraphBuilder();
        const graph = graphBuilder.buildGraph(allComponents);
        const flowGraph = graphBuilder.buildReactFlowGraph(graph);

        return {
          nodes: flowGraph.nodes,
          edges: flowGraph.edges,
          filesScanned: files.length,
          componentsFound: allComponents.length,
        };
      } finally {
        setIsAnalyzing(false);
      }
    },
    []
  );

  return {
    isAnalyzing,
    analyzeProject,
  };
}
