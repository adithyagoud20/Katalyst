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
  // Collapsible state for each layer
  const [collapsedLayers, setCollapsedLayers] = useState<Record<string, boolean>>({});

  if (!currentStep) {
    return (
      <div className="p-6 text-center text-xs text-slate-400 bg-[#0b1222] rounded-xl border border-[#1a253c]">
        No packet selected. Play or click a step in the sequence.
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
    <div className="protocol-packet-inspector flex flex-col h-full rounded-xl border border-[#1a253c] bg-[#0b1222] overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#1a253c] bg-[#0e1628] px-3 py-2 text-xs font-semibold text-slate-300">
        <div className="flex items-center gap-1.5">
          <Layers size={14} className="text-blue-400" />
          <span>Packet Tree Details</span>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          {currentStep.protocolName} ({currentStep.arrowLabel})
        </span>
      </div>

      <div className="p-3 overflow-y-auto space-y-3 flex-1 max-h-[380px]">
        {currentStep.layers.map((layer) => {
          const isCollapsed = collapsedLayers[layer.name];

          return (
            <div
              key={layer.name}
              className="rounded-lg border border-[#1a253c] bg-[#0d162a] overflow-hidden"
            >
              {/* Layer Header */}
              <button
                type="button"
                onClick={() => toggleLayer(layer.name)}
                className="w-full flex items-center justify-between px-3 py-2 text-left bg-[#101b33] hover:bg-[#162547] transition-colors text-xs font-semibold text-slate-200"
              >
                <div className="flex items-center gap-2">
                  {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                  <span>{layer.name}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  {layer.layer}
                </span>
              </button>

              {/* Layer Fields */}
              {!isCollapsed && (
                <div className="divide-y divide-[#1a253c]/60 p-1">
                  {layer.fields.map((field) => {
                    const isSelected =
                      selectedFieldRange &&
                      selectedFieldRange[0] === field.byteRange[0] &&
                      selectedFieldRange[1] === field.byteRange[1];

                    const isHovered =
                      hoveredFieldRange &&
                      hoveredFieldRange[0] === field.byteRange[0] &&
                      hoveredFieldRange[1] === field.byteRange[1];

                    return (
                      <div
                        key={field.name}
                        onClick={() => onSelectField(field)}
                        onMouseEnter={() => onHoverField(field.byteRange)}
                        onMouseLeave={() => onHoverField(null)}
                        className={`group p-2 rounded cursor-pointer text-xs transition-colors ${
                          isSelected
                            ? "bg-blue-600/25 text-blue-100 border-l-2 border-blue-400"
                            : isHovered
                            ? "bg-[#162547] text-white"
                            : "hover:bg-[#131f3b] text-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-200">
                            {field.name}:
                          </span>
                          <span className="font-mono text-blue-300 font-medium">
                            {field.value}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 mt-1 text-[11px] text-slate-400">
                          <span className="leading-snug">{field.description}</span>
                          <span className="font-mono text-[10px] shrink-0 text-cyan-400/80">
                            [{field.byteRange[0]}..{field.byteRange[1] - 1}]
                          </span>
                        </div>

                        {/* Ask Kat Contextual Button */}
                        {onAskKat && (
                          <div className="pt-1.5 opacity-90 group-hover:opacity-100 flex justify-end">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAskKat(field, currentStep);
                              }}
                              className="inline-flex items-center gap-1 rounded bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 text-[10px] font-medium text-blue-400 hover:bg-blue-500/25 hover:border-blue-500/50 transition-colors"
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
