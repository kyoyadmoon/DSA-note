import { describe, expect, it } from "vitest";
import {
  weightedQuickUnion,
  weightedQuickUnionFull,
  weightedQuickUnionSteps,
  weightedQuickUnionSource,
} from "@/lib/algorithms/graph/union-find/weightedQuickUnion";
import {
  ReferenceDSU,
  assertSameComponents,
  assertStepSequence,
  randomOps,
} from "./_helpers";

function treeHeight(parents: readonly number[], i: number): number {
  let h = 0;
  while (parents[i] !== i) {
    i = parents[i];
    h++;
  }
  return h;
}

describe("weightedQuickUnion (pure)", () => {
  it("matches ReferenceDSU on 100 random sequences", () => {
    for (let trial = 0; trial < 100; trial++) {
      const n = 4 + Math.floor(Math.random() * 12);
      const ops = randomOps(n, 30, Math.random);
      const parents = weightedQuickUnion({ n, ops });
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

  it("guarantees tree height ≤ ⌈log2 n⌉", () => {
    for (let trial = 0; trial < 30; trial++) {
      const n = 8 + Math.floor(Math.random() * 24);
      const ops = randomOps(n, 80, Math.random);
      const { parents } = weightedQuickUnionFull({ n, ops });
      const cap = Math.ceil(Math.log2(Math.max(2, n)));
      for (let i = 0; i < n; i++) {
        expect(treeHeight(parents, i)).toBeLessThanOrEqual(cap);
      }
    }
  });
});

describe("weightedQuickUnionSteps", () => {
  it("starts idle, ends done", () => {
    const steps = weightedQuickUnionSteps({
      n: 4,
      ops: [{ kind: "union", p: 0, q: 1 }],
    });
    expect(steps[0].phase).toBe("idle");
    expect(steps[steps.length - 1].phase).toBe("done");
  });

  it("validates structurally on random inputs", () => {
    for (let trial = 0; trial < 30; trial++) {
      const n = 3 + Math.floor(Math.random() * 10);
      const ops = randomOps(n, 18, Math.random);
      const steps = weightedQuickUnionSteps({ n, ops });
      assertStepSequence(steps, weightedQuickUnionSource, n, ops);
      const pure = weightedQuickUnion({ n, ops });
      assertSameComponents(steps[steps.length - 1].parents, pure);
    }
  });

  it("ranks are recorded in every step", () => {
    const steps = weightedQuickUnionSteps({
      n: 4,
      ops: [{ kind: "union", p: 0, q: 1 }],
    });
    for (const s of steps) {
      expect(s.ranks).toBeDefined();
      expect(s.ranks!.length).toBe(4);
    }
  });

  it("maps each linking branch to the assignment shown in CodePanel", () => {
    const steps = weightedQuickUnionSteps({
      n: 4,
      ops: [
        { kind: "union", p: 0, q: 1 }, // equal rank
        { kind: "union", p: 2, q: 0 }, // rankP < rankQ
        { kind: "union", p: 0, q: 3 }, // rankP > rankQ
      ],
    });
    const linkingLines = steps
      .filter((step) => step.phase === "linking")
      .map((step) => step.codeLine);

    expect(linkingLines).toEqual([18, 14, 16]);
    for (const line of linkingLines) {
      expect(weightedQuickUnionSource.split("\n")[line - 1]).toContain(
        "parents[",
      );
    }
  });
});
