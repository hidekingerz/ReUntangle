'use client';

import { useState, useCallback } from 'react';
import FolderSelector from '@/components/FolderSelector';
import GraphView from '@/components/GraphView';
import { scanDirectory } from '@/lib/fileSystem';
import { ComponentParser } from '@/lib/parser/componentParser';
import { GraphBuilder } from '@/lib/graph/graphBuilder';
import type { Node, Edge } from '@xyflow/react';
import type { FlowNodeData, LayoutType } from '@/types';

export default function Home() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [graphData, setGraphData] = useState<{
    nodes: Node<FlowNodeData>[];
    edges: Edge[];
  } | null>(null);
  const [layoutType, setLayoutType] = useState<LayoutType>('tree');
  const [projectName, setProjectName] = useState<string>('');
  const [stats, setStats] = useState<{
    filesScanned: number;
    componentsFound: number;
  } | null>(null);

  const handleFolderSelected = useCallback(
    async (directoryHandle: FileSystemDirectoryHandle) => {
      setIsAnalyzing(true);
      setProjectName(directoryHandle.name);

      try {
        // Scan directory for React files
        console.log('Scanning directory...');
        const files = await scanDirectory(directoryHandle);
        console.log(`Found ${files.length} React files`);

        // Parse files to extract components
        const parser = new ComponentParser();
        const allComponents = [];

        for (const file of files) {
          const components = parser.parseFile(file);
          allComponents.push(...components);
        }

        console.log(`Found ${allComponents.length} components`);

        // Build dependency graph
        const graphBuilder = new GraphBuilder();
        const graph = graphBuilder.buildGraph(allComponents);
        const flowGraph = graphBuilder.buildReactFlowGraph(graph);

        setGraphData(flowGraph);
        setStats({
          filesScanned: files.length,
          componentsFound: allComponents.length,
        });
      } catch (error) {
        console.error('Analysis failed:', error);
        alert(`Analysis failed: ${(error as Error).message}`);
      } finally {
        setIsAnalyzing(false);
      }
    },
    []
  );

  const handleReset = () => {
    setGraphData(null);
    setStats(null);
    setProjectName('');
  };

  return (
    <main className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ReUntangle</h1>
            <p className="text-sm text-gray-600 mt-1">
              Visualize and untangle React component dependencies
            </p>
          </div>

          {graphData && (
            <div className="flex items-center gap-4">
              {/* Layout selector */}
              <div className="flex gap-2">
                <button
                  onClick={() => setLayoutType('tree')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    layoutType === 'tree'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Tree Layout
                </button>
                <button
                  onClick={() => setLayoutType('force')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    layoutType === 'force'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Force Layout
                </button>
              </div>

              <button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium
                         hover:bg-gray-300 transition-colors"
              >
                Select New Folder
              </button>
            </div>
          )}
        </div>

        {/* Stats */}
        {stats && (
          <div className="mt-4 flex gap-6 text-sm">
            <div>
              <span className="text-gray-600">Project: </span>
              <span className="font-medium text-gray-900">{projectName}</span>
            </div>
            <div>
              <span className="text-gray-600">Files Scanned: </span>
              <span className="font-medium text-gray-900">
                {stats.filesScanned}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Components Found: </span>
              <span className="font-medium text-gray-900">
                {stats.componentsFound}
              </span>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {!graphData ? (
          <FolderSelector
            onFolderSelected={handleFolderSelected}
            isLoading={isAnalyzing}
          />
        ) : (
          <GraphView
            nodes={graphData.nodes}
            edges={graphData.edges}
            layoutType={layoutType}
          />
        )}
      </div>
    </main>
  );
}
