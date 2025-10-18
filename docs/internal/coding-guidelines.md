# ReUntangle - コーディングガイドライン

最終更新: 2025年10月18日

## 概要

このドキュメントは、ReUntangleプロジェクトにおけるコーディング規約とベストプラクティスを定義します。
一貫性のあるコードベースを維持し、保守性を高めることを目的としています。

---

## 1. TypeScript

### 1.1 型定義

**基本原則**:
- `interface` ではなく `type` を使用する
- `any` の使用を避ける
- 明示的な型注釈を使用する

```typescript
// ✅ Good: type を使用
export type ComponentInfo = {
  id: string;
  name: string;
  complexity: number;
};

// ❌ Bad: interface を使用
export interface ComponentInfo {
  id: string;
  name: string;
}

// ✅ Good: 明示的な型注釈
function calculateComplexity(component: ComponentInfo): number {
  return component.complexity;
}

// ❌ Bad: 暗黙的な型
function calculateComplexity(component) {
  return component.complexity;
}
```

### 1.2 命名規則

```typescript
// 型・クラス: PascalCase
type FileInfo = { path: string };
class ComponentParser {}

// 関数・変数: camelCase
function parseFile() {}
const componentInfo = {};

// 定数: UPPER_SNAKE_CASE
const MAX_COMPLEXITY = 100;
const DEFAULT_LAYOUT = 'tree';

// Enum: PascalCase (メンバーは PascalCase)
enum LayoutType {
  Tree = 'tree',
  Force = 'force',
}
```

### 1.3 Union Types と Literal Types

```typescript
// ✅ Good: Union types for limited options
type LayoutType = 'tree' | 'force';
type SearchIn = 'name' | 'path' | 'both';

// ✅ Good: Literal types for constants
type ComponentType = 'function' | 'class' | 'arrow' | 'hook';

// ❌ Bad: string type for limited options
type LayoutType = string;
```

### 1.4 Generics

```typescript
// ✅ Good: 型安全なジェネリクス
function mapNodes<T, R>(nodes: T[], mapper: (node: T) => R): R[] {
  return nodes.map(mapper);
}

// ✅ Good: 制約付きジェネリクス
function filterComponents<T extends ComponentInfo>(
  components: T[],
  predicate: (component: T) => boolean
): T[] {
  return components.filter(predicate);
}
```

---

## 2. React / Next.js

### 2.1 コンポーネント定義

**基本ルール**:
- 関数コンポーネントを使用
- Props は型定義を使用
- **デフォルトエクスポート**を使用（コンポーネントファイルのみ）
- 'use client' ディレクティブは必要な場合のみ

**なぜデフォルトエクスポート？**
- ✅ Next.js App Router の `page.tsx`、`layout.tsx` では**必須**
- ✅ React コミュニティの慣習（1ファイル1コンポーネント）
- ✅ `React.lazy()` との相性が良い
- ✅ ファイル名 = コンポーネント名 の対応が明確

**デメリット（認識した上で使用）**:
- ⚠️ インポート時に任意の名前を付けられる（名前の一貫性が保証されない）
- ⚠️ IDEのリファクタリング機能が効きにくい場合がある

```typescript
// ✅ Good: 型定義付き関数コンポーネント（デフォルトエクスポート）
'use client';

import type { ComponentInfo } from '@/types';

type DetailPanelProps = {
  component: ComponentInfo | null;
  onClose: () => void;
};

export default function DetailPanel({ component, onClose }: DetailPanelProps) {
  if (!component) {
    return null;
  }

  return (
    <div className="panel">
      <h2>{component.name}</h2>
      <button onClick={onClose}>Close</button>
    </div>
  );
}

// ❌ Bad: React.FC の使用（非推奨）
const DetailPanel: React.FC<DetailPanelProps> = ({ component, onClose }) => {
  // ...
};

// ❌ Bad: コンポーネントで名前付きエクスポート
export function DetailPanel({ component, onClose }: DetailPanelProps) {
  // コンポーネントはデフォルトエクスポートを使用する
}
```

### 2.2 Hooks

**カスタムフック**:
- `use` で始める命名
- **名前付きエクスポート**を使用（複数フックを1ファイルに配置可能）
- ロジックの再利用に使用
- 複雑な状態管理を分離

**なぜ名前付きエクスポート？**
- ✅ IDEの自動補完・リファクタリングが効く
- ✅ インポート時に正しい名前を強制できる（typo防止）
- ✅ Tree Shaking（未使用コード削除）が効率的
- ✅ 1ファイルに複数のヘルパー関数を含められる

```typescript
// ✅ Good: カスタムフックの定義（名前付きエクスポート）
export function useGraphFilter({
  nodes,
  edges,
  searchOptions,
  filterOptions,
}: UseGraphFilterProps): UseGraphFilterResult {
  return useMemo(() => {
    // フィルタリングロジック
    const filteredNodes = nodes.filter(/* ... */);
    return { filteredNodes, /* ... */ };
  }, [nodes, edges, searchOptions, filterOptions]);
}

// ✅ Good: 状態とアクションを返す
export function useAppState() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [layoutType, setLayoutType] = useState<LayoutType>('tree');

  const reset = useCallback(() => {
    setGraphData(null);
  }, []);

  return {
    // State
    graphData,
    layoutType,
    // Actions
    setLayoutType,
    reset,
  };
}

// ❌ Bad: フックでデフォルトエクスポート
export default function useAppState() {
  // フックは名前付きエクスポートを使用する
}
```

**依存配列**:
```typescript
// ✅ Good: すべての依存関係を明示
useEffect(() => {
  fetchData(componentId);
}, [componentId, fetchData]);

// ✅ Good: 空配列でマウント時のみ実行
useEffect(() => {
  initialize();
}, []);

// ❌ Bad: 依存配列を省略
useEffect(() => {
  fetchData(componentId);
}); // Warning: missing dependency array
```

**useCallback と useMemo**:
```typescript
// ✅ Good: 関数の再生成を防ぐ
const handleClick = useCallback(() => {
  onClick(nodeId);
}, [nodeId, onClick]);

// ✅ Good: 重い計算結果をメモ化
const filteredNodes = useMemo(() => {
  return nodes.filter(node => node.complexity > 50);
}, [nodes]);

// ❌ Bad: 不要な useCallback
const handleClick = useCallback(() => {
  console.log('clicked');
}, []); // 依存関係がないなら useCallback 不要
```

### 2.3 エクスポート方針まとめ

**プロジェクト全体のルール**:

| ファイルタイプ | エクスポート方法 | 理由 |
|--------------|----------------|------|
| **Reactコンポーネント** | デフォルト | Next.js要件、React慣習、`React.lazy()`対応 |
| **カスタムフック** | 名前付き | IDE サポート、Tree Shaking、名前の一貫性 |
| **クラス** | 名前付き | 名前の一貫性、リファクタリング対応 |
| **ユーティリティ関数** | 名前付き | 複数エクスポート可能、Tree Shaking |
| **型定義** | 名前付き | Tree Shaking、複数定義、再エクスポート容易 |

```typescript
// ✅ コンポーネント: デフォルトエクスポート
// components/DetailPanel.tsx
export default function DetailPanel() { ... }

// インポート
import DetailPanel from '@/components/DetailPanel';

// ✅ フック: 名前付きエクスポート
// hooks/useAppState.ts
export function useAppState() { ... }
export function useGraphFilter() { ... }

// インポート
import { useAppState, useGraphFilter } from '@/hooks/useAppState';

// ✅ クラス: 名前付きエクスポート
// lib/graph/graphBuilder.ts
export class GraphBuilder { ... }

// インポート
import { GraphBuilder } from '@/lib/graph/graphBuilder';

// ✅ ユーティリティ: 名前付きエクスポート
// lib/fileSystem.ts
export function scanDirectory() { ... }
export function isFileSystemAccessSupported() { ... }

// インポート
import { scanDirectory, isFileSystemAccessSupported } from '@/lib/fileSystem';

// ✅ 型: 名前付きエクスポート
// types/index.ts
export type ComponentInfo = { ... };
export type LayoutType = 'tree' | 'force';

// インポート
import type { ComponentInfo, LayoutType } from '@/types';
```

### 2.4 ファイル構成

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # ページコンポーネント（デフォルトエクスポート必須）
│   ├── layout.tsx         # レイアウト（デフォルトエクスポート必須）
│   └── globals.css        # グローバルスタイル
├── components/            # UIコンポーネント（デフォルトエクスポート）
│   ├── DetailPanel.tsx
│   ├── GraphView.tsx
│   └── GraphView/         # サブコンポーネント
│       ├── ReactFlowWrapper.tsx  # デフォルトエクスポート
│       ├── nodeTypes.ts          # 名前付きエクスポート
│       └── constants.ts          # 名前付きエクスポート
├── hooks/                 # カスタムフック（名前付きエクスポート）
│   ├── useAppState.ts
│   └── useGraphFilter.ts
├── lib/                   # ビジネスロジック（名前付きエクスポート）
│   ├── parser/
│   │   └── componentParser.ts   # export class ComponentParser
│   ├── graph/
│   │   ├── graphBuilder.ts      # export class GraphBuilder
│   │   └── layoutAlgorithm.ts   # export function applyLayout
│   └── fileSystem.ts            # export function scanDirectory など
└── types/                 # 型定義（名前付きエクスポート）
    └── index.ts                  # export type ComponentInfo など
```

---

## 3. スタイリング (Tailwind CSS)

### 3.1 クラス名の記述

```typescript
// ✅ Good: 読みやすく整理
<div className="
  flex items-center justify-between
  px-6 py-4
  bg-white border-b border-gray-200
  shadow-sm
">
  {/* content */}
</div>

// ✅ Good: 条件付きクラス
<button className={`
  px-4 py-2 rounded-lg font-medium transition-colors
  ${isActive
    ? 'bg-blue-600 text-white'
    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
`}>
  {label}
</button>

// ❌ Bad: 長すぎる1行
<div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-sm hover:shadow-md transition-shadow">
```

### 3.2 色の使用

```typescript
// ✅ Good: Tailwindの色パレットを使用
const colors = {
  primary: '#3b82f6',    // blue-500
  success: '#22c55e',    // green-500
  warning: '#eab308',    // yellow-500
  danger: '#ef4444',     // red-500
  purple: '#8b5cf6',     // purple-500
};

// カスタムカラーは直接指定
<div style={{ backgroundColor: '#8b5cf6' }}>
```

### 3.3 レスポンシブデザイン

```typescript
// ✅ Good: モバイルファーストアプローチ
<div className="
  grid grid-cols-1 gap-4
  md:grid-cols-2
  lg:grid-cols-3
  xl:grid-cols-4
">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>
```

---

## 4. インポート順序

```typescript
// 1. React / Next.js
import { useState, useCallback } from 'react';
import Image from 'next/image';

// 2. 外部ライブラリ
import { ReactFlow, Background } from '@xyflow/react';
import * as t from '@babel/types';

// 3. 内部モジュール (絶対パス @/)
import { ComponentParser } from '@/lib/parser/componentParser';
import { GraphBuilder } from '@/lib/graph/graphBuilder';
import { useAppState } from '@/hooks/useAppState';

// 4. コンポーネント
import DetailPanel from '@/components/DetailPanel';
import Header from '@/components/Header';

// 5. 相対パス
import { nodeTypes } from './nodeTypes';
import { REACT_FLOW_CONFIG } from './constants';

// 6. 型定義 (type-only imports)
import type { ComponentInfo, LayoutType } from '@/types';
import type { Node, Edge } from '@xyflow/react';

// 7. スタイル
import '@xyflow/react/dist/style.css';
import './styles.css';
```

---

## 5. エラーハンドリング

### 5.1 Try-Catch

```typescript
// ✅ Good: 具体的なエラーハンドリング
try {
  const result = await analyzeProject(directoryHandle);
  updateAnalysisResult(result);
} catch (error) {
  if (error instanceof SyntaxError) {
    console.error('Parse error:', error.message);
    alert('Failed to parse file. Please check the syntax.');
  } else {
    console.error('Analysis failed:', error);
    alert(`Analysis failed: ${(error as Error).message}`);
  }
}

// ❌ Bad: エラーを無視
try {
  const result = await analyzeProject(directoryHandle);
} catch {
  // 何もしない
}
```

### 5.2 型安全なエラーハンドリング

```typescript
// ✅ Good: Error型にキャスト
catch (error) {
  alert(`Failed: ${(error as Error).message}`);
}

// ✅ Good: unknown型で受け取り、型ガード
catch (error: unknown) {
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error('Unknown error:', error);
  }
}
```

---

## 6. コメント

### 6.1 コメントの原則

- コードで表現できることはコメントを書かない
- 「なぜ」を説明する（「何を」ではなく）
- 複雑なロジックには説明を追加
- JSDocを使用して関数を文書化

```typescript
// ❌ Bad: 自明なコメント
// Set the name
const name = 'John';

// ✅ Good: 理由を説明
// Next.js 15ではswcMinifyは非推奨だが、設定ファイルから削除するとビルドが失敗する
// ため、一時的に残している（2025年11月に再確認予定）
const config = { swcMinify: true };

// ✅ Good: JSDocコメント
/**
 * Calculate component complexity based on multiple weighted factors
 *
 * @param metrics - Component metrics including LOC, dependencies, hooks, props
 * @returns Complexity score from 0 to 100
 */
private calculateComplexity(metrics: {
  linesOfCode: number;
  dependencyCount: number;
  hooksCount: number;
  propsCount: number;
  externalLibraryCount: number;
}): number {
  // 重み付けした複雑度を計算
  const complexity =
    (metrics.linesOfCode / 200) * 100 * 0.25 +
    (metrics.dependencyCount / 10) * 100 * 0.2 +
    // ...
  return Math.min(100, complexity);
}
```

### 6.2 TODO コメント

```typescript
// ✅ Good: 期限付きTODO
// TODO(2025-11): Implement depth-based filtering

// ✅ Good: 担当者付きTODO
// TODO(@username): Add error boundary for GraphView

// ✅ Good: Issue参照
// TODO: Implement circular dependency warning (#42)

// ❌ Bad: 曖昧なTODO
// TODO: fix this later
```

---

## 7. テスト

### 7.1 テストファイルの配置

```
src/
├── lib/
│   ├── parser/
│   │   ├── componentParser.ts
│   │   └── componentParser.test.ts    # 同じディレクトリに配置
│   └── graph/
│       ├── graphBuilder.ts
│       └── graphBuilder.test.ts
```

### 7.2 テストの書き方

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentParser } from './componentParser';

describe('ComponentParser', () => {
  let parser: ComponentParser;

  beforeEach(() => {
    parser = new ComponentParser();
  });

  describe('parseFile', () => {
    it('should parse function component correctly', () => {
      // Arrange
      const code = `
        function MyComponent() {
          return <div>Hello</div>;
        }
      `;
      const fileInfo = { path: '/test.tsx', name: 'test.tsx', content: code };

      // Act
      const result = parser.parseFile(fileInfo);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('MyComponent');
      expect(result[0].type).toBe('function');
    });

    it('should detect custom hooks', () => {
      const code = `export function useCustomHook() { return useState(0); }`;
      const fileInfo = { path: '/hook.ts', content: code };

      const result = parser.parseFile(fileInfo);

      expect(result[0].type).toBe('hook');
    });
  });
});
```

---

## 8. パフォーマンス

### 8.1 useMemo と useCallback

```typescript
// ✅ Good: 重い計算はメモ化
const expensiveValue = useMemo(() => {
  return complexCalculation(data);
}, [data]);

// ✅ Good: 子コンポーネントに渡す関数はuseCallback
const handleClick = useCallback((id: string) => {
  onClick(id);
}, [onClick]);

// ❌ Bad: 単純な計算にuseMemo
const sum = useMemo(() => a + b, [a, b]); // 不要
```

### 8.2 条件付きレンダリング

```typescript
// ✅ Good: 早期リターン
if (!component) {
  return null;
}

return <div>{component.name}</div>;

// ❌ Bad: ネストが深い
return (
  <div>
    {component && (
      <div>
        {component.name && <span>{component.name}</span>}
      </div>
    )}
  </div>
);
```

---

## 9. セキュリティ

### 9.1 XSS対策

```typescript
// ✅ Good: React が自動でエスケープ
<div>{userInput}</div>

// ⚠️ Warning: dangerouslySetInnerHTML は避ける
// どうしても必要な場合は DOMPurify を使用
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />
```

### 9.2 依存関係のセキュリティ

```bash
# 定期的に脆弱性チェック
npm audit

# 脆弱性の修正
npm audit fix

# リリース日の確認（NPMサプライチェーン攻撃対策）
npm view react time
```

---

## 10. Git コミット

### 10.1 コミットメッセージ

```bash
# ✅ Good: 簡潔で明確
git commit -m "Add search functionality to component filter"
git commit -m "Fix circular dependency detection in GraphBuilder"
git commit -m "Update metrics dashboard to show custom hooks count"

# ❌ Bad: 曖昧
git commit -m "fix bug"
git commit -m "update code"
git commit -m "changes"
```

### 10.2 コミット単位

- 1つのコミットに1つの変更
- 機能追加とリファクタリングは分ける
- ビルドが通る状態でコミット

---

## 11. アクセシビリティ

### 11.1 セマンティックHTML

```typescript
// ✅ Good: セマンティックタグを使用
<header>
  <h1>ReUntangle</h1>
  <nav>
    <button>Menu</button>
  </nav>
</header>

<main>
  <section>
    <h2>Metrics</h2>
  </section>
</main>

// ❌ Bad: div だけで構成
<div className="header">
  <div className="title">ReUntangle</div>
</div>
```

### 11.2 ARIA属性

```typescript
// ✅ Good: aria-label で説明
<button
  onClick={onClose}
  aria-label="Close panel"
  className="close-button"
>
  <svg>...</svg>
</button>

// ✅ Good: role 属性
<div role="alert" className="error-message">
  {error}
</div>
```

---

## 12. チェックリスト

新しい機能を実装する際は以下を確認：

- [ ] TypeScript の型定義は適切か
- [ ] コンポーネントのPropsに型定義があるか
- [ ] `any` 型を使用していないか
- [ ] `interface` ではなく `type` を使用しているか
- [ ] useEffectの依存配列は適切か
- [ ] エラーハンドリングは適切か
- [ ] テストは追加されているか
- [ ] アクセシビリティは考慮されているか
- [ ] パフォーマンスに問題はないか
- [ ] コミットメッセージは明確か

---

**最終更新**: 2025年10月18日
