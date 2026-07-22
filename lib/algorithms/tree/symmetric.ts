import type {
  TreeAlgorithmMeta,
  TreeNode,
  TreeNodeState,
  TreeStep,
} from "@/lib/types/tree";
import {
  buildBSTFromValues,
  createIdAllocator,
  makeTreeStep as makeSharedTreeStep,
} from "@/lib/algorithms/tree/_shared";

type MakeTreeStepInput = Omit<TreeStep, "root" | "nodeStates"> & {
  root: TreeNode | null;
  nodeStates?: Record<string, TreeNodeState>;
};

function makeTreeStep({
  root,
  nodeStates = {},
  ...extras
}: MakeTreeStepInput): TreeStep {
  return makeSharedTreeStep(root, nodeStates, extras);
}

function isMirror(a: TreeNode | null, b: TreeNode | null): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.value !== b.value) return false;
  return isMirror(a.left, b.right) && isMirror(a.right, b.left);
}

export function isSymmetric(root: TreeNode | null): boolean {
  if (!root) return true;
  return isMirror(root.left, root.right);
}

function collectIds(node: TreeNode | null): string[] {
  if (!node) return [];
  return [node.id, ...collectIds(node.left), ...collectIds(node.right)];
}

function countNodes(node: TreeNode | null): number {
  if (!node) return 0;
  return 1 + countNodes(node.left) + countNodes(node.right);
}

function makePathStates(ids: string[]): Record<string, TreeNodeState> {
  const nodeStates: Record<string, TreeNodeState> = {};
  for (const id of ids) {
    nodeStates[id] = "path";
  }
  return nodeStates;
}

export function symmetricSteps(values: number[]): TreeStep[] {
  const allocateId = createIdAllocator("sym");
  const root = buildBSTFromValues(values, allocateId);

  if (!root) {
    return [
      makeTreeStep({
        root: null,
        phase: "done",
        codeLine: 2,
        title: "空樹也是對稱的",
        detail: "樹中共有 0 個節點，所以結果是 true。",
      }),
    ];
  }

  const steps: TreeStep[] = [
    makeTreeStep({
      root,
      nodeStates: { [root.id]: "path" },
      currentNodeId: root.left?.id,
      phase: "idle",
      codeLine: 3,
      title: "從左右子樹開始",
      detail: `根節點 ${root.value} 會先比較左子樹與右子樹。`,
    }),
  ];

  let finalNodeStates: Record<string, TreeNodeState> = {};
  let finalDetail = `全部 ${countNodes(root)} 個節點都通過鏡像檢查，結果是 true。`;

  const walk = (
    left: TreeNode | null,
    right: TreeNode | null,
    ancestorIds: string[],
  ): boolean => {
    const pathStates = makePathStates(ancestorIds);

    if (!left && !right) {
      steps.push(
        makeTreeStep({
          root,
          nodeStates: pathStates,
          phase: "compare",
          codeLine: 7,
          title: "兩側都為空",
          detail: "左側是 null，右側也是 null，所以這一對仍然對稱。",
        }),
      );
      finalNodeStates = pathStates;
      return true;
    }

    if (!left || !right) {
      const mismatchStates = { ...pathStates };
      if (left) mismatchStates[left.id] = "found";
      if (right) mismatchStates[right.id] = "found";

      finalNodeStates = mismatchStates;
      finalDetail = left
        ? `左側節點是 ${left.value}、右側是 null，所以結果是 false。`
        : `左側是 null、右側節點是 ${right!.value}，所以結果是 false。`;

      steps.push(
        makeTreeStep({
          root,
          nodeStates: mismatchStates,
          currentNodeId: left?.id,
          targetNodeId: right?.id,
          phase: "not-found",
          codeLine: 8,
          title: "只有一側有節點",
          detail: finalDetail,
        }),
      );
      return false;
    }

    const comparingStates = {
      ...pathStates,
      [left.id]: "comparing" as const,
      [right.id]: "comparing" as const,
    };

    steps.push(
      makeTreeStep({
        root,
        nodeStates: comparingStates,
        currentNodeId: left.id,
        targetNodeId: right.id,
        phase: "compare",
        codeLine: 9,
        title: `比較 ${left.value} 與 ${right.value}`,
        detail: `左側值是 ${left.value}，右側值是 ${right.value}，先檢查兩者是否相等。`,
      }),
    );

    if (left.value !== right.value) {
      const mismatchStates = {
        ...pathStates,
        [left.id]: "found" as const,
        [right.id]: "found" as const,
      };

      finalNodeStates = mismatchStates;
      finalDetail = `左側值是 ${left.value}、右側值是 ${right.value}，所以結果是 false。`;

      steps.push(
        makeTreeStep({
          root,
          nodeStates: mismatchStates,
          currentNodeId: left.id,
          targetNodeId: right.id,
          phase: "not-found",
          codeLine: 9,
          title: "數值不相等",
          detail: finalDetail,
        }),
      );
      return false;
    }

    const visitedStates = {
      ...pathStates,
      [left.id]: "visited" as const,
      [right.id]: "visited" as const,
    };

    steps.push(
      makeTreeStep({
        root,
        nodeStates: visitedStates,
        currentNodeId: left.id,
        targetNodeId: right.id,
        phase: "visit",
        codeLine: 10,
        title: `配對成功 ${left.value}`,
        detail: `${left.value} 與 ${right.value} 相等，接著檢查外側與內側孩子。`,
      }),
    );

    finalNodeStates = visitedStates;

    const nextAncestors = [...ancestorIds, left.id, right.id];
    if (!walk(left.left, right.right, nextAncestors)) {
      return false;
    }
    return walk(left.right, right.left, nextAncestors);
  };

  const result = walk(root.left, root.right, [root.id]);
  if (result) {
    finalNodeStates = Object.fromEntries(
      collectIds(root).map((id) => [id, "visited" satisfies TreeNodeState]),
    );
  }

  steps.push(
    makeTreeStep({
      root,
      nodeStates: finalNodeStates,
      currentNodeId: root.left?.id,
      targetNodeId: root.right?.id,
      phase: "done",
      codeLine: 3,
      title: "對稱檢查完成",
      detail: finalDetail,
    }),
  );

  return steps;
}

export const symmetricSource = `export function isSymmetric(root: TreeNode | null): boolean {
  if (!root) return true;
  return isMirror(root.left, root.right);
}

function isMirror(a: TreeNode | null, b: TreeNode | null): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.value !== b.value) return false;
  return isMirror(a.left, b.right) && isMirror(a.right, b.left);
}`;

export const symmetricMeta: TreeAlgorithmMeta = {
  name: "Symmetric Tree",
  slug: "tree-symmetric",
  category: "tree",
  timeBest: "O(1)",
  timeAvg: "O(n)",
  timeWorst: "O(n)",
  space: "O(h)",
  tags: ["tree", "recursion", "dfs", "mirror"],
};
