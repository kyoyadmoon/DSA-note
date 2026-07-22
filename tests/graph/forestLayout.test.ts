import { describe, expect, it } from "vitest";
import {
  FOREST_LEVEL_HEIGHT,
  FOREST_NODE_RADIUS,
  calculateForestLayout,
} from "@/lib/utils/forestLayout";

describe("calculateForestLayout", () => {
  it("returns an empty layout for an empty forest", () => {
    expect(calculateForestLayout([])).toEqual({
      nodes: [],
      edges: [],
      width: 0,
      height: 0,
    });
  });

  it("aligns a single-child chain and preserves every parent edge", () => {
    const layout = calculateForestLayout([0, 0, 1, 2]);
    const nodes = [...layout.nodes].sort((a, b) => a.id - b.id);

    expect(nodes.map((node) => node.x)).toEqual([
      nodes[0].x,
      nodes[0].x,
      nodes[0].x,
      nodes[0].x,
    ]);
    expect(nodes.map((node) => node.y - nodes[0].y)).toEqual([
      0,
      FOREST_LEVEL_HEIGHT,
      FOREST_LEVEL_HEIGHT * 2,
      FOREST_LEVEL_HEIGHT * 3,
    ]);
    expect(
      layout.edges.map(({ from, to }) => [from, to]).sort((a, b) => a[0] - b[0]),
    ).toEqual([
      [1, 0],
      [2, 1],
      [3, 2],
    ]);
  });

  it("places siblings on opposite sides of their parent", () => {
    const layout = calculateForestLayout([0, 0, 0]);
    const byId = new Map(layout.nodes.map((node) => [node.id, node]));
    const root = byId.get(0)!;
    const left = byId.get(1)!;
    const right = byId.get(2)!;

    expect(left.x).toBeLessThan(root.x);
    expect(right.x).toBeGreaterThan(root.x);
    expect((left.x + right.x) / 2).toBe(root.x);
  });

  it("wraps a wide set of components without losing nodes", () => {
    const parents = Array.from({ length: 20 }, (_, index) => index);
    const layout = calculateForestLayout(parents);
    const rows = new Set(layout.nodes.map((node) => node.y));

    expect(layout.nodes.map((node) => node.id).sort((a, b) => a - b)).toEqual(
      parents,
    );
    expect(layout.edges).toHaveLength(0);
    expect(rows.size).toBeGreaterThan(1);
    expect(layout.width).toBeGreaterThan(0);
    expect(layout.height).toBeGreaterThan(0);
  });

  it("keeps a wide, uneven component inside the SVG bounds", () => {
    const layout = calculateForestLayout([0, 0, 0, 2, 0, 4, 0, 0]);

    expect(layout.nodes).toHaveLength(8);
    for (const node of layout.nodes) {
      expect(node.x - FOREST_NODE_RADIUS).toBeGreaterThanOrEqual(0);
      expect(node.x + FOREST_NODE_RADIUS).toBeLessThanOrEqual(layout.width);
      expect(node.y - FOREST_NODE_RADIUS).toBeGreaterThanOrEqual(0);
      expect(node.y + FOREST_NODE_RADIUS).toBeLessThanOrEqual(layout.height);
    }
  });
});
