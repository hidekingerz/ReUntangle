import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Header from './Header';

describe('Header', () => {
  const mockOnLayoutChange = vi.fn();
  const mockOnReset = vi.fn();
  const mockOnShowMetrics = vi.fn();

  const mockStats = {
    projectName: 'MyProject',
    filesScanned: 150,
    componentsFound: 45,
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('基本レンダリング', () => {
    it('タイトルと説明が表示される', () => {
      render(
        <Header
          hasGraphData={false}
          layoutType="tree"
          onLayoutChange={mockOnLayoutChange}
          onReset={mockOnReset}
          stats={null}
        />
      );

      expect(screen.getByText('ReUntangle')).toBeInTheDocument();
      expect(screen.getByText('Visualize and untangle React component dependencies')).toBeInTheDocument();
    });

    it('グラフデータがない場合、コントロールが表示されない', () => {
      render(
        <Header
          hasGraphData={false}
          layoutType="tree"
          onLayoutChange={mockOnLayoutChange}
          onReset={mockOnReset}
          stats={null}
        />
      );

      expect(screen.queryByText('Tree Layout')).not.toBeInTheDocument();
      expect(screen.queryByText('Force Layout')).not.toBeInTheDocument();
      expect(screen.queryByText('Select New Folder')).not.toBeInTheDocument();
    });
  });

  describe('レイアウトコントロール', () => {
    it('グラフデータがある場合、レイアウトボタンが表示される', () => {
      render(
        <Header
          hasGraphData={true}
          layoutType="tree"
          onLayoutChange={mockOnLayoutChange}
          onReset={mockOnReset}
          stats={mockStats}
        />
      );

      expect(screen.getByText('Tree Layout')).toBeInTheDocument();
      expect(screen.getByText('Force Layout')).toBeInTheDocument();
    });

    it('Tree Layoutが選択されている場合、正しいスタイルが適用される', () => {
      render(
        <Header
          hasGraphData={true}
          layoutType="tree"
          onLayoutChange={mockOnLayoutChange}
          onReset={mockOnReset}
          stats={mockStats}
        />
      );

      const treeButton = screen.getByText('Tree Layout');
      const forceButton = screen.getByText('Force Layout');

      expect(treeButton).toHaveClass('bg-blue-600', 'text-white');
      expect(forceButton).toHaveClass('bg-gray-200', 'text-gray-700');
    });

    it('Force Layoutが選択されている場合、正しいスタイルが適用される', () => {
      render(
        <Header
          hasGraphData={true}
          layoutType="force"
          onLayoutChange={mockOnLayoutChange}
          onReset={mockOnReset}
          stats={mockStats}
        />
      );

      const treeButton = screen.getByText('Tree Layout');
      const forceButton = screen.getByText('Force Layout');

      expect(treeButton).toHaveClass('bg-gray-200', 'text-gray-700');
      expect(forceButton).toHaveClass('bg-blue-600', 'text-white');
    });

    it('Tree LayoutボタンをクリックするとonLayoutChangeが呼ばれる', () => {
      render(
        <Header
          hasGraphData={true}
          layoutType="force"
          onLayoutChange={mockOnLayoutChange}
          onReset={mockOnReset}
          stats={mockStats}
        />
      );

      const treeButton = screen.getByText('Tree Layout');
      fireEvent.click(treeButton);

      expect(mockOnLayoutChange).toHaveBeenCalledTimes(1);
      expect(mockOnLayoutChange).toHaveBeenCalledWith('tree');
    });

    it('Force LayoutボタンをクリックするとonLayoutChangeが呼ばれる', () => {
      render(
        <Header
          hasGraphData={true}
          layoutType="tree"
          onLayoutChange={mockOnLayoutChange}
          onReset={mockOnReset}
          stats={mockStats}
        />
      );

      const forceButton = screen.getByText('Force Layout');
      fireEvent.click(forceButton);

      expect(mockOnLayoutChange).toHaveBeenCalledTimes(1);
      expect(mockOnLayoutChange).toHaveBeenCalledWith('force');
    });
  });

  describe('メトリクスボタン', () => {
    it('onShowMetricsが提供されている場合、メトリクスボタンが表示される', () => {
      render(
        <Header
          hasGraphData={true}
          layoutType="tree"
          onLayoutChange={mockOnLayoutChange}
          onReset={mockOnReset}
          onShowMetrics={mockOnShowMetrics}
          stats={mockStats}
        />
      );

      expect(screen.getByText('📊 Show Metrics')).toBeInTheDocument();
    });

    it('onShowMetricsが提供されていない場合、メトリクスボタンが表示されない', () => {
      render(
        <Header
          hasGraphData={true}
          layoutType="tree"
          onLayoutChange={mockOnLayoutChange}
          onReset={mockOnReset}
          stats={mockStats}
        />
      );

      expect(screen.queryByText('📊 Show Metrics')).not.toBeInTheDocument();
    });

    it('メトリクスボタンをクリックするとonShowMetricsが呼ばれる', () => {
      render(
        <Header
          hasGraphData={true}
          layoutType="tree"
          onLayoutChange={mockOnLayoutChange}
          onReset={mockOnReset}
          onShowMetrics={mockOnShowMetrics}
          stats={mockStats}
        />
      );

      const metricsButton = screen.getByText('📊 Show Metrics');
      fireEvent.click(metricsButton);

      expect(mockOnShowMetrics).toHaveBeenCalledTimes(1);
    });
  });

  describe('リセットボタン', () => {
    it('グラフデータがある場合、リセットボタンが表示される', () => {
      render(
        <Header
          hasGraphData={true}
          layoutType="tree"
          onLayoutChange={mockOnLayoutChange}
          onReset={mockOnReset}
          stats={mockStats}
        />
      );

      expect(screen.getByText('Select New Folder')).toBeInTheDocument();
    });

    it('リセットボタンをクリックするとonResetが呼ばれる', () => {
      render(
        <Header
          hasGraphData={true}
          layoutType="tree"
          onLayoutChange={mockOnLayoutChange}
          onReset={mockOnReset}
          stats={mockStats}
        />
      );

      const resetButton = screen.getByText('Select New Folder');
      fireEvent.click(resetButton);

      expect(mockOnReset).toHaveBeenCalledTimes(1);
    });
  });

  describe('統計情報', () => {
    it('統計情報がある場合、表示される', () => {
      render(
        <Header
          hasGraphData={true}
          layoutType="tree"
          onLayoutChange={mockOnLayoutChange}
          onReset={mockOnReset}
          stats={mockStats}
        />
      );

      expect(screen.getByText('Project:')).toBeInTheDocument();
      expect(screen.getByText('MyProject')).toBeInTheDocument();
      expect(screen.getByText('Files Scanned:')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('Components Found:')).toBeInTheDocument();
      expect(screen.getByText('45')).toBeInTheDocument();
    });

    it('統計情報がnullの場合、表示されない', () => {
      render(
        <Header
          hasGraphData={true}
          layoutType="tree"
          onLayoutChange={mockOnLayoutChange}
          onReset={mockOnReset}
          stats={null}
        />
      );

      expect(screen.queryByText('Project:')).not.toBeInTheDocument();
      expect(screen.queryByText('Files Scanned:')).not.toBeInTheDocument();
      expect(screen.queryByText('Components Found:')).not.toBeInTheDocument();
    });

    it('統計情報の値がゼロでも表示される', () => {
      const zeroStats = {
        projectName: 'EmptyProject',
        filesScanned: 0,
        componentsFound: 0,
      };

      render(
        <Header
          hasGraphData={true}
          layoutType="tree"
          onLayoutChange={mockOnLayoutChange}
          onReset={mockOnReset}
          stats={zeroStats}
        />
      );

      expect(screen.getByText('EmptyProject')).toBeInTheDocument();
      expect(screen.getAllByText('0').length).toBeGreaterThan(0);
    });
  });

  describe('複合シナリオ', () => {
    it('すべての機能が有効な場合、正しく表示される', () => {
      render(
        <Header
          hasGraphData={true}
          layoutType="tree"
          onLayoutChange={mockOnLayoutChange}
          onReset={mockOnReset}
          onShowMetrics={mockOnShowMetrics}
          stats={mockStats}
        />
      );

      expect(screen.getByText('ReUntangle')).toBeInTheDocument();
      expect(screen.getByText('Tree Layout')).toBeInTheDocument();
      expect(screen.getByText('Force Layout')).toBeInTheDocument();
      expect(screen.getByText('📊 Show Metrics')).toBeInTheDocument();
      expect(screen.getByText('Select New Folder')).toBeInTheDocument();
      expect(screen.getByText('MyProject')).toBeInTheDocument();
    });
  });
});
