'use client';

import { useCallback, useState } from 'react';
import FolderSelector from '@/components/FolderSelector';
import GraphView from '@/components/GraphView';
import DetailPanel from '@/components/DetailPanel';
import Header from '@/components/Header';
import MetricsDashboard from '@/components/MetricsDashboard';
import SearchAndFilter from '@/components/SearchAndFilter';
import { useProjectAnalysis } from '@/hooks/useProjectAnalysis';
import { useAppState } from '@/hooks/useAppState';
import { useGraphFilter } from '@/hooks/useGraphFilter';

export default function Home() {
  const { isAnalyzing, analyzeProject } = useProjectAnalysis();
  const {
    graphData,
    layoutType,
    projectName,
    stats,
    metrics,
    selectedComponent,
    searchOptions,
    filterOptions,
    setLayoutType,
    setSearchOptions,
    setFilterOptions,
    updateAnalysisResult,
    reset,
    selectComponent,
    clearSelection,
  } = useAppState();
  const [showMetrics, setShowMetrics] = useState(false);

  // Apply search and filter
  const { filteredNodes, filteredEdges, matchedNodeIds, stats: filterStats } = useGraphFilter({
    nodes: graphData?.nodes || [],
    edges: graphData?.edges || [],
    searchOptions,
    filterOptions,
  });

  const handleFolderSelected = useCallback(
    async (directoryHandle: FileSystemDirectoryHandle) => {
      try {
        const result = await analyzeProject(directoryHandle);
        updateAnalysisResult(
          directoryHandle.name,
          { nodes: result.nodes, edges: result.edges },
          { filesScanned: result.filesScanned, componentsFound: result.componentsFound },
          result.metrics
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
        onShowMetrics={() => setShowMetrics(true)}
        stats={
          stats ? { projectName, ...stats } : null
        }
      />

      <div className="flex-1 overflow-hidden flex flex-col">
        {!graphData ? (
          <FolderSelector onFolderSelected={handleFolderSelected} isLoading={isAnalyzing} />
        ) : (
          <>
            {/* Search and Filter Bar */}
            <SearchAndFilter
              searchOptions={searchOptions}
              filterOptions={filterOptions}
              onSearchChange={setSearchOptions}
              onFilterChange={setFilterOptions}
              stats={filterStats}
              maxComplexity={metrics?.maxComplexity || 100}
              maxDepth={100}
            />

            {/* Graph and Detail Panel */}
            <div className="flex-1 overflow-hidden flex">
              <div className="flex-1">
                <GraphView
                  nodes={filteredNodes}
                  edges={filteredEdges}
                  layoutType={layoutType}
                  highlightedNodeIds={matchedNodeIds}
                  onNodeClick={selectComponent}
                />
              </div>
              <DetailPanel component={selectedComponent} onClose={clearSelection} />
            </div>
          </>
        )}
      </div>

      {/* Metrics Dashboard Modal */}
      {showMetrics && metrics && (
        <MetricsDashboard metrics={metrics} onClose={() => setShowMetrics(false)} />
      )}
    </main>
  );
}
