import { describe, expect, it } from "vitest";
import { dfsSteps } from "@/lib/algorithms/graph/dfs";
import type { GraphInput } from "@/lib/types/dataStructure";

function finalOrder(input: GraphInput): string[] {
  const view = dfsSteps(input).at(-1)!.view;
  expect(view.kind).toBe("graph");
  if (view.kind !== "graph") throw new Error("Expected graph view");
  return view.visitOrder;
}

describe("dfsSteps", () => {
  it("follows one path deeply before earlier alternatives", () => {
    expect(
      finalOrder({
        kind: "graph",
        nodes: ["A", "B", "C", "D", "E"],
        edges: [["A", "B"], ["A", "C"], ["B", "D"], ["C", "D"], ["D", "E"]],
        start: "A",
      }),
    ).toEqual(["A", "B", "D", "E", "C"]);
  });

  it("pushes neighbors in reverse to preserve adjacency order", () => {
    const steps = dfsSteps({
      kind: "graph",
      nodes: ["A", "B", "C"],
      edges: [["A", "B"], ["A", "C"]],
      start: "A",
    });

    expect(
      steps.filter((step) => step.phase === "push").map((step) => step.title),
    ).toEqual(["push(C)", "push(B)"]);
    expect(steps.at(-1)!.view.kind).toBe("graph");
    expect(finalOrder({
      kind: "graph",
      nodes: ["A", "B", "C"],
      edges: [["A", "B"], ["A", "C"]],
      start: "A",
    })).toEqual(["A", "B", "C"]);
  });

  it("terminates on a directed cycle without duplicate visits", () => {
    expect(
      finalOrder({
        kind: "graph",
        nodes: ["A", "B", "C"],
        edges: [["A", "B"], ["B", "C"], ["C", "A"]],
        start: "A",
        directed: true,
      }),
    ).toEqual(["A", "B", "C"]);
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
    dfsSteps(input);
    expect(input).toEqual({
      kind: "graph",
      nodes: ["A", "B"],
      edges: [["A", "B"]],
      start: "A",
    });
  });
});
