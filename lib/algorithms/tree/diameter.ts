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

export function diameter(root: TreeNode | null): number {
  let maxDiam = 0;
  function depth(node: TreeNode | null): number {
    if (node === null) return 0;
    const left = depth(node.left);
    const right = depth(node.right);
    maxDiam = Math.max(maxDiam, left + right);
    return 1 + Math.max(left, right);
  }
  depth(root);
  return maxDiam;
}

// ── step generator ─────────────────────────────────────────────

type ChildSide = "root" | "left" | "right";

export function diameterSteps(values: number[]): TreeStep[] {
  const allocId = createIdAllocator("diam");
  const root = buildBSTFromValues(values, allocId);
  const steps: TreeStep[] = [];
  const visitedIds = new Set<string>();
  let maxDiam = 0;

  function buildOverrides(
    ancestors: TreeNode[],
    current?: TreeNode,
    currentState: TreeNodeState = "comparing",
  ): Record<string, TreeNodeState> {
    const overrides: Record<string, TreeNodeState> = {};
    for (const id of visitedIds) overrides[id] = "visited";
    for (const ancestor of ancestors) overrides[ancestor.id] = "path";
    if (current) overrides[current.id] = currentState;
    return overrides;
  }

  steps.push(
    makeTreeStep(root, {}, {
      phase: "idle",
      codeLine: 1,
      title: "準備計算二元樹直徑",
      detail: root
        ? `輸入 ${values.length} 個值：[${values.join(", ")}]。直徑是任意兩節點間最長路徑的邊數，單一節點的直徑是 0。`
        : "輸入 0 個值，樹為空；直徑定義為 0 條邊。",
    }),
  );

  if (!root) {
    steps.push(
      makeTreeStep(root, {}, {
        phase: "done",
        codeLine: 11,
        title: "直徑計算完成",
        detail: "二元樹的直徑為 0（最長路徑經過 0 條邊）。",
      }),
    );
    return steps;
  }

  function depth(
    node: TreeNode | null,
    ancestors: TreeNode[],
    parent: TreeNode | null,
    side: ChildSide,
  ): number {
    if (node === null) {
      const sideLabel = side === "left" ? "左" : "右";
      steps.push(
        makeTreeStep(root, buildOverrides(ancestors, parent ?? undefined), {
          phase: "compare",
          codeLine: 4,
          title: `${parent!.value} 的${sideLabel}子樹為空`,
          detail: `節點 ${parent!.value} 的${sideLabel}子樹是 null，依第 4 行回傳 0，所以 ${side}Depth = 0。`,
          currentNodeId: parent!.id,
        }),
      );
      return 0;
    }

    const enterCodeLine = parent === null ? 10 : side === "left" ? 5 : 6;
    steps.push(
      makeTreeStep(root, buildOverrides(ancestors, node), {
        phase: "compare",
        codeLine: enterCodeLine,
        title:
          parent === null ? `從根節點 ${node.value} 開始` : `遞迴到節點 ${node.value}`,
        detail:
          parent === null
            ? `呼叫 depth(${node.value})，目前 maxDiam = ${maxDiam}，接著計算 left 與 right。`
            : `節點 ${parent.value} 正在計算 ${side} = depth(${node.value})，目前 maxDiam = ${maxDiam}。`,
        currentNodeId: node.id,
        activeEdge: parent
          ? { from: parent.id, to: node.id }
          : undefined,
      }),
    );

    const nextAncestors = [...ancestors, node];
    const left = depth(node.left, nextAncestors, node, "left");
    const right = depth(node.right, nextAncestors, node, "right");
    const candidate = left + right;
    const prevMax = maxDiam;
    maxDiam = Math.max(maxDiam, candidate);

    steps.push(
      makeTreeStep(root, buildOverrides(ancestors, node), {
        phase: "compare",
        codeLine: 7,
        title: `比較節點 ${node.value} 的穿越路徑`,
        detail:
          maxDiam > prevMax
            ? `節點 ${node.value}：left = ${left}、right = ${right}，candidate = ${left} + ${right} = ${candidate}；maxDiam 從 ${prevMax} 更新為 ${maxDiam}。`
            : `節點 ${node.value}：left = ${left}、right = ${right}，candidate = ${left} + ${right} = ${candidate}；maxDiam 維持 ${maxDiam}。`,
        currentNodeId: node.id,
      }),
    );

    const depthValue = 1 + Math.max(left, right);
    visitedIds.add(node.id);

    steps.push(
      makeTreeStep(root, buildOverrides(ancestors, node, "visited"), {
        phase: "visit",
        codeLine: 8,
        title: `回傳節點 ${node.value} 的深度 ${depthValue}`,
        detail: `節點 ${node.value} 回傳 depth = 1 + max(${left}, ${right}) = ${depthValue}；目前 maxDiam = ${maxDiam}。`,
        currentNodeId: node.id,
      }),
    );

    return depthValue;
  }

  depth(root, [], null, "root");

  steps.push(
    makeTreeStep(root, buildOverrides([]), {
      phase: "done",
      codeLine: 11,
      title: "直徑計算完成",
      detail: `二元樹的直徑為 ${maxDiam}（最長路徑經過 ${maxDiam} 條邊）。`,
    }),
  );

  return steps;
}

// ── source code (for CodePanel) ────────────────────────────────

export const diameterSource = `function diameter(root: TreeNode | null): number {
  let maxDiam = 0;
  function depth(node: TreeNode | null): number {
    if (node === null) return 0;
    const left = depth(node.left);
    const right = depth(node.right);
    maxDiam = Math.max(maxDiam, left + right);
    return 1 + Math.max(left, right);
  }
  depth(root);
  return maxDiam;
}`;

// ── metadata ───────────────────────────────────────────────────

export const diameterMeta: TreeAlgorithmMeta = {
  name: "二元樹直徑 (Diameter)",
  slug: "tree-diameter",
  category: "tree",
  timeBest: "O(n)",
  timeAvg: "O(n)",
  timeWorst: "O(n)",
  space: "O(h)",
  tags: ["遞迴", "DFS", "後序", "路徑"],
};
