import type {
  UnionFindAlgorithmMeta,
  UnionFindInput,
  UnionFindOp,
  UnionFindStep,
} from "@/lib/types/unionFind";
import {
  findRootPath,
  formatOp,
  listComponents,
  makeInitialParents,
  makeUFStep,
} from "./_shared";

// ── pure function ──────────────────────────────────────────────

/** Weighted quick union + full path compression. */
export function pathCompression(input: UnionFindInput): number[] {
  return pathCompressionFull(input).parents;
}

export function pathCompressionFull(
  input: UnionFindInput,
): { parents: number[]; ranks: number[] } {
  const parents = makeInitialParents(input.n);
  const ranks = new Array<number>(input.n).fill(0);

  function find(x: number): number {
    const path: number[] = [];
    while (parents[x] !== x) {
      path.push(x);
      x = parents[x];
    }
    // Compress: every node on the path now points directly to the root.
    for (const y of path) parents[y] = x;
    return x;
  }

  for (const op of input.ops) {
    if (op.kind === "find") {
      find(op.x);
      continue;
    }
    const rp = find(op.p);
    const rq = find(op.q);
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

export function pathCompressionSteps(input: UnionFindInput): UnionFindStep[] {
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
      title: "初始化（Weighted + Path Compression）",
      detail:
        n === 0
          ? "n = 0，沒有元素。"
          : `${n} 個元素。每次 find 走訪後會把整條路徑直接接到 root。`,
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
      doFindWithCompression(op.x, opIndex, op, parents, ranks, steps, n);
    } else {
      doUnionWithCompression(op.p, op.q, opIndex, op, parents, ranks, steps, n);
    }
  }

  steps.push(
    makeUFStep({
      parents,
      ranks,
      n,
      currentOpIndex: ops.length,
      phase: "done",
      codeLine: 26,
      title: "全部 op 執行完畢",
      detail: describeFinalState(parents),
    }),
  );

  return steps;
}

/**
 * Walk to the root, emit a step per hop, then emit a single "compress"
 * step that flattens every node on the path so its parent points directly
 * to the root. Mutates `parents`. Returns the root.
 */
function doFindWithCompression(
  x: number,
  opIndex: number,
  op: UnionFindOp,
  parents: number[],
  ranks: number[],
  steps: UnionFindStep[],
  n: number,
): number {
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
        codeLine: isRoot ? 7 : 4,
        title: i === 0 ? `find(${x}) 從 ${x} 出發` : `走到 ${cur}`,
        detail: isRoot
          ? `parent[${cur}] === ${cur}，root 是 ${cur}。`
          : `parent[${cur}] = ${parents[cur]}，繼續往上。`,
      }),
    );
  }

  const root = path[path.length - 1];
  // Path compression: every visited non-root now points to root.
  const toCompress = path.slice(0, -1).filter((y) => parents[y] !== root);
  if (toCompress.length > 0) {
    for (const y of toCompress) parents[y] = root;
    steps.push(
      makeUFStep({
        parents,
        ranks,
        n,
        currentOpIndex: opIndex,
        currentOp: op,
        highlightedNodes: toCompress,
        activePath: path,
        phase: "compressing",
        codeLine: 9,
        title: "Path Compression：壓平這條路徑",
        detail: `${toCompress.join(", ")} 的 parent 直接設為 root（${root}），這條路徑變扁。`,
      }),
    );
  }

  if (op.kind === "find") {
    steps.push(
      makeUFStep({
        parents,
        ranks,
        n,
        currentOpIndex: opIndex,
        currentOp: op,
        highlightedNodes: [x, root],
        activePath: [x, root],
        phase: "op-complete",
        codeLine: 10,
        title: `find(${x}) = ${root}`,
        detail: `下次再 find 路徑上的任何節點都是 O(1)。`,
      }),
    );
  }

  return root;
}

function doUnionWithCompression(
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
      codeLine: 13,
      title: `${formatOp(op)} 開始`,
      detail: `先 find(${p}) 並順便壓平、再 find(${q}) 並順便壓平。`,
    }),
  );

  const rootP = doFindWithCompression(p, opIndex, op, parents, ranks, steps, n);
  const rootQ = doFindWithCompression(q, opIndex, op, parents, ranks, steps, n);

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
        codeLine: 15,
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
        codeLine: 15,
        title: `${formatOp(op)} 完成`,
        detail: `${p} 與 ${q} 已連通。`,
      }),
    );
    return;
  }

  steps.push(
    makeUFStep({
      parents,
      ranks,
      n,
      currentOpIndex: opIndex,
      currentOp: op,
      highlightedNodes: [rootP, rootQ],
      phase: "compare-roots",
      codeLine: 17,
      title: `比較 rank：rank[${rootP}]=${ranks[rootP]} vs rank[${rootQ}]=${ranks[rootQ]}`,
      detail: `Union by rank：矮樹接到高樹底下。`,
    }),
  );

  let child: number;
  let parent: number;
  let rankBumped = false;
  let linkCodeLine: number;
  if (ranks[rootP] < ranks[rootQ]) {
    child = rootP;
    parent = rootQ;
    parents[rootP] = rootQ;
    linkCodeLine = 19;
  } else if (ranks[rootP] > ranks[rootQ]) {
    child = rootQ;
    parent = rootP;
    parents[rootQ] = rootP;
    linkCodeLine = 21;
  } else {
    child = rootQ;
    parent = rootP;
    parents[rootQ] = rootP;
    ranks[rootP]++;
    rankBumped = true;
    linkCodeLine = 23;
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
      detail: rankBumped
        ? `兩棵樹同高，rank[${parent}] 從 ${ranks[parent] - 1} 加到 ${ranks[parent]}。`
        : `${parent} 比較高，${child} 接過去不會讓樹變高。`,
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
      codeLine: 25,
      title: `${formatOp(op)} 完成`,
      detail: `${p} 與 ${q} 現在屬於同一棵樹。`,
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

export const pathCompressionSource = `function find(parents: number[], x: number): number {
  // 1. 走到 root
  const path: number[] = [];
  while (parents[x] !== x) {
    path.push(x);
    x = parents[x];
  }
  // 2. Path compression：把整條路徑直接接到 root
  for (const y of path) parents[y] = x;
  return x;
}

function union(parents: number[], ranks: number[], p: number, q: number) {
  const rootP = find(parents, p);
  const rootQ = find(parents, q);
  if (rootP === rootQ) return;
  // union by rank
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

export const pathCompressionMeta: UnionFindAlgorithmMeta = {
  name: "Weighted + Path Compression",
  slug: "uf-path-compression",
  category: "union-find",
  timeFind: "O(α(n)) amortized",
  timeUnion: "O(α(n)) amortized",
  space: "O(n)",
  tags: ["union-find", "DSU", "path-compression", "α(n)"],
};
