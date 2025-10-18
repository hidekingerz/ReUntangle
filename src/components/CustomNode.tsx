'use client';

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { FlowNodeData } from '@/types';

interface CustomNodeProps {
  data: FlowNodeData;
}

function CustomNode({ data }: CustomNodeProps) {
  return (
    <div className="relative">
      {/* Connection handles - invisible but functional */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ opacity: 0, width: 1, height: 1 }}
      />

      {/* Node circle - style is applied from parent */}
      <div className="w-full h-full flex items-center justify-center">
        {data.complexity}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ opacity: 0, width: 1, height: 1 }}
      />

      {/* Component name label below the node */}
      <div
        className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-center"
        style={{
          top: '100%',
          marginTop: '8px',
          fontSize: '12px',
          fontWeight: '600',
          color: '#1f2937',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '4px 8px',
          borderRadius: '4px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          maxWidth: '150px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {data.componentInfo.name}
      </div>
    </div>
  );
}

export default memo(CustomNode);
