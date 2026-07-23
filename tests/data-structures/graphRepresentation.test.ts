import { describe, expect, it } from "vitest";
import { graphRepresentationSteps } from "@/lib/algorithms/data-structures/graphRepresentation";
import type { GraphInput } from "@/lib/types/dataStructure";

function finalView(input: GraphInput) {
  const view = graphRepresentationSteps(input).at(-1)!.view;
  expect(view.kind).toBe("graph");
  if (view.kind !== "graph") throw new Error("Expected graph view");
  return view;
}

describe("graphRepresentationSteps", () => {
  it("stores undirected edges in both adjacency lists", () => {
    const view = finalView({
      kind: "graph",
      nodes: ["A", "B", "C"],
      edges: [["A", "B"], ["A", "C"]],
      start: "A",
    });

    expect(view.adjacency).toEqual([
      { node: "A", neighbors: ["B", "C"] },
      { node: "B", neighbors: ["A"] },
      { node: "C", neighbors: ["A"] },
    ]);
  });

  it("stores directed edges in one direction", () => {
    const view = finalView({
      kind: "graph",
      nodes: ["A", "B"],
      edges: [["A", "B"]],
      start: "A",
      directed: true,
    });

    expect(view.adjacency).toEqual([
      { node: "A", neighbors: ["B"] },
      { node: "B", neighbors: [] },
    ]);
    expect(view.edges[0].directed).toBe(true);
  });

  it("deduplicates vertices and logical edges", () => {
    const view = finalView({
      kind: "graph",
      nodes: ["A", "B", "A"],
      edges: [["A", "B"], ["B", "A"]],
      start: "A",
    });

    expect(view.nodes).toHaveLength(2);
    expect(view.edges).toHaveLength(1);
  });

  it("ignores edges whose endpoints are not declared", () => {
    const view = finalView({
      kind: "graph",
      nodes: ["A"],
      edges: [["A", "missing"]],
      start: "A",
    });

    expect(view.edges).toEqual([]);
    expect(view.adjacency[0].neighbors).toEqual([]);
  });

  it("does not mutate the caller input", () => {
    const input: GraphInput = {
      kind: "graph",
      nodes: ["A", "B"],
      edges: [["A", "B"]],
      start: "A",
    };
    graphRepresentationSteps(input);

    expect(input).toEqual({
      kind: "graph",
      nodes: ["A", "B"],
      edges: [["A", "B"]],
      start: "A",
    });
  });
});
