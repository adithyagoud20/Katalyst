"use client";

import React from "react";
import { Play, Pause, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import type { PacketStep } from "@/lib/protocols/schema";

interface PacketFlowTableProps {
  steps: PacketStep[];
  currentStepIndex: number;
  isPlaying: boolean;
  speed: number;
  onPlay: () => void;
  onPause: () => void;
  onStepNext: () => void;
  onStepPrev: () => void;
  onSelectStep: (index: number) => void;
  onSetSpeed: (speed: number) => void;
  onReset: () => void;
}

export function PacketFlowTable({
  steps,
  currentStepIndex,
  isPlaying,
  speed,
  onPlay,
  onPause,
  onStepNext,
  onStepPrev,
  onSelectStep,
  onSetSpeed,
  onReset,
}: PacketFlowTableProps) {
  // Protocol badge color helper
  const getBadgeStyle = (protocol: string, info: string) => {
    const p = protocol.toUpperCase();
    if (p.includes("DNS")) {
      return "bg-blue-500/20 text-blue-400 border-blue-500/40";
    }
    if (p.includes("TCP")) {
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
    }
    if (p.includes("TLS") || p.includes("SSL")) {
      return "bg-cyan-500/20 text-cyan-400 border-cyan-500/40";
    }
    if (p.includes("QUIC")) {
      return "bg-orange-500/20 text-orange-400 border-orange-500/40";
    }
    if (p.includes("HTTP")) {
      if (info.includes("200") || info.includes("OK") || info.includes("Response")) {
        return "bg-purple-500/20 text-purple-400 border-purple-500/40";
      }
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40";
    }
    return "bg-sky-500/20 text-sky-400 border-sky-500/40";
  };

  return (
    <div className="packet-flow-table-root rounded-xl border border-[#1a253c] bg-[#0b1222] shadow-xl overflow-hidden flex flex-col">
      {/* Top Header Bar: Title, Legend, and Playback Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-b border-[#1a253c] bg-[#0e1628]">
        {/* Left: Section Title & Legend */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
            PACKET FLOW
          </span>

          <div className="flex items-center gap-2.5 text-[11px] font-mono text-slate-300">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-400" /> DNS
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> TCP
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-400" /> Request
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-400" /> Response
            </span>
            <span className="text-[10px] text-slate-400 hidden md:inline">
              Data ACKs not shown
            </span>
          </div>
        </div>

        {/* Right: Integrated Playback Controls */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Speed Selector */}
          <select
            value={speed}
            onChange={(e) => onSetSpeed(parseFloat(e.target.value))}
            className="text-xs font-mono font-semibold rounded-lg border border-[#1e2e4f] bg-[#131d33] text-slate-200 px-2 py-1 focus:outline-none cursor-pointer"
            aria-label="Playback speed"
          >
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={2}>2x</option>
          </select>

          {/* Step Prev */}
          <button
            type="button"
            onClick={onStepPrev}
            disabled={currentStepIndex <= 0}
            className="p-1.5 rounded-lg border border-[#1e2e4f] bg-[#131d33] text-slate-300 hover:text-white hover:bg-[#1a2744] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Previous packet"
            aria-label="Previous packet"
          >
            <ChevronLeft size={14} />
          </button>

          {/* Play / Pause Primary Button */}
          <button
            type="button"
            onClick={isPlaying ? onPause : onPlay}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono font-semibold text-xs shadow-sm transition-colors"
            aria-label={isPlaying ? "Pause simulation" : "Play simulation"}
          >
            {isPlaying ? (
              <>
                <Pause size={13} fill="currentColor" />
                <span>PAUSE</span>
              </>
            ) : (
              <>
                <Play size={13} fill="currentColor" />
                <span>PLAY</span>
              </>
            )}
          </button>

          {/* Step Next */}
          <button
            type="button"
            onClick={onStepNext}
            disabled={currentStepIndex >= steps.length - 1}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#1e2e4f] bg-[#131d33] text-slate-300 hover:text-white hover:bg-[#1a2744] disabled:opacity-30 disabled:cursor-not-allowed text-xs font-mono font-semibold transition-colors"
            title="Next packet"
            aria-label="Next packet"
          >
            <span>STEP</span>
            <ChevronRight size={13} />
          </button>

          {/* Reset */}
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-[#1e2e4f] bg-[#131d33] text-slate-400 hover:text-white hover:bg-[#1a2744] text-xs font-mono font-semibold transition-colors"
            title="Reset simulation"
            aria-label="Reset simulation"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">RESET</span>
          </button>
        </div>
      </div>

      {/* Table Stream View */}
      <div className="overflow-x-auto max-h-56 overflow-y-auto">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead className="sticky top-0 bg-[#0e1628] text-slate-400 border-b border-[#1a253c] select-none">
            <tr>
              <th className="py-2 px-3 font-semibold w-12 text-center">NO.</th>
              <th className="py-2 px-3 font-semibold w-20">TIME</th>
              <th className="py-2 px-3 font-semibold w-28">SRC HOST</th>
              <th className="py-2 px-3 font-semibold w-28">DST HOST</th>
              <th className="py-2 px-3 font-semibold w-24">PROTO</th>
              <th className="py-2 px-3 font-semibold">INFO / PAYLOAD</th>
              <th className="py-2 px-3 font-semibold w-20 text-right">SIZE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a253c]">
            {steps.map((step, idx) => {
              const isActive = idx === currentStepIndex;
              const formattedTime = (step.stepIndex * 0.015).toFixed(3) + "s";
              const sizeFormatted = step.rawHex ? `${Math.round(step.rawHex.length / 2)} B` : "64 B";

              return (
                <tr
                  key={step.stepIndex}
                  onClick={() => onSelectStep(idx)}
                  className={`cursor-pointer transition-colors ${
                    isActive
                      ? "bg-blue-600/20 text-white font-semibold border-l-4 border-l-blue-500"
                      : "hover:bg-[#101b33] text-slate-300"
                  }`}
                >
                  <td className="py-2 px-3 text-center">
                    <span
                      className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                        isActive
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-[#131d33] text-slate-400 border border-[#1e2e4f]"
                      }`}
                    >
                      {idx + 1}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-400">{formattedTime}</td>
                  <td className="py-2 px-3 text-slate-200 truncate max-w-[120px]">
                    {step.fromNodeId === "client" ? "192.168.1.10" : step.fromNodeId === "resolver" || step.fromNodeId === "dns" ? "8.8.8.8" : "203.0.113.10"}
                  </td>
                  <td className="py-2 px-3 text-slate-200 truncate max-w-[120px]">
                    {step.toNodeId === "client" ? "192.168.1.10" : step.toNodeId === "resolver" || step.toNodeId === "dns" ? "8.8.8.8" : "203.0.113.10"}
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border ${getBadgeStyle(
                        step.protocolName,
                        step.arrowLabel
                      )}`}
                    >
                      {step.protocolName}
                    </span>
                  </td>
                  <td className="py-2 px-3 truncate max-w-[340px] text-slate-300">
                    {step.arrowLabel}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-400">
                    {sizeFormatted}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
