"use client";

import React, { useState, useMemo } from "react";
import { Sliders, RotateCcw, Zap } from "lucide-react";

export interface PidTuningSimulatorProps {
  className?: string;
}

export function PidTuningSimulator({ className = "" }: PidTuningSimulatorProps) {
  const [kp, setKp] = useState<number>(2.5);
  const [ki, setKi] = useState<number>(1.2);
  const [kd, setKd] = useState<number>(0.8);
  const [setpoint, setSetpoint] = useState<number>(1.0);
  const [hasDisturbance, setHasDisturbance] = useState<boolean>(false);

  // Compute closed-loop step response via numerical Euler integration
  const sim = useMemo(() => {
    const dt = 0.02; // 20 ms time step
    const steps = 400; // 8 seconds total
    const time: number[] = [];
    const output: number[] = [];
    const setpoints: number[] = [];
    const errors: number[] = [];

    // Second-order plant: G(s) = 1 / (s^2 + 2s + 1)
    let y = 0.0;
    let yDot = 0.0;
    let integralError = 0.0;
    let prevError = 0.0;

    let peakValue = 0.0;
    let peakTime = 0.0;
    let riseTime = -1.0;
    let settlingTime = -1.0;

    for (let i = 0; i < steps; i++) {
      const t = i * dt;
      time.push(t);

      // Disturbance impulse at t = 4.0s
      const dist = hasDisturbance && t >= 4.0 && t <= 4.2 ? -0.8 : 0.0;

      const error = setpoint - y;
      integralError += error * dt;
      // Clamp integral anti-windup
      integralError = Math.max(-5.0, Math.min(5.0, integralError));

      const derivativeError = (error - prevError) / dt;
      prevError = error;

      // PID control signal
      const u = kp * error + ki * integralError + kd * derivativeError + dist;

      // Plant acceleration: d2y/dt2 = u - 2*dy/dt - y
      const yDoubleDot = u - 2.0 * yDot - y;

      yDot += yDoubleDot * dt;
      y += yDot * dt;

      output.push(y);
      setpoints.push(setpoint);
      errors.push(error);

      if (y > peakValue) {
        peakValue = y;
        peakTime = t;
      }
      if (riseTime < 0 && y >= 0.9 * setpoint) {
        riseTime = t;
      }
    }

    // Settling time: last time output is outside ±2% of setpoint
    for (let i = steps - 1; i >= 0; i--) {
      if (Math.abs(output[i] - setpoint) > 0.02 * setpoint) {
        settlingTime = time[i];
        break;
      }
    }

    const steadyStateError = Math.abs(setpoint - output[output.length - 1]);
    const overshootPercent = setpoint > 0 ? Math.max(0, ((peakValue - setpoint) / setpoint) * 100) : 0;

    // Generate SVG path points
    const width = 360;
    const height = 140;
    const maxY = 2.0;

    const pointsY = output
      .map((val, idx) => {
        const x = (idx / steps) * width;
        const normY = Math.max(0, Math.min(maxY, val));
        const py = height - (normY / maxY) * height;
        return `${x.toFixed(1)},${py.toFixed(1)}`;
      })
      .join(" ");

    const pointsRef = `${0},${(height - (setpoint / maxY) * height).toFixed(1)} ${width},${(
      height -
      (setpoint / maxY) * height
    ).toFixed(1)}`;

    return {
      pointsY,
      pointsRef,
      overshootPercent,
      peakValue,
      peakTime,
      riseTime: riseTime > 0 ? riseTime : 0,
      settlingTime: settlingTime > 0 ? settlingTime : 8.0,
      steadyStateError,
    };
  }, [kp, ki, kd, setpoint, hasDisturbance]);

  const applyPreset = (p: "underdamped" | "tuned" | "sluggish" | "p_only") => {
    if (p === "underdamped") {
      setKp(5.0);
      setKi(0.5);
      setKd(0.1);
    } else if (p === "tuned") {
      setKp(2.8);
      setKi(1.4);
      setKd(0.9);
    } else if (p === "sluggish") {
      setKp(0.8);
      setKi(0.2);
      setKd(1.5);
    } else if (p === "p_only") {
      setKp(2.0);
      setKi(0.0);
      setKd(0.0);
    }
  };

  return (
    <div
      className={`pid-tuning-simulator-root rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-5 text-[var(--text-primary)] shadow-sm ${className}`}
      data-testid="pid-tuning-simulator"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="text-cyan-400" size={18} />
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              Closed-Loop PID Controller &amp; Transient Tuning Lab
            </h3>
          </div>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Tune Proportional, Integral, and Derivative gains; inspect step response, overshoot %OS, settling time, and disturbance rejection.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1 text-xs">
          <span className="text-[10px] text-slate-400 font-semibold mr-1">Presets:</span>
          <button
            type="button"
            onClick={() => applyPreset("tuned")}
            className="rounded bg-slate-800 hover:bg-slate-700 px-2 py-0.5 text-slate-300 font-semibold"
          >
            Ziegler-Nichols
          </button>
          <button
            type="button"
            onClick={() => applyPreset("underdamped")}
            className="rounded bg-slate-800 hover:bg-slate-700 px-2 py-0.5 text-slate-300 font-semibold"
          >
            Oscillatory
          </button>
          <button
            type="button"
            onClick={() => applyPreset("p_only")}
            className="rounded bg-slate-800 hover:bg-slate-700 px-2 py-0.5 text-slate-300 font-semibold"
          >
            P-Only (Offset)
          </button>
          <button
            type="button"
            onClick={() => applyPreset("sluggish")}
            className="rounded bg-slate-800 hover:bg-slate-700 px-2 py-0.5 text-slate-300 font-semibold"
          >
            Over-Damped
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sliders Panel */}
        <div className="lg:col-span-5 space-y-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-4 text-xs">
          <span className="font-bold text-slate-400 uppercase tracking-wider block">Controller Gains</span>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-[var(--text-secondary)]">Proportional Gain (Kp)</span>
              <span className="font-mono font-bold text-blue-400">{kp.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="10.0"
              step="0.1"
              value={kp}
              onChange={(e) => setKp(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <span className="text-[10px] text-slate-500">Increases response speed; excessive gain induces instability.</span>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-[var(--text-secondary)]">Integral Gain (Ki)</span>
              <span className="font-mono font-bold text-emerald-400">{ki.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="5.0"
              step="0.1"
              value={ki}
              onChange={(e) => setKi(Number(e.target.value))}
              className="w-full accent-emerald-600"
            />
            <span className="text-[10px] text-slate-500">Eliminates steady-state error; increases overshoot.</span>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-[var(--text-secondary)]">Derivative Gain (Kd)</span>
              <span className="font-mono font-bold text-amber-400">{kd.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="4.0"
              step="0.1"
              value={kd}
              onChange={(e) => setKd(Number(e.target.value))}
              className="w-full accent-amber-600"
            />
            <span className="text-[10px] text-slate-500">Dampens oscillations and overshoot; sensitive to high-frequency noise.</span>
          </div>

          <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between">
            <button
              type="button"
              onClick={() => setHasDisturbance(!hasDisturbance)}
              className={`rounded px-3 py-1 font-semibold flex items-center gap-1 transition-colors ${
                hasDisturbance ? "bg-rose-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              <Zap size={12} /> {hasDisturbance ? "Disturbance ON (t=4s)" : "Inject Step Disturbance"}
            </button>
            <button
              type="button"
              onClick={() => {
                setKp(2.8);
                setKi(1.4);
                setKd(0.9);
                setSetpoint(1.0);
                setHasDisturbance(false);
              }}
              className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
            >
              <RotateCcw size={12} /> Reset
            </button>
          </div>
        </div>

        {/* Step Response Curve */}
        <div className="lg:col-span-7 rounded-xl border border-[var(--border-subtle)] bg-[#030712] p-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center text-xs font-mono mb-2 pb-2 border-b border-slate-800">
              <span className="text-slate-300 font-bold">Closed-Loop Step Response y(t)</span>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1 text-slate-400">
                  <span className="w-3 h-0.5 border-b border-dashed border-rose-400 inline-block" /> Setpoint
                </span>
                <span className="flex items-center gap-1 text-cyan-400">
                  <span className="w-3 h-1 bg-cyan-400 inline-block rounded" /> Output y(t)
                </span>
              </div>
            </div>

            <div className="relative h-40 w-full border border-slate-800 rounded bg-[#02050b] p-1 flex items-center justify-center">
              <svg viewBox="0 0 360 140" className="w-full h-full">
                {/* Horizontal grid lines */}
                <line x1="0" y1="35" x2="360" y2="35" stroke="#1e293b" strokeDasharray="3 3" />
                <line x1="0" y1="70" x2="360" y2="70" stroke="#1e293b" strokeDasharray="3 3" />
                <line x1="0" y1="105" x2="360" y2="105" stroke="#1e293b" strokeDasharray="3 3" />

                {/* Setpoint Reference Line */}
                <polyline fill="none" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="4 4" points={sim.pointsRef} />

                {/* Output Curve */}
                <polyline fill="none" stroke="#06b6d4" strokeWidth="2.5" points={sim.pointsY} />
              </svg>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>0.0 s</span>
              <span>2.0 s</span>
              <span>4.0 s (Impulse)</span>
              <span>6.0 s</span>
              <span>8.0 s</span>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs mt-3 pt-3 border-t border-slate-800">
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="block text-[10px] text-slate-400">Overshoot (%OS)</span>
              <span
                className={`font-mono text-sm font-bold ${
                  sim.overshootPercent > 25 ? "text-rose-400" : "text-emerald-400"
                }`}
              >
                {sim.overshootPercent.toFixed(1)}%
              </span>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="block text-[10px] text-slate-400">Rise Time (tr)</span>
              <span className="font-mono text-sm font-bold text-blue-400">
                {sim.riseTime > 0 ? `${sim.riseTime.toFixed(2)} s` : "N/A"}
              </span>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="block text-[10px] text-slate-400">Settling (ts ±2%)</span>
              <span className="font-mono text-sm font-bold text-amber-400">{sim.settlingTime.toFixed(2)} s</span>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="block text-[10px] text-slate-400">Steady-State Error</span>
              <span
                className={`font-mono text-sm font-bold ${
                  sim.steadyStateError < 0.01 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {sim.steadyStateError.toFixed(3)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
