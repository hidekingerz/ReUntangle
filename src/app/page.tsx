'use client';

import { useCallback } from 'react';
import FolderSelector from '@/components/FolderSelector';
import GraphView from '@/components/GraphView';
import DetailPanel from '@/components/DetailPanel';
import Header from '@/components/Header';
import { useProjectAnalysis } from '@/hooks/useProjectAnalysis';
import { useAppState } from '@/hooks/useAppState';

export default function Home() {
  const { isAnalyzing, analyzeProject } = useProjectAnalysis();
  const {
    graphData,
    layoutType,
    projectName,
    stats,
    selectedComponent,
    setLayoutType,
    updateAnalysisResult,
    reset,
    selectComponent,
    clearSelection,
  } = useAppState();

  const handleFolderSelected = useCallback(
    async (directoryHandle: FileSystemDirectoryHandle) => {
      try {
        const result = await analyzeProject(directoryHandle);
        updateAnalysisResult(
          directoryHandle.name,
          { nodes: result.nodes, edges: result.edges },
          { filesScanned: result.filesScanned, componentsFound: result.componentsFound }
        );
      } catch (error) {
        alert(`Analysis failed: ${(error as Error).message}`);
      }
    },
    [analyzeProject, updateAnalysisResult]
  );

  return (
    <main className="h-screen flex flex-col">
      <Header
        hasGraphData={!!graphData}
        layoutType={layoutType}
        onLayoutChange={setLayoutType}
        onReset={reset}
        stats={
          stats ? { projectName, ...stats } : null
        }
      />

      <div className="flex-1 overflow-hidden flex">
        {!graphData ? (
          <FolderSelector onFolderSelected={handleFolderSelected} isLoading={isAnalyzing} />
        ) : (
          <>
            <div className="flex-1">
              <GraphView
                nodes={graphData.nodes}
                edges={graphData.edges}
                layoutType={layoutType}
                onNodeClick={selectComponent}
              />
            </div>
            <DetailPanel component={selectedComponent} onClose={clearSelection} />
          </>
        )}
      </div>
    </main>
  );
}
