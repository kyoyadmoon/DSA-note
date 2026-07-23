import { describe, expect, it } from "vitest";
import { topologicalSortSteps } from "@/lib/algorithms/graph/topologicalSort";
import type { GraphInput } from "@/lib/types/dataStructure";

function finalView(input: GraphInput) {
  const final = topologicalSortSteps(input).at(-1)!;
  expect(final.view.kind).toBe("graph");
  if (final.view.kind !== "graph") throw new Error("Expected graph view");
  return { final, view: final.view };
}

describe("topologicalSortSteps", () => {
  it("emits a valid deterministic order for a DAG", () => {
    const { final, view } = finalView({
      kind: "graph",
      nodes: ["A", "B", "C", "D", "E"],
      edges: [["A", "C"], ["B", "C"], ["C", "D"], ["C", "E"]],
      start: "A",
    });

    expect(final.phase).toBe("done");
    expect(view.visitOrder).toEqual(["A", "B", "C", "D", "E"]);
  });

  it("places every edge source before its destination", () => {
    const input: GraphInput = {
      kind: "graph",
      nodes: ["A", "B", "C", "D"],
      edges: [["A", "C"], ["B", "C"], ["C", "D"]],
      start: "A",
    };
    const { view } = finalView(input);
    const position = new Map(view.visitOrder.map((node, index) => [node, index]));

    expect(
      input.edges.every(([from, to]) => position.get(from)! < position.get(to)!),
    ).toBe(true);
  });

  it("detects a directed cycle by an incomplete output", () => {
    const { final, view } = finalView({
      kind: "graph",
      nodes: ["A", "B", "C"],
      edges: [["A", "B"], ["B", "C"], ["C", "A"]],
      start: "A",
    });

    expect(final.phase).toBe("cycle");
    expect(view.visitOrder).toEqual([]);
  });

  it("includes isolated vertices in the result", () => {
    const { view } = finalView({
      kind: "graph",
      nodes: ["A", "B", "X"],
      edges: [["A", "B"]],
      start: "A",
    });

    expect(view.visitOrder).toEqual(["A", "X", "B"]);
  });

  it("does not mutate input and handles an empty DAG", () => {
    const input: GraphInput = {
      kind: "graph",
      nodes: [],
      edges: [],
      start: "",
    };
    const { final, view } = finalView(input);

    expect(input).toEqual({ kind: "graph", nodes: [], edges: [], start: "" });
    expect(final.phase).toBe("done");
    expect(view.visitOrder).toEqual([]);
  });
});
