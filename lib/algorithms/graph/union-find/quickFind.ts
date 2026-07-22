import type {
  UnionFindAlgorithmMeta,
  UnionFindInput,
  UnionFindOp,
  UnionFindStep,
} from "@/lib/types/unionFind";
import {
  formatOp,
  listComponents,
  makeInitialParents,
  makeUFStep,
} from "./_shared";

// ── pure function (testable) ───────────────────────────────────

/**
 * In Quick Find, the "id" of an element's component is stored directly in
 * `parents[i]` — every member of a component shares the same value, namely
 * the component's representative (which we'll keep calling the "root" for
 * consistency, even though structurally it's just an array entry that
 * happens to point to itself).
 */
export function quickFind(input: UnionFindInput): number[] {
  const parents = makeInitialParents(input.n);
  for (const op of input.ops) {
    if (op.kind === "union") {
      const idP = parents[op.p];
      const idQ = parents[op.q];
      if (idP === idQ) continue;
      for (let i = 0; i < parents.length; i++) {
        if (parents[i] === idP) parents[i] = idQ;
      }
    }
  }
  return parents;
}

// ── step generator ─────────────────────────────────────────────

export function quickFindSteps(input: UnionFindInput): UnionFindStep[] {
  const { n, ops } = input;
  const parents = makeInitialParents(n);
  const steps: UnionFindStep[] = [];

  steps.push(
    makeUFStep({
      parents,
      n,
      currentOpIndex: -1,
      phase: "idle",
      codeLine: 1,
      title: "初始化（Quick Find）",
      detail:
        n === 0
          ? "n = 0，沒有元素。"
          : `${n} 個元素，每個 parent[i] = i（i 自成一個 component）。即將執行 ${ops.length} 個 op。`,
    }),
  );

  if (n === 0 || ops.length === 0) {
    steps.push(
      makeUFStep({
        parents,
        n,
        currentOpIndex: ops.length,
        phase: "done",
        codeLine: 1,
        title: "結束",
        detail: describeFinalState(parents),
      }),
    );
    return steps;
  }

  for (let opIndex = 0; opIndex < ops.length; opIndex++) {
    const op = ops[opIndex];
    if (op.kind === "find") {
      emitFind(op.x, opIndex, op, parents, steps, n);
    } else {
      emitUnion(op.p, op.q, opIndex, op, parents, steps, n);
    }
  }

  steps.push(
    makeUFStep({
      parents,
      n,
      currentOpIndex: ops.length,
      phase: "done",
      codeLine: 11,
      title: "全部 op 執行完畢",
      detail: describeFinalState(parents),
    }),
  );

  return steps;
}

function emitFind(
  x: number,
  opIndex: number,
  op: UnionFindOp,
  parents: number[],
  steps: UnionFindStep[],
  n: number,
) {
  const id = parents[x];
  steps.push(
    makeUFStep({
      parents,
      n,
      currentOpIndex: opIndex,
      currentOp: op,
      highlightedNodes: [x],
      phase: "find-walking",
      codeLine: 2,
      title: `find(${x}) 直接查表`,
      detail: `Quick Find 不用走鏈：直接讀 parent[${x}] = ${id}，這就是 root。`,
    }),
  );
  steps.push(
    makeUFStep({
      parents,
      n,
      currentOpIndex: opIndex,
      currentOp: op,
      highlightedNodes: [x, id],
      phase: "op-complete",
      codeLine: 2,
      title: `find(${x}) = ${id}`,
      detail: `${x} 屬於 component ${id}。整個操作 O(1)。`,
    }),
  );
}

function emitUnion(
  p: number,
  q: number,
  opIndex: number,
  op: UnionFindOp,
  parents: number[],
  steps: UnionFindStep[],
  n: number,
) {
  const idP = parents[p];
  const idQ = parents[q];

  steps.push(
    makeUFStep({
      parents,
      n,
      currentOpIndex: opIndex,
      currentOp: op,
      highlightedNodes: [p, q],
      phase: "find-walking",
      codeLine: 6,
      title: `${formatOp(op)} 開始`,
      detail: `查 parent[${p}] = ${idP}、parent[${q}] = ${idQ}。`,
    }),
  );

  if (idP === idQ) {
    steps.push(
      makeUFStep({
        parents,
        n,
        currentOpIndex: opIndex,
        currentOp: op,
        highlightedNodes: [p, q],
        phase: "compare-roots",
        codeLine: 8,
        title: "兩者已連通",
        detail: `parent[${p}] === parent[${q}] === ${idP}，跳過此 union。`,
      }),
    );
    steps.push(
      makeUFStep({
        parents,
        n,
        currentOpIndex: opIndex,
        currentOp: op,
        highlightedNodes: [p, q],
        phase: "op-complete",
        codeLine: 8,
        title: `${formatOp(op)} 完成`,
        detail: `${p} 與 ${q} 已在同一個 component。`,
      }),
    );
    return;
  }

  steps.push(
    makeUFStep({
      parents,
      n,
      currentOpIndex: opIndex,
      currentOp: op,
      highlightedNodes: [idP, idQ],
      phase: "compare-roots",
      codeLine: 9,
      title: `要把所有 ${idP} 改寫成 ${idQ}`,
      detail: `掃描整個 parent[]，找出 component ${idP} 的所有成員，全部 relabel 成 ${idQ}。`,
    }),
  );

  // Show the relabel as one bulk step (highlight every member of the old id).
  const affected: number[] = [];
  for (let i = 0; i < n; i++) {
    if (parents[i] === idP) affected.push(i);
  }
  for (const i of affected) parents[i] = idQ;

  steps.push(
    makeUFStep({
      parents,
      n,
      currentOpIndex: opIndex,
      currentOp: op,
      highlightedNodes: affected,
      phase: "relabeling",
      codeLine: 10,
      title: `Relabel ${affected.length} 個元素`,
      detail: `${affected.join(", ")} 都從 ${idP} 改成 ${idQ}。union 是 O(n)。`,
    }),
  );

  steps.push(
    makeUFStep({
      parents,
      n,
      currentOpIndex: opIndex,
      currentOp: op,
      highlightedNodes: [p, q],
      phase: "op-complete",
      codeLine: 10,
      title: `${formatOp(op)} 完成`,
      detail: `${p} 與 ${q} 現在屬於同一個 component（id=${idQ}）。`,
    }),
  );
}

function describeFinalState(parents: number[]): string {
  const comps = listComponents(parents);
  if (comps.length === 0) return "森林為空。";
  const desc = comps
    .map((c) => `{${c.join(", ")}}（id=${c[0]}）`)
    .join("、");
  return `共 ${comps.length} 個 component：${desc}。`;
}

// ── source code (for CodePanel) ────────────────────────────────

export const quickFindSource = `function find(parents: number[], x: number): number {
  return parents[x]; // 直接查表，O(1)
}

function union(parents: number[], p: number, q: number): void {
  const idP = parents[p];
  const idQ = parents[q];
  if (idP === idQ) return;
  for (let i = 0; i < parents.length; i++) {
    if (parents[i] === idP) parents[i] = idQ; // 把整個 component 改寫
  }
}`;

// ── metadata ───────────────────────────────────────────────────

export const quickFindMeta: UnionFindAlgorithmMeta = {
  name: "Quick Find",
  slug: "uf-quick-find",
  category: "union-find",
  timeFind: "O(1)",
  timeUnion: "O(n)",
  space: "O(n)",
  tags: ["union-find", "DSU", "eager"],
};
