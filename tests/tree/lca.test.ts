import { describe, expect, it } from "vitest";
import { lca, lcaSteps, lcaSource } from "@/lib/algorithms/tree/lca";
import type { TreeNode } from "@/lib/types/tree";

function collectIds(node: TreeNode | null): string[] {
  if (!node) return [];
  return [node.id, ...collectIds(node.left), ...collectIds(node.right)];
}

function buildReferenceTree(): TreeNode {
  return {
    id: "n3",
    value: 3,
    left: {
      id: "n5",
      value: 5,
      left: { id: "n6", value: 6, left: null, right: null },
      right: {
        id: "n2",
        value: 2,
        left: { id: "n7", value: 7, left: null, right: null },
        right: { id: "n4", value: 4, left: null, right: null },
      },
    },
    right: {
      id: "n1",
      value: 1,
      left: { id: "n0", value: 0, left: null, right: null },
      right: { id: "n8", value: 8, left: null, right: null },
    },
  };
}

describe("lca", () => {
  it("returns null for null root", () => {
    expect(lca(null, 1, 2)).toBeNull();
  });

  it("handles a single node where p = q = root", () => {
    const root: TreeNode = {
      id: "root",
      value: 42,
      left: null,
      right: null,
    };
    expect(lca(root, 42, 42)).toBe(42);
  });

  it("returns the root when p and q are in different subtrees", () => {
    const root = buildReferenceTree();
    expect(lca(root, 5, 1)).toBe(3);
  });

  it("returns p when p is an ancestor of q", () => {
    const root = buildReferenceTree();
    expect(lca(root, 5, 4)).toBe(5);
  });

  it("returns the direct parent for siblings", () => {
    const root = buildReferenceTree();
    expect(lca(root, 7, 4)).toBe(2);
  });

  it("matches a known example tree", () => {
    const root = buildReferenceTree();
    expect(lca(root, 6, 4)).toBe(5);
  });
});

describe("lcaSteps", () => {
  const input = [50, 30, 70, 20, 40, 60, 80];
  const steps = lcaSteps(input);
  const sorted = [...input].sort((a, b) => a - b);
  const p = sorted[Math.floor(sorted.length / 4)];
  const q = sorted[Math.floor((3 * sorted.length) / 4)];

  it("starts with phase idle", () => {
    expect(steps[0].phase).toBe("idle");
  });

  it("ends with phase done", () => {
    expect(steps[steps.length - 1].phase).toBe("done");
  });

  it("every step has non-empty title and detail", () => {
    for (const step of steps) {
      expect(step.title).toBeTruthy();
      expect(step.detail).toBeTruthy();
    }
  });

  it("keeps node ids stable across all steps", () => {
    const finalIds = new Set(collectIds(steps[steps.length - 1].root));
    for (const step of steps) {
      const ids = new Set(collectIds(step.root));
      expect(ids).toEqual(finalIds);
    }
  });

  it("keeps codeLine within the source line range", () => {
    const totalLines = lcaSource.split("\n").length;
    for (const step of steps) {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(totalLines);
    }
  });

  it("mentions both target values in the opening step", () => {
    expect(steps[0].detail).toContain(String(p));
    expect(steps[0].detail).toContain(String(q));
  });

  it("has at least one step mentioning both target values", () => {
    expect(
      steps.some(
        (step) =>
          step.detail.includes(String(p)) && step.detail.includes(String(q)),
      ),
    ).toBe(true);
  });

  it("final step detail contains the correct LCA value", () => {
    expect(steps[steps.length - 1].detail).toContain("50");
  });

  it("handles empty input", () => {
    const emptySteps = lcaSteps([]);
    expect(emptySteps[0].phase).toBe("idle");
    expect(emptySteps[emptySteps.length - 1].phase).toBe("done");
  });
});
