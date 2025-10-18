'use client';

import type { ProjectMetrics } from '@/types';

type MetricsDashboardProps = {
  metrics: ProjectMetrics;
  onClose: () => void;
};

export default function MetricsDashboard({ metrics, onClose }: MetricsDashboardProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Project Metrics Dashboard</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close dashboard"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-8">
          {/* Overview Cards */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-blue-600 font-medium">Total Components</p>
                <p className="text-3xl font-bold text-blue-900 mt-1">
                  {metrics.totalComponents}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <p className="text-sm text-purple-600 font-medium">Custom Hooks</p>
                <p className="text-3xl font-bold text-purple-900 mt-1">
                  {metrics.totalHooks}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="text-sm text-green-600 font-medium">Avg Complexity</p>
                <p className="text-3xl font-bold text-green-900 mt-1">
                  {metrics.averageComplexity}
                </p>
              </div>
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <p className="text-sm text-red-600 font-medium">Circular Deps</p>
                <p className="text-3xl font-bold text-red-900 mt-1">
                  {metrics.circularDependencies}
                </p>
              </div>
            </div>
          </section>

          {/* Complexity Distribution */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Complexity Distribution</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    🟢 Simple (0-30)
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {metrics.complexityDistribution.simple}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-500 h-3 rounded-full"
                    style={{
                      width: `${(metrics.complexityDistribution.simple / metrics.totalComponents) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    🔵 Standard (31-60)
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {metrics.complexityDistribution.standard}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-500 h-3 rounded-full"
                    style={{
                      width: `${(metrics.complexityDistribution.standard / metrics.totalComponents) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    🟡 Complex (61-80)
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {metrics.complexityDistribution.complex}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-yellow-500 h-3 rounded-full"
                    style={{
                      width: `${(metrics.complexityDistribution.complex / metrics.totalComponents) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    🟠 Very Complex (81-100)
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {metrics.complexityDistribution.veryComplex}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-orange-500 h-3 rounded-full"
                    style={{
                      width: `${(metrics.complexityDistribution.veryComplex / metrics.totalComponents) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Top Complex Components */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Most Complex Components (Top 10)
            </h3>
            <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Component
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      File Path
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Complexity
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {metrics.topComplexComponents.map((component, index) => (
                    <tr key={index} className="hover:bg-gray-100 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        #{index + 1}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {component.name}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 break-all">
                        {component.filePath}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            component.complexity <= 30
                              ? 'bg-green-100 text-green-800'
                              : component.complexity <= 60
                              ? 'bg-blue-100 text-blue-800'
                              : component.complexity <= 80
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}
                        >
                          {component.complexity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Most Depended On */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Most Depended On (Top 10)
            </h3>
            <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Component
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      File Path
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Used By
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {metrics.mostDependedOn.map((component, index) => (
                    <tr key={index} className="hover:bg-gray-100 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        #{index + 1}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {component.name}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 break-all">
                        {component.filePath}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                          {component.dependentCount} components
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium
                     hover:bg-blue-700 transition-colors"
          >
            Close Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
