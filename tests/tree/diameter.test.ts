import { describe, expect, it } from "vitest";
import {
  diameter,
  diameterSteps,
  diameterSource,
} from "@/lib/algorithms/tree/diameter";
import type { TreeNode } from "@/lib/types/tree";

function buildFromValues(values: number[]): TreeNode | null {
  let root: TreeNode | null = null;
  let nextId = 0;

  function insert(node: TreeNode | null, value: number): TreeNode {
    if (!node)
      return { id: `ref-${nextId++}`, value, left: null, right: null };
    if (value < node.value) node.left = insert(node.left, value);
    else node.right = insert(node.right, value);
    return node;
  }

  for (const value of values) root = insert(root, value);
  return root;
}

function collectIds(node: TreeNode | null): string[] {
  if (!node) return [];
  return [node.id, ...collectIds(node.left), ...collectIds(node.right)];
}

function makeNode(
  id: string,
  value: number,
  left: TreeNode | null = null,
  right: TreeNode | null = null,
): TreeNode {
  return { id, value, left, right };
}

describe("diameter", () => {
  it("returns 0 for null root", () => {
    expect(diameter(null)).toBe(0);
  });

  it("returns 0 for a single node", () => {
    expect(diameter(buildFromValues([42]))).toBe(0);
  });

  it("returns 1 for a two-node tree", () => {
    expect(diameter(buildFromValues([5, 3]))).toBe(1);
  });

  it("handles a left-skewed tree with n - 1 edges", () => {
    expect(diameter(buildFromValues([5, 4, 3, 2, 1]))).toBe(4);
  });

  it("handles a balanced 7-node tree with known diameter", () => {
    expect(diameter(buildFromValues([50, 30, 70, 20, 40, 60, 80]))).toBe(4);
  });

  it("handles an asymmetric tree whose diameter does not pass through the root", () => {
    const root = makeNode(
      "n1",
      1,
      makeNode(
        "n2",
        2,
        makeNode("n4", 4, makeNode("n8", 8)),
        makeNode("n5", 5, null, makeNode("n9", 9)),
      ),
      null,
    );

    expect(diameter(root)).toBe(4);
  });
});

describe("diameterSteps", () => {
  it("starts with phase idle", () => {
    const steps = diameterSteps([50, 30, 70]);
    expect(steps[0].phase).toBe("idle");
  });

  it("ends with phase done", () => {
    const steps = diameterSteps([50, 30, 70]);
    expect(steps[steps.length - 1].phase).toBe("done");
  });

  it("every step has non-empty title and detail", () => {
    const steps = diameterSteps([50, 30, 70, 20, 40]);
    for (const step of steps) {
      expect(step.title).toBeTruthy();
      expect(step.detail).toBeTruthy();
      expect(typeof step.title).toBe("string");
      expect(typeof step.detail).toBe("string");
    }
  });

  it("node ids are stable across all steps", () => {
    const steps = diameterSteps([50, 30, 70, 20, 40, 60, 80]);
    const finalIds = new Set(collectIds(steps[steps.length - 1].root));
    for (const step of steps) {
      const ids = new Set(collectIds(step.root));
      for (const id of ids) expect(finalIds.has(id)).toBe(true);
    }
  });

  it("every codeLine is within the source line range", () => {
    const steps = diameterSteps([50, 30, 70, 20, 40]);
    const totalLines = diameterSource.split("\n").length;
    for (const step of steps) {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(totalLines);
    }
  });

  it("final detail contains the correct diameter number", () => {
    const steps = diameterSteps([50, 30, 70, 20, 40, 60, 80]);
    expect(steps[steps.length - 1].detail).toContain("4");
  });

  it("includes at least one narration step that mentions maxDiam", () => {
    const steps = diameterSteps([50, 30, 70, 20, 40, 60, 80]);
    expect(steps.some((step) => step.detail.includes("maxDiam"))).toBe(true);
  });
});
