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
    "next": "16.2.10",
    "react": "19.2.7",
    "react-dom": "19.2.7",
    "@xyflow/react": "12.11.1",
    "@babel/parser": "^8.0.0",
    "@babel/traverse": "^8.0.0",
    "@babel/types": "^8.0.0"
  },
  "devDependencies": {
    "typescript": "^6.0.3",
    "tailwindcss": "^4.3.2",
    "@tailwindcss/postcss": "^4.3.2",
    "@types/react": "^19.2.17",
    "@types/node": "^26.1.0",
    "eslint": "10.6.0",
    "prettier": "^3.9.4",
    "vitest": "4.1.9"
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

詳細なコーディングガイドラインは、別ドキュメントを参照してください：

**📖 [コーディングガイドライン](./coding-guidelines.md)**

主な内容：
- TypeScript の型定義規則（`type` vs `interface`）
- React / Next.js のベストプラクティス
- Tailwind CSS スタイリングガイド
- インポート順序
- エラーハンドリング
- コメント規則
- パフォーマンス最適化
- セキュリティ
- アクセシビリティ
- Git コミット規則

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