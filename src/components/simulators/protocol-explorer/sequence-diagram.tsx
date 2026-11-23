"use client";

import React, { useState, useMemo } from "react";
import {
  AlertCircle,
  RefreshCw,
  Table as TableIcon,
  GitCommit,
  XCircle,
} from "lucide-react";
import type { SequenceDiagramProps } from "./types";
import type { ProtocolNode } from "@/lib/protocols/schema";

export function SequenceDiagram({
  nodes = [],
  steps,
  currentStepIndex,
  onSelectStep,
}: SequenceDiagramProps) {
  const [viewMode, setViewMode] = useState<"lifelines" | "table">("lifelines");

  // Derive unique nodes from steps if not explicitly provided
  const participantNodes = useMemo(() => {
    if (nodes.length > 0) return nodes;

    const nodeIds = new Set<string>();
    for (const s of steps) {
      nodeIds.add(s.fromNodeId);
      nodeIds.add(s.toNodeId);
    }
    return Array.from(nodeIds).map((id) => ({
      id,
      label: id.charAt(0).toUpperCase() + id.slice(1),
      type: (id.includes("client") ? "client" : id.includes("resolver") ? "resolver" : "server") as ProtocolNode["type"],
      ip: "0.0.0.0",
      mac: "00:00:00:00:00:00",
      xPercent: 50,
      yPercent: 50,
    }));
  }, [nodes, steps]);

  // Map node ID to its column index (0 to N-1)
  const nodeColumnMap = useMemo(() => {
    const map = new Map<string, number>();
    participantNodes.forEach((node, idx) => {
      map.set(node.id, idx);
    });
    return map;
  }, [participantNodes]);

  const numCols = participantNodes.length;

  return (
    <div className="protocol-sequence-container flex flex-col h-full rounded-xl border border-[#1a253c] bg-[#0b1222] overflow-hidden shadow-xl">
      {/* Header with Mode Switcher */}
      <div className="flex items-center justify-between border-b border-[#1a253c] bg-[#0e1628] px-3 py-2 text-xs font-semibold text-slate-300">
        <div className="flex items-center gap-2">
          <span>Sequence Flow &amp; Capture</span>
          <span className="text-[11px] font-normal text-slate-400 font-mono">
            Step {currentStepIndex + 1} of {steps.length}
          </span>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center rounded-lg border border-[#1e2e4f] bg-[#131d33] p-0.5">
          <button
            type="button"
            onClick={() => setViewMode("lifelines")}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              viewMode === "lifelines"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
            title="Lifeline Sequence Diagram"
          >
            <GitCommit size={12} />
            <span>Lifelines</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              viewMode === "table"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
            title="Wireshark Packet Table"
          >
            <TableIcon size={12} />
            <span>Wireshark</span>
          </button>
        </div>
      </div>

      {/* Lifeline Swimlane Diagram View (protocolexplorer.org Signature Layout) */}
      {viewMode === "lifelines" ? (
        <div className="p-3 bg-[#0a0e17] flex-1 overflow-x-auto overflow-y-auto select-none">
          <div className="min-w-[420px] space-y-4">
            {/* Lifeline Participant Headers */}
            <div className="grid border-b border-gray-800 pb-3" style={{ gridTemplateColumns: `repeat(${numCols}, 1fr)` }}>
              {participantNodes.map((n) => (
                <div key={n.id} className="flex flex-col items-center text-center px-1">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-900 border border-gray-700/60 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-xs font-semibold text-gray-200 truncate max-w-[120px]">
                      {n.label}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-gray-500 mt-1">
                    {n.ip}
                  </span>
                </div>
              ))}
            </div>

            {/* Sequence Steps with Horizontal Lifeline Arrows */}
            <div className="relative space-y-5 pt-2 pb-6">
              {/* Vertical Dashed Lifeline Cords */}
              <div
                className="absolute inset-0 pointer-events-none grid"
                style={{ gridTemplateColumns: `repeat(${numCols}, 1fr)` }}
              >
                {participantNodes.map((n) => (
                  <div key={n.id} className="flex justify-center h-full">
                    <div className="w-px h-full border-l border-dashed border-gray-800" />
                  </div>
                ))}
              </div>

              {/* Step Arrows */}
              {steps.map((step, idx) => {
                const isSelected = idx === currentStepIndex;
                const fromCol = nodeColumnMap.get(step.fromNodeId) ?? 0;
                const toCol = nodeColumnMap.get(step.toNodeId) ?? 1;
                const isLeftToRight = fromCol <= toCol;
                const isDropped = step.status === "dropped";
                const isRetransmit = step.status === "retransmission";
                const isCorrupt = step.status === "corrupted";

                // Calculate horizontal percentages across columns
                const colWidthPercent = 100 / numCols;
                const startPercent = (fromCol + 0.5) * colWidthPercent;
                const endPercent = isDropped
                  ? (startPercent + (toCol + 0.5) * colWidthPercent) / 2
                  : (toCol + 0.5) * colWidthPercent;

                const leftPos = Math.min(startPercent, endPercent);
                const widthPercent = Math.abs(endPercent - startPercent);

                return (
                  <div
                    key={step.stepIndex}
                    onClick={() => onSelectStep(idx)}
                    className={`relative z-10 flex flex-col cursor-pointer transition-all p-2 rounded-lg ${
                      isSelected
                        ? "bg-blue-950/30 border border-blue-500/40 shadow-sm"
                        : "hover:bg-gray-900/40 border border-transparent"
                    }`}
                  >
                    {/* Step Meta (Step Number & Latency) */}
                    <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 mb-1 px-1">
                      <span className="font-semibold text-gray-400">
                        #{idx + 1} {step.protocolName}
                      </span>
                      <span>+{(step.timeMs).toFixed(0)}ms</span>
                    </div>

                    {/* Horizontal Arrow Line spanning from source to target lifeline */}
                    <div className="relative h-7 flex items-center">
                      <div
                        className="absolute h-0.5 transition-all flex items-center"
                        style={{
                          left: `${leftPos}%`,
                          width: `${Math.max(widthPercent, 4)}%`,
                        }}
                      >
                        {/* Connecting Line */}
                        <div
                          className={`w-full h-full transition-all ${
                            isDropped
                              ? "bg-red-500"
                              : isCorrupt
                              ? "bg-amber-500"
                              : isRetransmit
                              ? "bg-yellow-500"
                              : isSelected
                              ? "bg-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]"
                              : "bg-gray-600"
                          }`}
                        />

                        {/* Arrowhead */}
                        {isDropped ? (
                          <div className="absolute right-0 translate-x-1/2 flex items-center justify-center text-red-400 bg-red-950/80 rounded-full p-0.5">
                            <XCircle size={12} />
                          </div>
                        ) : isLeftToRight ? (
                          <div
                            className={`absolute right-0 w-0 h-0 border-y-[4px] border-y-transparent border-l-[7px] ${
                              isSelected
                                ? "border-l-cyan-400"
                                : isRetransmit
                                ? "border-l-yellow-400"
                                : "border-l-gray-400"
                            }`}
                          />
                        ) : (
                          <div
                            className={`absolute left-0 w-0 h-0 border-y-[4px] border-y-transparent border-r-[7px] ${
                              isSelected
                                ? "border-r-cyan-400"
                                : isRetransmit
                                ? "border-r-yellow-400"
                                : "border-r-gray-400"
                            }`}
                          />
                        )}

                        {/* Centered Action Label Capsule */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium truncate max-w-[260px] border shadow-xs ${
                              isSelected
                                ? "bg-cyan-950/90 text-cyan-200 border-cyan-400 font-bold"
                                : isDropped
                                ? "bg-red-950 text-red-300 border-red-500"
                                : isRetransmit
                                ? "bg-amber-950 text-amber-300 border-amber-500"
                                : "bg-gray-900 text-gray-300 border-gray-700"
                            }`}
                          >
                            {step.arrowLabel}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Step Summary description when active */}
                    {isSelected && (
                      <p className="text-[11px] text-gray-300 mt-1 pl-1 leading-relaxed border-l-2 border-blue-400 bg-blue-950/20 py-1">
                        {step.summary}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Wireshark Capture Table View */
        <div className="overflow-x-auto overflow-y-auto max-h-96 border-b border-[#1a253c] bg-[#0b1222]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#0e1628] text-slate-400 border-b border-[#1a253c] font-mono text-[11px]">
                <th className="py-2 px-2.5 w-10">No.</th>
                <th className="py-2 px-2.5 w-16">Time</th>
                <th className="py-2 px-2.5 w-24">Source</th>
                <th className="py-2 px-2.5 w-24">Destination</th>
                <th className="py-2 px-2.5 w-16">Protocol</th>
                <th className="py-2 px-2.5">Info</th>
              </tr>
            </thead>
            <tbody>
              {steps.map((step, idx) => {
                const isSelected = idx === currentStepIndex;
                const isDropped = step.status === "dropped";
                const isRetransmit = step.status === "retransmission";
                const isCorrupt = step.status === "corrupted";

                return (
                  <tr
                    key={step.stepIndex}
                    onClick={() => onSelectStep(idx)}
                    className={`cursor-pointer transition-colors border-b border-[#1a253c]/40 font-mono text-[11px] ${
                      isSelected
                        ? "bg-blue-600/25 text-white font-semibold"
                        : isDropped || isCorrupt
                        ? "bg-red-950/20 text-red-300 hover:bg-red-950/30"
                        : isRetransmit
                        ? "bg-amber-950/20 text-amber-300 hover:bg-amber-950/30"
                        : "hover:bg-[#131f3b] text-slate-300"
                    }`}
                  >
                    <td className="py-2 px-2.5">{idx + 1}</td>
                    <td className="py-2 px-2.5 text-slate-400">{(step.timeMs / 1000).toFixed(3)}s</td>
                    <td className="py-2 px-2.5 truncate max-w-[100px]">{step.fromNodeId}</td>
                    <td className="py-2 px-2.5 truncate max-w-[100px]">{step.toNodeId}</td>
                    <td className="py-2 px-2.5 font-bold">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] ${
                          step.protocolName === "DNS"
                            ? "bg-purple-900/40 text-purple-300"
                            : step.protocolName === "TCP"
                            ? "bg-blue-900/40 text-blue-300"
                            : step.protocolName === "TLS"
                            ? "bg-emerald-900/40 text-emerald-300"
                            : step.protocolName === "QUIC"
                            ? "bg-cyan-900/40 text-cyan-300"
                            : step.protocolName === "MQTT"
                            ? "bg-amber-900/40 text-amber-300"
                            : "bg-gray-800 text-gray-300"
                        }`}
                      >
                        {step.protocolName}
                      </span>
                    </td>
                    <td className="py-2 px-2.5 flex items-center gap-1.5 truncate">
                      {(isDropped || isCorrupt) && <AlertCircle size={12} className="text-red-400 shrink-0" />}
                      {isRetransmit && <RefreshCw size={12} className="text-amber-400 shrink-0" />}
                      <span className="truncate">{step.arrowLabel}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
