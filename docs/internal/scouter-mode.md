# スカウターモード - 内部仕様書

## 概要

スカウターモードは、選択したノードとその直接的な依存関係ノードのみを表示するフォーカスモード機能です。この文書では、スカウターモードの内部実装仕様、技術的設計、データフロー、API設計について詳述します。

---

## 実装方針

### 設計原則

1. **既存アーキテクチャとの整合性**
   - 現在のGraphView、React Flowの構造を最大限活用
   - レイヤー分離の原則を維持（Presentation / Application / Service）

2. **パフォーマンス優先**
   - フィルタリング処理は軽量に保つ
   - 大規模グラフでも高速に動作
   - React Flowの仮想化機能を活用

3. **拡張性**
   - 将来的な階層深さ指定に対応可能な設計
   - 他のフィルタリング機能との組み合わせを考慮

4. **ユーザビリティ**
   - スムーズなアニメーション遷移
   - 直感的な操作感
   - 明確な視覚的フィードバック

---

## アーキテクチャ設計

### レイヤー構成

```
┌─────────────────────────────────────────────────┐
│            Presentation Layer                    │
│  ┌──────────────────────────────────────────┐  │
│  │ GraphView Component                       │  │
│  │  - ダブルクリックイベントハンドリング    │  │
│  │  - ESCキーハンドリング                    │  │
│  │  - スカウターモードUI表示                │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│           Application Layer                      │
│  ┌──────────────────────────────────────────┐  │
│  │ useScouterMode Hook                       │  │
│  │  - スカウターモード状態管理              │  │
│  │  - ノード選択ロジック                    │  │
│  │  - 関連ノード抽出ロジック                │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │ useGraphFilter Hook (拡張)                │  │
│  │  - スカウターモードフィルタリング        │  │
│  │  - 既存フィルタとの統合                  │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│              Service Layer                       │
│  ┌──────────────────────────────────────────┐  │
│  │ ScouterModeService                        │  │
│  │  - 関連ノード/エッジ抽出アルゴリズム    │  │
│  │  - レイアウト計算                        │  │
│  │  - ノードスタイル変換                    │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## データ構造

### 状態管理

#### ScouterModeState

```typescript
type ScouterModeState = {
  // スカウターモードが有効か
  isActive: boolean;

  // 中心ノードのID
  centerNodeId: string | null;

  // 表示対象ノードのIDセット（高速検索用）
  visibleNodeIds: Set<string>;

  // 表示対象エッジのIDセット（高速検索用）
  visibleEdgeIds: Set<string>;

  // スカウターモード開始前の状態（復元用）
  previousState: {
    visibleNodeIds: Set<string>;
    visibleEdgeIds: Set<string>;
  } | null;
};
```

#### RelatedNodes

```typescript
type RelatedNodes = {
  // 中心ノード
  centerNode: Node;

  // 依存先ノード（中心ノードがimportしている）
  dependencyNodes: Node[];

  // 依存元ノード（中心ノードをimportしている）
  dependentNodes: Node[];

  // 関連するエッジ
  relatedEdges: Edge[];
};
```

---

## コンポーネント設計

### 新規コンポーネント

#### useScouterMode Hook

**責務**:
- スカウターモードの状態管理
- ダブルクリックイベントのハンドリング
- 関連ノード/エッジの抽出

**API**:

```typescript
type UseScouterModeOptions<T extends Record<string, unknown> = Record<string, unknown>> = {
  nodes: Node<T>[];
  edges: Edge[];
  onModeChange?: (isActive: boolean) => void;
};

type UseScouterModeReturn<T extends Record<string, unknown> = Record<string, unknown>> = {
  // 状態
  isScouterMode: boolean;
  centerNodeId: string | null;

  // アクション
  activateScouterMode: (nodeId: string) => void;
  deactivateScouterMode: () => void;

  // フィルタ済みデータ
  filteredNodes: Node<T>[];
  filteredEdges: Edge[];
};

function useScouterMode<T extends Record<string, unknown> = Record<string, unknown>>(
  options: UseScouterModeOptions<T>
): UseScouterModeReturn<T>
```

**型パラメータ**:
- `T`: ノードのデータ型。React Flowの制約により`Record<string, unknown>`を継承する必要があります
- 使用例: `useScouterMode<FlowNodeData>({ nodes, edges })`

**実装例**:

```typescript
function useScouterMode({ nodes, edges, onModeChange }: UseScouterModeOptions) {
  const [state, setState] = useState<ScouterModeState>({
    isActive: false,
    centerNodeId: null,
    visibleNodeIds: new Set(),
    visibleEdgeIds: new Set(),
    previousState: null,
  });

  const activateScouterMode = useCallback((nodeId: string) => {
    const relatedNodes = ScouterModeService.extractRelatedNodes(
      nodeId,
      nodes,
      edges
    );

    const visibleNodeIds = new Set([
      relatedNodes.centerNode.id,
      ...relatedNodes.dependencyNodes.map(n => n.id),
      ...relatedNodes.dependentNodes.map(n => n.id),
    ]);

    const visibleEdgeIds = new Set(
      relatedNodes.relatedEdges.map(e => e.id)
    );

    setState({
      isActive: true,
      centerNodeId: nodeId,
      visibleNodeIds,
      visibleEdgeIds,
      previousState: {
        visibleNodeIds: new Set(nodes.map(n => n.id)),
        visibleEdgeIds: new Set(edges.map(e => e.id)),
      },
    });

    onModeChange?.(true);
  }, [nodes, edges, onModeChange]);

  const deactivateScouterMode = useCallback(() => {
    setState({
      isActive: false,
      centerNodeId: null,
      visibleNodeIds: new Set(),
      visibleEdgeIds: new Set(),
      previousState: null,
    });

    onModeChange?.(false);
  }, [onModeChange]);

  const filteredNodes = useMemo(() => {
    if (!state.isActive) return nodes;

    return nodes
      .filter(node => state.visibleNodeIds.has(node.id))
      .map(node => {
        // 中心ノードを強調
        if (node.id === state.centerNodeId) {
          return ScouterModeService.highlightCenterNode(node);
        }
        return node;
      });
  }, [nodes, state]);

  const filteredEdges = useMemo(() => {
    if (!state.isActive) return edges;
    return edges.filter(edge => state.visibleEdgeIds.has(edge.id));
  }, [edges, state]);

  return {
    isScouterMode: state.isActive,
    centerNodeId: state.centerNodeId,
    activateScouterMode,
    deactivateScouterMode,
    filteredNodes,
    filteredEdges,
  };
}
```

---

### 既存コンポーネントの変更

#### GraphView Component

**変更内容**:

1. `useScouterMode` Hookの統合
2. ダブルクリックイベントハンドラの追加
3. ESCキーハンドラの追加
4. スカウターモードインジケータUIの追加

**擬似コード**:

```typescript
function GraphView() {
  // 既存の状態
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  // スカウターモード統合
  const {
    isScouterMode,
    centerNodeId,
    activateScouterMode,
    deactivateScouterMode,
    filteredNodes,
    filteredEdges,
  } = useScouterMode({
    nodes,
    edges,
    onModeChange: (isActive) => {
      // アニメーション、ログ記録など
      console.log(`Scouter mode ${isActive ? 'activated' : 'deactivated'}`);
    },
  });

  // ダブルクリックハンドラ
  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (isScouterMode && node.id === centerNodeId) {
      // 同じノードをダブルクリックで解除
      deactivateScouterMode();
    } else {
      activateScouterMode(node.id);
    }
  }, [isScouterMode, centerNodeId, activateScouterMode, deactivateScouterMode]);

  // ESCキーハンドラ
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isScouterMode) {
        deactivateScouterMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isScouterMode, deactivateScouterMode]);

  return (
    <div>
      {/* スカウターモードインジケータ */}
      {isScouterMode && (
        <ScouterModeIndicator
          centerNodeId={centerNodeId}
          onDeactivate={deactivateScouterMode}
        />
      )}

      {/* React Flow */}
      <ReactFlow
        nodes={filteredNodes}  // フィルタ済みノード
        edges={filteredEdges}  // フィルタ済みエッジ
        onNodeDoubleClick={onNodeDoubleClick}
        // その他のprops...
      />
    </div>
  );
}
```

#### ScouterModeIndicator Component

スカウターモードが有効な際に表示するUIコンポーネント。

```typescript
type ScouterModeIndicatorProps = {
  centerNodeId: string | null;
  onDeactivate: () => void;
};

function ScouterModeIndicator({ centerNodeId, onDeactivate }: ScouterModeIndicatorProps) {
  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">スカウターモード</span>
        <span className="text-xs opacity-80">中心: {centerNodeId}</span>
      </div>
      <button
        onClick={onDeactivate}
        className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded"
      >
        解除 (ESC)
      </button>
    </div>
  );
}
```

---

## サービス層設計

### ScouterModeService

**ファイルパス**: `src/services/ScouterModeService.ts`

**責務**:
- 関連ノード/エッジの抽出ロジック
- 中心ノードのスタイル変換
- レイアウト計算（将来的に）

**API仕様**:

```typescript
class ScouterModeService {
  /**
   * 指定されたノードに関連するノードとエッジを抽出
   */
  static extractRelatedNodes(
    centerNodeId: string,
    allNodes: Node[],
    allEdges: Edge[]
  ): RelatedNodes {
    const centerNode = allNodes.find(n => n.id === centerNodeId);
    if (!centerNode) {
      throw new Error(`Node with id ${centerNodeId} not found`);
    }

    // 依存先ノード（centerNodeがソースとなるエッジのターゲット）
    const dependencyEdges = allEdges.filter(e => e.source === centerNodeId);
    const dependencyNodeIds = new Set(dependencyEdges.map(e => e.target));
    const dependencyNodes = allNodes.filter(n => dependencyNodeIds.has(n.id));

    // 依存元ノード（centerNodeがターゲットとなるエッジのソース）
    const dependentEdges = allEdges.filter(e => e.target === centerNodeId);
    const dependentNodeIds = new Set(dependentEdges.map(e => e.source));
    const dependentNodes = allNodes.filter(n => dependentNodeIds.has(n.id));

    // 関連エッジ
    const relatedEdges = [...dependencyEdges, ...dependentEdges];

    return {
      centerNode,
      dependencyNodes,
      dependentNodes,
      relatedEdges,
    };
  }

  /**
   * 中心ノードを視覚的に強調
   */
  static highlightCenterNode<T extends Record<string, unknown> = Record<string, unknown>>(
    node: Node<T>
  ): Node<T> {
    return {
      ...node,
      data: {
        ...node.data,
        isScouterCenter: true,
      },
      style: {
        ...node.style,
        width: (node.style?.width ?? 60) * 1.5,
        height: (node.style?.height ?? 60) * 1.5,
        border: '4px solid #3b82f6',
        boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
        zIndex: 1000,
      },
    };
  }

  /**
   * スカウターモード用のレイアウト計算（将来実装）
   */
  static calculateScouterLayout(
    relatedNodes: RelatedNodes,
    options?: ScouterLayoutOptions
  ): LayoutResult {
    // 中心ノードを画面中央に配置
    // 依存元ノードを上部に配置
    // 依存先ノードを下部に配置
    // TODO: 実装
    throw new Error('Not implemented');
  }
}
```

---

## データフロー

### スカウターモード起動フロー

```
1. ユーザーがノードをダブルクリック
         ↓
2. GraphView.onNodeDoubleClick が発火
         ↓
3. useScouterMode.activateScouterMode(nodeId) 呼び出し
         ↓
4. ScouterModeService.extractRelatedNodes() で関連ノード抽出
   ├─ 依存先ノード (dependencies) の特定
   ├─ 依存元ノード (dependents) の特定
   └─ 関連エッジの特定
         ↓
5. ScouterModeState を更新
   ├─ isActive = true
   ├─ centerNodeId = nodeId
   ├─ visibleNodeIds = Set(関連ノードID)
   └─ visibleEdgeIds = Set(関連エッジID)
         ↓
6. useMemo でフィルタ済みノード/エッジを計算
   ├─ filteredNodes = 可視ノードのみ
   └─ filteredEdges = 可視エッジのみ
         ↓
7. 中心ノードに ScouterModeService.highlightCenterNode() 適用
   ├─ サイズを1.5倍に拡大
   ├─ 青いボーダーを追加
   └─ シャドウを追加
         ↓
8. React Flow が再レンダリング
   ├─ フィルタ済みノードのみ表示
   ├─ フィルタ済みエッジのみ表示
   └─ アニメーション遷移
         ↓
9. ScouterModeIndicator 表示
```

### スカウターモード解除フロー

```
1. ユーザーがESCキーを押下 / 解除ボタンクリック / 背景ダブルクリック
         ↓
2. useScouterMode.deactivateScouterMode() 呼び出し
         ↓
3. ScouterModeState をリセット
   ├─ isActive = false
   ├─ centerNodeId = null
   ├─ visibleNodeIds = Set()
   └─ visibleEdgeIds = Set()
         ↓
4. filteredNodes / filteredEdges が全ノード/エッジを返す
         ↓
5. React Flow が再レンダリング（全体表示に戻る）
         ↓
6. ScouterModeIndicator 非表示
```

---

## レイアウト戦略

### 基本レイアウト

スカウターモード専用のレイアウトアルゴリズムを実装します。

**配置ルール**:

```
      ┌────────┐  ┌────────┐  ┌────────┐
      │ 依存元 │  │ 依存元 │  │ 依存元 │
      │ Node1  │  │ Node2  │  │ Node3  │
      └───↓────┘  └───↓────┘  └───↓────┘
          ↓           ↓           ↓
      ┌───────────────────────────────┐
      │                                │
      │        中心ノード              │
      │      (強調表示)                │
      │                                │
      └───────────────────────────────┘
          ↓           ↓           ↓
      ┌───↓────┐  ┌───↓────┐  ┌───↓────┐
      │ 依存先 │  │ 依存先 │  │ 依存先 │
      │ Node1  │  │ Node2  │  │ Node3  │
      └────────┘  └────────┘  └────────┘
```

**座標計算**:

```typescript
type ScouterLayoutOptions = {
  centerX: number;      // 中心ノードのX座標
  centerY: number;      // 中心ノードのY座標
  verticalSpacing: number;  // 垂直方向の間隔
  horizontalSpacing: number; // 水平方向の間隔
};

function calculateScouterLayout(
  relatedNodes: RelatedNodes,
  options: ScouterLayoutOptions
): Map<string, { x: number; y: number }> {
  const positions = new Map();
  const { centerX, centerY, verticalSpacing, horizontalSpacing } = options;

  // 中心ノード
  positions.set(relatedNodes.centerNode.id, { x: centerX, y: centerY });

  // 依存元ノード（上部）
  const dependentCount = relatedNodes.dependentNodes.length;
  const dependentStartX = centerX - (dependentCount - 1) * horizontalSpacing / 2;
  relatedNodes.dependentNodes.forEach((node, index) => {
    positions.set(node.id, {
      x: dependentStartX + index * horizontalSpacing,
      y: centerY - verticalSpacing,
    });
  });

  // 依存先ノード（下部）
  const dependencyCount = relatedNodes.dependencyNodes.length;
  const dependencyStartX = centerX - (dependencyCount - 1) * horizontalSpacing / 2;
  relatedNodes.dependencyNodes.forEach((node, index) => {
    positions.set(node.id, {
      x: dependencyStartX + index * horizontalSpacing,
      y: centerY + verticalSpacing,
    });
  });

  return positions;
}
```

---

## パフォーマンス最適化

### 1. Set による高速検索

```typescript
// ❌ 遅い（O(n)）
const isVisible = visibleNodeIds.includes(nodeId);

// ✅ 速い（O(1)）
const isVisible = visibleNodeIds.has(nodeId);
```

### 2. useMemo によるメモ化

```typescript
const filteredNodes = useMemo(() => {
  if (!state.isActive) return nodes;
  return nodes.filter(node => state.visibleNodeIds.has(node.id));
}, [nodes, state.isActive, state.visibleNodeIds]);
```

### 3. 不要な再レンダリングの防止

```typescript
// useCallback でイベントハンドラをメモ化
const onNodeDoubleClick = useCallback((event, node) => {
  activateScouterMode(node.id);
}, [activateScouterMode]);
```

### 4. React Flow の最適化機能を活用

- `nodesDraggable={false}` でドラッグ処理を無効化（スカウターモード中）
- `elementsSelectable={false}` で選択処理を無効化（必要に応じて）

---

## エラーハンドリング

### エラーケースと対処

1. **存在しないノードIDが指定された場合**
   ```typescript
   if (!centerNode) {
     console.error(`Node with id ${centerNodeId} not found`);
     // スカウターモードを起動しない
     return;
   }
   ```

2. **依存関係が存在しないノード**
   ```typescript
   // 中心ノードのみ表示
   if (dependencyNodes.length === 0 && dependentNodes.length === 0) {
     console.warn(`Node ${centerNodeId} has no dependencies or dependents`);
     // 中心ノードのみを表示
   }
   ```

3. **レイアウト計算エラー**
   ```typescript
   try {
     const layout = calculateScouterLayout(relatedNodes, options);
   } catch (error) {
     console.error('Failed to calculate scouter layout:', error);
     // フォールバック: デフォルトレイアウトを使用
   }
   ```

---

## テスト戦略

### 単体テスト

#### ScouterModeService のテスト

**ファイル**: `src/services/ScouterModeService.test.ts`

```typescript
describe('ScouterModeService', () => {
  describe('extractRelatedNodes', () => {
    it('should extract dependency nodes correctly', () => {
      const nodes = [
        { id: 'A', data: {} },
        { id: 'B', data: {} },
        { id: 'C', data: {} },
      ];
      const edges = [
        { id: 'e1', source: 'A', target: 'B' },
        { id: 'e2', source: 'A', target: 'C' },
      ];

      const result = ScouterModeService.extractRelatedNodes('A', nodes, edges);

      expect(result.centerNode.id).toBe('A');
      expect(result.dependencyNodes).toHaveLength(2);
      expect(result.dependencyNodes.map(n => n.id)).toEqual(['B', 'C']);
    });

    it('should extract dependent nodes correctly', () => {
      const nodes = [
        { id: 'A', data: {} },
        { id: 'B', data: {} },
        { id: 'C', data: {} },
      ];
      const edges = [
        { id: 'e1', source: 'B', target: 'A' },
        { id: 'e2', source: 'C', target: 'A' },
      ];

      const result = ScouterModeService.extractRelatedNodes('A', nodes, edges);

      expect(result.centerNode.id).toBe('A');
      expect(result.dependentNodes).toHaveLength(2);
      expect(result.dependentNodes.map(n => n.id)).toEqual(['B', 'C']);
    });

    it('should throw error if node not found', () => {
      expect(() => {
        ScouterModeService.extractRelatedNodes('X', [], []);
      }).toThrow('Node with id X not found');
    });
  });

  describe('highlightCenterNode', () => {
    it('should increase node size by 1.5x', () => {
      const node = {
        id: 'A',
        data: {},
        style: { width: 60, height: 60 },
      };

      const highlighted = ScouterModeService.highlightCenterNode(node);

      expect(highlighted.style.width).toBe(90);
      expect(highlighted.style.height).toBe(90);
    });

    it('should add border and shadow', () => {
      const node = { id: 'A', data: {}, style: {} };
      const highlighted = ScouterModeService.highlightCenterNode(node);

      expect(highlighted.style.border).toContain('4px solid');
      expect(highlighted.style.boxShadow).toBeDefined();
    });
  });
});
```

#### useScouterMode Hook のテスト

**ファイル**: `src/hooks/useScouterMode.test.ts`

```typescript
import { renderHook, act } from '@testing-library/react';
import { useScouterMode } from './useScouterMode';

describe('useScouterMode', () => {
  const mockNodes = [
    { id: 'A', data: {} },
    { id: 'B', data: {} },
    { id: 'C', data: {} },
  ];

  const mockEdges = [
    { id: 'e1', source: 'A', target: 'B' },
    { id: 'e2', source: 'A', target: 'C' },
  ];

  it('should initially be inactive', () => {
    const { result } = renderHook(() =>
      useScouterMode({ nodes: mockNodes, edges: mockEdges })
    );

    expect(result.current.isScouterMode).toBe(false);
    expect(result.current.centerNodeId).toBe(null);
  });

  it('should activate scouter mode', () => {
    const { result } = renderHook(() =>
      useScouterMode({ nodes: mockNodes, edges: mockEdges })
    );

    act(() => {
      result.current.activateScouterMode('A');
    });

    expect(result.current.isScouterMode).toBe(true);
    expect(result.current.centerNodeId).toBe('A');
    expect(result.current.filteredNodes).toHaveLength(3); // A, B, C
  });

  it('should deactivate scouter mode', () => {
    const { result } = renderHook(() =>
      useScouterMode({ nodes: mockNodes, edges: mockEdges })
    );

    act(() => {
      result.current.activateScouterMode('A');
    });

    act(() => {
      result.current.deactivateScouterMode();
    });

    expect(result.current.isScouterMode).toBe(false);
    expect(result.current.centerNodeId).toBe(null);
  });

  it('should call onModeChange callback', () => {
    const onModeChange = vi.fn();
    const { result } = renderHook(() =>
      useScouterMode({
        nodes: mockNodes,
        edges: mockEdges,
        onModeChange,
      })
    );

    act(() => {
      result.current.activateScouterMode('A');
    });

    expect(onModeChange).toHaveBeenCalledWith(true);

    act(() => {
      result.current.deactivateScouterMode();
    });

    expect(onModeChange).toHaveBeenCalledWith(false);
  });
});
```

### 統合テスト

#### GraphView Component のテスト

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { GraphView } from './GraphView';

describe('GraphView - Scouter Mode Integration', () => {
  it('should activate scouter mode on double click', async () => {
    render(<GraphView />);

    // ノードを取得
    const nodeA = screen.getByTestId('node-A');

    // ダブルクリック
    fireEvent.doubleClick(nodeA);

    // スカウターモードインジケータが表示される
    expect(screen.getByText('スカウターモード')).toBeInTheDocument();
  });

  it('should deactivate scouter mode on ESC key', async () => {
    render(<GraphView />);

    const nodeA = screen.getByTestId('node-A');
    fireEvent.doubleClick(nodeA);

    // スカウターモード有効
    expect(screen.getByText('スカウターモード')).toBeInTheDocument();

    // ESCキー押下
    fireEvent.keyDown(window, { key: 'Escape' });

    // スカウターモード無効
    expect(screen.queryByText('スカウターモード')).not.toBeInTheDocument();
  });
});
```

---

## マイルストーン

### フェーズ1: 基本実装（MVP）

**目標**: スカウターモードの基本機能を実装

**タスク**:
- [ ] `ScouterModeService` の実装
- [ ] `useScouterMode` Hook の実装
- [ ] `GraphView` へのダブルクリックイベント統合
- [ ] `ScouterModeIndicator` コンポーネントの実装
- [ ] ESCキーでの解除機能
- [ ] 単体テストの作成

**完了条件**:
- ノードをダブルクリックでスカウターモード起動
- 中心ノードと直接関連ノードのみ表示
- ESCキーで全体表示に戻る

### フェーズ2: UI/UX改善

**目標**: ユーザー体験の向上

**タスク**:
- [ ] アニメーション遷移の追加
- [ ] 中心ノードの視覚的強調
- [ ] スカウターモード専用レイアウトの実装
- [ ] ツールチップの改善
- [ ] アクセシビリティ対応（ARIA属性）

**完了条件**:
- スムーズなアニメーション
- 明確な視覚的フィードバック
- キーボードナビゲーション対応

### フェーズ3: 拡張機能

**目標**: 高度な機能の追加

**タスク**:
- [ ] 階層深さ指定機能（1階層、2階層、3階層）
- [ ] スカウターモード中のフィルタリング
- [ ] 比較モード（複数ノードの同時表示）
- [ ] スナップショット保存機能
- [ ] 2ノード間のパスハイライト

**完了条件**:
- 階層深さを指定できる
- 複数のノードを比較できる
- スカウターモードの状態を保存・復元できる

---

## 技術的負債と改善項目

### 現在特定されている課題

なし（新規機能のため）

### 将来的な改善候補

1. **レイアウトアルゴリズムの最適化**
   - 依存ノードが多い場合の配置改善
   - 重なりの自動回避

2. **パフォーマンス改善**
   - Web Workers での関連ノード抽出
   - 仮想化の活用

3. **アクセシビリティ**
   - スクリーンリーダー対応
   - キーボードショートカットの拡充

---

## 参考資料

### 既存コード

- `src/components/GraphView.tsx`
- `src/hooks/useGraphFilter.ts`
- `src/services/GraphBuilder.ts`

### 外部ライブラリ

- [React Flow Documentation](https://reactflow.dev/)
- [React Flow - Custom Nodes](https://reactflow.dev/learn/customization/custom-nodes)
- [React Flow - Interaction](https://reactflow.dev/learn/advanced-use/interaction)

---

**作成日**: 2025年10月19日
**最終更新**: 2025年10月19日
**バージョン**: 1.0（未実装）
**作成者**: Development Team
