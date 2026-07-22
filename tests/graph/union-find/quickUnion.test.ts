import { describe, expect, it } from "vitest";
import {
  quickUnion,
  quickUnionSteps,
  quickUnionSource,
} from "@/lib/algorithms/graph/union-find/quickUnion";
import type { UnionFindOp } from "@/lib/types/unionFind";
import {
  ReferenceDSU,
  assertSameComponents,
  assertStepSequence,
  randomOps,
} from "./_helpers";

describe("quickUnion (pure)", () => {
  it("n=0 produces empty array", () => {
    expect(quickUnion({ n: 0, ops: [] })).toEqual([]);
  });

  it("n=1 with no ops returns [0]", () => {
    expect(quickUnion({ n: 1, ops: [] })).toEqual([0]);
  });

  it("no ops keeps every element disjoint", () => {
    const parents = quickUnion({ n: 5, ops: [] });
    expect(parents).toEqual([0, 1, 2, 3, 4]);
  });

  it("union(0,1)..union(n-2,n-1) connects everything", () => {
    const n = 6;
    const ops: UnionFindOp[] = [];
    for (let i = 0; i < n - 1; i++) ops.push({ kind: "union", p: i, q: i + 1 });
    const parents = quickUnion({ n, ops });
    function root(x: number): number {
      while (parents[x] !== x) x = parents[x];
      return x;
    }
    const r0 = root(0);
    for (let i = 1; i < n; i++) expect(root(i)).toBe(r0);
  });

  it("matches a brute-force ReferenceDSU on 100 random sequences", () => {
    for (let trial = 0; trial < 100; trial++) {
      const n = 4 + Math.floor(Math.random() * 10);
      const ops = randomOps(n, 30, Math.random);
      const parents = quickUnion({ n, ops });
      const ref = new ReferenceDSU(n);
      for (const op of ops) if (op.kind === "union") ref.union(op.p, op.q);
      function root(x: number): number {
        while (parents[x] !== x) x = parents[x];
        return x;
      }
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          expect(root(i) === root(j)).toBe(ref.connected(i, j));
        }
      }
    }
  });
});

describe("quickUnionSteps", () => {
  it("starts idle, ends done", () => {
    const steps = quickUnionSteps({
      n: 4,
      ops: [
        { kind: "union", p: 0, q: 1 },
        { kind: "union", p: 2, q: 3 },
      ],
    });
    expect(steps[0].phase).toBe("idle");
    expect(steps[steps.length - 1].phase).toBe("done");
  });

  it("validates structurally on random inputs", () => {
    for (let trial = 0; trial < 30; trial++) {
      const n = 3 + Math.floor(Math.random() * 8);
      const ops = randomOps(n, 12, Math.random);
      const steps = quickUnionSteps({ n, ops });
      assertStepSequence(steps, quickUnionSource, n, ops);
      const last = steps[steps.length - 1];
      const pure = quickUnion({ n, ops });
      assertSameComponents(last.parents, pure);
    }
  });

  it("handles empty ops", () => {
    const steps = quickUnionSteps({ n: 5, ops: [] });
    expect(steps[0].phase).toBe("idle");
    expect(steps[steps.length - 1].phase).toBe("done");
    expect(steps[steps.length - 1].parents).toEqual([0, 1, 2, 3, 4]);
  });

  it("handles n=0", () => {
    const steps = quickUnionSteps({ n: 0, ops: [] });
    expect(steps[0].phase).toBe("idle");
    expect(steps[steps.length - 1].phase).toBe("done");
    expect(steps[steps.length - 1].parents).toEqual([]);
  });
});
