"use client";

import React, { useState } from "react";
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Bot,
  Lightbulb,
} from "lucide-react";
import type { ExamChallenge, PacketStep } from "@/lib/protocols/schema";

export interface ExamWorkbenchProps {
  challenge?: ExamChallenge;
  allSteps: PacketStep[];
  onAskKat?: (prompt: string) => void;
}

export function ExamWorkbench({
  challenge,
  allSteps,
  onAskKat,
}: ExamWorkbenchProps) {
  // Current sequence of step IDs arranged by the learner
  const [arrangedStepIds, setArrangedStepIds] = useState<number[]>(() => challenge?.shuffledStepIds ?? []);
  const [evaluation, setEvaluation] = useState<"unsubmitted" | "success" | "failure">("unsubmitted");
  const [showHintIndex, setShowHintIndex] = useState<number>(-1);

  if (!challenge) {
    return (
      <div className="p-6 text-center text-xs text-[var(--text-muted)] bg-[var(--surface-primary)] rounded-xl border border-[var(--border-subtle)]">
        No interactive exam available for this scenario yet.
      </div>
    );
  }

  const moveStep = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= arrangedStepIds.length) return;

    const next = [...arrangedStepIds];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    setArrangedStepIds(next);
    setEvaluation("unsubmitted");
  };

  const handleVerify = () => {
    const isCorrect =
      arrangedStepIds.length === challenge.correctSequence.length &&
      arrangedStepIds.every((id, idx) => id === challenge.correctSequence[idx]);

    setEvaluation(isCorrect ? "success" : "failure");
  };

  const handleReset = () => {
    setArrangedStepIds(challenge.shuffledStepIds);
    setEvaluation("unsubmitted");
    setShowHintIndex(-1);
  };

  const handleShowHint = () => {
    setShowHintIndex((prev) => Math.min(prev + 1, challenge.hints.length - 1));
  };

  return (
    <div className="protocol-exam-workbench p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] shadow-sm space-y-4">
      {/* Challenge Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
          <HelpCircle size={15} />
          <span>Interactive Exam: {challenge.title}</span>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
          {challenge.prompt}
        </p>
      </div>

      {/* Arranged Steps List */}
      <div className="space-y-2">
        {arrangedStepIds.map((stepId, index) => {
          const step = allSteps.find((s) => s.stepIndex === stepId);
          if (!step) return null;

          return (
            <div
              key={stepId}
              className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-secondary)]/60 text-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--surface-subtle)] text-[11px] font-bold text-[var(--text-muted)] shrink-0">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <span className="font-semibold text-[var(--text-primary)] block truncate">
                    {step.fromNodeId} &rarr; {step.toNodeId}: {step.arrowLabel}
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)] truncate block">
                    {step.summary}
                  </span>
                </div>
              </div>

              {/* Move Up/Down Controls */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => moveStep(index, "up")}
                  disabled={index === 0}
                  className="p-1 rounded hover:bg-[var(--surface-hover)] disabled:opacity-30 disabled:cursor-not-allowed text-[var(--text-secondary)]"
                  title="Move step up"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => moveStep(index, "down")}
                  disabled={index === arrangedStepIds.length - 1}
                  className="p-1 rounded hover:bg-[var(--surface-hover)] disabled:opacity-30 disabled:cursor-not-allowed text-[var(--text-secondary)]"
                  title="Move step down"
                >
                  <ArrowDown size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleVerify}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 shadow-sm transition-colors"
          >
            Verify Sequence
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[var(--surface-secondary)] text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] transition-colors"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        {challenge.hints.length > 0 && (
          <button
            type="button"
            onClick={handleShowHint}
            disabled={showHintIndex >= challenge.hints.length - 1}
            className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-40"
          >
            <Lightbulb size={13} />
            <span>
              {showHintIndex >= 0
                ? `Hint (${showHintIndex + 1}/${challenge.hints.length})`
                : "Need a hint?"}
            </span>
          </button>
        )}
      </div>

      {/* Hints display */}
      {showHintIndex >= 0 && (
        <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200">
          <strong>Hint:</strong> {challenge.hints[showHintIndex]}
        </div>
      )}

      {/* Evaluation Result Banner */}
      {evaluation === "success" && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/40 text-emerald-200 text-xs">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold block text-emerald-300">
              Sequence Verified! Perfect protocol ordering.
            </span>
            <p className="text-[11px] leading-relaxed text-emerald-200/90">
              {challenge.explanation}
            </p>
          </div>
        </div>
      )}

      {evaluation === "failure" && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-950/30 border border-red-500/40 text-red-200 text-xs">
          <XCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-2 flex-1">
            <span className="font-semibold block text-red-300">
              Incorrect Sequence. One or more packet steps are out of order.
            </span>
            <p className="text-[11px] leading-relaxed text-red-200/90">
              Check the chronological causality of handshakes, queries, and acknowledgments.
            </p>
            {onAskKat && (
              <button
                type="button"
                onClick={() =>
                  onAskKat(
                    `In the protocol exam "${challenge.title}", my submitted sequence was: [${arrangedStepIds.join(
                      ", "
                    )}]. The challenge asks: "${challenge.prompt}". Can you guide me through why this sequence failed and explain the correct order without simply giving away the answer?`
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-900/40 hover:bg-red-900/60 border border-red-500/30 text-[11px] text-red-300 transition-colors"
              >
                <Bot size={13} />
                <span>Ask Kat Why My Sequence Failed</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
