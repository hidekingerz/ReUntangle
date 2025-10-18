'use client';

import type { ComponentInfo } from '@/types';

interface DetailPanelProps {
  component: ComponentInfo | null;
  onClose: () => void;
}

export default function DetailPanel({ component, onClose }: DetailPanelProps) {
  if (!component) {
    return null;
  }

  // Get complexity level and color
  const getComplexityLevel = (complexity: number) => {
    if (complexity <= 30) return { level: 'Simple', color: 'text-green-600' };
    if (complexity <= 60) return { level: 'Standard', color: 'text-blue-600' };
    if (complexity <= 80) return { level: 'Complex', color: 'text-yellow-600' };
    return { level: 'Very Complex', color: 'text-red-600' };
  };

  const { level, color } = getComplexityLevel(component.complexity);

  return (
    <div className="w-96 h-full bg-white border-l border-gray-200 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-900">Component Details</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close panel"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="px-6 py-4 space-y-6">
        {/* Basic Information */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Basic Information</h3>
          <div className="space-y-2">
            <div>
              <span className="text-xs text-gray-500">Component Name</span>
              <p className="text-sm font-medium text-gray-900">{component.name}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">File Path</span>
              <p className="text-sm text-gray-700 break-all">{component.filePath}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Type</span>
              <p className="text-sm text-gray-900 capitalize">{component.type}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Lines of Code</span>
              <p className="text-sm text-gray-900">{component.linesOfCode}</p>
            </div>
          </div>
        </section>

        {/* Complexity Score */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Complexity Analysis</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-500">Complexity Score</span>
                <span className={`text-sm font-bold ${color}`}>
                  {component.complexity} / 100
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    component.complexity <= 30
                      ? 'bg-green-500'
                      : component.complexity <= 60
                      ? 'bg-blue-500'
                      : component.complexity <= 80
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${component.complexity}%` }}
                />
              </div>
              <p className={`text-xs mt-1 ${color}`}>{level}</p>
            </div>
          </div>
        </section>

        {/* Dependencies */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Dependencies ({component.dependencies.length})
          </h3>
          {component.dependencies.length > 0 ? (
            <ul className="space-y-1">
              {component.dependencies.map((dep, idx) => (
                <li key={idx} className="text-sm text-gray-700 flex items-start">
                  <span className="text-gray-400 mr-2">→</span>
                  <span className="break-all">{dep}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 italic">No dependencies</p>
          )}
        </section>

        {/* React Hooks */}
        {component.hooks.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              React Hooks ({component.hooks.reduce((sum, h) => sum + h.count, 0)})
            </h3>
            <ul className="space-y-2">
              {component.hooks.map((hook, idx) => (
                <li key={idx} className="flex justify-between items-center">
                  <span className="text-sm text-gray-700 font-mono">{hook.name}</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {hook.count}x
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Props Information (TypeScript) */}
        {component.propsInfo && (
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Props ({component.propsInfo.properties.length})
            </h3>
            <div className="space-y-2">
              <p className="text-xs text-gray-500 mb-2">Type: {component.propsInfo.name}</p>
              <ul className="space-y-2">
                {component.propsInfo.properties.map((prop, idx) => (
                  <li key={idx} className="border-l-2 border-gray-300 pl-3">
                    <div className="flex items-start justify-between">
                      <span className="text-sm font-mono text-gray-900">{prop.name}</span>
                      {!prop.required && (
                        <span className="text-xs text-gray-500 italic">optional</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 font-mono">{prop.type}</p>
                    {prop.defaultValue && (
                      <p className="text-xs text-gray-500">Default: {prop.defaultValue}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* External Libraries */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">External Libraries</h3>
          {component.imports.filter((imp) => !imp.source.startsWith('.')).length > 0 ? (
            <ul className="space-y-1">
              {component.imports
                .filter((imp) => !imp.source.startsWith('.') && !imp.source.startsWith('/'))
                .filter((imp) => imp.source !== 'react' && imp.source !== 'react-dom')
                .map((imp, idx) => (
                  <li key={idx} className="text-sm">
                    <span className="font-mono text-gray-700">{imp.source}</span>
                    <div className="text-xs text-gray-500 ml-4">
                      {imp.specifiers.join(', ')}
                    </div>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 italic">No external libraries</p>
          )}
        </section>

        {/* All Imports */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            All Imports ({component.imports.length})
          </h3>
          <ul className="space-y-1">
            {component.imports.map((imp, idx) => (
              <li key={idx} className="text-xs">
                <span className="font-mono text-gray-700">{imp.source}</span>
                {imp.isReactComponent && (
                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-1 rounded">
                    Component
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
