import { describe, expect, it } from "vitest";
import {
  isSymmetric,
  symmetricSteps,
} from "@/lib/algorithms/tree/symmetric";
import type { TreeNode } from "@/lib/types/tree";

function buildLevelOrderTree(values: Array<number | null>): TreeNode | null {
  if (values.length === 0 || values[0] === null) return null;

  const nodes: Array<TreeNode | null> = values.map((value, index) =>
    value === null
      ? null
      : {
          id: `lvl-${index}`,
          value,
          left: null,
          right: null,
        },
  );

  for (let index = 0; index < nodes.length; index++) {
    const node = nodes[index];
    if (!node) continue;

    const leftIndex = index * 2 + 1;
    const rightIndex = index * 2 + 2;
    node.left = nodes[leftIndex] ?? null;
    node.right = nodes[rightIndex] ?? null;
  }

  return nodes[0];
}

function bruteIsSymmetric(root: TreeNode | null): boolean {
  if (!root) return true;

  const queue: Array<[TreeNode | null, TreeNode | null]> = [[
    root.left,
    root.right,
  ]];

  while (queue.length > 0) {
    const [left, right] = queue.shift()!;

    if (!left && !right) continue;
    if (!left || !right) return false;
    if (left.value !== right.value) return false;

    queue.push([left.left, right.right]);
    queue.push([left.right, right.left]);
  }

  return true;
}

function buildRandomTree(seed: number): TreeNode | null {
  const size = seed % 12;
  if (size === 0) return null;

  const nodes: TreeNode[] = Array.from({ length: size }, (_, index) => ({
    id: `rnd-${seed}-${index}`,
    value: (seed * 31 + index * 17) % 5,
    left: null,
    right: null,
  }));

  const availableParents = [nodes[0]];
  for (let index = 1; index < nodes.length; index++) {
    while (availableParents.length > 0) {
      const parentIndex = (seed + index + availableParents.length) % availableParents.length;
      const parent = availableParents[parentIndex];
      const preferLeft = ((seed + index) & 1) === 0;

      if (preferLeft && !parent.left) {
        parent.left = nodes[index];
        break;
      }

      if (!preferLeft && !parent.right) {
        parent.right = nodes[index];
        break;
      }

      if (!parent.left) {
        parent.left = nodes[index];
        break;
      }

      if (!parent.right) {
        parent.right = nodes[index];
        break;
      }

      availableParents.splice(parentIndex, 1);
    }

    availableParents.push(nodes[index]);
  }

  return nodes[0];
}

function collectIds(node: TreeNode | null): string[] {
  if (!node) return [];
  return [node.id, ...collectIds(node.left), ...collectIds(node.right)];
}

describe("isSymmetric", () => {
  it("matches a brute-force mirror check on 200 random trees", () => {
    for (let seed = 0; seed < 200; seed++) {
      const root = buildRandomTree(seed + 1);
      expect(isSymmetric(root)).toBe(bruteIsSymmetric(root));
    }
  });

  it("handles edge cases from LeetCode 101", () => {
    expect(isSymmetric(null)).toBe(true);
    expect(isSymmetric(buildLevelOrderTree([1]))).toBe(true);
    expect(isSymmetric(buildLevelOrderTree([1, 2, 2, 3, 4, 4, 3]))).toBe(true);
    expect(isSymmetric(buildLevelOrderTree([1, 2, 2, null, 3, null, 3]))).toBe(
      false,
    );
  });
});

describe("symmetricSteps", () => {
  it("keeps the node id set stable across all steps", () => {
    const steps = symmetricSteps([4, 2, 6, 1, 3, 5, 7]);
    const baseline = new Set(collectIds(steps[0].root));

    for (const step of steps) {
      expect(new Set(collectIds(step.root))).toEqual(baseline);
    }
  });

  it("preserves the same node multiset across all steps", () => {
    const steps = symmetricSteps([4, 2, 6, 1, 3, 5, 7]);
    const baseline = collectIds(steps[0].root).sort();

    for (const step of steps) {
      expect(collectIds(step.root).sort()).toEqual(baseline);
    }
  });

  it("ends with phase 'done' and mentions the boolean result in detail", () => {
    const steps = symmetricSteps([4, 2, 6, 1, 3, 5, 7]);
    const finalStep = steps[steps.length - 1];

    expect(finalStep.phase).toBe("done");
    expect(finalStep.detail).toContain("false");
  });

  it("keeps stable ids throughout the full steps sequence", () => {
    const steps = symmetricSteps([9]);
    const baselineIds = collectIds(steps[0].root);

    for (const step of steps) {
      expect(collectIds(step.root)).toEqual(baselineIds);
    }
  });
});
