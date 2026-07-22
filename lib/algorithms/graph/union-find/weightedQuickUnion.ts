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

// ── pure function ──────────────────────────────────────────────

/**
 * Weighted Quick Union with union-by-rank. Returns final parents array;
 * tests can also compare ranks if needed via `weightedQuickUnionFull`.
 */
export function weightedQuickUnion(input: UnionFindInput): number[] {
  return weightedQuickUnionFull(input).parents;
}

export function weightedQuickUnionFull(
  input: UnionFindInput,
): { parents: number[]; ranks: number[] } {
  const parents = makeInitialParents(input.n);
  const ranks = new Array<number>(input.n).fill(0);
  for (const op of input.ops) {
    if (op.kind !== "union") continue;
    const rp = findRoot(parents, op.p);
    const rq = findRoot(parents, op.q);
    if (rp === rq) continue;
    if (ranks[rp] < ranks[rq]) parents[rp] = rq;
    else if (ranks[rp] > ranks[rq]) parents[rq] = rp;
    else {
      parents[rq] = rp;
      ranks[rp]++;
    }
  }
  return { parents, ranks };
}

// ── step generator ─────────────────────────────────────────────

export function weightedQuickUnionSteps(
  input: UnionFindInput,
): UnionFindStep[] {
  const { n, ops } = input;
  const parents = makeInitialParents(n);
  const ranks = new Array<number>(n).fill(0);
  const steps: UnionFindStep[] = [];

  steps.push(
    makeUFStep({
      parents,
      ranks,
      n,
      currentOpIndex: -1,
      phase: "idle",
      codeLine: 1,
      title: "初始化（Weighted Quick Union）",
      detail:
        n === 0
          ? "n = 0，沒有元素。"
          : `${n} 個元素，每個 parent[i] = i、rank[i] = 0。即將執行 ${ops.length} 個 op。`,
    }),
  );

  if (n === 0 || ops.length === 0) {
    steps.push(
      makeUFStep({
        parents,
        ranks,
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
      emitFind(op.x, opIndex, op, parents, ranks, steps, n);
    } else {
      emitUnion(op.p, op.q, opIndex, op, parents, ranks, steps, n);
    }
  }

  steps.push(
    makeUFStep({
      parents,
      ranks,
      n,
      currentOpIndex: ops.length,
      phase: "done",
      codeLine: 19,
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
  ranks: number[],
  steps: UnionFindStep[],
  n: number,
) {
  const path = findRootPath(parents, x);
  for (let i = 0; i < path.length; i++) {
    const visited = path.slice(0, i + 1);
    const cur = visited[visited.length - 1];
    const isRoot = parents[cur] === cur;
    steps.push(
      makeUFStep({
        parents,
        ranks,
        n,
        currentOpIndex: opIndex,
        currentOp: op,
        highlightedNodes: [x],
        activePath: visited,
        phase: "find-walking",
        codeLine: isRoot ? 5 : 2,
        title: i === 0 ? `find(${x}) 從 ${x} 出發` : `走到 ${cur}`,
        detail: isRoot
          ? `parent[${cur}] === ${cur}，root 是 ${cur}。`
          : `parent[${cur}] = ${parents[cur]}，繼續往上。`,
      }),
    );
  }
  const root = path[path.length - 1];
  steps.push(
    makeUFStep({
      parents,
      ranks,
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
  ranks: number[],
  steps: UnionFindStep[],
  n: number,
) {
  steps.push(
    makeUFStep({
      parents,
      ranks,
      n,
      currentOpIndex: opIndex,
      currentOp: op,
      highlightedNodes: [p, q],
      phase: "find-walking",
      codeLine: 9,
      title: `${formatOp(op)} 開始`,
      detail: `先 find(${p})、再 find(${q})。`,
    }),
  );

  const pathP = findRootPath(parents, p);
  for (let i = 1; i < pathP.length; i++) {
    const visited = pathP.slice(0, i + 1);
    const cur = visited[visited.length - 1];
    steps.push(
      makeUFStep({
        parents,
        ranks,
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
            ? `root 是 ${cur}。`
            : `parent[${cur}] = ${parents[cur]}，繼續往上。`,
      }),
    );
  }
  const rootP = pathP[pathP.length - 1];

  const pathQ = findRootPath(parents, q);
  for (let i = 0; i < pathQ.length; i++) {
    const visited = pathQ.slice(0, i + 1);
    const cur = visited[visited.length - 1];
    steps.push(
      makeUFStep({
        parents,
        ranks,
        n,
        currentOpIndex: opIndex,
        currentOp: op,
        highlightedNodes: [q],
        activePath: visited,
        phase: "find-walking",
        codeLine: i === 0 ? 10 : 2,
        title: i === 0 ? `find(${q}) 從 ${q} 出發` : `find(${q}) 走到 ${cur}`,
        detail:
          parents[cur] === cur
            ? `root 是 ${cur}。`
            : `parent[${cur}] = ${parents[cur]}，繼續往上。`,
      }),
    );
  }
  const rootQ = pathQ[pathQ.length - 1];

  if (rootP === rootQ) {
    steps.push(
      makeUFStep({
        parents,
        ranks,
        n,
        currentOpIndex: opIndex,
        currentOp: op,
        highlightedNodes: [rootP],
        phase: "compare-roots",
        codeLine: 11,
        title: "兩個 root 相同",
        detail: `${p} 與 ${q} 已在同一棵樹（root=${rootP}），跳過。`,
      }),
    );
    steps.push(
      makeUFStep({
        parents,
        ranks,
        n,
        currentOpIndex: opIndex,
        currentOp: op,
        highlightedNodes: [p, q],
        phase: "op-complete",
        codeLine: 11,
        title: `${formatOp(op)} 完成`,
        detail: `${p} 與 ${q} 已連通。`,
      }),
    );
    return;
  }

  // Compare ranks.
  steps.push(
    makeUFStep({
      parents,
      ranks,
      n,
      currentOpIndex: opIndex,
      currentOp: op,
      highlightedNodes: [rootP, rootQ],
      phase: "compare-roots",
      codeLine: 13,
      title: `比較 rank：rank[${rootP}]=${ranks[rootP]} vs rank[${rootQ}]=${ranks[rootQ]}`,
      detail: `union by rank：把矮樹接到高樹底下，避免樹變高。`,
    }),
  );

  let child: number;
  let parent: number;
  let rankChanged = false;
  let linkCodeLine: number;
  if (ranks[rootP] < ranks[rootQ]) {
    child = rootP;
    parent = rootQ;
    parents[rootP] = rootQ;
    linkCodeLine = 14;
  } else if (ranks[rootP] > ranks[rootQ]) {
    child = rootQ;
    parent = rootP;
    parents[rootQ] = rootP;
    linkCodeLine = 16;
  } else {
    child = rootQ;
    parent = rootP;
    parents[rootQ] = rootP;
    ranks[rootP]++;
    rankChanged = true;
    linkCodeLine = 18;
  }

  steps.push(
    makeUFStep({
      parents,
      ranks,
      n,
      currentOpIndex: opIndex,
      currentOp: op,
      highlightedNodes: [child, parent],
      linkChildRoot: child,
      linkParentRoot: parent,
      phase: "linking",
      codeLine: linkCodeLine,
      title: `把 ${child} 接到 ${parent} 底下`,
      detail: rankChanged
        ? `兩棵樹同高，任挑一棵接過去；接收方 rank 從 ${ranks[parent] - 1} 加到 ${ranks[parent]}。`
        : `${parent} 比較高，${child} 接過去後不會讓樹變高。`,
    }),
  );

  steps.push(
    makeUFStep({
      parents,
      ranks,
      n,
      currentOpIndex: opIndex,
      currentOp: op,
      highlightedNodes: [p, q],
      phase: "op-complete",
      codeLine: 18,
      title: `${formatOp(op)} 完成`,
      detail: `${p} 與 ${q} 現在屬於同一棵樹（root=${parent}）。`,
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

// ── source code ────────────────────────────────────────────────

export const weightedQuickUnionSource = `function find(parents: number[], x: number): number {
  while (parents[x] !== x) {
    x = parents[x];
  }
  return x;
}

function union(parents: number[], ranks: number[], p: number, q: number) {
  const rootP = find(parents, p);
  const rootQ = find(parents, q);
  if (rootP === rootQ) return;
  // union by rank：矮樹接到高樹底下
  if (ranks[rootP] < ranks[rootQ]) {
    parents[rootP] = rootQ;
  } else if (ranks[rootP] > ranks[rootQ]) {
    parents[rootQ] = rootP;
  } else {
    parents[rootQ] = rootP;
    ranks[rootP]++;
  }
}`;

// ── metadata ───────────────────────────────────────────────────

export const weightedQuickUnionMeta: UnionFindAlgorithmMeta = {
  name: "Weighted Quick Union",
  slug: "uf-weighted-quick-union",
  category: "union-find",
  timeFind: "O(log n)",
  timeUnion: "O(log n)",
  space: "O(n)",
  tags: ["union-find", "DSU", "union-by-rank"],
};
