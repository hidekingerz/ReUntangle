# ReUntangle - 内部API仕様

## 概要
本ドキュメントは、ReUntangle内部で使用されるAPIの仕様を定義します。

---

## 1. File System API

### 1.1 FileScanner

#### selectFolder()

フォルダ選択ダイアログを表示し、ユーザーにフォルダを選択させます。

**シグネチャ**:
```typescript
selectFolder(): Promise<FileSystemDirectoryHandle>
```

**返り値**:
- `FileSystemDirectoryHandle`: 選択されたディレクトリのハンドル

**例外**:
- `AbortError`: ユーザーがキャンセルした場合
- `SecurityError`: 権限がない場合

**使用例**:
```typescript
const scanner = new FileScanner();
try {
  const dirHandle = await scanner.selectFolder();
  console.log('Selected:', dirHandle.name);
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('User cancelled');
  } else {
    console.error('Error:', error);
  }
}
```

---

#### scanDirectory()

ディレクトリを再帰的にスキャンし、対象ファイルを収集します。

**シグネチャ**:
```typescript
scanDirectory(
  dirHandle: FileSystemDirectoryHandle,
  basePath?: string
): Promise<FileInfo[]>
```

**パラメータ**:
- `dirHandle`: スキャンするディレクトリのハンドル
- `basePath`: ベースパス（オプション、デフォルトは空文字列）

**返り値**:
- `FileInfo[]`: 検出されたファイル情報の配列

**使用例**:
```typescript
const scanner = new FileScanner();
const files = await scanner.scanDirectory(dirHandle);
console.log(`Found ${files.length} files`);
```

---

#### isTargetFile()

ファイルが解析対象かどうかを判定します。

**シグネチャ**:
```typescript
isTargetFile(fileName: string): boolean
```

**パラメータ**:
- `fileName`: ファイル名

**返り値**:
- `boolean`: 対象ファイルならtrue

**判定基準**:
- 拡張子が `.jsx`, `.tsx`, `.js`, `.ts` のいずれか

**使用例**:
```typescript
const scanner = new FileScanner();
console.log(scanner.isTargetFile('App.tsx')); // true
console.log(scanner.isTargetFile('style.css')); // false
```

---

#### isExcludedDirectory()

ディレクトリが除外対象かどうかを判定します。

**シグネチャ**:
```typescript
isExcludedDirectory(dirName: string): boolean
```

**パラメータ**:
- `dirName`: ディレクトリ名

**返り値**:
- `boolean`: 除外対象ならtrue

**除外ディレクトリ**:
- `node_modules`
- `.git`
- `dist`
- `build`
- `.next`
- `coverage`

**使用例**:
```typescript
const scanner = new FileScanner();
console.log(scanner.isExcludedDirectory('node_modules')); // true
console.log(scanner.isExcludedDirectory('src')); // false
```

---

## 2. Parser API

### 2.1 ComponentParser

#### parseFile()

ファイルを解析してコンポーネント情報を抽出します。

**シグネチャ**:
```typescript
parseFile(fileInfo: FileInfo): Promise<ComponentInfo | null>
```

**パラメータ**:
- `fileInfo`: ファイル情報

**返り値**:
- `ComponentInfo | null`: コンポーネント情報、Reactコンポーネントでない場合はnull

**例外**:
- `SyntaxError`: 構文エラーがある場合
- `ParseError`: パース失敗

**使用例**:
```typescript
const parser = new ComponentParser();
const componentInfo = await parser.parseFile(fileInfo);

if (componentInfo) {
  console.log('Component:', componentInfo.name);
  console.log('Imports:', componentInfo.imports);
}
```

---

#### generateAST()

コードからAST（抽象構文木）を生成します。

**シグネチャ**:
```typescript
generateAST(code: string): ParseResult<File>
```

**パラメータ**:
- `code`: ソースコード文字列

**返り値**:
- `ParseResult<File>`: Babel ASTオブジェクト

**パーサーオプション**:
```typescript
{
  sourceType: 'module',
  plugins: [
    'jsx',
    'typescript',
    'decorators-legacy',
    'classProperties',
    'objectRestSpread'
  ]
}
```

**使用例**:
```typescript
const parser = new ComponentParser();
const code = `
  function MyComponent() {
    return <div>Hello</div>;
  }
`;
const ast = parser.generateAST(code);
```

---

#### identifyComponents()

ASTからReactコンポーネントを特定します。

**シグネチャ**:
```typescript
identifyComponents(ast: File): ComponentDefinition[]
```

**パラメータ**:
- `ast`: Babel ASTオブジェクト

**返り値**:
- `ComponentDefinition[]`: 検出されたコンポーネント定義の配列

**検出パターン**:
```typescript
// 関数コンポーネント
function MyComponent() { return <div />; }
const MyComponent = () => <div />;
const MyComponent = function() { return <div />; };

// クラスコンポーネント
class MyComponent extends React.Component {}
class MyComponent extends Component {}
```

**使用例**:
```typescript
const parser = new ComponentParser();
const ast = parser.generateAST(code);
const components = parser.identifyComponents(ast);
console.log(`Found ${components.length} components`);
```

---

#### extractImports()

ASTからimport文を抽出します。

**シグネチャ**:
```typescript
extractImports(ast: File): ImportStatement[]
```

**パラメータ**:
- `ast`: Babel ASTオブジェクト

**返り値**:
- `ImportStatement[]`: import文情報の配列

**抽出パターン**:
```typescript
// 名前付きimport
import { Button, Input } from './components';

// デフォルトimport
import React from 'react';

// 名前空間import
import * as Utils from './utils';

// 副作用のみ
import './styles.css';
```

**使用例**:
```typescript
const parser = new ComponentParser();
const ast = parser.generateAST(code);
const imports = parser.extractImports(ast);

imports.forEach(imp => {
  console.log(`Import from: ${imp.source}`);
  console.log(`Specifiers: ${imp.specifiers.join(', ')}`);
});
```

---

### 2.2 DependencyAnalyzer

#### analyzeDependencies()

コンポーネント間の依存関係を解析します。

**シグネチャ**:
```typescript
analyzeDependencies(components: ComponentInfo[]): DependencyGraph
```

**パラメータ**:
- `components`: コンポーネント情報の配列

**返り値**:
- `DependencyGraph`: 依存関係グラフ

**処理内容**:
1. 各コンポーネントのimportパスを解決
2. コンポーネント間の依存関係を構築
3. 依存の深さを計算
4. 循環依存を検出

**使用例**:
```typescript
const analyzer = new DependencyAnalyzer();
const graph = analyzer.analyzeDependencies(components);

console.log(`Total nodes: ${graph.nodes.size}`);
console.log(`Total edges: ${graph.edges.length}`);
```

---

#### resolvePath()

importパスを絶対パスに解決します。

**シグネチャ**:
```typescript
resolvePath(
  importPath: string,
  currentFilePath: string,
  projectRoot: string
): string
```

**パラメータ**:
- `importPath`: import文のパス
- `currentFilePath`: 現在のファイルの絶対パス
- `projectRoot`: プロジェクトルートパス

**返り値**:
- `string`: 解決された絶対パス

**解決ルール**:
```typescript
// 相対パス（内部コンポーネント）
'./Button' → '/project/src/components/Button.tsx'
'../utils/helper' → '/project/src/utils/helper.ts'

// エイリアスパス（tsconfig/jsconfigから読み込み）
'@/components/Button' → '/project/src/components/Button.tsx'

// 外部ライブラリ（解決しない）
'react' → null
'@mui/material' → null
'antd' → null
```

**外部ライブラリの判定**:
```typescript
function isExternalImport(importPath: string): boolean {
  // 相対パスでも絶対パスでもない = 外部ライブラリ
  return !importPath.startsWith('.') && !importPath.startsWith('/');
}
```

**使用例**:
```typescript
const analyzer = new DependencyAnalyzer();
const resolved = analyzer.resolvePath(
  './Button',
  '/project/src/pages/Home.tsx',
  '/project'
);
console.log(resolved); // '/project/src/pages/Button.tsx'
```

---

#### detectCircularDependencies()

循環依存を検出します。

**シグネチャ**:
```typescript
detectCircularDependencies(graph: DependencyGraph): CircularDependency[]
```

**パラメータ**:
- `graph`: 依存関係グラフ

**返り値**:
- `CircularDependency[]`: 検出された循環依存の配列

**アルゴリズム**:
- DFS（深さ優先探索）を使用
- 訪問済みスタックで循環を検出

**使用例**:
```typescript
const analyzer = new DependencyAnalyzer();
const cycles = analyzer.detectCircularDependencies(graph);

cycles.forEach(cycle => {
  console.log(`Cycle: ${cycle.cycle.join(' → ')}`);
  console.log(`Severity: ${cycle.severity}`);
});
```

---

#### calculateDepth()

各ノードの依存の深さを計算します。

**シグネチャ**:
```typescript
calculateDepth(
  graph: DependencyGraph,
  rootNodes: string[]
): Map<string, number>
```

**パラメータ**:
- `graph`: 依存関係グラフ
- `rootNodes`: ルートノードのID配列

**返り値**:
- `Map<string, number>`: ノードID → 深さのマップ

**計算ルール**:
- ルートノード: 深さ 0
- 子ノード: 親の深さ + 1
- 複数の親がある場合: 最小の深さ

**使用例**:
```typescript
const analyzer = new DependencyAnalyzer();
const depthMap = analyzer.calculateDepth(graph, ['App']);

depthMap.forEach((depth, nodeId) => {
  console.log(`${nodeId}: depth ${depth}`);
});
```

---

## 3. Graph API

### 3.1 GraphBuilder

#### buildReactFlowGraph()

依存関係グラフをReact Flow形式に変換します。

**シグネチャ**:
```typescript
buildReactFlowGraph(
  dependencyGraph: DependencyGraph,
  layoutType: LayoutType
): ReactFlowGraph
```

**パラメータ**:
- `dependencyGraph`: 依存関係グラフ
- `layoutType`: レイアウトタイプ ('tree' | 'force')

**返り値**:
- `ReactFlowGraph`: React Flow用のノードとエッジ

**使用例**:
```typescript
const builder = new GraphBuilder();
const reactFlowGraph = builder.buildReactFlowGraph(
  dependencyGraph,
  'tree'
);

console.log(`Nodes: ${reactFlowGraph.nodes.length}`);
console.log(`Edges: ${reactFlowGraph.edges.length}`);
```

---

#### calculateNodeVisuals()

ノードの視覚属性を計算します。

**シグネチャ**:
```typescript
calculateNodeVisuals(
  node: GraphNode,
  metrics: ComponentMetrics
): NodeVisuals
```

**パラメータ**:
- `node`: グラフノード
- `metrics`: コンポーネントメトリクス

**返り値**:
- `NodeVisuals`: ノードの視覚属性

**視覚属性**:
```typescript
type NodeVisuals = {
  width: number;          // ノード幅
  height: number;         // ノード高さ
  backgroundColor: string; // 背景色
  borderColor: string;     // 枠線色
  borderWidth: number;     // 枠線幅
  fontSize: number;        // フォントサイズ
}
```

**計算ロジック**:
```typescript
// サイズ: 複雑度に基づく
size = baseSize + (complexity / 100) * (maxSize - baseSize);

// 色: 状態に基づく
if (hasError) color = '#EF4444';        // 赤
else if (hasWarning) color = '#F59E0B'; // 黄
else if (isUnused) color = '#9CA3AF';   // グレー
else color = '#3B82F6';                 // 青
```

**使用例**:
```typescript
const builder = new GraphBuilder();
const visuals = builder.calculateNodeVisuals(node, metrics);
console.log(`Size: ${visuals.width}x${visuals.height}`);
console.log(`Color: ${visuals.backgroundColor}`);
```

---

#### calculateEdgeVisuals()

エッジの視覚属性を計算します。

**シグネチャ**:
```typescript
calculateEdgeVisuals(edge: GraphEdge): EdgeVisuals
```

**パラメータ**:
- `edge`: グラフエッジ

**返り値**:
- `EdgeVisuals`: エッジの視覚属性

**視覚属性**:
```typescript
type EdgeVisuals = {
  strokeWidth: number;  // 線の太さ
  stroke: string;       // 線の色
  animated: boolean;    // アニメーション
  type: string;         // エッジタイプ
}
```

**計算ロジック**:
```typescript
// 太さ: 依存の強さに基づく
strokeWidth = 1 + (strength / maxStrength) * 4;

// 色: 通常は灰色
stroke = '#94A3B8';

// アニメーション: 循環依存の場合
animated = isPartOfCycle;
```

**使用例**:
```typescript
const builder = new GraphBuilder();
const visuals = builder.calculateEdgeVisuals(edge);
console.log(`Width: ${visuals.strokeWidth}px`);
```

---

### 3.2 LayoutEngine

#### applyLayout()

グラフにレイアウトを適用します。

**シグネチャ**:
```typescript
applyLayout(
  nodes: Node[],
  edges: Edge[],
  layoutType: LayoutType
): Node[]
```

**パラメータ**:
- `nodes`: ノード配列
- `edges`: エッジ配列
- `layoutType`: レイアウトタイプ

**返り値**:
- `Node[]`: 位置が計算されたノード配列

**レイアウトタイプ**:
- `tree`: ツリーレイアウト（階層的）
- `force`: 力学的レイアウト（物理シミュレーション）

**使用例**:
```typescript
const layoutEngine = new LayoutEngine();
const layoutedNodes = layoutEngine.applyLayout(
  nodes,
  edges,
  'tree'
);

layoutedNodes.forEach(node => {
  console.log(`${node.id}: (${node.position.x}, ${node.position.y})`);
});
```

---

#### calculateTreeLayout()

ツリーレイアウトを計算します（内部メソッド）。

**シグネチャ**:
```typescript
private calculateTreeLayout(
  nodes: Node[],
  edges: Edge[]
): Node[]
```

**レイアウトパラメータ**:
```typescript
const LEVEL_HEIGHT = 200;  // 階層間の垂直距離
const NODE_SPACING = 150;  // ノード間の水平距離
```

**アルゴリズム**:
1. ノードを深さでグループ化
2. 各レベルを水平に配置
3. 中心揃え

---

#### calculateForceLayout()

力学的レイアウトを計算します（内部メソッド）。

**シグネチャ**:
```typescript
private calculateForceLayout(
  nodes: Node[],
  edges: Edge[]
): Node[]
```

**物理パラメータ**:
```typescript
{
  linkDistance: 100,      // エッジの理想長さ
  chargeStrength: -300,   // ノード間の反発力
  centerForce: 0.1        // 中心への引力
}
```

**シミュレーション**:
- D3.jsのforceSimulationを使用
- 300イテレーション実行

---

## 4. Analysis API

### 4.1 MetricsCalculator

#### calculateComplexity()

コンポーネントの複雑度スコアを計算します。

**シグネチャ**:
```typescript
calculateComplexity(component: ComponentInfo): number
```

**パラメータ**:
- `component`: コンポーネント情報

**返り値**:
- `number`: 複雑度スコア（0-100）

**計算式**:
```typescript
complexity = 
  locScore * 0.25 +
  dependencyScore * 0.20 +
  dependentScore * 0.15 +
  hooksScore * 0.15 +
  propsScore * 0.15 +
  conditionalScore * 0.10
```

**各スコアの計算**:
```typescript
// LOCスコア（0-500行を0-100に正規化）
locScore = Math.min(100, (loc / 500) * 100);

// 依存スコア（0-20依存を0-100に正規化）
dependencyScore = Math.min(100, (dependencies / 20) * 100);

// 被依存スコア（0-20被依存を0-100に正規化）
dependentScore = Math.min(100, (dependents / 20) * 100);

// Hooksスコア（0-10 hooksを0-100に正規化）
hooksScore = Math.min(100, (hooks / 10) * 100);

// Propsスコア（0-15 propsを0-100に正規化）
propsScore = Math.min(100, (props / 15) * 100);
```

**使用例**:
```typescript
const calculator = new MetricsCalculator();
const complexity = calculator.calculateComplexity(component);

if (complexity > 80) {
  console.log('Warning: Very complex component!');
}
```

---

#### calculateMetrics()

すべてのメトリクスを計算します。

**シグネチャ**:
```typescript
calculateMetrics(
  component: ComponentInfo,
  graph: DependencyGraph
): ComponentMetrics
```

**パラメータ**:
- `component`: コンポーネント情報
- `graph`: 依存関係グラフ

**返り値**:
- `ComponentMetrics`: 全メトリクス

**計算される項目**:
```typescript
type ComponentMetrics = {
  complexity: number;        // 複雑度スコア
  loc: number;              // コード行数
  dependencyCount: number;  // 依存数（内部のみ）
  dependentCount: number;   // 被依存数
  hooksCount: number;       // Hooks数
  propsCount: number;       // Props数
  depth: number;            // 深さ
  externalDependencyCount: number; // 外部ライブラリ依存数
  externalLibraries: string[];     // 使用している外部ライブラリ
}
```

**使用例**:
```typescript
const calculator = new MetricsCalculator();
const metrics = calculator.calculateMetrics(component, graph);

console.log(`Complexity: ${metrics.complexity}`);
console.log(`Depth: ${metrics.depth}`);
```

---

### 4.2 WarningDetector

#### detectWarnings()

すべての警告を検出します。

**シグネチャ**:
```typescript
detectWarnings(
  graph: DependencyGraph,
  metrics: Map<string, ComponentMetrics>
): Warning[]
```

**パラメータ**:
- `graph`: 依存関係グラフ
- `metrics`: メトリクスマップ

**返り値**:
- `Warning[]`: 検出された警告の配列

**検出される警告**:
1. 循環依存
2. 未使用コンポーネント
3. 深い依存チェーン
4. 高結合度
5. 高複雑度

**使用例**:
```typescript
const detector = new WarningDetector();
const warnings = detector.detectWarnings(graph, metrics);

console.log(`Total warnings: ${warnings.length}`);

warnings.forEach(warning => {
  console.log(`[${warning.severity}] ${warning.message}`);
});
```

---

#### detectCircularDependencies()

循環依存の警告を検出します。

**シグネチャ**:
```typescript
detectCircularDependencies(graph: DependencyGraph): Warning[]
```

**検出条件**:
- A → B → C → A のような循環が存在

**重要度**:
- `high`: 循環の長さが3以下
- `medium`: 循環の長さが4-6
- `low`: 循環の長さが7以上

**使用例**:
```typescript
const detector = new WarningDetector();
const warnings = detector.detectCircularDependencies(graph);
```

---

#### detectUnusedComponents()

未使用コンポーネントの警告を検出します。

**シグネチャ**:
```typescript
detectUnusedComponents(graph: DependencyGraph): Warning[]
```

**検出条件**:
- 被依存数が0
- ルートコンポーネントではない

**重要度**: `medium`

**使用例**:
```typescript
const detector = new WarningDetector();
const warnings = detector.detectUnusedComponents(graph);
```

---

#### detectDeepDependencies()

深い依存チェーンの警告を検出します。

**シグネチャ**:
```typescript
detectDeepDependencies(graph: DependencyGraph): Warning[]
```

**検出条件**:
- 依存の深さが5以上

**重要度**:
- `medium`: 深さ 5-7
- `high`: 深さ 8以上

**使用例**:
```typescript
const detector = new WarningDetector();
const warnings = detector.detectDeepDependencies(graph);
```

---

#### detectHighCoupling()

高結合度の警告を検出します。

**シグネチャ**:
```typescript
detectHighCoupling(graph: DependencyGraph): Warning[]
```

**検出条件**:
- 被依存数が10以上

**重要度**:
- `medium`: 被依存数 10-15
- `high`: 被依存数 16以上

**使用例**:
```typescript
const detector = new WarningDetector();
const warnings = detector.detectHighCoupling(graph);
```

---

## 5. Storage API

### 5.1 Settings Storage

#### saveSettings()

設定を保存します。

**シグネチャ**:
```typescript
saveSettings(settings: StoredSettings): void
```

**パラメータ**:
- `settings`: 保存する設定

**保存先**: LocalStorage

**使用例**:
```typescript
const settings: StoredSettings = {
  layoutType: 'tree',
  filterSettings: {
    minComplexity: 0,
    maxComplexity: 100
  }
};

saveSettings(settings);
```

---

#### loadSettings()

設定を読み込みます。

**シグネチャ**:
```typescript
loadSettings(): StoredSettings | null
```

**返り値**:
- `StoredSettings | null`: 保存された設定、なければnull

**使用例**:
```typescript
const settings = loadSettings();

if (settings) {
  console.log(`Layout: ${settings.layoutType}`);
}
```

---

## 6. Error Handling

### エラータイプ

```typescript
// パースエラー
class ParseError extends Error {
  constructor(message: string, filePath: string) {
    super(message);
    this.name = 'ParseError';
    this.filePath = filePath;
  }
}

// ファイルシステムエラー
class FileSystemError extends Error {
  constructor(message: string, operation: string) {
    super(message);
    this.name = 'FileSystemError';
    this.operation = operation;
  }
}

// 解析エラー
class AnalysisError extends Error {
  constructor(message: string, componentId?: string) {
    super(message);
    this.name = 'AnalysisError';
    this.componentId = componentId;
  }
}
```

---

## 7. Type Definitions

### 共通型定義

```typescript
// ファイル情報
type FileInfo = {
  path: string;
  name: string;
  handle: FileSystemFileHandle;
  content?: string;
}

// コンポーネント情報
type ComponentInfo = {
  name: string;
  filePath: string;
  type: 'function' | 'class';
  exports: ExportInfo;
  imports: ImportStatement[];
  hooks: string[];
  props?: PropDefinition[];
  loc: number;
}

// Import文
type ImportStatement = {
  source: string;
  specifiers: string[];
  isReactComponent: boolean;
  isExternal: boolean;        // 外部ライブラリか
  resolvedPath?: string;      // 内部の場合のみ
}

// 依存関係グラフ
type DependencyGraph = {
  nodes: Map<string, GraphNode>;
  edges: GraphEdge[];
}

// グラフノード
type GraphNode = {
  id: string;
  component: ComponentInfo;
  dependencies: string[];
  dependents: string[];
  depth: number;
}

// グラフエッジ
type GraphEdge = {
  from: string;
  to: string;
  strength: number;
}

// メトリクス
type ComponentMetrics = {
  complexity: number;
  loc: number;
  dependencyCount: number;
  dependentCount: number;
  hooksCount: number;
  propsCount: number;
  depth: number;
  externalDependencyCount: number;
  externalLibraries: string[];
}

// 警告
type Warning = {
  id: string;
  type: WarningType;
  severity: 'high' | 'medium' | 'low';
  componentIds: string[];
  message: string;
  suggestion: string;
}
interface GraphNode {
  id: string;
  component: ComponentInfo;
  dependencies: string[];
  dependents: string[];
  depth: number;
}

// グラフエッジ
interface GraphEdge {
  from: string;
  to: string;
  strength: number;
}

// メトリクス
interface ComponentMetrics {
  complexity: number;
  loc: number;
  dependencyCount: number;
  dependentCount: number;
  hooksCount: number;
  propsCount: number;
  depth: number;
  externalDependencyCount: number;
  externalLibraries: string[];
}

// 警告
interface Warning {
  id: string;
  type: WarningType;
  severity: 'high' | 'medium' | 'low';
  componentIds: string[];
  message: string;
  suggestion: string;
}
```

---

**作成日**: 2025年10月17日  
**バージョン**: 1.0