import { describe, expect, it } from "vitest";
import { bfsSteps } from "@/lib/algorithms/graph/bfs";
import type { GraphInput } from "@/lib/types/dataStructure";

function finalOrder(input: GraphInput): string[] {
  const view = bfsSteps(input).at(-1)!.view;
  expect(view.kind).toBe("graph");
  if (view.kind !== "graph") throw new Error("Expected graph view");
  return view.visitOrder;
}

describe("bfsSteps", () => {
  it("visits an undirected graph level by level", () => {
    expect(
      finalOrder({
        kind: "graph",
        nodes: ["A", "B", "C", "D", "E"],
        edges: [["A", "B"], ["A", "C"], ["B", "D"], ["C", "D"], ["D", "E"]],
        start: "A",
      }),
    ).toEqual(["A", "B", "C", "D", "E"]);
  });

  it("marks nodes discovered before enqueueing duplicates", () => {
    const steps = bfsSteps({
      kind: "graph",
      nodes: ["A", "B", "C", "D"],
      edges: [["A", "B"], ["A", "C"], ["B", "D"], ["C", "D"]],
      start: "A",
    });

    expect(
      steps.filter((step) => step.phase === "enqueue" && step.title === "enqueue(D)"),
    ).toHaveLength(1);
  });

  it("does not traverse a directed edge backward", () => {
    expect(
      finalOrder({
        kind: "graph",
        nodes: ["A", "B"],
        edges: [["A", "B"]],
        start: "B",
        directed: true,
      }),
    ).toEqual(["B"]);
  });

  it("leaves disconnected components unvisited", () => {
    expect(
      finalOrder({
        kind: "graph",
        nodes: ["A", "B", "X"],
        edges: [["A", "B"]],
        start: "A",
      }),
    ).toEqual(["A", "B"]);
  });

  it("returns an empty traversal for an invalid start", () => {
    expect(
      finalOrder({
        kind: "graph",
        nodes: ["A"],
        edges: [],
        start: "missing",
      }),
    ).toEqual([]);
  });

  it("does not mutate the caller input", () => {
    const input: GraphInput = {
      kind: "graph",
      nodes: ["A", "B"],
      edges: [["A", "B"]],
      start: "A",
    };
    bfsSteps(input);
    expect(input).toEqual({
      kind: "graph",
      nodes: ["A", "B"],
      edges: [["A", "B"]],
      start: "A",
    });
  });
});
