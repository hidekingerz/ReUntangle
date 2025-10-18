// Core types for ReUntangle

/**
 * Represents a file that has been scanned
 */
export type FileInfo = {
  path: string;
  name: string;
  extension: string;
  content: string;
};

/**
 * Represents a React component or custom hook found in the code
 */
export type ComponentInfo = {
  id: string;
  name: string;
  filePath: string;
  type: 'function' | 'class' | 'arrow' | 'hook';
  dependencies: string[]; // Component names this component depends on
  imports: ImportInfo[];
  complexity: number;
  linesOfCode: number;
  hooks: HookUsage[];
  propsCount: number;
  propsInfo?: PropsInfo; // TypeScript only
};

/**
 * Represents a React Hook usage
 */
export type HookUsage = {
  name: string;
  count: number;
};

/**
 * Represents Props information (TypeScript)
 */
export type PropsInfo = {
  name: string; // Type name
  properties: PropProperty[];
};

/**
 * Represents a single prop property
 */
export type PropProperty = {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
};

/**
 * Represents an import statement
 */
export type ImportInfo = {
  source: string; // The module being imported from
  specifiers: string[]; // What's being imported
  isReactComponent: boolean;
};

/**
 * Represents a node in the dependency graph
 */
export type DependencyNode = {
  id: string;
  component: ComponentInfo;
  dependencies: string[]; // IDs of components this depends on
  dependents: string[]; // IDs of components that depend on this
  depth: number;
  complexity: number;
};

/**
 * Represents the complete dependency graph
 */
export type DependencyGraph = {
  nodes: Map<string, DependencyNode>;
  edges: DependencyEdge[];
};

/**
 * Represents an edge in the dependency graph
 */
export type DependencyEdge = {
  from: string; // Component ID
  to: string; // Component ID
  strength: number; // How many times this dependency is used
};

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
export type Warning = {
  id: string;
  type: WarningType;
  severity: 'high' | 'medium' | 'low';
  componentIds: string[];
  message: string;
  suggestion: string;
};

/**
 * Analysis results
 */
export type AnalysisResult = {
  graph: DependencyGraph;
  warnings: Warning[];
  metrics: {
    totalComponents: number;
    averageComplexity: number;
    maxDepth: number;
    circularDependencies: number;
    unusedComponents: number;
  };
};

/**
 * React Flow compatible node data
 */
export type FlowNodeData = {
  label: string;
  componentInfo: ComponentInfo;
  complexity: number;
  dependencyCount: number;
  dependentCount: number;
} & Record<string, unknown>;

/**
 * Project metrics for dashboard
 */
export type ProjectMetrics = {
  totalComponents: number;
  totalHooks: number;
  averageComplexity: number;
  maxComplexity: number;
  minComplexity: number;
  circularDependencies: number;
  topComplexComponents: Array<{
    name: string;
    filePath: string;
    complexity: number;
  }>;
  mostDependedOn: Array<{
    name: string;
    filePath: string;
    dependentCount: number;
  }>;
  complexityDistribution: {
    simple: number; // 0-30
    standard: number; // 31-60
    complex: number; // 61-80
    veryComplex: number; // 81-100
  };
};

/**
 * Search and filter options
 */
export type SearchOptions = {
  query: string;
  searchIn: 'name' | 'path' | 'both';
  useRegex: boolean;
};

export type FilterOptions = {
  complexityRange: {
    min: number;
    max: number;
  };
  depthRange: {
    min: number;
    max: number;
  };
  componentTypes: Array<'function' | 'class' | 'arrow' | 'hook'>;
  fileExtensions: Array<'.tsx' | '.jsx' | '.ts' | '.js'>;
  showUnused: boolean;
  showCircular: boolean;
};

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
