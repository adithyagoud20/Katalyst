"use client";

import React, { useState } from "react";

export type CircuitSimulatorMode = "digital" | "analog";

export interface CircuitSimulatorProps {
  initialMode?: CircuitSimulatorMode;
  initialGate?: "AND" | "OR" | "NOT" | "NAND" | "NOR" | "XOR";
  className?: string;
}

export function CircuitSimulator({
  initialMode = "digital",
  initialGate = "AND",
  className = "",
}: CircuitSimulatorProps) {
  const [mode, setMode] = useState<CircuitSimulatorMode>(initialMode);

  // Digital state
  const [selectedGate, setSelectedGate] = useState<"AND" | "OR" | "NOT" | "NAND" | "NOR" | "XOR">(initialGate);
  const [inputA, setInputA] = useState<number>(0);
  const [inputB, setInputB] = useState<number>(0);

  // Analog state (Ohm's Law & RC)
  const [voltage, setVoltage] = useState<number>(5.0); // Volts
  const [resistance, setResistance] = useState<number>(1000); // Ohms
  const [capacitance, setCapacitance] = useState<number>(100); // Microfarads (uF)

  // Digital evaluation
  const evaluateGate = (gate: string, a: number, b: number): number => {
    switch (gate) {
      case "AND":
        return a && b ? 1 : 0;
      case "OR":
        return a || b ? 1 : 0;
      case "NOT":
        return !a ? 1 : 0;
      case "NAND":
        return !(a && b) ? 1 : 0;
      case "NOR":
        return !(a || b) ? 1 : 0;
      case "XOR":
        return a ^ b ? 1 : 0;
      default:
        return 0;
    }
  };

  const digitalOutput = evaluateGate(selectedGate, inputA, inputB);

  // Analog calculations
  const currentAmps = resistance > 0 ? voltage / resistance : 0;
  const powerWatts = voltage * currentAmps;
  const tauSeconds = (resistance * (capacitance * 1e-6)); // tau = R * C

  // SVG wave points for RC Charging curve
  const generateRCCurve = (): string => {
    const points: string[] = [];
    const width = 280;
    const height = 100;
    // V(t) = V0 * (1 - e^(-t / tau))
    for (let x = 0; x <= width; x += 5) {
      const normalizedTime = (x / width) * 5; // 0 to 5 tau
      const vNormalized = 1 - Math.exp(-normalizedTime);
      const y = height - (vNormalized * (height - 10) + 5);
      points.push(`${x},${y.toFixed(1)}`);
    }
    return points.join(" ");
  };

  const truthTableRows = selectedGate === "NOT"
    ? [
        { a: 0, b: "-", out: 1 },
        { a: 1, b: "-", out: 0 },
      ]
    : [
        { a: 0, b: 0, out: evaluateGate(selectedGate, 0, 0) },
        { a: 0, b: 1, out: evaluateGate(selectedGate, 0, 1) },
        { a: 1, b: 0, out: evaluateGate(selectedGate, 1, 0) },
        { a: 1, b: 1, out: evaluateGate(selectedGate, 1, 1) },
      ];

  return (
    <div
      className={`rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-5 text-[var(--text-primary)] shadow-sm ${className}`}
      data-testid="circuit-simulator"
    >
      {/* Header & Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            <h3 className="text-base font-semibold tracking-tight text-[var(--text-primary)]">
              Interactive Circuit & Logic Simulator
            </h3>
          </div>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Explore digital logic gates, truth tables, and analog Ohm&apos;s Law / RC transient waveforms.
          </p>
        </div>

        <div className="flex items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-1">
          <button
            type="button"
            onClick={() => setMode("digital")}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              mode === "digital"
                ? "bg-blue-600 text-white"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Digital Logic
          </button>
          <button
            type="button"
            onClick={() => setMode("analog")}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              mode === "analog"
                ? "bg-blue-600 text-white"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Analog RC & Ohm
          </button>
        </div>
      </div>

      {mode === "digital" ? (
        /* DIGITAL LOGIC SIMULATOR */
        <div className="mt-4 space-y-4">
          {/* Gate Selector Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-[var(--text-muted)] mr-1">Gate:</span>
            {(["AND", "OR", "NOT", "NAND", "NOR", "XOR"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setSelectedGate(g)}
                className={`rounded px-2.5 py-1 text-xs font-mono font-medium transition-colors ${
                  selectedGate === g
                    ? "bg-blue-600 text-white"
                    : "bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]"
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* Interactive Inputs & Canvas */}
            <div className="md:col-span-2 rounded-lg border border-[var(--border-subtle)] bg-[#0d1117] p-5">
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-4">
                <span>Interactive Schematic</span>
                <span className="font-mono">Output: {digitalOutput === 1 ? "HIGH (1)" : "LOW (0)"}</span>
              </div>

              {/* Schematic SVG */}
              <div className="flex items-center justify-center gap-6 py-4">
                {/* Switches */}
                <div className="flex flex-col gap-4">
                  <button
                    type="button"
                    onClick={() => setInputA((v) => (v === 1 ? 0 : 1))}
                    className={`flex items-center gap-2 rounded px-3 py-2 text-xs font-mono font-bold transition-all border ${
                      inputA === 1
                        ? "bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/20"
                        : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white"
                    }`}
                  >
                    <span>Input A:</span>
                    <span className="text-sm">{inputA}</span>
                  </button>

                  {selectedGate !== "NOT" && (
                    <button
                      type="button"
                      onClick={() => setInputB((v) => (v === 1 ? 0 : 1))}
                      className={`flex items-center gap-2 rounded px-3 py-2 text-xs font-mono font-bold transition-all border ${
                        inputB === 1
                          ? "bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/20"
                          : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white"
                      }`}
                    >
                      <span>Input B:</span>
                      <span className="text-sm">{inputB}</span>
                    </button>
                  )}
                </div>

                {/* Gate SVG Symbol */}
                <div className="relative flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 px-6 py-5">
                  <div className="text-center font-mono">
                    <div className="text-xl font-black text-blue-400 tracking-wider">
                      [{selectedGate}]
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-1 uppercase">Logic Gate</div>
                  </div>
                </div>

                {/* Output LED */}
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`h-12 w-12 rounded-full border-2 flex items-center justify-center font-mono font-bold text-sm transition-all ${
                      digitalOutput === 1
                        ? "bg-blue-500 border-blue-300 text-white shadow-xl shadow-blue-500/50 animate-pulse"
                        : "bg-zinc-900 border-zinc-700 text-zinc-600"
                    }`}
                  >
                    {digitalOutput}
                  </div>
                  <span className="text-[11px] font-mono text-zinc-400">LED OUT</span>
                </div>
              </div>
            </div>

            {/* Live Truth Table */}
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)] mb-2">
                Live Truth Table ({selectedGate})
              </div>
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] text-left">
                    <th className="py-1">A</th>
                    {selectedGate !== "NOT" && <th className="py-1">B</th>}
                    <th className="py-1 text-right">OUT</th>
                  </tr>
                </thead>
                <tbody>
                  {truthTableRows.map((row, idx) => {
                    const isActive =
                      selectedGate === "NOT"
                        ? row.a === inputA
                        : row.a === inputA && row.b === inputB;
                    return (
                      <tr
                        key={idx}
                        className={`transition-colors border-b border-[var(--border-subtle)]/40 ${
                          isActive
                            ? "bg-blue-600/20 text-blue-400 font-bold"
                            : "text-[var(--text-secondary)]"
                        }`}
                      >
                        <td className="py-1.5">{row.a}</td>
                        {selectedGate !== "NOT" && <td className="py-1.5">{row.b}</td>}
                        <td className="py-1.5 text-right">{row.out}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ANALOG RC & OHM'S LAW SIMULATOR */
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sliders & Controls */}
            <div className="space-y-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-4">
              <div>
                <div className="flex justify-between text-xs font-medium text-[var(--text-primary)] mb-1">
                  <span>DC Voltage (V):</span>
                  <span className="font-mono text-blue-400">{voltage.toFixed(1)} V</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="24"
                  step="0.5"
                  value={voltage}
                  onChange={(e) => setVoltage(parseFloat(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-[var(--text-primary)] mb-1">
                  <span>Resistance (R):</span>
                  <span className="font-mono text-blue-400">{resistance} Ω</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="10000"
                  step="100"
                  value={resistance}
                  onChange={(e) => setResistance(parseInt(e.target.value, 10))}
                  className="w-full accent-blue-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-[var(--text-primary)] mb-1">
                  <span>Capacitance (C):</span>
                  <span className="font-mono text-blue-400">{capacitance} µF</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="1000"
                  step="10"
                  value={capacitance}
                  onChange={(e) => setCapacitance(parseInt(e.target.value, 10))}
                  className="w-full accent-blue-600"
                />
              </div>

              {/* Physical Readouts */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--border-subtle)] text-center font-mono">
                <div className="rounded bg-[var(--surface-primary)] p-2 border border-[var(--border-subtle)]">
                  <div className="text-[10px] text-[var(--text-muted)] uppercase">Current (I)</div>
                  <div className="text-xs font-bold text-[var(--text-primary)] mt-0.5">
                    {(currentAmps * 1000).toFixed(1)} mA
                  </div>
                </div>
                <div className="rounded bg-[var(--surface-primary)] p-2 border border-[var(--border-subtle)]">
                  <div className="text-[10px] text-[var(--text-muted)] uppercase">Power (P)</div>
                  <div className="text-xs font-bold text-[var(--text-primary)] mt-0.5">
                    {powerWatts.toFixed(3)} W
                  </div>
                </div>
                <div className="rounded bg-[var(--surface-primary)] p-2 border border-[var(--border-subtle)]">
                  <div className="text-[10px] text-[var(--text-muted)] uppercase">Time (τ)</div>
                  <div className="text-xs font-bold text-[var(--text-primary)] mt-0.5">
                    {tauSeconds.toFixed(3)} s
                  </div>
                </div>
              </div>
            </div>

            {/* SVG Transient Curve */}
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[#0d1117] p-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between text-xs text-zinc-400 mb-2">
                  <span>Capacitor Charging Curve (0 to 5τ)</span>
                  <span className="font-mono text-blue-400">V(τ) = {(voltage * 0.632).toFixed(2)} V</span>
                </div>
                <div className="relative h-32 w-full border border-zinc-800 rounded bg-zinc-950 p-2 flex items-center justify-center">
                  <svg viewBox="0 0 280 100" className="w-full h-full overflow-visible">
                    {/* Grid lines */}
                    <line x1="0" y1="20" x2="280" y2="20" stroke="#21262d" strokeDasharray="3 3" />
                    <line x1="0" y1="50" x2="280" y2="50" stroke="#21262d" strokeDasharray="3 3" />
                    <line x1="0" y1="80" x2="280" y2="80" stroke="#21262d" strokeDasharray="3 3" />
                    <line x1="56" y1="0" x2="56" y2="100" stroke="#21262d" strokeDasharray="3 3" />
                    {/* Exponential Charging Curve */}
                    <polyline
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2.5"
                      points={generateRCCurve()}
                    />
                  </svg>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-zinc-400 flex justify-between font-mono">
                <span>t = 0s (0V)</span>
                <span>t = 1τ (63.2%)</span>
                <span>t = 5τ ({voltage.toFixed(1)}V)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
