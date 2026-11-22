"use client";

import React, { useState, useMemo } from "react";
import { Waves, AlertTriangle, ShieldCheck } from "lucide-react";

export interface FftSamplingVisualizerProps {
  className?: string;
}

export function FftSamplingVisualizer({ className = "" }: FftSamplingVisualizerProps) {
  const [signalFreq, setSignalFreq] = useState<number>(40); // Signal frequency in Hz
  const [samplingFreq, setSamplingFreq] = useState<number>(100); // Sampling rate fs in Hz
  const [hasHarmonic, setHasHarmonic] = useState<boolean>(false);
  const [harmonicFreq, setHarmonicFreq] = useState<number>(80);
  const [antiAliasingFilter, setAntiAliasingFilter] = useState<boolean>(false);

  const nyquistFreq = samplingFreq / 2;
  const isAliased = signalFreq > nyquistFreq;
  const apparentFreq = isAliased ? Math.abs(signalFreq - Math.round(signalFreq / samplingFreq) * samplingFreq) : signalFreq;

  const sim = useMemo(() => {
    // 1. Time domain waveforms over a 100 ms time window
    const duration = 0.1; // 100 ms
    const timePoints = 200;
    const analogWave: string[] = [];
    const width = 340;
    const midY = 60;

    // Filter attenuation if anti-aliasing filter active
    const signalGain = antiAliasingFilter && signalFreq > nyquistFreq ? Math.max(0.05, nyquistFreq / signalFreq) : 1.0;
    const harmonicGain = antiAliasingFilter && harmonicFreq > nyquistFreq ? Math.max(0.05, nyquistFreq / harmonicFreq) : 1.0;

    for (let i = 0; i <= timePoints; i++) {
      const t = (i / timePoints) * duration;
      let val = signalGain * Math.sin(2 * Math.PI * signalFreq * t);
      if (hasHarmonic) {
        val += 0.5 * harmonicGain * Math.sin(2 * Math.PI * harmonicFreq * t);
      }

      const x = (i / timePoints) * width;
      const y = midY - (val / 1.6) * 45;
      analogWave.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }

    // Discrete sample points
    const sampleInterval = 1 / samplingFreq;
    const numSamples = Math.floor(duration / sampleInterval);
    const samples: Array<{ x: number; y: number; val: number }> = [];

    for (let s = 0; s <= numSamples; s++) {
      const t = s * sampleInterval;
      if (t > duration) break;
      let val = signalGain * Math.sin(2 * Math.PI * signalFreq * t);
      if (hasHarmonic) {
        val += 0.5 * harmonicGain * Math.sin(2 * Math.PI * harmonicFreq * t);
      }
      const x = (t / duration) * width;
      const y = midY - (val / 1.6) * 45;
      samples.push({ x, y, val });
    }

    // 2. Frequency Spectrum via 32-bin Discrete Fourier Transform (DFT)
    const numBins = 32;
    const dftMagnitudes: Array<{ freq: number; magnitude: number }> = [];
    const maxFreq = samplingFreq / 2;

    for (let k = 0; k < numBins; k++) {
      const binFreq = (k / numBins) * maxFreq;
      let realSum = 0;
      let imagSum = 0;

      for (let n = 0; n < samples.length; n++) {
        const angle = (2 * Math.PI * k * n) / samples.length;
        realSum += samples[n].val * Math.cos(angle);
        imagSum -= samples[n].val * Math.sin(angle);
      }

      const mag = Math.sqrt(realSum * realSum + imagSum * imagSum) / (samples.length / 2 || 1);
      dftMagnitudes.push({ freq: binFreq, magnitude: Math.min(1.0, mag) });
    }

    return {
      analogPath: analogWave.join(" "),
      samples,
      dftMagnitudes,
    };
  }, [signalFreq, samplingFreq, hasHarmonic, harmonicFreq, antiAliasingFilter, nyquistFreq]);

  return (
    <div
      className={`fft-sampling-visualizer-root rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-5 text-[var(--text-primary)] shadow-sm ${className}`}
      data-testid="fft-sampling-visualizer"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Waves className="text-indigo-400" size={18} />
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              Nyquist-Shannon Sampling &amp; DFT/FFT Spectrum Visualizer
            </h3>
          </div>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Explore continuous-to-discrete conversion, aliasing distortion, Nyquist criterion (fs ≥ 2 fin), and real-time DFT frequency spectrum.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAliased ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs font-bold animate-pulse">
              <AlertTriangle size={14} /> Aliasing Detected! (f_apparent = {apparentFreq.toFixed(0)} Hz)
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs font-bold">
              <ShieldCheck size={14} /> Nyquist Condition Met (fs &gt; 2 fin)
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Panel */}
        <div className="lg:col-span-5 space-y-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-4 text-xs">
          <span className="font-bold text-slate-400 uppercase tracking-wider block">Signal &amp; Sampler Parameters</span>

          <div>
            <div className="flex justify-between mb-1">
              <span>Input Signal Frequency (fin)</span>
              <span className="font-mono font-bold text-blue-400">{signalFreq} Hz</span>
            </div>
            <input
              type="range"
              min="10"
              max="150"
              step="5"
              value={signalFreq}
              onChange={(e) => setSignalFreq(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span>Sampling Frequency (fs)</span>
              <span className="font-mono font-bold text-indigo-400">
                {samplingFreq} Hz (Nyquist: {nyquistFreq} Hz)
              </span>
            </div>
            <input
              type="range"
              min="20"
              max="300"
              step="10"
              value={samplingFreq}
              onChange={(e) => setSamplingFreq(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
          </div>

          <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasHarmonic}
                onChange={(e) => setHasHarmonic(e.target.checked)}
                className="accent-indigo-600 rounded"
              />
              <span className="font-semibold text-slate-300">Add 2nd Harmonic Component</span>
            </label>

            {hasHarmonic && (
              <div>
                <div className="flex justify-between mb-1 text-[11px]">
                  <span>Harmonic Frequency</span>
                  <span className="font-mono text-cyan-400">{harmonicFreq} Hz</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="200"
                  step="10"
                  value={harmonicFreq}
                  onChange={(e) => setHarmonicFreq(Number(e.target.value))}
                  className="w-full accent-cyan-600"
                />
              </div>
            )}

            <label className="flex items-center gap-2 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={antiAliasingFilter}
                onChange={(e) => setAntiAliasingFilter(e.target.checked)}
                className="accent-emerald-600 rounded"
              />
              <span className="font-semibold text-emerald-400">Enable Analog Anti-Aliasing Low-Pass Filter</span>
            </label>
          </div>
        </div>

        {/* Visualizer Canvas */}
        <div className="lg:col-span-7 space-y-4">
          {/* Time Domain */}
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[#030712] p-4">
            <div className="flex justify-between items-center text-xs font-mono mb-2 pb-2 border-b border-slate-800">
              <span className="text-slate-300 font-bold">Time Domain: Continuous vs. Sampled Dots</span>
              <span className="text-slate-500 text-[10px]">100 ms Window</span>
            </div>

            <div className="relative h-28 w-full border border-slate-800 rounded bg-[#02050b] p-1 flex items-center justify-center">
              <svg viewBox="0 0 340 120" className="w-full h-full">
                {/* Center baseline */}
                <line x1="0" y1="60" x2="340" y2="60" stroke="#1e293b" />

                {/* Continuous analog waveform */}
                <polyline fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeOpacity="0.7" points={sim.analogPath} />

                {/* Sampled points */}
                {sim.samples.map((s, idx) => (
                  <g key={idx}>
                    <line x1={s.x} y1="60" x2={s.x} y2={s.y} stroke="#818cf8" strokeWidth="1" strokeDasharray="1 1" />
                    <circle cx={s.x} cy={s.y} r="2.5" fill={isAliased ? "#f43f5e" : "#34d399"} />
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* Frequency Domain DFT Spectrum */}
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[#030712] p-4">
            <div className="flex justify-between items-center text-xs font-mono mb-2 pb-2 border-b border-slate-800">
              <span className="text-slate-300 font-bold">Discrete Fourier Transform (DFT) Magnitude Spectrum</span>
              <span className="text-slate-500 text-[10px]">DC to fs/2 ({nyquistFreq} Hz)</span>
            </div>

            <div className="h-28 w-full border border-slate-800 rounded bg-[#02050b] p-2 flex items-end justify-between gap-1">
              {sim.dftMagnitudes.map((bin, idx) => {
                const barHeight = Math.max(4, bin.magnitude * 85);
                const isSignalPeak = Math.abs(bin.freq - apparentFreq) < nyquistFreq / 16;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1" title={`${bin.freq.toFixed(0)} Hz: ${bin.magnitude.toFixed(2)}`}>
                    <div
                      style={{ height: `${barHeight}px` }}
                      className={`w-full rounded-t transition-all ${
                        isSignalPeak
                          ? isAliased
                            ? "bg-rose-500 shadow-md shadow-rose-500/50"
                            : "bg-emerald-500 shadow-md shadow-emerald-500/50"
                          : "bg-indigo-600/40"
                      }`}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>0 Hz (DC)</span>
              <span>{(nyquistFreq / 2).toFixed(0)} Hz</span>
              <span>{nyquistFreq.toFixed(0)} Hz (Nyquist)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
