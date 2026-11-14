"use client";

import React, { useState } from "react";
import { Cpu, Zap, Code } from "lucide-react";

export type CircuitSimulatorMode = "digital" | "analog" | "breadboard" | "arduino" | "esp32";

export interface CircuitSimulatorProps {
  initialMode?: CircuitSimulatorMode;
  initialGate?: "AND" | "OR" | "NOT" | "NAND" | "NOR" | "XOR";
  className?: string;
  hideModeSwitcher?: boolean;
}

export function CircuitSimulator({
  initialMode = "digital",
  initialGate = "AND",
  className = "",
  hideModeSwitcher = false,
}: CircuitSimulatorProps) {
  const [mode, setMode] = useState<"digital" | "analog" | "breadboard">(
    initialMode === "arduino" || initialMode === "esp32" ? "breadboard" : initialMode
  );
  const [mcuTarget, setMcuTarget] = useState<"arduino" | "esp32">(
    initialMode === "esp32" ? "esp32" : "arduino"
  );

  // Digital state
  const [selectedGate, setSelectedGate] = useState<"AND" | "OR" | "NOT" | "NAND" | "NOR" | "XOR">(initialGate);
  const [inputA, setInputA] = useState<number>(0);
  const [inputB, setInputB] = useState<number>(0);

  // Analog state (Ohm's Law & RC)
  const [voltage, setVoltage] = useState<number>(5.0); // Volts
  const [resistance, setResistance] = useState<number>(1000); // Ohms
  const [capacitance, setCapacitance] = useState<number>(100); // Microfarads (uF)
  const [pinD13, setPinD13] = useState<boolean>(true); // Red LED
  const [pinD12, setPinD12] = useState<boolean>(false); // Green LED
  const [pinD11, setPinD11] = useState<boolean>(false); // Blue LED
  const [buttonPressed, setButtonPressed] = useState<boolean>(false); // Digital Input D2
  const [analogValue, setAnalogValue] = useState<number>(512); // 10-bit: 0-1023 or 12-bit: 0-4095

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
  const tauSeconds = resistance * (capacitance * 1e-6); // tau = R * C

  // SVG wave points for RC Charging curve
  const generateRCCurve = (): string => {
    const points: string[] = [];
    const width = 280;
    const height = 100;
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

  // Breadboard calculations
  const mcuVcc = mcuTarget === "arduino" ? 5.0 : 3.3;
  const maxAdc = mcuTarget === "arduino" ? 1023 : 4095;
  const clampedAdc = Math.min(analogValue, maxAdc);
  const sensorVoltage = (clampedAdc / maxAdc) * mcuVcc;
  const ledForwardV = 2.0; // typical red/green LED drop
  const ledResistorR = 330; // 330 ohms
  const ledCurrentMa = (mcuVcc - ledForwardV) > 0 ? ((mcuVcc - ledForwardV) / ledResistorR) * 1000 : 0;

  // Generated Arduino/ESP32 C++ firmware
  const firmwareSnippet = `// ${mcuTarget === "arduino" ? "Arduino Uno (5V)" : "ESP32 DevKit (3.3V)"} Firmware
const int LED_RED = 13;
const int LED_GREEN = 12;
const int LED_BLUE = 11;
const int BUTTON_PIN = 2;
const int SENSOR_PIN = ${mcuTarget === "arduino" ? "A0" : "34"};

void setup() {
  Serial.begin(115200);
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_BLUE, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
}

void loop() {
  // GPIO Outputs: Red=${pinD13 ? "HIGH" : "LOW"}, Green=${pinD12 ? "HIGH" : "LOW"}, Blue=${pinD11 ? "HIGH" : "LOW"}
  digitalWrite(LED_RED, ${pinD13 ? "HIGH" : "LOW"});
  digitalWrite(LED_GREEN, ${pinD12 ? "HIGH" : "LOW"});
  digitalWrite(LED_BLUE, ${pinD11 ? "HIGH" : "LOW"});

  // Read Digital Input (Button: ${buttonPressed ? "PRESSED / LOW" : "RELEASED / HIGH"})
  bool pressed = (digitalRead(BUTTON_PIN) == LOW);

  // Read ADC Voltage (${clampedAdc}/${maxAdc} -> ${sensorVoltage.toFixed(2)}V)
  int rawADC = analogRead(SENSOR_PIN);
  float volts = (rawADC / ${(maxAdc).toFixed(1)}f) * ${mcuVcc.toFixed(1)}f;
  
  Serial.print("Sensor Volts: ");
  Serial.println(volts);
  delay(100);
}`;

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
              {hideModeSwitcher
                ? initialMode === "arduino"
                  ? "Interactive Circuit & Hardware Simulator — Arduino Uno Lab"
                  : initialMode === "esp32"
                  ? "Interactive Circuit & Hardware Simulator — ESP32 IoT Lab"
                  : initialMode === "breadboard"
                  ? "Interactive Circuit & Hardware Simulator — Breadboard Circuit Lab"
                  : "Interactive Circuit & Hardware Simulator — Digital Logic Gates"
                : "Interactive Circuit & Hardware Simulator"}
            </h3>
          </div>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            {hideModeSwitcher
              ? initialMode === "arduino"
                ? "Virtual Arduino Uno ATmega328P 5V breadboard prototyping, GPIO registers, and real-time C++ firmware."
                : initialMode === "esp32"
                ? "Virtual ESP32 DevKit 3.3V dual-core prototyping, GPIO bootstrap constraints, and FreeRTOS firmware."
                : initialMode === "breadboard"
                ? "Virtual solderless breadboard prototyping with power rails (5V / 3.3V), LEDs, and sensor dividers."
                : "Explore digital logic gates, interactive truth tables, and Boolean output states."
              : "Explore digital logic gates, analog Ohm's Law / RC transients, and virtual Arduino / ESP32 breadboard hardware."}
          </p>
        </div>

        {hideModeSwitcher ? (
          <div className="flex items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-1">
            {initialMode === "arduino" && (
              <button
                type="button"
                className="rounded px-2.5 py-1 text-xs font-semibold bg-blue-600 text-white flex items-center gap-1 cursor-default"
              >
                <Cpu size={12} /> Arduino Uno
              </button>
            )}
            {initialMode === "esp32" && (
              <button
                type="button"
                className="rounded px-2.5 py-1 text-xs font-semibold bg-blue-600 text-white flex items-center gap-1 cursor-default"
              >
                <Zap size={12} /> ESP32 IoT
              </button>
            )}
            {initialMode === "breadboard" && (
              <span className="rounded px-2.5 py-1 text-xs font-semibold bg-blue-600 text-white flex items-center gap-1">
                Breadboard Prototyping
              </span>
            )}
            {initialMode === "digital" && (
              <span className="rounded px-2.5 py-1 text-xs font-semibold bg-blue-600 text-white flex items-center gap-1">
                Digital Logic Gates
              </span>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-1 gap-1">
            <button
              type="button"
              onClick={() => setMode("digital")}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
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
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                mode === "analog"
                  ? "bg-blue-600 text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Analog RC
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("breadboard");
                setMcuTarget("arduino");
              }}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors flex items-center gap-1 ${
                mode === "breadboard" && mcuTarget === "arduino"
                  ? "bg-blue-600 text-white font-semibold"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Cpu size={12} /> Arduino Uno
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("breadboard");
                setMcuTarget("esp32");
              }}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors flex items-center gap-1 ${
                mode === "breadboard" && mcuTarget === "esp32"
                  ? "bg-blue-600 text-white font-semibold"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Zap size={12} /> ESP32 IoT
            </button>
          </div>
        )}
      </div>

      {mode === "digital" && (
        /* DIGITAL LOGIC SIMULATOR */
        <div className="mt-4 space-y-4">
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
            <div className="md:col-span-2 rounded-lg border border-[var(--border-subtle)] bg-[#0d1117] p-5">
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-4">
                <span>Interactive Schematic</span>
                <span className="font-mono">Output: {digitalOutput === 1 ? "HIGH (1)" : "LOW (0)"}</span>
              </div>

              <div className="flex items-center justify-center gap-6 py-4">
                <div className="flex flex-col gap-4">
                  <button
                    type="button"
                    onClick={() => setInputA(inputA === 1 ? 0 : 1)}
                    className={`flex items-center gap-2 rounded px-3 py-1.5 text-xs font-mono font-bold transition-all border ${
                      inputA === 1
                        ? "bg-emerald-600 text-white border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                        : "bg-zinc-800 text-zinc-400 border-zinc-700"
                    }`}
                  >
                    <span>Input A:</span>
                    <span>{inputA}</span>
                  </button>

                  {selectedGate !== "NOT" && (
                    <button
                      type="button"
                      onClick={() => setInputB(inputB === 1 ? 0 : 1)}
                      className={`flex items-center gap-2 rounded px-3 py-1.5 text-xs font-mono font-bold transition-all border ${
                        inputB === 1
                          ? "bg-emerald-600 text-white border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                          : "bg-zinc-800 text-zinc-400 border-zinc-700"
                      }`}
                    >
                      <span>Input B:</span>
                      <span>{inputB}</span>
                    </button>
                  )}
                </div>

                <div className="relative flex items-center justify-center p-4 rounded-xl border border-blue-500/30 bg-blue-950/20 text-blue-400 font-mono font-bold text-lg min-w-[90px] shadow-md">
                  {selectedGate}
                </div>

                <div className="flex items-center">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full font-mono font-bold text-sm border transition-all ${
                      digitalOutput === 1
                        ? "bg-emerald-500 text-white border-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.6)]"
                        : "bg-zinc-900 text-zinc-600 border-zinc-800"
                    }`}
                  >
                    {digitalOutput}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                Truth Table: {selectedGate}
              </h4>
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)]">
                    <th className="pb-1 text-left">A</th>
                    <th className="pb-1 text-left">B</th>
                    <th className="pb-1 text-right">OUT</th>
                  </tr>
                </thead>
                <tbody>
                  {truthTableRows.map((row, idx) => {
                    const isActive = row.a === inputA && (selectedGate === "NOT" || row.b === inputB);
                    return (
                      <tr
                        key={idx}
                        className={`border-b border-[var(--border-subtle)]/50 ${
                          isActive ? "bg-blue-600/15 font-bold text-blue-400" : "text-[var(--text-secondary)]"
                        }`}
                      >
                        <td className="py-1">{row.a}</td>
                        <td className="py-1">{row.b}</td>
                        <td className="py-1 text-right font-bold">{row.out}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {mode === "analog" && (
        /* ANALOG OHM & RC TRANSIENT SIMULATOR */
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Circuit Parameters
              </h4>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[var(--text-secondary)]">Supply Voltage (V)</span>
                  <span className="font-mono font-bold text-blue-400">{voltage.toFixed(1)} V</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="24"
                  step="0.5"
                  value={voltage}
                  onChange={(e) => setVoltage(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[var(--text-secondary)]">Resistance (R)</span>
                  <span className="font-mono font-bold text-blue-400">{resistance} Ω</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="10000"
                  step="100"
                  value={resistance}
                  onChange={(e) => setResistance(parseInt(e.target.value, 10))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[var(--text-secondary)]">Capacitance (C)</span>
                  <span className="font-mono font-bold text-blue-400">{capacitance} µF</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="1000"
                  step="10"
                  value={capacitance}
                  onChange={(e) => setCapacitance(parseInt(e.target.value, 10))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
            </div>

            <div className="md:col-span-2 rounded-lg border border-[var(--border-subtle)] bg-[#0d1117] p-4 flex flex-col justify-between">
              <div className="grid grid-cols-3 gap-2 border-b border-zinc-800 pb-3 text-center">
                <div>
                  <span className="block text-[10px] text-zinc-400 uppercase">Current (I)</span>
                  <span className="font-mono text-sm font-bold text-emerald-400">
                    {(currentAmps * 1000).toFixed(2)} mA
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-zinc-400 uppercase">Power (P)</span>
                  <span className="font-mono text-sm font-bold text-amber-400">
                    {(powerWatts * 1000).toFixed(1)} mW
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-zinc-400 uppercase">Time Constant (τ)</span>
                  <span className="font-mono text-sm font-bold text-cyan-400">
                    {(tauSeconds * 1000).toFixed(1)} ms
                  </span>
                </div>
              </div>

              <div className="my-3">
                <div className="text-xs text-zinc-400 mb-1 flex justify-between">
                  <span>Capacitor Voltage Transient: V(t) = V₀(1 - e^&#123;-t/τ&#125;)</span>
                  <span className="font-mono text-blue-400">RC Charge Curve</span>
                </div>
                <div className="relative h-32 w-full border border-zinc-800 rounded bg-zinc-950 p-2 flex items-center justify-center">
                  <svg viewBox="0 0 280 100" className="w-full h-full overflow-visible">
                    <line x1="0" y1="20" x2="280" y2="20" stroke="#21262d" strokeDasharray="3 3" />
                    <line x1="0" y1="50" x2="280" y2="50" stroke="#21262d" strokeDasharray="3 3" />
                    <line x1="0" y1="80" x2="280" y2="80" stroke="#21262d" strokeDasharray="3 3" />
                    <line x1="56" y1="0" x2="56" y2="100" stroke="#21262d" strokeDasharray="3 3" />
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

      {mode === "breadboard" && (
        /* BREADBOARD & MCU LAB SIMULATOR */
        <div className="mt-4 space-y-4">
          {/* Target Selection & Quick Stats */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--surface-secondary)] p-3 rounded-lg border border-[var(--border-subtle)]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Target Board:</span>
              <button
                type="button"
                onClick={() => {
                  setMcuTarget("arduino");
                  if (analogValue > 1023) setAnalogValue(512);
                }}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors border ${
                  mcuTarget === "arduino"
                    ? "bg-blue-600 text-white border-blue-500 font-semibold"
                    : "bg-[var(--surface-primary)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]"
                }`}
              >
                Arduino Uno (5V · 10-bit ADC)
              </button>
              <button
                type="button"
                onClick={() => setMcuTarget("esp32")}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors border ${
                  mcuTarget === "esp32"
                    ? "bg-blue-600 text-white border-blue-500 font-semibold"
                    : "bg-[var(--surface-primary)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]"
                }`}
              >
                ESP32 (3.3V · 12-bit ADC)
              </button>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-zinc-400">VCC: <strong className="text-blue-400">{mcuVcc.toFixed(1)}V</strong></span>
              <span className="text-zinc-400">ADC Res: <strong className="text-blue-400">{maxAdc === 1023 ? "10-bit (0-1023)" : "12-bit (0-4095)"}</strong></span>
              <span className="text-zinc-400">LED Current: <strong className="text-emerald-400">{ledCurrentMa.toFixed(1)} mA</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left Controls & Virtual Breadboard Visualizer */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              {/* Virtual Breadboard SVG */}
              <div className="rounded-xl border border-zinc-800 bg-[#0b0f19] p-4 shadow-inner">
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-3 border-b border-zinc-800 pb-2">
                  <span className="font-semibold text-zinc-300">Solderless Breadboard &amp; Microcontroller Wiring</span>
                  <span className="font-mono text-emerald-400 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Simulation
                  </span>
                </div>

                <div className="relative flex items-center justify-center p-3 bg-zinc-950 rounded-lg border border-zinc-900 overflow-x-auto">
                  <svg viewBox="0 0 540 220" className="w-full max-w-[540px] h-auto select-none">
                    {/* Breadboard Base Frame */}
                    <rect x="10" y="10" width="520" height="200" rx="10" fill="#181c24" stroke="#2a3242" strokeWidth="2" />
                    
                    {/* Power Rails (+ / -) Top */}
                    <line x1="30" y1="28" x2="510" y2="28" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="6 3" />
                    <line x1="30" y1="38" x2="510" y2="38" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="6 3" />
                    <text x="18" y="31" fill="#ef4444" fontSize="10" fontWeight="bold">+</text>
                    <text x="18" y="41" fill="#3b82f6" fontSize="10" fontWeight="bold">-</text>

                    {/* Tie Points Matrix (Decorative holes) */}
                    {Array.from({ length: 24 }).map((_, col) => (
                      <g key={col}>
                        <circle cx={45 + col * 20} cy={60} r="2.5" fill="#0d1117" stroke="#374151" strokeWidth="0.5" />
                        <circle cx={45 + col * 20} cy={72} r="2.5" fill="#0d1117" stroke="#374151" strokeWidth="0.5" />
                        <circle cx={45 + col * 20} cy={84} r="2.5" fill="#0d1117" stroke="#374151" strokeWidth="0.5" />
                        <circle cx={45 + col * 20} cy={96} r="2.5" fill="#0d1117" stroke="#374151" strokeWidth="0.5" />
                        {/* Divider */}
                        <circle cx={45 + col * 20} cy={124} r="2.5" fill="#0d1117" stroke="#374151" strokeWidth="0.5" />
                        <circle cx={45 + col * 20} cy={136} r="2.5" fill="#0d1117" stroke="#374151" strokeWidth="0.5" />
                        <circle cx={45 + col * 20} cy={148} r="2.5" fill="#0d1117" stroke="#374151" strokeWidth="0.5" />
                        <circle cx={45 + col * 20} cy={160} r="2.5" fill="#0d1117" stroke="#374151" strokeWidth="0.5" />
                      </g>
                    ))}
                    {/* Center Divider Groove */}
                    <rect x="25" y="106" width="490" height="8" rx="2" fill="#0f131a" />

                    {/* MCU Chip Representation (Left) */}
                    <rect x="40" y="70" width="100" height="80" rx="4" fill="#090d16" stroke="#38bdf8" strokeWidth="1.5" />
                    <text x="90" y="105" fill="#f8fafc" fontSize="11" fontWeight="bold" textAnchor="middle">
                      {mcuTarget === "arduino" ? "ATmega328P" : "ESP32-WROOM"}
                    </text>
                    <text x="90" y="122" fill="#94a3b8" fontSize="9" textAnchor="middle">
                      {mcuTarget === "arduino" ? "Arduino Core" : "Xtensa Dual-Core"}
                    </text>

                    {/* LED 1: Red on D13 */}
                    <line x1="140" y1="84" x2="200" y2="84" stroke={pinD13 ? "#ef4444" : "#4b5563"} strokeWidth="2" />
                    {/* 330 Ohm Resistor */}
                    <rect x="200" y="80" width="30" height="8" rx="2" fill="#d97706" stroke="#b45309" strokeWidth="1" />
                    <line x1="230" y1="84" x2="260" y2="84" stroke={pinD13 ? "#ef4444" : "#4b5563"} strokeWidth="2" />
                    {/* Red LED Bulb */}
                    <circle
                      cx="275"
                      cy="84"
                      r="10"
                      fill={pinD13 ? "#ef4444" : "#451a1a"}
                      stroke={pinD13 ? "#fca5a5" : "#7f1d1d"}
                      strokeWidth="2"
                      style={pinD13 ? { filter: "drop-shadow(0px 0px 8px #ef4444)" } : undefined}
                    />
                    <text x="275" y="108" fill="#f8fafc" fontSize="9" textAnchor="middle" fontWeight="bold">D13 RED</text>

                    {/* LED 2: Green on D12 */}
                    <line x1="140" y1="96" x2="310" y2="96" stroke={pinD12 ? "#10b981" : "#4b5563"} strokeWidth="2" />
                    <rect x="310" y="92" width="30" height="8" rx="2" fill="#d97706" stroke="#b45309" strokeWidth="1" />
                    <line x1="340" y1="96" x2="370" y2="96" stroke={pinD12 ? "#10b981" : "#4b5563"} strokeWidth="2" />
                    {/* Green LED Bulb */}
                    <circle
                      cx="385"
                      cy="96"
                      r="10"
                      fill={pinD12 ? "#10b981" : "#064e3b"}
                      stroke={pinD12 ? "#6ee7b7" : "#065f46"}
                      strokeWidth="2"
                      style={pinD12 ? { filter: "drop-shadow(0px 0px 8px #10b981)" } : undefined}
                    />
                    <text x="385" y="120" fill="#f8fafc" fontSize="9" textAnchor="middle" fontWeight="bold">D12 GREEN</text>

                    {/* LED 3: Blue on D11 */}
                    <line x1="140" y1="130" x2="420" y2="130" stroke={pinD11 ? "#3b82f6" : "#4b5563"} strokeWidth="2" />
                    <rect x="420" y="126" width="30" height="8" rx="2" fill="#d97706" stroke="#b45309" strokeWidth="1" />
                    <line x1="450" y1="130" x2="480" y2="130" stroke={pinD11 ? "#3b82f6" : "#4b5563"} strokeWidth="2" />
                    {/* Blue LED Bulb */}
                    <circle
                      cx="495"
                      cy="130"
                      r="10"
                      fill={pinD11 ? "#3b82f6" : "#1e3a8a"}
                      stroke={pinD11 ? "#93c5fd" : "#1e40af"}
                      strokeWidth="2"
                      style={pinD11 ? { filter: "drop-shadow(0px 0px 8px #3b82f6)" } : undefined}
                    />
                    <text x="495" y="154" fill="#f8fafc" fontSize="9" textAnchor="middle" fontWeight="bold">D11 BLUE</text>

                    {/* Pushbutton & Pull-Up representation (Bottom) */}
                    <rect x="220" y="145" width="24" height="24" rx="3" fill="#27272a" stroke="#52525b" strokeWidth="1.5" />
                    <circle cx="232" cy="157" r="7" fill={buttonPressed ? "#22c55e" : "#71717a"} stroke="#a1a1aa" strokeWidth="1" />
                    <text x="232" y="182" fill="#a1a1aa" fontSize="8" textAnchor="middle">D2 BTN</text>

                    {/* Bottom Power Rail Ground */}
                    <line x1="30" y1="195" x2="510" y2="195" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="6 3" />
                    <text x="18" y="198" fill="#3b82f6" fontSize="10" fontWeight="bold">-</text>
                  </svg>
                </div>
              </div>

              {/* Hardware Interactivity Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Digital Output Pin Toggles */}
                <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-3 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                    Digital Outputs (GPIO)
                  </span>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setPinD13(!pinD13)}
                      className={`flex items-center justify-between p-2 rounded text-xs font-mono transition-colors border ${
                        pinD13
                          ? "bg-red-500/20 text-red-300 border-red-500/40 font-bold"
                          : "bg-[var(--surface-primary)] text-[var(--text-secondary)] border-[var(--border-subtle)]"
                      }`}
                    >
                      <span>Pin D13 (Red LED)</span>
                      <span>{pinD13 ? "HIGH (1)" : "LOW (0)"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPinD12(!pinD12)}
                      className={`flex items-center justify-between p-2 rounded text-xs font-mono transition-colors border ${
                        pinD12
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold"
                          : "bg-[var(--surface-primary)] text-[var(--text-secondary)] border-[var(--border-subtle)]"
                      }`}
                    >
                      <span>Pin D12 (Green LED)</span>
                      <span>{pinD12 ? "HIGH (1)" : "LOW (0)"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPinD11(!pinD11)}
                      className={`flex items-center justify-between p-2 rounded text-xs font-mono transition-colors border ${
                        pinD11
                          ? "bg-blue-500/20 text-blue-300 border-blue-500/40 font-bold"
                          : "bg-[var(--surface-primary)] text-[var(--text-secondary)] border-[var(--border-subtle)]"
                      }`}
                    >
                      <span>Pin D11 (Blue LED)</span>
                      <span>{pinD11 ? "HIGH (1)" : "LOW (0)"}</span>
                    </button>
                  </div>
                </div>

                {/* Sensor Slider & Pushbutton Input */}
                <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-3 space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                    Sensor &amp; Input Controls
                  </span>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[var(--text-secondary)]">Analog ADC (Potentiometer)</span>
                      <span className="font-mono font-bold text-blue-400">
                        {clampedAdc} ({sensorVoltage.toFixed(2)}V)
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={maxAdc}
                      step="1"
                      value={clampedAdc}
                      onChange={(e) => setAnalogValue(parseInt(e.target.value, 10))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>

                  <div className="pt-1">
                    <span className="text-xs text-[var(--text-secondary)] block mb-1.5">Pushbutton Switch (Pin D2 Input)</span>
                    <button
                      type="button"
                      onMouseDown={() => setButtonPressed(true)}
                      onMouseUp={() => setButtonPressed(false)}
                      onTouchStart={() => setButtonPressed(true)}
                      onTouchEnd={() => setButtonPressed(false)}
                      className={`w-full py-2 px-3 rounded text-xs font-semibold flex items-center justify-center gap-2 transition-all border ${
                        buttonPressed
                          ? "bg-emerald-600 text-white border-emerald-500 shadow-md translate-y-0.5"
                          : "bg-[var(--surface-primary)] text-[var(--text-primary)] border-[var(--border-subtle)] hover:bg-[var(--surface-tertiary)]"
                      }`}
                    >
                      <Zap size={14} className={buttonPressed ? "text-yellow-300" : "text-zinc-400"} />
                      <span>{buttonPressed ? "Button Pressed (Pin D2 = LOW)" : "Press & Hold Pushbutton (D2)"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Live Firmware Code Generator */}
            <div className="lg:col-span-5 flex flex-col rounded-xl border border-[var(--border-subtle)] bg-[#0d1117] p-4 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-zinc-400 mb-2">
                <span className="flex items-center gap-1.5 font-semibold text-zinc-200">
                  <Code size={14} className="text-blue-400" />
                  Live Firmware Code (C++)
                </span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                  {mcuTarget === "arduino" ? "Arduino C++" : "ESP-IDF / Arduino"}
                </span>
              </div>
              <pre className="font-mono text-[11px] leading-relaxed text-zinc-300 overflow-x-auto flex-1 p-2 bg-zinc-950 rounded border border-zinc-900 select-all">
                <code>{firmwareSnippet}</code>
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
