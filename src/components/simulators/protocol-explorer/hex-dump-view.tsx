"use client";

import React, { useMemo } from "react";
import { Binary } from "lucide-react";
import type { HexDumpViewProps } from "./types";
import {
  buildHexRows,
  isOffsetInRange,
  parseRawHexToBytes,
} from "@/lib/protocols/hex-utils";

export function HexDumpView({
  rawHex,
  selectedRange,
  hoveredRange,
  bytesPerRow = 16,
}: HexDumpViewProps) {
  const bytes = useMemo(() => parseRawHexToBytes(rawHex), [rawHex]);
  const rows = useMemo(() => buildHexRows(bytes, bytesPerRow), [bytes, bytesPerRow]);

  const activeRange = hoveredRange ?? selectedRange;

  return (
    <div className="protocol-hex-dump-container flex flex-col h-full rounded-xl border border-[#1a253c] bg-[#070b14] overflow-hidden font-mono text-xs text-slate-200 shadow-inner">
      <div className="flex items-center justify-between border-b border-[#1a253c] bg-[#0b1222] px-3 py-2 text-xs font-semibold text-slate-400">
        <div className="flex items-center gap-1.5">
          <Binary size={14} className="text-cyan-400" />
          <span>Raw Packet Hex Dump</span>
        </div>
        <span className="text-[11px] text-[var(--text-muted)]">
          {bytes.length} bytes total
        </span>
      </div>

      <div className="p-3 overflow-x-auto overflow-y-auto flex-1 select-text">
        <div className="min-w-fit space-y-1">
          {rows.map((row) => (
            <div key={row.rowOffset} className="flex items-center gap-4 hover:bg-white/5 px-1 rounded">
              {/* Offset Gutter */}
              <span className="text-gray-500 w-12 select-none">
                {row.formattedOffset}
              </span>

              {/* Hex Bytes */}
              <div className="flex items-center gap-1.5">
                {row.bytes.map((b) => {
                  const isHighlighted = isOffsetInRange(b.offset, activeRange);

                  return (
                    <span
                      key={b.offset}
                      className={`px-0.5 rounded transition-colors ${
                        isHighlighted
                          ? "bg-cyan-500 text-black font-bold shadow-sm"
                          : "text-gray-300 hover:text-white"
                      }`}
                      title={`Byte offset: ${b.offset} (0x${b.offset.toString(16)})`}
                    >
                      {b.hex}
                    </span>
                  );
                })}
                {/* Pad empty space if last row has fewer bytes */}
                {row.bytes.length < bytesPerRow &&
                  Array.from({ length: bytesPerRow - row.bytes.length }).map((_, idx) => (
                    <span key={idx} className="w-5 select-none opacity-0">
                      ..
                    </span>
                  ))}
              </div>

              {/* ASCII representation */}
              <div className="flex items-center border-l border-gray-700/50 pl-3 text-gray-400 select-none">
                {row.bytes.map((b) => {
                  const isHighlighted = isOffsetInRange(b.offset, activeRange);

                  return (
                    <span
                      key={b.offset}
                      className={`${
                        isHighlighted ? "bg-cyan-500/30 text-cyan-200 font-bold" : ""
                      }`}
                    >
                      {b.ascii}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
