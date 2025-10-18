import { describe, it, expect } from 'vitest';
import { applyLayout } from './layoutAlgorithm';
import type { Node, Edge } from '@xyflow/react';

describe('レイアウトアルゴリズム', () => {
  const createNode = (id: string): Node => ({
    id,
    type: 'default',
    position: { x: 0, y: 0 },
    data: {},
  });

  const createEdge = (source: string, target: string): Edge => ({
    id: `${source}-${target}`,
    source,
    target,
  });

  describe('ツリーレイアウト', () => {
    it('ルートノードをレベル0に配置できること', () => {
      const nodes: Node[] = [createNode('1'), createNode('2')];
      const edges: Edge[] = [];

      const layouted = applyLayout(nodes, edges, 'tree');

      // Root nodes should be at y=50 (level 0)
      expect(layouted[0].position.y).toBe(50);
      expect(layouted[1].position.y).toBe(50);
    });

    it('階層的なレベルを作成できること', () => {
      const nodes: Node[] = [createNode('1'), createNode('2'), createNode('3')];
      const edges: Edge[] = [createEdge('1', '2'), createEdge('2', '3')];

      const layouted = applyLayout(nodes, edges, 'tree');

      const node1 = layouted.find((n) => n.id === '1')!;
      const node2 = layouted.find((n) => n.id === '2')!;
      const node3 = layouted.find((n) => n.id === '3')!;

      // Each level should be 200px apart
      expect(node1.position.y).toBe(50); // Level 0
      expect(node2.position.y).toBe(250); // Level 1
      expect(node3.position.y).toBe(450); // Level 2
    });

    it('同じレベルのノードを水平に配置できること', () => {
      const nodes: Node[] = [createNode('root'), createNode('child1'), createNode('child2')];
      const edges: Edge[] = [createEdge('root', 'child1'), createEdge('root', 'child2')];

      const layouted = applyLayout(nodes, edges, 'tree');

      const child1 = layouted.find((n) => n.id === 'child1')!;
      const child2 = layouted.find((n) => n.id === 'child2')!;

      // Both children should be at the same y level
      expect(child1.position.y).toBe(child2.position.y);
      expect(child1.position.y).toBe(250); // Level 1

      // Should be horizontally separated
      expect(child1.position.x).not.toBe(child2.position.x);
    });

    it('複数のルートノードを処理できること', () => {
      const nodes: Node[] = [
        createNode('root1'),
        createNode('root2'),
        createNode('child1'),
        createNode('child2'),
      ];
      const edges: Edge[] = [createEdge('root1', 'child1'), createEdge('root2', 'child2')];

      const layouted = applyLayout(nodes, edges, 'tree');

      const root1 = layouted.find((n) => n.id === 'root1')!;
      const root2 = layouted.find((n) => n.id === 'root2')!;

      // Both roots should be at level 0
      expect(root1.position.y).toBe(50);
      expect(root2.position.y).toBe(50);
    });

    it('複雑なツリー構造を処理できること', () => {
      //       1
      //      / \
      //     2   3
      //    / \
      //   4   5
      const nodes: Node[] = [
        createNode('1'),
        createNode('2'),
        createNode('3'),
        createNode('4'),
        createNode('5'),
      ];
      const edges: Edge[] = [
        createEdge('1', '2'),
        createEdge('1', '3'),
        createEdge('2', '4'),
        createEdge('2', '5'),
      ];

      const layouted = applyLayout(nodes, edges, 'tree');

      expect(layouted.find((n) => n.id === '1')!.position.y).toBe(50); // Level 0
      expect(layouted.find((n) => n.id === '2')!.position.y).toBe(250); // Level 1
      expect(layouted.find((n) => n.id === '3')!.position.y).toBe(250); // Level 1
      expect(layouted.find((n) => n.id === '4')!.position.y).toBe(450); // Level 2
      expect(layouted.find((n) => n.id === '5')!.position.y).toBe(450); // Level 2
    });

    it('孤立したノードを処理できること', () => {
      const nodes: Node[] = [createNode('1'), createNode('2'), createNode('isolated')];
      const edges: Edge[] = [createEdge('1', '2')];

      const layouted = applyLayout(nodes, edges, 'tree');

      // Isolated node should be treated as root
      const isolated = layouted.find((n) => n.id === 'isolated')!;
      expect(isolated.position.y).toBe(50); // Level 0
    });
  });

  describe('フォースレイアウト', () => {
    it('ノードを円形に配置できること', () => {
      const nodes: Node[] = [createNode('1'), createNode('2'), createNode('3'), createNode('4')];
      const edges: Edge[] = [];

      const layouted = applyLayout(nodes, edges, 'force');

      // All nodes should be positioned
      layouted.forEach((node) => {
        expect(node.position.x).toBeDefined();
        expect(node.position.y).toBeDefined();
        expect(typeof node.position.x).toBe('number');
        expect(typeof node.position.y).toBe('number');
      });

      // Check that nodes are not all at the same position
      const positions = layouted.map((n) => `${n.position.x},${n.position.y}`);
      const uniquePositions = new Set(positions);
      expect(uniquePositions.size).toBe(nodes.length);
    });

    it('ノード数に基づいて円のサイズをスケールできること', () => {
      const smallGraph: Node[] = [createNode('1'), createNode('2')];
      const largeGraph: Node[] = Array.from({ length: 20 }, (_, i) => createNode(`${i}`));

      const smallLayout = applyLayout(smallGraph, [], 'force');
      const largeLayout = applyLayout(largeGraph, [], 'force');

      // Calculate average distance from center for both
      const calcAvgDistance = (nodes: Node[]) => {
        const distances = nodes.map((n) =>
          Math.sqrt(Math.pow(n.position.x - 400, 2) + Math.pow(n.position.y - 400, 2))
        );
        return distances.reduce((sum, d) => sum + d, 0) / distances.length;
      };

      const smallAvgDist = calcAvgDistance(smallLayout);
      const largeAvgDist = calcAvgDistance(largeLayout);

      // Larger graph should have larger radius
      expect(largeAvgDist).toBeGreaterThan(smallAvgDist);
    });

    it('ノードを円周上に均等に配置できること', () => {
      const nodes: Node[] = Array.from({ length: 8 }, (_, i) => createNode(`${i}`));

      const layouted = applyLayout(nodes, [], 'force');

      // Calculate angles from center (400, 400)
      const angles = layouted.map((n) =>
        Math.atan2(n.position.y - 400, n.position.x - 400)
      );

      // Sort angles to check distribution
      angles.sort((a, b) => a - b);

      // Expected angle step for 8 nodes
      const expectedStep = (2 * Math.PI) / 8;

      // Check that angles are evenly distributed (with some tolerance)
      for (let i = 1; i < angles.length; i++) {
        const actualStep = angles[i] - angles[i - 1];
        expect(Math.abs(actualStep - expectedStep)).toBeLessThan(0.1);
      }
    });

    it('単一ノードを処理できること', () => {
      const nodes: Node[] = [createNode('1')];

      const layouted = applyLayout(nodes, [], 'force');

      expect(layouted[0].position.x).toBeDefined();
      expect(layouted[0].position.y).toBeDefined();
    });
  });

  describe('レイアウトの選択', () => {
    it('指定時にツリーレイアウトを適用できること', () => {
      const nodes: Node[] = [createNode('1'), createNode('2')];
      const edges: Edge[] = [createEdge('1', '2')];

      const layouted = applyLayout(nodes, edges, 'tree');

      // Tree layout should create levels (different y positions)
      expect(layouted[0].position.y).not.toBe(layouted[1].position.y);
    });

    it('指定時にフォースレイアウトを適用できること', () => {
      const nodes: Node[] = [createNode('1'), createNode('2')];
      const edges: Edge[] = [createEdge('1', '2')];

      const layouted = applyLayout(nodes, edges, 'force');

      // Force layout should position nodes in a circle
      // Check that nodes are positioned
      layouted.forEach((node) => {
        expect(node.position.x).toBeDefined();
        expect(node.position.y).toBeDefined();
      });
    });

    it('不明なレイアウトタイプの場合は元のノードを返すこと', () => {
      const nodes: Node[] = [createNode('1'), createNode('2')];
      const edges: Edge[] = [];

      // @ts-expect-error Testing invalid layout type
      const layouted = applyLayout(nodes, edges, 'unknown');

      // Should return nodes unchanged
      expect(layouted).toEqual(nodes);
    });
  });

  describe('エッジケース', () => {
    it('空のグラフを処理できること', () => {
      const nodes: Node[] = [];
      const edges: Edge[] = [];

      const treeLayout = applyLayout(nodes, edges, 'tree');
      const forceLayout = applyLayout(nodes, edges, 'force');

      expect(treeLayout).toEqual([]);
      expect(forceLayout).toEqual([]);
    });

    it('単一ノードのグラフを処理できること', () => {
      const nodes: Node[] = [createNode('1')];
      const edges: Edge[] = [];

      const treeLayout = applyLayout(nodes, edges, 'tree');
      const forceLayout = applyLayout(nodes, edges, 'force');

      expect(treeLayout).toHaveLength(1);
      expect(forceLayout).toHaveLength(1);
      expect(treeLayout[0].position).toBeDefined();
      expect(forceLayout[0].position).toBeDefined();
    });

    it('ノードのデータとプロパティを保持できること', () => {
      const nodes: Node<{ custom: string }>[] = [
        {
          id: '1',
          type: 'custom',
          position: { x: 0, y: 0 },
          data: { custom: 'data' },
        },
      ];
      const edges: Edge[] = [];

      const layouted = applyLayout(nodes, edges, 'tree');

      expect(layouted[0].id).toBe('1');
      expect(layouted[0].type).toBe('custom');
      expect(layouted[0].data).toEqual({ custom: 'data' });
    });

    it('ツリーレイアウトで循環依存を処理できること', () => {
      const nodes: Node[] = [createNode('1'), createNode('2')];
      const edges: Edge[] = [createEdge('1', '2'), createEdge('2', '1')];

      // Should not crash or infinite loop
      const layouted = applyLayout(nodes, edges, 'tree');

      expect(layouted).toHaveLength(2);
      layouted.forEach((node) => {
        expect(node.position.x).toBeDefined();
        expect(node.position.y).toBeDefined();
      });
    });

    it('既存の位置を持つノードを処理できること', () => {
      const nodes: Node[] = [
        { id: '1', type: 'default', position: { x: 100, y: 200 }, data: {} },
        { id: '2', type: 'default', position: { x: 300, y: 400 }, data: {} },
      ];
      const edges: Edge[] = [];

      const layouted = applyLayout(nodes, edges, 'tree');

      // Positions should be recalculated
      expect(layouted[0].position).not.toEqual({ x: 100, y: 200 });
    });
  });
});
