import { describe, it, expect } from 'vitest';
import type { Node, Edge } from '@xyflow/react';
import { ScouterModeService } from './ScouterModeService';

describe('ScouterModeService', () => {
  describe('extractRelatedNodes', () => {
    it('should extract dependency nodes correctly', () => {
      const nodes: Node[] = [
        { id: 'A', position: { x: 0, y: 0 }, data: {} },
        { id: 'B', position: { x: 0, y: 0 }, data: {} },
        { id: 'C', position: { x: 0, y: 0 }, data: {} },
      ];
      const edges: Edge[] = [
        { id: 'e1', source: 'A', target: 'B' },
        { id: 'e2', source: 'A', target: 'C' },
      ];

      const result = ScouterModeService.extractRelatedNodes('A', nodes, edges);

      expect(result.centerNode.id).toBe('A');
      expect(result.dependencyNodes).toHaveLength(2);
      expect(result.dependencyNodes.map((n) => n.id)).toEqual(
        expect.arrayContaining(['B', 'C'])
      );
      expect(result.dependentNodes).toHaveLength(0);
      expect(result.relatedEdges).toHaveLength(2);
    });

    it('should extract dependent nodes correctly', () => {
      const nodes: Node[] = [
        { id: 'A', position: { x: 0, y: 0 }, data: {} },
        { id: 'B', position: { x: 0, y: 0 }, data: {} },
        { id: 'C', position: { x: 0, y: 0 }, data: {} },
      ];
      const edges: Edge[] = [
        { id: 'e1', source: 'B', target: 'A' },
        { id: 'e2', source: 'C', target: 'A' },
      ];

      const result = ScouterModeService.extractRelatedNodes('A', nodes, edges);

      expect(result.centerNode.id).toBe('A');
      expect(result.dependentNodes).toHaveLength(2);
      expect(result.dependentNodes.map((n) => n.id)).toEqual(
        expect.arrayContaining(['B', 'C'])
      );
      expect(result.dependencyNodes).toHaveLength(0);
      expect(result.relatedEdges).toHaveLength(2);
    });

    it('should extract both dependencies and dependents', () => {
      const nodes: Node[] = [
        { id: 'A', position: { x: 0, y: 0 }, data: {} },
        { id: 'B', position: { x: 0, y: 0 }, data: {} },
        { id: 'C', position: { x: 0, y: 0 }, data: {} },
        { id: 'D', position: { x: 0, y: 0 }, data: {} },
      ];
      const edges: Edge[] = [
        { id: 'e1', source: 'B', target: 'A' }, // B depends on A
        { id: 'e2', source: 'A', target: 'C' }, // A depends on C
        { id: 'e3', source: 'A', target: 'D' }, // A depends on D
      ];

      const result = ScouterModeService.extractRelatedNodes('A', nodes, edges);

      expect(result.centerNode.id).toBe('A');
      expect(result.dependentNodes).toHaveLength(1);
      expect(result.dependentNodes[0].id).toBe('B');
      expect(result.dependencyNodes).toHaveLength(2);
      expect(result.dependencyNodes.map((n) => n.id)).toEqual(
        expect.arrayContaining(['C', 'D'])
      );
      expect(result.relatedEdges).toHaveLength(3);
    });

    it('should handle isolated node with no dependencies', () => {
      const nodes: Node[] = [
        { id: 'A', position: { x: 0, y: 0 }, data: {} },
        { id: 'B', position: { x: 0, y: 0 }, data: {} },
      ];
      const edges: Edge[] = [];

      const result = ScouterModeService.extractRelatedNodes('A', nodes, edges);

      expect(result.centerNode.id).toBe('A');
      expect(result.dependencyNodes).toHaveLength(0);
      expect(result.dependentNodes).toHaveLength(0);
      expect(result.relatedEdges).toHaveLength(0);
    });

    it('should throw error if node not found', () => {
      const nodes: Node[] = [
        { id: 'A', position: { x: 0, y: 0 }, data: {} },
      ];
      const edges: Edge[] = [];

      expect(() => {
        ScouterModeService.extractRelatedNodes('X', nodes, edges);
      }).toThrow('Node with id X not found');
    });

    it('should extract all descendants when showAllDescendants is true', () => {
      // A -> B -> C -> D (chain)
      const nodes: Node[] = [
        { id: 'A', position: { x: 0, y: 0 }, data: {} },
        { id: 'B', position: { x: 0, y: 0 }, data: {} },
        { id: 'C', position: { x: 0, y: 0 }, data: {} },
        { id: 'D', position: { x: 0, y: 0 }, data: {} },
      ];
      const edges: Edge[] = [
        { id: 'e1', source: 'A', target: 'B' },
        { id: 'e2', source: 'B', target: 'C' },
        { id: 'e3', source: 'C', target: 'D' },
      ];

      const result = ScouterModeService.extractRelatedNodes('A', nodes, edges, {
        showAllDescendants: true,
      });

      expect(result.centerNode.id).toBe('A');
      expect(result.dependencyNodes).toHaveLength(3); // B, C, D
      expect(result.dependencyNodes.map((n) => n.id)).toEqual(
        expect.arrayContaining(['B', 'C', 'D'])
      );
      expect(result.relatedEdges).toHaveLength(3); // e1, e2, e3
    });

    it('should extract only direct relations when showAllDescendants is false', () => {
      // A -> B -> C -> D (chain)
      const nodes: Node[] = [
        { id: 'A', position: { x: 0, y: 0 }, data: {} },
        { id: 'B', position: { x: 0, y: 0 }, data: {} },
        { id: 'C', position: { x: 0, y: 0 }, data: {} },
        { id: 'D', position: { x: 0, y: 0 }, data: {} },
      ];
      const edges: Edge[] = [
        { id: 'e1', source: 'A', target: 'B' },
        { id: 'e2', source: 'B', target: 'C' },
        { id: 'e3', source: 'C', target: 'D' },
      ];

      const result = ScouterModeService.extractRelatedNodes('A', nodes, edges, {
        showAllDescendants: false,
      });

      expect(result.centerNode.id).toBe('A');
      expect(result.dependencyNodes).toHaveLength(1); // Only B
      expect(result.dependencyNodes[0].id).toBe('B');
      expect(result.relatedEdges).toHaveLength(1); // Only e1
    });

    it('should extract all dependents up to root when showAllDescendants is true', () => {
      // D -> C -> B -> A (chain, A at bottom)
      const nodes: Node[] = [
        { id: 'A', position: { x: 0, y: 0 }, data: {} },
        { id: 'B', position: { x: 0, y: 0 }, data: {} },
        { id: 'C', position: { x: 0, y: 0 }, data: {} },
        { id: 'D', position: { x: 0, y: 0 }, data: {} },
      ];
      const edges: Edge[] = [
        { id: 'e1', source: 'D', target: 'C' },
        { id: 'e2', source: 'C', target: 'B' },
        { id: 'e3', source: 'B', target: 'A' },
      ];

      const result = ScouterModeService.extractRelatedNodes('A', nodes, edges, {
        showAllDescendants: true,
      });

      expect(result.centerNode.id).toBe('A');
      expect(result.dependentNodes).toHaveLength(3); // B, C, D
      expect(result.dependentNodes.map((n) => n.id)).toEqual(
        expect.arrayContaining(['B', 'C', 'D'])
      );
      expect(result.relatedEdges).toHaveLength(3); // e1, e2, e3
    });

    it('should handle complex graph with showAllDescendants', () => {
      //     E
      //     ↓
      // D → A → B
      //     ↓
      //     C
      const nodes: Node[] = [
        { id: 'A', position: { x: 0, y: 0 }, data: {} },
        { id: 'B', position: { x: 0, y: 0 }, data: {} },
        { id: 'C', position: { x: 0, y: 0 }, data: {} },
        { id: 'D', position: { x: 0, y: 0 }, data: {} },
        { id: 'E', position: { x: 0, y: 0 }, data: {} },
      ];
      const edges: Edge[] = [
        { id: 'e1', source: 'A', target: 'B' },
        { id: 'e2', source: 'A', target: 'C' },
        { id: 'e3', source: 'D', target: 'A' },
        { id: 'e4', source: 'E', target: 'A' },
      ];

      const result = ScouterModeService.extractRelatedNodes('A', nodes, edges, {
        showAllDescendants: true,
      });

      expect(result.centerNode.id).toBe('A');
      expect(result.dependencyNodes).toHaveLength(2); // B, C
      expect(result.dependentNodes).toHaveLength(2); // D, E
      expect(result.relatedEdges).toHaveLength(4);
    });
  });

  describe('highlightCenterNode', () => {
    it('should increase node size by 1.5x', () => {
      const node: Node = {
        id: 'A',
        position: { x: 0, y: 0 },
        data: {},
        style: { width: 60, height: 60 },
      };

      const highlighted = ScouterModeService.highlightCenterNode(node);

      expect(highlighted.style?.width).toBe(90);
      expect(highlighted.style?.height).toBe(90);
    });

    it('should add border and shadow', () => {
      const node: Node = {
        id: 'A',
        position: { x: 0, y: 0 },
        data: {},
        style: {},
      };

      const highlighted = ScouterModeService.highlightCenterNode(node);

      expect(highlighted.style?.border).toContain('4px solid');
      expect(highlighted.style?.boxShadow).toBeDefined();
    });

    it('should mark node as scouter center in data', () => {
      const node: Node = {
        id: 'A',
        position: { x: 0, y: 0 },
        data: {},
      };

      const highlighted = ScouterModeService.highlightCenterNode(node);

      expect(highlighted.data.isScouterCenter).toBe(true);
    });

    it('should preserve existing node properties', () => {
      const node: Node = {
        id: 'A',
        position: { x: 100, y: 200 },
        data: { label: 'Test', someOtherProp: 'value' },
        style: { backgroundColor: 'red' },
      };

      const highlighted = ScouterModeService.highlightCenterNode(node);

      expect(highlighted.id).toBe('A');
      expect(highlighted.position).toEqual({ x: 100, y: 200 });
      expect(highlighted.data.label).toBe('Test');
      expect(highlighted.data.someOtherProp).toBe('value');
      expect(highlighted.style?.backgroundColor).toBe('red');
    });

    it('should use default size when style.width/height not provided', () => {
      const node: Node = {
        id: 'A',
        position: { x: 0, y: 0 },
        data: {},
      };

      const highlighted = ScouterModeService.highlightCenterNode(node);

      // Default 60 * 1.5 = 90
      expect(highlighted.style?.width).toBe(90);
      expect(highlighted.style?.height).toBe(90);
    });
  });
});
