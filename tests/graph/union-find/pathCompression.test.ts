import { describe, expect, it } from "vitest";
import {
  pathCompression,
  pathCompressionFull,
  pathCompressionSteps,
  pathCompressionSource,
} from "@/lib/algorithms/graph/union-find/pathCompression";
import {
  ReferenceDSU,
  assertSameComponents,
  assertStepSequence,
  randomOps,
} from "./_helpers";

describe("pathCompression (pure)", () => {
  it("matches ReferenceDSU on 100 random sequences", () => {
    for (let trial = 0; trial < 100; trial++) {
      const n = 4 + Math.floor(Math.random() * 12);
      const ops = randomOps(n, 30, Math.random);
      const parents = pathCompression({ n, ops });
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

  it("after find(x), every node on the path points directly to root", () => {
    // Build a depth-3 tree with union-by-rank, then compress the path from 7.
    const n = 8;
    const ops = [
      { kind: "union" as const, p: 0, q: 1 },
      { kind: "union" as const, p: 2, q: 3 },
      { kind: "union" as const, p: 4, q: 5 },
      { kind: "union" as const, p: 6, q: 7 },
      { kind: "union" as const, p: 0, q: 2 },
      { kind: "union" as const, p: 4, q: 6 },
      { kind: "union" as const, p: 0, q: 4 },
      { kind: "find" as const, x: 7 },
    ];
    const { parents } = pathCompressionFull({ n, ops });
    const root = parents[0];

    expect(parents[7]).toBe(root);
    expect(parents[6]).toBe(root);
    expect(parents[4]).toBe(root);
  });
});

describe("pathCompressionSteps", () => {
  it("starts idle, ends done", () => {
    const steps = pathCompressionSteps({
      n: 4,
      ops: [{ kind: "union", p: 0, q: 1 }],
    });
    expect(steps[0].phase).toBe("idle");
    expect(steps[steps.length - 1].phase).toBe("done");
  });

  it("emits a compressing step when a path of length ≥ 2 is walked", () => {
    const steps = pathCompressionSteps({
      n: 6,
      ops: [
        { kind: "union", p: 0, q: 1 },
        { kind: "union", p: 2, q: 3 },
        { kind: "union", p: 0, q: 2 },
        { kind: "union", p: 4, q: 0 },
        { kind: "find", x: 3 },
      ],
    });
    const compressing = steps.filter((s) => s.phase === "compressing");
    expect(compressing.length).toBeGreaterThan(0);
  });

  it("validates structurally on random inputs", () => {
    for (let trial = 0; trial < 30; trial++) {
      const n = 3 + Math.floor(Math.random() * 10);
      const ops = randomOps(n, 18, Math.random);
      const steps = pathCompressionSteps({ n, ops });
      assertStepSequence(steps, pathCompressionSource, n, ops);
      const pure = pathCompression({ n, ops });
      assertSameComponents(steps[steps.length - 1].parents, pure);
    }
  });

  it("maps each linking branch to the assignment shown in CodePanel", () => {
    const steps = pathCompressionSteps({
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

    expect(linkingLines).toEqual([23, 19, 21]);
    for (const line of linkingLines) {
      expect(pathCompressionSource.split("\n")[line - 1]).toContain(
        "parents[",
      );
    }
  });
});
