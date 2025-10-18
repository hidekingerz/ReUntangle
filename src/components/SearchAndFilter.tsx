'use client';

import { useState } from 'react';
import type { SearchOptions, FilterOptions } from '@/types';

type SearchAndFilterProps = {
  searchOptions: SearchOptions;
  filterOptions: FilterOptions;
  onSearchChange: (options: SearchOptions) => void;
  onFilterChange: (options: FilterOptions) => void;
  stats: {
    total: number;
    filtered: number;
    hidden: number;
  };
  maxComplexity: number;
  maxDepth: number;
};

export default function SearchAndFilter({
  searchOptions,
  filterOptions,
  onSearchChange,
  onFilterChange,
  stats,
  maxComplexity,
  maxDepth,
}: SearchAndFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      {/* Search Bar - Always Visible */}
      <div className="px-6 py-3">
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchOptions.query}
              onChange={(e) =>
                onSearchChange({ ...searchOptions, query: e.target.value })
              }
              placeholder="Search components by name or path..."
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Search Options */}
          <div className="flex gap-2">
            <select
              value={searchOptions.searchIn}
              onChange={(e) =>
                onSearchChange({
                  ...searchOptions,
                  searchIn: e.target.value as 'name' | 'path' | 'both',
                })
              }
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="both">Name & Path</option>
              <option value="name">Name Only</option>
              <option value="path">Path Only</option>
            </select>

            <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={searchOptions.useRegex}
                onChange={(e) =>
                  onSearchChange({ ...searchOptions, useRegex: e.target.checked })
                }
                className="rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Regex</span>
            </label>
          </div>

          {/* Toggle Filters Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isExpanded
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {isExpanded ? '▲ Hide Filters' : '▼ Show Filters'}
          </button>

          {/* Stats */}
          <div className="text-sm text-gray-600 px-3 py-2 bg-gray-100 rounded-lg">
            <span className="font-semibold">{stats.filtered}</span> / {stats.total}
            {stats.hidden > 0 && (
              <span className="text-gray-500 ml-1">({stats.hidden} hidden)</span>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Filters - Expandable */}
      {isExpanded && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Complexity Range */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Complexity Range
              </label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max={maxComplexity}
                    value={filterOptions.complexityRange.min}
                    onChange={(e) =>
                      onFilterChange({
                        ...filterOptions,
                        complexityRange: {
                          ...filterOptions.complexityRange,
                          min: Number(e.target.value),
                        },
                      })
                    }
                    className="flex-1"
                  />
                  <span className="text-sm font-medium text-gray-700 w-10 text-right">
                    {filterOptions.complexityRange.min}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max={maxComplexity}
                    value={filterOptions.complexityRange.max}
                    onChange={(e) =>
                      onFilterChange({
                        ...filterOptions,
                        complexityRange: {
                          ...filterOptions.complexityRange,
                          max: Number(e.target.value),
                        },
                      })
                    }
                    className="flex-1"
                  />
                  <span className="text-sm font-medium text-gray-700 w-10 text-right">
                    {filterOptions.complexityRange.max}
                  </span>
                </div>
              </div>
            </div>

            {/* Component Types */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Component Types
              </label>
              <div className="space-y-2">
                {(['function', 'class', 'arrow', 'hook'] as const).map((type) => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterOptions.componentTypes.includes(type)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          // Add type
                          onFilterChange({
                            ...filterOptions,
                            componentTypes: [...filterOptions.componentTypes, type],
                          });
                        } else {
                          // Remove type
                          onFilterChange({
                            ...filterOptions,
                            componentTypes: filterOptions.componentTypes.filter(
                              (t) => t !== type
                            ),
                          });
                        }
                      }}
                      className="rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* File Extensions */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                File Extensions
              </label>
              <div className="space-y-2">
                {(['.tsx', '.jsx', '.ts', '.js'] as const).map((ext) => (
                  <label key={ext} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterOptions.fileExtensions.includes(ext)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          // Add extension
                          onFilterChange({
                            ...filterOptions,
                            fileExtensions: [...filterOptions.fileExtensions, ext],
                          });
                        } else {
                          // Remove extension
                          onFilterChange({
                            ...filterOptions,
                            fileExtensions: filterOptions.fileExtensions.filter(
                              (e) => e !== ext
                            ),
                          });
                        }
                      }}
                      className="rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 font-mono">{ext}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Display Options */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Display Options
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterOptions.showUnused}
                    onChange={(e) =>
                      onFilterChange({ ...filterOptions, showUnused: e.target.checked })
                    }
                    className="rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Show Unused Components</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterOptions.showCircular}
                    onChange={(e) =>
                      onFilterChange({ ...filterOptions, showCircular: e.target.checked })
                    }
                    className="rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Show Circular Dependencies
                  </span>
                </label>
              </div>
            </div>

            {/* Reset Filters */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  onSearchChange({ query: '', searchIn: 'both', useRegex: false });
                  onFilterChange({
                    complexityRange: { min: 0, max: maxComplexity },
                    depthRange: { min: 0, max: maxDepth },
                    componentTypes: [],
                    fileExtensions: [],
                    showUnused: true,
                    showCircular: true,
                  });
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium
                         hover:bg-gray-700 transition-colors w-full"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
