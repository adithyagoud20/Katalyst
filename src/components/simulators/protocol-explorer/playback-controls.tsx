"use client";

import React, { useEffect } from "react";
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
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
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable
      ) {
        return;
      }

      if (e.code === "Space") {
        // Allow Space to activate focused buttons/links natively
        if (
          target instanceof HTMLButtonElement ||
          target instanceof HTMLAnchorElement ||
          target?.getAttribute("role") === "button"
        ) {
          return;
        }
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
    <div className="protocol-playback-bar flex flex-wrap items-center gap-3 px-3.5 py-2.5 rounded-xl border border-[var(--pe-border)] bg-[var(--pe-surface)] shadow-xs">
      {/* Left: Play/Pause circle + Prev/Next */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={isPlaying ? onPause : onPlay}
          className="w-10 h-10 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-[var(--pe-green)] text-white hover:opacity-90 shadow-xs transition-opacity cursor-pointer"
          title={isPlaying ? "Pause animation (Space)" : "Play animation (Space)"}
          aria-label={isPlaying ? "Pause animation" : "Play animation"}
        >
          {isPlaying ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" className="ml-0.5" />}
        </button>

        <button
          type="button"
          onClick={onStepPrev}
          disabled={currentStepIndex <= 0}
          className="w-9 h-9 rounded-lg flex items-center justify-center border border-[var(--pe-border)] bg-[var(--pe-surface-alt)] text-[var(--pe-text-secondary)] hover:text-[var(--pe-text)] hover:border-[var(--pe-border-strong)] disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
          title="Step backward (Left Arrow)"
          aria-label="Step backward"
        >
          <ChevronLeft size={16} />
        </button>

        <button
          type="button"
          onClick={onStepNext}
          disabled={currentStepIndex >= totalSteps - 1}
          className="w-9 h-9 rounded-lg flex items-center justify-center border border-[var(--pe-border)] bg-[var(--pe-surface-alt)] text-[var(--pe-text-secondary)] hover:text-[var(--pe-text)] hover:border-[var(--pe-border-strong)] disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
          title="Step forward (Right Arrow)"
          aria-label="Step forward"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Center: ProtocolExplorer Segmented Step Progress Bar */}
      <div
        className="order-last sm:order-none basis-full sm:basis-0 sm:flex-1 min-w-0 flex items-center gap-1.5"
        role="group"
        aria-label="Step timeline"
      >
        {Array.from({ length: totalSteps }).map((_, i) => {
          const isCurrent = i === currentStepIndex;
          const isCompleted = i < currentStepIndex;

          return (
            <button
              key={i}
              type="button"
              onClick={() => onGoToStep(i)}
              className="group flex-1 py-2.5 flex items-center cursor-pointer"
              title={`Jump to Step ${i + 1}`}
              aria-label={`Jump to Step ${i + 1}`}
              aria-current={isCurrent ? "step" : undefined}
            >
              <span className="relative block w-full h-1.5 rounded-full overflow-hidden bg-[var(--pe-border-strong)] group-hover:bg-[var(--pe-text-muted)] transition-colors">
                {isCurrent && (
                  <span
                    key={`seg-cur-${currentStepIndex}`}
                    className="pe-seg-active block w-full h-full rounded-full bg-[var(--pe-orange)]"
                  />
                )}
                {isCompleted && (
                  <span className="block w-full h-full rounded-full bg-[var(--pe-green)]" />
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right: Speed Selector & Reset */}
      <div className="flex items-center gap-1.5 shrink-0 ml-auto">
        <select
          value={speed}
          onChange={(e) => onSetSpeed(parseFloat(e.target.value) as PlaybackSpeed)}
          className="h-9 rounded-lg border border-[var(--pe-border)] bg-[var(--pe-surface-alt)] px-2 text-xs font-mono font-semibold text-[var(--pe-text)] focus:outline-none cursor-pointer"
          aria-label="Playback speed"
        >
          <option value={0.5}>0.5×</option>
          <option value={1}>1×</option>
          <option value={1.5}>1.5×</option>
          <option value={2}>2×</option>
        </select>

        <button
          type="button"
          onClick={onReset}
          className="w-9 h-9 rounded-lg flex items-center justify-center border border-[var(--pe-border)] bg-[var(--pe-surface-alt)] text-[var(--pe-text-secondary)] hover:text-[var(--pe-text)] hover:border-[var(--pe-border-strong)] transition-colors"
          title="Reset playback to step 1"
          aria-label="Reset playback"
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );
}
