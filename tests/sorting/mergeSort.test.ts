import { describe, expect, it } from "vitest";
import {
  mergeSort,
  mergeSortMeta,
  mergeSortSource,
  mergeSortSteps,
} from "@/lib/algorithms/sorting/mergeSort";

describe("mergeSort", () => {
  it.each([
    { name: "empty", input: [] },
    { name: "single", input: [42] },
    { name: "sorted", input: [1, 2, 3, 4, 5] },
    { name: "reversed", input: [5, 4, 3, 2, 1] },
    { name: "duplicates", input: [3, 1, 3, 2, 1] },
    { name: "negative values", input: [-2, 4, 0, -5, 4] },
  ])("sorts $name input without mutating it", ({ input }) => {
    const original = [...input];

    expect(mergeSort(input)).toEqual([...input].sort((a, b) => a - b));
    expect(input).toEqual(original);
  });

  it("matches Array.prototype.sort on 200 random inputs", () => {
    for (let trial = 0; trial < 200; trial++) {
      const length = Math.floor(Math.random() * 30);
      const input = Array.from(
        { length },
        () => Math.floor(Math.random() * 201) - 100,
      );
      expect(mergeSort(input)).toEqual([...input].sort((a, b) => a - b));
    }
  });
});

describe("mergeSortSteps", () => {
  it("starts idle and ends with the pure function result", () => {
    const input = [5, 2, 8, 1, 9, 3];
    const steps = mergeSortSteps(input);

    expect(steps[0].phase).toBe("idle");
    expect(steps.at(-1)?.phase).toBe("done");
    expect(steps.at(-1)?.array.map((item) => item.value)).toEqual(
      mergeSort(input),
    );
  });

  it("preserves the value multiset and item ids in every step", () => {
    const input = [5, 2, 8, 1, 9, 3];
    const expectedValues = [...input].sort((a, b) => a - b);
    const expectedIds = new Set(input.map((_, index) => `ms-${index}`));

    for (const step of mergeSortSteps(input)) {
      expect(step.array.map((item) => item.value).sort((a, b) => a - b)).toEqual(
        expectedValues,
      );
      expect(new Set(step.array.map((item) => item.id))).toEqual(expectedIds);
    }
  });

  it("leaves every completed merge range sorted", () => {
    const mergeSteps = mergeSortSteps([5, 2, 8, 1, 9, 3]).filter(
      (step) => step.title.startsWith("合併完成"),
    );

    expect(mergeSteps.length).toBeGreaterThan(0);
    for (const step of mergeSteps) {
      expect(step.active).toBeDefined();
      if (!step.active) continue;
      const [lo, hi] = step.active;
      const values = step.array.slice(lo, hi).map((item) => item.value);
      expect(values).toEqual([...values].sort((a, b) => a - b));
    }
  });

  it("preserves the original order of equal values", () => {
    const final = mergeSortSteps([2, 1, 2, 3, 2]).at(-1)!;
    const equalValueIds = final.array
      .filter((item) => item.value === 2)
      .map((item) => item.id);

    expect(equalValueIds).toEqual(["ms-0", "ms-2", "ms-4"]);
    expect(mergeSortMeta.stable).toBe(true);
  });

  it("does not model merging as swaps", () => {
    expect(mergeSortSteps([4, 1, 3, 2]).some((step) => step.swapping)).toBe(
      false,
    );
  });

  it("keeps all active ranges, referenced indices, and code lines valid", () => {
    const input = [4, 1, 3, 2];
    const lineCount = mergeSortSource.split("\n").length;

    for (const step of mergeSortSteps(input)) {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(lineCount);
      if (step.active) {
        expect(step.active[0]).toBeGreaterThanOrEqual(0);
        expect(step.active[0]).toBeLessThan(step.active[1]);
        expect(step.active[1]).toBeLessThanOrEqual(input.length);
      }
      for (const index of [
        ...(step.comparing ?? []),
        ...(step.sorted ?? []),
      ]) {
        expect(index).toBeGreaterThanOrEqual(0);
        expect(index).toBeLessThan(input.length);
      }
    }
  });
});
