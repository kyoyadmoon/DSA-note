import { describe, expect, it } from "vitest";
import { dijkstraSteps } from "@/lib/algorithms/graph/dijkstra";
import type { GraphInput } from "@/lib/types/dataStructure";

function final(input: GraphInput) {
  const step = dijkstraSteps(input).at(-1)!;
  expect(step.view.kind).toBe("graph");
  if (step.view.kind !== "graph") throw new Error("Expected graph view");
  return { step, view: step.view };
}

function distances(input: GraphInput): Record<string, string | undefined> {
  const { view } = final(input);
  return Object.fromEntries(view.nodes.map((node) => [node.id, node.badge]));
}

describe("dijkstraSteps", () => {
  const graph: GraphInput = {
    kind: "graph",
    nodes: ["A", "B", "C", "D"],
    edges: [["A", "B", 4], ["A", "C", 1], ["C", "B", 2], ["B", "D", 1], ["C", "D", 5]],
    start: "A",
    directed: true,
  };

  it("computes shortest distances on a non-negative weighted graph", () => {
    expect(distances(graph)).toEqual({ A: "d=0", B: "d=3", C: "d=1", D: "d=4" });
  });

  it("settles vertices in nondecreasing shortest-distance order", () => {
    const { view } = final(graph);
    expect(view.visitOrder).toEqual(["A", "C", "B", "D"]);
  });

  it("leaves unreachable vertices at infinity", () => {
    expect(
      distances({
        kind: "graph",
        nodes: ["A", "B", "X"],
        edges: [["A", "B", 2]],
        start: "A",
        directed: true,
      }).X,
    ).toBe("d=∞");
  });

  it("rejects negative edge weights", () => {
    const { step } = final({
      kind: "graph",
      nodes: ["A", "B"],
      edges: [["A", "B", -1]],
      start: "A",
      directed: true,
    });
    expect(step.phase).toBe("invalid-negative-edge");
  });

  it("skips stale priority-queue entries", () => {
    const steps = dijkstraSteps({
      kind: "graph",
      nodes: ["A", "B", "C"],
      edges: [["A", "B", 10], ["A", "C", 1], ["C", "B", 1]],
      start: "A",
      directed: true,
    });
    expect(steps.some((step) => step.phase === "stale")).toBe(true);
  });

  it("does not mutate the caller input", () => {
    const snapshot = structuredClone(graph);
    dijkstraSteps(graph);
    expect(graph).toEqual(snapshot);
  });
});
