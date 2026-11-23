import type {
  HeaderField,
  PacketStep,
  ProtocolNode,
  ProtocolWire,
} from "@/lib/protocols/schema";
import type { PlaybackSpeed } from "@/lib/protocols/state-machine";

export type ProtocolExplorerTab = "flow" | "packet" | "hex" | "exam";

export interface ProtocolExplorerProps {
  initialScenarioId?: string;
  className?: string;
  onAskKat?: (prompt: string) => void;
  onOpenCodeLab?: (code: string, language: string, title: string) => void;
  hideProtocolSwitcher?: boolean;
}

export interface TopologyMapProps {
  nodes: ProtocolNode[];
  wires: ProtocolWire[];
  currentStep: PacketStep | null;
  isPlaying: boolean;
  speed: PlaybackSpeed;
}

export interface SequenceDiagramProps {
  nodes?: ProtocolNode[];
  steps: PacketStep[];
  currentStepIndex: number;
  onSelectStep: (index: number) => void;
}

export interface PacketInspectorProps {
  currentStep: PacketStep | null;
  selectedFieldRange: [number, number] | null;
  hoveredFieldRange: [number, number] | null;
  onSelectField: (field: HeaderField) => void;
  onHoverField: (range: [number, number] | null) => void;
  onAskKat?: (field: HeaderField, step: PacketStep) => void;
}

export interface HexDumpViewProps {
  rawHex: string;
  selectedRange: [number, number] | null;
  hoveredRange: [number, number] | null;
  bytesPerRow?: number;
}
