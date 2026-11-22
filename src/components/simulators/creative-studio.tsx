"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Music, Radio, Terminal, Compass, Play, Square, Volume2, Sparkles, CheckCircle, AlertTriangle } from "lucide-react";

export type CreativeStudioMode = "melody" | "morse" | "snake" | "maze";

export interface CreativeStudioProps {
  className?: string;
  initialMode?: CreativeStudioMode;
}

// Frequencies for 8-bit notes (Hz)
const NOTE_FREQS: Record<string, number> = {
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  G5: 783.99,
  REST: 0,
};

const MELODY_PRESETS: Record<string, Array<{ note: string; dur: number }>> = {
  mario: [
    { note: "E5", dur: 120 },
    { note: "REST", dur: 30 },
    { note: "E5", dur: 120 },
    { note: "REST", dur: 120 },
    { note: "E5", dur: 120 },
    { note: "REST", dur: 120 },
    { note: "C5", dur: 120 },
    { note: "REST", dur: 30 },
    { note: "E5", dur: 150 },
    { note: "G5", dur: 250 },
    { note: "REST", dur: 200 },
    { note: "G4", dur: 250 },
  ],
  tetris: [
    { note: "E5", dur: 250 },
    { note: "B4", dur: 125 },
    { note: "C5", dur: 125 },
    { note: "D5", dur: 250 },
    { note: "C5", dur: 125 },
    { note: "B4", dur: 125 },
    { note: "A4", dur: 250 },
    { note: "A4", dur: 125 },
    { note: "C5", dur: 125 },
    { note: "E5", dur: 250 },
    { note: "D5", dur: 125 },
    { note: "C5", dur: 125 },
    { note: "B4", dur: 375 },
  ],
  scale: [
    { note: "C4", dur: 180 },
    { note: "D4", dur: 180 },
    { note: "E4", dur: 180 },
    { note: "F4", dur: 180 },
    { note: "G4", dur: 180 },
    { note: "A4", dur: 180 },
    { note: "B4", dur: 180 },
    { note: "C5", dur: 300 },
  ],
};

const MORSE_MAP: Record<string, string> = {
  A: ".-",
  B: "-...",
  C: "-.-.",
  D: "-..",
  E: ".",
  F: "..-.",
  G: "--.",
  H: "....",
  I: "..",
  J: ".---",
  K: "-.-",
  L: ".-..",
  M: "--",
  N: "-.",
  O: "---",
  P: ".--.",
  Q: "--.-",
  R: ".-.",
  S: "...",
  T: "-",
  U: "..-",
  V: "...-",
  W: ".--",
  X: "-..-",
  Y: "-.--",
  Z: "--..",
  "0": "-----",
  "1": ".----",
  "2": "..---",
  "3": "...--",
  "4": "....-",
  "5": ".....",
  "6": "-....",
  "7": "--...",
  "8": "---..",
  "9": "----.",
  " ": "/",
};

export function CreativeStudio({ className = "", initialMode = "melody" }: CreativeStudioProps) {
  const [mode, setMode] = useState<CreativeStudioMode>(initialMode);

  // --- 1. Piezo Melody State ---
  const [selectedMelody, setSelectedMelody] = useState<"mario" | "tetris" | "scale">("mario");
  const [isPlayingMelody, setIsPlayingMelody] = useState<boolean>(false);
  const [currentNote, setCurrentNote] = useState<string | null>(null);
  const [melodySpeed, setMelodySpeed] = useState<number>(1.0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const isPlayingRef = useRef<boolean>(false);

  const getAudioContext = (): AudioContext | null => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current.state === "suspended") {
        void audioCtxRef.current.resume();
      }
      return audioCtxRef.current;
    } catch {
      return null;
    }
  };

  const playTone = useCallback((freq: number, durMs: number): Promise<void> => {
    return new Promise((resolve) => {
      if (freq <= 0) {
        setTimeout(resolve, durMs);
        return;
      }
      const ctx = getAudioContext();
      if (!ctx) {
        setTimeout(resolve, durMs);
        return;
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square"; // 8-bit chiptune square wave
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durMs / 1000);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + durMs / 1000);
      setTimeout(resolve, durMs);
    });
  }, []);

  const playMelodySequence = async () => {
    if (isPlayingMelody) return;
    setIsPlayingMelody(true);
    isPlayingRef.current = true;
    const notes = MELODY_PRESETS[selectedMelody];

    for (const item of notes) {
      if (!isPlayingRef.current) break;
      setCurrentNote(item.note);
      const freq = NOTE_FREQS[item.note] || 0;
      const dur = Math.round(item.dur / melodySpeed);
      await playTone(freq, dur);
      // Gap between notes
      await new Promise((r) => setTimeout(r, 20));
    }

    setCurrentNote(null);
    setIsPlayingMelody(false);
    isPlayingRef.current = false;
  };

  const stopMelody = () => {
    isPlayingRef.current = false;
    setIsPlayingMelody(false);
    setCurrentNote(null);
  };

  // --- 2. Morse Code State ---
  const [morseInput, setMorseInput] = useState<string>("SOS KATALYST");
  const [isTransmittingMorse, setIsTransmittingMorse] = useState<boolean>(false);
  const [morseLedState, setMorseLedState] = useState<boolean>(false);
  const [morseCurrentChar, setMorseCurrentChar] = useState<string>("");
  const morseCancelRef = useRef<boolean>(false);

  const textToMorseString = (text: string): string => {
    return text
      .toUpperCase()
      .split("")
      .map((ch) => MORSE_MAP[ch] || "")
      .filter(Boolean)
      .join(" ");
  };

  const transmitMorse = async () => {
    if (isTransmittingMorse) return;
    setIsTransmittingMorse(true);
    morseCancelRef.current = false;

    const unitMs = 120; // 1 Morse dot unit
    const chars = morseInput.toUpperCase().split("");

    for (const ch of chars) {
      if (morseCancelRef.current) break;
      setMorseCurrentChar(ch);
      const code = MORSE_MAP[ch];

      if (!code || code === "/") {
        // Word gap: 7 units
        setMorseLedState(false);
        await new Promise((r) => setTimeout(r, unitMs * 4));
        continue;
      }

      for (const symbol of code.split("")) {
        if (morseCancelRef.current) break;
        if (symbol === ".") {
          setMorseLedState(true);
          void playTone(750, unitMs);
          await new Promise((r) => setTimeout(r, unitMs));
        } else if (symbol === "-") {
          setMorseLedState(true);
          void playTone(750, unitMs * 3);
          await new Promise((r) => setTimeout(r, unitMs * 3));
        }
        setMorseLedState(false);
        // Intra-symbol space: 1 unit
        await new Promise((r) => setTimeout(r, unitMs));
      }

      // Letter space: 3 units (1 unit already spent above, wait 2 more)
      await new Promise((r) => setTimeout(r, unitMs * 2));
    }

    setMorseLedState(false);
    setMorseCurrentChar("");
    setIsTransmittingMorse(false);
    morseCancelRef.current = false;
  };

  const stopMorse = () => {
    morseCancelRef.current = true;
    setIsTransmittingMorse(false);
    setMorseLedState(false);
    setMorseCurrentChar("");
  };

  // --- 3. Snake Game State ---
  const [snake, setSnake] = useState<Array<[number, number]>>([
    [5, 5],
    [5, 4],
    [5, 3],
  ]);
  const [food, setFood] = useState<[number, number]>([8, 8]);
  const [snakeDir, setSnakeDir] = useState<"UP" | "DOWN" | "LEFT" | "RIGHT">("RIGHT");
  const [snakeScore, setSnakeScore] = useState<number>(0);
  const [isSnakeRunning, setIsSnakeRunning] = useState<boolean>(false);
  const [snakeGameOver, setSnakeGameOver] = useState<boolean>(false);
  const gridRows = 12;
  const gridCols = 16;

  const resetSnake = () => {
    setSnake([
      [5, 5],
      [5, 4],
      [5, 3],
    ]);
    setFood([8, 8]);
    setSnakeDir("RIGHT");
    setSnakeScore(0);
    setSnakeGameOver(false);
    setIsSnakeRunning(false);
  };

  const stepSnake = useCallback(() => {
    setSnake((prevSnake) => {
      const head = prevSnake[0];
      let newHead: [number, number];

      switch (snakeDir) {
        case "UP":
          newHead = [head[0] - 1, head[1]];
          break;
        case "DOWN":
          newHead = [head[0] + 1, head[1]];
          break;
        case "LEFT":
          newHead = [head[0], head[1] - 1];
          break;
        case "RIGHT":
          newHead = [head[0], head[1] + 1];
          break;
      }

      // Wall collision check
      if (
        newHead[0] < 0 ||
        newHead[0] >= gridRows ||
        newHead[1] < 0 ||
        newHead[1] >= gridCols
      ) {
        setSnakeGameOver(true);
        setIsSnakeRunning(false);
        return prevSnake;
      }

      // Self collision check
      if (prevSnake.some(([r, c]) => r === newHead[0] && c === newHead[1])) {
        setSnakeGameOver(true);
        setIsSnakeRunning(false);
        return prevSnake;
      }

      // Check food
      const eats = newHead[0] === food[0] && newHead[1] === food[1];
      const nextSnake = [newHead, ...prevSnake];

      if (eats) {
        setSnakeScore((s) => s + 10);
        void playTone(880, 80);
        // Place new food
        const nextFood: [number, number] = [
          Math.floor(Math.random() * (gridRows - 2)) + 1,
          Math.floor(Math.random() * (gridCols - 2)) + 1,
        ];
        setFood(nextFood);
      } else {
        nextSnake.pop();
      }

      return nextSnake;
    });
  }, [snakeDir, food, playTone]);

  useEffect(() => {
    if (!isSnakeRunning || snakeGameOver) return;
    const timer = setInterval(() => {
      stepSnake();
    }, 200);
    return () => clearInterval(timer);
  }, [isSnakeRunning, snakeGameOver, stepSnake]);

  // --- 4. Logic Gate Maze State ---
  // Switches: A, B, C, D (0 or 1)
  // Maze door 1 opens if: A XOR B == 1
  // Maze door 2 opens if: (B AND C) OR NOT(D) == 1
  // Maze vault unlocks if: Door1 AND Door2 AND (A NOR C == 0)
  const [swA, setSwA] = useState<number>(0);
  const [swB, setSwB] = useState<number>(1);
  const [swC, setSwC] = useState<number>(0);
  const [swD, setSwD] = useState<number>(0);

  const door1Open = (swA ^ swB) === 1;
  const door2Open = (swB === 1 && swC === 1) || swD === 0;
  const door3Condition = !(swA === 0 && swC === 0);
  const vaultUnlocked = door1Open && door2Open && door3Condition;

  return (
    <div className={`rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-4 shadow-sm text-[var(--text-primary)] ${className}`}>
      {/* Studio Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-500/20 text-pink-400">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Creative Engineering Studio</h3>
            <p className="text-[11px] text-[var(--text-secondary)]">Playful physical computing, chiptune sound, optical signals, and game state machines</p>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex rounded-lg bg-[var(--surface-secondary)] p-1 border border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={() => setMode("melody")}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors flex items-center gap-1 ${
              mode === "melody" ? "bg-pink-600 text-white" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Music size={12} /> 8-Bit Melody
          </button>
          <button
            type="button"
            onClick={() => setMode("morse")}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors flex items-center gap-1 ${
              mode === "morse" ? "bg-pink-600 text-white" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Radio size={12} /> Morse Transmitter
          </button>
          <button
            type="button"
            onClick={() => setMode("snake")}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors flex items-center gap-1 ${
              mode === "snake" ? "bg-pink-600 text-white" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Terminal size={12} /> Terminal Snake
          </button>
          <button
            type="button"
            onClick={() => setMode("maze")}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors flex items-center gap-1 ${
              mode === "maze" ? "bg-pink-600 text-white" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Compass size={12} /> Logic Maze
          </button>
        </div>
      </div>

      {/* 1. PIEZO MELODY PLAYER */}
      {mode === "melody" && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--surface-secondary)] p-3 rounded-lg border border-[var(--border-subtle)] text-xs">
            <div className="flex items-center gap-3">
              <span className="text-zinc-400 font-semibold">Chiptune Song:</span>
              {(["mario", "tetris", "scale"] as const).map((song) => (
                <button
                  key={song}
                  type="button"
                  onClick={() => {
                    stopMelody();
                    setSelectedMelody(song);
                  }}
                  className={`rounded px-2.5 py-1 font-mono uppercase text-[11px] font-semibold border ${
                    selectedMelody === song
                      ? "bg-pink-600 text-white border-pink-500"
                      : "bg-zinc-800 text-zinc-300 border-zinc-700"
                  }`}
                >
                  {song}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-zinc-400">Tempo:</span>
              <button
                type="button"
                onClick={() => setMelodySpeed(0.8)}
                className={`px-2 py-0.5 rounded text-[11px] ${melodySpeed === 0.8 ? "bg-pink-600 text-white" : "bg-zinc-800 text-zinc-300"}`}
              >
                0.8x
              </button>
              <button
                type="button"
                onClick={() => setMelodySpeed(1.0)}
                className={`px-2 py-0.5 rounded text-[11px] ${melodySpeed === 1.0 ? "bg-pink-600 text-white" : "bg-zinc-800 text-zinc-300"}`}
              >
                1.0x
              </button>
              <button
                type="button"
                onClick={() => setMelodySpeed(1.3)}
                className={`px-2 py-0.5 rounded text-[11px] ${melodySpeed === 1.3 ? "bg-pink-600 text-white" : "bg-zinc-800 text-zinc-300"}`}
              >
                1.3x
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-8 rounded-lg border border-pink-900/30 bg-[#070b14] p-5 flex flex-col items-center justify-center min-h-[220px]">
              <div className="flex items-center gap-3 mb-4">
                <Volume2 className={isPlayingMelody ? "text-pink-400 animate-pulse" : "text-zinc-600"} size={28} />
                <div className="text-center">
                  <div className="text-xs text-zinc-400">Active Note Frequency:</div>
                  <div className="text-2xl font-mono font-bold text-pink-300">
                    {currentNote ? `${currentNote} (${NOTE_FREQS[currentNote]} Hz)` : "Idle"}
                  </div>
                </div>
              </div>

              {/* Piano Keyboard Key Visualizer */}
              <div className="flex items-end gap-1.5 p-2 bg-zinc-950 rounded-lg border border-zinc-800">
                {Object.keys(NOTE_FREQS)
                  .filter((n) => n !== "REST")
                  .map((note) => {
                    const isHit = currentNote === note;
                    return (
                      <button
                        key={note}
                        type="button"
                        onClick={() => void playTone(NOTE_FREQS[note], 250)}
                        className={`h-20 w-8 rounded-b transition-all flex flex-col justify-end p-1 text-[10px] font-mono font-bold ${
                          isHit
                            ? "bg-pink-500 text-white shadow-[0_0_12px_rgba(236,72,153,0.8)] scale-95"
                            : "bg-zinc-200 text-zinc-900 hover:bg-zinc-100"
                        }`}
                      >
                        {note}
                      </button>
                    );
                  })}
              </div>

              <div className="flex items-center gap-3 mt-4">
                {!isPlayingMelody ? (
                  <button
                    type="button"
                    onClick={() => void playMelodySequence()}
                    className="flex items-center gap-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 px-4 py-2 text-xs font-semibold text-white shadow-md"
                  >
                    <Play size={14} /> Play Melody (User Gesture)
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopMelody}
                    className="flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-500 px-4 py-2 text-xs font-semibold text-white shadow-md"
                  >
                    <Square size={14} /> Stop Playback
                  </button>
                )}
              </div>
            </div>

            <div className="md:col-span-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-4 text-xs space-y-3">
              <h4 className="font-semibold text-zinc-200">Piezoelectric Sound Synthesis</h4>
              <p className="text-[var(--text-secondary)] text-[11px] leading-relaxed">
                A piezoelectric buzzer vibrates a thin ceramic crystal using square wave PWM toggling. In microcontroller firmware, the <code>tone(pin, freq, duration)</code> function programs a hardware timer to output exact audio frequencies.
              </p>
              <div className="rounded bg-zinc-950 p-2.5 font-mono text-[10px] text-zinc-300 border border-zinc-800">
                <code>{"// Arduino Tone API"}</code><br />
                <code>tone(8, 261, 200); // C4</code><br />
                <code>delay(250);</code><br />
                <code>noTone(8);</code>
              </div>
              <div className="text-[10px] text-pink-400 bg-pink-950/20 p-2 rounded border border-pink-900/30">
                Note: Web Audio context strictly requires an explicit user gesture (button click) before audio output is permitted by modern browsers.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. OPTICAL MORSE TRANSMITTER */}
      {mode === "morse" && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3 bg-[var(--surface-secondary)] p-3 rounded-lg border border-[var(--border-subtle)] text-xs">
            <span className="text-zinc-400 font-semibold">Message:</span>
            <input
              type="text"
              value={morseInput}
              onChange={(e) => setMorseInput(e.target.value)}
              className="flex-1 min-w-[200px] rounded bg-zinc-950 border border-zinc-700 px-3 py-1 font-mono uppercase text-xs"
              placeholder="ENTER TEXT TO TRANSMIT"
            />
            {!isTransmittingMorse ? (
              <button
                type="button"
                onClick={() => void transmitMorse()}
                className="flex items-center gap-1.5 rounded bg-pink-600 hover:bg-pink-500 px-3 py-1 text-xs font-semibold text-white"
              >
                <Play size={12} /> Transmit
              </button>
            ) : (
              <button
                type="button"
                onClick={stopMorse}
                className="flex items-center gap-1.5 rounded bg-red-600 hover:bg-red-500 px-3 py-1 text-xs font-semibold text-white"
              >
                <Square size={12} /> Abort
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-7 rounded-lg border border-pink-900/30 bg-[#070b14] p-5 flex flex-col items-center justify-center min-h-[200px]">
              {/* Virtual Flashing High-Intensity LED */}
              <div className="relative flex items-center justify-center my-4">
                <div
                  className={`h-24 w-24 rounded-full transition-all duration-75 flex items-center justify-center border-4 ${
                    morseLedState
                      ? "bg-amber-400 border-amber-200 shadow-[0_0_50px_rgba(251,191,36,0.95)]"
                      : "bg-zinc-900 border-zinc-800"
                  }`}
                >
                  <span className={`text-xs font-mono font-bold ${morseLedState ? "text-amber-950" : "text-zinc-600"}`}>
                    {morseLedState ? "LIGHT ON" : "DARK"}
                  </span>
                </div>
              </div>

              <div className="text-center font-mono">
                <div className="text-xs text-zinc-400">Current Character:</div>
                <div className="text-3xl font-bold text-amber-300">{morseCurrentChar || "—"}</div>
                <div className="text-xs text-zinc-500 mt-1">
                  Code: {morseCurrentChar ? MORSE_MAP[morseCurrentChar] || "Space" : "Idle"}
                </div>
              </div>
            </div>

            <div className="md:col-span-5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-4 text-xs space-y-3">
              <h4 className="font-semibold text-zinc-200">International Morse Code Rules</h4>
              <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)] text-[11px]">
                <li><strong>Dot (&bull;)</strong>: 1 unit of time ($T$)</li>
                <li><strong>Dash (&minus;)</strong>: 3 units ($3T$)</li>
                <li><strong>Intra-character space</strong>: 1 unit ($T$)</li>
                <li><strong>Letter space</strong>: 3 units ($3T$)</li>
                <li><strong>Word space</strong>: 7 units ($7T$)</li>
              </ul>

              <div className="border-t border-[var(--border-subtle)] pt-2 font-mono text-[11px] text-zinc-300">
                <div className="text-[10px] text-zinc-400 uppercase font-semibold">Generated Morse Stream:</div>
                <div className="mt-1 max-h-24 overflow-auto rounded bg-zinc-950 p-2 text-pink-300 break-words">
                  {textToMorseString(morseInput) || "(empty message)"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. TERMINAL SNAKE GAME */}
      {mode === "snake" && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--surface-secondary)] p-3 rounded-lg border border-[var(--border-subtle)] text-xs">
            <div className="flex items-center gap-4">
              <span className="font-mono text-emerald-400 font-bold">SCORE: {snakeScore}</span>
              {snakeGameOver && (
                <span className="text-red-400 font-bold flex items-center gap-1">
                  <AlertTriangle size={13} /> GAME OVER
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!isSnakeRunning ? (
                <button
                  type="button"
                  onClick={() => {
                    if (snakeGameOver) resetSnake();
                    setIsSnakeRunning(true);
                  }}
                  className="rounded bg-emerald-600 hover:bg-emerald-500 px-3 py-1 font-semibold text-white flex items-center gap-1"
                >
                  <Play size={12} /> {snakeGameOver ? "Play Again" : "Start Game"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsSnakeRunning(false)}
                  className="rounded bg-amber-600 hover:bg-amber-500 px-3 py-1 font-semibold text-white flex items-center gap-1"
                >
                  <Square size={12} /> Pause
                </button>
              )}
              <button
                type="button"
                onClick={resetSnake}
                className="rounded bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 text-zinc-300"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-8 rounded-lg border border-emerald-900/40 bg-zinc-950 p-4 flex flex-col items-center justify-center">
              {/* Snake Grid Canvas */}
              <div
                className="grid gap-[2px] bg-zinc-900 p-2 rounded border border-zinc-800 select-none"
                style={{
                  gridTemplateRows: `repeat(${gridRows}, 16px)`,
                  gridTemplateColumns: `repeat(${gridCols}, 16px)`,
                }}
              >
                {Array.from({ length: gridRows }).map((_, r) =>
                  Array.from({ length: gridCols }).map((_, c) => {
                    const isHead = snake[0][0] === r && snake[0][1] === c;
                    const isBody = snake.slice(1).some(([sr, sc]) => sr === r && sc === c);
                    const isFood = food[0] === r && food[1] === c;

                    return (
                      <div
                        key={`${r}-${c}`}
                        className={`h-4 w-4 rounded-sm transition-colors ${
                          isHead
                            ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                            : isBody
                            ? "bg-emerald-600"
                            : isFood
                            ? "bg-red-500 animate-pulse rounded-full"
                            : "bg-zinc-950/80"
                        }`}
                      />
                    );
                  })
                )}
              </div>

              {/* On-Screen D-Pad Controls */}
              <div className="mt-4 flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() => snakeDir !== "DOWN" && setSnakeDir("UP")}
                  className="rounded bg-zinc-800 hover:bg-zinc-700 px-4 py-1.5 font-mono text-xs font-bold text-white border border-zinc-700"
                >
                  ▲ UP
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => snakeDir !== "RIGHT" && setSnakeDir("LEFT")}
                    className="rounded bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 font-mono text-xs font-bold text-white border border-zinc-700"
                  >
                    ◀ LEFT
                  </button>
                  <button
                    type="button"
                    onClick={() => snakeDir !== "UP" && setSnakeDir("DOWN")}
                    className="rounded bg-zinc-800 hover:bg-zinc-700 px-4 py-1.5 font-mono text-xs font-bold text-white border border-zinc-700"
                  >
                    ▼ DOWN
                  </button>
                  <button
                    type="button"
                    onClick={() => snakeDir !== "LEFT" && setSnakeDir("RIGHT")}
                    className="rounded bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 font-mono text-xs font-bold text-white border border-zinc-700"
                  >
                    ▶ RIGHT
                  </button>
                </div>
              </div>
            </div>

            <div className="md:col-span-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-4 text-xs space-y-3">
              <h4 className="font-semibold text-zinc-200">State Machine &amp; C Grid Arrays</h4>
              <p className="text-[var(--text-secondary)] text-[11px] leading-relaxed">
                In classic C terminal games, the snake is modeled as a ring buffer or array of <code>(x, y)</code> coordinate structs. Each tick moves the head forward by <code>(dx, dy)</code> and pops the tail unless food is ingested.
              </p>
              <div className="rounded bg-zinc-950 p-2.5 font-mono text-[10px] text-emerald-300 border border-zinc-800">
                <code>typedef struct &#123; int x, y; &#125; Point;</code><br />
                <code>Point snake[100];</code><br />
                <code>int length = 3;</code><br />
                <code>{"// Shift body elements"}</code><br />
                <code>for(int i=length-1; i&gt;0; i--) &#123;</code><br />
                <code>&nbsp;&nbsp;snake[i] = snake[i-1];</code><br />
                <code>&#125;</code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. COMBINATIONAL LOGIC MAZE */}
      {mode === "maze" && (
        <div className="mt-4 space-y-4">
          <div className="bg-[var(--surface-secondary)] p-3 rounded-lg border border-[var(--border-subtle)] text-xs flex items-center justify-between">
            <span className="text-zinc-300 font-semibold">Combinational Vault Puzzle: Set Binary Switches (A, B, C, D) to Unlock</span>
            <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs flex items-center gap-1 ${
              vaultUnlocked ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-red-500/20 text-red-300 border border-red-500/40"
            }`}>
              {vaultUnlocked ? <CheckCircle size={13} /> : <AlertTriangle size={13} />}
              {vaultUnlocked ? "VAULT UNLOCKED!" : "VAULT SECURED"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-7 rounded-lg border border-indigo-900/40 bg-zinc-950 p-5 space-y-4">
              <div className="text-xs text-zinc-400 font-semibold mb-2">INPUT SWITCH BANK:</div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { name: "A", val: swA, set: setSwA },
                  { name: "B", val: swB, set: setSwB },
                  { name: "C", val: swC, set: setSwC },
                  { name: "D", val: swD, set: setSwD },
                ].map(({ name, val, set }) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => set(val === 1 ? 0 : 1)}
                    className={`p-3 rounded-lg flex flex-col items-center justify-center gap-1 border transition-all ${
                      val === 1
                        ? "bg-indigo-600 text-white border-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.5)]"
                        : "bg-zinc-900 text-zinc-400 border-zinc-800"
                    }`}
                  >
                    <span className="font-bold text-xs">Switch {name}</span>
                    <span className="font-mono text-xl font-bold">{val}</span>
                    <span className="text-[10px] uppercase font-semibold">{val === 1 ? "HIGH" : "LOW"}</span>
                  </button>
                ))}
              </div>

              {/* Door Logic Conditions */}
              <div className="space-y-2 pt-2 border-t border-zinc-800 text-xs font-mono">
                <div className={`p-2.5 rounded border flex items-center justify-between ${
                  door1Open ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300" : "bg-red-950/20 border-red-500/30 text-red-300"
                }`}>
                  <span>Gate 1: (A XOR B) == 1</span>
                  <span className="font-bold">{door1Open ? "OPEN (1)" : "LOCKED (0)"}</span>
                </div>

                <div className={`p-2.5 rounded border flex items-center justify-between ${
                  door2Open ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300" : "bg-red-950/20 border-red-500/30 text-red-300"
                }`}>
                  <span>Gate 2: (B AND C) OR (NOT D) == 1</span>
                  <span className="font-bold">{door2Open ? "OPEN (1)" : "LOCKED (0)"}</span>
                </div>

                <div className={`p-2.5 rounded border flex items-center justify-between ${
                  door3Condition ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300" : "bg-red-950/20 border-red-500/30 text-red-300"
                }`}>
                  <span>Gate 3: (A NOR C) == 0</span>
                  <span className="font-bold">{door3Condition ? "OPEN (1)" : "LOCKED (0)"}</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-4 text-xs space-y-3">
              <h4 className="font-semibold text-zinc-200">Combinational Circuit Logic</h4>
              <p className="text-[var(--text-secondary)] text-[11px] leading-relaxed">
                Hardware combination locks use digital logic networks where boolean gate equations evaluate without a software clock or microcontroller.
              </p>
              <div className="rounded bg-zinc-950 p-2.5 font-mono text-[11px] text-zinc-300 border border-zinc-800 space-y-1">
                <div>Door 1 = A XOR B</div>
                <div>Door 2 = (B AND C) OR (NOT D)</div>
                <div>Unlock = Door 1 AND Door 2 AND (A OR C)</div>
              </div>
              <div className="text-[10px] text-indigo-300 bg-indigo-950/30 p-2 rounded border border-indigo-900/40">
                Hint: To unlock all gates, test combinations where exactly one of A or B is 1, and at least one of (A, C) is 1.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
