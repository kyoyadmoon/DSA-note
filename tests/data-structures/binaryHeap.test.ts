import { describe, expect, it } from "vitest";
import {
  binaryHeapSteps,
  isMinHeap,
} from "@/lib/algorithms/data-structures/binaryHeap";

describe("binaryHeapSteps", () => {
  it("restores min-heap order after every completed insertion", () => {
    const insertionStates = binaryHeapSteps([9, 4, 7, 1, 6]).filter(
      (step, index, steps) => {
        const next = steps[index + 1];
        return (
          step.phase === "append" || step.phase === "bubble-up"
        ) && next?.phase !== "compare-parent" && next?.phase !== "bubble-up";
      },
    );

    for (const step of insertionStates) {
      expect(step.view.kind).toBe("binary-heap");
      if (step.view.kind !== "binary-heap") continue;
      expect(isMinHeap(step.view.nodes.map((node) => node.value))).toBe(true);
    }
  });

  it("places the minimum value at the root", () => {
    const peek = binaryHeapSteps([9, 4, 7, 1, 6]).find(
      (step) => step.phase === "peek",
    )!;

    expect(peek.view.kind).toBe("binary-heap");
    if (peek.view.kind !== "binary-heap") return;
    expect(peek.view.nodes[0].value).toBe(1);
    expect(peek.title).toBe("peek() = 1");
  });

  it("extracts the minimum and repairs heap order", () => {
    const final = binaryHeapSteps([9, 4, 7, 1, 6]).at(-1)!;

    expect(final.view.kind).toBe("binary-heap");
    if (final.view.kind !== "binary-heap") return;
    expect(final.view.output).toEqual([1]);
    expect(final.view.nodes).toHaveLength(4);
    expect(isMinHeap(final.view.nodes.map((node) => node.value))).toBe(true);
  });

  it("keeps the complete-tree array index layout", () => {
    const peek = binaryHeapSteps([5, 2, 8, 1]).find(
      (step) => step.phase === "peek",
    )!;

    expect(peek.view.kind).toBe("binary-heap");
    if (peek.view.kind !== "binary-heap") return;
    expect(peek.view.nodes.map((node) => node.index)).toEqual([0, 1, 2, 3]);
  });

  it("does not mutate input and handles an empty heap", () => {
    const input = [3, 1, 2];
    binaryHeapSteps(input);
    const final = binaryHeapSteps([]).at(-1)!;

    expect(input).toEqual([3, 1, 2]);
    expect(final.view.kind).toBe("binary-heap");
    if (final.view.kind !== "binary-heap") return;
    expect(final.view.nodes).toEqual([]);
    expect(final.view.output).toEqual([]);
  });
});
