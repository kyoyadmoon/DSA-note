import { describe, expect, it } from "vitest";
import { doublyLinkedListSteps } from "@/lib/algorithms/data-structures/doublyLinkedList";

describe("doublyLinkedListSteps", () => {
  it("links each node to both adjacent nodes", () => {
    const finalLink = doublyLinkedListSteps([10, 20, 30]).findLast(
      (step) => step.phase === "link",
    )!;

    expect(finalLink.view.kind).toBe("linked-list");
    if (finalLink.view.kind !== "linked-list") return;
    expect(finalLink.view.doubly).toBe(true);
    expect(finalLink.view.nodes.map((node) => node.prevId)).toEqual([
      null,
      "dll-0",
      "dll-1",
    ]);
    expect(finalLink.view.nodes.map((node) => node.nextId)).toEqual([
      "dll-1",
      "dll-2",
      null,
    ]);
  });

  it("traverses from tail to head through prev links", () => {
    const backward = doublyLinkedListSteps([4, 8, 15]).filter(
      (step) => step.phase === "inspect-backward",
    );

    expect(backward).toHaveLength(3);
    expect(backward.map((step) => step.title)).toEqual([
      "從 tail 反向走訪 15",
      "從 tail 反向走訪 8",
      "從 tail 反向走訪 4",
    ]);
  });

  it("removes a known middle node and reconnects both directions", () => {
    const final = doublyLinkedListSteps([4, 8, 15, 16]).at(-1)!;

    expect(final.view.kind).toBe("linked-list");
    if (final.view.kind !== "linked-list") return;
    expect(final.view.nodes.map((node) => node.value)).toEqual([4, 8, 16]);
    expect(final.view.nodes[1].nextId).toBe("dll-3");
    expect(final.view.nodes[2].prevId).toBe("dll-1");
  });

  it("keeps head and tail on the remaining node", () => {
    const final = doublyLinkedListSteps([7, 9]).at(-1)!;

    expect(final.view.kind).toBe("linked-list");
    if (final.view.kind !== "linked-list") return;
    expect(final.view.headId).toBe("dll-0");
    expect(final.view.tailId).toBe("dll-0");
    expect(final.view.nodes[0].prevId).toBeNull();
    expect(final.view.nodes[0].nextId).toBeNull();
  });

  it("does not mutate input and handles an empty list", () => {
    const input = [2, 3];
    doublyLinkedListSteps(input);
    const final = doublyLinkedListSteps([]).at(-1)!;

    expect(input).toEqual([2, 3]);
    expect(final.view.kind).toBe("linked-list");
    if (final.view.kind !== "linked-list") return;
    expect(final.view.nodes).toEqual([]);
    expect(final.view.headId).toBeNull();
    expect(final.view.tailId).toBeNull();
  });
});
