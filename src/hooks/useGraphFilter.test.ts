import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useGraphFilter } from './useGraphFilter';
import type { Node, Edge } from '@xyflow/react';
import type { FlowNodeData, SearchOptions, FilterOptions } from '@/types';

describe('useGraphFilter', () => {
  // Mock data
  const createMockNode = (
    id: string,
    name: string,
    filePath: string,
    complexity: number,
    type: 'function' | 'class' | 'arrow' | 'hook' = 'function',
    dependentCount = 1
  ): Node<FlowNodeData> => ({
    id,
    type: 'custom',
    position: { x: 0, y: 0 },
    data: {
      label: name,
      componentInfo: {
        id,
        name,
        filePath,
        type,
        dependencies: [],
        complexity,
        linesOfCode: 100,
        hooks: [],
        imports: [],
        propsCount: 0,
      },
      complexity,
      dependencyCount: 0,
      dependentCount,
    },
  });

  const mockNodes: Node<FlowNodeData>[] = [
    createMockNode('1', 'Button', 'src/components/Button.tsx', 25, 'function'),
    createMockNode('2', 'Header', 'src/components/Header.tsx', 45, 'function'),
    createMockNode('3', 'Footer', 'src/components/Footer.tsx', 35, 'function'),
    createMockNode('4', 'useAuth', 'src/hooks/useAuth.ts', 55, 'hook'),
    createMockNode('5', 'Modal', 'src/components/Modal.jsx', 65, 'class'),
    createMockNode('6', 'UnusedComponent', 'src/components/Unused.tsx', 20, 'function', 0),
  ];

  const mockEdges: Edge[] = [
    { id: 'e1-2', source: '1', target: '2' },
    { id: 'e2-3', source: '2', target: '3' },
    { id: 'e3-4', source: '3', target: '4' },
  ];

  const defaultSearchOptions: SearchOptions = {
    query: '',
    searchIn: 'both',
    useRegex: false,
  };

  const defaultFilterOptions: FilterOptions = {
    complexityRange: { min: 0, max: 100 },
    depthRange: { min: 0, max: 100 },
    componentTypes: [],
    fileExtensions: [],
    showUnused: true,
    showCircular: true,
  };

  describe('検索機能', () => {
    it('検索クエリが指定されていない場合、すべてのノードを返す', () => {
      const { result } = renderHook(() =>
        useGraphFilter({
          nodes: mockNodes,
          edges: mockEdges,
          searchOptions: defaultSearchOptions,
          filterOptions: defaultFilterOptions,
        })
      );

      expect(result.current.filteredNodes).toHaveLength(mockNodes.length);
      expect(result.current.matchedNodeIds.size).toBe(0);
    });

    it('コンポーネント名で絞り込む（大文字小文字を区別しない）', () => {
      const { result } = renderHook(() =>
        useGraphFilter({
          nodes: mockNodes,
          edges: mockEdges,
          searchOptions: { ...defaultSearchOptions, query: 'button', searchIn: 'name' },
          filterOptions: defaultFilterOptions,
        })
      );

      expect(result.current.filteredNodes).toHaveLength(1);
      expect(result.current.filteredNodes[0].data.componentInfo.name).toBe('Button');
      expect(result.current.matchedNodeIds.has('1')).toBe(true);
    });

    it('ファイルパスで絞り込む', () => {
      const { result } = renderHook(() =>
        useGraphFilter({
          nodes: mockNodes,
          edges: mockEdges,
          searchOptions: { ...defaultSearchOptions, query: 'hooks', searchIn: 'path' },
          filterOptions: defaultFilterOptions,
        })
      );

      expect(result.current.filteredNodes).toHaveLength(1);
      expect(result.current.filteredNodes[0].data.componentInfo.name).toBe('useAuth');
    });

    it('名前とパスの両方で検索する', () => {
      const { result } = renderHook(() =>
        useGraphFilter({
          nodes: mockNodes,
          edges: mockEdges,
          searchOptions: { ...defaultSearchOptions, query: 'Header', searchIn: 'both' },
          filterOptions: defaultFilterOptions,
        })
      );

      expect(result.current.filteredNodes).toHaveLength(1);
      expect(result.current.filteredNodes[0].data.componentInfo.name).toBe('Header');
    });

    it('正規表現検索をサポートする', () => {
      const { result } = renderHook(() =>
        useGraphFilter({
          nodes: mockNodes,
          edges: mockEdges,
          searchOptions: {
            query: '^use',
            searchIn: 'name',
            useRegex: true,
          },
          filterOptions: defaultFilterOptions,
        })
      );

      expect(result.current.filteredNodes).toHaveLength(1);
      expect(result.current.filteredNodes[0].data.componentInfo.name).toBe('useAuth');
    });

    it('不正な正規表現を適切に処理する', () => {
      const { result } = renderHook(() =>
        useGraphFilter({
          nodes: mockNodes,
          edges: mockEdges,
          searchOptions: {
            query: '[invalid',
            searchIn: 'name',
            useRegex: true,
          },
          filterOptions: defaultFilterOptions,
        })
      );

      // プレーンテキスト検索にフォールバックする
      expect(result.current.filteredNodes).toHaveLength(0);
    });
  });

  describe('フィルタ機能', () => {
    it('複雑度の範囲でフィルタする', () => {
      const { result } = renderHook(() =>
        useGraphFilter({
          nodes: mockNodes,
          edges: mockEdges,
          searchOptions: defaultSearchOptions,
          filterOptions: {
            ...defaultFilterOptions,
            complexityRange: { min: 40, max: 60 },
          },
        })
      );

      expect(result.current.filteredNodes).toHaveLength(2);
      expect(result.current.filteredNodes.map((n) => n.data.componentInfo.name).sort()).toEqual([
        'Header',
        'useAuth',
      ]);
    });

    it('コンポーネントタイプでフィルタする', () => {
      const { result } = renderHook(() =>
        useGraphFilter({
          nodes: mockNodes,
          edges: mockEdges,
          searchOptions: defaultSearchOptions,
          filterOptions: {
            ...defaultFilterOptions,
            componentTypes: ['hook'],
          },
        })
      );

      expect(result.current.filteredNodes).toHaveLength(1);
      expect(result.current.filteredNodes[0].data.componentInfo.name).toBe('useAuth');
    });

    it('複数のコンポーネントタイプでフィルタする', () => {
      const { result } = renderHook(() =>
        useGraphFilter({
          nodes: mockNodes,
          edges: mockEdges,
          searchOptions: defaultSearchOptions,
          filterOptions: {
            ...defaultFilterOptions,
            componentTypes: ['hook', 'class'],
          },
        })
      );

      expect(result.current.filteredNodes).toHaveLength(2);
      expect(result.current.filteredNodes.map((n) => n.data.componentInfo.name).sort()).toEqual([
        'Modal',
        'useAuth',
      ]);
    });

    it('ファイル拡張子でフィルタする', () => {
      const { result } = renderHook(() =>
        useGraphFilter({
          nodes: mockNodes,
          edges: mockEdges,
          searchOptions: defaultSearchOptions,
          filterOptions: {
            ...defaultFilterOptions,
            fileExtensions: ['.ts'],
          },
        })
      );

      expect(result.current.filteredNodes).toHaveLength(1);
      expect(result.current.filteredNodes[0].data.componentInfo.name).toBe('useAuth');
    });

    it('showUnusedがfalseの場合、未使用のコンポーネントを非表示にする', () => {
      const { result } = renderHook(() =>
        useGraphFilter({
          nodes: mockNodes,
          edges: mockEdges,
          searchOptions: defaultSearchOptions,
          filterOptions: {
            ...defaultFilterOptions,
            showUnused: false,
          },
        })
      );

      expect(result.current.filteredNodes).toHaveLength(5);
      expect(
        result.current.filteredNodes.find((n) => n.data.componentInfo.name === 'UnusedComponent')
      ).toBeUndefined();
    });
  });

  describe('エッジのフィルタリング', () => {
    it('表示されているノードに基づいてエッジをフィルタする', () => {
      const { result } = renderHook(() =>
        useGraphFilter({
          nodes: mockNodes,
          edges: mockEdges,
          searchOptions: { ...defaultSearchOptions, query: 'Button', searchIn: 'name' },
          filterOptions: defaultFilterOptions,
        })
      );

      // Buttonのみがマッチするため、エッジは表示されない
      expect(result.current.filteredEdges).toHaveLength(0);
    });

    it('ソースとターゲットの両方が表示されている場合、エッジを保持する', () => {
      const { result } = renderHook(() =>
        useGraphFilter({
          nodes: mockNodes,
          edges: mockEdges,
          searchOptions: { ...defaultSearchOptions, query: 'components', searchIn: 'path' },
          filterOptions: defaultFilterOptions,
        })
      );

      // Button, Header, Footer, Modal, UnusedComponentがマッチ
      expect(result.current.filteredNodes).toHaveLength(5);
      // 表示されているノード間のエッジが表示される
      expect(result.current.filteredEdges.length).toBeGreaterThan(0);
    });
  });

  describe('複合フィルタ', () => {
    it('検索と複雑度フィルタを同時に適用する', () => {
      const { result } = renderHook(() =>
        useGraphFilter({
          nodes: mockNodes,
          edges: mockEdges,
          searchOptions: { ...defaultSearchOptions, query: 'components', searchIn: 'path' },
          filterOptions: {
            ...defaultFilterOptions,
            complexityRange: { min: 30, max: 50 },
          },
        })
      );

      expect(result.current.filteredNodes).toHaveLength(2);
      expect(result.current.filteredNodes.map((n) => n.data.componentInfo.name).sort()).toEqual([
        'Footer',
        'Header',
      ]);
    });

    it('すべてのフィルタを同時に適用する', () => {
      const { result } = renderHook(() =>
        useGraphFilter({
          nodes: mockNodes,
          edges: mockEdges,
          searchOptions: { ...defaultSearchOptions, query: 'src', searchIn: 'path' },
          filterOptions: {
            ...defaultFilterOptions,
            complexityRange: { min: 20, max: 50 },
            componentTypes: ['function'],
            fileExtensions: ['.tsx'],
          },
        })
      );

      // Button (25), Header (45), Footer (35), UnusedComponent (20) がマッチ - すべて.tsxの関数コンポーネント
      expect(result.current.filteredNodes).toHaveLength(4);
      expect(result.current.filteredNodes.map((n) => n.data.componentInfo.name).sort()).toEqual([
        'Button',
        'Footer',
        'Header',
        'UnusedComponent',
      ]);
    });
  });

  describe('統計計算', () => {
    it('正しい統計を計算する', () => {
      const { result } = renderHook(() =>
        useGraphFilter({
          nodes: mockNodes,
          edges: mockEdges,
          searchOptions: { ...defaultSearchOptions, query: 'Button', searchIn: 'name' },
          filterOptions: defaultFilterOptions,
        })
      );

      expect(result.current.stats).toEqual({
        total: 6,
        filtered: 1,
        hidden: 5,
      });
    });

    it('フィルタが適用されていない場合、すべての統計を表示する', () => {
      const { result } = renderHook(() =>
        useGraphFilter({
          nodes: mockNodes,
          edges: mockEdges,
          searchOptions: defaultSearchOptions,
          filterOptions: defaultFilterOptions,
        })
      );

      expect(result.current.stats).toEqual({
        total: 6,
        filtered: 6,
        hidden: 0,
      });
    });
  });
});
