import { describe, expect, it } from "vitest";
import {
  selectionSort,
  selectionSortMeta,
  selectionSortSource,
  selectionSortSteps,
} from "@/lib/algorithms/sorting/selectionSort";

describe("selectionSort", () => {
  it.each([
    { name: "empty", input: [] },
    { name: "single", input: [42] },
    { name: "sorted", input: [1, 2, 3, 4, 5] },
    { name: "reversed", input: [5, 4, 3, 2, 1] },
    { name: "duplicates", input: [3, 1, 3, 2, 1] },
  ])("sorts $name input", ({ input }) => {
    expect(selectionSort(input)).toEqual([...input].sort((a, b) => a - b));
  });

  it("matches Array.prototype.sort on 200 random inputs", () => {
    for (let trial = 0; trial < 200; trial++) {
      const length = Math.floor(Math.random() * 30);
      const input = Array.from(
        { length },
        () => Math.floor(Math.random() * 201) - 100,
      );
      expect(selectionSort(input)).toEqual([...input].sort((a, b) => a - b));
    }
  });
});

describe("selectionSortSteps", () => {
  it("starts idle and ends with the pure function result", () => {
    const input = [5, 2, 8, 1, 9, 3];
    const steps = selectionSortSteps(input);

    expect(steps[0].phase).toBe("idle");
    expect(steps[steps.length - 1].phase).toBe("done");
    expect(steps[steps.length - 1].array.map((item) => item.value)).toEqual(
      selectionSort(input),
    );
  });

  it("preserves the value multiset and stable item ids in every step", () => {
    const input = [5, 2, 8, 1, 9, 3];
    const expectedValues = [...input].sort((a, b) => a - b);
    const expectedIds = new Set(input.map((_, index) => `ss-${index}`));

    for (const step of selectionSortSteps(input)) {
      expect(step.array.map((item) => item.value).sort((a, b) => a - b)).toEqual(
        expectedValues,
      );
      expect(new Set(step.array.map((item) => item.id))).toEqual(expectedIds);
    }
  });

  it("marks only a sorted prefix", () => {
    for (const step of selectionSortSteps([4, 1, 3, 2])) {
      if (!step.sorted) continue;
      expect(step.sorted).toEqual(
        Array.from({ length: step.sorted.length }, (_, index) => index),
      );
    }
  });

  it("does not emit a self-swap when the minimum is already at i", () => {
    const swapSteps = selectionSortSteps([1, 3, 2]).filter(
      (step) => step.phase === "swap",
    );

    expect(swapSteps).toHaveLength(1);
    expect(swapSteps[0].swapping).toEqual([1, 2]);
  });

  it("demonstrates why selection sort is unstable", () => {
    const final = selectionSortSteps([2, 2, 1]).at(-1)!;
    const equalValueIds = final.array
      .filter((item) => item.value === 2)
      .map((item) => item.id);

    expect(equalValueIds).toEqual(["ss-1", "ss-0"]);
    expect(selectionSortMeta.stable).toBe(false);
  });

  it("keeps every code line within the displayed source", () => {
    const lineCount = selectionSortSource.split("\n").length;
    for (const step of selectionSortSteps([4, 1, 3, 2])) {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(lineCount);
    }
  });
});
