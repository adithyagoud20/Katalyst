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
  const [arrangedStepIds, setArrangedStepIds] = useState<number[]>(
    () => challenge?.shuffledStepIds ?? []
  );
  const [evaluation, setEvaluation] = useState<"unsubmitted" | "success" | "failure">(
    "unsubmitted"
  );
  const [showHintIndex, setShowHintIndex] = useState<number>(-1);

  if (!challenge) {
    return (
      <div className="p-6 text-center text-xs text-[var(--pe-text-muted)] bg-[var(--pe-surface)] rounded-xl border border-[var(--pe-border)]">
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
    <div className="protocol-exam-workbench p-3.5 rounded-xl border border-[var(--pe-border)] bg-[var(--pe-surface)] space-y-3.5">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--pe-accent-text)]">
          <HelpCircle size={15} className="shrink-0" />
          <span>Interactive Exam: {challenge.title}</span>
        </div>
        <p className="text-xs text-[var(--pe-text-secondary)] mt-1.5 leading-relaxed">
          {challenge.prompt}
        </p>
      </div>

      <div className="space-y-2">
        {arrangedStepIds.map((stepId, index) => {
          const step = allSteps.find((s) => s.stepIndex === stepId);
          if (!step) return null;

          return (
            <div
              key={stepId}
              className="flex items-center justify-between gap-2.5 p-2.5 rounded-lg border border-[var(--pe-border)] bg-[var(--pe-surface-alt)] text-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--pe-surface)] border border-[var(--pe-border)] text-[11px] font-mono font-bold text-[var(--pe-text-muted)] shrink-0">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <span className="font-semibold text-[var(--pe-text)] block truncate">
                    {step.fromNodeId} → {step.toNodeId}: {step.arrowLabel}
                  </span>
                  <span className="text-[11px] text-[var(--pe-text-muted)] truncate block">
                    {step.summary}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => moveStep(index, "up")}
                  disabled={index === 0}
                  className="p-1.5 rounded-md hover:bg-[var(--pe-surface-inset)] disabled:opacity-30 disabled:cursor-not-allowed text-[var(--pe-text-secondary)]"
                  title="Move step up"
                  aria-label={`Move step ${index + 1} up`}
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => moveStep(index, "down")}
                  disabled={index === arrangedStepIds.length - 1}
                  className="p-1.5 rounded-md hover:bg-[var(--pe-surface-inset)] disabled:opacity-30 disabled:cursor-not-allowed text-[var(--pe-text-secondary)]"
                  title="Move step down"
                  aria-label={`Move step ${index + 1} down`}
                >
                  <ArrowDown size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--pe-border)]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleVerify}
            className="px-3.5 py-2 rounded-lg bg-[var(--action-primary-bg)] text-[var(--action-primary-text)] text-xs font-semibold hover:bg-[var(--action-primary-hover)] transition-colors cursor-pointer"
          >
            Verify Sequence
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[var(--pe-surface-alt)] text-xs font-medium text-[var(--pe-text-secondary)] hover:text-[var(--pe-text)] border border-[var(--pe-border)] transition-colors cursor-pointer"
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
            className="flex items-center gap-1.5 text-xs font-medium text-[var(--pe-warning)] hover:opacity-80 transition-opacity disabled:opacity-40 cursor-pointer"
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

      {showHintIndex >= 0 && (
        <div className="p-3 rounded-lg bg-[var(--pe-warning-soft)] border border-[var(--pe-warning)]/35 text-xs text-[var(--pe-text)]">
          <strong>Hint:</strong> {challenge.hints[showHintIndex]}
        </div>
      )}

      {evaluation === "success" && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[var(--pe-green-soft)] border border-[var(--pe-green)]/40 text-xs">
          <CheckCircle2 size={16} className="text-[var(--pe-green)] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold block text-[var(--pe-green)]">
              Sequence Verified! Correct protocol ordering.
            </span>
            <p className="text-[11px] leading-relaxed text-[var(--pe-text-secondary)]">
              {challenge.explanation}
            </p>
          </div>
        </div>
      )}

      {evaluation === "failure" && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[var(--pe-danger-soft)] border border-[var(--pe-danger)]/40 text-xs">
          <XCircle size={16} className="text-[var(--pe-danger)] shrink-0 mt-0.5" />
          <div className="space-y-2 flex-1">
            <span className="font-semibold block text-[var(--pe-danger)]">
              Incorrect Sequence. One or more packet steps are out of order.
            </span>
            <p className="text-[11px] leading-relaxed text-[var(--pe-text-secondary)]">
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--pe-surface)] hover:bg-[var(--pe-surface-alt)] border border-[var(--pe-danger)]/40 text-[11px] font-medium text-[var(--pe-danger)] transition-colors cursor-pointer"
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
