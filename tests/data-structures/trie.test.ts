import { describe, expect, it } from "vitest";
import { trieSteps } from "@/lib/algorithms/data-structures/trie";

describe("trieSteps", () => {
  it("shares nodes for common prefixes", () => {
    const final = trieSteps(["car", "cat"]).at(-1)!;

    expect(final.view.kind).toBe("trie");
    if (final.view.kind !== "trie") return;
    expect(final.view.nodes.map((node) => node.path)).toEqual([
      "",
      "c",
      "ca",
      "car",
      "cat",
    ]);
  });

  it("marks complete words separately from prefixes", () => {
    const final = trieSteps(["car"]).at(-1)!;

    expect(final.view.kind).toBe("trie");
    if (final.view.kind !== "trie") return;
    expect(final.view.nodes.find((node) => node.path === "ca")?.terminal).toBe(false);
    expect(final.view.nodes.find((node) => node.path === "car")?.terminal).toBe(true);
  });

  it("visits one edge for every query character", () => {
    const searchSteps = trieSteps(["dog", "cat"]).filter(
      (step) => step.phase === "search",
    );

    expect(searchSteps).toHaveLength(3);
    expect(searchSteps.at(-1)?.detail).toContain('"cat"');
  });

  it("does not count duplicate words twice", () => {
    const final = trieSteps(["go", "go"]).at(-1)!;

    expect(final.view.kind).toBe("trie");
    if (final.view.kind !== "trie") return;
    expect(final.view.wordCount).toBe(1);
  });

  it("connects every non-root node to its parent", () => {
    const final = trieSteps(["to", "tea"]).at(-1)!;

    expect(final.view.kind).toBe("trie");
    if (final.view.kind !== "trie") return;
    const ids = new Set(final.view.nodes.map((node) => node.id));
    expect(
      final.view.nodes
        .filter((node) => node.parentId !== null)
        .every((node) => ids.has(node.parentId!)),
    ).toBe(true);
  });

  it("does not mutate input and handles an empty trie", () => {
    const input = ["a", "an"];
    trieSteps(input);
    const final = trieSteps([]).at(-1)!;

    expect(input).toEqual(["a", "an"]);
    expect(final.view.kind).toBe("trie");
    if (final.view.kind !== "trie") return;
    expect(final.view.wordCount).toBe(0);
    expect(final.view.nodes).toHaveLength(1);
  });
});
