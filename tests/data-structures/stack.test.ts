import { describe, expect, it } from "vitest";
import { stackSteps } from "@/lib/algorithms/data-structures/stack";

describe("stackSteps", () => {
  it("pushes values in input order and marks the last value as top", () => {
    const finalPush = stackSteps([3, 7, 9]).findLast(
      (step) => step.phase === "push",
    )!;

    expect(finalPush.view.kind).toBe("linear-collection");
    if (finalPush.view.kind !== "linear-collection") return;
    expect(finalPush.view.mode).toBe("stack");
    expect(finalPush.view.items.map((item) => item.value)).toEqual([3, 7, 9]);
    expect(finalPush.view.topId).toBe("stack-2");
  });

  it("peek reads the top without removing it", () => {
    const peek = stackSteps([4, 5]).find((step) => step.phase === "peek")!;

    expect(peek.title).toBe("peek() = 5");
    expect(peek.view.kind).toBe("linear-collection");
    if (peek.view.kind !== "linear-collection") return;
    expect(peek.view.items.map((item) => item.value)).toEqual([4, 5]);
  });

  it("pops the most recently pushed value first", () => {
    const final = stackSteps([3, 7, 9]).at(-1)!;

    expect(final.view.kind).toBe("linear-collection");
    if (final.view.kind !== "linear-collection") return;
    expect(final.view.items.map((item) => item.value)).toEqual([3, 7]);
    expect(final.view.output).toEqual([9]);
    expect(final.view.topId).toBe("stack-1");
  });

  it("emits one push step for every input value", () => {
    const steps = stackSteps([1, 2, 3, 4]);

    expect(steps.filter((step) => step.phase === "push")).toHaveLength(4);
  });

  it("does not mutate input and handles underflow safely", () => {
    const input = [6, 2];
    stackSteps(input);
    const final = stackSteps([]).at(-1)!;

    expect(input).toEqual([6, 2]);
    expect(final.view.kind).toBe("linear-collection");
    if (final.view.kind !== "linear-collection") return;
    expect(final.view.items).toEqual([]);
    expect(final.view.output).toEqual([]);
    expect(final.view.topId).toBeUndefined();
  });
});
