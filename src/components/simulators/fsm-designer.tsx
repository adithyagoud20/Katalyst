"use client";

import React, { useState } from "react";
import { GitBranch, Play, RotateCcw } from "lucide-react";

export interface FSMState {
  id: string;
  label: string;
  mooreOutput: string;
  transitions: Record<string, { nextState: string; mealyOutput: string }>;
}

export interface FSMModel {
  name: string;
  type: "Mealy" | "Moore";
  description: string;
  initialState: string;
  states: FSMState[];
}

const PRESET_FSMS: Record<string, FSMModel> = {
  "seq-101": {
    name: "101 Sequence Detector",
    type: "Mealy",
    description: "Detects the overlapping binary sequence '101' in a stream of input bits.",
    initialState: "S0",
    states: [
      {
        id: "S0",
        label: "Reset (S0)",
        mooreOutput: "0",
        transitions: {
          "0": { nextState: "S0", mealyOutput: "0" },
          "1": { nextState: "S1", mealyOutput: "0" },
        },
      },
      {
        id: "S1",
        label: "Saw '1' (S1)",
        mooreOutput: "0",
        transitions: {
          "0": { nextState: "S2", mealyOutput: "0" },
          "1": { nextState: "S1", mealyOutput: "0" },
        },
      },
      {
        id: "S2",
        label: "Saw '10' (S2)",
        mooreOutput: "0",
        transitions: {
          "0": { nextState: "S0", mealyOutput: "0" },
          "1": { nextState: "S1", mealyOutput: "1" }, // Target sequence detected!
        },
      },
    ],
  },
  "mod-4-gray": {
    name: "Mod-4 Gray Code Counter",
    type: "Moore",
    description: "Cycles through 2-bit Gray code sequence (00 -> 01 -> 11 -> 10) on every clock tick.",
    initialState: "G0",
    states: [
      {
        id: "G0",
        label: "State 0 (G0)",
        mooreOutput: "00",
        transitions: {
          "1": { nextState: "G1", mealyOutput: "00" },
          "0": { nextState: "G0", mealyOutput: "00" },
        },
      },
      {
        id: "G1",
        label: "State 1 (G1)",
        mooreOutput: "01",
        transitions: {
          "1": { nextState: "G2", mealyOutput: "01" },
          "0": { nextState: "G0", mealyOutput: "01" },
        },
      },
      {
        id: "G2",
        label: "State 2 (G2)",
        mooreOutput: "11",
        transitions: {
          "1": { nextState: "G3", mealyOutput: "11" },
          "0": { nextState: "G0", mealyOutput: "11" },
        },
      },
      {
        id: "G3",
        label: "State 3 (G3)",
        mooreOutput: "10",
        transitions: {
          "1": { nextState: "G0", mealyOutput: "10" },
          "0": { nextState: "G0", mealyOutput: "10" },
        },
      },
    ],
  },
  "traffic-light": {
    name: "Intersection Traffic Controller",
    type: "Moore",
    description: "Finite state machine sequencing traffic signal phases: Green -> Yellow -> Red.",
    initialState: "GREEN",
    states: [
      {
        id: "GREEN",
        label: "Green Phase",
        mooreOutput: "GO (Green)",
        transitions: {
          "1": { nextState: "YELLOW", mealyOutput: "PREP" },
          "0": { nextState: "GREEN", mealyOutput: "HOLD" },
        },
      },
      {
        id: "YELLOW",
        label: "Yellow Phase",
        mooreOutput: "CAUTION (Yellow)",
        transitions: {
          "1": { nextState: "RED", mealyOutput: "STOP" },
          "0": { nextState: "YELLOW", mealyOutput: "HOLD" },
        },
      },
      {
        id: "RED",
        label: "Red Phase",
        mooreOutput: "STOP (Red)",
        transitions: {
          "1": { nextState: "GREEN", mealyOutput: "CLEAR" },
          "0": { nextState: "RED", mealyOutput: "HOLD" },
        },
      },
    ],
  },
};

export interface FSMDesignerProps {
  className?: string;
}

export function FSMDesigner({ className = "" }: FSMDesignerProps) {
  const [selectedKey, setSelectedKey] = useState<string>("seq-101");
  const model = PRESET_FSMS[selectedKey];
  const [currentStateId, setCurrentStateId] = useState<string>(model.initialState);
  const [history, setHistory] = useState<Array<{ from: string; input: string; to: string; output: string }>>([]);

  const changeModel = (key: string) => {
    setSelectedKey(key);
    setCurrentStateId(PRESET_FSMS[key].initialState);
    setHistory([]);
  };

  const currentState = model.states.find((s) => s.id === currentStateId) ?? model.states[0];

  const applyInput = (inputVal: string) => {
    const trans = currentState.transitions[inputVal];
    if (!trans) return;

    const output = model.type === "Mealy" ? trans.mealyOutput : model.states.find((s) => s.id === trans.nextState)?.mooreOutput ?? "";

    setHistory((prev) => [
      ...prev.slice(-15),
      {
        from: currentState.label,
        input: inputVal,
        to: model.states.find((s) => s.id === trans.nextState)?.label ?? trans.nextState,
        output,
      },
    ]);
    setCurrentStateId(trans.nextState);
  };

  const resetFSM = () => {
    setCurrentStateId(model.initialState);
    setHistory([]);
  };

  return (
    <div
      className={`fsm-designer-root rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-5 text-[var(--text-primary)] shadow-sm ${className}`}
      data-testid="fsm-designer"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <GitBranch className="text-emerald-400" size={18} />
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              Finite State Machine (FSM) Designer & Simulator
            </h3>
          </div>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Step through Mealy and Moore sequential state machines with synchronous clock transitions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-[var(--text-secondary)]">Model:</label>
          <select
            value={selectedKey}
            onChange={(e) => changeModel(e.target.value)}
            className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-secondary)] px-2.5 py-1 text-xs font-semibold text-[var(--text-primary)]"
          >
            <option value="seq-101">Sequence Detector (101 Mealy)</option>
            <option value="mod-4-gray">Mod-4 Gray Code (Moore)</option>
            <option value="traffic-light">Traffic Light Controller</option>
          </select>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* State Graph Visualizer */}
        <div className="lg:col-span-7 flex flex-col justify-between p-4 rounded-xl border border-[var(--border-subtle)] bg-[#090b10]">
          <div>
            <div className="flex justify-between items-center text-xs text-slate-400 mb-4 pb-2 border-b border-slate-800">
              <span className="font-semibold text-slate-200">{model.name} ({model.type} Machine)</span>
              <span className="text-[11px] text-slate-400">{model.description}</span>
            </div>

            {/* Visual State Nodes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
              {model.states.map((st) => {
                const isActive = st.id === currentStateId;
                return (
                  <div
                    key={st.id}
                    className={`rounded-xl p-3 border text-center transition-all ${
                      isActive
                        ? "bg-emerald-950/40 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.25)] ring-2 ring-emerald-500/50"
                        : "bg-slate-900/60 border-slate-800 text-slate-400"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <span className={`h-2 w-2 rounded-full ${isActive ? "bg-emerald-400 animate-ping" : "bg-slate-600"}`} />
                      <span className="font-bold font-mono text-xs text-slate-200">{st.id}</span>
                    </div>
                    <div className="text-[11px] text-slate-300 font-medium">{st.label}</div>
                    {model.type === "Moore" && (
                      <div className="mt-1 text-[10px] font-mono text-emerald-400">
                        Out: {st.mooreOutput}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stepper Controls */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-300 font-medium">Clock Input:</span>
              <button
                type="button"
                onClick={() => applyInput("0")}
                className="px-3 py-1.5 rounded bg-blue-600 text-white font-mono text-xs font-bold hover:bg-blue-500 flex items-center gap-1 shadow"
              >
                <Play size={10} /> In = 0
              </button>
              <button
                type="button"
                onClick={() => applyInput("1")}
                className="px-3 py-1.5 rounded bg-emerald-600 text-white font-mono text-xs font-bold hover:bg-emerald-500 flex items-center gap-1 shadow"
              >
                <Play size={10} /> In = 1 / Next
              </button>
            </div>

            <button
              type="button"
              onClick={resetFSM}
              className="px-2.5 py-1.5 rounded border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs flex items-center gap-1"
            >
              <RotateCcw size={12} /> Reset
            </button>
          </div>
        </div>

        {/* Transition Table & History Log */}
        <div className="lg:col-span-5 flex flex-col justify-between p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] space-y-4 text-xs">
          <div>
            <div className="font-semibold text-[var(--text-primary)] mb-2 flex items-center justify-between">
              <span>Transition Table</span>
              <span className="font-mono text-[10px] text-blue-400">Current: {currentState.id}</span>
            </div>

            <table className="w-full font-mono text-[11px] border border-[var(--border-subtle)] text-center">
              <thead className="bg-[#090b10] text-[var(--text-secondary)]">
                <tr>
                  <th className="p-1 border border-[var(--border-subtle)]">State</th>
                  <th className="p-1 border border-[var(--border-subtle)]">In = 0</th>
                  <th className="p-1 border border-[var(--border-subtle)]">In = 1</th>
                  <th className="p-1 border border-[var(--border-subtle)]">Output</th>
                </tr>
              </thead>
              <tbody>
                {model.states.map((st) => (
                  <tr
                    key={st.id}
                    className={st.id === currentStateId ? "bg-emerald-500/10 font-bold text-emerald-400" : ""}
                  >
                    <td className="p-1 border border-[var(--border-subtle)]">{st.id}</td>
                    <td className="p-1 border border-[var(--border-subtle)]">{st.transitions["0"]?.nextState ?? "-"}</td>
                    <td className="p-1 border border-[var(--border-subtle)]">{st.transitions["1"]?.nextState ?? "-"}</td>
                    <td className="p-1 border border-[var(--border-subtle)]">
                      {model.type === "Moore" ? st.mooreOutput : `${st.transitions["0"]?.mealyOutput}/${st.transitions["1"]?.mealyOutput}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <div className="font-semibold text-[var(--text-primary)] mb-1.5">Execution Event Log</div>
            <div className="max-h-32 min-h-20 overflow-auto rounded-lg border border-[var(--border-subtle)] bg-[#090b10] p-2 font-mono text-[10px] text-slate-300 space-y-1">
              {history.length === 0 ? (
                <div className="text-slate-500 italic">No transitions fired yet. Click In = 0 or In = 1 above.</div>
              ) : (
                history.map((h, i) => (
                  <div key={i} className="flex items-center justify-between gap-1 border-b border-slate-800/50 pb-0.5">
                    <span className="text-slate-400">{h.from}</span>
                    <span className="text-blue-400">--[ {h.input} ]--&gt;</span>
                    <span className="text-emerald-400 font-bold">{h.to}</span>
                    <span className="text-amber-300 font-bold">Out: {h.output}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
