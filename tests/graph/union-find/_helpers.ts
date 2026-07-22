import type { UnionFindOp, UnionFindStep } from "@/lib/types/unionFind";

/**
 * Brute-force reference DSU using Map<number, Set<number>> for component
 * membership. Used by all four UF variant tests as the source of truth for
 * connectivity after applying a sequence of ops.
 */
export class ReferenceDSU {
  private idOf: Map<number, number>;
  private members: Map<number, Set<number>>;
  constructor(n: number) {
    this.idOf = new Map();
    this.members = new Map();
    for (let i = 0; i < n; i++) {
      this.idOf.set(i, i);
      this.members.set(i, new Set([i]));
    }
  }
  union(p: number, q: number) {
    const ip = this.idOf.get(p)!;
    const iq = this.idOf.get(q)!;
    if (ip === iq) return;
    const sp = this.members.get(ip)!;
    const sq = this.members.get(iq)!;
    // merge smaller into larger for speed
    const [keep, drop] = sp.size >= sq.size ? [ip, iq] : [iq, ip];
    const keepSet = this.members.get(keep)!;
    const dropSet = this.members.get(drop)!;
    for (const x of dropSet) {
      keepSet.add(x);
      this.idOf.set(x, keep);
    }
    this.members.delete(drop);
  }
  connected(p: number, q: number) {
    return this.idOf.get(p) === this.idOf.get(q);
  }
  componentCount() {
    return this.members.size;
  }
}

/**
 * Generate a random sequence of union/find ops. Mostly union (~85%) so the
 * structure changes are visible.
 */
export function randomOps(n: number, count: number, seedFn: () => number): UnionFindOp[] {
  if (n < 2) return [];
  const ops: UnionFindOp[] = [];
  for (let i = 0; i < count; i++) {
    if (seedFn() < 0.85) {
      const p = Math.floor(seedFn() * n);
      let q = Math.floor(seedFn() * n);
      if (q === p) q = (q + 1) % n;
      ops.push({ kind: "union", p, q });
    } else {
      ops.push({ kind: "find", x: Math.floor(seedFn() * n) });
    }
  }
  return ops;
}

/**
 * Verify that a parents array is a valid DSU encoding:
 *   - every parent value is in [0, n)
 *   - walking parent chain from any index converges to a self-loop within n hops
 *
 * For Quick Find this still holds because every member's "parent" is its
 * component id, and that id is its own parent (id-of-id is itself only if
 * the id slot still self-references — it doesn't necessarily after union).
 *
 * Therefore Quick Find encodes connectivity differently and we use a
 * dedicated `assertValidQuickFindParents` helper below.
 */
export function assertValidParents(parents: readonly number[]) {
  const n = parents.length;
  for (let i = 0; i < n; i++) {
    if (!Number.isInteger(parents[i])) throw new Error(`parent[${i}] not int`);
    if (parents[i] < 0 || parents[i] >= n) {
      throw new Error(`parent[${i}] = ${parents[i]} out of [0, ${n})`);
    }
  }
  for (let i = 0; i < n; i++) {
    let cur = i;
    let hops = 0;
    while (parents[cur] !== cur) {
      cur = parents[cur];
      if (++hops > n) {
        throw new Error(`parent chain from ${i} did not converge within ${n} hops`);
      }
    }
  }
}

/** For Quick Find: every parent value must itself satisfy `parent[v] === v`. */
export function assertValidQuickFindParents(parents: readonly number[]) {
  const n = parents.length;
  for (let i = 0; i < n; i++) {
    const v = parents[i];
    if (v < 0 || v >= n) throw new Error(`parent[${i}] = ${v} out of range`);
    if (parents[v] !== v) {
      throw new Error(`Quick Find invariant violated at ${i}: parents[${v}] = ${parents[v]}, expected ${v}`);
    }
  }
}

/**
 * Group elements into components by walking the parent chain (works for
 * both Quick Union and Quick Find variants).
 */
export function componentsFromParents(parents: readonly number[]): Set<string> {
  const n = parents.length;
  function root(i: number): number {
    let cur = i;
    while (parents[cur] !== cur) cur = parents[cur];
    return cur;
  }
  const groups = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const r = root(i);
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r)!.push(i);
  }
  // Hash each component into a sorted-comma-separated string so two parent
  // arrays that encode the same components but with different roots are
  // considered equal.
  const sigs = new Set<string>();
  for (const members of groups.values()) {
    sigs.add(members.sort((a, b) => a - b).join(","));
  }
  return sigs;
}

/**
 * Assert two parent arrays encode the same component partition (regardless
 * of which member each component picked as its root).
 */
export function assertSameComponents(a: readonly number[], b: readonly number[]) {
  const sigA = componentsFromParents(a);
  const sigB = componentsFromParents(b);
  if (sigA.size !== sigB.size) {
    throw new Error(`component count differs: ${sigA.size} vs ${sigB.size}`);
  }
  for (const s of sigA) {
    if (!sigB.has(s)) throw new Error(`component {${s}} missing from second partition`);
  }
}

/** Run common assertions on a step sequence. */
export function assertStepSequence(
  steps: UnionFindStep[],
  source: string,
  n: number,
  ops: UnionFindOp[],
  options: { quickFind?: boolean } = {},
) {
  if (steps.length === 0) throw new Error("empty step sequence");
  if (steps[0].phase !== "idle") throw new Error("first step must be idle");
  if (steps[steps.length - 1].phase !== "done") {
    throw new Error("last step must be done");
  }
  const totalLines = source.split("\n").length;
  let prevOpIndex = -2;
  for (const s of steps) {
    if (s.parents.length !== n) throw new Error("parents length mismatch");
    if (options.quickFind) assertValidQuickFindParents(s.parents);
    else assertValidParents(s.parents);
    if (!s.title || !s.detail) throw new Error("step missing title/detail");
    if (s.codeLine < 1 || s.codeLine > totalLines) {
      throw new Error(`codeLine ${s.codeLine} out of range [1, ${totalLines}]`);
    }
    if (s.currentOpIndex < prevOpIndex) {
      throw new Error("currentOpIndex regressed");
    }
    prevOpIndex = s.currentOpIndex;
  }
  void ops; // currently unused but kept for future per-op assertions
}
