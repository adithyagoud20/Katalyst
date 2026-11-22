"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Activity, Waves } from "lucide-react";

export interface AnalogCircuitsStudioProps {
  className?: string;
  initialTab?: "ohm_rc" | "kvl" | "thevenin" | "rlc" | "opamp" | "scope";
}

export function AnalogCircuitsStudio({ className = "", initialTab = "kvl" }: AnalogCircuitsStudioProps) {
  const [activeTab, setActiveTab] = useState<"ohm_rc" | "kvl" | "thevenin" | "rlc" | "opamp" | "scope">(initialTab);

  // --- 0. Ohm's Law & RC Transient Parameters ---
  const [vOhm, setVOhm] = useState(5.0);
  const [rOhm, setROhm] = useState(1000);
  const [cOhm, setCOhm] = useState(100);

  const ohmResults = useMemo(() => {
    const current = rOhm > 0 ? vOhm / rOhm : 0;
    const power = vOhm * current;
    const tau = rOhm * (cOhm * 1e-6);
    return {
      currentMa: current * 1000,
      powerMw: power * 1000,
      tauMs: tau * 1000,
    };
  }, [vOhm, rOhm, cOhm]);

  const generateRCCurve = (): string => {
    const points: string[] = [];
    const width = 280;
    const height = 100;
    for (let x = 0; x <= width; x += 5) {
      const normalizedTime = (x / width) * 5;
      const vNormalized = 1 - Math.exp(-normalizedTime);
      const y = height - (vNormalized * (height - 10) + 5);
      points.push(`${x},${y.toFixed(1)}`);
    }
    return points.join(" ");
  };

  // --- 1. KVL & KCL 2-Mesh Parameters ---
  const [v1, setV1] = useState(12); // Volts
  const [v2, setV2] = useState(6); // Volts
  const [r1, setR1] = useState(100); // Ohms
  const [r2, setR2] = useState(220); // Ohms (shared branch)
  const [r3, setR3] = useState(150); // Ohms

  const meshResults = useMemo(() => {
    // Mesh 1: (R1 + R2) * I1 - R2 * I2 = V1
    // Mesh 2: -R2 * I1 + (R2 + R3) * I2 = -V2
    const det = (r1 + r2) * (r2 + r3) - r2 * r2;
    const det1 = v1 * (r2 + r3) - (-v2) * (-r2);
    const det2 = (r1 + r2) * (-v2) - (-r2) * v1;

    const i1 = det !== 0 ? det1 / det : 0; // Amperes
    const i2 = det !== 0 ? det2 / det : 0;
    const i3 = i1 - i2; // Current down through shared R2
    const vA = i3 * r2; // Node voltage at junction

    return {
      i1Ma: i1 * 1000,
      i2Ma: i2 * 1000,
      i3Ma: i3 * 1000,
      vNode: vA,
      p1Mw: i1 * i1 * r1 * 1000,
      p2Mw: i3 * i3 * r2 * 1000,
      p3Mw: i2 * i2 * r3 * 1000,
    };
  }, [v1, v2, r1, r2, r3]);

  // --- 2. Thevenin & Norton Parameters ---
  const [vsThev, setVsThev] = useState(20);
  const [r1Thev, setR1Thev] = useState(100);
  const [r2Thev, setR2Thev] = useState(100);
  const [rLoad, setRLoad] = useState(50);

  const thevResults = useMemo(() => {
    const vTh = vsThev * (r2Thev / (r1Thev + r2Thev));
    const rTh = (r1Thev * r2Thev) / (r1Thev + r2Thev);
    const iN = r1Thev !== 0 ? vsThev / r1Thev : 0;
    const iLoad = vTh / (rTh + rLoad);
    const pLoad = iLoad * iLoad * rLoad;
    const pMax = (vTh * vTh) / (4 * rTh);

    return { vTh, rTh, iN, iLoadMa: iLoad * 1000, pLoadMw: pLoad * 1000, pMaxMw: pMax * 1000 };
  }, [vsThev, r1Thev, r2Thev, rLoad]);

  // --- 3. RLC Resonant Ringing Parameters ---
  const [rRlc, setRRlc] = useState(50); // Ohms
  const [lRlcMh, setLRlcMh] = useState(10); // Millihenries
  const [cRlcUf, setCRlcUf] = useState(10); // Microfarads

  const rlcResults = useMemo(() => {
    const lHenries = lRlcMh / 1000;
    const cFarads = cRlcUf / 1_000_000;
    const omega0 = 1 / Math.sqrt(lHenries * cFarads); // rad/sec
    const f0 = omega0 / (2 * Math.PI); // Hz
    const alpha = rRlc / (2 * lHenries);
    const zeta = alpha / omega0; // Damping ratio
    const qFactor = (1 / rRlc) * Math.sqrt(lHenries / cFarads);

    let classification = "Underdamped (Oscillatory Ringing)";
    if (Math.abs(zeta - 1) < 0.05) classification = "Critically Damped";
    else if (zeta > 1) classification = "Overdamped (Sluggish Return)";

    return { omega0, f0, alpha, zeta, qFactor, classification };
  }, [rRlc, lRlcMh, cRlcUf]);

  const generateRlcSvgPoints = () => {
    const points: string[] = [];
    const width = 280;
    const midY = 50;
    const l = lRlcMh / 1000;
    const c = cRlcUf / 1_000_000;
    const w0 = 1 / Math.sqrt(l * c);
    const alpha = rRlc / (2 * l);
    const zeta = alpha / w0;
    const wd = zeta < 1 ? w0 * Math.sqrt(1 - zeta * zeta) : 0;

    for (let x = 0; x <= width; x += 2) {
      const t = (x / width) * 0.01; // 10 ms window
      let v = 0;
      if (zeta < 1) {
        v = Math.exp(-alpha * t) * Math.cos(wd * t);
      } else {
        v = Math.exp(-alpha * t);
      }
      const y = midY - v * 40;
      points.push(`${x},${y.toFixed(1)}`);
    }
    return points.join(" ");
  };

  // --- 4. Op-Amp Parameters ---
  const [opAmpMode, setOpAmpMode] = useState<"inverting" | "non-inverting" | "schmitt">("inverting");
  const [vinOp, setVinOp] = useState(2.0); // Volts
  const [rinOp, setRinOp] = useState(10); // kOhms
  const [rfOp, setRfOp] = useState(20); // kOhms
  const vSat = 12.0; // +/- 12V supply

  const opAmpResults = useMemo(() => {
    if (opAmpMode === "inverting") {
      const gain = -(rfOp / rinOp);
      const idealVout = gain * vinOp;
      const vout = Math.max(-vSat, Math.min(vSat, idealVout));
      const saturated = Math.abs(idealVout) > vSat;
      return { gain, vout, saturated, formula: `Vout = -(Rf / Rin) * Vin = -(${rfOp}k / ${rinOp}k) * ${vinOp}V` };
    }
    if (opAmpMode === "non-inverting") {
      const gain = 1 + rfOp / rinOp;
      const idealVout = gain * vinOp;
      const vout = Math.max(-vSat, Math.min(vSat, idealVout));
      const saturated = Math.abs(idealVout) > vSat;
      return { gain, vout, saturated, formula: `Vout = (1 + Rf / Rin) * Vin = (1 + ${rfOp}k / ${rinOp}k) * ${vinOp}V` };
    }
    // Schmitt trigger
    const vThUpper = vSat * (rinOp / (rinOp + rfOp));
    const vThLower = -vThUpper;
    const vout = vinOp > vThUpper ? -vSat : vinOp < vThLower ? vSat : vSat;
    return { gain: 0, vout, saturated: true, formula: `Thresholds: V_TH = ±${vThUpper.toFixed(2)}V (Hysteresis ΔV = ${(2 * vThUpper).toFixed(2)}V)` };
  }, [opAmpMode, vinOp, rinOp, rfOp]);

  // --- 5. Virtual Dual-Trace Oscilloscope ---
  const [scopeMode, setScopeMode] = useState<"YT" | "XY">("YT");
  const [ch1Freq, setCh1Freq] = useState(1000); // Hz
  const [ch1Amp, setCh1Amp] = useState(4.0); // Volts
  const [ch2Freq, setCh2Freq] = useState(1000); // Hz
  const [ch2Amp, setCh2Amp] = useState(4.0); // Volts
  const [ch2PhaseDeg, setCh2PhaseDeg] = useState(90); // Degrees (Lissajous circle when 90)

  const generateScopeTraces = useCallback(() => {
    const ch1Points: string[] = [];
    const ch2Points: string[] = [];
    const xyPoints: string[] = [];
    const width = 280;
    const height = 140;
    const midX = 140;
    const midY = 70;

    const timeWindow = 0.003; // 3 ms
    const phaseRad = (ch2PhaseDeg * Math.PI) / 180;

    for (let i = 0; i <= 200; i++) {
      const t = (i / 200) * timeWindow;
      const v1 = ch1Amp * Math.sin(2 * Math.PI * ch1Freq * t);
      const v2 = ch2Amp * Math.sin(2 * Math.PI * ch2Freq * t + phaseRad);

      const x = (i / 200) * width;
      const y1 = midY - (v1 / 8) * (height / 2);
      const y2 = midY - (v2 / 8) * (height / 2);

      ch1Points.push(`${x.toFixed(1)},${y1.toFixed(1)}`);
      ch2Points.push(`${x.toFixed(1)},${y2.toFixed(1)}`);

      // XY Lissajous plot
      const lissX = midX + (v1 / 6) * 50;
      const lissY = midY - (v2 / 6) * 50;
      xyPoints.push(`${lissX.toFixed(1)},${lissY.toFixed(1)}`);
    }

    return { ch1: ch1Points.join(" "), ch2: ch2Points.join(" "), xy: xyPoints.join(" ") };
  }, [ch1Amp, ch1Freq, ch2Amp, ch2Freq, ch2PhaseDeg]);

  const scopeTraces = useMemo(() => generateScopeTraces(), [generateScopeTraces]);

  return (
    <div
      className={`analog-circuits-studio-root rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-5 text-[var(--text-primary)] shadow-sm ${className}`}
      data-testid="analog-circuits-studio"
    >
      {/* Navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="text-blue-400" size={18} />
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              Analog &amp; Circuit Theory Studio
            </h3>
          </div>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Kirchhoff loops, Thevenin equivalents, RLC ringing, Op-Amps, and dual-trace Lissajous oscilloscope.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-1 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("ohm_rc")}
            className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
              activeTab === "ohm_rc" ? "bg-blue-600 text-white" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Ohm &amp; RC
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("kvl")}
            className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
              activeTab === "kvl" ? "bg-blue-600 text-white" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            KVL / KCL
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("thevenin")}
            className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
              activeTab === "thevenin" ? "bg-blue-600 text-white" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Thevenin
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("rlc")}
            className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
              activeTab === "rlc" ? "bg-blue-600 text-white" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            RLC Ringing
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("opamp")}
            className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
              activeTab === "opamp" ? "bg-blue-600 text-white" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Op-Amp
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("scope")}
            className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors flex items-center gap-1 ${
              activeTab === "scope" ? "bg-emerald-600 text-white" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Waves size={12} /> Scope
          </button>
        </div>
      </div>

      {/* 0. Ohm's Law & RC Transient Tab */}
      {activeTab === "ohm_rc" && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-4 text-xs">
            <span className="font-bold text-slate-400 uppercase tracking-wider block">Circuit Parameters</span>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[var(--text-secondary)]">Supply Voltage (V)</span>
                <span className="font-mono font-bold text-blue-400">{vOhm.toFixed(1)} V</span>
              </div>
              <input
                type="range"
                min="1"
                max="24"
                step="0.5"
                value={vOhm}
                onChange={(e) => setVOhm(parseFloat(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[var(--text-secondary)]">Resistance (R)</span>
                <span className="font-mono font-bold text-blue-400">{rOhm} Ω</span>
              </div>
              <input
                type="range"
                min="100"
                max="10000"
                step="100"
                value={rOhm}
                onChange={(e) => setROhm(parseInt(e.target.value, 10))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[var(--text-secondary)]">Capacitance (C)</span>
                <span className="font-mono font-bold text-blue-400">{cOhm} µF</span>
              </div>
              <input
                type="range"
                min="10"
                max="1000"
                step="10"
                value={cOhm}
                onChange={(e) => setCOhm(parseInt(e.target.value, 10))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>
          </div>

          <div className="md:col-span-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-4 flex flex-col justify-between">
            <div className="grid grid-cols-3 gap-2 border-b border-[var(--border-subtle)] pb-3 text-center">
              <div>
                <span className="block text-[10px] text-[var(--text-secondary)] uppercase">Current (I)</span>
                <span className="font-mono text-sm font-bold text-emerald-400">
                  {ohmResults.currentMa.toFixed(2)} mA
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-[var(--text-secondary)] uppercase">Power (P)</span>
                <span className="font-mono text-sm font-bold text-amber-400">
                  {ohmResults.powerMw.toFixed(1)} mW
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-[var(--text-secondary)] uppercase">Time Constant (τ)</span>
                <span className="font-mono text-sm font-bold text-cyan-400">
                  {ohmResults.tauMs.toFixed(1)} ms
                </span>
              </div>
            </div>

            <div className="my-3">
              <div className="text-xs text-[var(--text-secondary)] mb-1 flex justify-between">
                <span>Capacitor Voltage Transient: V(t) = V₀(1 - e^&#123;-t/τ&#125;)</span>
                <span className="font-mono text-blue-400">RC Charge Curve</span>
              </div>
              <div className="relative h-32 w-full border border-[var(--border-subtle)] rounded bg-[var(--surface-tertiary)] p-2 flex items-center justify-center">
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
            <div className="mt-2 text-[11px] text-[var(--text-secondary)] flex justify-between font-mono">
              <span>t = 0s (0V)</span>
              <span>t = 1τ (63.2%)</span>
              <span>t = 5τ ({vOhm.toFixed(1)}V)</span>
            </div>
          </div>
        </div>
      )}

      {/* 1. KVL & KCL Tab */}
      {activeTab === "kvl" && (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-4 text-xs">
            <span className="font-bold text-slate-400 uppercase tracking-wider block">2-Mesh Parameters</span>

            <div>
              <div className="flex justify-between mb-1">
                <span>V1 (Left Supply)</span>
                <span className="font-mono text-blue-400 font-bold">{v1} V</span>
              </div>
              <input type="range" min="1" max="24" value={v1} onChange={(e) => setV1(Number(e.target.value))} className="w-full accent-blue-600" />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span>V2 (Right Supply)</span>
                <span className="font-mono text-blue-400 font-bold">{v2} V</span>
              </div>
              <input type="range" min="1" max="24" value={v2} onChange={(e) => setV2(Number(e.target.value))} className="w-full accent-blue-600" />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-400">R1 ({r1}Ω)</label>
                <input type="range" min="50" max="500" step="10" value={r1} onChange={(e) => setR1(Number(e.target.value))} className="w-full accent-blue-600" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400">R2 ({r2}Ω)</label>
                <input type="range" min="50" max="500" step="10" value={r2} onChange={(e) => setR2(Number(e.target.value))} className="w-full accent-blue-600" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400">R3 ({r3}Ω)</label>
                <input type="range" min="50" max="500" step="10" value={r3} onChange={(e) => setR3(Number(e.target.value))} className="w-full accent-blue-600" />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 rounded-xl border border-[var(--border-subtle)] bg-[#090b10] p-4 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-slate-300 mb-3 flex items-center justify-between border-b border-slate-800 pb-2">
                <span>Kirchhoff Mesh Currents &amp; Junction Potentials</span>
                <span className="font-mono text-emerald-400 text-[11px]">KVL: ΣV = 0 · KCL: ΣI = 0</span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center font-mono my-4">
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Mesh 1 (I1)</span>
                  <span className="text-sm font-bold text-emerald-400">{meshResults.i1Ma.toFixed(1)} mA</span>
                </div>
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Shared Branch (I3)</span>
                  <span className="text-sm font-bold text-amber-400">{meshResults.i3Ma.toFixed(1)} mA</span>
                </div>
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Mesh 2 (I2)</span>
                  <span className="text-sm font-bold text-cyan-400">{meshResults.i2Ma.toFixed(1)} mA</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs font-mono flex justify-between items-center">
                <span className="text-slate-400">Junction Node Voltage (Va):</span>
                <span className="text-sm font-bold text-purple-300">{meshResults.vNode.toFixed(2)} V</span>
              </div>
            </div>

            <div className="mt-3 text-[11px] text-slate-400">
              Total power dissipated in resistors: {(meshResults.p1Mw + meshResults.p2Mw + meshResults.p3Mw).toFixed(1)} mW
            </div>
          </div>
        </div>
      )}

      {/* 2. Thevenin & Norton Tab */}
      {activeTab === "thevenin" && (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-4 text-xs">
            <span className="font-bold text-slate-400 uppercase tracking-wider block">Network Parameters</span>

            <div>
              <div className="flex justify-between mb-1">
                <span>Source Voltage (Vs)</span>
                <span className="font-mono text-blue-400 font-bold">{vsThev} V</span>
              </div>
              <input type="range" min="5" max="50" value={vsThev} onChange={(e) => setVsThev(Number(e.target.value))} className="w-full accent-blue-600" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">R1 ({r1Thev}Ω)</label>
                <input type="range" min="20" max="300" step="10" value={r1Thev} onChange={(e) => setR1Thev(Number(e.target.value))} className="w-full accent-blue-600" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">R2 ({r2Thev}Ω)</label>
                <input type="range" min="20" max="300" step="10" value={r2Thev} onChange={(e) => setR2Thev(Number(e.target.value))} className="w-full accent-blue-600" />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-emerald-400 font-semibold">Load Resistance (RL)</span>
                <span className="font-mono text-emerald-400 font-bold">{rLoad} Ω</span>
              </div>
              <input type="range" min="10" max="250" step="5" value={rLoad} onChange={(e) => setRLoad(Number(e.target.value))} className="w-full accent-emerald-500" />
            </div>
          </div>

          <div className="lg:col-span-7 rounded-xl border border-[var(--border-subtle)] bg-[#090b10] p-4 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-slate-300 mb-3 border-b border-slate-800 pb-2 flex justify-between">
                <span>Thevenin &amp; Norton Dual Equivalent</span>
                <span className="text-amber-400 font-mono text-[11px]">Max Power at RL = Rth</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono my-3">
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[9px] text-slate-500 block">V_th (Open Circuit)</span>
                  <span className="text-xs font-bold text-blue-400">{thevResults.vTh.toFixed(1)} V</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[9px] text-slate-500 block">R_th (Equivalent)</span>
                  <span className="text-xs font-bold text-emerald-400">{thevResults.rTh.toFixed(1)} Ω</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[9px] text-slate-500 block">I_N (Short Circuit)</span>
                  <span className="text-xs font-bold text-amber-400">{(thevResults.iN * 1000).toFixed(0)} mA</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[9px] text-slate-500 block">Load Power (P_L)</span>
                  <span className="text-xs font-bold text-cyan-300">{thevResults.pLoadMw.toFixed(0)} mW</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-[11px] text-emerald-200">
              <strong>Maximum Power Transfer Theorem:</strong> Maximum power delivered to the load is <strong>{thevResults.pMaxMw.toFixed(0)} mW</strong>, which occurs when R_L = R_th = {thevResults.rTh.toFixed(1)} &Omega;. (Current efficiency at match = 50%).
            </div>
          </div>
        </div>
      )}

      {/* 3. RLC Resonant Ringing Tab */}
      {activeTab === "rlc" && (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-4 text-xs">
            <span className="font-bold text-slate-400 uppercase tracking-wider block">Series RLC Parameters</span>

            <div>
              <div className="flex justify-between mb-1">
                <span>Damping Resistance (R)</span>
                <span className="font-mono text-blue-400 font-bold">{rRlc} Ω</span>
              </div>
              <input type="range" min="5" max="300" step="5" value={rRlc} onChange={(e) => setRRlc(Number(e.target.value))} className="w-full accent-blue-600" />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span>Inductance (L)</span>
                <span className="font-mono text-blue-400 font-bold">{lRlcMh} mH</span>
              </div>
              <input type="range" min="1" max="50" step="1" value={lRlcMh} onChange={(e) => setLRlcMh(Number(e.target.value))} className="w-full accent-blue-600" />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span>Capacitance (C)</span>
                <span className="font-mono text-blue-400 font-bold">{cRlcUf} µF</span>
              </div>
              <input type="range" min="1" max="50" step="1" value={cRlcUf} onChange={(e) => setCRlcUf(Number(e.target.value))} className="w-full accent-blue-600" />
            </div>
          </div>

          <div className="lg:col-span-7 rounded-xl border border-[var(--border-subtle)] bg-[#090b10] p-4 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-slate-300 mb-2 border-b border-slate-800 pb-2 flex justify-between">
                <span>Transient Response Curve &amp; Damping Ratio</span>
                <span className={`font-mono text-xs font-bold ${rlcResults.zeta < 1 ? "text-amber-400" : "text-emerald-400"}`}>
                  {rlcResults.classification}
                </span>
              </div>

              <div className="relative h-28 w-full border border-slate-800 rounded bg-slate-950/80 p-2 my-2">
                <svg viewBox="0 0 280 100" className="w-full h-full">
                  <line x1="0" y1="50" x2="280" y2="50" stroke="#334155" strokeDasharray="3 3" />
                  <polyline fill="none" stroke="#38bdf8" strokeWidth="2" points={generateRlcSvgPoints()} />
                </svg>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center font-mono text-[11px] my-2">
                <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[9px] text-slate-500 block">Resonant Freq (f0)</span>
                  <span className="text-blue-300 font-bold">{rlcResults.f0.toFixed(0)} Hz</span>
                </div>
                <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[9px] text-slate-500 block">Damping Ratio (ζ)</span>
                  <span className="text-amber-300 font-bold">{rlcResults.zeta.toFixed(2)}</span>
                </div>
                <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[9px] text-slate-500 block">Quality Factor (Q)</span>
                  <span className="text-emerald-300 font-bold">{rlcResults.qFactor.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Op-Amp Tab */}
      {activeTab === "opamp" && (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-4 text-xs">
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => setOpAmpMode("inverting")}
                className={`flex-1 py-1 rounded text-[11px] font-bold border ${
                  opAmpMode === "inverting" ? "bg-blue-600 text-white border-blue-500" : "bg-slate-900 text-slate-400 border-slate-800"
                }`}
              >
                Inverting
              </button>
              <button
                type="button"
                onClick={() => setOpAmpMode("non-inverting")}
                className={`flex-1 py-1 rounded text-[11px] font-bold border ${
                  opAmpMode === "non-inverting" ? "bg-blue-600 text-white border-blue-500" : "bg-slate-900 text-slate-400 border-slate-800"
                }`}
              >
                Non-Invert
              </button>
              <button
                type="button"
                onClick={() => setOpAmpMode("schmitt")}
                className={`flex-1 py-1 rounded text-[11px] font-bold border ${
                  opAmpMode === "schmitt" ? "bg-blue-600 text-white border-blue-500" : "bg-slate-900 text-slate-400 border-slate-800"
                }`}
              >
                Schmitt
              </button>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span>Input Voltage (Vin)</span>
                <span className="font-mono text-blue-400 font-bold">{vinOp.toFixed(1)} V</span>
              </div>
              <input type="range" min="-10" max="10" step="0.5" value={vinOp} onChange={(e) => setVinOp(Number(e.target.value))} className="w-full accent-blue-600" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Rin ({rinOp} kΩ)</label>
                <input type="range" min="1" max="50" value={rinOp} onChange={(e) => setRinOp(Number(e.target.value))} className="w-full accent-blue-600" />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Rf ({rfOp} kΩ)</label>
                <input type="range" min="1" max="100" value={rfOp} onChange={(e) => setRfOp(Number(e.target.value))} className="w-full accent-blue-600" />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 rounded-xl border border-[var(--border-subtle)] bg-[#090b10] p-4 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-slate-300 mb-2 border-b border-slate-800 pb-2 flex justify-between">
                <span>Closed-Loop Output &amp; Gain Stage</span>
                <span className="font-mono text-amber-400 text-[11px]">V_sat = ±12 V</span>
              </div>

              <div className="p-3 my-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-emerald-300">
                {opAmpResults.formula}
              </div>

              <div className="flex justify-between items-center p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs">
                <span className="text-slate-400">Amplifier Output (Vout):</span>
                <span className={`text-base font-bold ${opAmpResults.saturated ? "text-amber-400" : "text-emerald-400"}`}>
                  {opAmpResults.vout.toFixed(2)} V {opAmpResults.saturated && "(Saturated)"}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400">
              Virtual Ground Principle: Inverting input V⁻ is held at 0 V by negative feedback as long as output remains out of saturation.
            </div>
          </div>
        </div>
      )}

      {/* 5. Virtual Dual-Trace Oscilloscope Tab */}
      {activeTab === "scope" && (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-4 text-xs">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-slate-400 uppercase tracking-wider">Channel Generator</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setScopeMode("YT")}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${scopeMode === "YT" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"}`}
                >
                  Y-T
                </button>
                <button
                  type="button"
                  onClick={() => setScopeMode("XY")}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${scopeMode === "XY" ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-400"}`}
                >
                  X-Y (Lissajous)
                </button>
              </div>
            </div>

            <div className="p-2 rounded bg-yellow-950/20 border border-yellow-800/40 space-y-1.5">
              <span className="text-[10px] font-bold text-yellow-400 block">CH1 (Yellow Trace)</span>
              <div className="flex justify-between text-[11px]">
                <span>Freq: {ch1Freq} Hz</span>
                <span>Amp: {ch1Amp.toFixed(1)} V</span>
              </div>
              <input type="range" min="200" max="3000" step="100" value={ch1Freq} onChange={(e) => setCh1Freq(Number(e.target.value))} className="w-full accent-yellow-400" />
              <input type="range" min="1" max="8" step="0.5" value={ch1Amp} onChange={(e) => setCh1Amp(Number(e.target.value))} className="w-full accent-yellow-400" />
            </div>

            <div className="p-2 rounded bg-cyan-950/20 border border-cyan-800/40 space-y-1.5">
              <span className="text-[10px] font-bold text-cyan-400 block">CH2 (Cyan Trace)</span>
              <div className="flex justify-between text-[11px]">
                <span>Freq: {ch2Freq} Hz | Amp: {ch2Amp.toFixed(1)} V</span>
                <span>Phase: {ch2PhaseDeg}°</span>
              </div>
              <input type="range" min="200" max="3000" step="100" value={ch2Freq} onChange={(e) => setCh2Freq(Number(e.target.value))} className="w-full accent-cyan-400" />
              <input type="range" min="1" max="8" step="0.5" value={ch2Amp} onChange={(e) => setCh2Amp(Number(e.target.value))} className="w-full accent-cyan-400" />
              <input type="range" min="0" max="360" step="15" value={ch2PhaseDeg} onChange={(e) => setCh2PhaseDeg(Number(e.target.value))} className="w-full accent-cyan-400" />
            </div>
          </div>

          <div className="lg:col-span-7 rounded-xl border border-[var(--border-subtle)] bg-[#040810] p-4 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-slate-300 mb-2 border-b border-slate-800 pb-2 flex justify-between font-mono">
                <span>Virtual CRT Screen ({scopeMode === "YT" ? "Dual-Trace Y-T" : "X-Y Lissajous Pattern"})</span>
                <span className="text-emerald-400 text-[10px]">1 ms / div</span>
              </div>

              <div className="relative h-36 w-full border border-slate-800 rounded bg-[#02050b] p-1 flex items-center justify-center">
                <svg viewBox="0 0 280 140" className="w-full h-full">
                  {/* Scope Grid */}
                  <line x1="0" y1="35" x2="280" y2="35" stroke="#1e293b" strokeDasharray="2 2" />
                  <line x1="0" y1="70" x2="280" y2="70" stroke="#334155" />
                  <line x1="0" y1="105" x2="280" y2="105" stroke="#1e293b" strokeDasharray="2 2" />
                  <line x1="70" y1="0" x2="70" y2="140" stroke="#1e293b" strokeDasharray="2 2" />
                  <line x1="140" y1="0" x2="140" y2="140" stroke="#334155" />
                  <line x1="210" y1="0" x2="210" y2="140" stroke="#1e293b" strokeDasharray="2 2" />

                  {scopeMode === "YT" ? (
                    <>
                      <polyline fill="none" stroke="#facc15" strokeWidth="2" points={scopeTraces.ch1} />
                      <polyline fill="none" stroke="#22d3ee" strokeWidth="2" points={scopeTraces.ch2} />
                    </>
                  ) : (
                    <polyline fill="none" stroke="#a855f7" strokeWidth="2.5" points={scopeTraces.xy} />
                  )}
                </svg>
              </div>
            </div>

            <div className="mt-2 text-[10px] text-slate-400 font-mono flex justify-between">
              <span>CH1: 2V / Div</span>
              <span>CH2: 2V / Div</span>
              <span>Phase: {ch2PhaseDeg}° (Lissajous ellipse)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
