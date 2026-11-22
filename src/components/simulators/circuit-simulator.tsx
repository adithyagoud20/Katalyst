"use client";

import React, { useState } from "react";
import { Cpu, Zap, Code, Volume2, VolumeX, Activity, Radio, Compass, Monitor } from "lucide-react";
import { getHardwareSketchPreset, runHardwareSketch, type HardwareSketchPreset } from "@/lib/hardware-sketch-interpreter";
import { KMapSolver } from "./kmap-solver";
import { FSMDesigner } from "./fsm-designer";
import { ToyCpuSimulator } from "./toy-cpu-simulator";
import { AnalogCircuitsStudio } from "./analog-circuits-studio";
import { PidTuningSimulator } from "./pid-tuning-simulator";
import { FftSamplingVisualizer } from "./fft-sampling-visualizer";
import { DsaVisualizer } from "./dsa-visualizer";
import { CreativeStudio, type CreativeStudioMode } from "./creative-studio";

export type CircuitSimulatorMode = "digital" | "analog" | "breadboard" | "arduino" | "esp32" | "kmap" | "fsm" | "toycpu" | "pid" | "fft" | "dsa" | "creative" | "melody" | "morse" | "snake" | "maze";

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
  const isCreativeMode = initialMode === "creative" || initialMode === "melody" || initialMode === "morse" || initialMode === "snake" || initialMode === "maze";
  const [creativeSubMode] = useState<CreativeStudioMode>(
    initialMode === "melody" || initialMode === "morse" || initialMode === "snake" || initialMode === "maze"
      ? initialMode
      : "melody"
  );
  const [mode, setMode] = useState<"digital" | "analog" | "breadboard" | "kmap" | "fsm" | "toycpu" | "pid" | "fft" | "dsa" | "creative">(
    initialMode === "arduino" || initialMode === "esp32"
      ? "breadboard"
      : isCreativeMode
      ? "creative"
      : (initialMode as "digital" | "analog" | "breadboard" | "kmap" | "fsm" | "toycpu" | "pid" | "fft" | "dsa" | "creative")
  );
  const [mcuTarget, setMcuTarget] = useState<"arduino" | "esp32">(
    initialMode === "esp32" ? "esp32" : "arduino"
  );
  const [sketchPreset, setSketchPreset] = useState<HardwareSketchPreset>("blink");
  const [sketchSource, setSketchSource] = useState(() => getHardwareSketchPreset(initialMode === "esp32" ? "esp32" : "arduino", "blink"));
  const [serialInput, setSerialInput] = useState("");
  const [sketchOutput, setSketchOutput] = useState("Choose Run sketch to execute the supported firmware subset.");
  const [sketchStatus, setSketchStatus] = useState("Ready");

  // Digital state
  const [selectedGate, setSelectedGate] = useState<"AND" | "OR" | "NOT" | "NAND" | "NOR" | "XOR">(initialGate);
  const [inputA, setInputA] = useState<number>(0);
  const [inputB, setInputB] = useState<number>(0);

  const [pinD13, setPinD13] = useState<boolean>(true); // Red LED
  const [pinD12, setPinD12] = useState<boolean>(false); // Green LED
  const [pinD11, setPinD11] = useState<boolean>(false); // Blue LED
  const [simulatedPwm, setSimulatedPwm] = useState<Record<string, number>>({});
  const [buttonPressed, setButtonPressed] = useState<boolean>(false); // Digital Input D2
  const [analogValue, setAnalogValue] = useState<number>(512); // 10-bit: 0-1023 or 12-bit: 0-4095
  const [selectedBoardPart, setSelectedBoardPart] = useState("controller");

  // Advanced hardware simulator states
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [activeTone, setActiveTone] = useState<{ pin: string; frequency: number; duration: number } | null>(null);
  const [servos, setServos] = useState<Record<string, { angle: number; pulseUs: number }>>({});
  const [oledLines, setOledLines] = useState<string[]>([]);
  const [interruptEvents, setInterruptEvents] = useState<Array<{ pin: string; isr: string; count: number }>>([]);
  const [freeRtosLog, setFreeRtosLog] = useState<Array<{ tick: number; core: number; task: string; message: string }>>([]);
  const [mqttMessages, setMqttMessages] = useState<Array<{ topic: string; payload: string }>>([]);

  const playWebAudioTone = (freq: number, durationMs = 250) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch {
      // AudioContext blocked by browser policy
    }
  };

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
  const outputPinLabels = mcuTarget === "arduino" ? ["D13", "D12", "D11"] : ["GPIO18", "GPIO19", "GPIO23"];
  const buttonPinLabel = mcuTarget === "arduino" ? "D2" : "GPIO25";
  const sensorPinLabel = mcuTarget === "arduino" ? "A0" : "GPIO34";
  const boardParts = mcuTarget === "arduino"
    ? [
        { id: "controller", label: "ATmega328P", detail: "The main 8-bit AVR microcontroller runs the sketch at 16 MHz and provides the board’s digital and analog I/O." },
        { id: "power", label: "Power & regulator", detail: "USB or VIN supplies the board. The regulator provides the 5 V logic rail; keep GPIO signals within the board’s electrical limits." },
        { id: "usb", label: "USB & serial", detail: "The USB interface powers the board and bridges serial data between the computer and the ATmega328P bootloader." },
        { id: "gpio", label: "Digital I/O", detail: "D13, D12, and D11 drive the three simulated LEDs through 330 Ω resistors. D2 reads the simulated pushbutton." },
        { id: "analog", label: "Analog inputs", detail: "A0 is sampled by the Uno’s 10-bit ADC. Its nominal input range is 0–5 V when the board is powered at 5 V." },
      ]
    : [
        { id: "controller", label: "ESP32-WROOM-32", detail: "The module contains a dual-core Xtensa LX6 processor, Wi-Fi/Bluetooth radio, and SPI flash. This lab models pin states; it does not connect to radios or physical hardware." },
        { id: "power", label: "Power & regulator", detail: "The DevKit regulator supplies 3.3 V logic. Never apply 5 V directly to an ESP32 GPIO pin." },
        { id: "usb", label: "USB & serial", detail: "A board-specific USB-to-UART bridge powers the DevKit and supports serial programming. Connector and bridge vary by board revision." },
        { id: "gpio", label: "Digital I/O", detail: "GPIO18, GPIO19, and GPIO23 are used for the simulated LEDs; GPIO25 reads the simulated pushbutton. GPIO12 is avoided because it is a boot strapping pin." },
        { id: "analog", label: "Analog inputs", detail: "GPIO34 is an input-only ADC1 pin and is used for the sensor. Its input voltage must stay at or below the 3.3 V logic rail." },
      ];
  const selectedPart = boardParts.find((part) => part.id === selectedBoardPart) ?? boardParts[0];
  const pinFor = (label: string) => label.match(/\d+/)?.[0];
  const outputDuty = (label: string) => {
    const pin = pinFor(label);
    return pin ? simulatedPwm[pin] : undefined;
  };
  const boardPinMap: [string, string][] = mcuTarget === "arduino"
    ? [
        ["D0 / RX", "UART receive; shared with USB serial"], ["D1 / TX", "UART transmit; shared with USB serial"], ["D2", "Digital input; external interrupt"], ["D3 ~", "PWM output; external interrupt"],
        ["D4", "Digital I/O"], ["D5 ~", "PWM output"], ["D6 ~", "PWM output"], ["D7", "Digital I/O"], ["D8", "Digital I/O"], ["D9 ~", "PWM output"],
        ["D10 ~", "PWM / SPI SS"], ["D11 ~", "PWM / SPI MOSI"], ["D12", "SPI MISO"], ["D13", "SPI SCK / onboard LED"],
        ["A0–A5", "10-bit analog inputs; also usable as digital pins"], ["VIN", "External board supply input"], ["5V", "Regulated 5 V rail"], ["3V3", "3.3 V output rail"], ["GND", "Ground reference"], ["RESET", "Restart the microcontroller"],
      ]
    : [
        ["GPIO0", "Boot strapping pin; used by download mode"], ["GPIO1 / TX0", "UART0 transmit; shared with serial console"], ["GPIO2", "Boot strapping pin; board LED on some revisions"], ["GPIO3 / RX0", "UART0 receive; shared with serial console"],
        ["GPIO4", "Digital I/O; touch-capable"], ["GPIO5", "Digital I/O; boot strapping pin"], ["GPIO12", "Boot strapping pin; avoid forcing high at reset"], ["GPIO13", "Digital I/O; touch-capable"],
        ["GPIO14", "Digital I/O; touch-capable"], ["GPIO15", "Boot strapping pin; touch-capable"], ["GPIO16", "Digital I/O"], ["GPIO17", "Digital I/O"],
        ["GPIO18", "Digital I/O; simulated red LED"], ["GPIO19", "Digital I/O; simulated green LED"], ["GPIO21", "Common I²C SDA assignment"], ["GPIO22", "Common I²C SCL assignment"],
        ["GPIO23", "Digital I/O; simulated blue LED"], ["GPIO25 / DAC1", "Digital I/O; simulated pushbutton input"], ["GPIO26 / DAC2", "Digital I/O / DAC output"], ["GPIO27", "Digital I/O; touch-capable"],
        ["GPIO32–33", "Digital I/O; ADC1 / touch-capable"], ["GPIO34–39", "Input-only pins; GPIO34 is the simulated ADC1 sensor input"],
        ["3V3", "Regulated 3.3 V rail"], ["VIN / 5V", "DevKit supply input; regulator depends on board"], ["GND", "Ground reference"], ["EN", "Enable/reset the module"],
      ];

  const runSketch = (pulseTriggerPin?: number) => {
    try {
      const result = runHardwareSketch(sketchSource, {
        target: mcuTarget,
        analogValue: clampedAdc,
        buttonPressed,
        serialInput,
        cycles: 4,
        pulseTriggerPin,
      });
      const levelFor = (label: string) => {
        const pin = pinFor(label);
        return pin ? (result.digitalPins[pin] ?? (result.pwmPins[pin] ? 1 : 0)) > 0 : false;
      };
      setSimulatedPwm(result.pwmPins);
      setPinD13(levelFor(outputPinLabels[0]));
      setPinD12(levelFor(outputPinLabels[1]));
      setPinD11(levelFor(outputPinLabels[2]));
      setActiveTone(result.tone ?? null);
      setServos(result.servos);
      setOledLines(result.oledLines);
      setInterruptEvents(result.interruptEvents);
      setFreeRtosLog(result.freeRtosLog);
      setMqttMessages(result.mqttMessages);

      if (result.tone && audioEnabled) {
        playWebAudioTone(result.tone.frequency, result.tone.duration || 250);
      }

      const serialText = result.serial || "(no serial output)";
      setSketchOutput(`${serialText}${serialText.endsWith("\n") ? "" : "\n"}\n${result.cycles} loop cycles · ${result.elapsedMs.toFixed(0)} ms simulated`);
      setSketchStatus(`Completed · ${result.elapsedMs.toFixed(0)} ms simulated`);
    } catch (error) {
      setSketchStatus("Sketch error");
      setSketchOutput(error instanceof Error ? error.message : "The sketch could not be interpreted.");
    }
  };

  return (
    <div
      className={`circuit-simulator-root rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-5 text-[var(--text-primary)] shadow-sm ${className}`}
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
                  : initialMode === "kmap"
                  ? "Interactive Circuit & Hardware Simulator — Karnaugh Map Minimizer"
                  : initialMode === "fsm"
                  ? "Interactive Circuit & Hardware Simulator — Finite State Machine Designer"
                  : initialMode === "toycpu"
                  ? "Interactive Circuit & Hardware Simulator — 8-Bit Educational CPU"
                  : initialMode === "analog"
                  ? "Interactive Circuit & Hardware Simulator — Analog Circuits & Network Theory"
                  : initialMode === "pid"
                  ? "Interactive Circuit & Hardware Simulator — PID Controller Tuning"
                  : initialMode === "fft"
                  ? "Interactive Circuit & Hardware Simulator — Nyquist Sampling & FFT"
                  : initialMode === "dsa"
                  ? "Interactive Circuit & Hardware Simulator — Data Structures & Algorithms"
                  : "Interactive Circuit & Hardware Simulator — Digital Logic Gates"
                : "Interactive Circuit & Hardware Simulator"}
            </h3>
          </div>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            {hideModeSwitcher
              ? initialMode === "arduino"
                ? "Virtual Arduino Uno ATmega328P 5V breadboard prototyping, GPIO registers, and real-time C++ firmware."
                : initialMode === "esp32"
                ? "ESP32 DevKit learning model for 3.3 V GPIO, ADC input, boot pins, and generated Arduino-style firmware; radio and physical I/O are not connected."
                : initialMode === "breadboard"
                ? "Virtual solderless breadboard prototyping with power rails (5V / 3.3V), LEDs, and sensor dividers."
                : initialMode === "kmap"
                ? "Interactive 2, 3, and 4-variable Gray code Karnaugh maps, prime implicant reduction, and minimal SOP derivation."
                : initialMode === "fsm"
                ? "Interactive Mealy and Moore finite state machine simulator with transition table and animated state graph."
                : initialMode === "toycpu"
                ? "Inspect 8-bit registers, 16-byte RAM, micro-instruction timing cycles (T1–T6), and ALU arithmetic step-by-step."
                : initialMode === "analog"
                ? "Analyze Kirchhoff's laws (KVL/KCL), Thevenin/Norton equivalents, RLC resonance, op-amps, and dual-trace oscilloscope waveforms."
                : initialMode === "pid"
                ? "Tune Proportional, Integral, and Derivative gains; inspect step response, overshoot %OS, settling time, and disturbance rejection."
                : initialMode === "fft"
                ? "Explore continuous-to-discrete conversion, aliasing distortion, Nyquist criterion (fs ≥ 2 fin), and real-time DFT frequency spectrum."
                : initialMode === "dsa"
                ? "Step through contiguous arrays, linked pointer chains, binary search trees, and in-place sorting routines."
                : "Explore digital logic gates, interactive truth tables, and Boolean output states."
              : "Explore digital logic gates, K-maps, FSMs, 8-bit CPU architecture, analog circuits, PID loops, FFT sampling, DSA, and virtual Arduino / ESP32 breadboard hardware."}
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
            {initialMode === "kmap" && (
              <span className="rounded px-2.5 py-1 text-xs font-semibold bg-blue-600 text-white flex items-center gap-1">
                K-Map Minimizer
              </span>
            )}
            {initialMode === "fsm" && (
              <span className="rounded px-2.5 py-1 text-xs font-semibold bg-blue-600 text-white flex items-center gap-1">
                FSM State Machine
              </span>
            )}
            {initialMode === "toycpu" && (
              <span className="rounded px-2.5 py-1 text-xs font-semibold bg-blue-600 text-white flex items-center gap-1">
                8-Bit Simple CPU
              </span>
            )}
            {initialMode === "analog" && (
              <span className="rounded px-2.5 py-1 text-xs font-semibold bg-blue-600 text-white flex items-center gap-1">
                Analog Circuits &amp; EEE
              </span>
            )}
            {initialMode === "pid" && (
              <span className="rounded px-2.5 py-1 text-xs font-semibold bg-blue-600 text-white flex items-center gap-1">
                PID Controller
              </span>
            )}
            {initialMode === "fft" && (
              <span className="rounded px-2.5 py-1 text-xs font-semibold bg-blue-600 text-white flex items-center gap-1">
                FFT &amp; Sampling
              </span>
            )}
            {initialMode === "dsa" && (
              <span className="rounded px-2.5 py-1 text-xs font-semibold bg-blue-600 text-white flex items-center gap-1">
                DSA Lab
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
              onClick={() => setMode("kmap")}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                mode === "kmap"
                  ? "bg-blue-600 text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              K-Map Solver
            </button>
            <button
              type="button"
              onClick={() => setMode("fsm")}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                mode === "fsm"
                  ? "bg-blue-600 text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              FSM Designer
            </button>
            <button
              type="button"
              onClick={() => setMode("toycpu")}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                mode === "toycpu"
                  ? "bg-blue-600 text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              8-Bit CPU
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
              Analog &amp; EEE
            </button>
            <button
              type="button"
              onClick={() => setMode("pid")}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                mode === "pid"
                  ? "bg-blue-600 text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              PID Tuning
            </button>
            <button
              type="button"
              onClick={() => setMode("fft")}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                mode === "fft"
                  ? "bg-blue-600 text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              FFT Sampling
            </button>
            <button
              type="button"
              onClick={() => setMode("dsa")}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                mode === "dsa"
                  ? "bg-blue-600 text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              DSA Visualizer
            </button>
            <button
              type="button"
              onClick={() => setMode("creative")}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                mode === "creative"
                  ? "bg-pink-600 text-white"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Creative Lab
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
            <div className="md:col-span-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-5">
              <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-4">
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
                        : "bg-[var(--surface-tertiary)] text-[var(--text-secondary)] border-[var(--border-strong)]"
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
                          : "bg-[var(--surface-tertiary)] text-[var(--text-secondary)] border-[var(--border-strong)]"
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
                        : "bg-[var(--surface-tertiary)] text-[var(--text-muted)] border-[var(--border-subtle)]"
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

      {mode === "kmap" && (
        <div className="mt-4">
          <KMapSolver />
        </div>
      )}

      {mode === "fsm" && (
        <div className="mt-4">
          <FSMDesigner />
        </div>
      )}

      {mode === "toycpu" && (
        <div className="mt-4">
          <ToyCpuSimulator />
        </div>
      )}

      {mode === "analog" && (
        <div className="mt-4">
          <AnalogCircuitsStudio />
        </div>
      )}

      {mode === "pid" && (
        <div className="mt-4">
          <PidTuningSimulator />
        </div>
      )}

      {mode === "fft" && (
        <div className="mt-4">
          <FftSamplingVisualizer />
        </div>
      )}

      {mode === "dsa" && (
        <div className="mt-4">
          <DsaVisualizer />
        </div>
      )}

      {mode === "creative" && (
        <div className="mt-4">
          <CreativeStudio initialMode={creativeSubMode} />
        </div>
      )}

      {mode === "breadboard" && (
        /* BREADBOARD & MCU LAB SIMULATOR */
        <div className="mt-4 space-y-4">
          {/* Target Selection & Quick Stats */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--surface-secondary)] p-3 rounded-lg border border-[var(--border-subtle)]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Target Board:</span>
              {hideModeSwitcher && (initialMode === "arduino" || initialMode === "esp32") ? (
                <span className="board-target-fixed">{mcuTarget === "arduino" ? "Arduino Uno · 5 V" : "ESP32-WROOM-32 DevKit · 3.3 V"}</span>
              ) : <>
              <button
                type="button"
                onClick={() => {
                  setMcuTarget("arduino");
                  if (analogValue > 1023) setAnalogValue(512);
                  setSketchSource(getHardwareSketchPreset("arduino", sketchPreset));
                  setSketchOutput("Arduino Uno selected. Run the sketch to update the board.");
                  setSketchStatus("Ready");
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
                onClick={() => {
                  setMcuTarget("esp32");
                  setSketchSource(getHardwareSketchPreset("esp32", sketchPreset));
                  setSketchOutput("ESP32 DevKit selected. Run the sketch to update the board.");
                  setSketchStatus("Ready");
                }}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors border ${
                  mcuTarget === "esp32"
                    ? "bg-blue-600 text-white border-blue-500 font-semibold"
                    : "bg-[var(--surface-primary)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]"
                }`}
              >
                ESP32 (3.3V · 12-bit ADC)
              </button>
              </>}
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-[var(--text-secondary)]">VCC: <strong className="text-[var(--accent-text)]">{mcuVcc.toFixed(1)}V</strong></span>
              <span className="text-[var(--text-secondary)]">ADC Res: <strong className="text-[var(--accent-text)]">{maxAdc === 1023 ? "10-bit (0-1023)" : "12-bit (0-4095)"}</strong></span>
              <span className="text-[var(--text-secondary)]">LED Current: <strong className="text-[var(--text-positive)]">{ledCurrentMa.toFixed(1)} mA</strong></span>
            </div>
          </div>

          <section className="board-learning-panel" aria-label="Interactive development board anatomy guide" data-testid="board-anatomy">
            <header className="board-learning-heading">
              <div><span className="eyebrow">BOARD ANATOMY</span><h4>{mcuTarget === "arduino" ? "Arduino Uno · ATmega328P" : "ESP32-WROOM-32 DevKit"}</h4><p>Inspect the main board sections, then open the reference pin map. The drawing is illustrative; board revisions can differ.</p></div>
              <span className="board-illustration-tag">ISOMETRIC GUIDE · NOT TO SCALE</span>
            </header>
            <div className="board-learning-content">
              <div className={`board-figure-art ${mcuTarget}`} role="img" aria-label={`${mcuTarget === "arduino" ? "Illustrative Arduino Uno" : "Illustrative ESP32 DevKit"} showing controller, USB interface, power section, and I/O headers`}>
                <svg viewBox="0 0 560 280" aria-hidden="true">
                  <defs>
                    <linearGradient id="boardTop" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#263447"/><stop offset="1" stopColor="#111924"/></linearGradient>
                    <linearGradient id="boardEdge" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#26364a"/><stop offset="1" stopColor="#0a1018"/></linearGradient>
                    <linearGradient id="chipTop" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#334155"/><stop offset="1" stopColor="#111827"/></linearGradient>
                  </defs>
                  <ellipse cx="290" cy="224" rx="218" ry="28" fill="#020617" opacity=".55" />
                  <path d="M84 77 424 48 493 88 153 119Z" fill="url(#boardTop)" stroke="#64748b" strokeWidth="2" />
                  <path d="M153 119 493 88 493 111 153 143Z" fill="url(#boardEdge)" stroke="#334155" strokeWidth="1.5" />
                  <path d="M84 77 153 119 153 143 84 101Z" fill="#0c1420" stroke="#334155" strokeWidth="1.5" />
                  <path d="M96 83 135 80 165 97 126 101Z" fill="#cbd5e1" stroke="#f8fafc" strokeWidth="2" />
                  <path d="M108 86 130 84 151 96 129 98Z" fill="#475569" />
                  <path d="M177 75 219 71 246 86 204 91Z" fill="#d97706" stroke="#fbbf24" strokeWidth="1.5" />
                  <path d="M184 70 212 68 218 71 190 74Z" fill="#fde68a" />
                  <path d="M278 71 355 65 384 82 307 89Z" fill="url(#chipTop)" stroke="#94a3b8" strokeWidth="1.5" />
                  <path d="M286 67 356 61 365 66 295 73Z" fill="#475569" />
                  <text x="331" y="81" fill="#e2e8f0" fontSize="11" fontFamily="monospace" textAnchor="middle">{mcuTarget === "arduino" ? "ATmega328P" : "ESP32-WROOM"}</text>
                  {Array.from({ length: 9 }).map((_, index) => <g key={`pin-top-${index}`}><path d={`M${168 + index * 31} 60 l12 -1 l8 5 l-12 1Z`} fill="#fbbf24"/><path d={`M${172 + index * 31} 132 l12 -1 l8 5 l-12 1Z`} fill="#fbbf24"/></g>)}
                  <path d="M392 68 422 65 441 76 411 79Z" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.4" />
                  <circle cx="433" cy="87" r="5" fill="#38bdf8" opacity=".9" />
                  <path d="M245 92 267 90 281 98 259 100Z" fill="#ef4444" stroke="#fecaca" strokeWidth="1" />
                  <path d="M246 97 267 95" stroke="#fca5a5" strokeWidth="2" />
                  <circle cx="111" cy="81" r="4" fill="#020617" stroke="#94a3b8" />
                  <circle cx="460" cy="87" r="4" fill="#020617" stroke="#94a3b8" />
                  <path d="M112 129 135 143" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 3" />
                  <path d="M325 93 348 128" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="4 3" />
                  <path d="M407 81 444 126" stroke="#34d399" strokeWidth="1.5" strokeDasharray="4 3" />
                </svg>
                <div className="board-art-label board-art-usb">USB bridge</div><div className="board-art-label board-art-controller">Main controller</div><div className="board-art-label board-art-io">I/O headers</div>
              </div>
              <div className="board-part-explorer">
                <span className="board-part-explorer-label">SELECT A SECTION</span>
                <div className="board-part-tabs" role="group" aria-label="Board sections">
                  {boardParts.map((part) => <button type="button" key={part.id} aria-pressed={selectedPart.id === part.id} onClick={() => setSelectedBoardPart(part.id)}>{part.label}</button>)}
                </div>
                <div className="board-part-detail" aria-live="polite"><strong>{selectedPart.label}</strong><p>{selectedPart.detail}</p><span>Active simulated pins: {outputPinLabels.join(" · ")} · {buttonPinLabel} · {sensorPinLabel}</span></div>
              </div>
            </div>
            <details className="board-pin-map">
              <summary>Open representative pin reference ({boardPinMap.length} entries)</summary>
              {mcuTarget === "esp32" && <p className="board-pin-map-note">Reference for common ESP32-WROOM-32 DevKit boards; header placement and exposed pins vary by manufacturer. Pins marked as boot strapping pins affect startup behavior.</p>}
              <dl>{boardPinMap.map(([pin, description]) => <div key={pin}><dt>{pin}</dt><dd>{description}</dd></div>)}</dl>
            </details>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left Controls & Virtual Breadboard Visualizer */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              {/* Virtual Breadboard SVG */}
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-4 shadow-inner">
                <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-3 border-b border-[var(--border-subtle)] pb-2">
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
                      filter={pinD13 ? "drop-shadow(0px 0px 8px #ef4444)" : undefined}
                      opacity={pinD13 ? (outputDuty(outputPinLabels[0]) ?? 255) / 255 : undefined}
                    />
                    <text x="275" y="108" fill="#f8fafc" fontSize="9" textAnchor="middle" fontWeight="bold">{outputPinLabels[0]} RED</text>

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
                      filter={pinD12 ? "drop-shadow(0px 0px 8px #10b981)" : undefined}
                      opacity={pinD12 ? (outputDuty(outputPinLabels[1]) ?? 255) / 255 : undefined}
                    />
                    <text x="385" y="120" fill="#f8fafc" fontSize="9" textAnchor="middle" fontWeight="bold">{outputPinLabels[1]} GREEN</text>

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
                      filter={pinD11 ? "drop-shadow(0px 0px 8px #3b82f6)" : undefined}
                      opacity={pinD11 ? (outputDuty(outputPinLabels[2]) ?? 255) / 255 : undefined}
                    />
                    <text x="495" y="154" fill="#f8fafc" fontSize="9" textAnchor="middle" fontWeight="bold">{outputPinLabels[2]} BLUE</text>

                    {/* Pushbutton & Pull-Up representation (Bottom) */}
                    <rect x="220" y="145" width="24" height="24" rx="3" fill="#27272a" stroke="#52525b" strokeWidth="1.5" />
                    <circle cx="232" cy="157" r="7" fill={buttonPressed ? "#22c55e" : "#71717a"} stroke="#a1a1aa" strokeWidth="1" />
                    <text x="232" y="182" fill="#a1a1aa" fontSize="8" textAnchor="middle">{buttonPinLabel} BTN</text>

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
                      onClick={() => { setPinD13(!pinD13); setSimulatedPwm((current) => { const next = { ...current }; const pin = pinFor(outputPinLabels[0]); if (pin) delete next[pin]; return next; }); }}
                      className={`flex items-center justify-between p-2 rounded text-xs font-mono transition-colors border ${
                        pinD13
                          ? "bg-red-500/20 text-red-300 border-red-500/40 font-bold"
                          : "bg-[var(--surface-primary)] text-[var(--text-secondary)] border-[var(--border-subtle)]"
                      }`}
                    >
                      <span>Pin {outputPinLabels[0]} (Red LED)</span>
                      <span>{outputDuty(outputPinLabels[0]) !== undefined ? `PWM ${outputDuty(outputPinLabels[0])}/255` : pinD13 ? "HIGH (1)" : "LOW (0)"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setPinD12(!pinD12); setSimulatedPwm((current) => { const next = { ...current }; const pin = pinFor(outputPinLabels[1]); if (pin) delete next[pin]; return next; }); }}
                      className={`flex items-center justify-between p-2 rounded text-xs font-mono transition-colors border ${
                        pinD12
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold"
                          : "bg-[var(--surface-primary)] text-[var(--text-secondary)] border-[var(--border-subtle)]"
                      }`}
                    >
                      <span>Pin {outputPinLabels[1]} (Green LED)</span>
                      <span>{outputDuty(outputPinLabels[1]) !== undefined ? `PWM ${outputDuty(outputPinLabels[1])}/255` : pinD12 ? "HIGH (1)" : "LOW (0)"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setPinD11(!pinD11); setSimulatedPwm((current) => { const next = { ...current }; const pin = pinFor(outputPinLabels[2]); if (pin) delete next[pin]; return next; }); }}
                      className={`flex items-center justify-between p-2 rounded text-xs font-mono transition-colors border ${
                        pinD11
                          ? "bg-blue-500/20 text-blue-300 border-blue-500/40 font-bold"
                          : "bg-[var(--surface-primary)] text-[var(--text-secondary)] border-[var(--border-subtle)]"
                      }`}
                    >
                      <span>Pin {outputPinLabels[2]} (Blue LED)</span>
                      <span>{outputDuty(outputPinLabels[2]) !== undefined ? `PWM ${outputDuty(outputPinLabels[2])}/255` : pinD11 ? "HIGH (1)" : "LOW (0)"}</span>
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
                      <span className="text-[var(--text-secondary)]">Analog ADC input ({sensorPinLabel})</span>
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
                    <span className="text-xs text-[var(--text-secondary)] block mb-1.5">Pushbutton Switch (Pin {buttonPinLabel} input)</span>
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
                      <Zap size={14} className={buttonPressed ? "text-yellow-300" : "text-[var(--text-secondary)]"} />
                      <span>{buttonPressed ? `Button Pressed (${buttonPinLabel} = LOW)` : `Press & Hold Pushbutton (${buttonPinLabel})`}</span>
                    </button>
                  </div>

                  {/* Advanced Hardware Controls */}
                  <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-secondary)]">External Pulse (INT0 / Pin 2)</span>
                      <button
                        type="button"
                        onClick={() => {
                          runSketch(2);
                        }}
                        className="px-2.5 py-1 rounded text-xs font-semibold bg-amber-600/20 text-amber-300 border border-amber-500/40 hover:bg-amber-600/30 flex items-center gap-1.5 transition-colors"
                      >
                        <Activity size={12} /> Fire INT0 Pulse
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-secondary)]">Piezo Tone Audio</span>
                      <button
                        type="button"
                        onClick={() => {
                          const next = !audioEnabled;
                          setAudioEnabled(next);
                          if (next && activeTone) playWebAudioTone(activeTone.frequency, 250);
                        }}
                        className={`px-2.5 py-1 rounded text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
                          audioEnabled
                            ? "bg-emerald-600 text-white border-emerald-500"
                            : "bg-[var(--surface-primary)] text-[var(--text-secondary)] border-[var(--border-subtle)]"
                        }`}
                      >
                        {audioEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
                        <span>{audioEnabled ? "Audio On" : "Audio Muted"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: editable sketch and bounded serial monitor */}
            <div className="lg:col-span-5 flex min-h-[520px] flex-col rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-4 text-xs">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2 text-[var(--text-secondary)]">
                <span className="flex items-center gap-1.5 font-semibold text-[var(--text-primary)]">
                  <Code size={14} className="text-blue-400" />
                  Firmware sketch
                </span>
                <span className="rounded bg-[var(--surface-tertiary)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-secondary)]">
                  {mcuTarget === "arduino" ? "Uno · Arduino C++ subset" : "ESP32 · Arduino framework subset"}
                </span>
              </div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <label className="sr-only" htmlFor="hardware-sketch-preset">Sketch preset</label>
                <select
                  id="hardware-sketch-preset"
                  aria-label="Sketch preset"
                  value={sketchPreset}
                  onChange={(event) => {
                    const preset = event.target.value as HardwareSketchPreset;
                    setSketchPreset(preset);
                    setSketchSource(getHardwareSketchPreset(mcuTarget, preset));
                    setSketchOutput("Preset loaded. Run the sketch to update the board.");
                    setSketchStatus("Ready");
                  }}
                  className="min-h-9 flex-1 rounded-md border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-2 text-[var(--text-primary)]"
                >
                  <option value="blink">Blink</option>
                  <option value="button">Button + LED</option>
                  <option value="sensor">ADC + Serial</option>
                  <option value="pwm">PWM fade</option>
                  <option value="interrupt">INT0 Interrupt</option>
                  <option value="tone">Tone / Buzzer</option>
                  <option value="servo">Servo 50Hz PWM</option>
                  <option value="i2c">I2C OLED Display</option>
                  {mcuTarget === "esp32" && <option value="freertos">FreeRTOS Tasks & Queues</option>}
                  {mcuTarget === "esp32" && <option value="mqtt">MQTT Telemetry</option>}
                </select>
                <button type="button" onClick={() => runSketch()} className="min-h-9 rounded-md bg-blue-600 px-3 font-semibold text-white hover:bg-blue-500">Run sketch</button>
                <button type="button" onClick={() => { setSketchSource(getHardwareSketchPreset(mcuTarget, sketchPreset)); setSketchOutput("Sketch reset to preset."); setSketchStatus("Ready"); }} className="min-h-9 rounded-md border border-[var(--border-subtle)] px-3 text-[var(--text-primary)] hover:bg-[var(--surface-tertiary)]">Reset</button>
              </div>
              <textarea
                aria-label={`${mcuTarget === "arduino" ? "Arduino Uno" : "ESP32"} firmware sketch editor`}
                spellCheck={false}
                value={sketchSource}
                onChange={(event) => setSketchSource(event.target.value.slice(0, 15_000))}
                onKeyDown={(event) => { if ((event.ctrlKey || event.metaKey) && event.key === "Enter") { event.preventDefault(); runSketch(); } }}
                className="min-h-[230px] w-full flex-1 resize-y rounded-md border border-[var(--border-subtle)] bg-[#090b10] p-3 font-mono text-[11px] leading-5 text-slate-100 outline-none focus:border-blue-500"
                aria-describedby="hardware-sketch-help"
              />
              <p id="hardware-sketch-help" className="mt-2 text-[10px] leading-4 text-[var(--text-secondary)]">
                Safe deterministic subset: pinMode, digital/analog I/O, interrupts, tone, Servo, I2C Wire, EEPROM, FreeRTOS tasks/queues, MQTT telemetry, delay, millis, and Serial. Serial input is provided before a run; Ctrl/⌘ + Enter runs four loop cycles.
              </p>
              <div className="mt-3 overflow-hidden rounded-md border border-[var(--border-subtle)] bg-[#090b10]">
                <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
                  <strong className="font-semibold text-[var(--text-primary)]">Serial Monitor</strong>
                  <span role="status" className="font-mono text-[10px] text-[var(--text-secondary)]">{sketchStatus}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-3 py-2">
                  <label htmlFor="hardware-serial-input" className="shrink-0 text-[10px] text-[var(--text-secondary)]">Serial input</label>
                  <input id="hardware-serial-input" aria-label="Serial input before run" maxLength={256} value={serialInput} onChange={(event) => setSerialInput(event.target.value)} placeholder="Optional command for Serial.read()" className="min-h-8 min-w-0 flex-1 rounded border border-white/10 bg-[#11141a] px-2 font-mono text-[11px] text-slate-100 placeholder:text-slate-500" />
                  <span className="text-[9px] text-[var(--text-secondary)]">available before next run</span>
                </div>
                <pre aria-label="Serial monitor output" aria-live="polite" className="max-h-36 min-h-16 overflow-auto whitespace-pre-wrap break-words px-3 py-2 font-mono text-[11px] leading-5 text-emerald-200">{sketchOutput}</pre>
              </div>

              {/* Advanced Peripherals Display */}
              {interruptEvents.length > 0 && (
                <div className="mt-2 rounded border border-amber-500/30 bg-amber-950/20 p-2 text-xs flex items-center justify-between text-amber-200">
                  <span className="flex items-center gap-1.5">
                    <Activity size={13} className="text-amber-400" />
                    ISR Edge Handled: {interruptEvents.map((ev) => `Pin ${ev.pin} -> ${ev.isr}() (${ev.count} pulse)`).join(", ")}
                  </span>
                </div>
              )}

              {activeTone && (
                <div className="mt-2 rounded border border-blue-500/30 bg-blue-950/20 p-2 text-xs flex items-center justify-between text-blue-200">
                  <span className="flex items-center gap-1.5">
                    <Volume2 size={13} className="text-blue-400" />
                    Piezo Buzzer (Pin {activeTone.pin}): <strong>{activeTone.frequency} Hz</strong>
                  </span>
                  {audioEnabled && <span className="text-[10px] bg-blue-500/30 px-1.5 py-0.5 rounded text-blue-300">Live Chime</span>}
                </div>
              )}

              {Object.keys(servos).length > 0 && (
                <div className="mt-2 rounded border border-purple-500/30 bg-purple-950/20 p-2.5 text-xs text-purple-200 space-y-1.5">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="flex items-center gap-1.5"><Compass size={13} /> RC Servo Motor (50 Hz PWM)</span>
                    <span className="font-mono text-[10px] text-purple-300">Closed-Loop</span>
                  </div>
                  {Object.entries(servos).map(([sName, sData]) => (
                    <div key={sName} className="flex items-center justify-between font-mono text-[11px] bg-black/30 p-1.5 rounded">
                      <span>{sName}</span>
                      <span className="text-purple-300">{sData.angle}° ({sData.pulseUs} µs)</span>
                    </div>
                  ))}
                </div>
              )}

              {oledLines.length > 0 && (
                <div className="mt-2 rounded border border-cyan-500/30 bg-[#040914] p-2.5 text-xs text-cyan-200 space-y-1">
                  <div className="flex items-center justify-between font-semibold text-cyan-400">
                    <span className="flex items-center gap-1.5"><Monitor size={13} /> SSD1306 OLED (I2C 0x3C)</span>
                    <span className="font-mono text-[10px] text-cyan-500">128x64 Canvas</span>
                  </div>
                  <div className="rounded bg-black/60 p-2 font-mono text-[11px] text-cyan-300 border border-cyan-900/40">
                    {oledLines.map((line, idx) => (
                      <div key={idx} className="whitespace-pre">{line}</div>
                    ))}
                  </div>
                </div>
              )}

              {freeRtosLog.length > 0 && (
                <div className="mt-2 rounded border border-emerald-500/30 bg-emerald-950/20 p-2.5 text-xs text-emerald-200 space-y-1">
                  <div className="flex items-center justify-between font-semibold text-emerald-400">
                    <span className="flex items-center gap-1.5"><Activity size={13} /> FreeRTOS Dual-Core Execution Log</span>
                    <span className="font-mono text-[10px] text-emerald-500">Tick Slices</span>
                  </div>
                  <div className="max-h-24 overflow-auto rounded bg-black/60 p-1.5 font-mono text-[10px] text-emerald-300 space-y-0.5">
                    {freeRtosLog.slice(-6).map((log, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="text-emerald-500">{log.tick}ms [Core {log.core}] {log.task}:</span>
                        <span>{log.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {mqttMessages.length > 0 && (
                <div className="mt-2 rounded border border-amber-500/30 bg-amber-950/20 p-2.5 text-xs text-amber-200 space-y-1">
                  <div className="flex items-center justify-between font-semibold text-amber-400">
                    <span className="flex items-center gap-1.5"><Radio size={13} /> Mock MQTT Broker</span>
                    <span className="font-mono text-[10px] text-amber-500">Live Telemetry</span>
                  </div>
                  <div className="max-h-24 overflow-auto rounded bg-black/60 p-1.5 font-mono text-[10px] text-amber-300 space-y-0.5">
                    {mqttMessages.slice(-4).map((msg, idx) => (
                      <div key={idx} className="truncate">
                        <span className="text-amber-500">PUB [{msg.topic}]:</span> {msg.payload}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
