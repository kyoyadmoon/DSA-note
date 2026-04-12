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

export function postorder(root: TreeNode | null): number[] {
  const out: number[] = [];
  visit(root, out);
  return out;
}

function visit(node: TreeNode | null, out: number[]): void {
  if (node === null) return;
  visit(node.left, out);
  visit(node.right, out);
  out.push(node.value);
}

// ── step generator ─────────────────────────────────────────────

type ChildSide = "root" | "left" | "right";

export function postorderSteps(values: number[]): TreeStep[] {
  const allocId = createIdAllocator("post");
  const root = buildBSTFromValues(values, allocId);
  const steps: TreeStep[] = [];

  steps.push(
    makeTreeStep(root, {}, {
      phase: "idle",
      codeLine: 1,
      title: "準備後序走訪",
      detail: root
        ? `將依「左 → 右 → 根」的順序走訪 ${values.length} 個節點：[${values.join(", ")}]。`
        : "樹是空的，沒有要走訪的節點。",
    }),
  );

  if (!root) {
    steps.push(
      makeTreeStep(root, {}, {
        phase: "done",
        codeLine: 2,
        title: "後序走訪完成",
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
    const descendLine = side === "left" ? 3 : side === "right" ? 4 : 2;
    const descendTitle =
      side === "root"
        ? `從根節點 ${node.value} 開始`
        : `進入節點 ${node.value}`;
    const descendDetail =
      parent === null
        ? `根節點 ${node.value} 是後序走訪的起點。`
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

    const nextAncestors = [...ancestors, node];
    if (node.left) {
      walk(node.left, nextAncestors, node, "left");
    }
    if (node.right) {
      walk(node.right, nextAncestors, node, "right");
    }

    // Step B — output this node after both subtrees are done
    output.push(node.value);
    steps.push({
      ...makeTreeStep(root, buildOverrides(ancestors, node.id), {
        phase: "visit",
        codeLine: 5,
        title: `輸出 ${node.value}`,
        detail: `左子樹與右子樹都處理完後，將 ${node.value} 加入結果序列，目前 [${output.join(", ")}]。`,
      }),
      currentNodeId: node.id,
      activeEdge: parent
        ? { from: parent.id, to: node.id }
        : undefined,
    });

    visitedIds.push(node.id);
  }

  walk(root, [], null, "root");

  // Final step
  const doneOverrides: Record<string, TreeNodeState> = {};
  for (const id of visitedIds) doneOverrides[id] = "visited";
  steps.push(
    makeTreeStep(root, doneOverrides, {
      phase: "done",
      codeLine: 6,
      title: "後序走訪完成",
      detail: `走訪結束，輸出序列：[${output.join(", ")}]，根節點 ${root.value} 永遠最後輸出。`,
    }),
  );

  return steps;
}

// ── source code (for CodePanel) ────────────────────────────────

export const postorderSource = `function postorder(node: TreeNode | null, out: number[]) {
  if (node === null) return;
  postorder(node.left, out);    // 左
  postorder(node.right, out);   // 右
  out.push(node.value);         // 根
}`;

// ── metadata ───────────────────────────────────────────────────

export const postorderMeta: TreeAlgorithmMeta = {
  name: "後序走訪 (Postorder)",
  slug: "tree-postorder",
  category: "tree",
  timeBest: "O(n)",
  timeAvg: "O(n)",
  timeWorst: "O(n)",
  space: "O(h)",
  tags: ["走訪", "DFS", "遞迴", "子樹屬性"],
};
