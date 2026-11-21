/**
 * A deliberately small, deterministic Arduino & ESP32 sketch interpreter.
 * Models a documented subset of the Arduino AVR and ESP32 FreeRTOS APIs in the browser
 * and never evaluates user source as JavaScript or accesses external servers.
 */

type Token = { kind: "identifier" | "number" | "string" | "character" | "operator"; value: string };
type Value = number | string | boolean | Value[] | Record<string, unknown> | null;
type Expr =
  | { kind: "literal"; value: Value }
  | { kind: "identifier"; name: string }
  | { kind: "member"; object: Expr; property: string }
  | { kind: "index"; object: Expr; index: Expr }
  | { kind: "unary"; operator: string; value: Expr }
  | { kind: "postfix"; operator: string; value: Expr }
  | { kind: "binary"; operator: string; left: Expr; right: Expr }
  | { kind: "assignment"; operator: string; target: Expr; value: Expr }
  | { kind: "call"; callee: Expr; args: Expr[] }
  | { kind: "array"; elements: Expr[] };

type Statement =
  | { kind: "block"; body: Statement[] }
  | { kind: "declaration"; name: string; isArray?: boolean; value?: Expr }
  | { kind: "expression"; value: Expr }
  | { kind: "if"; condition: Expr; yes: Statement; no?: Statement }
  | { kind: "for"; init?: Statement; condition?: Expr; step?: Expr; body: Statement }
  | { kind: "while"; condition: Expr; body: Statement }
  | { kind: "return"; value?: Expr };

const TYPE_WORDS = new Set([
  "int", "long", "short", "float", "double", "bool", "boolean", "byte", "char",
  "unsigned", "signed", "uint8_t", "uint16_t", "uint32_t", "int8_t", "int16_t", "int32_t",
  "size_t", "void", "Servo", "TaskHandle_t", "QueueHandle_t", "SemaphoreHandle_t",
  "WiFiClient", "PubSubClient", "esp_adc_cal_characteristics_t", "adc1_channel_t",
  "String", "ScheduledTask", "Task", "State", "enum", "struct"
]);

const PRECEDENCE: Record<string, number> = {
  "=": 1, "+=": 1, "-=": 1, "*=": 1, "/=": 1, "%=": 1,
  "||": 2,
  "&&": 3,
  "|": 4, "^": 5, "&": 6,
  "==": 7, "!=": 7,
  "<": 8, ">": 8, "<=": 8, ">=": 8,
  "<<": 9, ">>": 9,
  "+": 10, "-": 10,
  "*": 11, "/": 11, "%": 11,
};

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < source.length) {
    const ch = source[i];
    if (/\s/.test(ch)) { i += 1; continue; }
    if (ch === "/" && source[i + 1] === "/") {
      i += 2;
      while (i < source.length && source[i] !== "\n") i += 1;
      continue;
    }
    if (ch === "/" && source[i + 1] === "*") {
      i += 2;
      while (i < source.length && !(source[i] === "*" && source[i + 1] === "/")) i += 1;
      i = Math.min(source.length, i + 2);
      continue;
    }
    if (ch === '"' || ch === "'") {
      const quote = ch;
      i += 1;
      let value = "";
      while (i < source.length && source[i] !== quote) {
        if (source[i] === "\\" && i + 1 < source.length) {
          const escaped = source[i + 1];
          value += escaped === "n" ? "\n" : escaped === "t" ? "\t" : escaped === '"' ? '"' : escaped === "'" ? "'" : escaped;
          i += 2;
        } else {
          value += source[i];
          i += 1;
        }
      }
      if (source[i] !== quote) throw new Error("Unclosed string literal in sketch.");
      i += 1;
      tokens.push({ kind: quote === "'" ? "character" : "string", value });
      continue;
    }
    const number = source.slice(i).match(/^(?:0x[\da-f]+|(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)[fFlLuU]*/i)?.[0];
    if (number) {
      tokens.push({ kind: "number", value: number.replace(/[fFlLuU]+$/, "") });
      i += number.length;
      continue;
    }
    const identifier = source.slice(i).match(/^[A-Za-z_$][\w$]*/)?.[0];
    if (identifier) {
      tokens.push({ kind: "identifier", value: identifier });
      i += identifier.length;
      continue;
    }
    const operator = [
      "++", "--", "+=", "-=", "*=", "/=", "%=", "==", "!=", "<=", ">=", "&&", "||", "<<", ">>"
    ].find((item) => source.startsWith(item, i));
    if (operator) {
      tokens.push({ kind: "operator", value: operator });
      i += operator.length;
      continue;
    }
    if ("{}(),;.+-*/%=!<>~^&|:[]".includes(ch)) {
      tokens.push({ kind: "operator", value: ch });
      i += 1;
      continue;
    }
    if (ch === "#") {
      while (i < source.length && source[i] !== "\n") i += 1;
      continue;
    }
    throw new Error(`Unsupported character “${ch}” in sketch.`);
  }
  return tokens;
}

class Parser {
  private index = 0;
  constructor(private readonly tokens: Token[]) {}
  private peek(offset = 0) { return this.tokens[this.index + offset]; }
  private take(value?: string) {
    const token = this.peek();
    if (!token || (value !== undefined && token.value !== value)) {
      throw new Error(`Expected “${value ?? "token"}” but found “${token?.value ?? "end of sketch"}”.`);
    }
    this.index += 1;
    return token;
  }
  private match(value: string) {
    if (this.peek()?.value !== value) return false;
    this.index += 1;
    return true;
  }
  private isDeclaration() {
    let offset = 0;
    while (this.peek(offset)?.value === "const" || this.peek(offset)?.value === "volatile" || this.peek(offset)?.value === "static" || this.peek(offset)?.value === "IRAM_ATTR" || this.peek(offset)?.value === "RTC_DATA_ATTR") offset += 1;
    if (this.peek(offset)?.value === "unsigned" || this.peek(offset)?.value === "signed") offset += 1;
    return TYPE_WORDS.has(this.peek(offset)?.value ?? "");
  }

  parseAll(): Statement[] {
    const statements: Statement[] = [];
    while (this.peek()) {
      statements.push(this.statement());
    }
    return statements;
  }

  private statement(): Statement {
    if (this.match(";")) return { kind: "block", body: [] };
    if (this.match("{")) {
      const body: Statement[] = [];
      while (this.peek() && this.peek()?.value !== "}") {
        body.push(this.statement());
      }
      this.take("}");
      return { kind: "block", body };
    }
    if (this.match("if")) {
      this.take("(");
      const condition = this.expression();
      this.take(")");
      const yes = this.statement();
      const no = this.match("else") ? this.statement() : undefined;
      return { kind: "if", condition, yes, no };
    }
    if (this.match("while")) {
      this.take("(");
      const condition = this.expression();
      this.take(")");
      return { kind: "while", condition, body: this.statement() };
    }
    if (this.match("for")) {
      this.take("(");
      let init: Statement | undefined;
      if (this.peek()?.value !== ";") {
        init = this.isDeclaration() ? this.declaration(true) : { kind: "expression", value: this.expression() };
        if (this.peek()?.value === ";") this.take(";");
      } else {
        this.take(";");
      }
      const condition = this.peek()?.value === ";" ? undefined : this.expression();
      this.take(";");
      const step = this.peek()?.value === ")" ? undefined : this.expression();
      this.take(")");
      return { kind: "for", init, condition, step, body: this.statement() };
    }
    if (this.match("return")) {
      const value = this.peek()?.value === ";" ? undefined : this.expression();
      this.match(";");
      return { kind: "return", value };
    }
    if (this.isDeclaration()) return this.declaration(true);
    const value = this.expression();
    this.match(";");
    return { kind: "expression", value };
  }

  private declaration(withSemicolon: boolean): Statement {
    while (this.match("const") || this.match("volatile") || this.match("static") || this.match("IRAM_ATTR") || this.match("RTC_DATA_ATTR")) { /* qualifiers */ }
    if (this.match("unsigned") || this.match("signed")) { /* signedness */ }
    if (this.match("struct") || this.match("enum")) { /* struct or enum prefix */ }
    if (!TYPE_WORDS.has(this.peek()?.value ?? "")) {
      throw new Error(`Expected a supported variable type near “${this.peek()?.value}”.`);
    }
    this.take();
    while (this.match("*")) { /* pointers */ }
    if ((this.peek()?.value === "int" || this.peek()?.value === "long") && (this.tokens[this.index - 1]?.value === "unsigned" || this.tokens[this.index - 1]?.value === "long")) {
      this.take();
    }
    const name = this.take().value;
    let isArray = false;
    if (this.match("[")) {
      if (this.peek()?.value !== "]") this.expression();
      this.take("]");
      isArray = true;
    }
    let value: Expr | undefined;
    if (this.match("=")) {
      if (this.match("{")) {
        const elements: Expr[] = [];
        if (!this.match("}")) {
          do {
            elements.push(this.expression());
          } while (this.match(","));
          this.match("}");
        }
        value = { kind: "array", elements };
      } else {
        value = this.expression();
      }
    } else if (this.match("(")) {
      // Constructor invocation e.g. PubSubClient mqttClient(espClient);
      if (!this.match(")")) {
        do { this.expression(); } while (this.match(","));
        this.take(")");
      }
      value = { kind: "literal", value: 1 };
    }
    if (withSemicolon) this.match(";");
    return { kind: "declaration", name, isArray, value };
  }

  private expression(minPrecedence = 1): Expr {
    let left = this.prefix();
    while (this.peek()) {
      if (this.match(".")) {
        left = { kind: "member", object: left, property: this.take().value };
        continue;
      }
      if (this.match("[")) {
        const index = this.expression();
        this.take("]");
        left = { kind: "index", object: left, index };
        continue;
      }
      if (this.match("(")) {
        const args: Expr[] = [];
        if (!this.match(")")) {
          do { args.push(this.expression()); } while (this.match(","));
          this.take(")");
        }
        left = { kind: "call", callee: left, args };
        continue;
      }
      if (this.peek()?.value === "++" || this.peek()?.value === "--") {
        left = { kind: "postfix", operator: this.take().value, value: left };
        continue;
      }
      const operator = this.peek()?.value ?? "";
      const precedence = PRECEDENCE[operator] ?? 0;
      if (precedence < minPrecedence) break;
      this.take();
      const right = this.expression(precedence + (precedence === 1 ? 0 : 1));
      left = precedence === 1 ? { kind: "assignment", operator, target: left, value: right } : { kind: "binary", operator, left, right };
    }
    return left;
  }

  private prefix(): Expr {
    const token = this.peek();
    if (!token) throw new Error("Unexpected end of sketch.");
    if (["!", "-", "+", "++", "--", "&", "*", "~"].includes(token.value)) {
      this.take();
      return { kind: "unary", operator: token.value, value: this.prefix() };
    }
    if (this.match("(")) {
      // Check for C cast e.g. (uint32_t)val or (void*)param
      if (TYPE_WORDS.has(this.peek()?.value ?? "") && this.peek(1)?.value === ")") {
        this.take();
        this.take(")");
        return this.prefix();
      }
      const value = this.expression();
      this.take(")");
      return value;
    }
    this.take();
    if (token.value === "sizeof") {
      if (this.match("(")) {
        if (TYPE_WORDS.has(this.peek()?.value ?? "")) {
          this.take();
        } else {
          this.expression();
        }
        this.take(")");
      }
      return { kind: "literal", value: 4 };
    }
    if (token.kind === "number") {
      return { kind: "literal", value: token.value.toLowerCase().startsWith("0x") ? parseInt(token.value, 16) : Number(token.value) };
    }
    if (token.kind === "string") return { kind: "literal", value: token.value };
    if (token.kind === "character") return { kind: "literal", value: token.value.codePointAt(0) ?? 0 };
    if (token.value === "true") return { kind: "literal", value: true };
    if (token.value === "false") return { kind: "literal", value: false };
    if (token.value === "NULL") return { kind: "literal", value: 0 };
    return { kind: "identifier", name: token.value };
  }
}

interface FunctionDef {
  name: string;
  params: string[];
  body: Token[];
}

function extractAllFunctions(tokens: Token[]) {
  const functions = new Map<string, FunctionDef>();
  const removed = new Set<number>();

  for (let i = 0; i < tokens.length - 2; i += 1) {
    if (tokens[i + 1]?.value === "(") {
      let isFunc = false;
      let startIdx = i;
      if (i > 0 && (TYPE_WORDS.has(tokens[i - 1].value) || tokens[i - 1].value === "IRAM_ATTR" || tokens[i - 1].value === "*")) {
        isFunc = true;
        startIdx = i - 1;
        while (startIdx > 0 && (TYPE_WORDS.has(tokens[startIdx - 1].value) || tokens[startIdx - 1].value === "IRAM_ATTR")) {
          startIdx -= 1;
        }
      } else if (tokens[i].value === "setup" || tokens[i].value === "loop") {
        isFunc = true;
      }
      if (!isFunc) continue;

      const name = tokens[i].value;
      let pEnd = i + 2;
      while (pEnd < tokens.length && tokens[pEnd].value !== ")") pEnd += 1;
      if (pEnd >= tokens.length || tokens[pEnd + 1]?.value !== "{") continue;

      const paramTokens = tokens.slice(i + 2, pEnd);
      const params: string[] = [];
      for (let p = 0; p < paramTokens.length; p++) {
        if (paramTokens[p].kind === "identifier" && (p === paramTokens.length - 1 || paramTokens[p + 1].value === ",")) {
          params.push(paramTokens[p].value);
        }
      }

      let depth = 1;
      let bEnd = pEnd + 2;
      while (bEnd < tokens.length && depth > 0) {
        if (tokens[bEnd].value === "{") depth += 1;
        if (tokens[bEnd].value === "}") depth -= 1;
        bEnd += 1;
      }
      if (depth !== 0) throw new Error(`Unclosed function “${name}()” block.`);

      functions.set(name, {
        name,
        params,
        body: tokens.slice(pEnd + 2, bEnd - 1),
      });

      for (let j = startIdx; j < bEnd; j += 1) removed.add(j);
      i = bEnd - 1;
    }
  }

  return { functions, globals: tokens.filter((_, index) => !removed.has(index)) };
}

export interface HardwareSketchOptions {
  target: "arduino" | "esp32";
  analogValue: number;
  buttonPressed: boolean;
  serialInput?: string;
  cycles?: number;
  pulseTriggerPin?: number | string;
  pulseTriggerEdge?: "RISING" | "FALLING" | "CHANGE";
  initialEeprom?: number[];
}

export interface HardwareSketchResult {
  digitalPins: Record<string, number>;
  pwmPins: Record<string, number>;
  pinModes: Record<string, string>;
  serial: string;
  elapsedMs: number;
  cycles: number;
  tone?: { pin: string; frequency: number; duration: number } | null;
  servos: Record<string, { angle: number; pulseUs: number }>;
  i2cTransactions: Array<{ address: number; mode: "write" | "read"; data: number[] }>;
  oledLines: string[];
  eeprom: number[];
  interruptEvents: Array<{ pin: string; isr: string; count: number }>;
  freeRtosTasks: Array<{ name: string; core: number; priority: number; ticksRun: number }>;
  freeRtosLog: Array<{ tick: number; core: number; task: string; message: string }>;
  mqttMessages: Array<{ topic: string; payload: string }>;
}

export type HardwareSketchPreset =
  | "blink"
  | "button"
  | "sensor"
  | "pwm"
  | "interrupt"
  | "tone"
  | "servo"
  | "i2c"
  | "freertos"
  | "mqtt";

export function getHardwareSketchPreset(target: "arduino" | "esp32", preset: HardwareSketchPreset): string {
  const led = target === "arduino" ? "13" : "18";
  const button = target === "arduino" ? "2" : "25";
  const sensor = target === "arduino" ? "A0" : "34";

  if (preset === "button") return `// Button input with the built-in pull-up resistor
const int LED_PIN = ${led};
const int BUTTON_PIN = ${button};

void setup() {
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  Serial.begin(115200);
}

void loop() {
  if (digitalRead(BUTTON_PIN) == LOW) {
    digitalWrite(LED_PIN, HIGH);
    Serial.println("Button pressed — LED on");
  } else {
    digitalWrite(LED_PIN, LOW);
  }
}`;

  if (preset === "sensor") return `// Read the ${target === "arduino" ? "10-bit" : "12-bit"} ADC and report the raw value
const int SENSOR_PIN = ${sensor};

void setup() {
  Serial.begin(115200);
}

void loop() {
  int rawADC = analogRead(SENSOR_PIN);
  Serial.print("ADC: ");
  Serial.println(rawADC);
  delay(250);
}`;

  if (preset === "pwm") return target === "arduino" ? `// PWM output on Uno pin 11 (0–255 duty cycle)
const int LED_PIN = 11;

void setup() {
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  for (int brightness = 0; brightness <= 255; brightness += 85) {
    analogWrite(LED_PIN, brightness);
    delay(50);
  }
}` : `// ESP32 LEDC PWM: pin, frequency (Hz), resolution (bits)
const int LED_PIN = 18;

void setup() {
  ledcAttach(LED_PIN, 5000, 8);
}

void loop() {
  for (int brightness = 0; brightness <= 255; brightness += 85) {
    ledcWrite(LED_PIN, brightness);
    delay(50);
  }
}`;

  if (preset === "interrupt") return `// External hardware interrupt on Pin 2
const int SENSOR_PIN = 2;
volatile int count = 0;

void onPulse() {
  count++;
}

void setup() {
  Serial.begin(115200);
  pinMode(SENSOR_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(SENSOR_PIN), onPulse, FALLING);
}

void loop() {
  Serial.print("Pulses: ");
  Serial.println(count);
  delay(500);
}`;

  if (preset === "tone") return `// Acoustic tone generator on Pin 8
const int BUZZER_PIN = 8;

void setup() {
  tone(BUZZER_PIN, 440, 200);
}

void loop() {
  delay(500);
  noTone(BUZZER_PIN);
}`;

  if (preset === "servo") return `// Servo motor position control on Pin 9
#include <Servo.h>
Servo panServo;

void setup() {
  panServo.attach(9);
  panServo.write(90);
}

void loop() {
  panServo.write(180);
  delay(1000);
  panServo.write(0);
  delay(1000);
}`;

  if (preset === "i2c") return `// I2C communication with SSD1306 OLED (0x3C)
#include <Wire.h>

void setup() {
  Wire.begin();
  Wire.beginTransmission(0x3C);
  Wire.write(0x40); // Data byte
  Wire.write(0x4B); // 'K'
  Wire.write(0x41); // 'A'
  Wire.write(0x54); // 'T'
  Wire.endTransmission();
}

void loop() {
  delay(1000);
}`;

  if (preset === "freertos") return `// ESP32 FreeRTOS multitasking and queues
QueueHandle_t sensorQueue;

void samplerTask(void *param) {
  for (;;) {
    int val = analogRead(34);
    xQueueSend(sensorQueue, &val, 0);
    vTaskDelay(pdMS_TO_TICKS(100));
  }
}

void setup() {
  Serial.begin(115200);
  sensorQueue = xQueueCreate(4, sizeof(int));
  xTaskCreatePinnedToCore(samplerTask, "Sampler", 2048, NULL, 2, NULL, 0);
}

void loop() {
  int item = 0;
  if (xQueueReceive(sensorQueue, &item, 50) == 1) {
    Serial.print("Queue item: ");
    Serial.println(item);
  }
  delay(200);
}`;

  if (preset === "mqtt") return `// ESP32 MQTT client telemetry publisher
#include <WiFi.h>
#include <PubSubClient.h>

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);
  WiFi.begin("CampusWiFi", "SecurePass");
  client.setServer("broker.katalyst.io", 1883);
  if (client.connect("Node_1")) {
    client.publish("sensors/telemetry", "{\\"status\\":\\"online\\"}");
  }
}

void loop() {
  delay(1000);
}`;

  return `// Blink an LED four times in the deterministic simulator
const int LED_PIN = ${led};

void setup() {
  pinMode(LED_PIN, OUTPUT);
  Serial.begin(115200);
}

void loop() {
  digitalWrite(LED_PIN, HIGH);
  Serial.println("LED on");
  delay(250);
  digitalWrite(LED_PIN, LOW);
  Serial.println("LED off");
  delay(250);
}`;
}

export function runHardwareSketch(source: string, options: HardwareSketchOptions): HardwareSketchResult {
  if (source.length > 15_000) throw new Error("Sketch is over the 15,000 character limit.");
  const cleaned = source.split("\n").filter((line) => !/^\s*#\s*include\b/.test(line)).join("\n");
  const { functions, globals } = extractAllFunctions(tokenize(cleaned));
  if (!functions.has("setup") && !functions.has("loop")) {
    throw new Error("Add a setup() or loop() function to run this sketch.");
  }

  const statements = (tokens: Token[]) => new Parser(tokens).parseAll();
  const env: Record<string, Value> = {
    HIGH: 1, LOW: 0, OUTPUT: 1, INPUT: 0, INPUT_PULLUP: 2,
    LED_BUILTIN: options.target === "arduino" ? 13 : 2,
    A0: options.target === "arduino" ? 14 : 34,
    A1: options.target === "arduino" ? 15 : 35,
    A2: options.target === "arduino" ? 16 : 32,
    A3: options.target === "arduino" ? 17 : 33,
    A4: options.target === "arduino" ? 18 : 21,
    A5: options.target === "arduino" ? 19 : 22,
    RISING: 3, FALLING: 2, CHANGE: 1,
    ADC_11db: 11, ADC_UNIT_1: 1, ADC_WIDTH_BIT_12: 12,
    WL_CONNECTED: 3,
    true: true, false: false,
  };

  const modes: Record<string, string> = {};
  const digital: Record<string, number> = {};
  const pwm: Record<string, number> = {};
  const serial: string[] = [];
  const serialInput = (options.serialInput ?? "").slice(0, 256);
  let serialCursor = 0;
  let elapsedMs = 0;
  let instructionBudget = 25_000;
  let loopCycles = 0;

  // New hardware features state
  let activeTone: { pin: string; frequency: number; duration: number } | null = null;
  const servos: Record<string, { angle: number; pulseUs: number }> = {};
  const i2cTransactions: Array<{ address: number; mode: "write" | "read"; data: number[] }> = [];
  let currentTransmission: { address: number; data: number[] } | null = null;
  const oledLines: string[] = [];
  const eeprom = options.initialEeprom ? [...options.initialEeprom] : new Array(1024).fill(255);
  const interrupts: Record<string, { isr: string; mode: number; count: number }> = {};
  const freeRtosTasks: Array<{ name: string; core: number; priority: number; ticksRun: number; fn: string }> = [];
  const freeRtosLog: Array<{ tick: number; core: number; task: string; message: string }> = [];
  const queues: Record<number, { capacity: number; items: Value[] }> = {};
  let nextQueueId = 1;
  const mqttMessages: Array<{ topic: string; payload: string }> = [];

  const clampPin = (value: Value) => String(Math.max(0, Math.min(63, Math.trunc(Number(value) || 0))));
  const truthy = (value: Value) => Boolean(value);
  const numeric = (value: Value) => (typeof value === "boolean" ? Number(value) : Number(value) || 0);
  const toString = (value: Value) => (typeof value === "boolean" ? (value ? "1" : "0") : String(value ?? ""));
  const setVariable = (name: string, value: Value) => { env[name] = value; return value; };

  const callUserFunction = (fnDef: FunctionDef, argValues: Value[]): Value => {
    const prevScope: Record<string, Value | undefined> = {};
    for (let i = 0; i < fnDef.params.length; i++) {
      const pName = fnDef.params[i];
      prevScope[pName] = env[pName];
      env[pName] = argValues[i] ?? 0;
    }
    const bodyStatements = statements(fnDef.body);
    let returnValue: Value = 0;
    for (const stmt of bodyStatements) {
      if (stmt.kind === "return") {
        returnValue = stmt.value ? evaluate(stmt.value) : 0;
        break;
      }
      execute(stmt);
    }
    for (const pName of fnDef.params) {
      if (prevScope[pName] !== undefined) env[pName] = prevScope[pName]!;
      else delete env[pName];
    }
    return returnValue;
  };

  const evaluate = (expr: Expr): Value => {
    switch (expr.kind) {
      case "literal": return expr.value;
      case "identifier": return env[expr.name] ?? 0;
      case "array": return expr.elements.map(evaluate);
      case "member": {
        const objName = expr.object.kind === "identifier" ? expr.object.name : "";
        return `${objName}.${expr.property}`;
      }
      case "index": {
        const obj = evaluate(expr.object);
        const idx = numeric(evaluate(expr.index));
        if (Array.isArray(obj)) return obj[idx] ?? 0;
        return 0;
      }
      case "unary": {
        if (expr.operator === "++" || expr.operator === "--") {
          if (expr.value.kind !== "identifier") throw new Error("Increment only supports simple variables.");
          const next = numeric(env[expr.value.name] ?? 0) + (expr.operator === "++" ? 1 : -1);
          return setVariable(expr.value.name, next);
        }
        if (expr.operator === "&" || expr.operator === "*") {
          return evaluate(expr.value);
        }
        const value = evaluate(expr.value);
        return expr.operator === "!" ? !truthy(value) : expr.operator === "-" ? -numeric(value) : expr.operator === "~" ? ~numeric(value) : numeric(value);
      }
      case "postfix": {
        if (expr.value.kind !== "identifier") throw new Error("Increment only supports simple variables.");
        const previous = numeric(env[expr.value.name] ?? 0);
        setVariable(expr.value.name, previous + (expr.operator === "++" ? 1 : -1));
        return previous;
      }
      case "assignment": {
        if (expr.target.kind === "index") {
          const arr = evaluate(expr.target.object);
          const idx = numeric(evaluate(expr.target.index));
          const right = evaluate(expr.value);
          if (Array.isArray(arr)) arr[idx] = right;
          return right;
        }
        if (expr.target.kind !== "identifier") throw new Error("Assignment only supports simple variables or array elements.");
        const right = evaluate(expr.value);
        if (expr.operator === "=") return setVariable(expr.target.name, right);
        const current = numeric(env[expr.target.name] ?? 0);
        const next = numeric(right);
        const result =
          expr.operator === "+=" ? current + next :
          expr.operator === "-=" ? current - next :
          expr.operator === "*=" ? current * next :
          expr.operator === "/=" ? (next !== 0 ? current / next : 0) :
          current % (next || 1);
        return setVariable(expr.target.name, result);
      }
      case "binary": {
        const left = evaluate(expr.left);
        if (expr.operator === "&&" && !truthy(left)) return false;
        if (expr.operator === "||" && truthy(left)) return true;
        const right = evaluate(expr.right);
        const a = numeric(left);
        const b = numeric(right);
        switch (expr.operator) {
          case "+": return typeof left === "string" || typeof right === "string" ? toString(left) + toString(right) : a + b;
          case "-": return a - b;
          case "*": return a * b;
          case "/": if (b === 0) throw new Error("Division by zero in sketch."); return a / b;
          case "%": if (b === 0) throw new Error("Division by zero in sketch."); return a % b;
          case "<<": return a << b;
          case ">>": return a >> b;
          case "&": return a & b;
          case "|": return a | b;
          case "^": return a ^ b;
          case "<": return a < b;
          case ">": return a > b;
          case "<=": return a <= b;
          case ">=": return a >= b;
          case "==": return left === right || a === b;
          case "!=": return !(left === right || a === b);
          case "&&": return truthy(left) && truthy(right);
          case "||": return truthy(left) || truthy(right);
          default: return 0;
        }
      }
      case "call": {
        const args = expr.args.map(evaluate);
        const calleeStr = expr.callee.kind === "identifier"
          ? expr.callee.name
          : expr.callee.kind === "member"
          ? `${expr.callee.object.kind === "identifier" ? expr.callee.object.name : ""}.${expr.callee.property}`
          : "";

        // Check user-defined functions
        if (functions.has(calleeStr)) {
          return callUserFunction(functions.get(calleeStr)!, args);
        }

        const pin = clampPin(args[0] ?? 0);

        // Standard I/O
        if (calleeStr === "pinMode") {
          modes[pin] = args[1] === 2 ? "INPUT_PULLUP" : args[1] === 0 ? "INPUT" : "OUTPUT";
          return 0;
        }
        if (calleeStr === "digitalWrite") {
          digital[pin] = numeric(args[1] ?? 0) ? 1 : 0;
          return 0;
        }
        if (calleeStr === "digitalRead") {
          const mode = modes[pin];
          if (mode === "INPUT_PULLUP") return options.buttonPressed ? 0 : 1;
          if (mode === "INPUT") return options.buttonPressed ? 1 : 0;
          return digital[pin] ?? 0;
        }
        if (calleeStr === "analogRead") {
          return Math.max(0, Math.min(options.target === "arduino" ? 1023 : 4095, Math.round(options.analogValue)));
        }
        if (calleeStr === "analogWrite") {
          pwm[pin] = Math.max(0, Math.min(255, numeric(args[1] ?? 0)));
          digital[pin] = pwm[pin] > 0 ? 1 : 0;
          return 0;
        }
        if (calleeStr === "analogReadResolution" || calleeStr === "analogSetPinAttenuation") return 0;

        // ESP32 LEDC PWM
        if (calleeStr === "ledcAttach" || calleeStr === "ledcAttachChannel") return 1;
        if (calleeStr === "ledcWrite") {
          pwm[pin] = Math.max(0, Math.min(255, numeric(args[1] ?? 0)));
          digital[pin] = pwm[pin] > 0 ? 1 : 0;
          return 0;
        }

        // Timing
        if (calleeStr === "delay") {
          elapsedMs = Math.min(60_000, elapsedMs + Math.max(0, Math.min(10_000, numeric(args[0] ?? 0))));
          return 0;
        }
        if (calleeStr === "delayMicroseconds") {
          elapsedMs = Math.min(60_000, elapsedMs + Math.max(0, numeric(args[0] ?? 0)) / 1000);
          return 0;
        }
        if (calleeStr === "millis") return Math.round(elapsedMs);
        if (calleeStr === "micros") return Math.round(elapsedMs * 1000);

        // Serial Telemetry
        if (calleeStr === "Serial.begin") return 0;
        if (calleeStr === "Serial.print") {
          serial.push(toString(args[0] ?? ""));
          return 0;
        }
        if (calleeStr === "Serial.println") {
          serial.push(`${toString(args[0] ?? "")}\n`);
          return 0;
        }
        if (calleeStr === "Serial.printf") {
          let str = toString(args[0] ?? "");
          for (let ai = 1; ai < args.length; ai++) {
            str = str.replace(/%[sduf]/, toString(args[ai]));
          }
          serial.push(str);
          return 0;
        }
        if (calleeStr === "Serial.available") return serialInput.length - serialCursor;
        if (calleeStr === "Serial.read") return serialCursor < serialInput.length ? serialInput.charCodeAt(serialCursor++) : -1;
        if (calleeStr === "Serial.flush") return 0;

        // Interrupts
        if (calleeStr === "digitalPinToInterrupt") {
          const p = numeric(args[0]);
          return p === 2 ? 0 : p === 3 ? 1 : p;
        }
        if (calleeStr === "attachInterrupt") {
          const intNum = numeric(args[0]);
          const intPin = intNum === 0 ? "2" : intNum === 1 ? "3" : String(intNum);
          const isrName = typeof args[1] === "string" ? args[1] : (expr.args[1] && expr.args[1].kind === "identifier" ? expr.args[1].name : "onPulse");
          const mode = numeric(args[2] ?? 2);
          interrupts[intPin] = { isr: isrName, mode, count: 0 };
          return 0;
        }
        if (calleeStr === "detachInterrupt") {
          const intPin = String(numeric(args[0]));
          delete interrupts[intPin];
          return 0;
        }
        if (calleeStr === "noInterrupts" || calleeStr === "cli") return 0;
        if (calleeStr === "interrupts" || calleeStr === "sei") return 0;

        // Tone & Audio
        if (calleeStr === "tone") {
          activeTone = { pin, frequency: numeric(args[1] ?? 440), duration: numeric(args[2] ?? 0) };
          return 0;
        }
        if (calleeStr === "noTone") {
          if (activeTone?.pin === pin) activeTone = null;
          return 0;
        }

        // Servo Motor Shim
        if (calleeStr.endsWith(".attach")) {
          const servoName = calleeStr.slice(0, calleeStr.lastIndexOf("."));
          servos[servoName] = { angle: 90, pulseUs: 1500 };
          return 1;
        }
        if (calleeStr !== "Wire.write" && calleeStr !== "EEPROM.write" && !calleeStr.startsWith("client.") && !calleeStr.startsWith("mqttClient.") && calleeStr.endsWith(".write")) {
          const servoName = calleeStr.slice(0, calleeStr.lastIndexOf("."));
          const angle = Math.max(0, Math.min(180, Math.round(numeric(args[0] ?? 90))));
          const pulseUs = Math.round(544 + (angle / 180) * (2400 - 544));
          servos[servoName] = { angle, pulseUs };
          return 0;
        }
        if (calleeStr.endsWith(".writeMicroseconds")) {
          const servoName = calleeStr.slice(0, calleeStr.lastIndexOf("."));
          const pulseUs = Math.max(544, Math.min(2400, Math.round(numeric(args[0] ?? 1500))));
          const angle = Math.round(((pulseUs - 544) / (2400 - 544)) * 180);
          servos[servoName] = { angle, pulseUs };
          return 0;
        }
        if (calleeStr !== "Wire.read" && calleeStr !== "EEPROM.read" && calleeStr !== "Serial.read" && calleeStr !== "digitalRead" && calleeStr !== "analogRead" && calleeStr.endsWith(".read")) {
          const servoName = calleeStr.slice(0, calleeStr.lastIndexOf("."));
          return servos[servoName]?.angle ?? 90;
        }

        // Wire (I2C) Protocol Shim
        if (calleeStr === "Wire.begin") return 0;
        if (calleeStr === "Wire.beginTransmission") {
          currentTransmission = { address: numeric(args[0]), data: [] };
          return 0;
        }
        if (calleeStr === "Wire.write") {
          if (currentTransmission) {
            const byteVal = numeric(args[0]) & 0xFF;
            currentTransmission.data.push(byteVal);
          }
          return 1;
        }
        if (calleeStr === "Wire.endTransmission") {
          if (currentTransmission) {
            i2cTransactions.push({ address: currentTransmission.address, mode: "write", data: [...currentTransmission.data] });
            // Detect SSD1306 OLED (0x3C / 0x3D) text updates
            if (currentTransmission.address === 0x3C || currentTransmission.address === 0x3D) {
              const chars = currentTransmission.data.filter((b) => b >= 32 && b <= 126).map((b) => String.fromCharCode(b)).join("");
              if (chars) oledLines.push(chars);
            }
            currentTransmission = null;
          }
          return 0;
        }
        if (calleeStr === "Wire.requestFrom") {
          const addr = numeric(args[0]);
          const len = numeric(args[1] ?? 1);
          i2cTransactions.push({ address: addr, mode: "read", data: new Array(len).fill(0) });
          return len;
        }

        // EEPROM Non-Volatile Storage Shim
        if (calleeStr === "EEPROM.read") {
          const addr = numeric(args[0]) % 1024;
          return eeprom[addr] ?? 255;
        }
        if (calleeStr === "EEPROM.write" || calleeStr === "EEPROM.update") {
          const addr = numeric(args[0]) % 1024;
          const val = numeric(args[1]) & 0xFF;
          eeprom[addr] = val;
          return 0;
        }
        if (calleeStr === "EEPROM.length") return 1024;

        // ESP32 FreeRTOS Shim
        if (calleeStr === "xTaskCreatePinnedToCore" || calleeStr === "xTaskCreate") {
          const taskFnName = expr.args[0]?.kind === "identifier" ? expr.args[0].name : String(args[0]);
          const name = toString(args[1] ?? "Task");
          const priority = numeric(args[4] ?? 1);
          const core = calleeStr === "xTaskCreatePinnedToCore" ? numeric(args[6] ?? 0) : 0;
          freeRtosTasks.push({ name, core, priority, ticksRun: 0, fn: taskFnName });
          freeRtosLog.push({ tick: Math.round(elapsedMs), core, task: name, message: "Task created and pinned" });
          return 1; // pdPASS
        }
        if (calleeStr === "vTaskDelay") {
          const ticks = numeric(args[0] ?? 1);
          elapsedMs += ticks;
          return 0;
        }
        if (calleeStr === "pdMS_TO_TICKS") return numeric(args[0] ?? 0);
        if (calleeStr === "xPortGetCoreID") return 1;
        if (calleeStr === "xQueueCreate") {
          const capacity = Math.max(1, Math.min(32, numeric(args[0] ?? 4)));
          const qId = nextQueueId++;
          queues[qId] = { capacity, items: [] };
          return qId;
        }
        if (calleeStr === "xQueueSend") {
          const qId = numeric(args[0]);
          const val = args[1];
          const q = queues[qId];
          if (q) {
            if (q.items.length < q.capacity) {
              q.items.push(val);
              return 1; // pdTRUE
            }
            return 0; // errQUEUE_FULL
          }
          return 0;
        }
        if (calleeStr === "xQueueReceive") {
          const qId = numeric(args[0]);
          const q = queues[qId];
          if (q && q.items.length > 0) {
            const popped = q.items.shift();
            const targetExpr = expr.args[1]?.kind === "unary" && expr.args[1].operator === "&" ? expr.args[1].value : expr.args[1];
            if (targetExpr && targetExpr.kind === "identifier") {
              setVariable(targetExpr.name, popped ?? 0);
            }
            return 1; // pdTRUE
          }
          return 0; // pdFALSE
        }
        if (calleeStr === "uxQueueMessagesWaiting") {
          const qId = numeric(args[0]);
          return queues[qId]?.items.length ?? 0;
        }
        if (calleeStr === "xSemaphoreCreateMutex") return 1;
        if (calleeStr === "xSemaphoreTake" || calleeStr === "xSemaphoreGive") return 1;
        if (calleeStr === "vTaskDelete") return 0;

        // ESP32 Wi-Fi & MQTT Shim
        if (calleeStr === "WiFi.begin") return 0;
        if (calleeStr === "WiFi.status") return 3; // WL_CONNECTED
        if (calleeStr.endsWith(".setServer")) return 1;
        if (calleeStr.endsWith(".connect")) return 1;
        if (calleeStr.endsWith(".connected")) return 1;
        if (calleeStr.endsWith(".publish")) {
          const topic = toString(args[0]);
          const payload = toString(args[1]);
          mqttMessages.push({ topic, payload });
          return 1;
        }
        if (calleeStr.endsWith(".subscribe")) return 1;
        if (calleeStr.endsWith(".loop")) return 1;

        // Common C / Arduino Math Helpers
        if (calleeStr === "min") return Math.min(numeric(args[0]), numeric(args[1]));
        if (calleeStr === "max") return Math.max(numeric(args[0]), numeric(args[1]));
        if (calleeStr === "abs") return Math.abs(numeric(args[0]));
        if (calleeStr === "constrain") return Math.max(numeric(args[1]), Math.min(numeric(args[2]), numeric(args[0])));
        if (calleeStr === "map") {
          const x = numeric(args[0]), in_min = numeric(args[1]), in_max = numeric(args[2]), out_min = numeric(args[3]), out_max = numeric(args[4]);
          return Math.round(((x - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min);
        }
        if (calleeStr === "pow") return Math.pow(numeric(args[0]), numeric(args[1]));
        if (calleeStr === "sqrt") return Math.sqrt(numeric(args[0]));

        throw new Error(
          `Unsupported API “${calleeStr || "call"}”. Supported APIs include pinMode, digitalWrite/read, analogRead/write, attachInterrupt, tone, Servo, Wire, EEPROM, FreeRTOS tasks/queues, and MQTT.`
        );
      }
    }
  };

  const execute = (statement: Statement): void => {
    instructionBudget -= 1;
    if (instructionBudget < 0) {
      throw new Error("Sketch stopped after reaching the safe instruction limit.");
    }
    switch (statement.kind) {
      case "block":
        for (const child of statement.body) execute(child);
        break;
      case "declaration":
        setVariable(statement.name, statement.value ? evaluate(statement.value) : 0);
        break;
      case "expression":
        evaluate(statement.value);
        break;
      case "if":
        execute(truthy(evaluate(statement.condition)) ? statement.yes : statement.no ?? { kind: "block", body: [] });
        break;
      case "for": {
        if (statement.init) execute(statement.init);
        let turns = 0;
        while (!statement.condition || truthy(evaluate(statement.condition))) {
          if (++turns > 500) throw new Error("Loop stopped after 500 iterations.");
          execute(statement.body);
          if (statement.step) evaluate(statement.step);
        }
        break;
      }
      case "while": {
        let turns = 0;
        while (truthy(evaluate(statement.condition))) {
          if (++turns > 500) throw new Error("Loop stopped after 500 iterations.");
          execute(statement.body);
        }
        break;
      }
      case "return":
        // handled in call context
        break;
    }
  };

  // Run global variable declarations
  statements(globals).forEach(execute);

  // Run setup()
  if (functions.has("setup")) {
    statements(functions.get("setup")!.body).forEach(execute);
  }

  // Handle pulse trigger interrupt if specified in options or if button pressed on interrupt pin
  const triggerPin = options.pulseTriggerPin !== undefined ? String(options.pulseTriggerPin) : options.buttonPressed ? "2" : null;
  if (triggerPin && interrupts[triggerPin]) {
    const isr = interrupts[triggerPin];
    if (functions.has(isr.isr)) {
      isr.count += 1;
      callUserFunction(functions.get(isr.isr)!, []);
    }
  }

  // Run loop() cycles
  const cycles = Math.max(1, Math.min(20, Math.trunc(options.cycles ?? 4)));
  if (functions.has("loop")) {
    const loopStmts = statements(functions.get("loop")!.body);
    for (loopCycles = 0; loopCycles < cycles; loopCycles += 1) {
      loopStmts.forEach(execute);

      // If FreeRTOS background tasks exist, interleave a slice
      for (const t of freeRtosTasks) {
        if (functions.has(t.fn)) {
          t.ticksRun += 1;
          freeRtosLog.push({
            tick: Math.round(elapsedMs),
            core: t.core,
            task: t.name,
            message: `Executing task slice on Core ${t.core}`,
          });
          callUserFunction(functions.get(t.fn)!, [0]);
        }
      }
    }
  }

  const interruptEvents = Object.entries(interrupts).map(([pin, info]) => ({
    pin,
    isr: info.isr,
    count: info.count,
  }));

  return {
    digitalPins: digital,
    pwmPins: pwm,
    pinModes: modes,
    serial: serial.join("").slice(0, 8_000),
    elapsedMs,
    cycles: loopCycles,
    tone: activeTone,
    servos,
    i2cTransactions,
    oledLines,
    eeprom,
    interruptEvents,
    freeRtosTasks: freeRtosTasks.map(({ name, core, priority, ticksRun }) => ({ name, core, priority, ticksRun })),
    freeRtosLog,
    mqttMessages,
  };
}
