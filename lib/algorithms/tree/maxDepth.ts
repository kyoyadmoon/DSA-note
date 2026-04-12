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

// -- pure function (testable) -----------------------------------------------

export function maxDepth(node: TreeNode | null): number {
  if (node === null) return 0;
  return 1 + Math.max(maxDepth(node.left), maxDepth(node.right));
}

// -- step generator ----------------------------------------------------------

export function maxDepthSteps(values: number[]): TreeStep[] {
  const allocId = createIdAllocator("md");
  const root = buildBSTFromValues(values, allocId);
  const steps: TreeStep[] = [];

  steps.push(
    makeTreeStep(root, {}, {
      phase: "idle",
      codeLine: 1,
      title: "準備計算最大深度",
      detail: root
        ? `將以後序（左 → 右 → 根）遞迴計算 ${values.length} 個節點構成的 BST 最大深度。`
        : "樹是空的，最大深度為 0。",
    }),
  );

  if (!root) {
    steps.push(
      makeTreeStep(root, {}, {
        phase: "done",
        codeLine: 2,
        title: "最大深度計算完成",
        detail: "整棵樹的最大深度為 0。",
      }),
    );
    return steps;
  }

  const visitedIds: string[] = [];

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
    side: "root" | "left" | "right",
  ): number {
    // Step: descend into this node
    const descendLine = side === "left" ? 3 : side === "right" ? 4 : 1;
    const descendTitle =
      side === "root"
        ? `從根節點 ${node.value} 開始`
        : `進入節點 ${node.value}`;
    const descendDetail =
      parent === null
        ? `根節點 ${node.value} 是遞迴的起點。`
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

    // Recurse left
    let leftD: number;
    if (node.left) {
      leftD = walk(node.left, nextAncestors, node, "left");
    } else {
      // null base case for left child
      leftD = 0;
      steps.push({
        ...makeTreeStep(root, buildOverrides(ancestors, node.id), {
          phase: "visit",
          codeLine: 2,
          title: `節點 ${node.value} 的左子為 null`,
          detail: `左子樹為空，回傳深度 0。`,
        }),
        currentNodeId: node.id,
      });
    }

    // Recurse right
    let rightD: number;
    if (node.right) {
      rightD = walk(node.right, nextAncestors, node, "right");
    } else {
      // null base case for right child
      rightD = 0;
      steps.push({
        ...makeTreeStep(root, buildOverrides(ancestors, node.id), {
          phase: "visit",
          codeLine: 2,
          title: `節點 ${node.value} 的右子為 null`,
          detail: `右子樹為空，回傳深度 0。`,
        }),
        currentNodeId: node.id,
      });
    }

    // Compute at node
    const result = 1 + Math.max(leftD, rightD);
    steps.push({
      ...makeTreeStep(root, buildOverrides(ancestors, node.id), {
        phase: "visit",
        codeLine: 5,
        title: `計算節點 ${node.value} 的深度`,
        detail: `節點 ${node.value} 的左子樹深度 ${leftD}，右子樹深度 ${rightD}，最大深度 = 1 + max(${leftD}, ${rightD}) = ${result}。`,
      }),
      currentNodeId: node.id,
    });

    // Mark visited
    visitedIds.push(node.id);

    return result;
  }

  const answer = walk(root, [], null, "root");

  // Final step
  const doneOverrides: Record<string, TreeNodeState> = {};
  for (const id of visitedIds) doneOverrides[id] = "visited";
  steps.push(
    makeTreeStep(root, doneOverrides, {
      phase: "done",
      codeLine: 5,
      title: "最大深度計算完成",
      detail: `整棵樹的最大深度為 ${answer}。`,
    }),
  );

  return steps;
}

// -- source code (for CodePanel) ---------------------------------------------

export const maxDepthSource = `function maxDepth(node: TreeNode | null): number {
  if (node === null) return 0;
  const left = maxDepth(node.left);
  const right = maxDepth(node.right);
  return 1 + Math.max(left, right);
}`;

// -- metadata ----------------------------------------------------------------

export const maxDepthMeta: TreeAlgorithmMeta = {
  name: "最大深度 (Max Depth)",
  slug: "tree-max-depth",
  category: "tree",
  timeBest: "O(n)",
  timeAvg: "O(n)",
  timeWorst: "O(n)",
  space: "O(h)",
  tags: ["遞迴", "DFS", "後序", "基礎"],
};
