import { describe, it, expect } from "vitest";
import {
  createInitialSimulationState,
  simulationReducer,
} from "@/lib/protocols/state-machine";
import { tcpHandshakeScenario } from "@/data/protocols/tcp-handshake";
import { httpsExchangeScenario } from "@/data/protocols/https-exchange";

describe("Protocol Simulation State Machine", () => {
  it("initializes state at step 0 in paused mode", () => {
    const state = createInitialSimulationState(tcpHandshakeScenario);
    expect(state.currentStepIndex).toBe(0);
    expect(state.isPlaying).toBe(false);
    expect(state.speed).toBe(1);
    expect(state.activeChaosId).toBeNull();
    expect(state.selectedFieldRange).toBeNull();
  });

  it("handles play, pause, step forward, and step back", () => {
    let state = createInitialSimulationState(tcpHandshakeScenario);

    // Play
    state = simulationReducer(state, { type: "PLAY" });
    expect(state.isPlaying).toBe(true);

    // Step next
    state = simulationReducer(state, { type: "STEP_NEXT" });
    expect(state.currentStepIndex).toBe(1);

    // Step back
    state = simulationReducer(state, { type: "STEP_PREV" });
    expect(state.currentStepIndex).toBe(0);

    // Boundary: stepping back at 0 stays at 0
    state = simulationReducer(state, { type: "STEP_PREV" });
    expect(state.currentStepIndex).toBe(0);

    // Pause
    state = simulationReducer(state, { type: "PAUSE" });
    expect(state.isPlaying).toBe(false);
  });

  it("jumps directly to step with bounds clamping", () => {
    let state = createInitialSimulationState(tcpHandshakeScenario);
    state = simulationReducer(state, { type: "GO_TO_STEP", stepIndex: 3 });
    expect(state.currentStepIndex).toBe(3);

    // Clamps below 0
    state = simulationReducer(state, { type: "GO_TO_STEP", stepIndex: -5 });
    expect(state.currentStepIndex).toBe(0);

    // Clamps above max step
    state = simulationReducer(state, { type: "GO_TO_STEP", stepIndex: 999 });
    expect(state.currentStepIndex).toBe(tcpHandshakeScenario.steps.length - 1);
  });

  it("adjusts playback speed multiplier including 1.5x", () => {
    let state = createInitialSimulationState(tcpHandshakeScenario);
    state = simulationReducer(state, { type: "SET_SPEED", speed: 1.5 });
    expect(state.speed).toBe(1.5);

    state = simulationReducer(state, { type: "SET_SPEED", speed: 2 });
    expect(state.speed).toBe(2);

    state = simulationReducer(state, { type: "SET_SPEED", speed: 0.5 });
    expect(state.speed).toBe(0.5);
  });

  it("tracks selected and hovered byte ranges with optional layerName", () => {
    let state = createInitialSimulationState(tcpHandshakeScenario);
    state = simulationReducer(state, {
      type: "SELECT_FIELD_RANGE",
      range: [20, 24],
      layerName: "TCP",
    });
    expect(state.selectedFieldRange).toEqual([20, 24]);
    expect(state.selectedLayerName).toBe("TCP");

    state = simulationReducer(state, {
      type: "HOVER_FIELD_RANGE",
      range: [0, 4],
    });
    expect(state.hoveredFieldRange).toEqual([0, 4]);
  });

  it("toggles chaos mode and branches steps", () => {
    let state = createInitialSimulationState(tcpHandshakeScenario);
    expect(state.activeSteps).toEqual(tcpHandshakeScenario.steps);

    // Toggle chaos on
    state = simulationReducer(state, { type: "TOGGLE_CHAOS", chaosId: "drop-syn" });
    expect(state.activeChaosId).toBe("drop-syn");
    expect(state.activeSteps.length).toBeGreaterThan(0);
    expect(state.activeSteps[0].status).toBe("dropped");

    // Toggle chaos off
    state = simulationReducer(state, { type: "TOGGLE_CHAOS", chaosId: "drop-syn" });
    expect(state.activeChaosId).toBeNull();
    expect(state.activeSteps).toEqual(tcpHandshakeScenario.steps);
  });

  it("switches scenarios cleanly via SET_SCENARIO and resets active state", () => {
    let state = createInitialSimulationState(tcpHandshakeScenario);
    state = simulationReducer(state, { type: "GO_TO_STEP", stepIndex: 2 });
    state = simulationReducer(state, { type: "TOGGLE_CHAOS", chaosId: "drop-syn" });
    state = simulationReducer(state, { type: "SELECT_FIELD_RANGE", range: [2, 6], layerName: "TCP" });

    state = simulationReducer(state, { type: "SET_SCENARIO", scenario: httpsExchangeScenario });
    expect(state.scenario.id).toBe("https-exchange");
    expect(state.currentStepIndex).toBe(0);
    expect(state.activeChaosId).toBeNull();
    expect(state.selectedFieldRange).toBeNull();
    expect(state.activeSteps).toEqual(httpsExchangeScenario.steps);
  });

  it("resets state to initial values", () => {
    let state = createInitialSimulationState(tcpHandshakeScenario);
    state = simulationReducer(state, { type: "GO_TO_STEP", stepIndex: 4 });
    state = simulationReducer(state, { type: "PLAY" });
    state = simulationReducer(state, { type: "SELECT_FIELD_RANGE", range: [0, 4] });

    state = simulationReducer(state, { type: "RESET" });
    expect(state.currentStepIndex).toBe(0);
    expect(state.isPlaying).toBe(false);
    expect(state.selectedFieldRange).toBeNull();
  });
});
