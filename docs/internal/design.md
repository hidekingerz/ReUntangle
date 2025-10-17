# ReUntangle - 詳細設計書

## 概要
本ドキュメントは、ReUntangleの各モジュールの詳細設計を記述します。

---

## モジュール構成

### 1. Parser Module（解析モジュール）

#### 1.1 FileScanner

**責務**: ローカルフォルダをスキャンし、対象ファイルを収集

**主要メソッド**:

```typescript
interface Warning {
  id: string;
  type: WarningType;
  severity: 'high' | 'medium' | 'low';
  componentIds: string[];
  message: string;
  suggestion: string;
}

type WarningType = 
  | 'circular-dependency'
  | 'unused-component'
  | 'deep-dependency'
  | 'high-coupling'
  | 'high-complexity';
```

**警告検出ルール**:

```typescript
// 循環依存
if (cycle.length > 0) {
  // 重要度判定
  let severity: 'high' | 'medium' | 'low';
  if (cycle.length <= 3) {
    severity = 'high';
  } else if (cycle.length <= 6) {
    severity = 'medium';
  } else {
    severity = 'low';
  }
  
  warnings.push({
    type: 'circular-dependency',
    severity: severity,
    message: `循環依存が検出されました: ${cycle.join(' → ')}`,
    suggestion: '共通ロジックを別モジュールに抽出してください'
  });
}

// 未使用コンポーネント
if (node.dependents.length === 0 && !isRootComponent(node)) {
  warnings.push({
    type: 'unused-component',
    severity: 'medium',
    message: `${node.component.name}は使用されていません`,
    suggestion: '不要であれば削除を検討してください'
  });
}

// 深い依存
if (node.depth >= 5) {
  let severity: 'high' | 'medium';
  if (node.depth >= 8) {
    severity = 'high';
  } else {
    severity = 'medium';
  }
  
  warnings.push({
    type: 'deep-dependency',
    severity: severity,
    message: `${node.component.name}の依存が深すぎます（深さ: ${node.depth}）`,
    suggestion: 'コンポーネント構造を平坦化してください'
  });
}

// 高結合度
if (node.dependents.length >= 10) {
  let severity: 'high' | 'medium';
  if (node.dependents.length >= 16) {
    severity = 'high';
  } else {
    severity = 'medium';
  }
  
  warnings.push({
    type: 'high-coupling',
    severity: severity,
    message: `${node.component.name}への依存が多すぎます（${node.dependents.length}箇所）`,
    suggestion: '責任を分割してください'
  });
}
```

---

### 4. UI Components（UIコンポーネント）

#### 4.1 FolderSelector

**責務**: フォルダ選択UIを提供

**Props**:
```typescript
type FolderSelectorProps = {
  onFolderSelected: (handle: FileSystemDirectoryHandle) => void;
  onError: (error: Error) => void;
}
```

**実装**:
```typescript
const FolderSelector: React.FC<FolderSelectorProps> = ({
  onFolderSelected,
  onError
}) => {
  const handleSelectFolder = async () => {
    try {
      // File System Access API
      const dirHandle = await window.showDirectoryPicker({
        mode: 'read'
      });
      
      onFolderSelected(dirHandle);
    } catch (error) {
      if (error.name !== 'AbortError') {
        onError(error);
      }
    }
  };
  
  return (
    <button
      onClick={handleSelectFolder}
      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
    >
      フォルダを選択
    </button>
  );
};
```

---

#### 4.2 GraphView

**責務**: React Flowを使用してグラフを表示

**Props**:
```typescript
type GraphViewProps = {
  nodes: Node[];
  edges: Edge[];
  onNodeClick: (node: Node) => void;
  onNodeDragStop: (event: any, node: Node) => void;
  layoutType: LayoutType;
}
```

**実装**:
```typescript
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState
} from 'reactflow';

const GraphView: React.FC<GraphViewProps> = ({
  nodes: initialNodes,
  edges: initialEdges,
  onNodeClick,
  onNodeDragStop,
  layoutType
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // レイアウト変更時
  useEffect(() => {
    const layoutedNodes = applyLayout(nodes, edges, layoutType);
    setNodes(layoutedNodes);
  }, [layoutType]);
  
  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(event, node) => onNodeClick(node)}
        onNodeDragStop={onNodeDragStop}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};
```

---

#### 4.3 ComponentDetail

**責務**: 選択されたコンポーネントの詳細情報を表示

**Props**:
```typescript
type ComponentDetailProps = {
  component: ComponentInfo | null;
  metrics: ComponentMetrics | null;
  warnings: Warning[];
  onClose: () => void;
}
```

**実装**:
```typescript
const ComponentDetail: React.FC<ComponentDetailProps> = ({
  component,
  metrics,
  warnings,
  onClose
}) => {
  if (!component) return null;
  
  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-lg overflow-y-auto">
      {/* ヘッダー */}
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold">{component.name}</h2>
        <button onClick={onClose} className="absolute top-4 right-4">
          ✕
        </button>
      </div>
      
      {/* 基本情報 */}
      <section className="p-4 border-b">
        <h3 className="font-semibold mb-2">基本情報</h3>
        <div className="space-y-1 text-sm">
          <p>パス: {component.filePath}</p>
          <p>行数: {component.loc}</p>
          <p>タイプ: {component.type}</p>
        </div>
      </section>
      
      {/* メトリクス */}
      <section className="p-4 border-b">
        <h3 className="font-semibold mb-2">メトリクス</h3>
        <div className="space-y-2">
          <MetricBar 
            label="複雑度" 
            value={metrics?.complexity ?? 0} 
            max={100}
          />
          <p className="text-sm">依存: {metrics?.dependencyCount}</p>
          <p className="text-sm">被依存: {metrics?.dependentCount}</p>
          <p className="text-sm">深さ: {metrics?.depth}</p>
        </div>
      </section>
      
      {/* 依存関係 */}
      <section className="p-4 border-b">
        <h3 className="font-semibold mb-2">依存しているコンポーネント</h3>
        <ul className="space-y-1 text-sm">
          {component.imports
            .filter(imp => imp.isReactComponent && !imp.isExternal)
            .map((imp, i) => (
              <li key={i}>{imp.source}</li>
            ))
          }
        </ul>
      </section>
      
      {/* 外部ライブラリ */}
      {metrics && metrics.externalLibraries.length > 0 && (
        <section className="p-4 border-b">
          <h3 className="font-semibold mb-2">外部ライブラリ</h3>
          <ul className="space-y-1 text-sm">
            {metrics.externalLibraries.map((lib, i) => (
              <li key={i} className="text-purple-600">{lib}</li>
            ))}
          </ul>
        </section>
      )}
      
      {/* 警告 */}
      {warnings.length > 0 && (
        <section className="p-4">
          <h3 className="font-semibold mb-2">警告</h3>
          <ul className="space-y-2">
            {warnings.map((warning, i) => (
              <WarningCard key={i} warning={warning} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
```

---

#### 4.4 AnalysisPanel

**責務**: プロジェクト全体の分析結果を表示

**Props**:
```typescript
type AnalysisPanelProps = {
  totalComponents: number;
  averageComplexity: number;
  warnings: Warning[];
  topComplexComponents: Array<{
    name: string;
    complexity: number;
  }>;
}
```

**実装**:
```typescript
const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  totalComponents,
  averageComplexity,
  warnings,
  topComplexComponents
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* サマリー */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard
          label="総コンポーネント数"
          value={totalComponents}
        />
        <StatCard
          label="平均複雑度"
          value={averageComplexity.toFixed(1)}
        />
        <StatCard
          label="警告数"
          value={warnings.length}
          variant={warnings.length > 0 ? 'warning' : 'normal'}
        />
      </div>
      
      {/* 複雑なコンポーネントTOP 10 */}
      <section className="mb-6">
        <h3 className="font-semibold mb-3">最も複雑なコンポーネント</h3>
        <div className="space-y-2">
          {topComplexComponents.map((comp, i) => (
            <div key={i} className="flex justify-between items-center">
              <span className="text-sm">{comp.name}</span>
              <span className="text-sm font-semibold">{comp.complexity}</span>
            </div>
          ))}
        </div>
      </section>
      
      {/* 警告一覧 */}
      {warnings.length > 0 && (
        <section>
          <h3 className="font-semibold mb-3">警告一覧</h3>
          <div className="space-y-2">
            {warnings.map((warning, i) => (
              <WarningCard key={i} warning={warning} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
```

---

### 5. Custom Hooks

#### 5.1 useFileSystem

**責務**: File System Access APIの操作を抽象化

**実装**:
```typescript
type UseFileSystemReturn = {
  selectFolder: () => Promise<FileSystemDirectoryHandle | null>;
  scanFolder: (handle: FileSystemDirectoryHandle) => Promise<FileInfo[]>;
  readFile: (handle: FileSystemFileHandle) => Promise<string>;
  isLoading: boolean;
  error: Error | null;
}

function useFileSystem(): UseFileSystemReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const selectFolder = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const handle = await window.showDirectoryPicker({
        mode: 'read'
      });
      
      return handle;
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err);
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  const scanFolder = async (handle: FileSystemDirectoryHandle) => {
    const files: FileInfo[] = [];
    
    async function scan(dirHandle: FileSystemDirectoryHandle, path: string) {
      for await (const entry of dirHandle.values()) {
        const fullPath = `${path}/${entry.name}`;
        
        if (entry.kind === 'directory') {
          // 除外ディレクトリチェック
          if (!isExcludedDirectory(entry.name)) {
            await scan(entry, fullPath);
          }
        } else if (entry.kind === 'file') {
          // 対象ファイルチェック
          if (isTargetFile(entry.name)) {
            files.push({
              path: fullPath,
              name: entry.name,
              handle: entry
            });
          }
        }
      }
    }
    
    await scan(handle, '');
    return files;
  };
  
  const readFile = async (handle: FileSystemFileHandle) => {
    const file = await handle.getFile();
    return await file.text();
  };
  
  return {
    selectFolder,
    scanFolder,
    readFile,
    isLoading,
    error
  };
}
```

---

#### 5.2 useParser

**責務**: コンポーネント解析処理を管理

**実装**:
```typescript
type UseParserReturn = {
  parseProject: (files: FileInfo[]) => Promise<ParseResult>;
  isAnalyzing: boolean;
  progress: number;
  error: Error | null;
}

type ParseResult = {
  components: ComponentInfo[];
  dependencyGraph: DependencyGraph;
  warnings: Warning[];
}

function useParser(): UseParserReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  
  const parseProject = async (files: FileInfo[]): Promise<ParseResult> => {
    try {
      setIsAnalyzing(true);
      setError(null);
      setProgress(0);
      
      const parser = new ComponentParser();
      const components: ComponentInfo[] = [];
      
      // 並列解析
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
          const componentInfo = await parser.parseFile(file);
          if (componentInfo) {
            components.push(componentInfo);
          }
        } catch (err) {
          console.warn(`Failed to parse ${file.path}:`, err);
        }
        
        setProgress(((i + 1) / files.length) * 100);
      }
      
      // 依存関係解析
      const analyzer = new DependencyAnalyzer();
      const dependencyGraph = analyzer.analyzeDependencies(components);
      
      // 警告検出
      const detector = new WarningDetector();
      const metricsCalc = new MetricsCalculator();
      const metrics = new Map(
        components.map(c => [c.filePath, metricsCalc.calculateMetrics(c)])
      );
      const warnings = detector.detectWarnings(dependencyGraph, metrics);
      
      return {
        components,
        dependencyGraph,
        warnings
      };
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  return {
    parseProject,
    isAnalyzing,
    progress,
    error
  };
}
```

---

#### 5.3 useGraph

**責務**: グラフ操作と状態管理

**実装**:
```typescript
type UseGraphReturn = {
  nodes: Node[];
  edges: Edge[];
  selectedNode: Node | null;
  layoutType: LayoutType;
  setLayoutType: (layout: LayoutType) => void;
  setSelectedNode: (node: Node | null) => void;
  searchNodes: (query: string) => Node[];
  filterByComplexity: (min: number, max: number) => void;
  resetFilters: () => void;
}

function useGraph(
  dependencyGraph: DependencyGraph,
  metrics: Map<string, ComponentMetrics>
): UseGraphReturn {
  const [layoutType, setLayoutType] = useState<LayoutType>('tree');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [filteredNodeIds, setFilteredNodeIds] = useState<Set<string> | null>(null);
  
  // グラフ構築
  const graphBuilder = useMemo(() => new GraphBuilder(), []);
  const { nodes: allNodes, edges: allEdges } = useMemo(() => {
    return graphBuilder.buildReactFlowGraph(dependencyGraph, layoutType);
  }, [dependencyGraph, layoutType]);
  
  // フィルタ適用
  const nodes = useMemo(() => {
    if (!filteredNodeIds) return allNodes;
    return allNodes.filter(n => filteredNodeIds.has(n.id));
  }, [allNodes, filteredNodeIds]);
  
  const edges = useMemo(() => {
    if (!filteredNodeIds) return allEdges;
    return allEdges.filter(e => 
      filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)
    );
  }, [allEdges, filteredNodeIds]);
  
  // 検索
  const searchNodes = useCallback((query: string) => {
    if (!query) return allNodes;
    
    const lowerQuery = query.toLowerCase();
    return allNodes.filter(node =>
      node.data.label.toLowerCase().includes(lowerQuery) ||
      node.data.component.filePath.toLowerCase().includes(lowerQuery)
    );
  }, [allNodes]);
  
  // 複雑度フィルタ
  const filterByComplexity = useCallback((min: number, max: number) => {
    const filtered = new Set(
      allNodes
        .filter(node => {
          const complexity = metrics.get(node.id)?.complexity ?? 0;
          return complexity >= min && complexity <= max;
        })
        .map(n => n.id)
    );
    setFilteredNodeIds(filtered);
  }, [allNodes, metrics]);
  
  // フィルタリセット
  const resetFilters = useCallback(() => {
    setFilteredNodeIds(null);
  }, []);
  
  return {
    nodes,
    edges,
    selectedNode,
    layoutType,
    setLayoutType,
    setSelectedNode,
    searchNodes,
    filterByComplexity,
    resetFilters
  };
}
```

---

## データ永続化

### LocalStorage利用

**保存データ**:
```typescript
type StoredSettings = {
  lastProjectPath?: string;     // 最後に開いたプロジェクトパス
  layoutType: LayoutType;        // レイアウト設定
  filterSettings: FilterSettings; // フィルタ設定
  theme?: 'light' | 'dark';      // テーマ（将来）
}

// 保存
localStorage.setItem('reuntangle-settings', JSON.stringify(settings));

// 読み込み
const settings = JSON.parse(
  localStorage.getItem('reuntangle-settings') || '{}'
);
```

**注意事項**:
- ファイル内容は保存しない
- プロジェクトパスのみ保存（次回アクセス時の参考情報）
- 5MB制限に注意

---

## エラーハンドリング戦略

### エラー境界

```typescript
class ErrorBoundary extends React.Component<Props, State> {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // エラーログ記録（将来的に分析用）
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          resetError={() => this.setState({ hasError: false })}
        />
      );
    }
    
    return this.props.children;
  }
}
```

### Try-Catchパターン

```typescript
// 個別ファイル解析エラー
try {
  const component = await parseFile(file);
} catch (error) {
  console.warn(`Skipping ${file.path}:`, error.message);
  // 処理継続
}

// 致命的エラー
try {
  const result = await parseProject(files);
} catch (error) {
  setError(error);
  // ユーザーに通知
}
```

---

## パフォーマンス最適化

### メモ化

```typescript
// 高コストな計算
const complexMetrics = useMemo(() => {
  return calculateComplexMetrics(components);
}, [components]);

// コンポーネントメモ化
const MemoizedNode = React.memo(NodeComponent, (prev, next) => {
  return prev.data.id === next.data.id &&
         prev.selected === next.selected;
});
```

### デバウンス

```typescript
// 検索入力
const debouncedSearch = useMemo(
  () => debounce((query: string) => {
    setSearchResults(searchNodes(query));
  }, 300),
  [searchNodes]
);
```

### 仮想化（将来対応）

```typescript
// 大量ノードの場合
import { useVirtualizer } from '@tanstack/react-virtual';

// 表示領域のノードのみレンダリング
```

---

## テスト戦略

### ユニットテスト

```typescript
describe('ComponentParser', () => {
  it('should parse function component', () => {
    const code = `
      function MyComponent() {
        return <div>Hello</div>;
      }
    `;
    
    const parser = new ComponentParser();
    const result = parser.parseCode(code);
    
    expect(result.name).toBe('MyComponent');
    expect(result.type).toBe('function');
  });
});
```

### 統合テスト

```typescript
describe('Full analysis flow', () => {
  it('should analyze sample project', async () => {
    const files = await loadSampleProject();
    const parser = new ComponentParser();
    const analyzer = new DependencyAnalyzer();
    
    const components = await parser.parseFiles(files);
    const graph = analyzer.analyzeDependencies(components);
    
    expect(graph.nodes.size).toBeGreaterThan(0);
    expect(graph.edges.length).toBeGreaterThan(0);
  });
});
```

---

**作成日**: 2025年10月17日  
**バージョン**: 1.0 FileScanner {
  // フォルダを選択してスキャン開始
  selectFolder(): Promise<FolderHandle>;
  
  // 再帰的にファイルを収集
  scanDirectory(
    dirHandle: DirectoryHandle,
    basePath: string
  ): Promise<FileInfo[]>;
  
  // ファイルが対象かどうか判定
  isTargetFile(fileName: string): boolean;
  
  // 除外ディレクトリかどうか判定
  isExcludedDirectory(dirName: string): boolean;
}

interface FileInfo {
  path: string;        // ファイルパス
  name: string;        // ファイル名
  handle: FileHandle;  // ファイルハンドル
  content?: string;    // ファイル内容（遅延ロード）
}
```

**対象ファイル拡張子**:
- `.jsx`
- `.tsx`
- `.js`
- `.ts`

**除外ディレクトリ**:
- `node_modules`
- `.git`
- `dist`
- `build`
- `.next`
- `coverage`

**エラーハンドリング**:
- 権限エラー: ユーザーに通知、スキップ
- ファイル読み込みエラー: ログ記録、スキップ

---

#### 1.2 ComponentParser

**責務**: ファイルを解析してコンポーネント情報を抽出

**主要メソッド**:

```typescript
type ComponentParser = {
  // ファイルを解析
  parseFile(fileInfo: FileInfo): Promise<ComponentInfo>;
  
  // ASTを生成
  generateAST(code: string): ParseResult;
  
  // コンポーネントを特定
  identifyComponents(ast: File): ComponentDefinition[];
  
  // import文を抽出
  extractImports(ast: File): ImportStatement[];
}

type ComponentInfo = {
  name: string;                    // コンポーネント名
  filePath: string;                // ファイルパス
  type: 'function' | 'class';      // コンポーネントタイプ
  exports: ExportInfo;             // export情報
  imports: ImportStatement[];      // import一覧
  hooks: string[];                 // 使用しているHooks
  props?: PropDefinition[];        // Props定義（TypeScriptのみ）
  loc: number;                     // コード行数
}

type ImportStatement = {
  source: string;            // importソース
  specifiers: string[];      // import対象
  isReactComponent: boolean; // Reactコンポーネントか
  isExternal: boolean;       // 外部ライブラリか
  resolvedPath?: string;     // 解決後の絶対パス（内部のみ）
}
```

**解析アルゴリズム**:

1. **AST生成**:
```typescript
import { parse } from '@babel/parser';

const ast = parse(code, {
  sourceType: 'module',
  plugins: ['jsx', 'typescript', 'decorators-legacy']
});
```

2. **コンポーネント特定**:
```typescript
// 関数コンポーネント
function MyComponent() { return <div />; }
const MyComponent = () => <div />;

// クラスコンポーネント
class MyComponent extends React.Component {}
```

3. **Hooks検出**:
```typescript
// useで始まる関数呼び出しを検出
const hooks = [
  'useState',
  'useEffect',
  'useContext',
  'useReducer',
  'useCallback',
  'useMemo',
  'useRef',
  // カスタムHooksも含む
];
```

---

#### 1.3 DependencyAnalyzer

**責務**: コンポーネント間の依存関係を解析

**主要メソッド**:

```typescript
type DependencyAnalyzer = {
  // 依存関係を解析
  analyzeDependencies(
    components: ComponentInfo[]
  ): DependencyGraph;
  
  // パスを解決
  resolvePath(
    importPath: string,
    currentFilePath: string,
    projectRoot: string
  ): string;
  
  // 循環依存を検出
  detectCircularDependencies(
    graph: DependencyGraph
  ): CircularDependency[];
  
  // 依存の深さを計算
  calculateDepth(
    graph: DependencyGraph,
    rootNodes: string[]
  ): Map<string, number>;
}

type DependencyGraph = {
  nodes: Map<string, GraphNode>;  // コンポーネントID -> ノード
  edges: GraphEdge[];             // 依存関係
}

type GraphNode = {
  id: string;              // 一意なID
  component: ComponentInfo;
  dependencies: string[];  // 依存先ID
  dependents: string[];    // 依存元ID
  depth: number;           // 依存の深さ
}

type GraphEdge = {
  from: string;     // 依存元ID
  to: string;       // 依存先ID
  strength: number; // 依存の強さ（使用回数）
}

type CircularDependency = {
  cycle: string[];  // 循環パス
  severity: 'high' | 'medium' | 'low';
}
```

**パス解決アルゴリズム**:

```typescript
// 相対パス（内部コンポーネント）
'./Button' → '/src/components/Button.tsx'
'../utils/helper' → '/src/utils/helper.ts'

// エイリアス（tsconfig.json/jsconfig.jsonから読み込み）
'@/components/Button' → '/src/components/Button.tsx'

// 外部ライブラリ（解決しない、isExternal=trueとしてマーク）
'@mui/material' → null (外部ライブラリ)
'react' → null (外部ライブラリ)
'antd' → null (外部ライブラリ)
```

**外部ライブラリの判定**:
```typescript
function isExternalImport(importPath: string): boolean {
  // @で始まるスコープパッケージ（@mui/materialなど）
  // または相対パスでない（reactなど）
  return !importPath.startsWith('.') && !importPath.startsWith('/');
}
```

**循環依存検出**:
- DFS（深さ優先探索）で実装
- 訪問済みノードスタックで循環を検出

---

### 2. Graph Module（グラフモジュール）

#### 2.1 GraphBuilder

**責務**: 依存関係グラフをReact Flow形式に変換

**主要メソッド**:

```typescript
type GraphBuilder = {
  // React Flowノード/エッジを生成
  buildReactFlowGraph(
    dependencyGraph: DependencyGraph,
    layout: LayoutType
  ): ReactFlowGraph;
  
  // ノードの視覚属性を計算
  calculateNodeVisuals(
    node: GraphNode,
    metrics: ComponentMetrics
  ): NodeVisuals;
  
  // エッジの視覚属性を計算
  calculateEdgeVisuals(
    edge: GraphEdge
  ): EdgeVisuals;
}

type ReactFlowGraph = {
  nodes: Node[];  // React Flowノード
  edges: Edge[];  // React Flowエッジ
}

type Node = {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    component: ComponentInfo;
    metrics: ComponentMetrics;
  };
  style: NodeStyle;
}

type NodeStyle = {
  width: number;
  height: number;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
}

type Edge = {
  id: string;
  source: string;
  target: string;
  type: string;
  animated?: boolean;
  style: EdgeStyle;
}

type EdgeStyle = {
  strokeWidth: number;
  stroke: string;
}
```

**ノードサイズ計算**:
```typescript
// 複雑度に基づいてサイズを決定
const baseSize = 50;
const maxSize = 150;
const size = baseSize + (complexity / 100) * (maxSize - baseSize);
```

**ノード色計算**:
```typescript
const colors = {
  normal: '#3B82F6',      // 青
  warning: '#F59E0B',     // 黄
  error: '#EF4444',       // 赤
  unused: '#9CA3AF',      // グレー
  root: '#10B981'         // 緑
};
```

---

#### 2.2 LayoutEngine

**責務**: グラフレイアウトの計算

**主要メソッド**:

```typescript
type LayoutEngine = {
  // レイアウトを適用
  applyLayout(
    nodes: Node[],
    edges: Edge[],
    layoutType: LayoutType
  ): Node[];
}

type LayoutType = 'tree' | 'force';
```

**ツリーレイアウト**:
```typescript
// 階層的レイアウト
// ルートノードを上に配置
// 子ノードを下に配置
// 同レベルのノードを左右に配置

const LEVEL_HEIGHT = 200;  // 階層間の垂直距離
const NODE_SPACING = 150;  // ノード間の水平距離

function calculateTreeLayout(nodes: Node[], edges: Edge[]): Node[] {
  const levels = groupByDepth(nodes, edges);
  
  levels.forEach((levelNodes, depth) => {
    const y = depth * LEVEL_HEIGHT;
    const totalWidth = levelNodes.length * NODE_SPACING;
    
    levelNodes.forEach((node, index) => {
      node.position = {
        x: index * NODE_SPACING - totalWidth / 2,
        y: y
      };
    });
  });
  
  return nodes;
}
```

**力学的レイアウト**:
```typescript
// D3.jsのforce simulationを使用
import { forceSimulation, forceLink, forceManyBody, forceCenter } from 'd3-force';

function calculateForceLayout(nodes: Node[], edges: Edge[]): Node[] {
  const simulation = forceSimulation(nodes)
    .force('link', forceLink(edges).distance(100))
    .force('charge', forceManyBody().strength(-300))
    .force('center', forceCenter(0, 0));
  
  // シミュレーションを実行
  for (let i = 0; i < 300; i++) {
    simulation.tick();
  }
  
  return nodes;
}
```

---

### 3. Analysis Module（分析モジュール）

#### 3.1 MetricsCalculator

**責務**: コンポーネントのメトリクスを計算

**主要メソッド**:

```typescript
type MetricsCalculator = {
  // 複雑度を計算
  calculateComplexity(component: ComponentInfo): number;
  
  // 各要素のスコアを計算
  calculateLocScore(loc: number): number;
  calculateDependencyScore(depCount: number): number;
  calculateHooksScore(hooks: string[]): number;
  calculatePropsScore(props: PropDefinition[]): number;
}

type ComponentMetrics = {
  complexity: number;           // 複雑度スコア（0-100）
  loc: number;                  // コード行数
  dependencyCount: number;      // 依存コンポーネント数（内部のみ）
  dependentCount: number;       // 被依存コンポーネント数
  hooksCount: number;           // Hooks数
  propsCount: number;           // Props数
  depth: number;                // 依存の深さ
  externalDependencyCount: number; // 外部ライブラリ依存数
  externalLibraries: string[];     // 使用している外部ライブラリ一覧
  cyclomaticComplexity?: number; // 循環的複雑度（将来）
}
```

**複雑度計算アルゴリズム**:

```typescript
function calculateComplexity(component: ComponentInfo): number {
  const weights = {
    loc: 0.25,
    dependencies: 0.20,
    dependents: 0.15,
    hooks: 0.15,
    props: 0.15,
    conditionals: 0.10
  };
  
  // 各スコアを計算（0-100に正規化）
  const locScore = normalizeScore(component.loc, 0, 500);
  const depScore = normalizeScore(component.dependencies.length, 0, 20);
  const deptScore = normalizeScore(component.dependents.length, 0, 20);
  const hooksScore = normalizeScore(component.hooks.length, 0, 10);
  const propsScore = normalizeScore(component.props?.length ?? 0, 0, 15);
  
  // 重み付き平均
  const complexity = 
    locScore * weights.loc +
    depScore * weights.dependencies +
    deptScore * weights.dependents +
    hooksScore * weights.hooks +
    propsScore * weights.props;
  
  return Math.round(complexity);
}

function normalizeScore(value: number, min: number, max: number): number {
  return Math.min(100, (value / max) * 100);
}
```

---

#### 3.2 WarningDetector

**責務**: 問題のあるパターンを検出

**主要メソッド**:

```typescript
interface WarningDetector {
  // すべての警告を検出
  detectWarnings(
    graph: DependencyGraph,
    metrics: Map<string, ComponentMetrics>
  ): Warning[];
  
  // 各種警告検出メソッド
  detectCircularDependencies(graph: DependencyGraph): Warning[];
  detectUnusedComponents(graph: DependencyGraph): Warning[];
  detectDeepDependencies(graph: DependencyGraph): Warning[];
  detectHighCoupling(graph: DependencyGraph): Warning[];
}

interface