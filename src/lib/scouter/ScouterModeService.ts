import type { Node, Edge } from '@xyflow/react';

/**
 * スカウターモード用に抽出された関連ノード
 */
export type RelatedNodes = {
  // 中心ノード
  centerNode: Node;

  // 依存先ノード（中心ノードがimportしている）
  dependencyNodes: Node[];

  // 依存元ノード（中心ノードをimportしている）
  dependentNodes: Node[];

  // 関連するエッジ
  relatedEdges: Edge[];
};

/**
 * 関連ノード抽出のオプション
 */
export type ExtractRelatedNodesOptions = {
  // 末端ノードまで全て表示するか（デフォルト: true）
  showAllDescendants?: boolean;
};

/**
 * ScouterModeServiceはスカウターモード機能のユーティリティを提供
 *
 * スカウターモードは1つのノードとその依存関係（dependencies/dependents）に
 * 焦点を当て、他のノードとエッジをグラフビューから非表示にします。
 */
export class ScouterModeService {
  /**
   * 中心ノードに関連するノードとエッジを抽出
   *
   * @param centerNodeId - 焦点を当てるノードのID
   * @param allNodes - グラフ内の全ノード
   * @param allEdges - グラフ内の全エッジ
   * @param options - 抽出オプション
   * @returns 関連ノードとエッジ
   * @throws 中心ノードが見つからない場合にエラー
   */
  static extractRelatedNodes(
    centerNodeId: string,
    allNodes: Node[],
    allEdges: Edge[],
    options: ExtractRelatedNodesOptions = {}
  ): RelatedNodes {
    const { showAllDescendants = true } = options;

    const centerNode = allNodes.find((n) => n.id === centerNodeId);
    if (!centerNode) {
      throw new Error(`Node with id ${centerNodeId} not found`);
    }

    if (showAllDescendants) {
      // 末端まで全て取得
      return this.extractAllDescendants(centerNodeId, allNodes, allEdges);
    } else {
      // 直接の関係のみ取得
      return this.extractDirectRelations(centerNodeId, allNodes, allEdges);
    }
  }

  /**
   * 直接の関係のみを抽出（1レベル）
   */
  private static extractDirectRelations(
    centerNodeId: string,
    allNodes: Node[],
    allEdges: Edge[]
  ): RelatedNodes {
    const centerNode = allNodes.find((n) => n.id === centerNodeId)!;

    // 依存先ノード（centerNodeがソースとなるエッジのターゲット）
    const dependencyEdges = allEdges.filter((e) => e.source === centerNodeId);
    const dependencyNodeIds = new Set(dependencyEdges.map((e) => e.target));
    const dependencyNodes = allNodes.filter((n) => dependencyNodeIds.has(n.id));

    // 依存元ノード（centerNodeがターゲットとなるエッジのソース）
    const dependentEdges = allEdges.filter((e) => e.target === centerNodeId);
    const dependentNodeIds = new Set(dependentEdges.map((e) => e.source));
    const dependentNodes = allNodes.filter((n) => dependentNodeIds.has(n.id));

    // 関連エッジ
    const relatedEdges = [...dependencyEdges, ...dependentEdges];

    return {
      centerNode,
      dependencyNodes,
      dependentNodes,
      relatedEdges,
    };
  }

  /**
   * DFSを使用して末端ノードまでの全ての子孫を抽出
   */
  private static extractAllDescendants(
    centerNodeId: string,
    allNodes: Node[],
    allEdges: Edge[]
  ): RelatedNodes {
    const centerNode = allNodes.find((n) => n.id === centerNodeId)!;

    const dependencyNodeIds = new Set<string>();
    const dependentNodeIds = new Set<string>();
    const relatedEdgeIds = new Set<string>();

    // 依存先のDFS（下向き: center -> dependencies）
    const visitDependencies = (nodeId: string) => {
      const edges = allEdges.filter((e) => e.source === nodeId);
      edges.forEach((edge) => {
        relatedEdgeIds.add(edge.id);
        if (!dependencyNodeIds.has(edge.target) && edge.target !== centerNodeId) {
          dependencyNodeIds.add(edge.target);
          visitDependencies(edge.target);
        }
      });
    };

    // 依存元のDFS（上向き: dependents -> center）
    const visitDependents = (nodeId: string) => {
      const edges = allEdges.filter((e) => e.target === nodeId);
      edges.forEach((edge) => {
        relatedEdgeIds.add(edge.id);
        if (!dependentNodeIds.has(edge.source) && edge.source !== centerNodeId) {
          dependentNodeIds.add(edge.source);
          visitDependents(edge.source);
        }
      });
    };

    visitDependencies(centerNodeId);
    visitDependents(centerNodeId);

    const dependencyNodes = allNodes.filter((n) => dependencyNodeIds.has(n.id));
    const dependentNodes = allNodes.filter((n) => dependentNodeIds.has(n.id));
    const relatedEdges = allEdges.filter((e) => relatedEdgeIds.has(e.id));

    return {
      centerNode,
      dependencyNodes,
      dependentNodes,
      relatedEdges,
    };
  }

  /**
   * 中心ノードに視覚的な強調表示を適用
   *
   * @param node - 強調表示するノード
   * @returns 視覚的スタイルが強化されたノード
   */
  static highlightCenterNode<T extends Record<string, unknown> = Record<string, unknown>>(
    node: Node<T>
  ): Node<T> {
    const currentWidth =
      typeof node.style?.width === 'number' ? node.style.width : 60;
    const currentHeight =
      typeof node.style?.height === 'number' ? node.style.height : 60;

    return {
      ...node,
      data: {
        ...node.data,
        isScouterCenter: true,
      },
      style: {
        ...node.style,
        width: currentWidth * 1.5,
        height: currentHeight * 1.5,
        border: '4px solid #3b82f6',
        boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
        zIndex: 1000,
      },
    };
  }
}
