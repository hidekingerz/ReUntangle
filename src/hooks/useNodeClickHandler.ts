import { useCallback } from 'react';
import type { Node } from '@xyflow/react';
import type { FlowNodeData } from '@/types';

/**
 * Custom hook for handling node click events
 */
export function useNodeClickHandler(onNodeClick?: (nodeId: string) => void) {
  return useCallback(
    (_event: React.MouseEvent, node: Node<FlowNodeData>) => {
      onNodeClick?.(node.id);
    },
    [onNodeClick]
  );
}
