import { describe, expect, it } from "vitest";
import {
  quickSort,
  quickSortMeta,
  quickSortSource,
  quickSortSteps,
} from "@/lib/algorithms/sorting/quickSort";

describe("quickSort", () => {
  it.each([
    { name: "empty", input: [] },
    { name: "single", input: [42] },
    { name: "sorted", input: [1, 2, 3, 4, 5] },
    { name: "reversed", input: [5, 4, 3, 2, 1] },
    { name: "duplicates", input: [3, 1, 3, 2, 1] },
    { name: "negative values", input: [-2, 4, 0, -5, 4] },
  ])("sorts $name input without mutating it", ({ input }) => {
    const original = [...input];

    expect(quickSort(input)).toEqual([...input].sort((a, b) => a - b));
    expect(input).toEqual(original);
  });

  it("matches Array.prototype.sort on 200 random inputs", () => {
    for (let trial = 0; trial < 200; trial++) {
      const length = Math.floor(Math.random() * 30);
      const input = Array.from(
        { length },
        () => Math.floor(Math.random() * 201) - 100,
      );
      expect(quickSort(input)).toEqual([...input].sort((a, b) => a - b));
    }
  });
});

describe("quickSortSteps", () => {
  it("starts idle and ends with the pure function result", () => {
    const input = [5, 2, 8, 1, 9, 3];
    const steps = quickSortSteps(input);

    expect(steps[0].phase).toBe("idle");
    expect(steps.at(-1)?.phase).toBe("done");
    expect(steps.at(-1)?.array.map((item) => item.value)).toEqual(
      quickSort(input),
    );
  });

  it("preserves the value multiset and item ids in every step", () => {
    const input = [5, 2, 8, 1, 9, 3];
    const expectedValues = [...input].sort((a, b) => a - b);
    const expectedIds = new Set(input.map((_, index) => `qs-${index}`));

    for (const step of quickSortSteps(input)) {
      expect(step.array.map((item) => item.value).sort((a, b) => a - b)).toEqual(
        expectedValues,
      );
      expect(new Set(step.array.map((item) => item.id))).toEqual(expectedIds);
    }
  });

  it("finishes every partition with smaller values on the left", () => {
    const partitionSteps = quickSortSteps([5, 2, 8, 1, 9, 3]).filter(
      (step) => step.title.startsWith("分割完成"),
    );

    expect(partitionSteps.length).toBeGreaterThan(0);
    for (const step of partitionSteps) {
      expect(step.active).toBeDefined();
      expect(step.pivot).toBeDefined();
      if (!step.active || step.pivot === undefined) continue;
      const [lo, end] = step.active;
      const pivotValue = step.array[step.pivot].value;
      expect(
        step.array.slice(lo, step.pivot).every((item) => item.value < pivotValue),
      ).toBe(true);
      expect(
        step.array.slice(step.pivot + 1, end).every((item) => item.value >= pivotValue),
      ).toBe(true);
    }
  });

  it("never emits a self-swap", () => {
    for (const step of quickSortSteps([1, 4, 2, 5, 3])) {
      if (!step.swapping) continue;
      expect(step.swapping[0]).not.toBe(step.swapping[1]);
    }
  });

  it("uses n(n - 1) / 2 comparisons on sorted input with a last-element pivot", () => {
    const input = [1, 2, 3, 4, 5, 6];
    const comparisons = quickSortSteps(input).filter(
      (step) => step.phase === "compare",
    );

    expect(comparisons).toHaveLength((input.length * (input.length - 1)) / 2);
  });

  it("demonstrates that the partition is not stable", () => {
    const final = quickSortSteps([2, 2, 2]).at(-1)!;
    const equalValueIds = final.array
      .filter((item) => item.value === 2)
      .map((item) => item.id);

    expect(equalValueIds).toEqual(["qs-2", "qs-0", "qs-1"]);
    expect(quickSortMeta.stable).toBe(false);
  });

  it("keeps all referenced indices and code lines in range", () => {
    const input = [4, 1, 3, 2];
    const lineCount = quickSortSource.split("\n").length;

    for (const step of quickSortSteps(input)) {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(lineCount);
      for (const index of [
        ...(step.comparing ?? []),
        ...(step.swapping ?? []),
        ...(step.sorted ?? []),
        ...(step.pivot === undefined ? [] : [step.pivot]),
      ]) {
        expect(index).toBeGreaterThanOrEqual(0);
        expect(index).toBeLessThan(input.length);
      }
    }
  });
});
