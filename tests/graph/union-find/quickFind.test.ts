import { describe, expect, it } from "vitest";
import {
  quickFind,
  quickFindSteps,
  quickFindSource,
} from "@/lib/algorithms/graph/union-find/quickFind";
import {
  ReferenceDSU,
  assertSameComponents,
  assertStepSequence,
  randomOps,
} from "./_helpers";

describe("quickFind (pure)", () => {
  it("n=0", () => {
    expect(quickFind({ n: 0, ops: [] })).toEqual([]);
  });

  it("no ops keeps every element disjoint", () => {
    expect(quickFind({ n: 4, ops: [] })).toEqual([0, 1, 2, 3]);
  });

  it("after union(0,1), parent[0] === parent[1]", () => {
    const parents = quickFind({ n: 4, ops: [{ kind: "union", p: 0, q: 1 }] });
    expect(parents[0]).toBe(parents[1]);
  });

  it("matches ReferenceDSU on 100 random sequences", () => {
    for (let trial = 0; trial < 100; trial++) {
      const n = 4 + Math.floor(Math.random() * 10);
      const ops = randomOps(n, 30, Math.random);
      const parents = quickFind({ n, ops });
      const ref = new ReferenceDSU(n);
      for (const op of ops) if (op.kind === "union") ref.union(op.p, op.q);
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          expect(parents[i] === parents[j]).toBe(ref.connected(i, j));
        }
      }
    }
  });
});

describe("quickFindSteps", () => {
  it("starts idle, ends done", () => {
    const steps = quickFindSteps({
      n: 4,
      ops: [{ kind: "union", p: 0, q: 1 }],
    });
    expect(steps[0].phase).toBe("idle");
    expect(steps[steps.length - 1].phase).toBe("done");
  });

  it("validates structurally on random inputs", () => {
    for (let trial = 0; trial < 30; trial++) {
      const n = 3 + Math.floor(Math.random() * 8);
      const ops = randomOps(n, 12, Math.random);
      const steps = quickFindSteps({ n, ops });
      assertStepSequence(steps, quickFindSource, n, ops, { quickFind: true });
      const pure = quickFind({ n, ops });
      assertSameComponents(steps[steps.length - 1].parents, pure);
    }
  });

  it("emits a relabeling step when a union actually merges", () => {
    const steps = quickFindSteps({
      n: 4,
      ops: [{ kind: "union", p: 0, q: 1 }],
    });
    const relabels = steps.filter((s) => s.phase === "relabeling");
    expect(relabels.length).toBe(1);
  });
});
