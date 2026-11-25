"use client";

import React from "react";
import { Zap, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { ChaosVariant } from "@/lib/protocols/schema";

export interface ChaosControlsProps {
  variants?: ChaosVariant[];
  activeChaosId: string | null;
  onToggleChaos: (chaosId: string) => void;
}

export function ChaosControls({
  variants,
  activeChaosId,
  onToggleChaos,
}: ChaosControlsProps) {
  if (!variants || variants.length === 0) return null;

  return (
    <div className="protocol-chaos-panel p-3.5 rounded-xl border border-[var(--pe-warning)]/35 bg-[var(--pe-warning-soft)] space-y-2.5">
      <div className="flex items-center gap-2 text-xs font-semibold text-[var(--pe-warning)]">
        <Zap size={14} className="shrink-0" />
        <span>Failure &amp; Chaos Injection Sandbox</span>
      </div>

      <p className="text-xs text-[var(--pe-text-secondary)] leading-relaxed">
        Simulate real-world network anomalies (packet loss, checksum errors, server failures) to observe protocol recovery mechanisms.
      </p>

      <div className="flex flex-col gap-2 pt-1">
        {variants.map((v) => {
          const isActive = activeChaosId === v.id;

          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onToggleChaos(v.id)}
              aria-pressed={isActive}
              className={`flex items-start gap-2 px-3 py-2 rounded-lg text-left text-xs font-medium border transition-colors cursor-pointer ${
                isActive
                  ? "bg-[var(--pe-orange-soft)] text-[var(--pe-text)] border-[var(--pe-orange)] font-semibold"
                  : "bg-[var(--pe-surface)] text-[var(--pe-text-secondary)] border-[var(--pe-border)] hover:border-[var(--pe-border-strong)]"
              }`}
            >
              {isActive ? (
                <AlertTriangle size={14} className="text-[var(--pe-orange)] shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 size={14} className="text-[var(--pe-text-muted)] shrink-0 mt-0.5" />
              )}
              <div className="min-w-0">
                <span className="block">{v.name}</span>
                <span className="block text-[11px] font-normal text-[var(--pe-text-muted)] mt-0.5 leading-snug">
                  {v.description}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
