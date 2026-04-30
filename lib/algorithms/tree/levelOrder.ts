import type {
  TreeAlgorithmMeta,
  TreeNode,
  TreeNodeState,
  TreeStep,
} from "@/lib/types/tree";
import {
  buildBSTFromValues,
  collectNodeIds,
  createIdAllocator,
  makeTreeStep,
} from "./_shared";

export function levelOrder(root: TreeNode | null): number[] {
  const out: number[] = [];
  if (root === null) return out;
  const queue: TreeNode[] = [root];
  while (queue.length > 0) {
    const node = queue.shift()!;
    out.push(node.value);
    if (node.left !== null) queue.push(node.left);
    if (node.right !== null) queue.push(node.right);
  }
  return out;
}

function formatQueue(queue: TreeNode[]): string {
  return `[${queue.map((node) => node.value).join(", ")}]`;
}

function buildOverrides(
  visitedIds: Iterable<string>,
  queue: TreeNode[],
  currentNode: TreeNode | null = null,
): Record<string, TreeNodeState> {
  const overrides: Record<string, TreeNodeState> = {};
  for (const id of visitedIds) overrides[id] = "visited";
  for (const node of queue) overrides[node.id] = "path";
  if (currentNode !== null) overrides[currentNode.id] = "comparing";
  return overrides;
}

export function levelOrderSteps(values: number[]): TreeStep[] {
  const allocId = createIdAllocator("lvl");
  const root = buildBSTFromValues(values, allocId);
  const steps: TreeStep[] = [];

  if (root === null) {
    steps.push(
      makeTreeStep(root, {}, {
        phase: "idle",
        codeLine: 3,
        title: "準備層序走訪",
        detail: "樹是空的，沒有節點可加入佇列。queue: []。",
      }),
    );
    steps.push(
      makeTreeStep(root, {}, {
        phase: "done",
        codeLine: 11,
        title: "層序走訪完成",
        detail: "輸出序列：[]。空樹沒有任何層次可走訪。",
      }),
    );
    return steps;
  }

  const queue: TreeNode[] = [root];
  const visitedIds = new Set<string>();
  const output: number[] = [];
  const nodeCount = collectNodeIds(root).length;

  steps.push(
    makeTreeStep(root, buildOverrides(visitedIds, queue), {
      phase: "idle",
      codeLine: 4,
      title: "準備層序走訪",
      detail: `以 BST 插入順序 [${values.join(", ")}] 建立示範樹，共 ${nodeCount} 個節點。從根節點 ${root.value} 開始逐層走訪。queue: ${formatQueue(queue)}。`,
    }),
  );

  while (queue.length > 0) {
    const node = queue.shift()!;

    steps.push({
      ...makeTreeStep(root, buildOverrides(visitedIds, queue, node), {
        phase: "visit",
        codeLine: 6,
        title: `取出佇列最前端 ${node.value}`,
        detail: `將 ${node.value} 從 FIFO 佇列取出，準備處理它的左右子節點。queue: ${formatQueue(queue)}。`,
      }),
      currentNodeId: node.id,
    });

    output.push(node.value);
    steps.push({
      ...makeTreeStep(root, buildOverrides(visitedIds, queue, node), {
        phase: "visit",
        codeLine: 7,
        title: `輸出 ${node.value}`,
        detail: `輸出 ${node.value}，目前結果為 [${output.join(", ")}]。queue: ${formatQueue(queue)}。`,
      }),
      currentNodeId: node.id,
    });

    if (node.left !== null) {
      queue.push(node.left);
      steps.push({
        ...makeTreeStep(root, buildOverrides(visitedIds, queue, node), {
          phase: "visit",
          codeLine: 8,
          title: `將左子節點 ${node.left.value} 加入佇列`,
          detail: `先 enqueue 左子節點 ${node.left.value}，因此同層會維持由左到右。queue: ${formatQueue(queue)}。`,
        }),
        currentNodeId: node.id,
        activeEdge: { from: node.id, to: node.left.id },
      });
    }

    if (node.right !== null) {
      queue.push(node.right);
      steps.push({
        ...makeTreeStep(root, buildOverrides(visitedIds, queue, node), {
          phase: "visit",
          codeLine: 9,
          title: `將右子節點 ${node.right.value} 加入佇列`,
          detail: `再 enqueue 右子節點 ${node.right.value}，下一層的節點會排在佇列尾端等待。queue: ${formatQueue(queue)}。`,
        }),
        currentNodeId: node.id,
        activeEdge: { from: node.id, to: node.right.id },
      });
    }

    visitedIds.add(node.id);
    steps.push(
      makeTreeStep(root, buildOverrides(visitedIds, queue), {
        phase: "visit",
        codeLine: 5,
        title: `完成節點 ${node.value}`,
        detail: `節點 ${node.value} 已完成處理；比它更深的節點仍留在佇列尾端等待。queue: ${formatQueue(queue)}。`,
      }),
    );
  }

  steps.push(
    makeTreeStep(root, buildOverrides(visitedIds, queue), {
      phase: "done",
      codeLine: 11,
      title: "層序走訪完成",
      detail: `輸出序列：[${output.join(", ")}]。BFS 會先完成較淺層，再依序處理更深一層，並保持同層由左到右。`,
    }),
  );

  return steps;
}

export const levelOrderSource = `function levelOrder(root: TreeNode | null): number[] {
  const out: number[] = [];
  if (root === null) return out;
  const queue: TreeNode[] = [root];
  while (queue.length > 0) {
    const node = queue.shift()!;
    out.push(node.value);
    if (node.left !== null) queue.push(node.left);
    if (node.right !== null) queue.push(node.right);
  }
  return out;
}`;

export const levelOrderMeta: TreeAlgorithmMeta = {
  name: "層序走訪 (Level-order)",
  slug: "tree-level-order",
  category: "tree",
  timeBest: "O(n)",
  timeAvg: "O(n)",
  timeWorst: "O(n)",
  space: "O(w)",
  tags: ["走訪", "BFS", "queue", "層次"],
};
