"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Sliders, RotateCcw, Image as ImageIcon } from "lucide-react";

export type ImageLabFilter = "none" | "sharpen" | "blur" | "edge" | "emboss";

export type ImageLabVisualizerProps = {
  initialFilter?: string;
};

export function ImageLabVisualizer({ initialFilter = "none" }: ImageLabVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const histogramRef = useRef<HTMLCanvasElement | null>(null);

  // Adjustment parameters
  const [exposure, setExposure] = useState(0); // -100 to 100
  const [contrast, setContrast] = useState(1); // 0.5 to 2.5
  const [saturation, setSaturation] = useState(1); // 0.0 to 2.5
  const [channelR, setChannelR] = useState(1); // 0.0 to 2.0
  const [channelG, setChannelG] = useState(1); // 0.0 to 2.0
  const [channelB, setChannelB] = useState(1); // 0.0 to 2.0
  const [filter, setFilter] = useState<ImageLabFilter>(
    ["none", "sharpen", "blur", "edge", "emboss"].includes(initialFilter)
      ? (initialFilter as ImageLabFilter)
      : "none"
  );
  const [isGrayscale, setIsGrayscale] = useState(false);
  const [isInverted, setIsInverted] = useState(false);

  // Inspector state
  const [inspectedPixel, setInspectedPixel] = useState<{ x: number; y: number; r: number; g: number; b: number } | null>(null);

  // Reset to neutral state
  const handleReset = useCallback(() => {
    setExposure(0);
    setContrast(1);
    setSaturation(1);
    setChannelR(1);
    setChannelG(1);
    setChannelB(1);
    setFilter("none");
    setIsGrayscale(false);
    setIsInverted(false);
  }, []);

  // Draw procedural source card and apply DSP pipeline
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 360;
    const height = 240;
    canvas.width = width;
    canvas.height = height;

    // 1. Generate rich procedural test scene (no network required)
    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.6);
    skyGrad.addColorStop(0, "#1e3a8a");
    skyGrad.addColorStop(0.5, "#3b82f6");
    skyGrad.addColorStop(1, "#93c5fd");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height * 0.6);

    // Sun disc
    ctx.fillStyle = "#fef08a";
    ctx.beginPath();
    ctx.arc(width * 0.75, height * 0.25, 32, 0, Math.PI * 2);
    ctx.fill();

    // Mountain silhouettes
    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.moveTo(0, height * 0.6);
    ctx.lineTo(width * 0.3, height * 0.35);
    ctx.lineTo(width * 0.55, height * 0.55);
    ctx.lineTo(width * 0.8, height * 0.3);
    ctx.lineTo(width, height * 0.58);
    ctx.lineTo(width, height * 0.6);
    ctx.closePath();
    ctx.fill();

    // Terrain ground gradient
    const groundGrad = ctx.createLinearGradient(0, height * 0.6, 0, height);
    groundGrad.addColorStop(0, "#15803d");
    groundGrad.addColorStop(1, "#047857");
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, height * 0.6, width, height * 0.4);

    // Color swatches test bar
    const swatches = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#a855f7", "#ec4899", "#ffffff", "#000000"];
    const swatchW = width / swatches.length;
    swatches.forEach((c, idx) => {
      ctx.fillStyle = c;
      ctx.fillRect(idx * swatchW, height - 28, swatchW, 28);
    });

    // Step grayscale wedge
    const wedgeSteps = 8;
    const wedgeW = width / wedgeSteps;
    for (let i = 0; i < wedgeSteps; i++) {
      const val = Math.floor((i / (wedgeSteps - 1)) * 255);
      ctx.fillStyle = `rgb(${val},${val},${val})`;
      ctx.fillRect(i * wedgeW, height - 52, wedgeW, 20);
    }

    // 2. Read pixel buffer for software DSP manipulation
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    // Convolution kernels
    let kernel: number[] | null = null;
    let kernelWeight = 1;

    if (filter === "sharpen") {
      kernel = [
        0, -1, 0,
        -1, 5, -1,
        0, -1, 0
      ];
      kernelWeight = 1;
    } else if (filter === "blur") {
      kernel = [
        1/16, 2/16, 1/16,
        2/16, 4/16, 2/16,
        1/16, 2/16, 1/16
      ];
      kernelWeight = 1;
    } else if (filter === "edge") {
      kernel = [
        -1, -1, -1,
        -1,  8, -1,
        -1, -1, -1
      ];
      kernelWeight = 1;
    } else if (filter === "emboss") {
      kernel = [
        -2, -1, 0,
        -1,  1, 1,
        0,   1, 2
      ];
      kernelWeight = 1;
    }

    // Apply convolution if requested
    let workingBuffer = new Uint8ClampedArray(data);
    if (kernel) {
      const convOut = new Uint8ClampedArray(data.length);
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          let r = 0, g = 0, b = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const weight = kernel[(ky + 1) * 3 + (kx + 1)];
              const pIdx = ((y + ky) * width + (x + kx)) * 4;
              r += workingBuffer[pIdx] * weight;
              g += workingBuffer[pIdx + 1] * weight;
              b += workingBuffer[pIdx + 2] * weight;
            }
          }
          const outIdx = (y * width + x) * 4;
          if (filter === "emboss") {
            convOut[outIdx] = Math.min(255, Math.max(0, (r / kernelWeight) + 128));
            convOut[outIdx + 1] = Math.min(255, Math.max(0, (g / kernelWeight) + 128));
            convOut[outIdx + 2] = Math.min(255, Math.max(0, (b / kernelWeight) + 128));
          } else {
            convOut[outIdx] = Math.min(255, Math.max(0, r / kernelWeight));
            convOut[outIdx + 1] = Math.min(255, Math.max(0, g / kernelWeight));
            convOut[outIdx + 2] = Math.min(255, Math.max(0, b / kernelWeight));
          }
          convOut[outIdx + 3] = workingBuffer[outIdx + 3];
        }
      }
      workingBuffer = convOut;
    }

    // Color histogram counters (256 bins each)
    const histR = new Array(256).fill(0);
    const histG = new Array(256).fill(0);
    const histB = new Array(256).fill(0);

    // Apply point-wise color corrections (Exposure, Contrast, Saturation, Invert, Grayscale, Channels)
    for (let i = 0; i < workingBuffer.length; i += 4) {
      let r = workingBuffer[i];
      let g = workingBuffer[i + 1];
      let b = workingBuffer[i + 2];

      // Channel multipliers
      r = r * channelR;
      g = g * channelG;
      b = b * channelB;

      // Exposure adjustment
      r += exposure;
      g += exposure;
      b += exposure;

      // Contrast: (color - 128) * contrast + 128
      r = (r - 128) * contrast + 128;
      g = (g - 128) * contrast + 128;
      b = (b - 128) * contrast + 128;

      // Saturation (luminance formula: 0.299R + 0.587G + 0.114B)
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      r = lum + (r - lum) * saturation;
      g = lum + (g - lum) * saturation;
      b = lum + (b - lum) * saturation;

      // Grayscale
      if (isGrayscale) {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        r = gray;
        g = gray;
        b = gray;
      }

      // Invert
      if (isInverted) {
        r = 255 - r;
        g = 255 - g;
        b = 255 - b;
      }

      // Clamp to [0, 255]
      const finalR = Math.min(255, Math.max(0, Math.round(r)));
      const finalG = Math.min(255, Math.max(0, Math.round(g)));
      const finalB = Math.min(255, Math.max(0, Math.round(b)));

      data[i] = finalR;
      data[i + 1] = finalG;
      data[i + 2] = finalB;

      // Accumulate histogram
      histR[finalR]++;
      histG[finalG]++;
      histB[finalB]++;
    }

    ctx.putImageData(imgData, 0, 0);

    // 3. Render RGB Histogram
    const histCanvas = histogramRef.current;
    if (histCanvas) {
      const hCtx = histCanvas.getContext("2d");
      if (hCtx) {
        const hw = 360;
        const hh = 70;
        histCanvas.width = hw;
        histCanvas.height = hh;

        hCtx.fillStyle = "#090d16";
        hCtx.fillRect(0, 0, hw, hh);

        // Find peak bin for normalization
        const maxVal = Math.max(...histR, ...histG, ...histB, 1);

        // Plot channels with alpha blending
        const drawChannel = (bins: number[], color: string) => {
          hCtx.strokeStyle = color;
          hCtx.fillStyle = color;
          hCtx.beginPath();
          hCtx.moveTo(0, hh);
          for (let b = 0; b < 256; b++) {
            const x = (b / 255) * hw;
            const barHeight = (bins[b] / maxVal) * (hh - 6);
            const y = hh - barHeight;
            hCtx.lineTo(x, y);
          }
          hCtx.stroke();
        };

        drawChannel(histR, "rgba(239, 68, 68, 0.75)");
        drawChannel(histG, "rgba(34, 197, 94, 0.75)");
        drawChannel(histB, "rgba(59, 130, 246, 0.75)");
      }
    }
  }, [exposure, contrast, saturation, channelR, channelG, channelB, filter, isGrayscale, isInverted]);

  // Handle pixel hover
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const p = ctx.getImageData(x, y, 1, 1).data;
        setInspectedPixel({ x, y, r: p[0], g: p[1], b: p[2] });
      }
    }
  };

  return (
    <div className="image-lab-container rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-4 flex flex-col gap-4 text-sm text-[var(--text-primary)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
        <div className="flex items-center gap-2">
          <ImageIcon size={18} className="text-blue-500" />
          <h4 className="font-semibold text-base text-[var(--text-primary)]">Interactive Image &amp; Color Lab</h4>
          <span className="text-xs px-2 py-0.5 rounded bg-[var(--surface-secondary)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
            Procedural DSP
          </span>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] rounded px-2 py-1 transition-colors bg-[var(--surface-primary)]"
        >
          <RotateCcw size={12} /> Reset Parameters
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Canvas & Histogram View */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="canvas-wrapper relative flex flex-col items-center border border-[var(--border-subtle)] rounded-lg bg-[#000000] p-2 overflow-hidden shadow-inner">
            <canvas
              ref={canvasRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setInspectedPixel(null)}
              className="rounded max-w-full cursor-crosshair"
              style={{ imageRendering: "pixelated" }}
            />
            {inspectedPixel && (
              <div className="absolute top-3 left-3 bg-black/80 backdrop-blur border border-white/20 text-white text-xs px-2 py-1 rounded shadow pointer-events-none flex items-center gap-2 font-mono">
                <span
                  className="w-3 h-3 rounded-full border border-white/40"
                  style={{ backgroundColor: `rgb(${inspectedPixel.r}, ${inspectedPixel.g}, ${inspectedPixel.b})` }}
                />
                <span>({inspectedPixel.x}, {inspectedPixel.y})</span>
                <span>RGB({inspectedPixel.r}, {inspectedPixel.g}, {inspectedPixel.b})</span>
              </div>
            )}
          </div>

          {/* Histogram Panel */}
          <div className="histogram-card border border-[var(--border-subtle)] rounded-lg bg-[var(--surface-secondary)] p-2">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-1 px-1">
              <span className="flex items-center gap-1 font-medium">
                <Sliders size={12} /> RGB Histogram Distribution
              </span>
              <div className="flex items-center gap-2 font-mono text-[10px]">
                <span className="text-red-400">● Red</span>
                <span className="text-green-400">● Green</span>
                <span className="text-blue-400">● Blue</span>
              </div>
            </div>
            <canvas ref={histogramRef} className="w-full rounded h-[60px]" />
          </div>
        </div>

        {/* Right: Interactive Controls */}
        <div className="lg:col-span-5 flex flex-col gap-3 bg-[var(--surface-secondary)] p-3 rounded-lg border border-[var(--border-subtle)]">
          <h5 className="font-medium text-xs text-[var(--text-secondary)] uppercase tracking-wider">Tone &amp; Color Adjustments</h5>

          {/* Exposure Slider */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs">
              <span>Exposure / Brightness</span>
              <span className="font-mono text-[var(--text-secondary)]">{exposure > 0 ? `+${exposure}` : exposure}</span>
            </div>
            <input
              type="range"
              min={-100}
              max={100}
              value={exposure}
              onChange={(e) => setExposure(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>

          {/* Contrast Slider */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs">
              <span>Contrast</span>
              <span className="font-mono text-[var(--text-secondary)]">{contrast.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={2.5}
              step={0.05}
              value={contrast}
              onChange={(e) => setContrast(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>

          {/* Saturation Slider */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs">
              <span>Color Saturation</span>
              <span className="font-mono text-[var(--text-secondary)]">{saturation.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min={0}
              max={2.5}
              step={0.05}
              value={saturation}
              onChange={(e) => setSaturation(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>

          {/* RGB Channel Multipliers */}
          <div className="flex flex-col gap-2 pt-1 border-t border-[var(--border-subtle)]">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Channel Multipliers</span>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] text-red-500 font-mono">Red: {channelR.toFixed(1)}</span>
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.1}
                  value={channelR}
                  onChange={(e) => setChannelR(Number(e.target.value))}
                  className="accent-red-500 w-full"
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] text-green-500 font-mono">Green: {channelG.toFixed(1)}</span>
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.1}
                  value={channelG}
                  onChange={(e) => setChannelG(Number(e.target.value))}
                  className="accent-green-500 w-full"
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] text-blue-500 font-mono">Blue: {channelB.toFixed(1)}</span>
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.1}
                  value={channelB}
                  onChange={(e) => setChannelB(Number(e.target.value))}
                  className="accent-blue-500 w-full"
                />
              </div>
            </div>
          </div>

          {/* Spatial Convolution Filters */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-[var(--border-subtle)]">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Spatial Convolution (3×3 Kernel)</span>
            <div className="grid grid-cols-3 gap-1.5">
              {(["none", "sharpen", "blur", "edge", "emboss"] as ImageLabFilter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`text-xs py-1 px-2 rounded border capitalize transition-colors ${
                    filter === f
                      ? "bg-blue-600 text-white border-blue-500 font-semibold"
                      : "bg-[var(--surface-primary)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {f === "none" ? "Normal" : f}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-3 pt-2 border-t border-[var(--border-subtle)] text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isGrayscale}
                onChange={(e) => setIsGrayscale(e.target.checked)}
                className="rounded accent-blue-600"
              />
              <span>Grayscale</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isInverted}
                onChange={(e) => setIsInverted(e.target.checked)}
                className="rounded accent-blue-600"
              />
              <span>Invert Colors</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
