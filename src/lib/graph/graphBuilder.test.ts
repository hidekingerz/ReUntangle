import { describe, it, expect, beforeEach } from 'vitest';
import { GraphBuilder } from './graphBuilder';
import type { ComponentInfo } from '@/types';

describe('GraphBuilder', () => {
  let graphBuilder: GraphBuilder;

  beforeEach(() => {
    graphBuilder = new GraphBuilder();
  });

  // Helper to create mock ComponentInfo
  const createComponent = (
    id: string,
    name: string,
    filePath: string,
    dependencies: string[] = [],
    complexity = 50,
    type: 'function' | 'class' | 'arrow' | 'hook' = 'function'
  ): ComponentInfo => ({
    id,
    name,
    filePath,
    type,
    dependencies,
    complexity,
    linesOfCode: 100,
    hooks: [],
    imports: [],
    propsCount: 0,
  });

  describe('グラフの構築', () => {
    it('シンプルな依存関係グラフを構築できること', () => {
      const components: ComponentInfo[] = [
        createComponent('1', 'ComponentA', 'src/ComponentA.tsx', []),
        createComponent('2', 'ComponentB', 'src/ComponentB.tsx', ['ComponentA']),
      ];

      const graph = graphBuilder.buildGraph(components);

      expect(graph.nodes.size).toBe(2);
      expect(graph.edges.length).toBe(1);

      const nodeA = graph.nodes.get('1')!;
      const nodeB = graph.nodes.get('2')!;

      expect(nodeB.dependencies).toEqual(['1']);
      expect(nodeA.dependents).toEqual(['2']);
      expect(graph.edges[0]).toEqual({ from: '2', to: '1', strength: 1 });
    });

    it('複数の依存関係を処理できること', () => {
      const components: ComponentInfo[] = [
        createComponent('1', 'ComponentA', 'src/ComponentA.tsx', []),
        createComponent('2', 'ComponentB', 'src/ComponentB.tsx', []),
        createComponent('3', 'ComponentC', 'src/ComponentC.tsx', ['ComponentA', 'ComponentB']),
      ];

      const graph = graphBuilder.buildGraph(components);

      expect(graph.nodes.size).toBe(3);
      expect(graph.edges.length).toBe(2);

      const nodeC = graph.nodes.get('3')!;
      expect(nodeC.dependencies).toEqual(['1', '2']);
      expect(nodeC.dependencies.length).toBe(2);
    });

    it('自己依存を正しく処理できること', () => {
      const components: ComponentInfo[] = [
        createComponent('1', 'ComponentA', 'src/ComponentA.tsx', ['ComponentA']),
      ];

      const graph = graphBuilder.buildGraph(components);

      // Self-dependencies should be ignored
      expect(graph.nodes.get('1')!.dependencies).toEqual([]);
      expect(graph.edges.length).toBe(0);
    });

    it('存在しない依存関係を処理できること', () => {
      const components: ComponentInfo[] = [
        createComponent('1', 'ComponentA', 'src/ComponentA.tsx', ['NonExistentComponent']),
      ];

      const graph = graphBuilder.buildGraph(components);

      expect(graph.nodes.get('1')!.dependencies).toEqual([]);
      expect(graph.edges.length).toBe(0);
    });

    it('線形の依存関係チェーンの深さを正しく計算できること', () => {
      const components: ComponentInfo[] = [
        createComponent('1', 'ComponentA', 'src/ComponentA.tsx', []),
        createComponent('2', 'ComponentB', 'src/ComponentB.tsx', ['ComponentA']),
        createComponent('3', 'ComponentC', 'src/ComponentC.tsx', ['ComponentB']),
      ];

      const graph = graphBuilder.buildGraph(components);

      // ComponentC depends on ComponentB depends on ComponentA
      // ComponentC has the deepest dependency chain
      expect(graph.nodes.get('3')!.depth).toBeGreaterThanOrEqual(
        graph.nodes.get('2')!.depth
      );
      expect(graph.nodes.get('2')!.depth).toBeGreaterThanOrEqual(
        graph.nodes.get('1')!.depth
      );
    });

    it('重複した依存関係のエッジ強度を増加させること', () => {
      // Simulate a component that imports the same dependency multiple times
      const components: ComponentInfo[] = [
        createComponent('1', 'ComponentA', 'src/ComponentA.tsx', []),
        createComponent('2', 'ComponentB', 'src/ComponentB.tsx', ['ComponentA', 'ComponentA']),
      ];

      const graph = graphBuilder.buildGraph(components);

      expect(graph.edges.length).toBe(1);
      expect(graph.edges[0].strength).toBe(2);
    });
  });

  describe('ReactFlowグラフの構築', () => {
    it('依存関係グラフをReact Flow形式に変換できること', () => {
      const components: ComponentInfo[] = [
        createComponent('1', 'ComponentA', 'src/ComponentA.tsx', [], 30),
        createComponent('2', 'ComponentB', 'src/ComponentB.tsx', ['ComponentA'], 60),
      ];

      const graph = graphBuilder.buildGraph(components);
      const { nodes, edges } = graphBuilder.buildReactFlowGraph(graph);

      expect(nodes.length).toBe(2);
      expect(edges.length).toBe(1);

      // Check node structure
      expect(nodes[0]).toMatchObject({
        id: '1',
        type: 'default',
        data: expect.objectContaining({
          componentInfo: expect.objectContaining({ name: 'ComponentA' }),
          complexity: 30,
        }),
      });

      // Check edge structure
      expect(edges[0]).toMatchObject({
        id: '2-1',
        source: '2',
        target: '1',
      });
    });

    it('複雑度に基づいて正しい色を適用できること', () => {
      const components: ComponentInfo[] = [
        createComponent('1', 'Simple', 'src/app/page.tsx', ['Standard'], 25), // Root component
        createComponent('2', 'Standard', 'src/Standard.tsx', ['Complex'], 50), // Has dependent (Simple)
        createComponent('3', 'Complex', 'src/Complex.tsx', ['VeryComplex'], 70), // Has dependent (Standard)
        createComponent('4', 'VeryComplex', 'src/VeryComplex.tsx', [], 90), // Has dependent (Complex)
      ];

      const graph = graphBuilder.buildGraph(components);
      const { nodes } = graphBuilder.buildReactFlowGraph(graph);

      // Simple is page.tsx -> Purple (root component, regardless of complexity)
      // Standard (50) with dependents -> Blue
      // Complex (70) with dependents -> Yellow
      // VeryComplex (90) with dependents -> Orange
      const simpleNode = nodes.find((n) => n.data.componentInfo?.name === 'Simple')!;
      const standardNode = nodes.find((n) => n.data.componentInfo?.name === 'Standard')!;
      const complexNode = nodes.find((n) => n.data.componentInfo?.name === 'Complex')!;
      const veryComplexNode = nodes.find((n) => n.data.componentInfo?.name === 'VeryComplex')!;

      expect(simpleNode.style?.backgroundColor).toBe('#8b5cf6'); // Purple (root)
      expect(standardNode.style?.backgroundColor).toBe('#3b82f6'); // Blue
      expect(complexNode.style?.backgroundColor).toBe('#eab308'); // Yellow
      expect(veryComplexNode.style?.backgroundColor).toBe('#f97316'); // Orange
    });

    it('未使用のコンポーネントをグレー色でマークできること', () => {
      const components: ComponentInfo[] = [
        createComponent('1', 'Unused', 'src/Unused.tsx', []),
        createComponent('2', 'Used', 'src/Used.tsx', ['Unused']),
      ];

      const graph = graphBuilder.buildGraph(components);
      const { nodes } = graphBuilder.buildReactFlowGraph(graph);

      // Find the 'Used' component which has no dependents
      const usedNode = nodes.find((n) => n.data.componentInfo.name === 'Used');
      expect(usedNode?.style?.backgroundColor).toBe('#9ca3af'); // Gray for unused
    });

    it('ルートコンポーネントを紫色でマークできること', () => {
      const components: ComponentInfo[] = [
        createComponent('1', 'PageComponent', 'src/app/page.tsx', []),
        createComponent('2', 'LayoutComponent', 'src/app/layout.tsx', []),
      ];

      const graph = graphBuilder.buildGraph(components);
      const { nodes } = graphBuilder.buildReactFlowGraph(graph);

      expect(nodes[0].style?.backgroundColor).toBe('#8b5cf6'); // Purple
      expect(nodes[1].style?.backgroundColor).toBe('#8b5cf6'); // Purple
    });

    it('循環依存を赤色とボーダーでマークできること', () => {
      const components: ComponentInfo[] = [
        createComponent('1', 'ComponentA', 'src/ComponentA.tsx', ['ComponentB']),
        createComponent('2', 'ComponentB', 'src/ComponentB.tsx', ['ComponentA']),
      ];

      const graph = graphBuilder.buildGraph(components);
      const { nodes } = graphBuilder.buildReactFlowGraph(graph);

      // Both components should be marked as circular
      expect(nodes[0].style?.backgroundColor).toBe('#ef4444'); // Red
      expect(nodes[0].style?.border).toContain('#dc2626');
      expect(nodes[1].style?.backgroundColor).toBe('#ef4444'); // Red
      expect(nodes[1].style?.border).toContain('#dc2626');
    });

    it('強い依存関係のエッジをアニメーション表示できること', () => {
      const components: ComponentInfo[] = [
        createComponent('1', 'ComponentA', 'src/ComponentA.tsx', []),
        createComponent('2', 'ComponentB', 'src/ComponentB.tsx', ['ComponentA', 'ComponentA']),
      ];

      const graph = graphBuilder.buildGraph(components);
      const { edges } = graphBuilder.buildReactFlowGraph(graph);

      expect(edges[0].animated).toBe(true);
      expect(edges[0].style?.strokeWidth).toBe(2);
    });
  });

  describe('メトリクスの計算', () => {
    it('シンプルなグラフの正しいメトリクスを計算できること', () => {
      const components: ComponentInfo[] = [
        createComponent('1', 'ComponentA', 'src/ComponentA.tsx', [], 25, 'function'),
        createComponent('2', 'ComponentB', 'src/ComponentB.tsx', ['ComponentA'], 50, 'function'),
        createComponent('3', 'useCustomHook', 'src/useCustomHook.ts', [], 35, 'hook'),
      ];

      const graph = graphBuilder.buildGraph(components);
      const metrics = graphBuilder.calculateMetrics(graph);

      expect(metrics.totalComponents).toBe(3);
      expect(metrics.totalHooks).toBe(1);
      expect(metrics.averageComplexity).toBeCloseTo(36.7, 1);
      expect(metrics.maxComplexity).toBe(50);
      expect(metrics.minComplexity).toBe(25);
      expect(metrics.circularDependencies).toBe(0);
    });

    it('複雑度の分布を正しく計算できること', () => {
      const components: ComponentInfo[] = [
        createComponent('1', 'Simple1', 'src/Simple1.tsx', [], 20),
        createComponent('2', 'Simple2', 'src/Simple2.tsx', [], 30),
        createComponent('3', 'Standard1', 'src/Standard1.tsx', [], 40),
        createComponent('4', 'Standard2', 'src/Standard2.tsx', [], 60),
        createComponent('5', 'Complex1', 'src/Complex1.tsx', [], 70),
        createComponent('6', 'VeryComplex1', 'src/VeryComplex1.tsx', [], 90),
      ];

      const graph = graphBuilder.buildGraph(components);
      const metrics = graphBuilder.calculateMetrics(graph);

      expect(metrics.complexityDistribution).toEqual({
        simple: 2, // <=30
        standard: 2, // 31-60
        complex: 1, // 61-80
        veryComplex: 1, // >80
      });
    });

    it('最も複雑なコンポーネントを特定できること', () => {
      const components: ComponentInfo[] = [
        createComponent('1', 'Simple', 'src/Simple.tsx', [], 20),
        createComponent('2', 'Complex', 'src/Complex.tsx', [], 80),
        createComponent('3', 'VeryComplex', 'src/VeryComplex.tsx', [], 95),
      ];

      const graph = graphBuilder.buildGraph(components);
      const metrics = graphBuilder.calculateMetrics(graph);

      expect(metrics.topComplexComponents).toHaveLength(3);
      expect(metrics.topComplexComponents[0].name).toBe('VeryComplex');
      expect(metrics.topComplexComponents[0].complexity).toBe(95);
      expect(metrics.topComplexComponents[1].name).toBe('Complex');
      expect(metrics.topComplexComponents[2].name).toBe('Simple');
    });

    it('最も依存されているコンポーネントを特定できること', () => {
      const components: ComponentInfo[] = [
        createComponent('1', 'Popular', 'src/Popular.tsx', []),
        createComponent('2', 'ComponentB', 'src/ComponentB.tsx', ['Popular']),
        createComponent('3', 'ComponentC', 'src/ComponentC.tsx', ['Popular']),
        createComponent('4', 'ComponentD', 'src/ComponentD.tsx', ['Popular']),
      ];

      const graph = graphBuilder.buildGraph(components);
      const metrics = graphBuilder.calculateMetrics(graph);

      expect(metrics.mostDependedOn[0].name).toBe('Popular');
      expect(metrics.mostDependedOn[0].dependentCount).toBe(3);
    });

    it('循環依存をカウントできること', () => {
      const components: ComponentInfo[] = [
        createComponent('1', 'ComponentA', 'src/ComponentA.tsx', ['ComponentB']),
        createComponent('2', 'ComponentB', 'src/ComponentB.tsx', ['ComponentA']),
        createComponent('3', 'ComponentC', 'src/ComponentC.tsx', []),
      ];

      const graph = graphBuilder.buildGraph(components);
      const metrics = graphBuilder.calculateMetrics(graph);

      expect(metrics.circularDependencies).toBe(2);
    });

    it('トップリストを10項目に制限すること', () => {
      const components: ComponentInfo[] = Array.from({ length: 20 }, (_, i) =>
        createComponent(`${i}`, `Component${i}`, `src/Component${i}.tsx`, [], i * 5)
      );

      const graph = graphBuilder.buildGraph(components);
      const metrics = graphBuilder.calculateMetrics(graph);

      expect(metrics.topComplexComponents.length).toBeLessThanOrEqual(10);
      expect(metrics.mostDependedOn.length).toBeLessThanOrEqual(10);
    });
  });

  describe('循環依存の検出', () => {
    it('シンプルな循環依存を検出できること', () => {
      const components: ComponentInfo[] = [
        createComponent('1', 'ComponentA', 'src/ComponentA.tsx', ['ComponentB']),
        createComponent('2', 'ComponentB', 'src/ComponentB.tsx', ['ComponentA']),
      ];

      const graph = graphBuilder.buildGraph(components);
      const { nodes } = graphBuilder.buildReactFlowGraph(graph);

      const circularNodeA = nodes.find((n) => n.id === '1');
      const circularNodeB = nodes.find((n) => n.id === '2');

      expect(circularNodeA?.style?.backgroundColor).toBe('#ef4444');
      expect(circularNodeB?.style?.backgroundColor).toBe('#ef4444');
    });

    it('複雑な循環依存チェーンを検出できること', () => {
      const components: ComponentInfo[] = [
        createComponent('1', 'ComponentA', 'src/ComponentA.tsx', ['ComponentB']),
        createComponent('2', 'ComponentB', 'src/ComponentB.tsx', ['ComponentC']),
        createComponent('3', 'ComponentC', 'src/ComponentC.tsx', ['ComponentA']),
      ];

      const graph = graphBuilder.buildGraph(components);
      const metrics = graphBuilder.calculateMetrics(graph);

      // All components are part of the circular dependency
      // The implementation marks nodes when they're part of any cycle
      expect(metrics.circularDependencies).toBeGreaterThan(0);
      expect(metrics.circularDependencies).toBeLessThanOrEqual(3);
    });

    it('線形チェーンでは循環依存を検出しないこと', () => {
      const components: ComponentInfo[] = [
        createComponent('1', 'ComponentA', 'src/ComponentA.tsx', []),
        createComponent('2', 'ComponentB', 'src/ComponentB.tsx', ['ComponentA']),
        createComponent('3', 'ComponentC', 'src/ComponentC.tsx', ['ComponentB']),
      ];

      const graph = graphBuilder.buildGraph(components);
      const metrics = graphBuilder.calculateMetrics(graph);

      expect(metrics.circularDependencies).toBe(0);
    });
  });

  describe('エッジケース', () => {
    it('空のコンポーネントリストを処理できること', () => {
      const components: ComponentInfo[] = [];
      const graph = graphBuilder.buildGraph(components);

      expect(graph.nodes.size).toBe(0);
      expect(graph.edges.length).toBe(0);
    });

    it('依存関係のない単一コンポーネントを処理できること', () => {
      const components: ComponentInfo[] = [
        createComponent('1', 'SingleComponent', 'src/Single.tsx', []),
      ];

      const graph = graphBuilder.buildGraph(components);
      const metrics = graphBuilder.calculateMetrics(graph);

      expect(graph.nodes.size).toBe(1);
      expect(graph.edges.length).toBe(0);
      expect(metrics.totalComponents).toBe(1);
      expect(metrics.circularDependencies).toBe(0);
    });

    it('同じ名前で異なるパスのコンポーネントを処理できること', () => {
      const components: ComponentInfo[] = [
        createComponent('1', 'Button', 'src/components/Button.tsx', []),
        createComponent('2', 'Button', 'src/ui/Button.tsx', []),
      ];

      const graph = graphBuilder.buildGraph(components);

      // Should create two separate nodes
      expect(graph.nodes.size).toBe(2);
    });
  });
});
