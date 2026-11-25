"use client";

import React, { useMemo, useState } from "react";
import { List, LayoutGrid } from "lucide-react";
import type { PacketStep, ProtocolNode } from "@/lib/protocols/schema";

interface PacketFlowTableProps {
  nodes?: ProtocolNode[];
  steps: PacketStep[];
  currentStepIndex: number;
  onSelectStep: (index: number) => void;
}

export function PacketFlowTable({
  nodes = [],
  steps,
  currentStepIndex,
  onSelectStep,
}: PacketFlowTableProps) {
  const [layoutMode, setLayoutMode] = useState<"strip" | "table">("strip");

  const ipMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const n of nodes) {
      map.set(n.id, n.ip);
    }
    return map;
  }, [nodes]);

  const getBadgeClass = (protocol: string, status?: string) => {
    if (status === "dropped") return "pe-badge-red";
    if (status === "corrupted" || status === "retransmission") return "pe-badge-orange";
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
    <div className="packet-flow-table-root rounded-xl border border-[var(--pe-border)] bg-[var(--pe-surface)] overflow-hidden shadow-xs flex flex-col">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 border-b border-[var(--pe-border)] bg-[var(--pe-surface-alt)]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[var(--pe-text)]">Packets</span>
          <span className="inline-flex items-center justify-center rounded-md bg-[var(--pe-surface)] border border-[var(--pe-border)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--pe-text-muted)]">
            {steps.length}
          </span>
        </div>

        <div className="flex items-center rounded-lg border border-[var(--pe-border)] bg-[var(--pe-surface)] p-0.5 gap-0.5">
          <button
            type="button"
            onClick={() => setLayoutMode("strip")}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors ${
              layoutMode === "strip"
                ? "bg-[var(--action-primary-bg)] text-[var(--action-primary-text)]"
                : "text-[var(--pe-text-muted)] hover:text-[var(--pe-text)]"
            }`}
            title="Horizontal packet cards"
          >
            <LayoutGrid size={11} />
            <span>Cards</span>
          </button>
          <button
            type="button"
            onClick={() => setLayoutMode("table")}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors ${
              layoutMode === "table"
                ? "bg-[var(--action-primary-bg)] text-[var(--action-primary-text)]"
                : "text-[var(--pe-text-muted)] hover:text-[var(--pe-text)]"
            }`}
            title="Packet capture table"
          >
            <List size={11} />
            <span>Table</span>
          </button>
        </div>
      </div>

      {layoutMode === "strip" ? (
        <div className="flex items-stretch gap-2 p-2.5 overflow-x-auto overscroll-x-contain">
          {steps.map((step, idx) => {
            const isActive = idx === currentStepIndex;
            const srcIp = ipMap.get(step.fromNodeId) ?? step.fromNodeId;
            const dstIp = ipMap.get(step.toNodeId) ?? step.toNodeId;
            const shortTitle = step.arrowLabel.split("[")[0].trim();

            return (
              <button
                key={step.stepIndex}
                type="button"
                onClick={() => onSelectStep(idx)}
                aria-pressed={isActive}
                className={`flex flex-col justify-between text-left rounded-lg border px-3 py-2 min-w-[185px] max-w-[235px] shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? "border-[var(--pe-orange)] bg-[var(--pe-orange-soft)] shadow-xs"
                    : "border-[var(--pe-border)] bg-[var(--pe-surface-alt)] hover:border-[var(--pe-border-strong)]"
                }`}
              >
                <div className="flex items-center justify-between gap-2 w-full">
                  <span className="text-[10px] font-mono text-[var(--pe-text-muted)]">
                    {(step.timeMs / 1000).toFixed(3)}s
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${getBadgeClass(
                      step.protocolName,
                      step.status
                    )}`}
                  >
                    {step.protocolName}
                  </span>
                </div>
                <div className="text-xs font-semibold text-[var(--pe-text)] truncate w-full mt-1">
                  {shortTitle}
                </div>
                <div className="text-[10px] font-mono text-[var(--pe-text-muted)] truncate w-full mt-0.5">
                  {srcIp} → {dstIp}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto max-h-56 overflow-y-auto overscroll-x-contain">
          <table className="w-full text-left border-collapse text-xs font-mono min-w-[600px]">
            <thead className="sticky top-0 bg-[var(--pe-surface-alt)] text-[var(--pe-text-muted)] border-b border-[var(--pe-border)] select-none">
              <tr>
                <th className="py-2 px-3 font-semibold w-12 text-center">NO.</th>
                <th className="py-2 px-3 font-semibold w-20">TIME</th>
                <th className="py-2 px-3 font-semibold w-28">SRC HOST</th>
                <th className="py-2 px-3 font-semibold w-28">DST HOST</th>
                <th className="py-2 px-3 font-semibold w-20">PROTO</th>
                <th className="py-2 px-3 font-semibold">INFO / PAYLOAD</th>
                <th className="py-2 px-3 font-semibold w-20 text-right">SIZE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--pe-border)]">
              {steps.map((step, idx) => {
                const isActive = idx === currentStepIndex;
                const formattedTime = `${(step.timeMs / 1000).toFixed(3)}s`;
                const sizeFormatted = step.rawHex ? `${Math.round(step.rawHex.length / 2)} B` : "64 B";
                const srcIp = ipMap.get(step.fromNodeId) ?? step.fromNodeId;
                const dstIp = ipMap.get(step.toNodeId) ?? step.toNodeId;

                return (
                  <tr
                    key={step.stepIndex}
                    onClick={() => onSelectStep(idx)}
                    className={`cursor-pointer transition-colors ${
                      isActive
                        ? "bg-[var(--pe-orange-soft)] text-[var(--pe-text)] font-semibold"
                        : "hover:bg-[var(--pe-surface-alt)] text-[var(--pe-text-secondary)]"
                    }`}
                  >
                    <td className="py-2 px-3 text-center">{idx + 1}</td>
                    <td className="py-2 px-3 text-[var(--pe-text-muted)]">{formattedTime}</td>
                    <td className="py-2 px-3 truncate max-w-[120px]">{srcIp}</td>
                    <td className="py-2 px-3 truncate max-w-[120px]">{dstIp}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border ${getBadgeClass(
                          step.protocolName,
                          step.status
                        )}`}
                      >
                        {step.protocolName}
                      </span>
                    </td>
                    <td className="py-2 px-3 truncate max-w-[320px]">{step.arrowLabel}</td>
                    <td className="py-2 px-3 text-right text-[var(--pe-text-muted)]">
                      {sizeFormatted}
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
