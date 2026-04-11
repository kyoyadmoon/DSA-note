import { describe, expect, it } from "vitest";
import {
  bubbleSort,
  bubbleSortSteps,
} from "@/lib/algorithms/sorting/bubbleSort";

describe("bubbleSort", () => {
  it("sorts an empty array", () => {
    expect(bubbleSort([])).toEqual([]);
  });

  it("sorts a single element", () => {
    expect(bubbleSort([42])).toEqual([42]);
  });

  it("sorts an already-sorted array", () => {
    expect(bubbleSort([1, 2, 3, 4, 5])).toEqual([1, 2, 3, 4, 5]);
  });

  it("sorts a reversed array", () => {
    expect(bubbleSort([5, 4, 3, 2, 1])).toEqual([1, 2, 3, 4, 5]);
  });

  it("handles duplicates", () => {
    expect(bubbleSort([3, 1, 3, 2, 1])).toEqual([1, 1, 2, 3, 3]);
  });

  it("matches Array.prototype.sort on 200 random inputs", () => {
    for (let i = 0; i < 200; i++) {
      const len = Math.floor(Math.random() * 30);
      const arr = Array.from({ length: len }, () =>
        Math.floor(Math.random() * 200) - 100,
      );
      const expected = [...arr].sort((a, b) => a - b);
      expect(bubbleSort(arr)).toEqual(expected);
    }
  });
});

describe("bubbleSortSteps", () => {
  it("final step's array matches bubbleSort's result", () => {
    const input = [5, 2, 8, 1, 9, 3, 7];
    const steps = bubbleSortSteps(input);
    const finalArray = steps[steps.length - 1].array.map((i) => i.value);
    expect(finalArray).toEqual(bubbleSort(input));
  });

  it("ends with phase 'done'", () => {
    const steps = bubbleSortSteps([3, 1, 2]);
    expect(steps[steps.length - 1].phase).toBe("done");
  });

  it("starts with phase 'idle'", () => {
    const steps = bubbleSortSteps([3, 1, 2]);
    expect(steps[0].phase).toBe("idle");
  });

  it("every step preserves the multiset of values", () => {
    const input = [5, 2, 8, 1, 9, 3, 7];
    const sortedInput = [...input].sort((a, b) => a - b);
    const steps = bubbleSortSteps(input);
    for (const step of steps) {
      const values = step.array.map((i) => i.value).sort((a, b) => a - b);
      expect(values).toEqual(sortedInput);
    }
  });

  it("every item keeps a stable id across steps", () => {
    const steps = bubbleSortSteps([5, 2, 8, 1]);
    const idSets = steps.map(
      (s) => new Set(s.array.map((item) => item.id)),
    );
    for (let i = 1; i < idSets.length; i++) {
      expect(idSets[i]).toEqual(idSets[0]);
    }
  });

  it("early-exits when input is already sorted", () => {
    const steps = bubbleSortSteps([1, 2, 3, 4, 5]);
    expect(steps[steps.length - 1].phase).toBe("done");
    expect(steps[steps.length - 1].title).toContain("提早結束");
  });
});
