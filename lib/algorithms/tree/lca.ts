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

function findLcaNode(
  node: TreeNode | null,
  p: number,
  q: number,
): TreeNode | null {
  if (node === null) return null;
  if (node.value === p || node.value === q) return node;
  const left = findLcaNode(node.left, p, q);
  const right = findLcaNode(node.right, p, q);
  if (left !== null && right !== null) return node;
  return left ?? right;
}

export function lca(root: TreeNode | null, p: number, q: number): number | null {
  return findLcaNode(root, p, q)?.value ?? null;
}

// ── step generator ─────────────────────────────────────────────

type ChildSide = "root" | "left" | "right";

function pickTargets(values: number[]): { p: number; q: number } | null {
  if (values.length === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 1) return { p: sorted[0], q: sorted[0] };

  let leftIndex = Math.floor(sorted.length / 4);
  let rightIndex = Math.floor((3 * sorted.length) / 4);

  if (leftIndex === rightIndex) {
    if (rightIndex + 1 < sorted.length) rightIndex += 1;
    else if (leftIndex - 1 >= 0) leftIndex -= 1;
  }

  if (sorted[leftIndex] === sorted[rightIndex]) {
    for (let offset = 1; offset < sorted.length; offset += 1) {
      if (
        rightIndex + offset < sorted.length &&
        sorted[rightIndex + offset] !== sorted[leftIndex]
      ) {
        rightIndex += offset;
        break;
      }
      if (
        leftIndex - offset >= 0 &&
        sorted[leftIndex - offset] !== sorted[rightIndex]
      ) {
        leftIndex -= offset;
        break;
      }
    }
  }

  return { p: sorted[leftIndex], q: sorted[rightIndex] };
}

export function lcaSteps(values: number[]): TreeStep[] {
  const allocId = createIdAllocator("lca");
  const root = buildBSTFromValues(values, allocId);
  const steps: TreeStep[] = [];
  const targets = pickTargets(values);

  if (!targets) {
    steps.push(
      makeTreeStep(root, {}, {
        phase: "idle",
        codeLine: 1,
        title: "準備尋找最近公共祖先",
        detail: "樹是空的，沒有可尋找的目標節點。",
      }),
    );
    steps.push(
      makeTreeStep(root, {}, {
        phase: "done",
        codeLine: 2,
        title: "找到最近公共祖先",
        detail: "空樹沒有最近公共祖先。",
      }),
    );
    return steps;
  }

  const { p, q } = targets;
  const visitedIds = new Set<string>();
  const foundIds = new Set<string>();

  steps.push(
    makeTreeStep(root, {}, {
      phase: "idle",
      codeLine: 1,
      title: "準備尋找最近公共祖先",
      detail: `尋找節點 ${p} 與 ${q} 的最近公共祖先 (LCA)。`,
      operationValue: p,
    }),
  );

  if (!root) {
    steps.push(
      makeTreeStep(root, {}, {
        phase: "done",
        codeLine: 2,
        title: "找到最近公共祖先",
        detail: `節點 ${p} 與 ${q} 不存在於樹中，找不到 LCA。`,
        operationValue: p,
      }),
    );
    return steps;
  }

  function buildOverrides(
    ancestors: TreeNode[],
    currentId?: string,
    currentState: TreeNodeState = "comparing",
  ): Record<string, TreeNodeState> {
    const overrides: Record<string, TreeNodeState> = {};

    for (const id of visitedIds) {
      if (!foundIds.has(id)) overrides[id] = "visited";
    }
    for (const ancestor of ancestors) {
      if (!foundIds.has(ancestor.id)) overrides[ancestor.id] = "path";
    }
    for (const id of foundIds) overrides[id] = "found";
    if (currentId) overrides[currentId] = currentState;

    return overrides;
  }

  function walk(
    node: TreeNode | null,
    ancestors: TreeNode[],
    parent: TreeNode | null,
    side: ChildSide,
  ): TreeNode | null {
    if (node === null) {
      const direction = side === "left" ? "左" : "右";
      steps.push({
        ...makeTreeStep(
          root,
          buildOverrides(ancestors, parent?.id, parent ? "comparing" : "idle"),
          {
            phase: "not-found",
            codeLine: 2,
            title: "遇到空節點",
            detail: parent
              ? `從節點 ${parent.value} 往${direction}遞迴，到達空節點，回傳 null。`
              : "到達空節點，回傳 null。",
          },
        ),
        currentNodeId: parent?.id,
      });
      return null;
    }

    const direction = side === "left" ? "左" : "右";
    steps.push({
      ...makeTreeStep(root, buildOverrides(ancestors, node.id), {
        phase: "compare",
        codeLine: parent === null ? 1 : side === "left" ? 4 : 5,
        title: parent === null ? `從根節點 ${node.value} 開始` : `進入節點 ${node.value}`,
        detail:
          parent === null
            ? `從根節點 ${node.value} 開始做後序搜尋，先檢查左右子樹。`
            : `從節點 ${parent.value} 往${direction}遞迴，抵達節點 ${node.value}。`,
      }),
      currentNodeId: node.id,
      activeEdge: parent ? { from: parent.id, to: node.id } : undefined,
    });

    if (node.value === p || node.value === q) {
      foundIds.add(node.id);
      steps.push({
        ...makeTreeStep(root, buildOverrides(ancestors, node.id, "found"), {
          phase: "found",
          codeLine: 3,
          title: `找到目標 ${node.value}`,
          detail: `節點 ${node.value} 是目標之一，回傳自己。`,
        }),
        currentNodeId: node.id,
        targetNodeId: node.id,
      });
      return node;
    }

    const nextAncestors = [...ancestors, node];
    const left = walk(node.left, nextAncestors, node, "left");
    const right = walk(node.right, nextAncestors, node, "right");

    if (left !== null && right !== null) {
      foundIds.add(node.id);
      steps.push({
        ...makeTreeStep(root, buildOverrides(ancestors, node.id, "found"), {
          phase: "found",
          codeLine: 6,
          title: `節點 ${node.value} 是最近公共祖先`,
          detail: `左子樹找到 ${left.value}，右子樹找到 ${right.value}，節點 ${node.value} 是 LCA！`,
        }),
        currentNodeId: node.id,
        targetNodeId: node.id,
      });
      return node;
    }

    visitedIds.add(node.id);

    if (left !== null || right !== null) {
      const returned = left ?? right;
      steps.push({
        ...makeTreeStep(root, buildOverrides(ancestors, node.id, "visited"), {
          phase: "compare",
          codeLine: 7,
          title: `從節點 ${node.value} 向上回傳`,
          detail: "只有子樹找到目標，繼續向上傳遞。",
        }),
        currentNodeId: node.id,
        targetNodeId: returned?.id,
      });
      return returned;
    }

    steps.push({
      ...makeTreeStep(root, buildOverrides(ancestors, node.id, "visited"), {
        phase: "not-found",
        codeLine: 7,
        title: `節點 ${node.value} 無法提供答案`,
        detail: "兩邊子樹都沒找到目標。",
      }),
      currentNodeId: node.id,
    });
    return null;
  }

  const result = walk(root, [], null, "root");
  if (result) foundIds.add(result.id);

  steps.push(
    makeTreeStep(root, buildOverrides([], result?.id, result ? "found" : "idle"), {
      phase: "done",
      codeLine: result ? 6 : 2,
      title: "找到最近公共祖先",
      detail: result
        ? `節點 ${p} 與 ${q} 的 LCA 是 ${result.value}。`
        : `節點 ${p} 與 ${q} 找不到共同祖先。`,
      operationValue: p,
    }),
  );

  return steps;
}

// ── source code (for CodePanel) ────────────────────────────────

export const lcaSource = `function lca(node: TreeNode | null, p: number, q: number): TreeNode | null {
  if (node === null) return null;
  if (node.value === p || node.value === q) return node;
  const left = lca(node.left, p, q);
  const right = lca(node.right, p, q);
  if (left !== null && right !== null) return node;
  return left ?? right;
}`;

// ── metadata ───────────────────────────────────────────────────

export const lcaMeta: TreeAlgorithmMeta = {
  name: "最近公共祖先 (LCA)",
  slug: "tree-lca",
  category: "tree",
  timeBest: "O(n)",
  timeAvg: "O(n)",
  timeWorst: "O(n)",
  space: "O(h)",
  tags: ["遞迴", "DFS", "後序", "祖先"],
};
