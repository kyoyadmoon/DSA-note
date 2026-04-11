import { describe, expect, it } from "vitest";
import {
  buildBSTFromValues,
  buildNodeStates,
  cloneTree,
  collectNodeIds,
  createIdAllocator,
  makeTreeStep,
} from "@/lib/algorithms/tree/_shared";
import type { TreeNode } from "@/lib/types/tree";

function inorder(node: TreeNode | null): number[] {
  if (!node) return [];
  return [...inorder(node.left), node.value, ...inorder(node.right)];
}

describe("createIdAllocator", () => {
  it("emits sequential ids with the given prefix", () => {
    const alloc = createIdAllocator("pre");
    expect(alloc()).toBe("pre-0");
    expect(alloc()).toBe("pre-1");
    expect(alloc()).toBe("pre-2");
  });

  it("independent allocators do not share counters", () => {
    const a = createIdAllocator("a");
    const b = createIdAllocator("b");
    a();
    a();
    expect(b()).toBe("b-0");
    expect(a()).toBe("a-2");
  });
});

describe("buildBSTFromValues", () => {
  it("returns null for empty input", () => {
    const alloc = createIdAllocator("t");
    expect(buildBSTFromValues([], alloc)).toBeNull();
  });

  it("maintains BST property", () => {
    const alloc = createIdAllocator("t");
    const root = buildBSTFromValues([50, 30, 70, 20, 40, 60, 80], alloc);
    expect(inorder(root)).toEqual([20, 30, 40, 50, 60, 70, 80]);
  });

  it("assigns unique ids to every node", () => {
    const alloc = createIdAllocator("t");
    const root = buildBSTFromValues([5, 3, 7, 1, 4, 6, 8], alloc);
    const ids = collectNodeIds(root);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id.startsWith("t-")).toBe(true);
  });

  it("handles sorted input (right-only chain)", () => {
    const alloc = createIdAllocator("t");
    const root = buildBSTFromValues([1, 2, 3, 4, 5], alloc);
    expect(inorder(root)).toEqual([1, 2, 3, 4, 5]);
    let current = root;
    let depth = 0;
    while (current) {
      expect(current.left).toBeNull();
      current = current.right;
      depth++;
    }
    expect(depth).toBe(5);
  });
});

describe("cloneTree", () => {
  it("returns null for null input", () => {
    expect(cloneTree(null)).toBeNull();
  });

  it("produces an independent copy", () => {
    const alloc = createIdAllocator("t");
    const original = buildBSTFromValues([5, 3, 7], alloc);
    const copy = cloneTree(original);
    expect(copy).not.toBe(original);
    expect(copy!.left).not.toBe(original!.left);
    expect(copy!.value).toBe(original!.value);
    // Mutating copy must not touch original
    copy!.value = 999;
    expect(original!.value).toBe(5);
  });

  it("preserves values, ids and structure", () => {
    const alloc = createIdAllocator("t");
    const original = buildBSTFromValues([5, 3, 7, 1, 4], alloc);
    const copy = cloneTree(original);
    expect(collectNodeIds(copy)).toEqual(collectNodeIds(original));
    expect(inorder(copy)).toEqual(inorder(original));
  });
});

describe("collectNodeIds", () => {
  it("returns empty for null", () => {
    expect(collectNodeIds(null)).toEqual([]);
  });

  it("returns preorder sequence of ids", () => {
    const alloc = createIdAllocator("t");
    // Build with known ids: insertion order 5, 3, 7 ⇒ t-0 (root=5), t-1 (left=3), t-2 (right=7)
    const root = buildBSTFromValues([5, 3, 7], alloc);
    expect(collectNodeIds(root)).toEqual(["t-0", "t-1", "t-2"]);
  });
});

describe("buildNodeStates", () => {
  it("defaults every node to idle", () => {
    const alloc = createIdAllocator("t");
    const root = buildBSTFromValues([5, 3, 7], alloc);
    const states = buildNodeStates(root);
    for (const id of collectNodeIds(root)) {
      expect(states[id]).toBe("idle");
    }
  });

  it("applies overrides", () => {
    const alloc = createIdAllocator("t");
    const root = buildBSTFromValues([5, 3, 7], alloc);
    const [rootId, leftId] = collectNodeIds(root);
    const states = buildNodeStates(root, {
      [rootId]: "path",
      [leftId]: "comparing",
    });
    expect(states[rootId]).toBe("path");
    expect(states[leftId]).toBe("comparing");
  });
});

describe("makeTreeStep", () => {
  it("returns a TreeStep with cloned root and extras merged in", () => {
    const alloc = createIdAllocator("t");
    const original = buildBSTFromValues([5, 3, 7], alloc);
    const step = makeTreeStep(original, {}, {
      phase: "idle",
      codeLine: 1,
      title: "t",
      detail: "d",
    });
    expect(step.root).not.toBe(original);
    expect(inorder(step.root)).toEqual([3, 5, 7]);
    expect(step.phase).toBe("idle");
    expect(step.title).toBe("t");
  });
});
