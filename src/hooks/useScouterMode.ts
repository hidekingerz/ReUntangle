import { useState, useCallback, useMemo } from 'react';
import type { Node, Edge } from '@xyflow/react';
import {
  ScouterModeService,
  type ExtractRelatedNodesOptions,
} from '@/lib/scouter/ScouterModeService';

/**
 * スカウターモードの状態
 */
type ScouterModeState = {
  // スカウターモードが有効か
  isActive: boolean;

  // 中心ノードのID
  centerNodeId: string | null;

  // 表示対象ノードのIDセット（高速検索用）
  visibleNodeIds: Set<string>;

  // 表示対象エッジのIDセット（高速検索用）
  visibleEdgeIds: Set<string>;

  // 末端まで全て表示するか
  showAllDescendants: boolean;
};

/**
 * useScouterModeフックのオプション
 */
export type UseScouterModeOptions<T extends Record<string, unknown> = Record<string, unknown>> = {
  nodes: Node<T>[];
  edges: Edge[];
  onModeChange?: (isActive: boolean) => void;
  // 末端ノードまで全て表示するか（初期値、デフォルト: true）
  initialShowAllDescendants?: boolean;
};

/**
 * useScouterModeフックの戻り値
 */
export type UseScouterModeReturn<T extends Record<string, unknown> = Record<string, unknown>> = {
  // 状態
  isScouterMode: boolean;
  centerNodeId: string | null;
  showAllDescendants: boolean;

  // アクション
  activateScouterMode: (nodeId: string) => void;
  deactivateScouterMode: () => void;
  toggleShowAllDescendants: () => void;

  // フィルタ済みデータ
  filteredNodes: Node<T>[];
  filteredEdges: Edge[];
};

/**
 * スカウターモード機能のためのカスタムフック
 *
 * スカウターモードは、1つのノードとその依存関係（dependencies/dependents）に
 * 焦点を当て、無関係なノードとエッジをフィルタリングすることでグラフビューを絞り込む機能です。
 *
 * @param options - 設定オプション
 * @returns スカウターモードの状態とアクション
 *
 * @example
 * ```tsx
 * const {
 *   isScouterMode,
 *   activateScouterMode,
 *   deactivateScouterMode,
 *   filteredNodes,
 *   filteredEdges
 * } = useScouterMode({ nodes, edges });
 *
 * // ノードのダブルクリックでスカウターモードを有効化
 * const onNodeDoubleClick = (event, node) => {
 *   activateScouterMode(node.id);
 * };
 * ```
 */
export function useScouterMode<T extends Record<string, unknown> = Record<string, unknown>>({
  nodes,
  edges,
  onModeChange,
  initialShowAllDescendants = true,
}: UseScouterModeOptions<T>): UseScouterModeReturn<T> {
  const [state, setState] = useState<ScouterModeState>({
    isActive: false,
    centerNodeId: null,
    visibleNodeIds: new Set(),
    visibleEdgeIds: new Set(),
    showAllDescendants: initialShowAllDescendants,
  });

  /**
   * 特定ノードのスカウターモードを有効化
   */
  const activateScouterMode = useCallback(
    (nodeId: string) => {
      try {
        const options: ExtractRelatedNodesOptions = {
          showAllDescendants: state.showAllDescendants,
        };
        const relatedNodes = ScouterModeService.extractRelatedNodes(
          nodeId,
          nodes,
          edges,
          options
        );

        const visibleNodeIds = new Set([
          relatedNodes.centerNode.id,
          ...relatedNodes.dependencyNodes.map((n) => n.id),
          ...relatedNodes.dependentNodes.map((n) => n.id),
        ]);

        const visibleEdgeIds = new Set(relatedNodes.relatedEdges.map((e) => e.id));

        setState((prev) => ({
          ...prev,
          isActive: true,
          centerNodeId: nodeId,
          visibleNodeIds,
          visibleEdgeIds,
        }));

        onModeChange?.(true);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to activate scouter mode:', error);
      }
    },
    [nodes, edges, onModeChange, state.showAllDescendants]
  );

  /**
   * スカウターモードを無効化して全体グラフビューに戻る
   */
  const deactivateScouterMode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isActive: false,
      centerNodeId: null,
      visibleNodeIds: new Set(),
      visibleEdgeIds: new Set(),
    }));

    onModeChange?.(false);
  }, [onModeChange]);

  /**
   * showAllDescendantsを切り替え、有効な場合はノードを再抽出
   */
  const toggleShowAllDescendants = useCallback(() => {
    setState((prev) => {
      const newShowAllDescendants = !prev.showAllDescendants;

      // スカウターモードが有効な場合、新しい設定でノードを再抽出
      if (prev.isActive && prev.centerNodeId) {
        const options: ExtractRelatedNodesOptions = {
          showAllDescendants: newShowAllDescendants,
        };
        const relatedNodes = ScouterModeService.extractRelatedNodes(
          prev.centerNodeId,
          nodes,
          edges,
          options
        );

        const visibleNodeIds = new Set([
          relatedNodes.centerNode.id,
          ...relatedNodes.dependencyNodes.map((n) => n.id),
          ...relatedNodes.dependentNodes.map((n) => n.id),
        ]);

        const visibleEdgeIds = new Set(relatedNodes.relatedEdges.map((e) => e.id));

        return {
          ...prev,
          showAllDescendants: newShowAllDescendants,
          visibleNodeIds,
          visibleEdgeIds,
        };
      }

      // 有効でない場合は、設定のみを切り替え
      return {
        ...prev,
        showAllDescendants: newShowAllDescendants,
      };
    });
  }, [nodes, edges]);

  /**
   * スカウターモードの状態に基づいてノードをフィルタリング
   */
  const filteredNodes = useMemo((): Node<T>[] => {
    if (!state.isActive) return nodes;

    return nodes
      .filter((node) => state.visibleNodeIds.has(node.id))
      .map((node) => {
        // 中心ノードを強調
        if (node.id === state.centerNodeId) {
          return ScouterModeService.highlightCenterNode<T>(node);
        }
        return node;
      });
  }, [nodes, state.isActive, state.visibleNodeIds, state.centerNodeId]);

  /**
   * スカウターモードの状態に基づいてエッジをフィルタリング
   */
  const filteredEdges = useMemo(() => {
    if (!state.isActive) return edges;
    return edges.filter((edge) => state.visibleEdgeIds.has(edge.id));
  }, [edges, state.isActive, state.visibleEdgeIds]);

  return {
    isScouterMode: state.isActive,
    centerNodeId: state.centerNodeId,
    showAllDescendants: state.showAllDescendants,
    activateScouterMode,
    deactivateScouterMode,
    toggleShowAllDescendants,
    filteredNodes,
    filteredEdges,
  };
}
