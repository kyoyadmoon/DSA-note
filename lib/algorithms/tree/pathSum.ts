import type {
  TreeAlgorithmMeta,
  TreeNode,
  TreeNodeState,
  TreeStep,
} from "@/lib/types/tree";
import { bstInsert } from "@/lib/algorithms/tree/bstInsert";

type StepConfig = {
  phase: TreeStep["phase"];
  codeLine: number;
  title: string;
  detail: string;
  currentNodeId?: string;
  targetNodeId?: string;
  activeEdge?: { from: string; to: string };
  overrides?: Record<string, TreeNodeState>;
};

function deepCopy(node: TreeNode | null): TreeNode | null {
  if (!node) return null;
  return {
    id: node.id,
    value: node.value,
    left: deepCopy(node.left),
    right: deepCopy(node.right),
  };
}

function collectIds(node: TreeNode | null): string[] {
  if (!node) return [];
  return [node.id, ...collectIds(node.left), ...collectIds(node.right)];
}

function buildStates(
  root: TreeNode | null,
  overrides: Record<string, TreeNodeState> = {},
): Record<string, TreeNodeState> {
  const states: Record<string, TreeNodeState> = {};
  for (const id of collectIds(root)) {
    states[id] = overrides[id] ?? "idle";
  }
  return states;
}

function makeTreeStep(root: TreeNode | null, config: StepConfig): TreeStep {
  return {
    root: deepCopy(root),
    nodeStates: buildStates(root, config.overrides),
    currentNodeId: config.currentNodeId,
    targetNodeId: config.targetNodeId,
    activeEdge: config.activeEdge,
    phase: config.phase,
    codeLine: config.codeLine,
    title: config.title,
    detail: config.detail,
  };
}

function leftmostPathSum(root: TreeNode | null): number {
  let total = 0;
  let current = root;

  while (current) {
    total += current.value;
    current = current.left ?? current.right;
  }

  return total;
}

function pathOverrides(
  ancestorIds: string[],
  currentId?: string,
  currentState: TreeNodeState = "comparing",
): Record<string, TreeNodeState> {
  const overrides: Record<string, TreeNodeState> = {};

  for (const id of ancestorIds) {
    overrides[id] = "path";
  }

  if (currentId) {
    overrides[currentId] = currentState;
  }

  return overrides;
}

export function hasPathSum(root: TreeNode | null, target: number): boolean {
  if (!root) return false;

  const remaining = target - root.value;
  const isLeaf = !root.left && !root.right;

  if (isLeaf) return remaining === 0;

  return hasPathSum(root.left, remaining) || hasPathSum(root.right, remaining);
}

export function pathSumSteps(values: number[], target?: number): TreeStep[] {
  const root = bstInsert(values);
  const resolvedTarget = target ?? leftmostPathSum(root);
  const steps: TreeStep[] = [];

  steps.push(
    makeTreeStep(root, {
      phase: "idle",
      codeLine: 1,
      title: "開始檢查路徑",
      detail: `累計 0，目標 ${resolvedTarget}，還差 ${resolvedTarget}。`,
    }),
  );

  if (!root) {
    steps.push(
      makeTreeStep(root, {
        phase: "done",
        codeLine: 2,
        title: "空樹沒有答案",
        detail: `累計 0，目標 ${resolvedTarget}，還差 ${resolvedTarget}，結果 false。`,
      }),
    );
    return steps;
  }

  let successStep: TreeStep | null = null;
  let finalAccumulated = 0;

  function dfs(
    node: TreeNode,
    accumulatedBefore: number,
    ancestorIds: string[],
    parentId?: string,
  ): boolean {
    const accumulated = accumulatedBefore + node.value;
    const remaining = resolvedTarget - accumulated;
    finalAccumulated = accumulated;

    // TreeNodeState 只能用既有 union；這裡將「當前節點」映射到 comparing，
    // 「活躍 DFS 路徑」映射到 path，「成功命中」映射到 found，「回溯完成」映射到 visited。
    steps.push(
      makeTreeStep(root, {
        phase: "visit",
        codeLine: 3,
        title: `走到節點 ${node.value}`,
        detail: `累計 ${accumulated}，目標 ${resolvedTarget}，還差 ${remaining}。`,
        currentNodeId: node.id,
        activeEdge: parentId ? { from: parentId, to: node.id } : undefined,
        overrides: pathOverrides(ancestorIds, node.id),
      }),
    );

    const isLeaf = !node.left && !node.right;
    if (isLeaf) {
      steps.push(
        makeTreeStep(root, {
          phase: "compare",
          codeLine: 5,
          title: `檢查葉節點 ${node.value}`,
          detail: `累計 ${accumulated}，目標 ${resolvedTarget}，還差 ${remaining}。`,
          currentNodeId: node.id,
          activeEdge: parentId ? { from: parentId, to: node.id } : undefined,
          overrides: pathOverrides(ancestorIds, node.id),
        }),
      );

      if (remaining === 0) {
        const foundOverrides: Record<string, TreeNodeState> = {};
        for (const id of [...ancestorIds, node.id]) {
          foundOverrides[id] = "found";
        }

        steps.push(
          makeTreeStep(root, {
            phase: "found",
            codeLine: 5,
            title: `命中葉節點 ${node.value}`,
            detail: `累計 ${accumulated}，目標 ${resolvedTarget}，還差 ${remaining}。`,
            currentNodeId: node.id,
            targetNodeId: node.id,
            activeEdge: parentId ? { from: parentId, to: node.id } : undefined,
            overrides: foundOverrides,
          }),
        );

        successStep = makeTreeStep(root, {
          phase: "done",
          codeLine: 5,
          title: "找到完整路徑",
          detail: `累計 ${accumulated}，目標 ${resolvedTarget}，還差 ${remaining}，結果 true。`,
          currentNodeId: node.id,
          targetNodeId: node.id,
          activeEdge: parentId ? { from: parentId, to: node.id } : undefined,
          overrides: foundOverrides,
        });

        return true;
      }

      steps.push(
        makeTreeStep(root, {
          phase: "not-found",
          codeLine: 5,
          title: `葉節點 ${node.value} 失敗`,
          detail: `累計 ${accumulated}，目標 ${resolvedTarget}，還差 ${remaining}。`,
          currentNodeId: node.id,
          activeEdge: parentId ? { from: parentId, to: node.id } : undefined,
          overrides: pathOverrides(ancestorIds, node.id, "visited"),
        }),
      );

      return false;
    }

    if (node.left) {
      steps.push(
        makeTreeStep(root, {
          phase: "compare",
          codeLine: 7,
          title: `往左檢查 ${node.left.value}`,
          detail: `累計 ${accumulated}，目標 ${resolvedTarget}，還差 ${remaining}。`,
          currentNodeId: node.id,
          activeEdge: { from: node.id, to: node.left.id },
          overrides: pathOverrides(ancestorIds, node.id),
        }),
      );

      if (dfs(node.left, accumulated, [...ancestorIds, node.id], node.id)) {
        return true;
      }
    }

    if (node.right) {
      steps.push(
        makeTreeStep(root, {
          phase: "compare",
          codeLine: 8,
          title: `往右檢查 ${node.right.value}`,
          detail: `累計 ${accumulated}，目標 ${resolvedTarget}，還差 ${remaining}。`,
          currentNodeId: node.id,
          activeEdge: { from: node.id, to: node.right.id },
          overrides: pathOverrides(ancestorIds, node.id),
        }),
      );

      if (dfs(node.right, accumulated, [...ancestorIds, node.id], node.id)) {
        return true;
      }
    }

    steps.push(
      makeTreeStep(root, {
        phase: "not-found",
        codeLine: 8,
        title: `回退離開 ${node.value}`,
        detail: `累計 ${accumulated}，目標 ${resolvedTarget}，還差 ${remaining}。`,
        currentNodeId: node.id,
        activeEdge: parentId ? { from: parentId, to: node.id } : undefined,
        overrides: pathOverrides(ancestorIds, node.id, "visited"),
      }),
    );

    return false;
  }

  const result = dfs(root, 0, []);

  if (successStep) {
    steps.push(successStep);
    return steps;
  }

  const visitedOverrides: Record<string, TreeNodeState> = {};
  for (const id of collectIds(root)) {
    visitedOverrides[id] = "visited";
  }

  steps.push(
    makeTreeStep(root, {
      phase: "done",
      codeLine: 8,
      title: "整棵樹都檢查完了",
      detail: `累計 ${finalAccumulated}，目標 ${resolvedTarget}，還差 ${resolvedTarget - finalAccumulated}，結果 ${result}.`,
      overrides: visitedOverrides,
    }),
  );

  return steps;
}

export const pathSumSource = `export function hasPathSum(root: TreeNode | null, target: number): boolean {
  if (!root) return false;
  const remaining = target - root.value;
  const isLeaf = !root.left && !root.right;
  if (isLeaf) return remaining === 0;
  return (
    hasPathSum(root.left, remaining) ||
    hasPathSum(root.right, remaining)
  );
}`;

export const pathSumMeta: TreeAlgorithmMeta = {
  name: "Path Sum",
  slug: "tree-path-sum",
  category: "tree",
  timeBest: "O(h)",
  timeAvg: "O(n)",
  timeWorst: "O(n)",
  space: "O(h)",
  tags: ["DFS", "遞迴", "LeetCode 112"],
};
