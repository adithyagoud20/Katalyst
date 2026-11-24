"use client";

import React, { useEffect } from "react";
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Gauge,
} from "lucide-react";
import type { PlaybackSpeed } from "@/lib/protocols/state-machine";

export interface PlaybackControlsProps {
  isPlaying: boolean;
  currentStepIndex: number;
  totalSteps: number;
  speed: PlaybackSpeed;
  onPlay: () => void;
  onPause: () => void;
  onStepNext: () => void;
  onStepPrev: () => void;
  onGoToStep: (index: number) => void;
  onSetSpeed: (speed: PlaybackSpeed) => void;
  onReset: () => void;
}

export function PlaybackControls({
  isPlaying,
  currentStepIndex,
  totalSteps,
  speed,
  onPlay,
  onPause,
  onStepNext,
  onStepPrev,
  onGoToStep,
  onSetSpeed,
  onReset,
}: PlaybackControlsProps) {
  // Global keyboard shortcuts (Space to toggle play, Left/Right arrows to step)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        if (isPlaying) onPause();
        else onPlay();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        onStepNext();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        onStepPrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, onPause, onPlay, onStepNext, onStepPrev]);

  return (
    <div className="protocol-playback-bar flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] shadow-sm">
      {/* Step Sequence Indicator (Clickable Step Pills — No Range Slider) */}
      <div className="flex items-center gap-2 overflow-x-auto py-0.5">
        <span className="text-xs font-semibold text-[var(--text-secondary)] whitespace-nowrap">
          Timeline:
        </span>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onGoToStep(i)}
              className={`flex items-center justify-center transition-all ${
                i === currentStepIndex
                  ? "min-w-[28px] h-7 px-2 rounded-lg bg-blue-600 text-white text-xs font-mono font-bold shadow-sm ring-2 ring-blue-400/40"
                  : i < currentStepIndex
                  ? "w-7 h-7 rounded-lg bg-blue-500/15 text-blue-500 hover:bg-blue-500/25 text-xs font-mono font-medium border border-blue-500/30"
                  : "w-7 h-7 rounded-lg bg-[var(--surface-secondary)] text-[var(--text-muted)] hover:bg-[var(--surface-tertiary)] hover:text-[var(--text-primary)] text-xs font-mono border border-[var(--border-subtle)]"
              }`}
              title={`Jump to Step ${i + 1}`}
              aria-label={`Jump to Step ${i + 1}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <span className="text-xs font-mono text-[var(--text-muted)] ml-1 whitespace-nowrap">
          (Step {currentStepIndex + 1} of {totalSteps})
        </span>
      </div>

      {/* Animation Controls (Play/Pause, Prev, Step, Reset, Speed) */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Speed Selector */}
        <div className="flex items-center gap-1 bg-[var(--surface-secondary)] p-1 rounded-lg border border-[var(--border-subtle)]">
          <Gauge size={13} className="text-[var(--text-muted)] ml-1 hidden sm:block" />
          {([0.5, 1, 2] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSetSpeed(s)}
              className={`px-2 py-0.5 rounded text-xs font-mono transition-colors ${
                speed === s
                  ? "bg-blue-600 text-white font-bold shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
              title={`Playback speed: ${s}x`}
              aria-label={`Speed ${s}x`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Step Backward */}
        <button
          type="button"
          onClick={onStepPrev}
          disabled={currentStepIndex === 0}
          className="flex items-center justify-center min-w-[36px] min-h-[36px] sm:min-w-[32px] sm:min-h-[32px] rounded-lg bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-tertiary)] border border-[var(--border-subtle)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Step backward (Left Arrow)"
          aria-label="Step backward"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Play / Pause Button */}
        <button
          type="button"
          onClick={isPlaying ? onPause : onPlay}
          className="flex items-center justify-center min-h-[36px] sm:min-h-[32px] px-3.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-500 shadow-sm transition-colors gap-1.5 text-xs"
          title={isPlaying ? "Pause animation (Space)" : "Play animation (Space)"}
          aria-label={isPlaying ? "Pause animation" : "Play animation"}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          <span>{isPlaying ? "Pause" : "Play"}</span>
        </button>

        {/* Step Forward */}
        <button
          type="button"
          onClick={onStepNext}
          disabled={currentStepIndex >= totalSteps - 1}
          className="flex items-center justify-center min-w-[36px] min-h-[36px] sm:min-w-[32px] sm:min-h-[32px] rounded-lg bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-tertiary)] border border-[var(--border-subtle)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Step forward (Right Arrow)"
          aria-label="Step forward"
        >
          <ChevronRight size={16} />
        </button>

        {/* Reset Playback */}
        <button
          type="button"
          onClick={onReset}
          className="flex items-center justify-center min-w-[36px] min-h-[36px] sm:min-w-[32px] sm:min-h-[32px] rounded-lg bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-tertiary)] border border-[var(--border-subtle)] transition-colors"
          title="Reset playback to step 1"
          aria-label="Reset playback"
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );
}
