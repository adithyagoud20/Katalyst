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
    <div className="protocol-chaos-panel p-3 rounded-xl border border-amber-500/30 bg-amber-950/10 shadow-sm space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
        <Zap size={14} className="text-amber-400 animate-pulse" />
        <span>Failure &amp; Chaos Injection Sandbox</span>
      </div>

      <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
        Simulate real-world network anomalies (packet loss, bit rot, middlebox drops) to inspect protocol recovery mechanisms.
      </p>

      <div className="flex flex-wrap gap-2 pt-1">
        {variants.map((v) => {
          const isActive = activeChaosId === v.id;

          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onToggleChaos(v.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                isActive
                  ? "bg-amber-500/20 text-amber-200 border-amber-500 shadow-sm"
                  : "bg-[var(--surface-secondary)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:bg-[var(--surface-hover)]"
              }`}
            >
              {isActive ? (
                <AlertTriangle size={13} className="text-amber-400" />
              ) : (
                <CheckCircle2 size={13} className="text-[var(--text-muted)]" />
              )}
              <span>{v.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
