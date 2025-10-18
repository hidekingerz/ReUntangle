import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ReactFlowProvider } from '@xyflow/react';
import CustomNode from './CustomNode';
import type { FlowNodeData } from '@/types';

// Helper to render with ReactFlow provider
const renderWithProvider = (component: React.ReactElement) => {
  return render(<ReactFlowProvider>{component}</ReactFlowProvider>);
};

describe('CustomNode', () => {
  const mockNodeData: FlowNodeData = {
    label: 'TestComponent',
    componentInfo: {
      id: '1',
      name: 'TestComponent',
      filePath: 'src/components/TestComponent.tsx',
      type: 'function',
      dependencies: [],
      imports: [],
      complexity: 42,
      linesOfCode: 100,
      hooks: [],
      propsCount: 3,
    },
    complexity: 42,
    dependencyCount: 2,
    dependentCount: 5,
  };

  describe('基本レンダリング', () => {
    it('コンポーネント名が表示される', () => {
      renderWithProvider(<CustomNode data={mockNodeData} />);
      expect(screen.getByText('TestComponent')).toBeInTheDocument();
    });

    it('複雑度が表示される', () => {
      renderWithProvider(<CustomNode data={mockNodeData} />);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('関数コンポーネントの場合、アイコンが表示されない', () => {
      const { container } = renderWithProvider(<CustomNode data={mockNodeData} />);
      expect(container.textContent).not.toContain('⚡');
    });
  });

  describe('フックコンポーネント', () => {
    it('フックの場合、雷アイコンが表示される', () => {
      const hookNodeData: FlowNodeData = {
        ...mockNodeData,
        componentInfo: {
          ...mockNodeData.componentInfo,
          name: 'useCustomHook',
          type: 'hook',
        },
      };

      const { container } = renderWithProvider(<CustomNode data={hookNodeData} />);
      expect(container.textContent).toContain('⚡');
      expect(screen.getByText('useCustomHook')).toBeInTheDocument();
    });
  });

  describe('異なるコンポーネントタイプ', () => {
    it('クラスコンポーネントが正しく表示される', () => {
      const classNodeData: FlowNodeData = {
        ...mockNodeData,
        componentInfo: {
          ...mockNodeData.componentInfo,
          name: 'ClassComponent',
          type: 'class',
        },
      };

      renderWithProvider(<CustomNode data={classNodeData} />);
      expect(screen.getByText('ClassComponent')).toBeInTheDocument();
    });

    it('アロー関数コンポーネントが正しく表示される', () => {
      const arrowNodeData: FlowNodeData = {
        ...mockNodeData,
        componentInfo: {
          ...mockNodeData.componentInfo,
          name: 'ArrowComponent',
          type: 'arrow',
        },
      };

      renderWithProvider(<CustomNode data={arrowNodeData} />);
      expect(screen.getByText('ArrowComponent')).toBeInTheDocument();
    });
  });

  describe('複雑度の値', () => {
    it('複雑度が0の場合も表示される', () => {
      const zeroComplexityData: FlowNodeData = {
        ...mockNodeData,
        complexity: 0,
      };

      renderWithProvider(<CustomNode data={zeroComplexityData} />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('複雑度が100の場合も表示される', () => {
      const highComplexityData: FlowNodeData = {
        ...mockNodeData,
        complexity: 100,
      };

      renderWithProvider(<CustomNode data={highComplexityData} />);
      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });

  describe('コンポーネント名の長さ', () => {
    it('長いコンポーネント名も表示される', () => {
      const longNameData: FlowNodeData = {
        ...mockNodeData,
        componentInfo: {
          ...mockNodeData.componentInfo,
          name: 'VeryLongComponentNameThatMightGetTruncated',
        },
      };

      renderWithProvider(<CustomNode data={longNameData} />);
      expect(screen.getByText('VeryLongComponentNameThatMightGetTruncated')).toBeInTheDocument();
    });

    it('短いコンポーネント名も表示される', () => {
      const shortNameData: FlowNodeData = {
        ...mockNodeData,
        componentInfo: {
          ...mockNodeData.componentInfo,
          name: 'A',
        },
      };

      renderWithProvider(<CustomNode data={shortNameData} />);
      expect(screen.getByText('A')).toBeInTheDocument();
    });
  });
});
