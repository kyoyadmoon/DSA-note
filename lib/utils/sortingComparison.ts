export type PlaybackState = {
  progress: number;
  isPlaying: boolean;
};

export type PlaybackAction =
  | { type: "play" }
  | { type: "pause" }
  | { type: "reset" }
  | { type: "seek"; progress: number }
  | { type: "tick"; amount: number };

export function clampProgress(progress: number): number {
  return Math.min(100, Math.max(0, progress));
}

export function comparisonStepIndex(
  progress: number,
  stepCount: number,
): number {
  if (stepCount <= 1) return 0;
  return Math.round((clampProgress(progress) / 100) * (stepCount - 1));
}

export function playbackReducer(
  state: PlaybackState,
  action: PlaybackAction,
): PlaybackState {
  switch (action.type) {
    case "play":
      return state.progress >= 100
        ? { progress: 0, isPlaying: true }
        : { ...state, isPlaying: true };
    case "pause":
      return { ...state, isPlaying: false };
    case "reset":
      return { progress: 0, isPlaying: false };
    case "seek": {
      const progress = clampProgress(action.progress);
      return { progress, isPlaying: progress < 100 && state.isPlaying };
    }
    case "tick": {
      if (!state.isPlaying) return state;
      const progress = clampProgress(state.progress + action.amount);
      return { progress, isPlaying: progress < 100 };
    }
  }
}
