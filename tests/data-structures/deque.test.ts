import { describe, expect, it } from "vitest";
import { dequeSteps } from "@/lib/algorithms/data-structures/deque";

describe("dequeSteps", () => {
  it("supports insertion at both ends", () => {
    const pushes = dequeSteps([4, 8, 15]).filter((step) =>
      step.phase.startsWith("push-"),
    );
    const finalPush = pushes.at(-1)!;

    expect(pushes.map((step) => step.phase)).toEqual([
      "push-back",
      "push-front",
      "push-back",
    ]);
    expect(finalPush.view.kind).toBe("linear-collection");
    if (finalPush.view.kind !== "linear-collection") return;
    expect(finalPush.view.items.map((item) => item.value)).toEqual([8, 4, 15]);
  });

  it("marks the first and last items as front and back", () => {
    const finalPush = dequeSteps([4, 8, 15]).findLast((step) =>
      step.phase.startsWith("push-"),
    )!;

    expect(finalPush.view.kind).toBe("linear-collection");
    if (finalPush.view.kind !== "linear-collection") return;
    expect(finalPush.view.mode).toBe("deque");
    expect(finalPush.view.frontId).toBe("deque-1");
    expect(finalPush.view.backId).toBe("deque-2");
  });

  it("removes and returns values from both ends", () => {
    const final = dequeSteps([4, 8, 15, 16]).at(-1)!;

    expect(final.view.kind).toBe("linear-collection");
    if (final.view.kind !== "linear-collection") return;
    expect(final.view.output).toEqual([8, 16]);
    expect(final.view.items.map((item) => item.value)).toEqual([4, 15]);
  });

  it("does not pop the same sole item twice", () => {
    const steps = dequeSteps([42]);
    const final = steps.at(-1)!;

    expect(steps.filter((step) => step.phase.startsWith("pop-"))).toHaveLength(1);
    expect(final.view.kind).toBe("linear-collection");
    if (final.view.kind !== "linear-collection") return;
    expect(final.view.output).toEqual([42]);
    expect(final.view.items).toEqual([]);
  });

  it("does not mutate input and handles an empty deque", () => {
    const input = [6, 10];
    dequeSteps(input);
    const final = dequeSteps([]).at(-1)!;

    expect(input).toEqual([6, 10]);
    expect(final.view.kind).toBe("linear-collection");
    if (final.view.kind !== "linear-collection") return;
    expect(final.view.frontId).toBeUndefined();
    expect(final.view.backId).toBeUndefined();
  });
});
