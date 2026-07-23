import { describe, expect, it } from "vitest";
import { lruCacheSteps } from "@/lib/algorithms/data-structures/lruCache";

describe("lruCacheSteps", () => {
  it("moves a cache hit to the MRU end", () => {
    const moved = lruCacheSteps(["A", "B", "C", "A"]).findLast(
      (step) => step.phase === "move-front",
    )!;

    expect(moved.view.kind).toBe("lru-cache");
    if (moved.view.kind !== "lru-cache") return;
    expect(moved.view.entries.map((entry) => entry.key)).toEqual(["A", "C", "B"]);
    expect(moved.view.hits).toBe(1);
  });

  it("evicts the least recently used key when capacity is exceeded", () => {
    const final = lruCacheSteps(["A", "B", "C", "A", "D"]).at(-1)!;

    expect(final.view.kind).toBe("lru-cache");
    if (final.view.kind !== "lru-cache") return;
    expect(final.view.entries.map((entry) => entry.key)).toEqual(["D", "A", "C"]);
    expect(final.view.evicted).toEqual(["B"]);
  });

  it("keeps Map keys and list keys consistent after each completed access", () => {
    const steps = lruCacheSteps(["A", "B", "C", "A", "D"]).filter(
      (step) => step.phase !== "evict",
    );

    for (const step of steps) {
      expect(step.view.kind).toBe("lru-cache");
      if (step.view.kind !== "lru-cache") continue;
      expect(new Set(step.view.mapKeys)).toEqual(
        new Set(step.view.entries.map((entry) => entry.key)),
      );
    }
  });

  it("tracks hits and misses independently", () => {
    const final = lruCacheSteps(["A", "B", "A", "C", "A"]).at(-1)!;

    expect(final.view.kind).toBe("lru-cache");
    if (final.view.kind !== "lru-cache") return;
    expect(final.view.hits).toBe(2);
    expect(final.view.misses).toBe(3);
  });

  it("never retains more entries than capacity after an access", () => {
    const final = lruCacheSteps(["A", "B", "C", "D", "E"]).at(-1)!;

    expect(final.view.kind).toBe("lru-cache");
    if (final.view.kind !== "lru-cache") return;
    expect(final.view.entries.length).toBeLessThanOrEqual(final.view.capacity);
  });

  it("does not mutate input and handles no requests", () => {
    const input = ["A", "B"];
    lruCacheSteps(input);
    const final = lruCacheSteps([]).at(-1)!;

    expect(input).toEqual(["A", "B"]);
    expect(final.view.kind).toBe("lru-cache");
    if (final.view.kind !== "lru-cache") return;
    expect(final.view.entries).toEqual([]);
    expect(final.view.hits).toBe(0);
    expect(final.view.misses).toBe(0);
  });
});
