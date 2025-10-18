# ReUntangle

<img width="2116" height="1386" alt="screenshot" src="https://github.com/user-attachments/assets/efe13f53-51eb-445e-af9f-193a347d413f" />

**Visualize and untangle React component dependencies**

ReUntangleは、Reactプロジェクトのコンポーネントとカスタムフックの依存関係を可視化し、複雑度を分析するツールです。

## 🎯 主な機能

### ✅ 自動検出
- **Reactコンポーネント**: 関数、クラス、アロー関数コンポーネントを自動検出
- **カスタムフック**: `useXxx`パターンのフックを⚡アイコン付きで表示
- **依存関係**: インポートとフック呼び出しから自動で依存関係を抽出

### 📊 複雑度分析
各コンポーネント・フックの複雑度を0-100のスコアで評価：
- コード行数（25%）
- 依存関係数（20%）
- Hooks使用数（20%）
- Props数（15%）
- 外部ライブラリ数（5%）
- 基礎複雑度（20%）

### 🎨 視覚的な表現
- **色分け**: 複雑度と状態により7色で自動色分け
  - 🔴 赤: 循環依存
  - 🟣 紫: ルートコンポーネント（page.tsx等）
  - ⚫ グレー: 未使用
  - 🟢 緑: シンプル（0-30）
  - 🔵 青: 標準（31-60）
  - 🟡 黄: 複雑（61-80）
  - 🟠 オレンジ: 非常に複雑（81-100）
- **サイズ**: 複雑度に応じて40px〜100pxで自動調整
- **アイコン**: カスタムフックには⚡を表示

### 🔍 インタラクティブ
- ノードクリックで詳細情報パネルを表示
- TreeレイアウトとForceレイアウトの切り替え
- ズーム・パン操作
- ミニマップ

## 🚀 使い方

### 開発サーバー起動

```bash
npm install
npm run dev
```

ブラウザで http://localhost:3000 を開く

### プロジェクト解析

1. **Select Folder**ボタンをクリック
2. 解析したいReactプロジェクトのフォルダを選択
3. 自動的にコンポーネント・フックを検出してグラフ表示
4. ノードをクリックして詳細情報を確認

## 🛠 技術スタック

- **Next.js 15.5.3** - Reactフレームワーク
- **React 19.1.0** - UIライブラリ
- **TypeScript 5.9.3** - 型安全性
- **@xyflow/react 12.8.4** - グラフ可視化
- **Babel Parser 7.25+** - ASTパース
- **Tailwind CSS 3.4+** - スタイリング
- **Vitest 3.2.4** - テスト

## 📁 プロジェクト構造

```
src/
├── app/              # Next.js App Router
│   └── page.tsx      # メインページ
├── components/       # Reactコンポーネント
│   ├── CustomNode.tsx
│   ├── DetailPanel.tsx
│   ├── FolderSelector.tsx
│   ├── GraphView.tsx
│   └── Header.tsx
├── hooks/            # カスタムフック
│   ├── useAppState.ts
│   ├── useGraphLayout.ts
│   ├── useNodeClickHandler.ts
│   └── useProjectAnalysis.ts
├── lib/              # コアロジック
│   ├── fileSystem.ts
│   ├── parser/
│   │   └── componentParser.ts
│   └── graph/
│       ├── graphBuilder.ts
│       └── layoutAlgorithm.ts
└── types/            # TypeScript型定義
    └── index.ts
```

## 🔒 セキュリティ

- **完全クライアントサイド処理**: データは外部に送信されません
- **File System Access API**: ブラウザの標準APIを使用
- **プライバシー保護**: ユーザーデータを保存しません

## 📝 ライセンス

MIT

## 🤝 貢献

Issue・PRを歓迎します！

---

**最終更新**: 2025年10月18日
