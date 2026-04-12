import { describe, expect, it } from "vitest";
import {
  postorder,
  postorderSteps,
  postorderSource,
} from "@/lib/algorithms/tree/postorder";
import type { TreeNode } from "@/lib/types/tree";

// Helpers ────────────────────────────────────────────────────

function buildFromValues(values: number[]): TreeNode | null {
  // Mirror the BST used internally by postorderSteps so tests can
  // construct an expected tree without depending on _shared.
  let root: TreeNode | null = null;
  let nextId = 0;
  function insert(node: TreeNode | null, value: number): TreeNode {
    if (!node)
      return { id: `ref-${nextId++}`, value, left: null, right: null };
    if (value < node.value) node.left = insert(node.left, value);
    else node.right = insert(node.right, value);
    return node;
  }
  for (const v of values) root = insert(root, v);
  return root;
}

function collectIds(node: TreeNode | null): string[] {
  if (!node) return [];
  return [node.id, ...collectIds(node.left), ...collectIds(node.right)];
}

function parseOutput(detail: string): number[] {
  const match = detail.match(/\[([^\]]*)\]/);
  if (!match) return [];
  const content = match[1].trim();
  if (!content) return [];
  return content.split(",").map((value) => Number(value.trim()));
}

// postorder (pure) ───────────────────────────────────────────

describe("postorder", () => {
  it("returns [] for null root", () => {
    expect(postorder(null)).toEqual([]);
  });

  it("handles single node", () => {
    const root = buildFromValues([42]);
    expect(postorder(root)).toEqual([42]);
  });

  it("handles left-only chain (reverse-sorted input)", () => {
    const root = buildFromValues([5, 4, 3, 2, 1]);
    expect(postorder(root)).toEqual([1, 2, 3, 4, 5]);
  });

  it("handles right-only chain (sorted input)", () => {
    const root = buildFromValues([1, 2, 3, 4, 5]);
    expect(postorder(root)).toEqual([5, 4, 3, 2, 1]);
  });

  it("handles a balanced BST with known order", () => {
    const root = buildFromValues([50, 30, 70, 20, 40, 60, 80]);
    expect(postorder(root)).toEqual([20, 40, 30, 60, 80, 70, 50]);
  });

  it("visits children before the root in a simple tree", () => {
    const root = buildFromValues([5, 3, 7]);
    expect(postorder(root)).toEqual([3, 7, 5]);
  });

  it("survives 200 random inputs (matches naive recursive reference)", () => {
    function referencePostorder(node: TreeNode | null): number[] {
      if (!node) return [];
      return [
        ...referencePostorder(node.left),
        ...referencePostorder(node.right),
        node.value,
      ];
    }
    for (let trial = 0; trial < 200; trial++) {
      const len = Math.floor(Math.random() * 20) + 1;
      const values = Array.from(
        { length: len },
        () => Math.floor(Math.random() * 200) - 100,
      );
      const root = buildFromValues(values);
      expect(postorder(root)).toEqual(referencePostorder(root));
    }
  });
});

// postorderSteps ─────────────────────────────────────────────

describe("postorderSteps", () => {
  it("starts with phase idle", () => {
    const steps = postorderSteps([50, 30, 70]);
    expect(steps[0].phase).toBe("idle");
  });

  it("ends with phase done", () => {
    const steps = postorderSteps([50, 30, 70]);
    expect(steps[steps.length - 1].phase).toBe("done");
  });

  it("every step has non-empty title and detail", () => {
    const steps = postorderSteps([50, 30, 70, 20, 40]);
    for (const step of steps) {
      expect(step.title).toBeTruthy();
      expect(step.detail).toBeTruthy();
      expect(typeof step.title).toBe("string");
      expect(typeof step.detail).toBe("string");
    }
  });

  it("every codeLine is within the source line range", () => {
    const steps = postorderSteps([50, 30, 70, 20, 40]);
    const totalLines = postorderSource.split("\n").length;
    for (const step of steps) {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(totalLines);
    }
  });

  it("node ids are stable across all steps", () => {
    const steps = postorderSteps([50, 30, 70, 20, 40, 60, 80]);
    const finalIds = new Set(
      collectIds(steps[steps.length - 1].root),
    );
    for (const step of steps) {
      const ids = new Set(collectIds(step.root));
      for (const id of ids) expect(finalIds.has(id)).toBe(true);
    }
  });

  it("final step's output sequence matches postorder(root)", () => {
    const input = [50, 30, 70, 20, 40, 60, 80];
    const root = buildFromValues(input);
    const expected = postorder(root);
    const steps = postorderSteps(input);
    const actual = parseOutput(steps[steps.length - 1].detail);
    expect(actual).toEqual(expected);
  });

  it("the last output value is always the root value", () => {
    const input = [50, 30, 70, 20, 40, 60, 80];
    const root = buildFromValues(input);
    const steps = postorderSteps(input);
    const output = parseOutput(steps[steps.length - 1].detail);
    expect(output[output.length - 1]).toBe(root?.value);
  });

  it("handles empty input", () => {
    const steps = postorderSteps([]);
    expect(steps[0].phase).toBe("idle");
    expect(steps[steps.length - 1].phase).toBe("done");
    expect(steps[steps.length - 1].root).toBeNull();
  });

  it("handles single element input", () => {
    const steps = postorderSteps([42]);
    expect(steps[0].phase).toBe("idle");
    expect(steps[steps.length - 1].phase).toBe("done");
    const visitSteps = steps.filter((s) => s.phase === "visit");
    expect(visitSteps.length).toBe(2);
  });

  it("operates without throwing on 100 random inputs", () => {
    for (let trial = 0; trial < 100; trial++) {
      const len = Math.floor(Math.random() * 15) + 1;
      const values = Array.from(
        { length: len },
        () => Math.floor(Math.random() * 200) - 100,
      );
      const steps = postorderSteps(values);
      expect(steps[0].phase).toBe("idle");
      expect(steps[steps.length - 1].phase).toBe("done");
    }
  });
});
