import { describe, expect, it } from "vitest";
import { getHardwareSketchPreset, runHardwareSketch } from "@/lib/hardware-sketch-interpreter";

describe("browser hardware sketch interpreter", () => {
  it("runs a bounded Blink sketch and updates the simulated output and serial monitor", () => {
    const result = runHardwareSketch(getHardwareSketchPreset("arduino", "blink"), {
      target: "arduino", analogValue: 512, buttonPressed: false,
    });
    expect(result.pinModes["13"]).toBe("OUTPUT");
    expect(result.digitalPins["13"]).toBe(0);
    expect(result.serial.match(/LED on/g)).toHaveLength(4);
    expect(result.elapsedMs).toBe(2000);
  });

  it("models INPUT_PULLUP button state and if/else branches", () => {
    const source = getHardwareSketchPreset("arduino", "button");
    const pressed = runHardwareSketch(source, { target: "arduino", analogValue: 512, buttonPressed: true, cycles: 1 });
    const released = runHardwareSketch(source, { target: "arduino", analogValue: 512, buttonPressed: false, cycles: 1 });
    expect(pressed.digitalPins["13"]).toBe(1);
    expect(pressed.serial).toContain("Button pressed");
    expect(released.digitalPins["13"]).toBe(0);
  });

  it("accepts a bounded serial command before a sketch run", () => {
    const source = `const int LED_PIN = 13;
void setup() { pinMode(LED_PIN, OUTPUT); }
void loop() {
  if (Serial.available() > 0) {
    int command = Serial.read();
    if (command == '1') digitalWrite(LED_PIN, HIGH);
  }
}`;
    const result = runHardwareSketch(source, {
      target: "arduino", analogValue: 512, buttonPressed: false, serialInput: "1", cycles: 1,
    });
    expect(result.digitalPins["13"]).toBe(1);
  });

  it("reads board ADC values and supports loop variables and PWM calls", () => {
    const adc = runHardwareSketch(getHardwareSketchPreset("esp32", "sensor"), {
      target: "esp32", analogValue: 3072, buttonPressed: false, cycles: 1,
    });
    expect(adc.serial).toContain("ADC: 3072");

    const pwm = runHardwareSketch(getHardwareSketchPreset("arduino", "pwm"), {
      target: "arduino", analogValue: 512, buttonPressed: false, cycles: 1,
    });
    expect(pwm.pinModes["11"]).toBe("OUTPUT");
    expect(pwm.pwmPins["11"]).toBe(255);
  });

  it("rejects unsupported calls instead of executing arbitrary source", () => {
    expect(() => runHardwareSketch("void setup() { alert(1); }", {
      target: "arduino", analogValue: 0, buttonPressed: false,
    })).toThrow(/Unsupported API/);
  });
});
