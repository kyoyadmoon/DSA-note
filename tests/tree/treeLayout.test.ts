import { describe, expect, it } from "vitest";
import { bstInsert } from "@/lib/algorithms/tree/bstInsert";
import { calculateTreeLayout } from "@/lib/utils/treeLayout";

function byId(layout: ReturnType<typeof calculateTreeLayout>, value: number) {
  const node = layout.nodes.find((entry) => entry.value === value);
  if (!node) {
    throw new Error(`Missing node ${value}`);
  }
  return node;
}

describe("calculateTreeLayout", () => {
  it("returns an empty layout for null root", () => {
    expect(calculateTreeLayout(null)).toEqual({
      nodes: [],
      width: 0,
      height: 0,
    });
  });

  it("centers parents between left and right subtrees for balanced trees", () => {
    const layout = calculateTreeLayout(bstInsert([50, 30, 70, 20, 40, 60, 80]));
    const root = byId(layout, 50);
    const left = byId(layout, 30);
    const right = byId(layout, 70);

    expect(root.x).toBeCloseTo((left.x + right.x) / 2, 6);
    expect(left.x).toBeLessThan(root.x);
    expect(right.x).toBeGreaterThan(root.x);
  });

  it("keeps skewed right trees readable instead of collapsing nodes together", () => {
    const layout = calculateTreeLayout(bstInsert([1, 2, 3, 4, 5]));
    const xs = layout.nodes
      .sort((a, b) => a.value - b.value)
      .map((node) => node.x);

    for (let index = 1; index < xs.length; index++) {
      expect(xs[index]).toBeGreaterThan(xs[index - 1]);
    }
  });

  it("mirrors left-skewed and right-skewed trees with the same overall width", () => {
    const leftHeavy = calculateTreeLayout(bstInsert([5, 4, 3, 2, 1]));
    const rightHeavy = calculateTreeLayout(bstInsert([1, 2, 3, 4, 5]));

    expect(leftHeavy.width).toBe(rightHeavy.width);
    expect(leftHeavy.height).toBe(rightHeavy.height);
  });

  it("does not let a single grandchild pull the subtree excessively sideways", () => {
    const layout = calculateTreeLayout(bstInsert([50, 30, 70, 20]));
    const leftChild = byId(layout, 30);
    const grandChild = byId(layout, 20);

    expect(leftChild.x - grandChild.x).toBeLessThanOrEqual(40);
  });
});
