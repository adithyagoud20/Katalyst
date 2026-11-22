"use client";

import React, { useState, useEffect, useRef } from "react";
import { Cpu, Play, Pause, StepForward, RotateCcw } from "lucide-react";

export interface ToyCpuSimulatorProps {
  className?: string;
}

const OPCODES: Record<string, { code: number; mnemonic: string; hasArg: boolean; description: string }> = {
  NOP: { code: 0x0, mnemonic: "NOP", hasArg: false, description: "No operation" },
  LDA: { code: 0x1, mnemonic: "LDA", hasArg: true, description: "Load ACC from RAM[addr]" },
  ADD: { code: 0x2, mnemonic: "ADD", hasArg: true, description: "Add RAM[addr] to ACC" },
  SUB: { code: 0x3, mnemonic: "SUB", hasArg: true, description: "Subtract RAM[addr] from ACC" },
  STA: { code: 0x4, mnemonic: "STA", hasArg: true, description: "Store ACC to RAM[addr]" },
  LDI: { code: 0x5, mnemonic: "LDI", hasArg: true, description: "Load immediate 4-bit nibble into ACC" },
  JMP: { code: 0x6, mnemonic: "JMP", hasArg: true, description: "Jump PC to addr" },
  JC:  { code: 0x7, mnemonic: "JC",  hasArg: true, description: "Jump to addr if Carry is set" },
  JZ:  { code: 0x8, mnemonic: "JZ",  hasArg: true, description: "Jump to addr if Zero is set" },
  OUT: { code: 0xe, mnemonic: "OUT", hasArg: false, description: "Copy ACC to Output Register" },
  HLT: { code: 0xf, mnemonic: "HLT", hasArg: false, description: "Halt clock" },
};

const CODE_TO_MNEMONIC: Record<number, string> = Object.fromEntries(
  Object.values(OPCODES).map((o) => [o.code, o.mnemonic])
);

// Preset assembly programs (16 bytes each)
const PRESET_PROGRAMS: Record<string, { name: string; description: string; ram: number[] }> = {
  fibonacci: {
    name: "Fibonacci Sequence Generator",
    description: "Computes 1, 1, 2, 3, 5, 8, 13... in an iterative loop outputting to display.",
    ram: [
      0x1e, // 0: LDA 14 (A = fib0)
      0x2f, // 1: ADD 15 (A = A + fib1)
      0xe0, // 2: OUT    (Display A)
      0x4d, // 3: STA 13 (Store sum into temp 13)
      0x1f, // 4: LDA 15 (A = fib1)
      0x4e, // 5: STA 14 (fib0 = fib1)
      0x1d, // 6: LDA 13 (A = temp sum)
      0x4f, // 7: STA 15 (fib1 = sum)
      0x7b, // 8: JC 11  (If overflowed carry, halt)
      0x60, // 9: JMP 0  (Loop back)
      0x00, // a: NOP
      0xf0, // b: HLT
      0x00, // c: temp
      0x00, // d: temp sum
      0x00, // e: fib0 = 0
      0x01, // f: fib1 = 1
    ],
  },
  countdown: {
    name: "Countdown & Zero Flag Branch",
    description: "Decrements counter from 5 to 0; halts immediately when Zero flag triggers.",
    ram: [
      0x1f, // 0: LDA 15 (Load initial count 5)
      0xe0, // 1: OUT    (Output current count)
      0x3e, // 2: SUB 14 (Subtract 1)
      0x86, // 3: JZ 6   (If Zero, jump to Halt)
      0x61, // 4: JMP 1  (Loop back to OUT)
      0x00, // 5: NOP
      0xe0, // 6: OUT    (Output 0)
      0xf0, // 7: HLT    (Halt)
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x01, // e: constant 1
      0x05, // f: counter = 5
    ],
  },
  multiplier: {
    name: "Repeated Addition Multiplication",
    description: "Multiplies 3 * 4 by accumulating 3 four times into ACC.",
    ram: [
      0x1e, // 0: LDA 14 (Load product accumulator)
      0x2d, // 1: ADD 13 (Add multiplicand 3)
      0x4e, // 2: STA 14 (Store product)
      0x1f, // 3: LDA 15 (Load multiplier count)
      0x3c, // 4: SUB 12 (Decrement by 1)
      0x4f, // 5: STA 15 (Store counter)
      0x89, // 6: JZ 9   (If count is 0, done!)
      0x60, // 7: JMP 0  (Loop)
      0x00, // 8: NOP
      0x1e, // 9: LDA 14 (Load final product)
      0xe0, // a: OUT    (Output product = 12)
      0xf0, // b: HLT    (Halt)
      0x01, // c: constant 1
      0x03, // d: multiplicand = 3
      0x00, // e: product = 0
      0x04, // f: multiplier = 4
    ],
  },
};

export function ToyCpuSimulator({ className = "" }: ToyCpuSimulatorProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>("fibonacci");
  const [ram, setRam] = useState<number[]>([...PRESET_PROGRAMS.fibonacci.ram]);
  const [pc, setPc] = useState<number>(0);
  const [mar, setMar] = useState<number>(0);
  const [ir, setIr] = useState<number>(0);
  const [acc, setAcc] = useState<number>(0);
  const [bReg, setBReg] = useState<number>(0);
  const [outReg, setOutReg] = useState<number>(0);
  const [flagZero, setFlagZero] = useState<boolean>(false);
  const [flagCarry, setFlagCarry] = useState<boolean>(false);
  const [tState, setTState] = useState<"FETCH_MAR" | "FETCH_IR" | "DECODE_EXECUTE">("FETCH_MAR");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isHalted, setIsHalted] = useState<boolean>(false);
  const [clockSpeedHz, setClockSpeedHz] = useState<number>(2);
  const [executionLog, setExecutionLog] = useState<string[]>([
    "SAP-1 8-bit CPU Initialized. Ready to step.",
  ]);

  const runningRef = useRef(isRunning);
  useEffect(() => {
    runningRef.current = isRunning;
  }, [isRunning]);

  const loadProgram = (key: string) => {
    setSelectedPreset(key);
    const prog = PRESET_PROGRAMS[key];
    setRam([...prog.ram]);
    resetCpu();
  };

  const resetCpu = () => {
    setPc(0);
    setMar(0);
    setIr(0);
    setAcc(0);
    setBReg(0);
    setOutReg(0);
    setFlagZero(false);
    setFlagCarry(false);
    setTState("FETCH_MAR");
    setIsRunning(false);
    setIsHalted(false);
    setExecutionLog(["CPU Reset to initial state (PC = 0)."]);
  };

  const stepInstruction = () => {
    if (isHalted) return;

    // Execute one full instruction cycle: Fetch -> Decode -> Execute
    const currentPc = pc;
    const instructionByte = ram[currentPc] ?? 0;
    const opcode = (instructionByte >> 4) & 0x0f;
    const operand = instructionByte & 0x0f;
    const mnemonic = CODE_TO_MNEMONIC[opcode] || "UNKNOWN";

    setMar(currentPc);
    setIr(instructionByte);

    let nextPc = (currentPc + 1) & 0x0f;
    let nextAcc = acc;
    let nextB = bReg;
    let nextOut = outReg;
    let nextZ = flagZero;
    let nextC = flagCarry;
    let logMsg = `[PC: ${currentPc.toString(16).toUpperCase()}] ${mnemonic} ${opcode === 0x0 || opcode === 0xe || opcode === 0xf ? "" : operand.toString(16).toUpperCase()}`;

    switch (opcode) {
      case 0x0: // NOP
        break;
      case 0x1: // LDA
        nextAcc = ram[operand] ?? 0;
        logMsg += ` -> ACC = ${nextAcc}`;
        break;
      case 0x2: { // ADD
        nextB = ram[operand] ?? 0;
        const sum = nextAcc + nextB;
        nextC = sum > 255;
        nextAcc = sum & 0xff;
        nextZ = nextAcc === 0;
        logMsg += ` -> ACC = ${nextAcc} (Z=${nextZ ? 1 : 0}, C=${nextC ? 1 : 0})`;
        break;
      }
      case 0x3: { // SUB
        nextB = ram[operand] ?? 0;
        const diff = nextAcc - nextB;
        nextC = diff < 0; // Borrow
        nextAcc = (diff + 256) & 0xff;
        nextZ = nextAcc === 0;
        logMsg += ` -> ACC = ${nextAcc} (Z=${nextZ ? 1 : 0}, C=${nextC ? 1 : 0})`;
        break;
      }
      case 0x4: { // STA
        const newRam = [...ram];
        newRam[operand] = nextAcc;
        setRam(newRam);
        logMsg += ` -> RAM[${operand.toString(16).toUpperCase()}] = ${nextAcc}`;
        break;
      }
      case 0x5: // LDI
        nextAcc = operand;
        logMsg += ` -> ACC = ${nextAcc}`;
        break;
      case 0x6: // JMP
        nextPc = operand;
        logMsg += ` -> JMP to ${operand.toString(16).toUpperCase()}`;
        break;
      case 0x7: // JC
        if (flagCarry) {
          nextPc = operand;
          logMsg += ` -> C=1, JMP to ${operand.toString(16).toUpperCase()}`;
        } else {
          logMsg += ` -> C=0, No Jump`;
        }
        break;
      case 0x8: // JZ
        if (flagZero) {
          nextPc = operand;
          logMsg += ` -> Z=1, JMP to ${operand.toString(16).toUpperCase()}`;
        } else {
          logMsg += ` -> Z=0, No Jump`;
        }
        break;
      case 0xe: // OUT
        nextOut = nextAcc;
        logMsg += ` -> OUT = ${nextOut}`;
        break;
      case 0xf: // HLT
        setIsHalted(true);
        setIsRunning(false);
        logMsg += " -> CPU HALTED.";
        break;
    }

    setPc(nextPc);
    setAcc(nextAcc);
    setBReg(nextB);
    setOutReg(nextOut);
    setFlagZero(nextZ);
    setFlagCarry(nextC);
    setTState("DECODE_EXECUTE");
    setExecutionLog((prev) => [...prev.slice(-12), logMsg]);
  };

  const stepInstructionRef = useRef(stepInstruction);
  useEffect(() => {
    stepInstructionRef.current = stepInstruction;
  });

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isRunning && !isHalted) {
      timer = setInterval(() => {
        stepInstructionRef.current();
      }, 1000 / clockSpeedHz);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, isHalted, clockSpeedHz]);

  return (
    <div
      className={`toy-cpu-simulator-root rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-5 text-[var(--text-primary)] shadow-sm ${className}`}
      data-testid="toy-cpu-simulator"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="text-amber-400" size={18} />
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              Toy 8-Bit CPU / SAP-1 Architecture Simulator
            </h3>
          </div>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Explore von Neumann computer architecture, 16-byte addressable RAM, bus registers, and the fetch-decode-execute instruction cycle.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-[var(--text-secondary)]">Program:</label>
          <select
            value={selectedPreset}
            onChange={(e) => loadProgram(e.target.value)}
            className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-secondary)] px-2.5 py-1 text-xs font-semibold text-[var(--text-primary)]"
          >
            <option value="fibonacci">Fibonacci Sequence</option>
            <option value="countdown">Countdown &amp; Zero Flag</option>
            <option value="multiplier">Multiply by Repeated Addition</option>
          </select>
        </div>
      </div>

      {/* Main Architecture Layout */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Registers & Bus State */}
        <div className="lg:col-span-4 flex flex-col justify-between p-4 rounded-xl border border-[var(--border-subtle)] bg-[#090b10] space-y-4">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              CPU Internal Registers
            </div>

            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Program Counter (PC)</span>
                <span className="text-emerald-400 font-bold text-sm">
                  0x{pc.toString(16).toUpperCase()} ({pc})
                </span>
              </div>

              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Memory Addr (MAR)</span>
                <span className="text-blue-400 font-bold text-sm">
                  0x{mar.toString(16).toUpperCase()} ({mar})
                </span>
              </div>

              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Accumulator (ACC)</span>
                <span className="text-amber-400 font-bold text-sm">
                  {acc} (0x{acc.toString(16).toUpperCase().padStart(2, "0")})
                </span>
              </div>

              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">B Register</span>
                <span className="text-slate-300 font-bold text-sm">
                  {bReg} (0x{bReg.toString(16).toUpperCase().padStart(2, "0")})
                </span>
              </div>

              <div className="col-span-2 p-2.5 rounded bg-slate-900 border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-slate-500 text-[10px] block">Instruction Reg (IR)</span>
                  <span className="text-purple-400 font-bold text-sm">
                    {CODE_TO_MNEMONIC[(ir >> 4) & 0xf] || "???"} {(ir & 0xf).toString(16).toUpperCase()}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Op: {(ir >> 4) & 0xf} | Arg: {ir & 0xf}
                </div>
              </div>
            </div>

            {/* ALU Flags & Output Display */}
            <div className="mt-3 p-3 rounded-lg border border-slate-800 bg-slate-900/60 space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400">ALU Status Flags:</span>
                <div className="flex gap-2">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${flagZero ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-500"}`}>
                    Zero (Z)
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${flagCarry ? "bg-amber-600 text-white" : "bg-slate-800 text-slate-500"}`}>
                    Carry (C)
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs font-mono pt-1 border-t border-slate-800">
                <span className="text-slate-400">Output Display (OUT):</span>
                <span className="text-base font-bold text-cyan-300 bg-black/60 px-3 py-1 rounded border border-cyan-800 font-mono shadow-inner">
                  {outReg}
                </span>
              </div>
            </div>
          </div>

          {/* Stepper & Clock Controls */}
          <div className="pt-3 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Clock: {clockSpeedHz} Hz</span>
              <input
                type="range"
                min="1"
                max="10"
                value={clockSpeedHz}
                onChange={(e) => setClockSpeedHz(Number(e.target.value))}
                className="w-28 accent-amber-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsRunning(!isRunning)}
                disabled={isHalted}
                className={`flex-1 py-1.5 px-3 rounded text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow ${
                  isRunning
                    ? "bg-amber-600 hover:bg-amber-500 text-white"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50"
                }`}
              >
                {isRunning ? <Pause size={12} /> : <Play size={12} />}
                <span>{isRunning ? "Pause" : "Run Clock"}</span>
              </button>

              <button
                type="button"
                onClick={stepInstruction}
                disabled={isRunning || isHalted}
                className="py-1.5 px-3 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1"
              >
                <StepForward size={12} /> Step
              </button>

              <button
                type="button"
                onClick={() => resetCpu()}
                className="py-1.5 px-2.5 rounded border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs flex items-center gap-1"
              >
                <RotateCcw size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Center: 16-Byte RAM Matrix */}
        <div className="lg:col-span-4 flex flex-col justify-between p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] text-xs">
          <div>
            <div className="font-bold text-[var(--text-primary)] mb-2 flex items-center justify-between">
              <span>16-Byte Memory (RAM)</span>
              <span className="font-mono text-[10px] text-emerald-400">Address Space 0x00–0x0F</span>
            </div>

            <div className="space-y-1 font-mono text-[11px]">
              {ram.map((byteVal, addr) => {
                const isCurrentPc = addr === pc;
                const opcode = (byteVal >> 4) & 0x0f;
                const operand = byteVal & 0x0f;
                const mnemonic = CODE_TO_MNEMONIC[opcode] || "DATA";
                const isDataOnly = addr >= 12;

                return (
                  <div
                    key={addr}
                    className={`flex items-center justify-between px-2.5 py-1 rounded transition-colors ${
                      isCurrentPc
                        ? "bg-emerald-600 text-white font-bold shadow"
                        : addr === mar
                        ? "bg-blue-950/60 border border-blue-600/40 text-blue-200"
                        : "bg-[#090b10] text-slate-300 border border-slate-800/60"
                    }`}
                  >
                    <span className="w-10 text-[10px] text-slate-400">
                      0x{addr.toString(16).toUpperCase()}
                    </span>
                    <span className="w-12 text-center font-bold">
                      0x{byteVal.toString(16).toUpperCase().padStart(2, "0")}
                    </span>
                    <span className="w-20 text-right text-[10px]">
                      {isDataOnly ? `Val: ${byteVal}` : `${mnemonic} ${opcode === 0 || opcode === 0xe || opcode === 0xf ? "" : operand.toString(16).toUpperCase()}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Micro-Instruction Cycle & Execution Log */}
        <div className="lg:col-span-4 flex flex-col justify-between p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] space-y-4 text-xs">
          <div>
            <div className="font-semibold text-[var(--text-primary)] mb-2">
              Instruction Cycle Phase
            </div>

            <div className="grid grid-cols-3 gap-2 font-mono text-center text-[10px] mb-3">
              <div className={`p-2 rounded border ${tState === "FETCH_MAR" ? "bg-blue-600 text-white font-bold border-blue-400" : "bg-slate-900 text-slate-500 border-slate-800"}`}>
                T1: MAR &lt;- PC
              </div>
              <div className={`p-2 rounded border ${tState === "FETCH_IR" ? "bg-purple-600 text-white font-bold border-purple-400" : "bg-slate-900 text-slate-500 border-slate-800"}`}>
                T2: IR &lt;- RAM
              </div>
              <div className={`p-2 rounded border ${tState === "DECODE_EXECUTE" ? "bg-emerald-600 text-white font-bold border-emerald-400" : "bg-slate-900 text-slate-500 border-slate-800"}`}>
                T3: Execute
              </div>
            </div>

            <div className="font-semibold text-[var(--text-primary)] mb-1.5">
              Instruction Execution Trace
            </div>
            <div className="max-h-48 min-h-32 overflow-auto rounded-lg border border-[var(--border-subtle)] bg-[#090b10] p-2 font-mono text-[10px] text-emerald-300 space-y-1">
              {executionLog.map((log, idx) => (
                <div key={idx} className="border-b border-slate-800/40 pb-0.5">
                  {log}
                </div>
              ))}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-900/40 text-[11px] text-amber-200 leading-4">
            <strong>SAP-1 Micro-Architecture:</strong> In Ben Eater / Malvino&apos;s SAP-1, a 16-byte bus connects registers. An instruction consists of 4-bit Opcode and 4-bit Operand. The ALU performs two&apos;s-complement arithmetic with zero and carry flag latches.
          </div>
        </div>
      </div>
    </div>
  );
}
