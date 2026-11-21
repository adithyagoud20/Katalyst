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

  it("handles external hardware interrupts and volatile flags on ATmega328P Pin 2", () => {
    const source = `
const int SENSOR_PIN = 2;
volatile int pulses = 0;

void onTachPulse() {
  pulses++;
}

void setup() {
  pinMode(SENSOR_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(SENSOR_PIN), onTachPulse, FALLING);
  Serial.begin(115200);
}

void loop() {
  Serial.print("Count: ");
  Serial.println(pulses);
}`;
    const result = runHardwareSketch(source, {
      target: "arduino", analogValue: 0, buttonPressed: false, pulseTriggerPin: 2, cycles: 1,
    });
    expect(result.interruptEvents).toHaveLength(1);
    expect(result.interruptEvents[0]).toEqual({ pin: "2", isr: "onTachPulse", count: 1 });
    expect(result.serial).toContain("Count: 1");
  });

  it("simulates tone generation and noTone audio frequency control", () => {
    const toneSource = `
void setup() {
  tone(8, 440, 250);
}
void loop() {}`;
    const toneResult = runHardwareSketch(toneSource, {
      target: "arduino", analogValue: 0, buttonPressed: false, cycles: 1,
    });
    expect(toneResult.tone).toEqual({ pin: "8", frequency: 440, duration: 250 });

    const noToneSource = `
void setup() {
  tone(8, 440, 250);
}
void loop() {
  noTone(8);
}`;
    const noToneResult = runHardwareSketch(noToneSource, {
      target: "arduino", analogValue: 0, buttonPressed: false, cycles: 1,
    });
    expect(noToneResult.tone).toBeNull();
  });

  it("simulates Servo motor angular positioning and microsecond pulse widths", () => {
    const source = `
#include <Servo.h>
Servo panServo;

void setup() {
  panServo.attach(9);
  panServo.write(45);
}

void loop() {
  panServo.writeMicroseconds(2000);
}`;
    const result = runHardwareSketch(source, {
      target: "arduino", analogValue: 0, buttonPressed: false, cycles: 1,
    });
    expect(result.servos.panServo).toBeDefined();
    expect(result.servos.panServo.pulseUs).toBe(2000);
    expect(result.servos.panServo.angle).toBe(141); // round(((2000 - 544) / 1856) * 180)
  });

  it("simulates I2C Wire protocol and decodes OLED text frames", () => {
    const source = `
#include <Wire.h>

void setup() {
  Wire.begin();
  Wire.beginTransmission(0x3C);
  Wire.write(0x40);
  Wire.write(75); // 'K'
  Wire.write(65); // 'A'
  Wire.write(84); // 'T'
  Wire.endTransmission();
}
void loop() {}`;
    const result = runHardwareSketch(source, {
      target: "arduino", analogValue: 0, buttonPressed: false, cycles: 1,
    });
    expect(result.i2cTransactions).toHaveLength(1);
    expect(result.i2cTransactions[0].address).toBe(0x3C);
    expect(result.i2cTransactions[0].mode).toBe("write");
    expect(result.oledLines).toContain("@KAT");
  });

  it("simulates virtual 1024-byte EEPROM persistence across operations", () => {
    const source = `
void setup() {
  Serial.begin(115200);
  EEPROM.write(15, 99);
}
void loop() {
  int readBack = EEPROM.read(15);
  Serial.print("EEPROM: ");
  Serial.println(readBack);
}`;
    const result = runHardwareSketch(source, {
      target: "arduino", analogValue: 0, buttonPressed: false, cycles: 1,
    });
    expect(result.eeprom[15]).toBe(99);
    expect(result.serial).toContain("EEPROM: 99");
  });

  it("simulates ESP32 FreeRTOS pinned tasks and thread-safe queues with visible tick log", () => {
    const source = `
QueueHandle_t dataQueue;

void telemetryWorker(void *param) {
  int val = 123;
  xQueueSend(dataQueue, &val, 0);
  vTaskDelay(pdMS_TO_TICKS(50));
}

void setup() {
  Serial.begin(115200);
  dataQueue = xQueueCreate(4, sizeof(int));
  xTaskCreatePinnedToCore(telemetryWorker, "Telemetry", 2048, NULL, 2, NULL, 0);
}

void loop() {
  int item = 0;
  if (xQueueReceive(dataQueue, &item, 50) == 1) {
    Serial.print("Received: ");
    Serial.println(item);
  }
}`;
    const result = runHardwareSketch(source, {
      target: "esp32", analogValue: 0, buttonPressed: false, cycles: 2,
    });
    expect(result.freeRtosTasks).toHaveLength(1);
    expect(result.freeRtosTasks[0].name).toBe("Telemetry");
    expect(result.freeRtosTasks[0].core).toBe(0);
    expect(result.freeRtosLog.length).toBeGreaterThan(0);
    expect(result.serial).toContain("Received: 123");
  });

  it("simulates ESP32 MQTT telemetry publishing to mock broker", () => {
    const source = `
#include <WiFi.h>
#include <PubSubClient.h>

WiFiClient netClient;
PubSubClient client(netClient);

void setup() {
  Serial.begin(115200);
  WiFi.begin("LabWifi", "Pass123");
  client.setServer("broker.hivemq.com", 1883);
  if (client.connect("Node_Alpha")) {
    client.publish("katalyst/sensors/temp", "24.5");
  }
}
void loop() {}`;
    const result = runHardwareSketch(source, {
      target: "esp32", analogValue: 0, buttonPressed: false, cycles: 1,
    });
    expect(result.mqttMessages).toHaveLength(1);
    expect(result.mqttMessages[0]).toEqual({
      topic: "katalyst/sensors/temp",
      payload: "24.5",
    });
  });
});
