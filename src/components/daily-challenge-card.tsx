"use client";

import React, { useState, useEffect } from "react";
import { Flame, CheckCircle, XCircle, Award, BookOpen, ChevronRight } from "lucide-react";
import {
  getTodayChallenge,
  getTodayDateString,
  loadDailyChallengeRecord,
  submitDailyChallengeAnswer,
} from "@/lib/daily-challenge";

export interface DailyChallengeCardProps {
  className?: string;
  onNavigatePractice?: () => void;
}

export function DailyChallengeCard({ className = "", onNavigatePractice }: DailyChallengeCardProps) {
  const challenge = getTodayChallenge();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [result, setResult] = useState<{
    passed: boolean;
    correctIndex: number;
    explanation: string;
    streak: number;
  } | null>(null);
  const [streak, setStreak] = useState<number>(0);
  const [alreadyCompletedToday, setAlreadyCompletedToday] = useState<boolean>(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const rec = loadDailyChallengeRecord();
        setStreak(rec.streak);

        const todayStr = getTodayDateString();
        if (rec.history[todayStr]?.passed) {
          setAlreadyCompletedToday(true);
          setSubmitted(true);
          setSelectedIndex(challenge.correctIndex);
          setResult({
            passed: true,
            correctIndex: challenge.correctIndex,
            explanation: challenge.explanation,
            streak: rec.streak,
          });
        }
      } catch {
        // Storage unavailable
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [challenge]);

  const handleSubmit = (index: number) => {
    if (submitted) return;
    setSelectedIndex(index);
    const res = submitDailyChallengeAnswer(index);
    setResult(res);
    setSubmitted(true);
    setStreak(res.streak);
  };

  return (
    <div className={`rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-4 shadow-sm text-[var(--text-primary)] ${className}`}>
      {/* Header with Streak Counter */}
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
            <Flame size={16} />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-zinc-100 flex items-center gap-1.5">
              Daily Engineering Challenge
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded font-mono">
                {challenge.category}
              </span>
            </h3>
            <span className="text-[10px] text-[var(--text-muted)]">Solve one core problem every day</span>
          </div>
        </div>

        {/* Streak Counter Badge */}
        <div className="flex items-center gap-1 bg-amber-950/30 border border-amber-500/30 text-amber-300 px-2.5 py-1 rounded-full text-xs font-bold font-mono">
          <Flame size={14} className={streak > 0 ? "fill-amber-400 text-amber-400" : "text-amber-500"} />
          <span>{streak} DAY{streak !== 1 ? "S" : ""}</span>
        </div>
      </div>

      {/* Challenge Title & Question */}
      <div className="mb-4 space-y-1.5">
        <h4 className="text-sm font-semibold text-zinc-200">{challenge.title}</h4>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{challenge.question}</p>
        {challenge.formula && (
          <div className="mt-1 font-mono text-[11px] text-zinc-400 bg-zinc-950/60 px-2 py-1 rounded border border-zinc-800">
            Formula: {challenge.formula}
          </div>
        )}
      </div>

      {/* Multiple-Choice Options */}
      <div className="space-y-2 mb-3">
        {challenge.options.map((opt, idx) => {
          const isSelected = selectedIndex === idx;
          let btnStyle = "bg-[var(--surface-primary)] border-[var(--border-subtle)] text-zinc-300 hover:border-zinc-500";

          if (submitted && result) {
            if (idx === result.correctIndex) {
              btnStyle = "bg-emerald-950/40 border-emerald-500/60 text-emerald-200 font-semibold";
            } else if (isSelected && !result.passed) {
              btnStyle = "bg-red-950/40 border-red-500/60 text-red-200";
            } else {
              btnStyle = "opacity-50 border-[var(--border-subtle)] text-zinc-500";
            }
          } else if (isSelected) {
            btnStyle = "border-blue-500 bg-blue-950/20 text-blue-200";
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={submitted}
              onClick={() => handleSubmit(idx)}
              className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all flex items-center justify-between ${btnStyle}`}
            >
              <span className="flex items-center gap-2">
                <span className="h-5 w-5 rounded-full border border-zinc-700 bg-zinc-900 flex items-center justify-center font-mono text-[10px] text-zinc-400">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span>{opt}</span>
              </span>
              {submitted && result && idx === result.correctIndex && (
                <CheckCircle size={14} className="text-emerald-400 shrink-0" />
              )}
              {submitted && result && isSelected && !result.passed && (
                <XCircle size={14} className="text-red-400 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Post-Submission Result Feedback */}
      {submitted && result && (
        <div className={`p-3 rounded-lg border text-xs space-y-1.5 animate-fadeIn ${
          result.passed ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-200" : "bg-red-950/20 border-red-500/30 text-red-200"
        }`}>
          <div className="flex items-center gap-1.5 font-bold">
            {result.passed ? <CheckCircle size={14} /> : <XCircle size={14} />}
            <span>{result.passed ? "Correct Answer! Streak incremented." : "Not quite right today."}</span>
          </div>
          <p className="text-[11px] leading-relaxed text-zinc-300">{result.explanation}</p>
        </div>
      )}

      {/* Footer Navigation Link */}
      {onNavigatePractice && (
        <div className="mt-3 pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
          <span className="flex items-center gap-1">
            <Award size={12} className="text-amber-400" />
            {alreadyCompletedToday ? "Challenge solved for today" : "Test your daily recall"}
          </span>
          <button
            type="button"
            onClick={onNavigatePractice}
            className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-semibold transition-colors"
          >
            <BookOpen size={12} /> GATE &amp; Career Prep <ChevronRight size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
