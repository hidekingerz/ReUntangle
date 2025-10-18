# ReUntangle - 開発ガイド

## 概要
本ドキュメントは、ReUntangleの開発環境構築から、コーディング規約、テスト、デプロイまでの開発プロセスを説明します。

---

## 1. 開発環境セットアップ

### 1.1 必要な環境

**Node.js**:
- バージョン: 22.x 以上
- 推奨: 22.x (LTS)

**パッケージマネージャー**:
- npm 10.x 以上
- または yarn 1.22.x 以上
- または pnpm 8.x 以上

**エディタ**:
- VS Code (推奨)
- 必要な拡張機能:
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features

---

### 1.2 プロジェクトのクローン

```bash
git clone https://github.com/your-org/reuntangle.git
cd reuntangle
```

---

### 1.3 依存関係のインストール

```bash
npm install
```

**主要な依存パッケージ**:
```json
{
  "dependencies": {
    "next": "15.5.3",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "@xyflow/react": "12.8.4",
    "@babel/parser": "^7.25.0",
    "@babel/traverse": "^7.25.0",
    "@babel/types": "^7.25.0"
  },
  "devDependencies": {
    "typescript": "^5.9.0",
    "tailwindcss": "^3.4.0",
    "@types/react": "^19.0.0",
    "@types/node": "^20.16.0",
    "eslint": "9.35.0",
    "prettier": "^3.6.0",
    "vitest": "3.2.4"
  }
}
```

---

### 1.4 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開きます。

---

## 2. プロジェクト構造

```
reuntangle/
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # Reactコンポーネント
│   ├── lib/             # ビジネスロジック
│   ├── types/           # 型定義
│   └── hooks/           # カスタムフック
├── docs/
│   ├── external/        # 外部仕様
│   └── internal/        # 内部仕様
├── public/              # 静的ファイル
└── tests/               # テストファイル
```

---

## 3. コーディング規約

### 3.1 TypeScript

**命名規則**:
```typescript
// クラス・型: PascalCase
class ComponentParser {}
type FileInfo = { /* ... */ };
type LayoutType = 'tree' | 'force';

// 関数・変数: camelCase
function parseFile() {}
const componentInfo = {};

// 定数: UPPER_SNAKE_CASE
const MAX_COMPLEXITY = 100;
const DEFAULT_LAYOUT = 'tree';

// プライベートメソッド: _で始まる (optional)
private _calculateScore() {}
```

**型注釈**:
```typescript
// 明示的な型注釈を使用
function calculateComplexity(component: ComponentInfo): number {
  // ...
}

// 戻り値の型を明示
const getComponents = (): ComponentInfo[] => {
  // ...
};

// ジェネリクスの使用
function mapNodes<T, R>(nodes: T[], mapper: (node: T) => R): R[] {
  // ...
}
```

**避けるべきパターン**:
```typescript
// ❌ any の使用
const data: any = {};

// ✅ 適切な型定義
type Data = {
  id: string;
  value: number;
}
const data: Data = { id: '1', value: 100 };

// ❌ 暗黙的な型
function add(a, b) {
  return a + b;
}

// ✅ 明示的な型
function add(a: number, b: number): number {
  return a + b;
}
```

---

### 3.2 React

**コンポーネント定義**:
```typescript
// 関数コンポーネントを使用
type ButtonProps = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  label, 
  onClick, 
  disabled = false 
}) => {
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className="px-4 py-2 bg-blue-600 text-white rounded"
    >
      {label}
    </button>
  );
};

export default Button;
```

**Hooks の使用**:
```typescript
// カスタムHooksは use で始める
function useFileSystem() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // ...
  
  return { isLoading, error };
}

// useEffect の依存配列を適切に設定
useEffect(() => {
  // side effect
}, [dependency1, dependency2]);
```

**状態管理**:
```typescript
// useState
const [count, setCount] = useState(0);

// useReducer（複雑な状態の場合）
const [state, dispatch] = useReducer(reducer, initialState);

// Context API（グローバルな状態）
const AppContext = createContext<AppContextType | null>(null);
```

---

### 3.3 スタイリング

**Tailwind CSS**:
```typescript
// クラス名は読みやすく整理
<div className="
  flex items-center justify-between
  p-4 mb-2
  bg-white rounded-lg shadow
  hover:shadow-lg transition-shadow
">
  {/* content */}
</div>

// 条件付きクラス
<div className={`
  px-4 py-2 rounded
  ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}
`}>
  {/* content */}
</div>
```

**カスタムスタイル**:
```typescript
// 必要に応じてグローバルCSS
// src/app/globals.css

@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700;
  }
}
```

---

### 3.4 ファイル構成

**ファイル名**:
- コンポーネント: `PascalCase.tsx`
- ユーティリティ: `camelCase.ts`
- 型定義: `camelCase.ts` または `types.ts`
- テスト: `*.test.ts` または `*.spec.ts`

**エクスポート**:
```typescript
// 名前付きエクスポート（推奨）
export function calculateComplexity() {}
export class ComponentParser {}

// デフォルトエクスポート（コンポーネントのみ）
export default function Button() {}
```

**インポート順序**:
```typescript
// 1. 外部ライブラリ
import React, { useState, useEffect } from 'react';
import { parse } from '@babel/parser';

// 2. 内部モジュール（絶対パス）
import { ComponentParser } from '@/lib/parser';
import { GraphBuilder } from '@/lib/graph';

// 3. 相対パス
import { Button } from './Button';
import { useFileSystem } from '../hooks/useFileSystem';

// 4. 型定義
import type { ComponentInfo, FileInfo } from '@/types';

// 5. スタイル
import './styles.css';
```

---

## 4. テスト

### 4.1 テスト戦略

**ユニットテスト**:
- すべてのユーティリティ関数
- パーサー、アナライザーのロジック
- カスタムフックス

**統合テスト**:
- コンポーネント間の連携
- データフロー全体

**E2Eテスト** (将来):
- ユーザーシナリオ
- フロー全体のテスト

---

### 4.2 テストフレームワーク

**Vitest + React Testing Library**:
```bash
npm install --save-dev vitest @vitest/ui @testing-library/react @testing-library/jest-dom
```

**設定ファイル** (`vitest.config.ts`):
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

---

### 4.3 テストの書き方

**ユニットテスト例**:
```typescript
// lib/parser/componentParser.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentParser } from './componentParser';

describe('ComponentParser', () => {
  let parser: ComponentParser;

  beforeEach(() => {
    parser = new ComponentParser();
  });

  describe('parseCode', () => {
    it('should parse function component', () => {
      const code = `
        function MyComponent() {
          return <div>Hello</div>;
        }
      `;

      const result = parser.parseCode(code);

      expect(result.name).toBe('MyComponent');
      expect(result.type).toBe('function');
    });

    it('should parse arrow function component', () => {
      const code = `
        const MyComponent = () => {
          return <div>Hello</div>;