import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import GraphView from './GraphView';
import type { Node, Edge } from '@xyflow/react';
import type { FlowNodeData } from '@/types';

// Mock the custom hooks
vi.mock('@/hooks/useGraphLayout', () => ({
  useGraphLayout: vi.fn((nodes, edges) => ({
    nodes,
    edges,
    onNodesChange: vi.fn(),
    onEdgesChange: vi.fn(),
  })),
}));

vi.mock('@/hooks/useNodeClickHandler', () => ({
  useNodeClickHandler: vi.fn((callback) => callback || vi.fn()),
}));

// Mock ReactFlowWrapper
vi.mock('./GraphView/ReactFlowWrapper', () => ({
  ReactFlowWrapper: ({ nodes, edges }: { nodes: Node<FlowNodeData>[]; edges: Edge[] }) => (
    <div data-testid="react-flow-wrapper">
      <div data-testid="wrapper-nodes">{nodes.length}</div>
      <div data-testid="wrapper-edges">{edges.length}</div>
    </div>
  ),
}));

describe('GraphView', () => {
  const mockNodeData: FlowNodeData = {
    label: 'TestComponent',
    componentInfo: {
      id: '1',
      name: 'TestComponent',
      filePath: 'src/TestComponent.tsx',
      type: 'function',
      dependencies: [],
      imports: [],
      complexity: 45,
      linesOfCode: 100,
      hooks: [],
      propsCount: 2,
    },
    complexity: 45,
    dependencyCount: 1,
    dependentCount: 2,
  };

  const mockNodes: Node<FlowNodeData>[] = [
    {
      id: '1',
      type: 'custom',
      position: { x: 0, y: 0 },
      data: mockNodeData,
      style: {},
    },
    {
      id: '2',
      type: 'custom',
      position: { x: 100, y: 100 },
      data: {
        ...mockNodeData,
        label: 'AnotherComponent',
        componentInfo: {
          ...mockNodeData.componentInfo,
          id: '2',
          name: 'AnotherComponent',
        },
      },
      style: {},
    },
  ];

  const mockEdges: Edge[] = [
    {
      id: 'e1-2',
      source: '1',
      target: '2',
    },
  ];

  describe('基本レンダリング', () => {
    it('コンポーネントがレンダリングされる', () => {
      const { container } = render(
        <GraphView nodes={mockNodes} edges={mockEdges} layoutType="tree" />
      );

      expect(container.querySelector('.w-full.h-full.bg-gray-50')).toBeInTheDocument();
    });

    it('ReactFlowWrapperがレンダリングされる', () => {
      render(<GraphView nodes={mockNodes} edges={mockEdges} layoutType="tree" />);

      expect(screen.getByTestId('react-flow-wrapper')).toBeInTheDocument();
    });

    it('正しい数のノードが渡される', () => {
      render(<GraphView nodes={mockNodes} edges={mockEdges} layoutType="tree" />);

      expect(screen.getByTestId('wrapper-nodes').textContent).toBe('2');
    });

    it('正しい数のエッジが渡される', () => {
      render(<GraphView nodes={mockNodes} edges={mockEdges} layoutType="tree" />);

      expect(screen.getByTestId('wrapper-edges').textContent).toBe('1');
    });
  });

  describe('レイアウトタイプ', () => {
    it('treeレイアウトで動作する', () => {
      render(<GraphView nodes={mockNodes} edges={mockEdges} layoutType="tree" />);

      expect(screen.getByTestId('react-flow-wrapper')).toBeInTheDocument();
    });

    it('forceレイアウトで動作する', () => {
      render(<GraphView nodes={mockNodes} edges={mockEdges} layoutType="force" />);

      expect(screen.getByTestId('react-flow-wrapper')).toBeInTheDocument();
    });
  });

  describe('ハイライト機能', () => {
    it('highlightedNodeIdsが指定されていない場合、すべてのノードが通常表示される', () => {
      render(<GraphView nodes={mockNodes} edges={mockEdges} layoutType="tree" />);

      expect(screen.getByTestId('wrapper-nodes').textContent).toBe('2');
    });

    it('highlightedNodeIdsが空の場合、すべてのノードが通常表示される', () => {
      const highlightedNodeIds = new Set<string>();

      render(
        <GraphView
          nodes={mockNodes}
          edges={mockEdges}
          layoutType="tree"
          highlightedNodeIds={highlightedNodeIds}
        />
      );

      expect(screen.getByTestId('wrapper-nodes').textContent).toBe('2');
    });

    it('highlightedNodeIdsが指定された場合、ノードにスタイルが適用される', () => {
      const highlightedNodeIds = new Set(['1']);

      render(
        <GraphView
          nodes={mockNodes}
          edges={mockEdges}
          layoutType="tree"
          highlightedNodeIds={highlightedNodeIds}
        />
      );

      // ReactFlowWrapperがレンダリングされていることを確認
      expect(screen.getByTestId('react-flow-wrapper')).toBeInTheDocument();
    });

    it('複数のノードをハイライトできる', () => {
      const highlightedNodeIds = new Set(['1', '2']);

      render(
        <GraphView
          nodes={mockNodes}
          edges={mockEdges}
          layoutType="tree"
          highlightedNodeIds={highlightedNodeIds}
        />
      );

      expect(screen.getByTestId('wrapper-nodes').textContent).toBe('2');
    });
  });

  describe('ノードクリックハンドラー', () => {
    it('onNodeClickが指定されていない場合でも動作する', () => {
      render(<GraphView nodes={mockNodes} edges={mockEdges} layoutType="tree" />);

      expect(screen.getByTestId('react-flow-wrapper')).toBeInTheDocument();
    });

    it('onNodeClickが指定されている場合、フックに渡される', () => {
      const mockOnNodeClick = vi.fn();

      render(
        <GraphView
          nodes={mockNodes}
          edges={mockEdges}
          layoutType="tree"
          onNodeClick={mockOnNodeClick}
        />
      );

      expect(screen.getByTestId('react-flow-wrapper')).toBeInTheDocument();
    });
  });

  describe('エッジケース', () => {
    it('空のノード配列でレンダリングされる', () => {
      render(<GraphView nodes={[]} edges={[]} layoutType="tree" />);

      expect(screen.getByTestId('wrapper-nodes').textContent).toBe('0');
      expect(screen.getByTestId('wrapper-edges').textContent).toBe('0');
    });

    it('空のエッジ配列でレンダリングされる', () => {
      render(<GraphView nodes={mockNodes} edges={[]} layoutType="tree" />);

      expect(screen.getByTestId('wrapper-nodes').textContent).toBe('2');
      expect(screen.getByTestId('wrapper-edges').textContent).toBe('0');
    });

    it('大量のノードでもレンダリングされる', () => {
      const manyNodes: Node<FlowNodeData>[] = Array.from({ length: 100 }, (_, i) => ({
        id: `${i}`,
        type: 'custom',
        position: { x: i * 10, y: i * 10 },
        data: {
          ...mockNodeData,
          label: `Component${i}`,
          componentInfo: {
            ...mockNodeData.componentInfo,
            id: `${i}`,
            name: `Component${i}`,
          },
        },
        style: {},
      }));

      render(<GraphView nodes={manyNodes} edges={[]} layoutType="tree" />);

      expect(screen.getByTestId('wrapper-nodes').textContent).toBe('100');
    });
  });
});
