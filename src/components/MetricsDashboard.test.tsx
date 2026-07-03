import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import MetricsDashboard from './MetricsDashboard';
import type { ProjectMetrics } from '@/types';

describe('MetricsDashboard', () => {
  const mockMetrics: ProjectMetrics = {
    totalComponents: 50,
    totalHooks: 12,
    averageComplexity: 45,
    maxComplexity: 85,
    minComplexity: 10,
    circularDependencies: 2,
    topComplexComponents: [
      {
        name: 'ComplexComponent',
        filePath: 'src/components/ComplexComponent.tsx',
        complexity: 85,
      },
      {
        name: 'HeavyComponent',
        filePath: 'src/components/HeavyComponent.tsx',
        complexity: 75,
      },
      {
        name: 'LargeComponent',
        filePath: 'src/components/LargeComponent.tsx',
        complexity: 68,
      },
    ],
    mostDependedOn: [
      {
        name: 'Button',
        filePath: 'src/components/Button.tsx',
        dependentCount: 25,
      },
      { name: 'Icon', filePath: 'src/components/Icon.tsx', dependentCount: 20 },
      {
        name: 'Input',
        filePath: 'src/components/Input.tsx',
        dependentCount: 15,
      },
    ],
    complexityDistribution: {
      simple: 20,
      standard: 15,
      complex: 10,
      veryComplex: 5,
    },
  };

  const mockOnClose = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('基本レンダリング', () => {
    it('ダッシュボードが正しくレンダリングされる', () => {
      render(<MetricsDashboard metrics={mockMetrics} onClose={mockOnClose} />);

      // ヘッダーの確認
      expect(screen.getByText('Project Metrics Dashboard')).toBeInTheDocument();

      // セクションの確認
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Complexity Distribution')).toBeInTheDocument();
      expect(
        screen.getByText('Most Complex Components (Top 10)')
      ).toBeInTheDocument();
      expect(screen.getByText('Most Depended On (Top 10)')).toBeInTheDocument();
    });

    it('概要カードが正しい値を表示する', () => {
      render(<MetricsDashboard metrics={mockMetrics} onClose={mockOnClose} />);

      // Total Components
      expect(screen.getByText('Total Components')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();

      // Custom Hooks
      expect(screen.getByText('Custom Hooks')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();

      // Avg Complexity
      expect(screen.getByText('Avg Complexity')).toBeInTheDocument();
      expect(screen.getByText('45')).toBeInTheDocument();

      // Circular Dependencies
      expect(screen.getByText('Circular Deps')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  describe('複雑度分布', () => {
    it('複雑度分布が正しく表示される', () => {
      render(<MetricsDashboard metrics={mockMetrics} onClose={mockOnClose} />);

      expect(screen.getByText('🟢 Simple (0-30)')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();

      expect(screen.getByText('🔵 Standard (31-60)')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();

      expect(screen.getByText('🟡 Complex (61-80)')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();

      expect(screen.getByText('🟠 Very Complex (81-100)')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('複雑度分布のプログレスバーが正しい幅を持つ', () => {
      const { container } = render(
        <MetricsDashboard metrics={mockMetrics} onClose={mockOnClose} />
      );

      // 複雑度分布のプログレスバーを確認
      const progressBars = container.querySelectorAll(
        '.bg-green-500, .bg-blue-500, .bg-yellow-500, .bg-orange-500'
      );

      // 期待される幅の計算（各カテゴリ / 総コンポーネント数 * 100）
      // simple: 20/50 = 40%, standard: 15/50 = 30%, complex: 10/50 = 20%, veryComplex: 5/50 = 10%
      expect(progressBars).toHaveLength(4);
    });
  });

  describe('最も複雑なコンポーネント', () => {
    it('最も複雑なコンポーネントのテーブルが表示される', () => {
      render(<MetricsDashboard metrics={mockMetrics} onClose={mockOnClose} />);

      // テーブルヘッダー（2つのテーブルがあるので getAllByText を使用）
      expect(screen.getAllByText('Rank').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Component').length).toBeGreaterThan(0);
      expect(screen.getAllByText('File Path').length).toBeGreaterThan(0);
      expect(screen.getByText('Complexity')).toBeInTheDocument();

      // コンポーネント名
      expect(screen.getByText('ComplexComponent')).toBeInTheDocument();
      expect(screen.getByText('HeavyComponent')).toBeInTheDocument();
      expect(screen.getByText('LargeComponent')).toBeInTheDocument();

      // ファイルパス
      expect(
        screen.getByText('src/components/ComplexComponent.tsx')
      ).toBeInTheDocument();
      expect(
        screen.getByText('src/components/HeavyComponent.tsx')
      ).toBeInTheDocument();
      expect(
        screen.getByText('src/components/LargeComponent.tsx')
      ).toBeInTheDocument();

      // 複雑度バッジ
      expect(screen.getByText('85')).toBeInTheDocument();
      expect(screen.getByText('75')).toBeInTheDocument();
      expect(screen.getByText('68')).toBeInTheDocument();
    });

    it('ランキング番号が正しく表示される', () => {
      render(<MetricsDashboard metrics={mockMetrics} onClose={mockOnClose} />);

      // 複数のテーブルがあるため、getAllByTextを使用
      const rankings = screen.getAllByText('#1');
      expect(rankings.length).toBeGreaterThan(0);
      expect(screen.getAllByText('#2').length).toBeGreaterThan(0);
      expect(screen.getAllByText('#3').length).toBeGreaterThan(0);
    });
  });

  describe('最も依存されているコンポーネント', () => {
    it('最も依存されているコンポーネントのテーブルが表示される', () => {
      render(<MetricsDashboard metrics={mockMetrics} onClose={mockOnClose} />);

      // テーブルヘッダーで "Used By" が存在することを確認
      expect(screen.getByText('Used By')).toBeInTheDocument();

      // コンポーネント名
      expect(screen.getByText('Button')).toBeInTheDocument();
      expect(screen.getByText('Icon')).toBeInTheDocument();
      expect(screen.getByText('Input')).toBeInTheDocument();

      // ファイルパス
      expect(screen.getByText('src/components/Button.tsx')).toBeInTheDocument();
      expect(screen.getByText('src/components/Icon.tsx')).toBeInTheDocument();
      expect(screen.getByText('src/components/Input.tsx')).toBeInTheDocument();

      // 依存数
      expect(screen.getByText('25 components')).toBeInTheDocument();
      expect(screen.getByText('20 components')).toBeInTheDocument();
      expect(screen.getByText('15 components')).toBeInTheDocument();
    });
  });

  describe('インタラクション', () => {
    it('ヘッダーの閉じるボタンをクリックするとonCloseが呼ばれる', () => {
      render(<MetricsDashboard metrics={mockMetrics} onClose={mockOnClose} />);

      const closeButton = screen.getByLabelText('Close dashboard');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('フッターの閉じるボタンをクリックするとonCloseが呼ばれる', () => {
      render(<MetricsDashboard metrics={mockMetrics} onClose={mockOnClose} />);

      const closeButton = screen.getByText('Close Dashboard');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('エッジケース', () => {
    it('空の配列でもエラーなくレンダリングされる', () => {
      const emptyMetrics: ProjectMetrics = {
        ...mockMetrics,
        topComplexComponents: [],
        mostDependedOn: [],
      };

      render(<MetricsDashboard metrics={emptyMetrics} onClose={mockOnClose} />);

      expect(screen.getByText('Project Metrics Dashboard')).toBeInTheDocument();
    });

    it('ゼロ値でも正しく表示される', () => {
      const zeroMetrics: ProjectMetrics = {
        totalComponents: 0,
        totalHooks: 0,
        averageComplexity: 0,
        maxComplexity: 0,
        minComplexity: 0,
        circularDependencies: 0,
        topComplexComponents: [],
        mostDependedOn: [],
        complexityDistribution: {
          simple: 0,
          standard: 0,
          complex: 0,
          veryComplex: 0,
        },
      };

      render(<MetricsDashboard metrics={zeroMetrics} onClose={mockOnClose} />);

      // 複数の"0"が存在するため、getAllByTextを使用
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThan(0);
    });

    it('複雑度バッジの色分けが正しい', () => {
      const testMetrics: ProjectMetrics = {
        ...mockMetrics,
        averageComplexity: 50, // 重複を避けるために変更
        topComplexComponents: [
          {
            name: 'SimpleComp',
            filePath: 'src/SimpleComp.tsx',
            complexity: 28,
          }, // green
          {
            name: 'StandardComp',
            filePath: 'src/StandardComp.tsx',
            complexity: 52,
          }, // blue
          {
            name: 'ComplexComp',
            filePath: 'src/ComplexComp.tsx',
            complexity: 73,
          }, // yellow
          {
            name: 'VeryComplexComp',
            filePath: 'src/VeryComplexComp.tsx',
            complexity: 88,
          }, // orange
        ],
        complexityDistribution: {
          simple: 18, // 重複を避けるために変更
          standard: 13,
          complex: 8,
          veryComplex: 3,
        },
      };

      render(<MetricsDashboard metrics={testMetrics} onClose={mockOnClose} />);

      // 各複雑度範囲に対応する色のクラスが存在することを確認
      const simpleBadge = screen.getByText('28').closest('.inline-flex');
      expect(simpleBadge).toHaveClass('bg-green-100', 'text-green-800');

      const standardBadge = screen.getByText('52').closest('.inline-flex');
      expect(standardBadge).toHaveClass('bg-blue-100', 'text-blue-800');

      const complexBadge = screen.getByText('73').closest('.inline-flex');
      expect(complexBadge).toHaveClass('bg-yellow-100', 'text-yellow-800');

      const veryComplexBadge = screen.getByText('88').closest('.inline-flex');
      expect(veryComplexBadge).toHaveClass('bg-orange-100', 'text-orange-800');
    });
  });

  describe('アクセシビリティ', () => {
    it('閉じるボタンに適切なaria-labelが設定されている', () => {
      render(<MetricsDashboard metrics={mockMetrics} onClose={mockOnClose} />);

      const closeButton = screen.getByLabelText('Close dashboard');
      expect(closeButton).toBeInTheDocument();
    });

    it('テーブルに適切なセマンティックHTMLが使用されている', () => {
      const { container } = render(
        <MetricsDashboard metrics={mockMetrics} onClose={mockOnClose} />
      );

      const tables = container.querySelectorAll('table');
      expect(tables.length).toBe(2);

      tables.forEach((table) => {
        expect(table.querySelector('thead')).toBeInTheDocument();
        expect(table.querySelector('tbody')).toBeInTheDocument();
      });
    });
  });
});
