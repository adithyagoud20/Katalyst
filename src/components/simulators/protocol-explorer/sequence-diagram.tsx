"use client";

import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  GitCommit,
  RefreshCw,
  Table as TableIcon,
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

  const nodeById = useMemo(() => {
    const map = new Map<string, ProtocolNode>();
    for (const n of participantNodes) {
      map.set(n.id, n);
    }
    return map;
  }, [participantNodes]);

  const nodeColumnMap = useMemo(() => {
    const map = new Map<string, number>();
    participantNodes.forEach((node, idx) => {
      map.set(node.id, idx);
    });
    return map;
  }, [participantNodes]);

  const numCols = Math.max(2, participantNodes.length);

  const getProtoBadgeClass = (protocol: string) => {
    const p = protocol.toUpperCase();
    if (p.includes("DNS")) return "pe-badge-orange";
    if (p.includes("TCP")) return "pe-badge-green";
    if (p.includes("TLS") || p.includes("SSL") || p.includes("HTTPS")) return "pe-badge-cyan";
    if (p.includes("QUIC") || p.includes("HTTP/3")) return "pe-badge-orange";
    if (p.includes("MQTT")) return "pe-badge-pink";
    if (p.includes("WS")) return "pe-badge-purple";
    if (p.includes("UDP") || p.includes("ICMP")) return "pe-badge-blue";
    return "pe-badge-neutral";
  };

  return (
    <div className="protocol-sequence-container flex flex-col rounded-xl border border-[var(--pe-border)] bg-[var(--pe-surface)] overflow-hidden shadow-xs">
      {/* Header with Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--pe-border)] bg-[var(--pe-surface-alt)] px-3.5 py-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[var(--pe-text)]">Sequence Flow &amp; Capture</span>
          <span className="text-[11px] font-mono text-[var(--pe-text-muted)]">
            Step {currentStepIndex + 1} of {steps.length}
          </span>
        </div>

        <div className="flex items-center rounded-lg border border-[var(--pe-border)] bg-[var(--pe-surface)] p-0.5 gap-0.5">
          <button
            type="button"
            onClick={() => setViewMode("lifelines")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
              viewMode === "lifelines"
                ? "bg-[var(--action-primary-bg)] text-[var(--action-primary-text)]"
                : "text-[var(--pe-text-muted)] hover:text-[var(--pe-text)]"
            }`}
          >
            <GitCommit size={12} />
            <span>Lifelines</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
              viewMode === "table"
                ? "bg-[var(--action-primary-bg)] text-[var(--action-primary-text)]"
                : "text-[var(--pe-text-muted)] hover:text-[var(--pe-text)]"
            }`}
          >
            <TableIcon size={12} />
            <span>Wireshark</span>
          </button>
        </div>
      </div>

      {viewMode === "lifelines" ? (
        <div className="p-3.5 bg-[var(--pe-surface)] overflow-x-auto overflow-y-auto max-h-[430px] select-none">
          <div className="min-w-[440px] space-y-3">
            {/* Participant Header Cards */}
            <div
              className="grid border-b border-[var(--pe-border)] pb-3 gap-2"
              style={{ gridTemplateColumns: `repeat(${numCols}, minmax(0, 1fr))` }}
            >
              {participantNodes.map((n) => (
                <div key={n.id} className="flex flex-col items-center text-center px-1 min-w-0">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--pe-surface-alt)] border border-[var(--pe-border)] max-w-full">
                    <span className="w-2 h-2 rounded-full bg-[var(--pe-green)] shrink-0" />
                    <span className="text-xs font-semibold text-[var(--pe-text)] truncate">
                      {n.label}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--pe-text-muted)] mt-1 truncate max-w-full">
                    {n.ip}
                  </span>
                </div>
              ))}
            </div>

            {/* Vertical Lifelines & Message Arrows */}
            <div className="relative space-y-3 pt-1 pb-2">
              <div
                className="absolute inset-0 pointer-events-none grid"
                style={{ gridTemplateColumns: `repeat(${numCols}, minmax(0, 1fr))` }}
              >
                {participantNodes.map((n) => (
                  <div key={n.id} className="flex justify-center h-full">
                    <div className="w-px h-full border-l border-dashed border-[var(--pe-border-strong)] opacity-70" />
                  </div>
                ))}
              </div>

              {steps.map((step, idx) => {
                const isSelected = idx === currentStepIndex;
                const isCompleted = idx < currentStepIndex;
                const fromCol = nodeColumnMap.get(step.fromNodeId) ?? 0;
                const toCol = nodeColumnMap.get(step.toNodeId) ?? Math.min(1, numCols - 1);
                const isLeftToRight = fromCol <= toCol;
                const isDropped = step.status === "dropped";
                const isRetransmit = step.status === "retransmission";
                const isCorrupt = step.status === "corrupted";

                const colWidthPercent = 100 / numCols;
                const startPercent = (fromCol + 0.5) * colWidthPercent;
                const rawEndPercent = (toCol + 0.5) * colWidthPercent;
                const endPercent = isDropped
                  ? (startPercent + rawEndPercent) / 2
                  : rawEndPercent;

                const leftPos = Math.min(startPercent, endPercent);
                const widthPercent = Math.abs(endPercent - startPercent);

                const lineColorClass = isDropped
                  ? "bg-red-500"
                  : isCorrupt
                  ? "bg-amber-500"
                  : isRetransmit
                  ? "bg-orange-500"
                  : isSelected
                  ? "bg-[var(--pe-orange)]"
                  : isCompleted
                  ? "bg-[var(--pe-green)]"
                  : "bg-[var(--pe-border-strong)]";

                return (
                  <button
                    key={step.stepIndex}
                    type="button"
                    onClick={() => onSelectStep(idx)}
                    className={`w-full relative z-10 flex flex-col text-left cursor-pointer transition-colors px-2 py-2 rounded-lg border ${
                      isSelected
                        ? "bg-[var(--pe-orange-soft)] border-[var(--pe-orange)]/45"
                        : "hover:bg-[var(--pe-surface-alt)] border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-[var(--pe-text-muted)] mb-1 w-full">
                      <span className="font-semibold text-[var(--pe-text-secondary)]">
                        #{idx + 1} · {step.protocolName}
                      </span>
                      <span>{(step.timeMs / 1000).toFixed(3)}s</span>
                    </div>

                    <div className="relative h-7 flex items-center w-full">
                      <div
                        className={`absolute flex items-center transition-all duration-300 ${
                          isSelected ? "h-[3px]" : "h-0.5"
                        }`}
                        style={{
                          left: `${leftPos}%`,
                          width: `${Math.max(widthPercent, 6)}%`,
                        }}
                      >
                        <div className={`w-full h-full transition-colors duration-300 ${lineColorClass}`} />

                        {isDropped ? (
                          <div className="absolute right-0 translate-x-1/2 flex items-center justify-center text-red-600 dark:text-red-400 bg-[var(--pe-surface)] rounded-full p-0.5">
                            <XCircle size={13} />
                          </div>
                        ) : isLeftToRight ? (
                          <div
                            className="absolute right-0 w-0 h-0 border-y-[4.5px] border-y-transparent border-l-[7px]"
                            style={{
                              borderLeftColor: isCorrupt
                                ? "#f59e0b"
                                : isRetransmit
                                ? "#f97316"
                                : isSelected
                                ? "var(--pe-orange)"
                                : isCompleted
                                ? "var(--pe-green)"
                                : "var(--pe-text-muted)",
                            }}
                          />
                        ) : (
                          <div
                            className="absolute left-0 w-0 h-0 border-y-[4.5px] border-y-transparent border-r-[7px]"
                            style={{
                              borderRightColor: isCorrupt
                                ? "#f59e0b"
                                : isRetransmit
                                ? "#f97316"
                                : isSelected
                                ? "var(--pe-orange)"
                                : isCompleted
                                ? "var(--pe-green)"
                                : "var(--pe-text-muted)",
                            }}
                          />
                        )}

                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono truncate max-w-[260px] border shadow-xs ${
                              isSelected
                                ? "bg-[var(--pe-surface)] text-[var(--pe-orange)] border-[var(--pe-orange)] font-bold"
                                : isDropped
                                ? "bg-[var(--pe-danger-soft)] text-[var(--pe-danger)] border-[var(--pe-danger)]/40 font-semibold"
                                : isRetransmit
                                ? "bg-[var(--pe-warning-soft)] text-[var(--pe-warning)] border-[var(--pe-warning)]/40 font-semibold"
                                : "bg-[var(--pe-surface)] text-[var(--pe-text-secondary)] border-[var(--pe-border)]"
                            }`}
                          >
                            {step.arrowLabel}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <p className="text-[11px] text-[var(--pe-text-secondary)] mt-1.5 pl-2 leading-relaxed border-l-2 border-[var(--pe-orange)]">
                        {step.summary}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto overflow-y-auto max-h-96 bg-[var(--pe-surface)]">
          <table className="w-full text-left text-xs border-collapse font-mono min-w-[580px]">
            <thead>
              <tr className="bg-[var(--pe-surface-alt)] text-[var(--pe-text-muted)] border-b border-[var(--pe-border)] text-[11px]">
                <th className="py-2 px-3 w-10">No.</th>
                <th className="py-2 px-3 w-16">Time</th>
                <th className="py-2 px-3 w-28">Source</th>
                <th className="py-2 px-3 w-28">Destination</th>
                <th className="py-2 px-3 w-20">Protocol</th>
                <th className="py-2 px-3">Info</th>
              </tr>
            </thead>
            <tbody>
              {steps.map((step, idx) => {
                const isSelected = idx === currentStepIndex;
                const isDropped = step.status === "dropped";
                const isRetransmit = step.status === "retransmission";
                const isCorrupt = step.status === "corrupted";
                const srcIp = nodeById.get(step.fromNodeId)?.ip ?? step.fromNodeId;
                const dstIp = nodeById.get(step.toNodeId)?.ip ?? step.toNodeId;

                return (
                  <tr
                    key={step.stepIndex}
                    onClick={() => onSelectStep(idx)}
                    className={`cursor-pointer transition-colors border-b border-[var(--pe-border)] text-[11px] ${
                      isSelected
                        ? "bg-[var(--pe-accent-soft)] text-[var(--pe-text)] font-semibold"
                        : isDropped || isCorrupt
                        ? "bg-[var(--pe-danger-soft)] text-[var(--pe-danger)]"
                        : isRetransmit
                        ? "bg-[var(--pe-warning-soft)] text-[var(--pe-warning)]"
                        : "hover:bg-[var(--pe-surface-alt)] text-[var(--pe-text-secondary)]"
                    }`}
                  >
                    <td className="py-2 px-3">{idx + 1}</td>
                    <td className="py-2 px-3 text-[var(--pe-text-muted)]">
                      {(step.timeMs / 1000).toFixed(3)}s
                    </td>
                    <td className="py-2 px-3 truncate max-w-[120px]" title={srcIp}>
                      {srcIp}
                    </td>
                    <td className="py-2 px-3 truncate max-w-[120px]" title={dstIp}>
                      {dstIp}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border ${getProtoBadgeClass(
                          step.protocolName
                        )}`}
                      >
                        {step.protocolName}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {(isDropped || isCorrupt) && (
                          <AlertCircle size={12} className="text-[var(--pe-danger)] shrink-0" />
                        )}
                        {isRetransmit && (
                          <RefreshCw size={12} className="text-[var(--pe-warning)] shrink-0" />
                        )}
                        <span className="truncate">{step.arrowLabel}</span>
                      </div>
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
