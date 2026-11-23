"use client";

import React, { useState, useEffect, useReducer, useMemo } from "react";
import {
  Network,
  Activity,
  Layers,
  Binary,
  HelpCircle,
  Search,
  Flame,
  Bot,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Lock,
} from "lucide-react";
import type { ProtocolExplorerProps, ProtocolExplorerTab } from "./types";
import type { HeaderField, PacketStep, ProtocolScenario } from "@/lib/protocols/schema";
import {
  createInitialSimulationState,
  simulationReducer,
  type PlaybackSpeed,
} from "@/lib/protocols/state-machine";
import { TopologyMap } from "./topology-map";
import { SequenceDiagram } from "./sequence-diagram";
import { PacketInspector } from "./packet-inspector";
import { HexDumpView } from "./hex-dump-view";
import { PacketFlowTable } from "./packet-flow-table";
import { PlaybackControls } from "./playback-controls";
import { ChaosControls } from "./chaos-controls";
import { ExamWorkbench } from "./exam-workbench";
import { SimulatorErrorBoundary } from "@/components/simulators/simulator-error-boundary";

// Fallback scenarios cached directly for immediate render when offline or before API returns
import { dnsLookupScenario } from "@/data/protocols/dns-lookup";
import { tcpHandshakeScenario } from "@/data/protocols/tcp-handshake";
import { httpExchangeScenario } from "@/data/protocols/http-exchange";
import { tlsHandshakeScenario } from "@/data/protocols/tls-handshake";
import { websocketUpgradeScenario } from "@/data/protocols/websocket-upgrade";
import { quicHandshakeScenario } from "@/data/protocols/quic-handshake";
import { mqttTelemetryScenario } from "@/data/protocols/mqtt-telemetry";

const STATIC_FALLBACKS: Record<string, ProtocolScenario> = {
  "http-exchange": httpExchangeScenario,
  "tcp-handshake": tcpHandshakeScenario,
  "dns-lookup": dnsLookupScenario,
  "tls-handshake": tlsHandshakeScenario,
  "websocket-upgrade": websocketUpgradeScenario,
  "quic-handshake": quicHandshakeScenario,
  "mqtt-telemetry": mqttTelemetryScenario,
};

const PROTOCOL_CATALOG = [
  { id: "http-exchange", name: "HTTP", fullName: "Hypertext Transfer Protocol", category: "web", layer: 7, secure: false },
  { id: "tls-handshake", name: "HTTPS", fullName: "HTTP Secure", category: "security", layer: 7, secure: true },
  { id: "websocket-upgrade", name: "WebSocket", fullName: "Two-way Web Messaging", category: "web", layer: 7, secure: false },
  { id: "http-exchange", name: "WebRTC", fullName: "Browser Video Calls", category: "web", layer: 7, secure: true },
  { id: "http-exchange", name: "SIP", fullName: "Internet Phone Calls", category: "web", layer: 7, secure: true },
  { id: "http-exchange", name: "RTSP", fullName: "IP Camera Streams", category: "web", layer: 7, secure: true },
  { id: "http-exchange", name: "RTMP", fullName: "Live Streaming Upload", category: "web", layer: 7, secure: true },
  { id: "quic-handshake", name: "QUIC", fullName: "HTTP/3 over UDP", category: "core", layer: 4, secure: true },
  { id: "tcp-handshake", name: "TCP", fullName: "Transmission Control Protocol", category: "core", layer: 4, secure: false },
  { id: "dns-lookup", name: "DNS", fullName: "Domain Name System", category: "core", layer: 7, secure: false },
  { id: "mqtt-telemetry", name: "MQTT", fullName: "IoT Telemetry Messaging", category: "web", layer: 7, secure: false },
  { id: "tls-handshake", name: "TLS 1.3", fullName: "Transport Layer Security", category: "security", layer: 6, secure: true },
  { id: "tcp-handshake", name: "SSH", fullName: "Secure Shell Protocol", category: "security", layer: 7, secure: true },
  { id: "tcp-handshake", name: "BGP", fullName: "Border Gateway Protocol", category: "core", layer: 4, secure: false },
  { id: "dns-lookup", name: "DHCP", fullName: "Dynamic Host Configuration", category: "core", layer: 7, secure: false },
  { id: "tcp-handshake", name: "ARP", fullName: "Address Resolution Protocol", category: "core", layer: 2, secure: false },
  { id: "dns-lookup", name: "ICMP", fullName: "Internet Control Message", category: "core", layer: 3, secure: false },
];

const scenarioCache = new Map<string, ProtocolScenario>(
  Object.entries(STATIC_FALLBACKS)
);

export function ProtocolExplorer({
  initialScenarioId = "tcp-handshake",
  className = "",
  onAskKat,
  hideProtocolSwitcher = false,
}: ProtocolExplorerProps) {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(initialScenarioId);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ProtocolExplorerTab>("packet");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "core" | "web" | "security">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [centerViewMode, setCenterViewMode] = useState<"network" | "sequence">("network");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const initialScenario =
    scenarioCache.get(initialScenarioId) ?? tcpHandshakeScenario;

  const [state, dispatch] = useReducer(
    simulationReducer,
    initialScenario,
    createInitialSimulationState
  );

  // Switch scenario (fetches from /api/protocols if not in cache)
  const switchScenario = async (id: string) => {
    setSelectedScenarioId(id);
    if (scenarioCache.has(id)) {
      dispatch({ type: "SET_SCENARIO", scenario: scenarioCache.get(id)! });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/protocols?id=${id}`);
      if (res.ok) {
        const data = (await res.json()) as ProtocolScenario;
        scenarioCache.set(id, data);
        dispatch({ type: "SET_SCENARIO", scenario: data });
      } else {
        const fallback = STATIC_FALLBACKS[id] ?? tcpHandshakeScenario;
        dispatch({ type: "SET_SCENARIO", scenario: fallback });
      }
    } catch {
      const fallback = STATIC_FALLBACKS[id] ?? tcpHandshakeScenario;
      dispatch({ type: "SET_SCENARIO", scenario: fallback });
    } finally {
      setLoading(false);
    }
  };

  // Playback timer loop
  useEffect(() => {
    if (!state.isPlaying) return;

    // Step duration: 1.8s base divided by speed
    const intervalMs = Math.round(1800 / state.speed);
    const timer = setInterval(() => {
      dispatch({ type: "STEP_NEXT" });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [state.isPlaying, state.speed]);

  const currentStep = state.activeSteps[state.currentStepIndex] ?? null;

  const handleAskKatAboutField = (field: HeaderField, step: PacketStep) => {
    if (!onAskKat) return;
    const prompt = `I am inspecting a packet in the Protocol Explorer.
Protocol: ${state.scenario.title}
Step: ${step.stepIndex + 1} (${step.arrowLabel})
Layer: ${field.name}
Value: ${field.value}
Field Description: ${field.description}
${field.katContext ? `Additional Field Context: ${field.katContext}\n` : ""}
Can you explain the engineering significance of this header field and why it is necessary in network transmission?`;
    onAskKat(prompt);
  };

  // Current scenario OSI layer (default to 7 or 4)
  const currentOsiLayer = state.scenario.osiLayer ?? (state.scenario.category === "transport" ? 4 : 7);

  // Filtered protocols for search and category
  const filteredProtocols = useMemo(() => {
    let list = PROTOCOL_CATALOG;
    if (categoryFilter !== "all") {
      list = list.filter((p) => p.category === categoryFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.fullName.toLowerCase().includes(q)
      );
    }
    return list;
  }, [categoryFilter, searchQuery]);

  // Unique options for the scenario combo selector
  const scenarioOptions = useMemo(() => {
    const seen = new Set<string>();
    const options: Array<{ id: string; name: string; fullName: string }> = [];
    for (const p of PROTOCOL_CATALOG) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        options.push({ id: p.id, name: p.name, fullName: p.fullName });
      }
    }
    return options;
  }, []);

  return (
    <SimulatorErrorBoundary fallbackTitle="Protocol Explorer Encountered an Error">
      <div className={`protocol-explorer-root flex flex-col w-full bg-[#080c14] text-slate-100 min-h-screen ${className}`}>
        {/* TOP STATUS & OSI BAR */}
        <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#0b1120] border-b border-[#1a253c] z-10">
          {/* Brand & Protocol Dropdown */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                <Network size={16} />
              </div>
              <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                Protocol &amp; Network Explorer
              </h1>
            </div>

            {/* Scenario Dropdown Selector */}
            {!hideProtocolSwitcher && (
              <select
                value={selectedScenarioId}
                onChange={(e) => void switchScenario(e.target.value)}
                disabled={loading}
                className="text-xs font-semibold rounded-lg border border-[#223254] bg-[#131d33] text-slate-200 px-2.5 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer shadow-sm"
                aria-label="Select protocol scenario"
              >
                {scenarioOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.fullName}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Center: NOW LEARNING & OSI LAYER CHIPS */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 mx-auto">
            <div className="text-center sm:text-left">
              <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                NOW LEARNING: <strong className="text-white">{state.scenario.title.split(" ")[0]}</strong> • {state.scenario.category.toUpperCase()}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                OVERVIEW · {state.activeSteps.length} STEPS
              </div>
            </div>

            {/* OSI Layer Chips (1 to 7) */}
            <div className="flex items-center gap-1 bg-[#0f172a] p-1 rounded-md border border-[#1e2e4f]" title="OSI Reference Model Layer">
              <span className="text-[9px] font-mono text-slate-400 px-1 hidden md:inline">OSI LAYER:</span>
              {[1, 2, 3, 4, 5, 6, 7].map((layerNum) => (
                <span
                  key={layerNum}
                  className={`flex items-center justify-center w-5 h-5 rounded text-[10px] font-mono font-bold transition-all ${
                    layerNum === currentOsiLayer
                      ? "bg-blue-600 text-white shadow-sm ring-1 ring-blue-400"
                      : "text-slate-400 bg-[#131d33] border border-[#1e2e4f]"
                  }`}
                >
                  {layerNum}
                </span>
              ))}
              <span className="text-[10px] font-mono font-bold text-blue-400 ml-1 hidden lg:inline">
                {currentOsiLayer === 7 ? "APPLICATION" : currentOsiLayer === 4 ? "TRANSPORT" : "NETWORK"}
              </span>
            </div>
          </div>

          {/* Right: Search & Kat AI button */}
          <div className="flex items-center gap-2">
            <div className="relative hidden xl:flex items-center">
              <Search size={13} className="absolute left-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search protocols (Ctrl K)"
                className="text-xs bg-[#131d33] border border-[#223254] rounded-lg pl-8 pr-2.5 py-1 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 w-44 shadow-sm"
              />
            </div>

            {onAskKat && currentStep && (
              <button
                type="button"
                onClick={() =>
                  onAskKat(
                    `Can you explain how ${state.scenario.title} operates at step ${state.currentStepIndex + 1} (${currentStep.arrowLabel}) in terms of network engineering?`
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/30 text-xs font-semibold shadow-sm transition-colors"
                title="Ask Kat AI about this step"
              >
                <Bot size={14} />
                <span>Kat AI Assistant</span>
              </button>
            )}
          </div>
        </header>

        {/* 3-COLUMN STUDIO LAYOUT MATCHING PROTOCOLEXPLORER.ORG */}
        <div className="grid grid-cols-1 xl:grid-cols-[250px_1fr_330px] gap-3 p-3 bg-[#080c14] flex-1">
          {/* COLUMN 1: LEFT SIDEBAR (PROTOCOLS ACCORDION & CATEGORIES) */}
          <aside className="w-full xl:w-[250px] flex-shrink-0 flex flex-col gap-2.5 bg-[#0b1222] p-3 rounded-xl border border-[#1a253c] h-fit">
            {/* Header info */}
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                NOW LEARNING
              </span>
              <h2 className="text-xs font-bold text-white tracking-wide truncate">
                {state.scenario.title.split(" ")[0]} • {state.scenario.category.toUpperCase()}
              </h2>
              <span className="text-[10px] font-mono text-slate-500 block">
                OVERVIEW • {state.activeSteps.length} STEPS
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#1a253c]">
              <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-slate-300">
                INTERNET PROTOCOLS
              </span>
              <button
                type="button"
                onClick={() => setSidebarOpen((v) => !v)}
                className="xl:hidden text-xs text-slate-400 hover:text-white"
              >
                {sidebarOpen ? "Hide" : "Show"}
              </button>
            </div>

            {sidebarOpen && (
              <>
                {/* Category Filter Pills */}
                <div className="grid grid-cols-4 gap-1 text-[10px] font-mono font-semibold">
                  {(
                    [
                      { id: "all", label: "ALL 39" },
                      { id: "core", label: "CORE 11" },
                      { id: "web", label: "APP 19" },
                      { id: "security", label: "SEC 9" },
                    ] as const
                  ).map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryFilter(cat.id)}
                      className={`py-1 rounded text-center transition-colors truncate ${
                        categoryFilter === cat.id
                          ? "bg-blue-600 text-white font-bold"
                          : "bg-[#131d33] text-slate-400 hover:bg-[#1a2744] hover:text-white border border-[#1e2e4f]"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Protocol Accordion List */}
                <div className="flex flex-col gap-1 max-h-[calc(100vh-280px)] overflow-y-auto pr-0.5">
                  {filteredProtocols.map((p, pIdx) => {
                    const isCurrent = p.id === selectedScenarioId;
                    return (
                      <div
                        key={`${p.id}-${p.name}-${pIdx}`}
                        className={`rounded-lg border transition-all ${
                          isCurrent
                            ? "border-blue-500/40 bg-[#101b33] shadow-xs"
                            : "border-transparent hover:border-[#1a253c] hover:bg-[#0f172a]"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => void switchScenario(p.id)}
                          className="w-full flex items-center justify-between p-2 text-left"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                isCurrent ? "bg-amber-400" : "bg-slate-600"
                              }`}
                            />
                            <div className="truncate">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-white block">
                                  {p.name}
                                </span>
                                {p.secure && (
                                  <Lock size={10} className="text-slate-400 flex-shrink-0" />
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 truncate block">
                                {p.fullName}
                              </span>
                            </div>
                          </div>
                          {isCurrent ? (
                            <ChevronDown size={14} className="text-blue-400 flex-shrink-0" />
                          ) : (
                            <ChevronRight size={14} className="text-slate-500 flex-shrink-0" />
                          )}
                        </button>

                        {/* If current protocol, expand active step items */}
                        {isCurrent && (
                          <div className="px-2 pb-2 pt-0.5 space-y-1 border-t border-[#1a253c]/80">
                            {state.activeSteps.map((step, idx) => {
                              const isStepActive = idx === state.currentStepIndex;
                              return (
                                <button
                                  key={step.stepIndex}
                                  type="button"
                                  onClick={() =>
                                    dispatch({ type: "GO_TO_STEP", stepIndex: idx })
                                  }
                                  className={`w-full flex items-start gap-2 p-1.5 rounded text-left transition-colors text-[11px] font-mono ${
                                    isStepActive
                                      ? "bg-blue-600/20 text-blue-300 font-bold border-l-2 border-blue-500 pl-2"
                                      : "text-slate-400 hover:bg-[#131d33] hover:text-slate-200"
                                  }`}
                                >
                                  <span
                                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold mt-0.5 flex-shrink-0 ${
                                      isStepActive
                                        ? "bg-blue-600 text-white"
                                        : "bg-[#131d33] text-slate-400 border border-[#1e2e4f]"
                                    }`}
                                  >
                                    {idx + 1}
                                  </span>
                                  <div className="truncate">
                                    <span className="block font-semibold uppercase text-[10px] truncate text-slate-200">
                                      {step.arrowLabel}
                                    </span>
                                    <span className="block text-[9px] text-slate-400 truncate">
                                      {step.summary}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </aside>

          {/* COLUMN 2: CENTER STAGE (NETWORK CANVAS & PACKET FLOW TABLE) */}
          <main className="flex-1 flex flex-col gap-3 min-w-0">
            {/* View Mode Switcher Pills: [NETWORK] [SEQUENCE] */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 bg-[#0b1222] p-1 rounded-lg border border-[#1a253c]">
                <button
                  type="button"
                  onClick={() => setCenterViewMode("network")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-bold transition-colors ${
                    centerViewMode === "network"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Network size={13} />
                  <span>NETWORK</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCenterViewMode("sequence")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-bold transition-colors ${
                    centerViewMode === "sequence"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Activity size={13} />
                  <span>SEQUENCE</span>
                </button>
              </div>

              {/* Protocol Spec Badge */}
              <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400">
                <span>PORT {state.scenario.defaultPort ?? "80"}</span>
                <span>•</span>
                <span>{state.scenario.transportType ?? "TCP"}</span>
                {state.scenario.rfc && (
                  <>
                    <span>•</span>
                    <span className="text-blue-400">{state.scenario.rfc}</span>
                  </>
                )}
              </div>
            </div>

            {/* 2.5D ISOMETRIC NETWORK CANVAS */}
            {centerViewMode === "network" ? (
              <TopologyMap
                nodes={state.scenario.nodes}
                wires={state.scenario.wires}
                currentStep={currentStep}
                isPlaying={state.isPlaying}
                speed={state.speed}
              />
            ) : (
              /* SEQUENCE DIAGRAM EXPANDED IN CENTER STAGE */
              <SequenceDiagram
                nodes={state.scenario.nodes}
                steps={state.activeSteps}
                currentStepIndex={state.currentStepIndex}
                onSelectStep={(idx) => dispatch({ type: "GO_TO_STEP", stepIndex: idx })}
              />
            )}

            {/* PACKET FLOW WIRESHARK TABLE WITH INTEGRATED CONTROLS */}
            <PacketFlowTable
              steps={state.activeSteps}
              currentStepIndex={state.currentStepIndex}
              isPlaying={state.isPlaying}
              speed={state.speed}
              onPlay={() => dispatch({ type: "PLAY" })}
              onPause={() => dispatch({ type: "PAUSE" })}
              onStepNext={() => dispatch({ type: "STEP_NEXT" })}
              onStepPrev={() => dispatch({ type: "STEP_PREV" })}
              onSelectStep={(idx) => dispatch({ type: "GO_TO_STEP", stepIndex: idx })}
              onSetSpeed={(spd) => dispatch({ type: "SET_SPEED", speed: spd as PlaybackSpeed })}
              onReset={() => dispatch({ type: "RESET" })}
            />

            {/* SEQUENCE DIAGRAM SWIMLANES (Always mounted in network mode for full causality trace) */}
            {centerViewMode === "network" && (
              <div className="mt-1">
                <SequenceDiagram
                  nodes={state.scenario.nodes}
                  steps={state.activeSteps}
                  currentStepIndex={state.currentStepIndex}
                  onSelectStep={(idx) => dispatch({ type: "GO_TO_STEP", stepIndex: idx })}
                />
              </div>
            )}

            {/* STEP TIMELINE PILLS BAR */}
            <PlaybackControls
              isPlaying={state.isPlaying}
              currentStepIndex={state.currentStepIndex}
              totalSteps={state.activeSteps.length}
              speed={state.speed}
              onPlay={() => dispatch({ type: "PLAY" })}
              onPause={() => dispatch({ type: "PAUSE" })}
              onStepNext={() => dispatch({ type: "STEP_NEXT" })}
              onStepPrev={() => dispatch({ type: "STEP_PREV" })}
              onGoToStep={(index) => dispatch({ type: "GO_TO_STEP", stepIndex: index })}
              onSetSpeed={(spd) => dispatch({ type: "SET_SPEED", speed: spd })}
              onReset={() => dispatch({ type: "RESET" })}
            />
          </main>

          {/* COLUMN 3: RIGHT SIDEBAR (PROTOCOL OVERVIEW & INSPECTORS) */}
          <aside className="w-full xl:w-[330px] flex-shrink-0 flex flex-col gap-3">
            {/* PROTOCOL OVERVIEW CARD MATCHING PROTOCOLEXPLORER.ORG */}
            <div className="p-4 rounded-xl bg-[#0b1222] border border-[#1a253c] space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-slate-400">
                  PROTOCOL OVERVIEW
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> ACTIVE
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-black text-white tracking-tight">
                  {state.scenario.title.split(" ")[0]}
                </h3>
                <p className="text-xs font-semibold text-blue-400 mt-0.5">
                  {state.scenario.title}
                </p>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {state.scenario.overviewDescription ?? state.scenario.summary}
              </p>

              {/* Specs properties table */}
              <div className="border-t border-[#1a253c] pt-2.5 space-y-2 text-[11px] font-mono">
                <div className="flex items-center justify-between py-1 border-b border-[#1a253c]/50">
                  <span className="text-slate-400 text-[10px]">LAYER</span>
                  <span className="text-slate-200 font-semibold">
                    {state.scenario.category === "transport"
                      ? "Transport (Layer 4)"
                      : `Application (Layer ${currentOsiLayer})`}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[#1a253c]/50">
                  <span className="text-slate-400 text-[10px]">DEFAULT PORT</span>
                  <span className="text-slate-200 font-semibold">
                    {state.scenario.defaultPort ?? "80 (HTTPS: 443)"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[#1a253c]/50">
                  <span className="text-slate-400 text-[10px]">TRANSPORT</span>
                  <span className="text-slate-200 font-semibold">
                    {state.scenario.transportType ?? "TCP"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[#1a253c]/50">
                  <span className="text-slate-400 text-[10px]">DATA FORMAT</span>
                  <span className="text-slate-200 font-semibold truncate max-w-[180px]">
                    {state.scenario.dataFormat ?? "Text (headers + optional body)"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[#1a253c]/50">
                  <span className="text-slate-400 text-[10px]">COMMON METHODS</span>
                  <span className="text-slate-200 font-semibold truncate max-w-[180px]">
                    {state.scenario.commonMethods ?? "GET, POST, PUT, DELETE, HEAD"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400 text-[10px]">RFC</span>
                  <span className="text-blue-400 font-semibold">
                    {state.scenario.rfc ?? "RFC 9110, RFC 9112"}
                  </span>
                </div>
              </div>
            </div>

            {/* DEEP INSPECTION TABS (Packet Tree, Hex Dump, Kat AI, Chaos, Exam) */}
            <div className="flex items-center gap-1 bg-[#0b1222] p-1 rounded-xl border border-[#1a253c]">
              <button
                type="button"
                onClick={() => setActiveTab("packet")}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  activeTab === "packet"
                    ? "bg-blue-600 text-white shadow-sm font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Layers size={13} />
                <span>Packet Tree</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("hex")}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  activeTab === "hex"
                    ? "bg-blue-600 text-white shadow-sm font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Binary size={13} />
                <span>Hex Dump</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("kat" as ProtocolExplorerTab)}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  (activeTab as string) === "kat"
                    ? "bg-blue-600 text-white shadow-sm font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Bot size={13} />
                <span>Kat AI</span>
              </button>
              {state.scenario.chaosVariants && state.scenario.chaosVariants.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab("chaos" as ProtocolExplorerTab)}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors ${
                    (activeTab as string) === "chaos"
                      ? "bg-amber-600 text-white shadow-sm font-bold"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title="Chaos Sandbox"
                >
                  <Flame size={13} />
                </button>
              )}
              {state.scenario.examChallenge && (
                <button
                  type="button"
                  onClick={() => setActiveTab("exam")}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors ${
                    activeTab === "exam"
                      ? "bg-blue-600 text-white shadow-sm font-bold"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title="Exam Challenge"
                >
                  <HelpCircle size={13} />
                </button>
              )}
            </div>

            {/* TAB CONTENTS */}
            <div className="p-3 rounded-xl bg-[#0b1222] border border-[#1a253c] shadow-xl">
              {/* Packet Tree */}
              <div className={`${activeTab === "packet" ? "block" : "hidden"}`}>
                <PacketInspector
                  currentStep={currentStep}
                  selectedFieldRange={state.selectedFieldRange}
                  hoveredFieldRange={state.hoveredFieldRange}
                  onSelectField={(field) =>
                    dispatch({
                      type: "SELECT_FIELD_RANGE",
                      range: field.byteRange,
                    })
                  }
                  onHoverField={(range) =>
                    dispatch({ type: "HOVER_FIELD_RANGE", range })
                  }
                  onAskKat={onAskKat ? (field, step) => handleAskKatAboutField(field, step) : undefined}
                />
              </div>

              {/* Hex Dump */}
              <div className={`${activeTab === "hex" ? "block" : "hidden"}`}>
                <HexDumpView
                  rawHex={currentStep?.rawHex ?? ""}
                  selectedRange={state.selectedFieldRange}
                  hoveredRange={state.hoveredFieldRange}
                  bytesPerRow={16}
                />
              </div>

              {/* Kat AI Assistant */}
              <div className={`${(activeTab as string) === "kat" ? "block" : "hidden"}`}>
                {currentStep ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-400">
                        <Sparkles size={14} />
                        <span>Kat AI Network Insight · Step {state.currentStepIndex + 1}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {currentStep.protocolName}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {currentStep.summary}
                    </p>

                    {onAskKat && (
                      <button
                        type="button"
                        onClick={() =>
                          onAskKat(
                            `Can you explain how ${state.scenario.title} operates at step ${state.currentStepIndex + 1} (${currentStep.arrowLabel}) in terms of network engineering?`
                          )
                        }
                        className="w-full mt-2 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors"
                      >
                        <Bot size={15} />
                        <span>Ask Kat About Step {state.currentStepIndex + 1}</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 text-center py-4">
                    Select a step to inspect technical details with Kat AI.
                  </div>
                )}
              </div>

              {/* Chaos Sandbox */}
              {state.scenario.chaosVariants && (
                <div className={`${(activeTab as string) === "chaos" ? "block" : "hidden"}`}>
                  <ChaosControls
                    variants={state.scenario.chaosVariants}
                    activeChaosId={state.activeChaosId}
                    onToggleChaos={(chaosId) => dispatch({ type: "TOGGLE_CHAOS", chaosId })}
                  />
                </div>
              )}

              {/* Exam Challenge */}
              {state.scenario.examChallenge && (
                <div className={`${activeTab === "exam" ? "block" : "hidden"}`}>
                  <ExamWorkbench
                    challenge={state.scenario.examChallenge}
                    allSteps={state.scenario.steps}
                    onAskKat={onAskKat}
                  />
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </SimulatorErrorBoundary>
  );
}
