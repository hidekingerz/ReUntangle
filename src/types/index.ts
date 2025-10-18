// Core types for ReUntangle

/**
 * Represents a file that has been scanned
 */
export interface FileInfo {
  path: string;
  name: string;
  extension: string;
  content: string;
}

/**
 * Represents a React component found in the code
 */
export interface ComponentInfo {
  id: string;
  name: string;
  filePath: string;
  type: 'function' | 'class' | 'arrow';
  dependencies: string[]; // Component names this component depends on
  imports: ImportInfo[];
  complexity: number;
}

/**
 * Represents an import statement
 */
export interface ImportInfo {
  source: string; // The module being imported from
  specifiers: string[]; // What's being imported
  isReactComponent: boolean;
}

/**
 * Represents a node in the dependency graph
 */
export interface DependencyNode {
  id: string;
  component: ComponentInfo;
  dependencies: string[]; // IDs of components this depends on
  dependents: string[]; // IDs of components that depend on this
  depth: number;
  complexity: number;
}

/**
 * Represents the complete dependency graph
 */
export interface DependencyGraph {
  nodes: Map<string, DependencyNode>;
  edges: DependencyEdge[];
}

/**
 * Represents an edge in the dependency graph
 */
export interface DependencyEdge {
  from: string; // Component ID
  to: string; // Component ID
  strength: number; // How many times this dependency is used
}

/**
 * Graph layout types
 */
export type LayoutType = 'tree' | 'force';

/**
 * Warning types for analysis
 */
export type WarningType =
  | 'circular-dependency'
  | 'unused-component'
  | 'deep-dependency'
  | 'high-coupling'
  | 'high-complexity';

/**
 * Represents a warning from the analyzer
 */
export interface Warning {
  id: string;
  type: WarningType;
  severity: 'high' | 'medium' | 'low';
  componentIds: string[];
  message: string;
  suggestion: string;
}

/**
 * Analysis results
 */
export interface AnalysisResult {
  graph: DependencyGraph;
  warnings: Warning[];
  metrics: {
    totalComponents: number;
    averageComplexity: number;
    maxDepth: number;
    circularDependencies: number;
    unusedComponents: number;
  };
}

/**
 * React Flow compatible node data
 */
export interface FlowNodeData extends Record<string, unknown> {
  label: string;
  componentInfo: ComponentInfo;
  complexity: number;
  dependencyCount: number;
  dependentCount: number;
}

/**
 * File System Access API types
 */
declare global {
  interface Window {
    showDirectoryPicker(options?: {
      mode?: 'read' | 'readwrite';
    }): Promise<FileSystemDirectoryHandle>;
  }

  interface FileSystemDirectoryHandle {
    values(): AsyncIterableIterator<FileSystemHandle>;
  }
}
