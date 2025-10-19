import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { Node, Edge } from '@xyflow/react';
import { useScouterMode } from './useScouterMode';

describe('useScouterMode', () => {
  const mockNodes: Node[] = [
    { id: 'A', position: { x: 0, y: 0 }, data: {} },
    { id: 'B', position: { x: 0, y: 0 }, data: {} },
    { id: 'C', position: { x: 0, y: 0 }, data: {} },
  ];

  const mockEdges: Edge[] = [
    { id: 'e1', source: 'A', target: 'B' },
    { id: 'e2', source: 'A', target: 'C' },
  ];

  it('should initially be inactive', () => {
    const { result } = renderHook(() =>
      useScouterMode({ nodes: mockNodes, edges: mockEdges })
    );

    expect(result.current.isScouterMode).toBe(false);
    expect(result.current.centerNodeId).toBe(null);
    expect(result.current.filteredNodes).toEqual(mockNodes);
    expect(result.current.filteredEdges).toEqual(mockEdges);
  });

  it('should activate scouter mode', () => {
    const { result } = renderHook(() =>
      useScouterMode({ nodes: mockNodes, edges: mockEdges })
    );

    act(() => {
      result.current.activateScouterMode('A');
    });

    expect(result.current.isScouterMode).toBe(true);
    expect(result.current.centerNodeId).toBe('A');
    expect(result.current.filteredNodes).toHaveLength(3); // A, B, C
    expect(result.current.filteredEdges).toHaveLength(2); // e1, e2
  });

  it('should deactivate scouter mode', () => {
    const { result } = renderHook(() =>
      useScouterMode({ nodes: mockNodes, edges: mockEdges })
    );

    act(() => {
      result.current.activateScouterMode('A');
    });

    expect(result.current.isScouterMode).toBe(true);

    act(() => {
      result.current.deactivateScouterMode();
    });

    expect(result.current.isScouterMode).toBe(false);
    expect(result.current.centerNodeId).toBe(null);
    expect(result.current.filteredNodes).toEqual(mockNodes);
    expect(result.current.filteredEdges).toEqual(mockEdges);
  });

  it('should call onModeChange callback on activation', () => {
    const onModeChange = vi.fn();
    const { result } = renderHook(() =>
      useScouterMode({
        nodes: mockNodes,
        edges: mockEdges,
        onModeChange,
      })
    );

    act(() => {
      result.current.activateScouterMode('A');
    });

    expect(onModeChange).toHaveBeenCalledWith(true);
  });

  it('should call onModeChange callback on deactivation', () => {
    const onModeChange = vi.fn();
    const { result } = renderHook(() =>
      useScouterMode({
        nodes: mockNodes,
        edges: mockEdges,
        onModeChange,
      })
    );

    act(() => {
      result.current.activateScouterMode('A');
    });

    act(() => {
      result.current.deactivateScouterMode();
    });

    expect(onModeChange).toHaveBeenCalledWith(false);
  });

  it('should filter nodes to show only direct relations when initialShowAllDescendants is false', () => {
    const nodes: Node[] = [
      { id: 'A', position: { x: 0, y: 0 }, data: {} },
      { id: 'B', position: { x: 0, y: 0 }, data: {} },
      { id: 'C', position: { x: 0, y: 0 }, data: {} },
      { id: 'D', position: { x: 0, y: 0 }, data: {} },
    ];

    const edges: Edge[] = [
      { id: 'e1', source: 'A', target: 'B' },
      { id: 'e2', source: 'C', target: 'A' },
      { id: 'e3', source: 'D', target: 'C' }, // D -> C -> A (2 levels away)
    ];

    const { result } = renderHook(() =>
      useScouterMode({ nodes, edges, initialShowAllDescendants: false })
    );

    act(() => {
      result.current.activateScouterMode('A');
    });

    const filteredNodeIds = result.current.filteredNodes.map((n) => n.id);
    expect(filteredNodeIds).toEqual(expect.arrayContaining(['A', 'B', 'C']));
    expect(filteredNodeIds).not.toContain('D');
    expect(result.current.filteredNodes).toHaveLength(3);
  });

  it('should filter nodes to show all descendants when showAllDescendants is true (default)', () => {
    const nodes: Node[] = [
      { id: 'A', position: { x: 0, y: 0 }, data: {} },
      { id: 'B', position: { x: 0, y: 0 }, data: {} },
      { id: 'C', position: { x: 0, y: 0 }, data: {} },
      { id: 'D', position: { x: 0, y: 0 }, data: {} },
    ];

    const edges: Edge[] = [
      { id: 'e1', source: 'A', target: 'B' },
      { id: 'e2', source: 'C', target: 'A' },
      { id: 'e3', source: 'D', target: 'C' }, // D -> C -> A (all included)
    ];

    const { result } = renderHook(() => useScouterMode({ nodes, edges }));

    act(() => {
      result.current.activateScouterMode('A');
    });

    const filteredNodeIds = result.current.filteredNodes.map((n) => n.id);
    expect(filteredNodeIds).toEqual(expect.arrayContaining(['A', 'B', 'C', 'D']));
    expect(result.current.filteredNodes).toHaveLength(4); // All nodes included
  });

  it('should highlight center node when in scouter mode', () => {
    const { result } = renderHook(() =>
      useScouterMode({ nodes: mockNodes, edges: mockEdges })
    );

    act(() => {
      result.current.activateScouterMode('A');
    });

    const centerNode = result.current.filteredNodes.find((n) => n.id === 'A');
    expect(centerNode?.data.isScouterCenter).toBe(true);
    expect(centerNode?.style?.border).toContain('4px solid');
  });

  it('should not highlight non-center nodes', () => {
    const { result } = renderHook(() =>
      useScouterMode({ nodes: mockNodes, edges: mockEdges })
    );

    act(() => {
      result.current.activateScouterMode('A');
    });

    const nonCenterNode = result.current.filteredNodes.find((n) => n.id === 'B');
    expect(nonCenterNode?.data.isScouterCenter).toBeUndefined();
  });

  it('should handle error when activating with invalid node ID', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() =>
      useScouterMode({ nodes: mockNodes, edges: mockEdges })
    );

    act(() => {
      result.current.activateScouterMode('INVALID_ID');
    });

    // Should not crash, but remain inactive
    expect(result.current.isScouterMode).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should switch center node when activating on different node', () => {
    const { result } = renderHook(() =>
      useScouterMode({ nodes: mockNodes, edges: mockEdges })
    );

    act(() => {
      result.current.activateScouterMode('A');
    });

    expect(result.current.centerNodeId).toBe('A');

    act(() => {
      result.current.activateScouterMode('B');
    });

    expect(result.current.centerNodeId).toBe('B');
    expect(result.current.isScouterMode).toBe(true);
  });

  it('should toggle showAllDescendants and re-filter nodes when active', () => {
    const nodes: Node[] = [
      { id: 'A', position: { x: 0, y: 0 }, data: {} },
      { id: 'B', position: { x: 0, y: 0 }, data: {} },
      { id: 'C', position: { x: 0, y: 0 }, data: {} },
      { id: 'D', position: { x: 0, y: 0 }, data: {} },
    ];

    const edges: Edge[] = [
      { id: 'e1', source: 'A', target: 'B' },
      { id: 'e2', source: 'C', target: 'A' },
      { id: 'e3', source: 'D', target: 'C' }, // D -> C -> A
    ];

    const { result } = renderHook(() =>
      useScouterMode({ nodes, edges, initialShowAllDescendants: true })
    );

    // Activate with showAllDescendants=true
    act(() => {
      result.current.activateScouterMode('A');
    });

    expect(result.current.showAllDescendants).toBe(true);
    expect(result.current.filteredNodes).toHaveLength(4); // A, B, C, D

    // Toggle to showAllDescendants=false
    act(() => {
      result.current.toggleShowAllDescendants();
    });

    expect(result.current.showAllDescendants).toBe(false);
    expect(result.current.filteredNodes).toHaveLength(3); // A, B, C (no D)
    expect(result.current.filteredNodes.map((n) => n.id)).not.toContain('D');

    // Toggle back to showAllDescendants=true
    act(() => {
      result.current.toggleShowAllDescendants();
    });

    expect(result.current.showAllDescendants).toBe(true);
    expect(result.current.filteredNodes).toHaveLength(4); // A, B, C, D again
  });

  it('should toggle showAllDescendants when not active', () => {
    const { result } = renderHook(() =>
      useScouterMode({ nodes: mockNodes, edges: mockEdges })
    );

    expect(result.current.showAllDescendants).toBe(true);

    act(() => {
      result.current.toggleShowAllDescendants();
    });

    expect(result.current.showAllDescendants).toBe(false);
    expect(result.current.isScouterMode).toBe(false);
  });
});
