import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DetailPanel from './DetailPanel';
import type { ComponentInfo } from '@/types';

describe('DetailPanel', () => {
  const mockOnClose = vi.fn();

  const mockComponent: ComponentInfo = {
    id: '1',
    name: 'TestComponent',
    filePath: 'src/components/TestComponent.tsx',
    type: 'function',
    dependencies: ['Button', 'Icon'],
    imports: [
      { source: 'react', specifiers: ['useState', 'useEffect'], isReactComponent: false },
      { source: './Button', specifiers: ['Button'], isReactComponent: true },
      { source: 'lodash', specifiers: ['debounce'], isReactComponent: false },
    ],
    complexity: 45,
    linesOfCode: 150,
    hooks: [
      { name: 'useState', count: 3 },
      { name: 'useEffect', count: 2 },
    ],
    propsCount: 5,
    propsInfo: {
      name: 'TestComponentProps',
      properties: [
        { name: 'title', type: 'string', required: true },
        { name: 'onClick', type: '() => void', required: true },
        { name: 'disabled', type: 'boolean', required: false, defaultValue: 'false' },
      ],
    },
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('基本レンダリング', () => {
    it('コンポーネントがnullの場合、何も表示されない', () => {
      const { container } = render(<DetailPanel component={null} onClose={mockOnClose} />);
      expect(container.firstChild).toBeNull();
    });

    it('ヘッダーが表示される', () => {
      render(<DetailPanel component={mockComponent} onClose={mockOnClose} />);
      expect(screen.getByText('Component Details')).toBeInTheDocument();
    });

    it('閉じるボタンが表示される', () => {
      render(<DetailPanel component={mockComponent} onClose={mockOnClose} />);
      expect(screen.getByLabelText('Close panel')).toBeInTheDocument();
    });

    it('閉じるボタンをクリックするとonCloseが呼ばれる', () => {
      render(<DetailPanel component={mockComponent} onClose={mockOnClose} />);

      const closeButton = screen.getByLabelText('Close panel');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('基本情報セクション', () => {
    it('コンポーネント名が表示される', () => {
      render(<DetailPanel component={mockComponent} onClose={mockOnClose} />);
      expect(screen.getByText('TestComponent')).toBeInTheDocument();
    });

    it('ファイルパスが表示される', () => {
      render(<DetailPanel component={mockComponent} onClose={mockOnClose} />);
      expect(screen.getByText('src/components/TestComponent.tsx')).toBeInTheDocument();
    });

    it('コンポーネントタイプが表示される', () => {
      render(<DetailPanel component={mockComponent} onClose={mockOnClose} />);
      expect(screen.getByText('function')).toBeInTheDocument();
    });

    it('コード行数が表示される', () => {
      render(<DetailPanel component={mockComponent} onClose={mockOnClose} />);
      expect(screen.getByText('150')).toBeInTheDocument();
    });
  });

  describe('複雑度分析', () => {
    it('複雑度スコアが表示される', () => {
      render(<DetailPanel component={mockComponent} onClose={mockOnClose} />);
      expect(screen.getByText('45 / 100')).toBeInTheDocument();
    });

    it('Standard複雑度レベルが表示される', () => {
      render(<DetailPanel component={mockComponent} onClose={mockOnClose} />);
      expect(screen.getByText('Standard')).toBeInTheDocument();
    });

    it('Simple複雑度の場合、正しいレベルが表示される', () => {
      const simpleComponent: ComponentInfo = {
        ...mockComponent,
        complexity: 25,
      };

      render(<DetailPanel component={simpleComponent} onClose={mockOnClose} />);
      expect(screen.getByText('Simple')).toBeInTheDocument();
    });

    it('Complex複雑度の場合、正しいレベルが表示される', () => {
      const complexComponent: ComponentInfo = {
        ...mockComponent,
        complexity: 70,
      };

      render(<DetailPanel component={complexComponent} onClose={mockOnClose} />);
      expect(screen.getByText('Complex')).toBeInTheDocument();
    });

    it('Very Complex複雑度の場合、正しいレベルが表示される', () => {
      const veryComplexComponent: ComponentInfo = {
        ...mockComponent,
        complexity: 85,
      };

      render(<DetailPanel component={veryComplexComponent} onClose={mockOnClose} />);
      expect(screen.getByText('Very Complex')).toBeInTheDocument();
    });
  });

  describe('依存関係セクション', () => {
    it('依存関係の数が表示される', () => {
      render(<DetailPanel component={mockComponent} onClose={mockOnClose} />);
      expect(screen.getByText('Dependencies (2)')).toBeInTheDocument();
    });

    it('依存関係のリストが表示される', () => {
      render(<DetailPanel component={mockComponent} onClose={mockOnClose} />);
      expect(screen.getByText('Button')).toBeInTheDocument();
      expect(screen.getByText('Icon')).toBeInTheDocument();
    });

    it('依存関係がない場合、メッセージが表示される', () => {
      const noDepsComponent: ComponentInfo = {
        ...mockComponent,
        dependencies: [],
      };

      render(<DetailPanel component={noDepsComponent} onClose={mockOnClose} />);
      expect(screen.getByText('No dependencies')).toBeInTheDocument();
    });
  });

  describe('React Hooksセクション', () => {
    it('Hooksの総数が表示される', () => {
      render(<DetailPanel component={mockComponent} onClose={mockOnClose} />);
      expect(screen.getByText('React Hooks (5)')).toBeInTheDocument();
    });

    it('各Hookの名前と使用回数が表示される', () => {
      render(<DetailPanel component={mockComponent} onClose={mockOnClose} />);
      expect(screen.getByText('useState')).toBeInTheDocument();
      expect(screen.getByText('3x')).toBeInTheDocument();
      expect(screen.getByText('useEffect')).toBeInTheDocument();
      expect(screen.getByText('2x')).toBeInTheDocument();
    });

    it('Hooksがない場合、セクション自体が表示されない', () => {
      const noHooksComponent: ComponentInfo = {
        ...mockComponent,
        hooks: [],
      };

      render(<DetailPanel component={noHooksComponent} onClose={mockOnClose} />);
      expect(screen.queryByText(/React Hooks/)).not.toBeInTheDocument();
    });
  });

  describe('Props情報セクション', () => {
    it('Propsの数が表示される', () => {
      render(<DetailPanel component={mockComponent} onClose={mockOnClose} />);
      expect(screen.getByText('Props (3)')).toBeInTheDocument();
    });

    it('Propsの型名が表示される', () => {
      render(<DetailPanel component={mockComponent} onClose={mockOnClose} />);
      expect(screen.getByText('Type: TestComponentProps')).toBeInTheDocument();
    });

    it('各Propの情報が表示される', () => {
      render(<DetailPanel component={mockComponent} onClose={mockOnClose} />);
      expect(screen.getByText('title')).toBeInTheDocument();
      expect(screen.getByText('onClick')).toBeInTheDocument();
      expect(screen.getByText('disabled')).toBeInTheDocument();
    });

    it('オプショナルなPropにはoptionalマークが表示される', () => {
      render(<DetailPanel component={mockComponent} onClose={mockOnClose} />);
      expect(screen.getByText('optional')).toBeInTheDocument();
    });

    it('デフォルト値が表示される', () => {
      render(<DetailPanel component={mockComponent} onClose={mockOnClose} />);
      expect(screen.getByText('Default: false')).toBeInTheDocument();
    });

    it('propsInfoがない場合、セクション自体が表示されない', () => {
      const noPropsInfoComponent: ComponentInfo = {
        ...mockComponent,
        propsInfo: undefined,
      };

      render(<DetailPanel component={noPropsInfoComponent} onClose={mockOnClose} />);
      expect(screen.queryByText(/Props \(/)).not.toBeInTheDocument();
    });
  });

  describe('外部ライブラリセクション', () => {
    it('外部ライブラリが表示される', () => {
      render(<DetailPanel component={mockComponent} onClose={mockOnClose} />);

      // "lodash" は外部ライブラリと全インポートの両方に表示されるため、getAllByTextを使用
      const lodashElements = screen.getAllByText('lodash');
      expect(lodashElements.length).toBeGreaterThan(0);
      expect(screen.getByText('debounce')).toBeInTheDocument();
    });

    it('reactとreact-domは外部ライブラリに含まれない', () => {
      render(<DetailPanel component={mockComponent} onClose={mockOnClose} />);
      const externalLibSection = screen.getByText('External Libraries').parentElement;

      // reactの場合は、外部ライブラリセクションに表示されないことを確認
      expect(externalLibSection?.textContent).not.toContain('react');
    });

    it('外部ライブラリがない場合、メッセージが表示される', () => {
      const noExternalLibsComponent: ComponentInfo = {
        ...mockComponent,
        imports: [
          // ローカルインポートのみ
          { source: './Button', specifiers: ['Button'], isReactComponent: true },
          { source: './Icon', specifiers: ['Icon'], isReactComponent: true },
        ],
      };

      render(<DetailPanel component={noExternalLibsComponent} onClose={mockOnClose} />);

      // "No external libraries" メッセージを確認
      expect(screen.getByText('No external libraries')).toBeInTheDocument();
    });
  });

  describe('全インポートセクション', () => {
    it('インポートの総数が表示される', () => {
      render(<DetailPanel component={mockComponent} onClose={mockOnClose} />);
      expect(screen.getByText('All Imports (3)')).toBeInTheDocument();
    });

    it('すべてのインポートソースが表示される', () => {
      render(<DetailPanel component={mockComponent} onClose={mockOnClose} />);

      const allImports = screen.getByText('All Imports (3)').parentElement;
      expect(allImports?.textContent).toContain('react');
      expect(allImports?.textContent).toContain('./Button');
      expect(allImports?.textContent).toContain('lodash');
    });

    it('Reactコンポーネントのインポートにバッジが表示される', () => {
      render(<DetailPanel component={mockComponent} onClose={mockOnClose} />);
      expect(screen.getByText('Component')).toBeInTheDocument();
    });
  });

  describe('エッジケース', () => {
    it('空の配列でもエラーなくレンダリングされる', () => {
      const minimalComponent: ComponentInfo = {
        id: '1',
        name: 'Minimal',
        filePath: 'src/Minimal.tsx',
        type: 'function',
        dependencies: [],
        imports: [],
        complexity: 10,
        linesOfCode: 20,
        hooks: [],
        propsCount: 0,
      };

      render(<DetailPanel component={minimalComponent} onClose={mockOnClose} />);

      expect(screen.getByText('Minimal')).toBeInTheDocument();
      expect(screen.getByText('No dependencies')).toBeInTheDocument();
      expect(screen.getByText('No external libraries')).toBeInTheDocument();
    });

    it('複雑度が0の場合も正しく表示される', () => {
      const zeroComplexityComponent: ComponentInfo = {
        ...mockComponent,
        complexity: 0,
      };

      render(<DetailPanel component={zeroComplexityComponent} onClose={mockOnClose} />);
      expect(screen.getByText('0 / 100')).toBeInTheDocument();
      expect(screen.getByText('Simple')).toBeInTheDocument();
    });

    it('複雑度が100の場合も正しく表示される', () => {
      const maxComplexityComponent: ComponentInfo = {
        ...mockComponent,
        complexity: 100,
      };

      render(<DetailPanel component={maxComplexityComponent} onClose={mockOnClose} />);
      expect(screen.getByText('100 / 100')).toBeInTheDocument();
      expect(screen.getByText('Very Complex')).toBeInTheDocument();
    });
  });
});
