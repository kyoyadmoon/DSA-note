import type {
  TreeNode,
  TreeNodeState,
  TreeStep,
  TreeAlgorithmMeta,
} from "@/lib/types/tree";
import {
  buildBSTFromValues,
  createIdAllocator,
  makeTreeStep,
} from "./_shared";

// ── pure function (testable) ───────────────────────────────────

export function preorder(root: TreeNode | null): number[] {
  const out: number[] = [];
  visit(root, out);
  return out;
}

function visit(node: TreeNode | null, out: number[]): void {
  if (node === null) return;
  out.push(node.value);
  visit(node.left, out);
  visit(node.right, out);
}

// ── step generator ─────────────────────────────────────────────

type ChildSide = "root" | "left" | "right";

export function preorderSteps(values: number[]): TreeStep[] {
  const allocId = createIdAllocator("pre");
  const root = buildBSTFromValues(values, allocId);
  const steps: TreeStep[] = [];

  steps.push(
    makeTreeStep(root, {}, {
      phase: "idle",
      codeLine: 1,
      title: "準備前序走訪",
      detail: root
        ? `將依「根 → 左 → 右」的順序走訪 ${values.length} 個節點：[${values.join(", ")}]。`
        : "樹是空的，沒有要走訪的節點。",
    }),
  );

  if (!root) {
    steps.push(
      makeTreeStep(root, {}, {
        phase: "done",
        codeLine: 2,
        title: "前序走訪完成",
        detail: "空樹，輸出序列為 []。",
      }),
    );
    return steps;
  }

  const visitedIds: string[] = [];
  const output: number[] = [];

  function buildOverrides(
    ancestors: TreeNode[],
    currentId: string,
  ): Record<string, TreeNodeState> {
    const overrides: Record<string, TreeNodeState> = {};
    for (const id of visitedIds) overrides[id] = "visited";
    for (const a of ancestors) overrides[a.id] = "path";
    overrides[currentId] = "comparing";
    return overrides;
  }

  function walk(
    node: TreeNode,
    ancestors: TreeNode[],
    parent: TreeNode | null,
    side: ChildSide,
  ) {
    // Step A — descend into this node (null guard passed)
    const descendLine = side === "left" ? 4 : side === "right" ? 5 : 2;
    const descendTitle =
      side === "root"
        ? `從根節點 ${node.value} 開始`
        : `進入節點 ${node.value}`;
    const descendDetail =
      parent === null
        ? `根節點 ${node.value} 是前序走訪的起點。`
        : side === "left"
          ? `從節點 ${parent.value} 往左遞迴，抵達節點 ${node.value}。`
          : `從節點 ${parent.value} 往右遞迴，抵達節點 ${node.value}。`;

    steps.push({
      ...makeTreeStep(root, buildOverrides(ancestors, node.id), {
        phase: "visit",
        codeLine: descendLine,
        title: descendTitle,
        detail: descendDetail,
      }),
      currentNodeId: node.id,
      activeEdge: parent
        ? { from: parent.id, to: node.id }
        : undefined,
    });

    // Step B — output this node (the "visit" in preorder)
    output.push(node.value);
    steps.push({
      ...makeTreeStep(root, buildOverrides(ancestors, node.id), {
        phase: "visit",
        codeLine: 3,
        title: `輸出 ${node.value}`,
        detail: `將 ${node.value} 加入結果序列，目前 [${output.join(", ")}]。`,
      }),
      currentNodeId: node.id,
      activeEdge: parent
        ? { from: parent.id, to: node.id }
        : undefined,
    });

    visitedIds.push(node.id);

    // Recurse left, then right
    const nextAncestors = [...ancestors, node];
    if (node.left) {
      walk(node.left, nextAncestors, node, "left");
    }
    if (node.right) {
      walk(node.right, nextAncestors, node, "right");
    }
  }

  walk(root, [], null, "root");

  // Final step
  const doneOverrides: Record<string, TreeNodeState> = {};
  for (const id of visitedIds) doneOverrides[id] = "visited";
  steps.push(
    makeTreeStep(root, doneOverrides, {
      phase: "done",
      codeLine: 6,
      title: "前序走訪完成",
      detail: `走訪結束，輸出序列：[${output.join(", ")}]。`,
    }),
  );

  return steps;
}

// ── source code (for CodePanel) ────────────────────────────────

export const preorderSource = `function preorder(node: TreeNode | null, out: number[]) {
  if (node === null) return;
  out.push(node.value);        // 先輸出根
  preorder(node.left, out);    // 再遞迴左子樹
  preorder(node.right, out);   // 最後遞迴右子樹
}`;

// ── metadata ───────────────────────────────────────────────────

export const preorderMeta: TreeAlgorithmMeta = {
  name: "前序走訪 (Preorder)",
  slug: "tree-preorder",
  category: "tree",
  timeBest: "O(n)",
  timeAvg: "O(n)",
  timeWorst: "O(n)",
  space: "O(h)",
  tags: ["走訪", "DFS", "遞迴", "基礎"],
};
