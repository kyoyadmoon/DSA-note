import { describe, expect, it } from "vitest";
import {
  clampProgress,
  comparisonStepIndex,
  playbackReducer,
} from "@/lib/utils/sortingComparison";

describe("comparisonStepIndex", () => {
  it.each([
    { progress: -20, stepCount: 11, expected: 0 },
    { progress: 0, stepCount: 11, expected: 0 },
    { progress: 50, stepCount: 11, expected: 5 },
    { progress: 100, stepCount: 11, expected: 10 },
    { progress: 120, stepCount: 11, expected: 10 },
    { progress: 80, stepCount: 0, expected: 0 },
    { progress: 80, stepCount: 1, expected: 0 },
  ])(
    "maps $progress% across $stepCount steps to $expected",
    ({ progress, stepCount, expected }) => {
      expect(comparisonStepIndex(progress, stepCount)).toBe(expected);
    },
  );
});

describe("clampProgress", () => {
  it("keeps progress within 0 and 100", () => {
    expect(clampProgress(-1)).toBe(0);
    expect(clampProgress(42)).toBe(42);
    expect(clampProgress(101)).toBe(100);
  });
});

describe("playbackReducer", () => {
  it("starts, pauses, and resets playback", () => {
    const started = playbackReducer(
      { progress: 25, isPlaying: false },
      { type: "play" },
    );
    expect(started).toEqual({ progress: 25, isPlaying: true });
    expect(playbackReducer(started, { type: "pause" })).toEqual({
      progress: 25,
      isPlaying: false,
    });
    expect(playbackReducer(started, { type: "reset" })).toEqual({
      progress: 0,
      isPlaying: false,
    });
  });

  it("stops exactly at 100% and replays from zero", () => {
    const finished = playbackReducer(
      { progress: 99, isPlaying: true },
      { type: "tick", amount: 5 },
    );
    expect(finished).toEqual({ progress: 100, isPlaying: false });
    expect(playbackReducer(finished, { type: "play" })).toEqual({
      progress: 0,
      isPlaying: true,
    });
  });

  it("does not advance while paused", () => {
    const state = { progress: 40, isPlaying: false };
    expect(playbackReducer(state, { type: "tick", amount: 1 })).toBe(state);
  });

  it("clamps seeks and stops when seeking to the end", () => {
    expect(
      playbackReducer(
        { progress: 30, isPlaying: true },
        { type: "seek", progress: 150 },
      ),
    ).toEqual({ progress: 100, isPlaying: false });
  });
});
