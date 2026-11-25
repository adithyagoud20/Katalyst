import type { PacketStep, ProtocolScenario } from "./schema";

export type PlaybackSpeed = 0.5 | 1 | 1.5 | 2;

export interface SimulationState {
  scenario: ProtocolScenario;
  activeSteps: PacketStep[];
  currentStepIndex: number;
  isPlaying: boolean;
  speed: PlaybackSpeed;
  activeChaosId: string | null;
  selectedFieldRange: [number, number] | null;
  hoveredFieldRange: [number, number] | null;
  selectedLayerName: string | null;
}

export type SimulationAction =
  | { type: "SET_SCENARIO"; scenario: ProtocolScenario }
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "STEP_NEXT" }
  | { type: "STEP_PREV" }
  | { type: "GO_TO_STEP"; stepIndex: number }
  | { type: "SET_SPEED"; speed: PlaybackSpeed }
  | { type: "TOGGLE_CHAOS"; chaosId: string }
  | { type: "SELECT_FIELD_RANGE"; range: [number, number] | null; layerName?: string }
  | { type: "HOVER_FIELD_RANGE"; range: [number, number] | null }
  | { type: "RESET" };

export function createInitialSimulationState(scenario: ProtocolScenario): SimulationState {
  return {
    scenario,
    activeSteps: scenario.steps,
    currentStepIndex: 0,
    isPlaying: false,
    speed: 1,
    activeChaosId: null,
    selectedFieldRange: null,
    hoveredFieldRange: null,
    selectedLayerName: null,
  };
}

export function computeActiveSteps(scenario: ProtocolScenario, activeChaosId: string | null): PacketStep[] {
  if (!activeChaosId || !scenario.chaosVariants) {
    return scenario.steps;
  }
  const variant = scenario.chaosVariants.find((v) => v.id === activeChaosId);
  if (!variant) return scenario.steps;

  // Replace or branch steps starting from triggerStepIndex
  const prefix = scenario.steps.slice(0, variant.triggerStepIndex);
  return [...prefix, ...variant.alternateSteps];
}

export function simulationReducer(state: SimulationState, action: SimulationAction): SimulationState {
  switch (action.type) {
    case "SET_SCENARIO":
      return createInitialSimulationState(action.scenario);

    case "PLAY":
      return {
        ...state,
        isPlaying: true,
      };

    case "PAUSE":
      return {
        ...state,
        isPlaying: false,
      };

    case "STEP_NEXT": {
      const nextIndex = Math.min(state.currentStepIndex + 1, state.activeSteps.length - 1);
      const isEnd = nextIndex >= state.activeSteps.length - 1;
      return {
        ...state,
        currentStepIndex: nextIndex,
        isPlaying: isEnd ? false : state.isPlaying,
        selectedFieldRange: null,
        hoveredFieldRange: null,
      };
    }

    case "STEP_PREV":
      return {
        ...state,
        currentStepIndex: Math.max(state.currentStepIndex - 1, 0),
        selectedFieldRange: null,
        hoveredFieldRange: null,
      };

    case "GO_TO_STEP": {
      const clamped = Math.max(0, Math.min(action.stepIndex, state.activeSteps.length - 1));
      return {
        ...state,
        currentStepIndex: clamped,
        isPlaying: false,
        selectedFieldRange: null,
        hoveredFieldRange: null,
      };
    }

    case "SET_SPEED":
      return {
        ...state,
        speed: action.speed,
      };

    case "TOGGLE_CHAOS": {
      const nextChaosId = state.activeChaosId === action.chaosId ? null : action.chaosId;
      const nextSteps = computeActiveSteps(state.scenario, nextChaosId);
      const clampedIndex = Math.min(state.currentStepIndex, nextSteps.length - 1);
      return {
        ...state,
        activeChaosId: nextChaosId,
        activeSteps: nextSteps,
        currentStepIndex: clampedIndex,
        selectedFieldRange: null,
        hoveredFieldRange: null,
      };
    }

    case "SELECT_FIELD_RANGE":
      return {
        ...state,
        selectedFieldRange: action.range,
        selectedLayerName: action.layerName ?? state.selectedLayerName,
      };

    case "HOVER_FIELD_RANGE":
      return {
        ...state,
        hoveredFieldRange: action.range,
      };

    case "RESET":
      return {
        ...state,
        currentStepIndex: 0,
        isPlaying: false,
        activeChaosId: null,
        activeSteps: state.scenario.steps,
        selectedFieldRange: null,
        hoveredFieldRange: null,
        selectedLayerName: null,
      };

    default:
      return state;
  }
}
