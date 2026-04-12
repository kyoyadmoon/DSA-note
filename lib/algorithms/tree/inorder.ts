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

export function inorder(root: TreeNode | null): number[] {
  const out: number[] = [];
  visit(root, out);
  return out;
}

function visit(node: TreeNode | null, out: number[]): void {
  if (node === null) return;
  visit(node.left, out);
  out.push(node.value);
  visit(node.right, out);
}

// ── step generator ─────────────────────────────────────────────

export function inorderSteps(values: number[]): TreeStep[] {
  const allocId = createIdAllocator("in");
  const root = buildBSTFromValues(values, allocId);
  const steps: TreeStep[] = [];

  steps.push(
    makeTreeStep(root, {}, {
      phase: "idle",
      codeLine: 1,
      title: "準備中序走訪",
      detail: root
        ? `將依「左 → 根 → 右」的順序走訪 ${values.length} 個節點：[${values.join(", ")}]。`
        : "樹是空的，沒有要走訪的節點。",
    }),
  );

  if (!root) {
    steps.push(
      makeTreeStep(root, {}, {
        phase: "done",
        codeLine: 2,
        title: "中序走訪完成",
        detail: "空樹的輸出序列為 []。",
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
  ) {
    const currentOverrides = buildOverrides(ancestors, node.id);

    steps.push({
      ...makeTreeStep(root, currentOverrides, {
        phase: "visit",
        codeLine: 3,
        title: `先看 ${node.value} 的左側`,
        detail: node.left
          ? `中序會先走左子樹，所以從 ${node.value} 往左進入 ${node.left.value}。`
          : `節點 ${node.value} 沒有左子樹，下一步就輪到輸出 ${node.value}。`,
      }),
      currentNodeId: node.id,
      activeEdge: node.left
        ? { from: node.id, to: node.left.id }
        : undefined,
    });

    const nextAncestors = [...ancestors, node];
    if (node.left) {
      walk(node.left, nextAncestors, node);
    }

    output.push(node.value);
    steps.push({
      ...makeTreeStep(root, buildOverrides(ancestors, node.id), {
        phase: "visit",
        codeLine: 4,
        title: `輸出 ${node.value}`,
        detail: `左子樹已處理完，將 ${node.value} 加入結果序列，目前 [${output.join(", ")}]。`,
      }),
      currentNodeId: node.id,
    });

    visitedIds.push(node.id);

    steps.push({
      ...makeTreeStep(root, buildOverrides(ancestors, node.id), {
        phase: "visit",
        codeLine: 5,
        title: `改看 ${node.value} 的右側`,
        detail: node.right
          ? `輸出 ${node.value} 後，依規則從 ${node.value} 往右進入 ${node.right.value}。`
          : `節點 ${node.value} 沒有右子樹，因此準備回到上一層。`,
      }),
      currentNodeId: node.id,
      activeEdge: node.right
        ? { from: node.id, to: node.right.id }
        : undefined,
    });

    if (node.right) {
      walk(node.right, nextAncestors, node);
    }

    steps.push({
      ...makeTreeStep(root, buildOverrides(ancestors, node.id), {
        phase: "visit",
        codeLine: 6,
        title: `完成節點 ${node.value}`,
        detail:
          parent === null
            ? `節點 ${node.value} 的左右子樹都完成了，目前輸出為 [${output.join(", ")}]。`
            : `節點 ${node.value} 的左右子樹都完成了，現在回到父節點 ${parent.value}。`,
      }),
      currentNodeId: node.id,
    });
  }

  walk(root, [], null);

  const doneOverrides: Record<string, TreeNodeState> = {};
  for (const id of visitedIds) doneOverrides[id] = "visited";
  steps.push(
    makeTreeStep(root, doneOverrides, {
      phase: "done",
      codeLine: 6,
      title: "中序走訪完成",
      detail: `輸出序列：[${output.join(", ")}]；因為這棵樹是 BST，所以中序結果正好是由小到大排序。`,
    }),
  );

  return steps;
}

// ── source code (for CodePanel) ────────────────────────────────

export const inorderSource = `function inorder(node: TreeNode | null, out: number[]) {
  if (node === null) return;
  inorder(node.left, out);     // 左
  out.push(node.value);        // 根
  inorder(node.right, out);    // 右
}`;

// ── metadata ───────────────────────────────────────────────────

export const inorderMeta: TreeAlgorithmMeta = {
  name: "中序走訪 (Inorder)",
  slug: "tree-inorder",
  category: "tree",
  timeBest: "O(n)",
  timeAvg: "O(n)",
  timeWorst: "O(n)",
  space: "O(h)",
  tags: ["走訪", "DFS", "遞迴", "BST"],
};
