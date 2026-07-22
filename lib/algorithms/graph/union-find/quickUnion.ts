import type {
  UnionFindAlgorithmMeta,
  UnionFindInput,
  UnionFindOp,
  UnionFindStep,
} from "@/lib/types/unionFind";
import {
  findRoot,
  findRootPath,
  formatOp,
  listComponents,
  makeInitialParents,
  makeUFStep,
} from "./_shared";

// ── pure function (testable) ───────────────────────────────────

/**
 * Run a sequence of union/find ops with the quick-union strategy and
 * return the final parents array. Useful for tests that compare against
 * a reference implementation.
 */
export function quickUnion(input: UnionFindInput): number[] {
  const parents = makeInitialParents(input.n);
  for (const op of input.ops) {
    if (op.kind === "union") {
      const rp = findRoot(parents, op.p);
      const rq = findRoot(parents, op.q);
      if (rp !== rq) parents[rp] = rq;
    }
  }
  return parents;
}

// ── step generator ─────────────────────────────────────────────

export function quickUnionSteps(input: UnionFindInput): UnionFindStep[] {
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
      title: "初始化森林",
      detail:
        n === 0
          ? "n = 0，沒有元素。"
          : `${n} 個元素，每個自成一棵單節點樹（parent[i] = i）。即將執行 ${ops.length} 個 op。`,
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
    emitOp(op, opIndex, parents, steps, n);
  }

  steps.push(
    makeUFStep({
      parents,
      n,
      currentOpIndex: ops.length,
      phase: "done",
      codeLine: 13,
      title: "全部 op 執行完畢",
      detail: describeFinalState(parents),
    }),
  );

  return steps;
}

function emitOp(
  op: UnionFindOp,
  opIndex: number,
  parents: number[],
  steps: UnionFindStep[],
  n: number,
) {
  if (op.kind === "find") {
    emitFind(op.x, opIndex, op, parents, steps, n);
    return;
  }
  emitUnion(op.p, op.q, opIndex, op, parents, steps, n);
}

function emitFind(
  x: number,
  opIndex: number,
  op: UnionFindOp,
  parents: number[],
  steps: UnionFindStep[],
  n: number,
) {
  const path = findRootPath(parents, x);
  const root = path[path.length - 1];

  // Walk steps — show the path lengthening one node at a time.
  for (let i = 0; i < path.length; i++) {
    const visited = path.slice(0, i + 1);
    const cur = visited[visited.length - 1];
    const isRoot = parents[cur] === cur;
    const title = i === 0 ? `find(${x}) 從 ${x} 出發` : `往上走到 ${cur}`;
    const detail = isRoot
      ? `parent[${cur}] === ${cur}，到達 root。`
      : `parent[${cur}] = ${parents[cur]}，繼續往上。`;
    steps.push(
      makeUFStep({
        parents,
        n,
        currentOpIndex: opIndex,
        currentOp: op,
        highlightedNodes: [x],
        activePath: visited,
        phase: "find-walking",
        codeLine: isRoot ? 5 : 2,
        title,
        detail,
      }),
    );
  }

  steps.push(
    makeUFStep({
      parents,
      n,
      currentOpIndex: opIndex,
      currentOp: op,
      highlightedNodes: [x, root],
      activePath: path,
      phase: "op-complete",
      codeLine: 5,
      title: `find(${x}) = ${root}`,
      detail: `${x} 所屬 component 的 root 是 ${root}。`,
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
  steps.push(
    makeUFStep({
      parents,
      n,
      currentOpIndex: opIndex,
      currentOp: op,
      highlightedNodes: [p, q],
      phase: "find-walking",
      codeLine: 9,
      title: `${formatOp(op)} 開始`,
      detail: `先 find(${p})、再 find(${q})，看兩者是否在同一棵樹。`,
    }),
  );

  // find p
  const pathP = findRootPath(parents, p);
  for (let i = 1; i < pathP.length; i++) {
    const visited = pathP.slice(0, i + 1);
    const cur = visited[visited.length - 1];
    steps.push(
      makeUFStep({
        parents,
        n,
        currentOpIndex: opIndex,
        currentOp: op,
        highlightedNodes: [p],
        activePath: visited,
        phase: "find-walking",
        codeLine: 2,
        title: `find(${p}) 走到 ${cur}`,
        detail:
          parents[cur] === cur
            ? `parent[${cur}] === ${cur}，root 是 ${cur}。`
            : `parent[${cur}] = ${parents[cur]}，繼續往上。`,
      }),
    );
  }
  const rootP = pathP[pathP.length - 1];

  // find q
  const pathQ = findRootPath(parents, q);
  for (let i = 0; i < pathQ.length; i++) {
    const visited = pathQ.slice(0, i + 1);
    const cur = visited[visited.length - 1];
    const title = i === 0 ? `find(${q}) 從 ${q} 出發` : `find(${q}) 走到 ${cur}`;
    steps.push(
      makeUFStep({
        parents,
        n,
        currentOpIndex: opIndex,
        currentOp: op,
        highlightedNodes: [q],
        activePath: visited,
        phase: "find-walking",
        codeLine: i === 0 ? 10 : 2,
        title,
        detail:
          parents[cur] === cur
            ? `parent[${cur}] === ${cur}，root 是 ${cur}。`
            : `parent[${cur}] = ${parents[cur]}，繼續往上。`,
      }),
    );
  }
  const rootQ = pathQ[pathQ.length - 1];

  // Compare roots
  if (rootP === rootQ) {
    steps.push(
      makeUFStep({
        parents,
        n,
        currentOpIndex: opIndex,
        currentOp: op,
        highlightedNodes: [rootP],
        phase: "compare-roots",
        codeLine: 11,
        title: "兩個 root 相同",
        detail: `rootP === rootQ === ${rootP}，${p} 與 ${q} 已在同一個 component，不需要動作。`,
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
        codeLine: 11,
        title: `${formatOp(op)} 完成`,
        detail: `${p} 與 ${q} 已連通，跳過此 union。`,
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
      highlightedNodes: [rootP, rootQ],
      phase: "compare-roots",
      codeLine: 11,
      title: `比較兩個 root：${rootP} vs ${rootQ}`,
      detail: `兩個 root 不同，需要把其中一棵接到另一棵底下。`,
    }),
  );

  // Link rootP under rootQ.
  parents[rootP] = rootQ;
  steps.push(
    makeUFStep({
      parents,
      n,
      currentOpIndex: opIndex,
      currentOp: op,
      highlightedNodes: [rootP, rootQ],
      linkChildRoot: rootP,
      linkParentRoot: rootQ,
      phase: "linking",
      codeLine: 12,
      title: `把 ${rootP} 接到 ${rootQ} 底下`,
      detail: `parent[${rootP}] = ${rootQ}，兩棵樹合併成一棵。`,
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
      codeLine: 12,
      title: `${formatOp(op)} 完成`,
      detail: `${p} 與 ${q} 現在屬於同一個 component。`,
    }),
  );
}

function describeFinalState(parents: number[]): string {
  const comps = listComponents(parents);
  if (comps.length === 0) return "森林為空。";
  const desc = comps
    .map((c) => `{${c.join(", ")}}（root=${c[0]}）`)
    .join("、");
  return `共 ${comps.length} 個 component：${desc}。`;
}

// ── source code (for CodePanel) ────────────────────────────────

export const quickUnionSource = `function find(parents: number[], x: number): number {
  while (parents[x] !== x) {
    x = parents[x];
  }
  return x;
}

function union(parents: number[], p: number, q: number): void {
  const rootP = find(parents, p);
  const rootQ = find(parents, q);
  if (rootP === rootQ) return;
  parents[rootP] = rootQ;
}`;

// ── metadata ───────────────────────────────────────────────────

export const quickUnionMeta: UnionFindAlgorithmMeta = {
  name: "Quick Union",
  slug: "uf-quick-union",
  category: "union-find",
  timeFind: "O(n)（最壞）",
  timeUnion: "O(n)（最壞）",
  space: "O(n)",
  tags: ["union-find", "DSU", "lazy"],
};
