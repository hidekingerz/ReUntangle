'use client';

type ScouterModeIndicatorProps = {
  centerNodeId: string | null;
  onDeactivate: () => void;
  showAllDescendants: boolean;
  onToggleShowAllDescendants: () => void;
};

/**
 * ScouterModeIndicatorはスカウターモードが有効なときに通知バナーを表示
 *
 * 中心ノードのIDを表示し、表示モードの切り替えと終了のボタンを提供します。
 *
 * @param centerNodeId - スカウターモードの中心ノードID
 * @param onDeactivate - スカウターモードを無効化するコールバック
 * @param showAllDescendants - 末端ノードまで全て表示するか
 * @param onToggleShowAllDescendants - showAllDescendantsを切り替えるコールバック
 */
export default function ScouterModeIndicator({
  centerNodeId,
  onDeactivate,
  showAllDescendants,
  onToggleShowAllDescendants,
}: ScouterModeIndicatorProps) {
  return (
    <div
      className="
        absolute top-4 left-1/2 transform -translate-x-1/2 z-10
        bg-blue-500 text-white
        px-4 py-2 rounded-lg shadow-lg
        flex items-center gap-3
      "
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">スカウターモード</span>
        <span className="text-xs opacity-80">中心: {centerNodeId}</span>
      </div>

      <button
        onClick={onToggleShowAllDescendants}
        className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors"
        aria-label={showAllDescendants ? '直接関係のみ表示' : '末端まで表示'}
      >
        {showAllDescendants ? '末端まで表示' : '直接のみ表示'}
      </button>

      <button
        onClick={onDeactivate}
        className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors"
        aria-label="スカウターモードを解除"
      >
        解除 (ESC)
      </button>
    </div>
  );
}
