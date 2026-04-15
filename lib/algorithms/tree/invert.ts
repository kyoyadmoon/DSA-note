import type {
  TreeAlgorithmMeta,
  TreeNode,
  TreeNodeState,
  TreeStep,
} from "@/lib/types/tree";
import {
  buildBSTFromValues,
  cloneTree,
  createIdAllocator,
  makeTreeStep,
} from "./_shared";

type ChildSide = "root" | "left" | "right";

export function invertTree(root: TreeNode | null): TreeNode | null {
  const working = cloneTree(root);
  return invertTreeInPlace(working);
}

function invertTreeInPlace(node: TreeNode | null): TreeNode | null {
  if (node === null) return null;
  invertTreeInPlace(node.left);
  invertTreeInPlace(node.right);
  const temp = node.left;
  node.left = node.right;
  node.right = temp;
  return node;
}

export function invertTreeSteps(values: number[]): TreeStep[] {
  const allocId = createIdAllocator("inv");
  const root = buildBSTFromValues(values, allocId);
  const steps: TreeStep[] = [];

  steps.push(
    makeTreeStep(root, {}, {
      phase: "idle",
      codeLine: 1,
      title: "準備翻轉二元樹",
      detail: root
        ? `將以「左 → 右 → 根」的順序翻轉 ${values.length} 個節點：[${values.join(", ")}]。`
        : "樹是空的，沒有任何左右子樹需要交換。",
    }),
  );

  if (root === null) {
    steps.push(
      makeTreeStep(root, {}, {
        phase: "done",
        codeLine: 2,
        title: "翻轉完成",
        detail: "空樹翻轉後仍是空樹，前序序列為 []。",
      }),
    );
    return steps;
  }

  const visitedIds = new Set<string>();

  function buildOverrides(
    ancestors: TreeNode[],
    currentId?: string,
    currentState: TreeNodeState = "comparing",
  ): Record<string, TreeNodeState> {
    const overrides: Record<string, TreeNodeState> = {};
    for (const id of visitedIds) overrides[id] = "visited";
    for (const ancestor of ancestors) overrides[ancestor.id] = "path";
    if (currentId) overrides[currentId] = currentState;
    return overrides;
  }

  function walk(
    node: TreeNode,
    ancestors: TreeNode[],
    parent: TreeNode | null,
    side: ChildSide,
  ): void {
    const descendLine = side === "root" ? 2 : side === "left" ? 3 : 4;
    const descendTitle =
      side === "root"
        ? `從根節點 ${node.value} 開始`
        : `進入節點 ${node.value}`;
    const descendDetail =
      parent === null
        ? `根節點 ${node.value} 是翻轉整棵樹的起點。`
        : side === "left"
          ? `從節點 ${parent.value} 往左遞迴，現在要先翻完節點 ${node.value} 的子樹。`
          : `從節點 ${parent.value} 往右遞迴，現在要先翻完節點 ${node.value} 的子樹。`;

    steps.push({
      ...makeTreeStep(root, buildOverrides(ancestors, node.id), {
        phase: "visit",
        codeLine: descendLine,
        title: descendTitle,
        detail: descendDetail,
      }),
      currentNodeId: node.id,
      activeEdge: parent ? { from: parent.id, to: node.id } : undefined,
    });

    const nextAncestors = [...ancestors, node];
    if (node.left !== null) {
      walk(node.left, nextAncestors, node, "left");
    }
    if (node.right !== null) {
      walk(node.right, nextAncestors, node, "right");
    }

    const leftBefore = node.left?.value ?? null;
    const rightBefore = node.right?.value ?? null;

    steps.push({
      ...makeTreeStep(root, buildOverrides(ancestors, node.id, "swap"), {
        phase: "visit",
        codeLine: 6,
        title: `交換 ${formatChildValue(leftBefore)} 與 ${formatChildValue(rightBefore)}`,
        detail: `節點 ${node.value} 會把左右子節點從 ${formatChildPair(leftBefore, rightBefore)} 交換成 ${formatChildPair(rightBefore, leftBefore)}。`,
      }),
      currentNodeId: node.id,
    });

    const temp = node.left;
    node.left = node.right;
    node.right = temp;

    steps.push({
      ...makeTreeStep(root, buildOverrides(ancestors, node.id, "visited"), {
        phase: "visit",
        codeLine: 7,
        title: `完成翻轉 ${node.value}`,
        detail: `節點 ${node.value} 的左右子樹已交換為 ${formatChildPair(node.left?.value ?? null, node.right?.value ?? null)}。`,
      }),
      currentNodeId: node.id,
    });

    visitedIds.add(node.id);
  }

  walk(root, [], null, "root");

  const doneOverrides: Record<string, TreeNodeState> = {};
  for (const id of visitedIds) doneOverrides[id] = "visited";
  steps.push(
    makeTreeStep(root, doneOverrides, {
      phase: "done",
      codeLine: 8,
      title: "翻轉完成",
      detail: `整棵樹翻轉後的前序序列為 [${preorderValues(root).join(", ")}]。`,
    }),
  );

  return steps;
}

function preorderValues(node: TreeNode | null): number[] {
  if (node === null) return [];
  return [
    node.value,
    ...preorderValues(node.left),
    ...preorderValues(node.right),
  ];
}

function formatChildValue(value: number | null): string {
  return value === null ? "∅" : String(value);
}

function formatChildPair(left: number | null, right: number | null): string {
  return `${formatChildValue(left)} / ${formatChildValue(right)}`;
}

export const invertTreeSource = `function invertTree(root: TreeNode | null): TreeNode | null {
  if (root === null) return null;
  invertTree(root.left);
  invertTree(root.right);
  const temp = root.left;
  root.left = root.right;
  root.right = temp;
  return root;
}`;

export const invertTreeMeta: TreeAlgorithmMeta = {
  name: "翻轉二元樹 (Invert Binary Tree)",
  slug: "tree-invert",
  category: "tree",
  timeBest: "O(n)",
  timeAvg: "O(n)",
  timeWorst: "O(n)",
  space: "O(h)",
  tags: ["遞迴", "後序", "DFS", "指標交換"],
};
