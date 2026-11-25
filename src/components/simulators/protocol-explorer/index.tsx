"use client";

import React, { useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  Activity,
  Binary,
  Bot,
  Check,
  ChevronDown,
  ChevronRight,
  Code2,
  Columns2,
  Flame,
  HelpCircle,
  Layers,
  ListFilter,
  Maximize2,
  Minimize2,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  ShieldCheck,
  Sparkles,
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

// Bundled scenarios for zero-latency initial render and offline resilience
import { dnsLookupScenario } from "@/data/protocols/dns-lookup";
import { tcpHandshakeScenario } from "@/data/protocols/tcp-handshake";
import { httpExchangeScenario } from "@/data/protocols/http-exchange";
import { httpsExchangeScenario } from "@/data/protocols/https-exchange";
import { tlsHandshakeScenario } from "@/data/protocols/tls-handshake";
import { websocketUpgradeScenario } from "@/data/protocols/websocket-upgrade";
import { quicHandshakeScenario } from "@/data/protocols/quic-handshake";
import { mqttTelemetryScenario } from "@/data/protocols/mqtt-telemetry";
import { udpDatagramScenario } from "@/data/protocols/udp-datagram";
import { icmpPingScenario } from "@/data/protocols/icmp-ping";

const STATIC_SCENARIOS: Record<string, ProtocolScenario> = {
  "tcp-handshake": tcpHandshakeScenario,
  "http-exchange": httpExchangeScenario,
  "https-exchange": httpsExchangeScenario,
  "dns-lookup": dnsLookupScenario,
  "tls-handshake": tlsHandshakeScenario,
  "websocket-upgrade": websocketUpgradeScenario,
  "quic-handshake": quicHandshakeScenario,
  "mqtt-telemetry": mqttTelemetryScenario,
  "udp-datagram": udpDatagramScenario,
  "icmp-ping": icmpPingScenario,
};

interface CatalogItem {
  id: string;
  name: string;
  fullName: string;
  group: "core" | "application" | "security";
  layer: number;
  encrypted: boolean;
}

const PROTOCOL_CATALOG: CatalogItem[] = [
  { id: "http-exchange", name: "HTTP", fullName: "Hypertext Transfer Protocol", group: "application", layer: 7, encrypted: false },
  { id: "https-exchange", name: "HTTPS", fullName: "HTTP Secure over TLS 1.3", group: "security", layer: 7, encrypted: true },
  { id: "tcp-handshake", name: "TCP", fullName: "Transmission Control Protocol", group: "core", layer: 4, encrypted: false },
  { id: "dns-lookup", name: "DNS", fullName: "Domain Name System", group: "application", layer: 7, encrypted: false },
  { id: "tls-handshake", name: "TLS 1.3", fullName: "Transport Layer Security", group: "security", layer: 6, encrypted: true },
  { id: "quic-handshake", name: "QUIC", fullName: "HTTP/3 Multiplexed Transport", group: "core", layer: 4, encrypted: true },
  { id: "websocket-upgrade", name: "WebSocket", fullName: "Full-Duplex Web Messaging", group: "application", layer: 7, encrypted: false },
  { id: "mqtt-telemetry", name: "MQTT", fullName: "IoT Telemetry Pub/Sub", group: "application", layer: 7, encrypted: false },
  { id: "udp-datagram", name: "UDP", fullName: "User Datagram Protocol", group: "core", layer: 4, encrypted: false },
  { id: "icmp-ping", name: "ICMP", fullName: "Internet Control & Ping", group: "core", layer: 3, encrypted: false },
];

const scenarioCache = new Map<string, ProtocolScenario>(Object.entries(STATIC_SCENARIOS));

type DetailsTab = "step" | "overview" | "chaos" | "exam" | "kat";
type InspectorMode = "split" | "packet" | "hex";

export function ProtocolExplorer({
  initialScenarioId = "tcp-handshake",
  className = "",
  onAskKat,
  onOpenCodeLab,
  hideProtocolSwitcher = false,
}: ProtocolExplorerProps) {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(initialScenarioId);
  const [loading, setLoading] = useState(false);
  const [detailsTab, setDetailsTab] = useState<DetailsTab>("step");
  const [inspectorMode, setInspectorMode] = useState<InspectorMode>("split");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "core" | "application" | "security">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [centerViewMode, setCenterViewMode] = useState<"network" | "sequence">("network");
  const [directoryOpen, setDirectoryOpen] = useState(true);
  const [workspaceExpanded, setWorkspaceExpanded] = useState(false);
  const [isMobileNarrow, setIsMobileNarrow] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const sync = () => {
      setIsMobileNarrow(media.matches);
      if (media.matches) {
        setInspectorMode((curr) => (curr === "split" ? "packet" : curr));
      }
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const initialScenario = scenarioCache.get(initialScenarioId) ?? tcpHandshakeScenario;

  const [state, dispatch] = useReducer(
    simulationReducer,
    initialScenario,
    createInitialSimulationState
  );

  const switchScenario = async (id: string) => {
    setSelectedScenarioId(id);
    setDetailsTab((curr) => (curr === "chaos" || curr === "exam" ? "step" : curr));

    if (scenarioCache.has(id)) {
      dispatch({ type: "SET_SCENARIO", scenario: scenarioCache.get(id)! });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/protocols?id=${encodeURIComponent(id)}`);
      if (res.ok) {
        const data = (await res.json()) as ProtocolScenario;
        scenarioCache.set(id, data);
        dispatch({ type: "SET_SCENARIO", scenario: data });
      } else {
        dispatch({
          type: "SET_SCENARIO",
          scenario: STATIC_SCENARIOS[id] ?? tcpHandshakeScenario,
        });
      }
    } catch {
      dispatch({
        type: "SET_SCENARIO",
        scenario: STATIC_SCENARIOS[id] ?? tcpHandshakeScenario,
      });
    } finally {
      setLoading(false);
    }
  };

  // Playback auto-advance timer
  useEffect(() => {
    if (!state.isPlaying) return;
    const intervalMs = Math.round(2100 / state.speed);
    const timer = setInterval(() => {
      dispatch({ type: "STEP_NEXT" });
    }, intervalMs);
    return () => clearInterval(timer);
  }, [state.isPlaying, state.speed]);

  const currentStep = state.activeSteps[state.currentStepIndex] ?? null;

  const findFieldForOffset = (step: PacketStep | null, offset: number): HeaderField | null => {
    if (!step) return null;
    let best: HeaderField | null = null;
    let bestSpan = Infinity;
    for (const layer of step.layers) {
      for (const field of layer.fields) {
        const [start, end] = field.byteRange;
        if (offset >= start && offset < end) {
          const span = end - start;
          if (span < bestSpan) {
            best = field;
            bestSpan = span;
          }
        }
      }
    }
    return best;
  };

  const activeFieldLabel = useMemo(() => {
    const activeRange = state.hoveredFieldRange ?? state.selectedFieldRange;
    if (!currentStep || !activeRange) return null;
    for (const layer of currentStep.layers) {
      for (const field of layer.fields) {
        if (
          field.byteRange[0] === activeRange[0] &&
          field.byteRange[1] === activeRange[1]
        ) {
          return field.name;
        }
      }
    }
    return null;
  }, [currentStep, state.hoveredFieldRange, state.selectedFieldRange]);

  const handleSelectByteOffset = (offset: number) => {
    const matched = findFieldForOffset(currentStep, offset);
    if (matched) {
      dispatch({ type: "SELECT_FIELD_RANGE", range: matched.byteRange });
    } else {
      dispatch({ type: "SELECT_FIELD_RANGE", range: [offset, offset + 1] });
    }
  };

  const handleHoverByteOffset = (offset: number | null) => {
    if (offset === null) {
      dispatch({ type: "HOVER_FIELD_RANGE", range: null });
      return;
    }
    const matched = findFieldForOffset(currentStep, offset);
    dispatch({
      type: "HOVER_FIELD_RANGE",
      range: matched ? matched.byteRange : [offset, offset + 1],
    });
  };

  const handleAskKatAboutField = (field: HeaderField, step: PacketStep) => {
    if (!onAskKat) return;
    const prompt = `I am inspecting a packet in the Protocol Explorer.
Protocol: ${state.scenario.title}
Step: ${step.stepIndex + 1} (${step.arrowLabel})
Field: ${field.name}
Value: ${field.value}
Field Description: ${field.description}
${field.katContext ? `Additional Field Context: ${field.katContext}\n` : ""}Can you explain the engineering significance of this header field and why it is necessary in network transmission?`;
    onAskKat(prompt);
  };

  const currentCatalogItem = useMemo(
    () => PROTOCOL_CATALOG.find((item) => item.id === selectedScenarioId) ?? PROTOCOL_CATALOG[0],
    [selectedScenarioId]
  );

  const currentOsiLayer =
    state.scenario.osiLayer ??
    currentCatalogItem?.layer ??
    (state.scenario.category === "transport" ? 4 : 7);

  const categoryCounts = useMemo(
    () => ({
      all: PROTOCOL_CATALOG.length,
      core: PROTOCOL_CATALOG.filter((p) => p.group === "core").length,
      application: PROTOCOL_CATALOG.filter((p) => p.group === "application").length,
      security: PROTOCOL_CATALOG.filter((p) => p.group === "security").length,
    }),
    []
  );

  const filteredProtocols = useMemo(() => {
    let list = PROTOCOL_CATALOG;
    if (categoryFilter !== "all") {
      list = list.filter((p) => p.group === categoryFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.fullName.toLowerCase().includes(q) ||
          `l${p.layer}`.includes(q)
      );
    }
    return list;
  }, [categoryFilter, searchQuery]);

  const showDirectory = directoryOpen && !workspaceExpanded;
  const showPacketPane = inspectorMode === "split" || inspectorMode === "packet";
  const showHexPane = inspectorMode === "split" || inspectorMode === "hex";

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const osiLabelName = (layer: number) => {
    if (layer === 7) return "Application";
    if (layer === 6) return "Presentation";
    if (layer === 4) return "Transport";
    if (layer === 3) return "Network";
    return `Layer ${layer}`;
  };

  // Legacy tab compatibility type guard for ProtocolExplorerTab exports
  const _tabCheck: ProtocolExplorerTab = detailsTab === "exam" ? "exam" : "packet";
  void _tabCheck;

  return (
    <SimulatorErrorBoundary fallbackTitle="Protocol Explorer Encountered an Error">
      <div
        className={`protocol-explorer-root flex flex-col w-full min-w-0 max-w-full bg-[var(--pe-canvas)] text-[var(--pe-text)] ${className}`}
      >
        {/* TOP WORKSPACE SUB-BAR (Modeled on ProtocolExplorer.org) */}
        <header className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-2.5 bg-[var(--pe-surface)] border-b border-[var(--pe-border)]">
          <div className="flex flex-wrap items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => {
                if (workspaceExpanded) {
                  setWorkspaceExpanded(false);
                  setDirectoryOpen(true);
                } else {
                  setDirectoryOpen((v) => !v);
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--pe-border)] bg-[var(--pe-surface-alt)] px-2.5 py-1.5 text-xs font-semibold text-[var(--pe-text)] hover:border-[var(--pe-border-strong)] transition-colors cursor-pointer"
              aria-expanded={showDirectory}
              title={showDirectory ? "Collapse protocol directory" : "Show protocol directory"}
            >
              {showDirectory ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
              <span>All protocols</span>
              <span className="text-[10px] font-mono text-[var(--pe-text-muted)]">
                {PROTOCOL_CATALOG.length}
              </span>
            </button>

            <div className="flex items-center gap-1.5 text-xs text-[var(--pe-text-muted)] min-w-0">
              <span className="hidden sm:inline capitalize">{currentCatalogItem.group}</span>
              <span className="hidden sm:inline">/</span>
              <span className="font-semibold text-[var(--pe-text)] truncate">
                {currentCatalogItem.name}
              </span>
            </div>

            {!hideProtocolSwitcher && (
              <select
                value={selectedScenarioId}
                onChange={(e) => void switchScenario(e.target.value)}
                disabled={loading}
                className="text-xs font-medium rounded-lg border border-[var(--pe-border)] bg-[var(--pe-surface-alt)] text-[var(--pe-text)] px-2.5 py-1.5 focus:outline-none cursor-pointer max-w-[230px] sm:max-w-[280px] truncate"
                aria-label="Select protocol scenario"
              >
                {PROTOCOL_CATALOG.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.fullName}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 ml-auto">
            {/* Compact OSI indicator on narrow phones, full L1–L7 strip on sm+ */}
            <span
              className="sm:hidden inline-flex items-center px-2 py-1 rounded-lg border border-[var(--pe-border)] bg-[var(--pe-surface-alt)] text-[10px] font-mono font-bold text-[var(--pe-green)]"
              title={`OSI Layer ${currentOsiLayer} (${osiLabelName(currentOsiLayer)})`}
            >
              L{currentOsiLayer}
            </span>
            <div
              className="hidden sm:flex items-center gap-1 bg-[var(--pe-surface-alt)] p-1 rounded-lg border border-[var(--pe-border)]"
              title={`OSI Layer ${currentOsiLayer} (${osiLabelName(currentOsiLayer)})`}
            >
              {[1, 2, 3, 4, 5, 6, 7].map((layerNum) => (
                <span
                  key={layerNum}
                  className={`flex items-center justify-center w-6 h-5 rounded text-[10px] font-mono font-bold transition-colors ${
                    layerNum === currentOsiLayer
                      ? "bg-[var(--pe-green)] text-white shadow-xs"
                      : "text-[var(--pe-text-muted)]"
                  }`}
                >
                  L{layerNum}
                </span>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setWorkspaceExpanded(false);
                setDirectoryOpen(true);
                window.setTimeout(() => searchInputRef.current?.focus(), 60);
              }}
              className="hidden md:inline-flex items-center justify-center w-8 h-8 rounded-lg border border-[var(--pe-border)] bg-[var(--pe-surface-alt)] text-[var(--pe-text-secondary)] hover:text-[var(--pe-text)] transition-colors cursor-pointer"
              title="Search protocols"
              aria-label="Search protocols"
            >
              <Search size={14} />
            </button>

            <button
              type="button"
              onClick={() => setWorkspaceExpanded((v) => !v)}
              className="hidden xl:inline-flex items-center justify-center w-8 h-8 rounded-lg border border-[var(--pe-border)] bg-[var(--pe-surface-alt)] text-[var(--pe-text-secondary)] hover:text-[var(--pe-text)] transition-colors cursor-pointer"
              title={workspaceExpanded ? "Restore sidebars" : "Expand workspace"}
              aria-label={workspaceExpanded ? "Restore workspace" : "Expand workspace"}
            >
              {workspaceExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>

            {onAskKat && currentStep && (
              <button
                type="button"
                onClick={() =>
                  onAskKat(
                    `Can you explain how ${state.scenario.title} operates at step ${state.currentStepIndex + 1} (${currentStep.arrowLabel}) in terms of network engineering?`
                  )
                }
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[var(--pe-accent-soft)] text-[var(--pe-accent-text)] border border-[var(--pe-accent)]/30 text-xs font-semibold hover:border-[var(--pe-accent)]/60 transition-colors cursor-pointer"
                title="Ask Kat AI about this step"
              >
                <Bot size={14} />
                <span className="sm:hidden">Kat AI</span>
                <span className="hidden sm:inline">Kat AI Assistant</span>
              </button>
            )}
          </div>
        </header>

        {/* PROTOCOL HEADLINE STRIP */}
        <div className="flex flex-wrap items-end justify-between gap-2.5 px-3 sm:px-4 pt-3 pb-2 max-w-full">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-[var(--pe-text-muted)]">
              <span className="text-[var(--pe-accent-text)] font-bold">
                {currentCatalogItem.name} / OSI L{currentOsiLayer}
              </span>
              {state.scenario.rfc && <span>· {state.scenario.rfc}</span>}
              {state.activeChaosId && (
                <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 bg-[var(--pe-warning-soft)] text-[var(--pe-warning)] border border-[var(--pe-warning)]/35 font-semibold">
                  <Flame size={11} /> Chaos Mode
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 mt-0.5">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--pe-text)]">
                Protocol &amp; Network Explorer
              </h1>
              <span className="text-xs sm:text-sm text-[var(--pe-text-secondary)]">
                — {state.scenario.title}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-[var(--pe-text-muted)]">
            <span className="px-2 py-0.5 rounded-md border border-[var(--pe-border)] bg-[var(--pe-surface)]">
              PORT {state.scenario.defaultPort ?? "80"}
            </span>
            <span className="px-2 py-0.5 rounded-md border border-[var(--pe-border)] bg-[var(--pe-surface)]">
              {state.scenario.transportType ?? "TCP"}
            </span>
          </div>
        </div>

        {/* MOBILE JUMP BAR (< xl) */}
        <nav
          className="grid grid-cols-4 xl:hidden items-center gap-1.5 px-3 sm:px-4 py-2 select-none border-b border-[var(--pe-border)] bg-[var(--pe-surface)]"
          aria-label="Mobile Navigation"
        >
          <button
            type="button"
            onClick={() => scrollToSection("proto-canvas-section")}
            className="inline-flex items-center justify-center gap-1 px-1.5 py-2 min-h-[40px] rounded-lg bg-[var(--pe-surface-alt)] border border-[var(--pe-border)] text-[11px] font-semibold text-[var(--pe-text-secondary)] whitespace-nowrap"
          >
            <Network size={13} className="shrink-0" />
            <span>Diagram</span>
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("proto-flow-section")}
            className="inline-flex items-center justify-center gap-1 px-1.5 py-2 min-h-[40px] rounded-lg bg-[var(--pe-surface-alt)] border border-[var(--pe-border)] text-[11px] font-semibold text-[var(--pe-text-secondary)] whitespace-nowrap"
          >
            <Activity size={13} className="shrink-0" />
            <span>Packets</span>
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("proto-details-section")}
            className="inline-flex items-center justify-center gap-1 px-1.5 py-2 min-h-[40px] rounded-lg bg-[var(--pe-surface-alt)] border border-[var(--pe-border)] text-[11px] font-semibold text-[var(--pe-text-secondary)] whitespace-nowrap"
          >
            <ListFilter size={13} className="shrink-0" />
            <span>Details</span>
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("proto-inspector-section")}
            className="inline-flex items-center justify-center gap-1 px-1.5 py-2 min-h-[40px] rounded-lg bg-[var(--pe-surface-alt)] border border-[var(--pe-border)] text-[11px] font-semibold text-[var(--pe-text-secondary)] whitespace-nowrap"
          >
            <Layers size={13} className="shrink-0" />
            <span>Inspect</span>
          </button>
        </nav>

        {/* MAIN 3-COLUMN WORKSPACE (Collapses gracefully to 2 columns or 1 column) */}
        <div
          className={`grid grid-cols-1 gap-3 p-3 sm:p-4 min-w-0 max-w-full ${
            showDirectory
              ? "xl:grid-cols-[248px_minmax(0,1fr)_325px]"
              : "xl:grid-cols-[minmax(0,1fr)_335px]"
          }`}
        >
          {/* COLUMN 1: COLLAPSIBLE LEFT PROTOCOL DIRECTORY */}
          {showDirectory && (
            <aside
              id="proto-catalog-section"
              className="order-3 xl:order-1 flex flex-col gap-2.5 bg-[var(--pe-surface)] p-3 rounded-xl border border-[var(--pe-border)] h-fit min-w-0"
              aria-label="Protocol directory"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--pe-text)]">
                  All protocols{" "}
                  <span className="text-[var(--pe-text-muted)] font-mono font-normal ml-1">
                    {PROTOCOL_CATALOG.length}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setDirectoryOpen(false)}
                  className="text-[11px] font-medium text-[var(--pe-text-muted)] hover:text-[var(--pe-text)] px-1.5 py-0.5 rounded"
                >
                  Hide
                </button>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search
                  size={13}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--pe-text-muted)] pointer-events-none"
                />
                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search protocols..."
                  aria-label="Search protocols"
                  className="w-full text-xs rounded-lg border border-[var(--pe-border)] bg-[var(--pe-surface-alt)] pl-8 pr-2.5 py-1.5 text-[var(--pe-text)] placeholder:text-[var(--pe-text-muted)] focus:outline-none focus:border-[var(--pe-accent)]"
                />
              </div>

              {/* Category Filter Pills */}
              <div className="grid grid-cols-2 gap-1 text-[11px] font-medium">
                {(
                  [
                    { id: "all", label: `All (${categoryCounts.all})` },
                    { id: "core", label: `Core (${categoryCounts.core})` },
                    { id: "application", label: `App (${categoryCounts.application})` },
                    { id: "security", label: `Security (${categoryCounts.security})` },
                  ] as const
                ).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryFilter(cat.id)}
                    className={`py-1.5 px-2 rounded-lg text-center transition-colors truncate cursor-pointer ${
                      categoryFilter === cat.id
                        ? "bg-[var(--pe-green-soft)] text-[var(--pe-green)] border border-[var(--pe-green)]/35 font-semibold"
                        : "bg-[var(--pe-surface-alt)] text-[var(--pe-text-muted)] hover:text-[var(--pe-text)] border border-transparent"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Protocol List */}
              <div className="flex flex-col gap-1 max-h-[520px] overflow-y-auto pr-0.5">
                {filteredProtocols.length === 0 ? (
                  <p className="text-xs text-[var(--pe-text-muted)] py-4 text-center">
                    No protocols match &ldquo;{searchQuery}&rdquo;.
                  </p>
                ) : (
                  filteredProtocols.map((p) => {
                    const isCurrent = p.id === selectedScenarioId;
                    return (
                      <div
                        key={p.id}
                        className={`rounded-lg border transition-colors ${
                          isCurrent
                            ? "border-[var(--pe-green)]/45 bg-[var(--pe-green-soft)]"
                            : "border-transparent hover:border-[var(--pe-border)] hover:bg-[var(--pe-surface-alt)]"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => void switchScenario(p.id)}
                          className="w-full flex items-center justify-between gap-2 p-2 text-left cursor-pointer"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--pe-surface)] border border-[var(--pe-border)] text-[var(--pe-text-muted)] shrink-0">
                              L{p.layer}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-[var(--pe-text)] truncate">
                                  {p.name}
                                </span>
                                {p.encrypted && (
                                  <ShieldCheck
                                    size={12}
                                    className="text-[var(--pe-green)] shrink-0"
                                    aria-label="Encrypted protocol"
                                  />
                                )}
                              </div>
                              <span className="text-[10px] text-[var(--pe-text-muted)] truncate block">
                                {p.fullName}
                              </span>
                            </div>
                          </div>
                          {isCurrent ? (
                            <ChevronDown size={14} className="text-[var(--pe-green)] shrink-0" />
                          ) : (
                            <ChevronRight size={14} className="text-[var(--pe-text-muted)] shrink-0" />
                          )}
                        </button>

                        {isCurrent && (
                          <div className="px-2 pb-2 pt-1 space-y-1 border-t border-[var(--pe-border)]">
                            {state.activeSteps.map((step, idx) => {
                              const isStepActive = idx === state.currentStepIndex;
                              return (
                                <button
                                  key={step.stepIndex}
                                  type="button"
                                  onClick={() => dispatch({ type: "GO_TO_STEP", stepIndex: idx })}
                                  className={`w-full flex items-center gap-2 px-2 py-1 rounded text-left text-[11px] font-mono transition-colors cursor-pointer ${
                                    isStepActive
                                      ? "bg-[var(--pe-orange-soft)] text-[var(--pe-orange)] font-bold"
                                      : "text-[var(--pe-text-muted)] hover:text-[var(--pe-text)] hover:bg-[var(--pe-surface)]"
                                  }`}
                                >
                                  <span className="shrink-0 w-4 text-[10px]">
                                    {String(idx + 1).padStart(2, "0")}
                                  </span>
                                  <span className="truncate">{step.arrowLabel}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </aside>
          )}

          {/* COLUMN 2: CENTER STAGE (CANVAS + PLAYBACK + PACKETS + SEQUENCE + INSPECTOR) */}
          <main
            id="proto-canvas-section"
            className="order-1 xl:order-2 flex-1 flex flex-col gap-3 min-w-0 max-w-full"
          >
            {/* Main Interactive Canvas Card */}
            <section className="rounded-xl border border-[var(--pe-border)] bg-[var(--pe-surface)] p-3 space-y-3 shadow-xs min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                {/* [Network] [Sequence] Switcher */}
                <div className="flex items-center gap-1 rounded-lg border border-[var(--pe-border)] bg-[var(--pe-surface-alt)] p-0.5">
                  <button
                    type="button"
                    onClick={() => setCenterViewMode("network")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      centerViewMode === "network"
                        ? "bg-[var(--pe-green)] text-white shadow-xs"
                        : "text-[var(--pe-text-muted)] hover:text-[var(--pe-text)]"
                    }`}
                  >
                    <Network size={13} />
                    <span>Network</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCenterViewMode("sequence")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      centerViewMode === "sequence"
                        ? "bg-[var(--pe-green)] text-white shadow-xs"
                        : "text-[var(--pe-text-muted)] hover:text-[var(--pe-text)]"
                    }`}
                  >
                    <Activity size={13} />
                    <span>Sequence</span>
                  </button>
                </div>

                <span className="text-xs font-mono font-semibold text-[var(--pe-text-muted)]">
                  STEP {String(state.currentStepIndex + 1).padStart(2, "0")} /{" "}
                  {String(state.activeSteps.length).padStart(2, "0")}
                </span>
              </div>

              {centerViewMode === "network" ? (
                <TopologyMap
                  nodes={state.scenario.nodes}
                  wires={state.scenario.wires}
                  currentStep={currentStep}
                  isPlaying={state.isPlaying}
                  speed={state.speed}
                  scenarioId={state.scenario.id}
                  stepIndex={state.currentStepIndex}
                  totalSteps={state.activeSteps.length}
                />
              ) : (
                <SequenceDiagram
                  nodes={state.scenario.nodes}
                  steps={state.activeSteps}
                  currentStepIndex={state.currentStepIndex}
                  onSelectStep={(idx) => dispatch({ type: "GO_TO_STEP", stepIndex: idx })}
                />
              )}

              {/* Integrated Segmented Playback Bar */}
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
                onSetSpeed={(spd) => dispatch({ type: "SET_SPEED", speed: spd as PlaybackSpeed })}
                onReset={() => dispatch({ type: "RESET" })}
              />
            </section>

            {/* Packets Strip */}
            <div id="proto-flow-section" className="min-w-0">
              <PacketFlowTable
                nodes={state.scenario.nodes}
                steps={state.activeSteps}
                currentStepIndex={state.currentStepIndex}
                onSelectStep={(idx) => dispatch({ type: "GO_TO_STEP", stepIndex: idx })}
              />
            </div>

            {/* Causality Sequence & Wireshark Table (Always mounted in Network mode) */}
            {centerViewMode === "network" && (
              <div className="min-w-0">
                <SequenceDiagram
                  nodes={state.scenario.nodes}
                  steps={state.activeSteps}
                  currentStepIndex={state.currentStepIndex}
                  onSelectStep={(idx) => dispatch({ type: "GO_TO_STEP", stepIndex: idx })}
                />
              </div>
            )}
          </main>

          {/* COLUMN 3: RIGHT DETAILS PANEL (Current Step, Overview, Chaos, Exam, Kat AI) */}
          <aside
            id="proto-details-section"
            className="order-2 xl:order-3 w-full xl:w-[336px] flex-shrink-0 flex flex-col gap-3 min-w-0"
            aria-label="Protocol details"
          >
            <div className="rounded-xl border border-[var(--pe-border)] bg-[var(--pe-surface)] overflow-hidden shadow-xs">
              {/* Details Tab Bar */}
              <div className="flex items-center gap-1 border-b border-[var(--pe-border)] bg-[var(--pe-surface-alt)] p-1.5 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setDetailsTab("step")}
                  className={`flex-1 whitespace-nowrap py-1.5 px-2.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                    detailsTab === "step"
                      ? "bg-[var(--pe-surface)] text-[var(--pe-text)] border border-[var(--pe-border)] shadow-xs"
                      : "text-[var(--pe-text-muted)] hover:text-[var(--pe-text)]"
                  }`}
                >
                  Current step
                </button>
                <button
                  type="button"
                  onClick={() => setDetailsTab("overview")}
                  className={`flex-1 whitespace-nowrap py-1.5 px-2.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                    detailsTab === "overview"
                      ? "bg-[var(--pe-surface)] text-[var(--pe-text)] border border-[var(--pe-border)] shadow-xs"
                      : "text-[var(--pe-text-muted)] hover:text-[var(--pe-text)]"
                  }`}
                >
                  Overview
                </button>
                {state.scenario.chaosVariants && state.scenario.chaosVariants.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setDetailsTab("chaos")}
                    className={`py-1.5 px-2.5 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer ${
                      detailsTab === "chaos"
                        ? "bg-[var(--pe-warning-soft)] text-[var(--pe-warning)] border border-[var(--pe-warning)]/40"
                        : "text-[var(--pe-text-muted)] hover:text-[var(--pe-text)]"
                    }`}
                    title="Chaos Sandbox"
                    aria-label="Chaos Sandbox"
                  >
                    <Flame size={13} />
                  </button>
                )}
                {state.scenario.examChallenge && (
                  <button
                    type="button"
                    onClick={() => setDetailsTab("exam")}
                    className={`py-1.5 px-2.5 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer ${
                      detailsTab === "exam"
                        ? "bg-[var(--pe-accent-soft)] text-[var(--pe-accent-text)] border border-[var(--pe-accent)]/40"
                        : "text-[var(--pe-text-muted)] hover:text-[var(--pe-text)]"
                    }`}
                    title="Exam Challenge"
                    aria-label="Exam Challenge"
                  >
                    <HelpCircle size={13} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDetailsTab("kat")}
                  className={`py-1.5 px-2.5 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer ${
                    detailsTab === "kat"
                      ? "bg-[var(--pe-accent-soft)] text-[var(--pe-accent-text)] border border-[var(--pe-accent)]/40"
                      : "text-[var(--pe-text-muted)] hover:text-[var(--pe-text)]"
                  }`}
                  title="Kat AI Insight"
                  aria-label="Kat AI Insight"
                >
                  <Bot size={13} />
                </button>
              </div>

              <div className="p-3.5">
                {/* TAB 1: CURRENT STEP */}
                {detailsTab === "step" && (
                  <div className="space-y-3.5">
                    {currentStep ? (
                      <>
                        <div key={`step-hdr-${state.scenario.id}-${state.currentStepIndex}`} className="pe-step-in">
                          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[var(--pe-text-muted)]">
                            <span className="inline-flex items-center gap-1.5">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  state.isPlaying ? "pe-dot-pop bg-[var(--pe-green)]" : "bg-[var(--pe-orange)]"
                                }`}
                              />
                              Step {String(state.currentStepIndex + 1).padStart(2, "0")}
                            </span>
                            <span>+{(currentStep.timeMs / 1000).toFixed(3)}s</span>
                          </div>
                          <h2 className="text-sm font-bold text-[var(--pe-text)] mt-1 leading-snug">
                            {currentStep.arrowLabel}
                          </h2>
                          <p className="text-xs text-[var(--pe-text-secondary)] mt-1.5 leading-relaxed">
                            {currentStep.summary}
                          </p>
                        </div>

                        {/* Interactive Step Checklist */}
                        <div className="space-y-1.5 pt-2 border-t border-[var(--pe-border)]">
                          {state.activeSteps.map((step, idx) => {
                            const isCurrent = idx === state.currentStepIndex;
                            const isCompleted = idx < state.currentStepIndex;

                            return (
                              <button
                                key={step.stepIndex}
                                type="button"
                                onClick={() =>
                                  dispatch({ type: "GO_TO_STEP", stepIndex: idx })
                                }
                                className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border text-left text-xs transition-colors cursor-pointer ${
                                  isCurrent
                                    ? "border-[var(--pe-orange)] bg-[var(--pe-orange-soft)] text-[var(--pe-text)] font-semibold"
                                    : "border-[var(--pe-border)] bg-[var(--pe-surface-alt)]/50 text-[var(--pe-text-secondary)] hover:border-[var(--pe-border-strong)]"
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span
                                    className={`text-[10px] font-mono shrink-0 ${
                                      isCurrent
                                        ? "text-[var(--pe-orange)] font-bold"
                                        : "text-[var(--pe-text-muted)]"
                                    }`}
                                  >
                                    {String(idx + 1).padStart(2, "0")}
                                  </span>
                                  <span className="truncate">{step.arrowLabel}</span>
                                </div>
                                {isCompleted && (
                                  <Check size={13} className="text-[var(--pe-green)] shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Key Metadata */}
                        <div className="border-t border-[var(--pe-border)] pt-2.5 space-y-1.5 text-[11px] font-mono">
                          <div className="flex justify-between gap-2">
                            <span className="text-[var(--pe-text-muted)]">Route</span>
                            <span className="text-[var(--pe-text)] font-semibold">
                              {currentStep.fromNodeId} → {currentStep.toNodeId}
                            </span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="text-[var(--pe-text-muted)]">Protocol</span>
                            <span className="text-[var(--pe-text)] font-semibold">
                              {currentStep.protocolName}
                            </span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="text-[var(--pe-text-muted)]">Frame Size</span>
                            <span className="text-[var(--pe-text)] font-semibold">
                              {Math.round(currentStep.rawHex.length / 2)} bytes
                            </span>
                          </div>
                        </div>

                        {/* Optional Code Lab Bridge in Lessons */}
                        {state.scenario.codeSnippetBridge && onOpenCodeLab && (
                          <button
                            type="button"
                            onClick={() =>
                              onOpenCodeLab(
                                state.scenario.codeSnippetBridge!.code,
                                state.scenario.codeSnippetBridge!.language,
                                state.scenario.codeSnippetBridge!.title
                              )
                            }
                            className="w-full py-2 px-3 rounded-lg border border-[var(--pe-border)] bg-[var(--pe-surface-alt)] hover:border-[var(--pe-accent)] text-xs font-semibold text-[var(--pe-text)] inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                          >
                            <Code2 size={14} className="text-[var(--pe-accent-text)]" />
                            <span>Open {state.scenario.codeSnippetBridge.language.toUpperCase()} Example</span>
                          </button>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-[var(--pe-text-muted)]">
                        Select a step to inspect its network mechanics.
                      </p>
                    )}
                  </div>
                )}

                {/* TAB 2: PROTOCOL OVERVIEW */}
                {detailsTab === "overview" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-[var(--pe-text-muted)]">
                        PROTOCOL OVERVIEW
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-[var(--pe-green)] px-2 py-0.5 rounded-full bg-[var(--pe-green-soft)] border border-[var(--pe-green)]/30 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--pe-green)]" /> ACTIVE
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-[var(--pe-text)] tracking-tight">
                        {currentCatalogItem.name}
                      </h3>
                      <p className="text-xs font-semibold text-[var(--pe-accent-text)] mt-0.5">
                        {state.scenario.title}
                      </p>
                    </div>

                    <p className="text-xs text-[var(--pe-text-secondary)] leading-relaxed">
                      {state.scenario.overviewDescription ?? state.scenario.summary}
                    </p>

                    <div className="border-t border-[var(--pe-border)] pt-2.5 space-y-2 text-[11px] font-mono">
                      <div className="flex items-center justify-between gap-2 py-1 border-b border-[var(--pe-border)]">
                        <span className="text-[var(--pe-text-muted)] text-[10px]">LAYER</span>
                        <span className="text-[var(--pe-text)] font-semibold text-right">
                          {osiLabelName(currentOsiLayer)} (Layer {currentOsiLayer})
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 py-1 border-b border-[var(--pe-border)]">
                        <span className="text-[var(--pe-text-muted)] text-[10px]">DEFAULT PORT</span>
                        <span className="text-[var(--pe-text)] font-semibold text-right">
                          {state.scenario.defaultPort ?? "80"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 py-1 border-b border-[var(--pe-border)]">
                        <span className="text-[var(--pe-text-muted)] text-[10px]">TRANSPORT</span>
                        <span className="text-[var(--pe-text)] font-semibold text-right">
                          {state.scenario.transportType ?? "TCP"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 py-1 border-b border-[var(--pe-border)]">
                        <span className="text-[var(--pe-text-muted)] text-[10px]">DATA FORMAT</span>
                        <span className="text-[var(--pe-text)] font-semibold text-right truncate max-w-[180px]">
                          {state.scenario.dataFormat ?? "Binary / Text"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 py-1 border-b border-[var(--pe-border)]">
                        <span className="text-[var(--pe-text-muted)] text-[10px]">METHODS</span>
                        <span className="text-[var(--pe-text)] font-semibold text-right truncate max-w-[180px]">
                          {state.scenario.commonMethods ?? "Request / Response"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 py-1">
                        <span className="text-[var(--pe-text-muted)] text-[10px]">RFC</span>
                        <span className="text-[var(--pe-accent-text)] font-semibold text-right">
                          {state.scenario.rfc ?? "IETF Standard"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: CHAOS SANDBOX */}
                {detailsTab === "chaos" && state.scenario.chaosVariants && (
                  <ChaosControls
                    variants={state.scenario.chaosVariants}
                    activeChaosId={state.activeChaosId}
                    onToggleChaos={(chaosId) => dispatch({ type: "TOGGLE_CHAOS", chaosId })}
                  />
                )}

                {/* TAB 4: EXAM CHALLENGE */}
                {detailsTab === "exam" && state.scenario.examChallenge && (
                  <ExamWorkbench
                    key={state.scenario.id}
                    challenge={state.scenario.examChallenge}
                    allSteps={state.scenario.steps}
                    onAskKat={onAskKat}
                  />
                )}

                {/* TAB 5: KAT AI INSIGHT */}
                {detailsTab === "kat" && (
                  <div className="space-y-3">
                    {currentStep ? (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--pe-accent-text)]">
                            <Sparkles size={14} />
                            <span>Kat Insight · Step {state.currentStepIndex + 1}</span>
                          </div>
                          <span className="text-[10px] font-mono text-[var(--pe-text-muted)]">
                            {currentStep.protocolName}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--pe-text-secondary)] leading-relaxed">
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
                            className="w-full py-2 px-3 rounded-lg bg-[var(--action-primary-bg)] hover:bg-[var(--action-primary-hover)] text-[var(--action-primary-text)] text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                          >
                            <Bot size={15} />
                            <span>Ask Kat About Step {state.currentStepIndex + 1}</span>
                          </button>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-[var(--pe-text-muted)] text-center py-4">
                        Select a step to inspect technical details with Kat AI.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>

        {/* FULL-WIDTH SPLIT-PANE PACKET INSPECTOR (Fields + Synchronized Hex Dump) */}
        <section
          id="proto-inspector-section"
          className="mx-3 sm:mx-4 mb-4 rounded-xl border border-[var(--pe-border)] bg-[var(--pe-surface)] p-3 space-y-2.5 shadow-xs min-w-0"
          aria-label="Packet inspector"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 min-w-0">
              <span className="text-xs font-bold text-[var(--pe-text)] whitespace-nowrap shrink-0">
                Packet inspector
              </span>
              {currentStep && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[var(--pe-text-muted)] min-w-0 truncate max-w-full sm:max-w-[460px]">
                  <span className="w-2 h-2 rounded-full bg-[var(--pe-orange)] shrink-0" />
                  <span className="truncate">
                    {currentStep.protocolName} · {currentStep.arrowLabel}
                  </span>
                </span>
              )}
            </div>

            {/* Mode Tabs: Split (desktop) / Packet Tree / Hex Dump */}
            <div className="flex items-center gap-1 rounded-lg border border-[var(--pe-border)] bg-[var(--pe-surface-alt)] p-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setInspectorMode("split")}
                className={`hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  inspectorMode === "split"
                    ? "bg-[var(--pe-green)] text-white shadow-xs"
                    : "text-[var(--pe-text-muted)] hover:text-[var(--pe-text)]"
                }`}
              >
                <Columns2 size={12} />
                <span>Split</span>
              </button>
              <button
                type="button"
                onClick={() => setInspectorMode("packet")}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  inspectorMode === "packet"
                    ? "bg-[var(--pe-green)] text-white shadow-xs"
                    : "text-[var(--pe-text-muted)] hover:text-[var(--pe-text)]"
                }`}
              >
                <Layers size={12} />
                <span>Packet Tree</span>
              </button>
              <button
                type="button"
                onClick={() => setInspectorMode("hex")}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  inspectorMode === "hex"
                    ? "bg-[var(--pe-green)] text-white shadow-xs"
                    : "text-[var(--pe-text-muted)] hover:text-[var(--pe-text)]"
                }`}
              >
                <Binary size={12} />
                <span>Hex Dump</span>
              </button>
            </div>
          </div>

          <div
            className={`grid gap-3 min-w-0 ${
              inspectorMode === "split" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
            }`}
          >
            {showPacketPane && (
              <div className="min-w-0">
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
                  onHoverField={(range) => dispatch({ type: "HOVER_FIELD_RANGE", range })}
                  onAskKat={
                    onAskKat ? (field, step) => handleAskKatAboutField(field, step) : undefined
                  }
                />
              </div>
            )}

            {showHexPane && (
              <div className="min-w-0">
                <HexDumpView
                  rawHex={currentStep?.rawHex ?? ""}
                  selectedRange={state.selectedFieldRange}
                  hoveredRange={state.hoveredFieldRange}
                  bytesPerRow={isMobileNarrow ? 8 : 16}
                  activeFieldLabel={activeFieldLabel}
                  onSelectByteOffset={handleSelectByteOffset}
                  onHoverByteOffset={handleHoverByteOffset}
                />
              </div>
            )}
          </div>
        </section>
      </div>
    </SimulatorErrorBoundary>
  );
}
