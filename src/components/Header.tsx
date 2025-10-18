import type { LayoutType } from '@/types';

type HeaderProps = {
  hasGraphData: boolean;
  layoutType: LayoutType;
  onLayoutChange: (layout: LayoutType) => void;
  onReset: () => void;
  onShowMetrics?: () => void;
  stats: {
    projectName: string;
    filesScanned: number;
    componentsFound: number;
  } | null;
};

export default function Header({
  hasGraphData,
  layoutType,
  onLayoutChange,
  onReset,
  onShowMetrics,
  stats,
}: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ReUntangle</h1>
          <p className="text-sm text-gray-600 mt-1">
            Visualize and untangle React component dependencies
          </p>
        </div>

        {hasGraphData && (
          <div className="flex items-center gap-4">
            {/* Layout selector */}
            <div className="flex gap-2">
              <button
                onClick={() => onLayoutChange('tree')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  layoutType === 'tree'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Tree Layout
              </button>
              <button
                onClick={() => onLayoutChange('force')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  layoutType === 'force'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Force Layout
              </button>
            </div>

            {onShowMetrics && (
              <button
                onClick={onShowMetrics}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium
                         hover:bg-green-700 transition-colors"
              >
                📊 Show Metrics
              </button>
            )}

            <button
              onClick={onReset}
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
            <span className="font-medium text-gray-900">{stats.projectName}</span>
          </div>
          <div>
            <span className="text-gray-600">Files Scanned: </span>
            <span className="font-medium text-gray-900">{stats.filesScanned}</span>
          </div>
          <div>
            <span className="text-gray-600">Components Found: </span>
            <span className="font-medium text-gray-900">{stats.componentsFound}</span>
          </div>
        </div>
      )}
    </header>
  );
}
