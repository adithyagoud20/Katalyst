"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight, Layers, Bot } from "lucide-react";
import type { PacketInspectorProps } from "./types";

export function PacketInspector({
  currentStep,
  selectedFieldRange,
  hoveredFieldRange,
  onSelectField,
  onHoverField,
  onAskKat,
}: PacketInspectorProps) {
  const [collapsedLayers, setCollapsedLayers] = useState<Record<string, boolean>>({});

  if (!currentStep) {
    return (
      <div className="protocol-packet-inspector p-6 text-center text-xs text-[var(--pe-text-muted)] bg-[var(--pe-surface)] rounded-xl border border-[var(--pe-border)]">
        Select a packet to inspect its decoded fields and raw bytes.
      </div>
    );
  }

  const toggleLayer = (layerName: string) => {
    setCollapsedLayers((prev) => ({
      ...prev,
      [layerName]: !prev[layerName],
    }));
  };

  return (
    <div className="protocol-packet-inspector flex flex-col h-full rounded-xl border border-[var(--pe-border)] bg-[var(--pe-surface)] overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--pe-border)] bg-[var(--pe-surface-alt)] px-3.5 py-2 text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-[var(--pe-text)]">
          <Layers size={14} className="text-[var(--pe-accent-text)]" />
          <span>Fields</span>
        </div>
        <span className="text-[11px] font-mono text-[var(--pe-text-muted)] truncate max-w-[240px]">
          {currentStep.protocolName} · {currentStep.arrowLabel}
        </span>
      </div>

      <div className="p-2.5 overflow-y-auto space-y-2 flex-1 max-h-[380px]">
        {currentStep.layers.map((layer) => {
          const hasSelectedInLayer =
            selectedFieldRange !== null &&
            layer.fields.some(
              (f) =>
                f.byteRange[0] === selectedFieldRange[0] &&
                f.byteRange[1] === selectedFieldRange[1]
            );
          const isCollapsed = collapsedLayers[layer.name] && !hasSelectedInLayer;
          const layerByteSpan =
            layer.fields.length > 0
              ? `${Math.max(...layer.fields.map((f) => f.byteRange[1])) -
                  Math.min(...layer.fields.map((f) => f.byteRange[0]))} B`
              : "";

          return (
            <div
              key={layer.name}
              className="rounded-lg border border-[var(--pe-border)] bg-[var(--pe-surface)] overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggleLayer(layer.name)}
                aria-expanded={!isCollapsed}
                className="w-full flex items-center justify-between px-3 py-2 text-left bg-[var(--pe-surface-alt)] hover:bg-[var(--pe-surface-inset)] transition-colors text-xs font-semibold text-[var(--pe-text)]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {isCollapsed ? (
                    <ChevronRight size={14} className="shrink-0 text-[var(--pe-text-muted)]" />
                  ) : (
                    <ChevronDown size={14} className="shrink-0 text-[var(--pe-text-muted)]" />
                  )}
                  <span className="truncate">{layer.name}</span>
                </div>
                <span className="text-[10px] font-mono text-[var(--pe-text-muted)] shrink-0 ml-2">
                  {layerByteSpan || layer.layer.toUpperCase()}
                </span>
              </button>

              {!isCollapsed && (
                <div className="divide-y divide-[var(--pe-border)] p-1">
                  {layer.fields.map((field) => {
                    const isSelected =
                      selectedFieldRange !== null &&
                      selectedFieldRange[0] === field.byteRange[0] &&
                      selectedFieldRange[1] === field.byteRange[1];

                    const isHovered =
                      hoveredFieldRange !== null &&
                      hoveredFieldRange[0] === field.byteRange[0] &&
                      hoveredFieldRange[1] === field.byteRange[1];

                    return (
                      <div
                        key={`${layer.name}-${field.name}-${field.byteRange[0]}`}
                        className={`group p-2 rounded-md text-xs transition-colors ${
                          isSelected
                            ? "bg-[var(--pe-orange-soft)] border-l-2 border-[var(--pe-orange)]"
                            : isHovered
                            ? "bg-[var(--pe-surface-alt)]"
                            : "hover:bg-[var(--pe-surface-alt)]"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => onSelectField(field)}
                          onMouseEnter={() => onHoverField(field.byteRange)}
                          onMouseLeave={() => onHoverField(null)}
                          aria-pressed={isSelected}
                          className="w-full text-left cursor-pointer"
                        >
                          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                            <span className="font-semibold text-[var(--pe-text)] shrink-0">
                              {field.name}
                            </span>
                            <span className="font-mono text-[var(--pe-accent-text)] font-medium text-right break-words min-w-0">
                              {field.value}
                            </span>
                          </div>

                          <div className="flex items-start justify-between gap-2 mt-1 text-[11px] text-[var(--pe-text-muted)]">
                            <span className="leading-snug">{field.description}</span>
                            <span className="font-mono text-[10px] shrink-0 text-[var(--pe-orange)]">
                              [{field.byteRange[0]}..{field.byteRange[1] - 1}]
                            </span>
                          </div>
                        </button>

                        {onAskKat && (
                          <div className="pt-1.5 flex justify-end">
                            <button
                              type="button"
                              onClick={() => onAskKat(field, currentStep)}
                              className="inline-flex items-center gap-1 rounded-md bg-[var(--pe-accent-soft)] border border-[var(--pe-accent)]/25 px-2 py-0.5 text-[10px] font-medium text-[var(--pe-accent-text)] hover:border-[var(--pe-accent)]/60 transition-colors"
                              title={`Ask Kat AI about ${field.name}`}
                            >
                              <Bot size={11} />
                              <span>Ask Kat about {field.name}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
