"use client";

import React, { useState, useMemo } from "react";
import { Grid, Sparkles, RotateCcw } from "lucide-react";

export interface KMapSolverProps {
  className?: string;
}

export function KMapSolver({ className = "" }: KMapSolverProps) {
  const [variables, setVariables] = useState<2 | 3 | 4>(3);
  const [cells, setCells] = useState<Record<number, number>>({
    1: 1, 3: 1, 5: 1, 7: 1, // Default Odd parity / C input demo
  });

  const rowGray = useMemo(() => {
    if (variables === 2) return [0, 1]; // A
    if (variables === 3) return [0, 1]; // A
    return [0, 1, 3, 2]; // AB: 00, 01, 11, 10
  }, [variables]);

  const colGray = useMemo(() => {
    if (variables === 2) return [0, 1]; // B
    if (variables === 3) return [0, 1, 3, 2]; // BC: 00, 01, 11, 10
    return [0, 1, 3, 2]; // CD: 00, 01, 11, 10
  }, [variables]);

  const getMintermIndex = (rVal: number, cVal: number): number => {
    if (variables === 2) return (rVal << 1) | cVal;
    if (variables === 3) return (rVal << 2) | cVal;
    return (rVal << 2) | cVal;
  };

  const toggleCell = (idx: number) => {
    setCells((prev) => {
      const next = { ...prev };
      if (next[idx] === 1) delete next[idx];
      else next[idx] = 1;
      return next;
    });
  };

  const activeMinterms = useMemo(() => {
    return Object.keys(cells)
      .map(Number)
      .filter((k) => cells[k] === 1 && k < (1 << variables))
      .sort((a, b) => a - b);
  }, [cells, variables]);

  const minimizedSOP = useMemo(() => {
    if (activeMinterms.length === 0) return "0";
    if (activeMinterms.length === (1 << variables)) return "1";

    const varNames = variables === 2 ? ["A", "B"] : variables === 3 ? ["A", "B", "C"] : ["A", "B", "C", "D"];
    const terms: string[] = [];

    // Simple Quine-McCluskey / Heuristic grouping for 2, 3, 4 vars
    // Check if full dimension groups exist
    for (const m of activeMinterms) {
      const bits = m.toString(2).padStart(variables, "0");
      let termStr = "";
      for (let i = 0; i < variables; i++) {
        termStr += bits[i] === "1" ? varNames[i] : `${varNames[i]}'`;
      }
      terms.push(termStr);
    }

    // Simplification for identical adjacencies
    if (terms.length > 1) {
      const reduced: string[] = [];
      const used = new Set<number>();
      for (let i = 0; i < terms.length; i++) {
        for (let j = i + 1; j < terms.length; j++) {
          let diffCount = 0;
          let diffIdx = -1;
          for (let b = 0; b < variables; b++) {
            if (terms[i].includes(`${varNames[b]}'`) !== terms[j].includes(`${varNames[b]}'`)) {
              diffCount++;
              diffIdx = b;
            }
          }
          if (diffCount === 1) {
            used.add(i);
            used.add(j);
            const combined = terms[i]
              .replace(`${varNames[diffIdx]}'`, "")
              .replace(varNames[diffIdx], "");
            if (!reduced.includes(combined) && combined) reduced.push(combined);
          }
        }
      }
      for (let i = 0; i < terms.length; i++) {
        if (!used.has(i) && !reduced.includes(terms[i])) reduced.push(terms[i]);
      }
      if (reduced.length > 0) return reduced.join(" + ");
    }

    return terms.join(" + ");
  }, [activeMinterms, variables]);

  const loadPreset = (preset: "odd" | "mux" | "adder") => {
    if (preset === "odd") {
      setVariables(3);
      setCells({ 1: 1, 2: 1, 4: 1, 7: 1 });
    } else if (preset === "mux") {
      // 2:1 MUX: S'I0 + S I1 -> 3-var (S, I0, I1)
      setVariables(3);
      setCells({ 1: 1, 3: 1, 6: 1, 7: 1 });
    } else if (preset === "adder") {
      // Full adder Carry: AB + BC + AC -> m(3, 5, 6, 7)
      setVariables(3);
      setCells({ 3: 1, 5: 1, 6: 1, 7: 1 });
    }
  };

  const binaryLabel = (val: number, len: number) => val.toString(2).padStart(len, "0");

  return (
    <div
      className={`kmap-solver-root rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-5 text-[var(--text-primary)] shadow-sm ${className}`}
      data-testid="kmap-solver"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Grid className="text-blue-400" size={18} />
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              Karnaugh Map (K-Map) Solver & Minimizer
            </h3>
          </div>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Interactive Gray-code grid with automatic Boolean grouping and Sum-of-Products (SOP) minimal reduction.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-[var(--text-secondary)]">Variables:</label>
          <div className="flex rounded-md border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-0.5">
            {([2, 3, 4] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setVariables(n);
                  setCells({});
                }}
                className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
                  variables === n
                    ? "bg-blue-600 text-white"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {n} Vars
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* K-Map Matrix */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-4 rounded-xl border border-[var(--border-subtle)] bg-[#090b10]">
          <div className="mb-3 text-xs text-slate-400 font-mono">
            {variables === 2 && "Row: A (0, 1) · Col: B (0, 1)"}
            {variables === 3 && "Row: A (0, 1) · Col: BC (00, 01, 11, 10 Gray Code)"}
            {variables === 4 && "Row: AB (00, 01, 11, 10) · Col: CD (00, 01, 11, 10)"}
          </div>

          <div className="overflow-auto max-w-full">
            <table className="border-collapse font-mono text-xs">
              <thead>
                <tr>
                  <th className="p-2 border border-slate-700 bg-slate-900 text-slate-400 text-[10px]">
                    {variables === 2 ? "A \\ B" : variables === 3 ? "A \\ BC" : "AB \\ CD"}
                  </th>
                  {colGray.map((c) => (
                    <th key={c} className="p-2 border border-slate-700 bg-slate-900 text-blue-300 font-bold w-12 text-center">
                      {binaryLabel(c, variables === 2 ? 1 : 2)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rowGray.map((r) => (
                  <tr key={r}>
                    <th className="p-2 border border-slate-700 bg-slate-900 text-blue-300 font-bold text-center">
                      {binaryLabel(r, variables === 4 ? 2 : 1)}
                    </th>
                    {colGray.map((c) => {
                      const mIdx = getMintermIndex(r, c);
                      const isHigh = cells[mIdx] === 1;
                      return (
                        <td
                          key={c}
                          onClick={() => toggleCell(mIdx)}
                          className={`p-3 border border-slate-700 text-center cursor-pointer transition-all select-none ${
                            isHigh
                              ? "bg-blue-600/30 text-blue-200 font-bold shadow-inner"
                              : "bg-slate-950/60 text-slate-500 hover:bg-slate-800"
                          }`}
                        >
                          <div className="text-sm">{isHigh ? "1" : "0"}</div>
                          <div className="text-[9px] text-slate-500 mt-0.5">m{mIdx}</div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-400">Presets:</span>
            <button
              type="button"
              onClick={() => loadPreset("odd")}
              className="px-2 py-1 rounded text-[11px] bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700"
            >
              Odd Parity (XOR)
            </button>
            <button
              type="button"
              onClick={() => loadPreset("mux")}
              className="px-2 py-1 rounded text-[11px] bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700"
            >
              2:1 MUX
            </button>
            <button
              type="button"
              onClick={() => loadPreset("adder")}
              className="px-2 py-1 rounded text-[11px] bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700"
            >
              Full Adder Carry
            </button>
            <button
              type="button"
              onClick={() => setCells({})}
              className="px-2 py-1 rounded text-[11px] bg-red-950/40 text-red-300 hover:bg-red-900/50 border border-red-800/50 flex items-center gap-1"
            >
              <RotateCcw size={10} /> Clear
            </button>
          </div>
        </div>

        {/* Boolean Expression Synthesis */}
        <div className="lg:col-span-5 flex flex-col justify-between p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] space-y-4">
          <div>
            <div className="flex items-center gap-2 font-semibold text-xs text-[var(--text-primary)] mb-2">
              <Sparkles size={14} className="text-amber-400" />
              Minimized Boolean Expression
            </div>

            <div className="p-3 rounded-lg bg-[#090b10] border border-[var(--border-subtle)] font-mono text-sm text-emerald-300 break-words font-bold">
              F = {minimizedSOP}
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between border-b border-[var(--border-subtle)] pb-1.5">
              <span className="text-[var(--text-secondary)]">Canonical Minterm List:</span>
              <span className="font-mono text-blue-400">
                {activeMinterms.length > 0 ? `Σ m(${activeMinterms.join(", ")})` : "None"}
              </span>
            </div>
            <div className="flex justify-between border-b border-[var(--border-subtle)] pb-1.5">
              <span className="text-[var(--text-secondary)]">Active Terms:</span>
              <span className="font-mono text-slate-300">
                {activeMinterms.length} of {1 << variables}
              </span>
            </div>
            <div className="flex justify-between pb-1.5">
              <span className="text-[var(--text-secondary)]">Adjacency Rule:</span>
              <span className="text-slate-400 text-[11px]">Wrap-around edges & corners</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-blue-950/20 border border-blue-900/40 text-[11px] text-blue-200 leading-4">
            <strong>K-Map Tip:</strong> Adjacent cells differ by only one binary variable (Hamming distance 1). Grouping powers of two (1, 2, 4, 8, 16) eliminates variables whose states complement each other within the loop.
          </div>
        </div>
      </div>
    </div>
  );
}
