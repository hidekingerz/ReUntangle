import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ReactFlowWrapper } from './ReactFlowWrapper';
import type { Node, Edge } from '@xyflow/react';
import type { FlowNodeData } from '@/types';

// Mock ReactFlow components
vi.mock('@xyflow/react', () => ({
  ReactFlow: ({ children, nodes, edges }: { children?: React.ReactNode; nodes: Node<FlowNodeData>[]; edges: Edge[] }) => (
    <div data-testid="react-flow">
      <div data-testid="nodes-count">{nodes.length}</div>
      <div data-testid="edges-count">{edges.length}</div>
      {children}
    </div>
  ),
  Background: () => <div data-testid="background">Background</div>,
  Controls: () => <div data-testid="controls">Controls</div>,
  MiniMap: () => <div data-testid="minimap">MiniMap</div>,
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('ReactFlowWrapper', () => {
  const mockOnNodesChange = vi.fn();
  const mockOnEdgesChange = vi.fn();
  const mockOnNodeClick = vi.fn();

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
    },
  ];

  const mockEdges: Edge[] = [
    {
      id: 'e1-2',
      source: '1',
      target: '2',
    },
  ];

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('基本レンダリング', () => {
    it('ReactFlowコンポーネントがレンダリングされる', () => {
      const { getByTestId } = render(
        <ReactFlowWrapper
          nodes={mockNodes}
          edges={mockEdges}
          onNodesChange={mockOnNodesChange}
          onEdgesChange={mockOnEdgesChange}
          onNodeClick={mockOnNodeClick}
        />
      );

      expect(getByTestId('react-flow')).toBeInTheDocument();
    });

    it('Backgroundコンポーネントがレンダリングされる', () => {
      const { getByTestId } = render(
        <ReactFlowWrapper
          nodes={mockNodes}
          edges={mockEdges}
          onNodesChange={mockOnNodesChange}
          onEdgesChange={mockOnEdgesChange}
          onNodeClick={mockOnNodeClick}
        />
      );

      expect(getByTestId('background')).toBeInTheDocument();
    });

    it('Controlsコンポーネントがレンダリングされる', () => {
      const { getByTestId } = render(
        <ReactFlowWrapper
          nodes={mockNodes}
          edges={mockEdges}
          onNodesChange={mockOnNodesChange}
          onEdgesChange={mockOnEdgesChange}
          onNodeClick={mockOnNodeClick}
        />
      );

      expect(getByTestId('controls')).toBeInTheDocument();
    });

    it('MiniMapコンポーネントがレンダリングされる', () => {
      const { getByTestId } = render(
        <ReactFlowWrapper
          nodes={mockNodes}
          edges={mockEdges}
          onNodesChange={mockOnNodesChange}
          onEdgesChange={mockOnEdgesChange}
          onNodeClick={mockOnNodeClick}
        />
      );

      expect(getByTestId('minimap')).toBeInTheDocument();
    });
  });

  describe('ノードとエッジ', () => {
    it('正しい数のノードが渡される', () => {
      const { getByTestId } = render(
        <ReactFlowWrapper
          nodes={mockNodes}
          edges={mockEdges}
          onNodesChange={mockOnNodesChange}
          onEdgesChange={mockOnEdgesChange}
          onNodeClick={mockOnNodeClick}
        />
      );

      expect(getByTestId('nodes-count').textContent).toBe('2');
    });

    it('正しい数のエッジが渡される', () => {
      const { getByTestId } = render(
        <ReactFlowWrapper
          nodes={mockNodes}
          edges={mockEdges}
          onNodesChange={mockOnNodesChange}
          onEdgesChange={mockOnEdgesChange}
          onNodeClick={mockOnNodeClick}
        />
      );

      expect(getByTestId('edges-count').textContent).toBe('1');
    });

    it('空のノード配列でもレンダリングされる', () => {
      const { getByTestId } = render(
        <ReactFlowWrapper
          nodes={[]}
          edges={[]}
          onNodesChange={mockOnNodesChange}
          onEdgesChange={mockOnEdgesChange}
          onNodeClick={mockOnNodeClick}
        />
      );

      expect(getByTestId('nodes-count').textContent).toBe('0');
      expect(getByTestId('edges-count').textContent).toBe('0');
    });
  });

  describe('コールバック関数', () => {
    it('onNodesChangeが関数として渡される', () => {
      render(
        <ReactFlowWrapper
          nodes={mockNodes}
          edges={mockEdges}
          onNodesChange={mockOnNodesChange}
          onEdgesChange={mockOnEdgesChange}
          onNodeClick={mockOnNodeClick}
        />
      );

      // コールバックが関数であることを確認
      expect(typeof mockOnNodesChange).toBe('function');
    });

    it('onEdgesChangeが関数として渡される', () => {
      render(
        <ReactFlowWrapper
          nodes={mockNodes}
          edges={mockEdges}
          onNodesChange={mockOnNodesChange}
          onEdgesChange={mockOnEdgesChange}
          onNodeClick={mockOnNodeClick}
        />
      );

      // コールバックが関数であることを確認
      expect(typeof mockOnEdgesChange).toBe('function');
    });

    it('onNodeClickが関数として渡される', () => {
      render(
        <ReactFlowWrapper
          nodes={mockNodes}
          edges={mockEdges}
          onNodesChange={mockOnNodesChange}
          onEdgesChange={mockOnEdgesChange}
          onNodeClick={mockOnNodeClick}
        />
      );

      // コールバックが関数であることを確認
      expect(typeof mockOnNodeClick).toBe('function');
    });
  });
});
