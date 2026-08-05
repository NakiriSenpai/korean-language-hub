/**
 * Engine 4 — Audio Engine.
 *
 * Play counter, auto replay, navigation lock while playing, progress, and a
 * finish state. Uses a plain HTMLAudioElement so it works offline once the
 * asset is cached by the PWA layer.
 */

import { useCallback, useEffect, useRef, useState } from "react";

export interface AudioEngineOptions {
  /** Maximum number of plays. 0 means unlimited. */
  readonly maxPlays?: number;
  /** Replays automatically until the play quota is used up. */
  readonly autoReplay?: boolean;
  /** Locks exam navigation while the audio is playing. */
  readonly lockWhilePlaying?: boolean;
  readonly initialPlays?: number;
  readonly onPlayCountChange?: (plays: number) => void;
}

export interface AudioEngineState {
  readonly status: "idle" | "loading" | "playing" | "paused" | "finished" | "error";
  readonly plays: number;
  readonly remainingPlays: number | null;
  readonly progress: number;
  readonly duration: number;
  readonly currentTime: number;
  readonly canPlay: boolean;
  readonly locked: boolean;
  readonly play: () => void;
  readonly pause: () => void;
  readonly audioRef: React.RefObject<HTMLAudioElement | null>;
}

export function useAudioEngine(
  src: string | null,
  options: AudioEngineOptions = {},
): AudioEngineState {
  const {
    maxPlays = 0,
    autoReplay = false,
    lockWhilePlaying = false,
    initialPlays = 0,
    onPlayCountChange,
  } = options;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [status, setStatus] = useState<AudioEngineState["status"]>("idle");
  const [plays, setPlays] = useState(initialPlays);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const remainingPlays = maxPlays > 0 ? Math.max(0, maxPlays - plays) : null;
  const quotaLeft = remainingPlays === null || remainingPlays > 0;

  // Reset when the question (and therefore the source) changes.
  useEffect(() => {
    setStatus(src ? "loading" : "idle");
    setPlays(initialPlays);
    setDuration(0);
    setCurrentTime(0);
  }, [src, initialPlays]);

  const play = useCallback(() => {
    const element = audioRef.current;
    if (!element || !quotaLeft) return;
    void element.play().catch(() => setStatus("error"));
  }, [quotaLeft]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  useEffect(() => {
    const element = audioRef.current;
    if (!element) return;

    const onLoaded = () => {
      setDuration(Number.isFinite(element.duration) ? element.duration : 0);
      setStatus((current) => (current === "loading" ? "idle" : current));
    };
    const onPlay = () => {
      setStatus("playing");
      setPlays((current) => {
        const next = current + 1;
        onPlayCountChange?.(next);
        return next;
      });
    };
    const onPause = () => setStatus((current) => (current === "playing" ? "paused" : current));
    const onTime = () => setCurrentTime(element.currentTime);
    const onEnded = () => {
      setStatus("finished");
      setCurrentTime(element.duration || 0);
      if (autoReplay) {
        const used = maxPlays > 0;
        const allowed = !used || plays + 1 < maxPlays;
        if (allowed) {
          element.currentTime = 0;
          void element.play().catch(() => setStatus("error"));
        }
      }
    };
    const onError = () => setStatus("error");

    element.addEventListener("loadedmetadata", onLoaded);
    element.addEventListener("play", onPlay);
    element.addEventListener("pause", onPause);
    element.addEventListener("timeupdate", onTime);
    element.addEventListener("ended", onEnded);
    element.addEventListener("error", onError);
    return () => {
      element.removeEventListener("loadedmetadata", onLoaded);
      element.removeEventListener("play", onPlay);
      element.removeEventListener("pause", onPause);
      element.removeEventListener("timeupdate", onTime);
      element.removeEventListener("ended", onEnded);
      element.removeEventListener("error", onError);
    };
  }, [autoReplay, maxPlays, onPlayCountChange, plays, src]);

  return {
    status,
    plays,
    remainingPlays,
    duration,
    currentTime,
    progress: duration > 0 ? Math.min(100, Math.round((currentTime / duration) * 100)) : 0,
    canPlay: Boolean(src) && quotaLeft && status !== "playing",
    locked: lockWhilePlaying && status === "playing",
    play,
    pause,
    audioRef,
  };
}
