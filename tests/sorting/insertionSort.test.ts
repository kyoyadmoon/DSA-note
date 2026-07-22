import { describe, expect, it } from "vitest";
import {
  insertionSort,
  insertionSortMeta,
  insertionSortSource,
  insertionSortSteps,
} from "@/lib/algorithms/sorting/insertionSort";

describe("insertionSort", () => {
  it.each([
    { name: "empty", input: [] },
    { name: "single", input: [42] },
    { name: "sorted", input: [1, 2, 3, 4, 5] },
    { name: "reversed", input: [5, 4, 3, 2, 1] },
    { name: "duplicates", input: [3, 1, 3, 2, 1] },
    { name: "negative values", input: [-2, 4, 0, -5, 4] },
  ])("sorts $name input without mutating it", ({ input }) => {
    const original = [...input];

    expect(insertionSort(input)).toEqual([...input].sort((a, b) => a - b));
    expect(input).toEqual(original);
  });

  it("matches Array.prototype.sort on 200 random inputs", () => {
    for (let trial = 0; trial < 200; trial++) {
      const length = Math.floor(Math.random() * 30);
      const input = Array.from(
        { length },
        () => Math.floor(Math.random() * 201) - 100,
      );
      expect(insertionSort(input)).toEqual([...input].sort((a, b) => a - b));
    }
  });
});

describe("insertionSortSteps", () => {
  it("starts idle and ends with the pure function result", () => {
    const input = [5, 2, 8, 1, 9, 3];
    const steps = insertionSortSteps(input);

    expect(steps[0].phase).toBe("idle");
    expect(steps.at(-1)?.phase).toBe("done");
    expect(steps.at(-1)?.array.map((item) => item.value)).toEqual(
      insertionSort(input),
    );
  });

  it("preserves the value multiset and item ids in every step", () => {
    const input = [5, 2, 8, 1, 9, 3];
    const expectedValues = [...input].sort((a, b) => a - b);
    const expectedIds = new Set(input.map((_, index) => `is-${index}`));

    for (const step of insertionSortSteps(input)) {
      expect(step.array.map((item) => item.value).sort((a, b) => a - b)).toEqual(
        expectedValues,
      );
      expect(new Set(step.array.map((item) => item.id))).toEqual(expectedIds);
    }
  });

  it("marks a sorted prefix after every completed insertion", () => {
    const insertionSteps = insertionSortSteps([4, 1, 3, 2]).filter(
      (step) => step.phase === "insert",
    );

    expect(insertionSteps).toHaveLength(3);
    for (const step of insertionSteps) {
      const prefix = step.sorted?.map((index) => step.array[index].value) ?? [];
      expect(prefix).toEqual([...prefix].sort((a, b) => a - b));
      expect(step.sorted).toEqual(
        Array.from({ length: prefix.length }, (_, index) => index),
      );
    }
  });

  it("uses only adjacent swaps", () => {
    const swapSteps = insertionSortSteps([4, 1, 3, 2]).filter(
      (step) => step.phase === "swap",
    );

    expect(swapSteps.length).toBeGreaterThan(0);
    for (const step of swapSteps) {
      expect(step.swapping).toBeDefined();
      if (!step.swapping) continue;
      expect(step.swapping[1] - step.swapping[0]).toBe(1);
    }
  });

  it("does not swap an already sorted input", () => {
    expect(
      insertionSortSteps([1, 2, 3, 4]).filter((step) => step.phase === "swap"),
    ).toHaveLength(0);
  });

  it("preserves the original order of equal values", () => {
    const final = insertionSortSteps([2, 2, 1, 2]).at(-1)!;
    const equalValueIds = final.array
      .filter((item) => item.value === 2)
      .map((item) => item.id);

    expect(equalValueIds).toEqual(["is-0", "is-1", "is-3"]);
    expect(insertionSortMeta.stable).toBe(true);
  });

  it("keeps every code line within the displayed source", () => {
    const lineCount = insertionSortSource.split("\n").length;
    for (const step of insertionSortSteps([4, 1, 3, 2])) {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(lineCount);
    }
  });
});
