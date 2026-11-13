"use client";

import React, { useState } from "react";

export interface MemoryVisualizerProps {
  initialScenario?: "stack-frames" | "pointers" | "heap-lifecycle";
  className?: string;
}

interface StackVariable {
  name: string;
  type: string;
  value: string;
  address: string;
  bytes: number;
  pointsTo?: string; // Target hex address if it's a pointer
}

interface StackFrame {
  id: string;
  functionName: string;
  frameAddress: string;
  variables: StackVariable[];
}

interface HeapBlock {
  id: string;
  address: string;
  sizeBytes: number;
  status: "allocated" | "freed" | "leaked";
  tag: string;
}

interface SimulationStep {
  title: string;
  explanation: string;
  codeSnippet: string;
  stackFrames: StackFrame[];
  heapBlocks: HeapBlock[];
  highlightAddress?: string;
}

const SCENARIOS: Record<string, { name: string; steps: SimulationStep[] }> = {
  "stack-frames": {
    name: "Function Call Stack & Scopes",
    steps: [
      {
        title: "1. Program Start: main() Frame",
        explanation: "The OS allocates a stack frame for main(). The stack pointer (SP) moves downward. Local variables x (int) and y (int) are pushed onto the frame.",
        codeSnippet: `int main() {\n  int x = 42;\n  int y = 100;\n  // ...\n}`,
        stackFrames: [
          {
            id: "frame-main",
            functionName: "main()",
            frameAddress: "0x7ffee0a0",
            variables: [
              { name: "x", type: "int", value: "42", address: "0x7ffee09c", bytes: 4 },
              { name: "y", type: "int", value: "100", address: "0x7ffee098", bytes: 4 },
            ],
          },
        ],
        heapBlocks: [],
        highlightAddress: "0x7ffee09c",
      },
      {
        title: "2. Function Call: compute() Frame Pushed",
        explanation: "main() invokes compute(x). A new stack frame is pushed below main(). It receives argument 'val' and creates a local accumulator 'acc'.",
        codeSnippet: `int compute(int val) {\n  int acc = val * 2;\n  return acc;\n}`,
        stackFrames: [
          {
            id: "frame-main",
            functionName: "main() [Suspended]",
            frameAddress: "0x7ffee0a0",
            variables: [
              { name: "x", type: "int", value: "42", address: "0x7ffee09c", bytes: 4 },
              { name: "y", type: "int", value: "100", address: "0x7ffee098", bytes: 4 },
            ],
          },
          {
            id: "frame-compute",
            functionName: "compute(val = 42) [Active]",
            frameAddress: "0x7ffee080",
            variables: [
              { name: "val", type: "int", value: "42", address: "0x7ffee07c", bytes: 4 },
              { name: "acc", type: "int", value: "84", address: "0x7ffee078", bytes: 4 },
            ],
          },
        ],
        heapBlocks: [],
        highlightAddress: "0x7ffee078",
      },
      {
        title: "3. Function Returns: compute() Frame Popped",
        explanation: "compute() returns value 84. Its entire stack frame is deallocated instantaneously by restoring the stack pointer. main() resumes execution.",
        codeSnippet: `int result = compute(x);\n// compute frame is popped`,
        stackFrames: [
          {
            id: "frame-main",
            functionName: "main() [Active]",
            frameAddress: "0x7ffee0a0",
            variables: [
              { name: "x", type: "int", value: "42", address: "0x7ffee09c", bytes: 4 },
              { name: "y", type: "int", value: "100", address: "0x7ffee098", bytes: 4 },
              { name: "result", type: "int", value: "84", address: "0x7ffee094", bytes: 4 },
            ],
          },
        ],
        heapBlocks: [],
        highlightAddress: "0x7ffee094",
      },
    ],
  },
  pointers: {
    name: "Pointers & Memory Addresses",
    steps: [
      {
        title: "1. Variable Declaration & Address-Of (&)",
        explanation: "Variable sensor_val is stored at stack address 0x7ffee120. A pointer 'ptr' is declared and initialized with &sensor_val.",
        codeSnippet: `double sensor_val = 98.6;\ndouble *ptr = &sensor_val;`,
        stackFrames: [
          {
            id: "frame-main",
            functionName: "main()",
            frameAddress: "0x7ffee130",
            variables: [
              { name: "sensor_val", type: "double", value: "98.6", address: "0x7ffee120", bytes: 8 },
              { name: "ptr", type: "double*", value: "0x7ffee120", address: "0x7ffee118", bytes: 8, pointsTo: "0x7ffee120" },
            ],
          },
        ],
        heapBlocks: [],
        highlightAddress: "0x7ffee118",
      },
      {
        title: "2. Pointer Dereference Mutator (*ptr = 101.2)",
        explanation: "Dereferencing '*ptr = 101.2' navigates across the pointer reference and directly mutates the 8 bytes residing at 0x7ffee120.",
        codeSnippet: `*ptr = 101.2;\n// Mutates target memory address 0x7ffee120 directly`,
        stackFrames: [
          {
            id: "frame-main",
            functionName: "main()",
            frameAddress: "0x7ffee130",
            variables: [
              { name: "sensor_val", type: "double", value: "101.2 (mutated)", address: "0x7ffee120", bytes: 8 },
              { name: "ptr", type: "double*", value: "0x7ffee120", address: "0x7ffee118", bytes: 8, pointsTo: "0x7ffee120" },
            ],
          },
        ],
        heapBlocks: [],
        highlightAddress: "0x7ffee120",
      },
    ],
  },
  "heap-lifecycle": {
    name: "Dynamic Heap: malloc(), free() & Leaks",
    steps: [
      {
        title: "1. Dynamic Allocation with malloc()",
        explanation: "malloc(16) requests 16 contiguous bytes from the OS heap. The returned heap address 0x005a2000 is saved into stack pointer 'buf'.",
        codeSnippet: `char *buf = (char *)malloc(16);\nstrcpy(buf, \"Telemetry\");`,
        stackFrames: [
          {
            id: "frame-main",
            functionName: "main()",
            frameAddress: "0x7ffee200",
            variables: [
              { name: "buf", type: "char*", value: "0x005a2000", address: "0x7ffee1f8", bytes: 8, pointsTo: "0x005a2000" },
            ],
          },
        ],
        heapBlocks: [
          { id: "heap-1", address: "0x005a2000", sizeBytes: 16, status: "allocated", tag: "buf [Telemetry]" },
        ],
        highlightAddress: "0x005a2000",
      },
      {
        title: "2. Second Allocation",
        explanation: "A second block of 32 bytes is allocated for sensor readings at heap address 0x005a2020.",
        codeSnippet: `int *readings = (int *)malloc(32);`,
        stackFrames: [
          {
            id: "frame-main",
            functionName: "main()",
            frameAddress: "0x7ffee200",
            variables: [
              { name: "buf", type: "char*", value: "0x005a2000", address: "0x7ffee1f8", bytes: 8, pointsTo: "0x005a2000" },
              { name: "readings", type: "int*", value: "0x005a2020", address: "0x7ffee1f0", bytes: 8, pointsTo: "0x005a2020" },
            ],
          },
        ],
        heapBlocks: [
          { id: "heap-1", address: "0x005a2000", sizeBytes: 16, status: "allocated", tag: "buf [Telemetry]" },
          { id: "heap-2", address: "0x005a2020", sizeBytes: 32, status: "allocated", tag: "readings [8 ints]" },
        ],
        highlightAddress: "0x005a2020",
      },
      {
        title: "3. Proper free() vs. Memory Leak",
        explanation: "free(buf) releases the 16 bytes back to the allocator. However, 'readings' was never freed before main() exits — causing a 32-byte memory leak!",
        codeSnippet: `free(buf);\n// BUG: forgot free(readings)!\nreturn 0;`,
        stackFrames: [
          {
            id: "frame-main",
            functionName: "main() [Exiting]",
            frameAddress: "0x7ffee200",
            variables: [
              { name: "buf (dangling)", type: "char*", value: "0x005a2000", address: "0x7ffee1f8", bytes: 8 },
              { name: "readings", type: "int*", value: "0x005a2020", address: "0x7ffee1f0", bytes: 8, pointsTo: "0x005a2020" },
            ],
          },
        ],
        heapBlocks: [
          { id: "heap-1", address: "0x005a2000", sizeBytes: 16, status: "freed", tag: "buf [Freed]" },
          { id: "heap-2", address: "0x005a2020", sizeBytes: 32, status: "leaked", tag: "readings [LEAK: 32B]" },
        ],
        highlightAddress: "0x005a2020",
      },
    ],
  },
};

export function MemoryVisualizer({
  initialScenario = "stack-frames",
  className = "",
}: MemoryVisualizerProps) {
  const [scenarioKey, setScenarioKey] = useState<string>(initialScenario);
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [selectedAddr, setSelectedAddr] = useState<string | null>(null);

  const scenario = SCENARIOS[scenarioKey] || SCENARIOS["stack-frames"];
  const currentStep = scenario.steps[Math.min(stepIndex, scenario.steps.length - 1)];

  const handleNext = () => {
    if (stepIndex < scenario.steps.length - 1) {
      setStepIndex((s) => s + 1);
    }
  };

  const handlePrev = () => {
    if (stepIndex > 0) {
      setStepIndex((s) => s - 1);
    }
  };

  const handleReset = () => {
    setStepIndex(0);
  };

  // Compute stats
  const totalStackVars = currentStep.stackFrames.reduce((acc, f) => acc + f.variables.length, 0);
  const totalHeapAllocated = currentStep.heapBlocks
    .filter((b) => b.status === "allocated")
    .reduce((acc, b) => acc + b.sizeBytes, 0);
  const totalLeaked = currentStep.heapBlocks
    .filter((b) => b.status === "leaked")
    .reduce((acc, b) => acc + b.sizeBytes, 0);

  return (
    <div
      className={`rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-5 text-[var(--text-primary)] shadow-sm ${className}`}
      data-testid="memory-visualizer"
    >
      {/* Header & Scenario Selection */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            <h3 className="text-base font-semibold tracking-tight text-[var(--text-primary)]">
              Interactive Memory & Pointer Visualizer
            </h3>
          </div>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Inspect real-time stack frames, downward stack growth, heap allocations, and pointer relationships.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {Object.entries(SCENARIOS).map(([key, sc]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setScenarioKey(key);
                setStepIndex(0);
                setSelectedAddr(null);
              }}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                scenarioKey === key
                  ? "bg-blue-600 text-white"
                  : "bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]"
              }`}
            >
              {sc.name}
            </button>
          ))}
        </div>
      </div>

      {/* Stepper Controls & Current Step Banner */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-3">
        <div className="flex-1 min-w-[240px]">
          <div className="flex items-center gap-2">
            <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-400">
              Step {stepIndex + 1} of {scenario.steps.length}
            </span>
            <span className="text-xs font-medium text-[var(--text-primary)]">{currentStep.title}</span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
            {currentStep.explanation}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            disabled={stepIndex === 0}
            className="rounded border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] disabled:opacity-40 hover:bg-[var(--surface-hover)]"
          >
            ← Previous
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={stepIndex === scenario.steps.length - 1}
            className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40 hover:bg-blue-500"
          >
            Next Step →
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-2.5 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            title="Reset to beginning"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Code Snippet for Current Step */}
      <div className="mt-3 rounded-md bg-[#0d1117] p-2.5 font-mono text-[11px] text-[#c9d1d9] border border-[var(--border-subtle)]">
        <div className="text-[10px] uppercase tracking-wider text-[#8b949e] mb-1">C Execution Context:</div>
        <pre className="whitespace-pre-wrap">{currentStep.codeSnippet}</pre>
      </div>

      {/* Visualizer Dual-Pane Layout: Stack (Left) | Heap (Right) */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Stack Memory (Grows downward) */}
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-3">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2 mb-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)]">
                Stack Memory
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">(High Address ↓ Low Address)</span>
            </div>
            <span className="text-[11px] font-mono text-blue-400">
              {totalStackVars} variable{totalStackVars === 1 ? "" : "s"}
            </span>
          </div>

          <div className="space-y-3">
            {currentStep.stackFrames.map((frame) => (
              <div
                key={frame.id}
                className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-2.5"
              >
                <div className="flex items-center justify-between text-xs font-medium text-blue-400 border-b border-[var(--border-subtle)] pb-1.5 mb-2">
                  <span>Stack Frame: {frame.functionName}</span>
                  <span className="font-mono text-[10px] text-[var(--text-muted)]">Base: {frame.frameAddress}</span>
                </div>

                <div className="space-y-1.5">
                  {frame.variables.map((v) => {
                    const isSelected = selectedAddr === v.address || currentStep.highlightAddress === v.address;
                    return (
                      <div
                        key={v.address}
                        onClick={() => setSelectedAddr(v.address)}
                        className={`cursor-pointer rounded px-2 py-1.5 text-xs font-mono transition-colors flex items-center justify-between ${
                          isSelected
                            ? "bg-blue-600/20 border border-blue-500/50 text-[var(--text-primary)]"
                            : "bg-[var(--surface-primary)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-blue-500/30"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[var(--text-muted)]">{v.address}</span>
                          <span className="font-semibold text-[var(--text-primary)]">{v.name}</span>
                          <span className="text-[10px] text-zinc-400">({v.type})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-blue-300">{v.value}</span>
                          {v.pointsTo && (
                            <span className="rounded bg-blue-500/20 px-1 py-0.2 text-[9px] text-blue-300">
                              → {v.pointsTo}
                            </span>
                          )}
                          <span className="text-[10px] text-[var(--text-muted)]">{v.bytes}B</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Heap Memory */}
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-3">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2 mb-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)]">
                Heap Memory (Dynamic)
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">(malloc / free)</span>
            </div>
            <span className="text-[11px] font-mono text-zinc-400">
              Active: {totalHeapAllocated}B
            </span>
          </div>

          {currentStep.heapBlocks.length === 0 ? (
            <div className="flex h-32 items-center justify-center rounded border border-dashed border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
              No dynamic heap allocations in this step.
            </div>
          ) : (
            <div className="space-y-2">
              {currentStep.heapBlocks.map((block) => {
                const isSelected = selectedAddr === block.address || currentStep.highlightAddress === block.address;
                const statusStyles = {
                  allocated: "border-blue-500/40 bg-blue-500/10 text-blue-300",
                  freed: "border-zinc-600/40 bg-zinc-800/40 text-zinc-400 line-through",
                  leaked: "border-amber-500/50 bg-amber-500/10 text-amber-300 animate-pulse",
                }[block.status];

                return (
                  <div
                    key={block.id}
                    onClick={() => setSelectedAddr(block.address)}
                    className={`cursor-pointer rounded-md border p-2.5 transition-colors ${statusStyles} ${
                      isSelected ? "ring-2 ring-blue-500" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{block.address}</span>
                        <span>{block.tag}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-sans uppercase font-bold px-1.5 py-0.5 rounded bg-black/30">
                          {block.status}
                        </span>
                        <span>{block.sizeBytes} Bytes</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Leaked Warning Badge if any */}
          {totalLeaked > 0 && (
            <div className="mt-3 rounded border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-300 flex items-start gap-2">
              <span className="font-bold text-sm">⚠</span>
              <div>
                <span className="font-semibold">Memory Leak Detected!</span>
                <p className="mt-0.5 text-[11px] text-amber-300/80">
                  {totalLeaked} bytes of heap memory remain uncollected upon program exit. Always pair malloc() with free()!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
