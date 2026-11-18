/**
 * A deliberately small, deterministic Arduino-style sketch interpreter.
 * It models a documented API subset in the browser and never evaluates user
 * source as JavaScript or accesses browser/server capabilities.
 */

type Token = { kind: "identifier" | "number" | "string" | "character" | "operator"; value: string };
type Value = number | string | boolean;
type Expr =
  | { kind: "literal"; value: Value }
  | { kind: "identifier"; name: string }
  | { kind: "member"; object: Expr; property: string }
  | { kind: "unary"; operator: string; value: Expr }
  | { kind: "postfix"; operator: string; value: Expr }
  | { kind: "binary"; operator: string; left: Expr; right: Expr }
  | { kind: "assignment"; operator: string; target: Expr; value: Expr }
  | { kind: "call"; callee: Expr; args: Expr[] };
type Statement =
  | { kind: "block"; body: Statement[] }
  | { kind: "declaration"; name: string; value?: Expr }
  | { kind: "expression"; value: Expr }
  | { kind: "if"; condition: Expr; yes: Statement; no?: Statement }
  | { kind: "for"; init?: Statement; condition?: Expr; step?: Expr; body: Statement }
  | { kind: "while"; condition: Expr; body: Statement };

const TYPE_WORDS = new Set(["int", "long", "short", "float", "double", "bool", "boolean", "byte", "char", "unsigned", "signed", "uint8_t", "uint16_t", "uint32_t", "size_t"]);
const PRECEDENCE: Record<string, number> = { "=": 1, "+=": 1, "-=": 1, "*=": 1, "/=": 1, "%=": 1, "||": 2, "&&": 3, "==": 4, "!=": 4, "<": 5, ">": 5, "<=": 5, ">=": 5, "+": 6, "-": 6, "*": 7, "/": 7, "%": 7 };

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < source.length) {
    const ch = source[i];
    if (/\s/.test(ch)) { i += 1; continue; }
    if (ch === "/" && source[i + 1] === "/") { i += 2; while (i < source.length && source[i] !== "\n") i += 1; continue; }
    if (ch === "/" && source[i + 1] === "*") { i += 2; while (i < source.length && !(source[i] === "*" && source[i + 1] === "/")) i += 1; i = Math.min(source.length, i + 2); continue; }
    if (ch === '"' || ch === "'") {
      const quote = ch;
      i += 1;
      let value = "";
      while (i < source.length && source[i] !== quote) {
        if (source[i] === "\\" && i + 1 < source.length) {
          const escaped = source[i + 1];
          value += escaped === "n" ? "\n" : escaped === "t" ? "\t" : escaped;
          i += 2;
        } else { value += source[i]; i += 1; }
      }
      if (source[i] !== quote) throw new Error("Unclosed string literal.");
      i += 1;
      tokens.push({ kind: quote === "'" ? "character" : "string", value });
      continue;
    }
    const number = source.slice(i).match(/^(?:0x[\da-f]+|(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)[fFlLuU]*/i)?.[0];
    if (number) { tokens.push({ kind: "number", value: number.replace(/[fFlLuU]+$/, "") }); i += number.length; continue; }
    const identifier = source.slice(i).match(/^[A-Za-z_$][\w$]*/)?.[0];
    if (identifier) { tokens.push({ kind: "identifier", value: identifier }); i += identifier.length; continue; }
    const operator = ["++", "--", "+=", "-=", "*=", "/=", "%=", "==", "!=", "<=", ">=", "&&", "||"].find((item) => source.startsWith(item, i));
    if (operator) { tokens.push({ kind: "operator", value: operator }); i += operator.length; continue; }
    if ("{}(),;.+-*/%=!<>".includes(ch)) { tokens.push({ kind: "operator", value: ch }); i += 1; continue; }
    // Preprocessor lines and C++ include paths are intentionally ignored.
    if (ch === "#") { while (i < source.length && source[i] !== "\n") i += 1; continue; }
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
    if (!token || (value !== undefined && token.value !== value)) throw new Error(`Expected “${value ?? "token"}” in sketch.`);
    this.index += 1;
    return token;
  }
  private match(value: string) { if (this.peek()?.value !== value) return false; this.index += 1; return true; }
  private isDeclaration() {
    let offset = 0;
    while (this.peek(offset)?.value === "const" || this.peek(offset)?.value === "volatile") offset += 1;
    if (this.peek(offset)?.value === "unsigned" || this.peek(offset)?.value === "signed") offset += 1;
    return TYPE_WORDS.has(this.peek(offset)?.value ?? "");
  }
  parseAll(): Statement[] { const statements: Statement[] = []; while (this.peek()) statements.push(this.statement()); return statements; }
  private statement(): Statement {
    if (this.match(";")) return { kind: "block", body: [] };
    if (this.match("{")) {
      const body: Statement[] = [];
      while (this.peek() && this.peek()?.value !== "}") body.push(this.statement());
      this.take("}");
      return { kind: "block", body };
    }
    if (this.match("if")) {
      this.take("("); const condition = this.expression(); this.take(")");
      const yes = this.statement();
      const no = this.match("else") ? this.statement() : undefined;
      return { kind: "if", condition, yes, no };
    }
    if (this.match("while")) {
      this.take("("); const condition = this.expression(); this.take(")");
      return { kind: "while", condition, body: this.statement() };
    }
    if (this.match("for")) {
      this.take("(");
      const init = this.peek()?.value === ";" ? undefined : this.forInitializer();
      this.take(";");
      const condition = this.peek()?.value === ";" ? undefined : this.expression();
      this.take(";");
      const step = this.peek()?.value === ")" ? undefined : this.expression();
      this.take(")");
      return { kind: "for", init, condition, step, body: this.statement() };
    }
    if (this.isDeclaration()) return this.declaration(true);
    const value = this.expression();
    this.match(";");
    return { kind: "expression", value };
  }
  private forInitializer(): Statement {
    if (this.isDeclaration()) return this.declaration(false);
    return { kind: "expression", value: this.expression() };
  }
  private declaration(withSemicolon: boolean): Statement {
    while (this.match("const") || this.match("volatile")) { /* qualifiers */ }
    if (this.match("unsigned") || this.match("signed")) { /* signedness */ }
    if (!TYPE_WORDS.has(this.peek()?.value ?? "")) throw new Error("Expected a supported variable type.");
    this.take();
    // Support `unsigned long` and `long int` without changing the modeled value type.
    if ((this.peek()?.value === "int" || this.peek()?.value === "long") && (this.tokens[this.index - 1]?.value === "unsigned" || this.tokens[this.index - 1]?.value === "long")) this.take();
    const name = this.take().value;
    const value = this.match("=") ? this.expression() : undefined;
    if (withSemicolon) this.match(";");
    return { kind: "declaration", name, value };
  }
  private expression(minPrecedence = 1): Expr {
    let left = this.prefix();
    while (this.peek()) {
      if (this.match(".")) { left = { kind: "member", object: left, property: this.take().value }; continue; }
      if (this.match("(")) {
        const args: Expr[] = [];
        if (!this.match(")")) { do { args.push(this.expression()); } while (this.match(",")); this.take(")"); }
        left = { kind: "call", callee: left, args };
        continue;
      }
      if (this.peek()?.value === "++" || this.peek()?.value === "--") { left = { kind: "postfix", operator: this.take().value, value: left }; continue; }
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
    if (["!", "-", "+", "++", "--"].includes(token.value)) { this.take(); return { kind: "unary", operator: token.value, value: this.prefix() }; }
    if (this.match("(")) { const value = this.expression(); this.take(")"); return value; }
    this.take();
    if (token.kind === "number") return { kind: "literal", value: token.value.toLowerCase().startsWith("0x") ? parseInt(token.value, 16) : Number(token.value) };
    if (token.kind === "string") return { kind: "literal", value: token.value };
    if (token.kind === "character") return { kind: "literal", value: token.value.codePointAt(0) ?? 0 };
    if (token.value === "true") return { kind: "literal", value: true };
    if (token.value === "false") return { kind: "literal", value: false };
    return { kind: "identifier", name: token.value };
  }
}

function extractFunctions(tokens: Token[]) {
  const functions = new Map<string, Token[]>();
  const removed = new Set<number>();
  for (let i = 0; i < tokens.length - 3; i += 1) {
    const name = tokens[i].value;
    if (name !== "setup" && name !== "loop") continue;
    if (tokens[i + 1]?.value !== "(" || tokens[i + 2]?.value !== ")" || tokens[i + 3]?.value !== "{") continue;
    let depth = 1; let end = i + 4;
    while (end < tokens.length && depth > 0) { if (tokens[end].value === "{") depth += 1; if (tokens[end].value === "}") depth -= 1; end += 1; }
    if (depth !== 0) throw new Error(`Unclosed ${name}() block.`);
    functions.set(name, tokens.slice(i + 4, end - 1));
    const functionStart = tokens[i - 1]?.value === "void" ? i - 1 : i;
    for (let j = functionStart; j < end; j += 1) removed.add(j);
    i = end - 1;
  }
  return { functions, globals: tokens.filter((_, index) => !removed.has(index)) };
}

export interface HardwareSketchOptions {
  target: "arduino" | "esp32";
  analogValue: number;
  buttonPressed: boolean;
  serialInput?: string;
  cycles?: number;
}
export interface HardwareSketchResult {
  digitalPins: Record<string, number>;
  pwmPins: Record<string, number>;
  pinModes: Record<string, string>;
  serial: string;
  elapsedMs: number;
  cycles: number;
}

export type HardwareSketchPreset = "blink" | "button" | "sensor" | "pwm";

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
  if (source.length > 12_000) throw new Error("Sketch is over the 12,000 character limit.");
  const cleaned = source.split("\n").filter((line) => !/^\s*#\s*include\b/.test(line)).join("\n");
  const { functions, globals } = extractFunctions(tokenize(cleaned));
  if (!functions.has("setup") && !functions.has("loop")) throw new Error("Add a setup() or loop() function to run this sketch.");
  const statements = (tokens: Token[]) => new Parser(tokens).parseAll();
  const env: Record<string, Value> = {
    HIGH: 1, LOW: 0, OUTPUT: 1, INPUT: 0, INPUT_PULLUP: 2, LED_BUILTIN: options.target === "arduino" ? 13 : 2,
    A0: options.target === "arduino" ? 14 : 34, true: true, false: false,
  };
  const modes: Record<string, string> = {};
  const digital: Record<string, number> = {};
  const pwm: Record<string, number> = {};
  const serial: string[] = [];
  const serialInput = (options.serialInput ?? "").slice(0, 256);
  let serialCursor = 0;
  let elapsedMs = 0;
  let instructionBudget = 10_000;
  let loopCycles = 0;
  const clampPin = (value: Value) => String(Math.max(0, Math.min(63, Math.trunc(Number(value) || 0))));
  const truthy = (value: Value) => Boolean(value);
  const numeric = (value: Value) => typeof value === "boolean" ? Number(value) : Number(value);
  const toString = (value: Value) => typeof value === "boolean" ? (value ? "1" : "0") : String(value);
  const setVariable = (name: string, value: Value) => { env[name] = value; return value; };

  const evaluate = (expr: Expr): Value => {
    switch (expr.kind) {
      case "literal": return expr.value;
      case "identifier": return env[expr.name] ?? 0;
      case "member": return `${expr.object.kind === "identifier" ? expr.object.name : ""}.${expr.property}`;
      case "unary": {
        if (expr.operator === "++" || expr.operator === "--") {
          if (expr.value.kind !== "identifier") throw new Error("Increment only supports simple variables.");
          const next = numeric(env[expr.value.name] ?? 0) + (expr.operator === "++" ? 1 : -1);
          return setVariable(expr.value.name, next);
        }
        const value = evaluate(expr.value);
        return expr.operator === "!" ? !truthy(value) : expr.operator === "-" ? -numeric(value) : numeric(value);
      }
      case "postfix": {
        if (expr.value.kind !== "identifier") throw new Error("Increment only supports simple variables.");
        const previous = numeric(env[expr.value.name] ?? 0);
        setVariable(expr.value.name, previous + (expr.operator === "++" ? 1 : -1));
        return previous;
      }
      case "assignment": {
        if (expr.target.kind !== "identifier") throw new Error("Assignment only supports simple variables.");
        const right = evaluate(expr.value);
        if (expr.operator === "=") return setVariable(expr.target.name, right);
        const current = numeric(env[expr.target.name] ?? 0); const next = numeric(right);
        const result = expr.operator === "+=" ? current + next : expr.operator === "-=" ? current - next : expr.operator === "*=" ? current * next : expr.operator === "/=" ? current / next : current % next;
        return setVariable(expr.target.name, result);
      }
      case "binary": {
        const left = evaluate(expr.left);
        if (expr.operator === "&&" && !truthy(left)) return false;
        if (expr.operator === "||" && truthy(left)) return true;
        const right = evaluate(expr.right);
        const a = numeric(left); const b = numeric(right);
        switch (expr.operator) {
          case "+": return typeof left === "string" || typeof right === "string" ? toString(left) + toString(right) : a + b;
          case "-": return a - b; case "*": return a * b; case "/": if (b === 0) throw new Error("Division by zero in sketch."); return a / b;
          case "%": if (b === 0) throw new Error("Division by zero in sketch."); return a % b;
          case "<": return a < b; case ">": return a > b; case "<=": return a <= b; case ">=": return a >= b;
          case "==": return left === right || a === b; case "!=": return !(left === right || a === b);
          case "&&": return truthy(left) && truthy(right); case "||": return truthy(left) || truthy(right);
          default: return 0;
        }
      }
      case "call": {
        const args = expr.args.map(evaluate);
        const name = expr.callee.kind === "identifier" ? expr.callee.name : expr.callee.kind === "member" ? `${expr.callee.object.kind === "identifier" ? expr.callee.object.name : ""}.${expr.callee.property}` : "";
        const pin = clampPin(args[0] ?? 0);
        switch (name) {
          case "pinMode": modes[pin] = args[1] === 2 ? "INPUT_PULLUP" : args[1] === 0 ? "INPUT" : "OUTPUT"; return 0;
          case "digitalWrite": digital[pin] = numeric(args[1] ?? 0) ? 1 : 0; return 0;
          case "digitalRead": {
            const mode = modes[pin];
            if (mode === "INPUT_PULLUP") return options.buttonPressed ? 0 : 1;
            if (mode === "INPUT") return options.buttonPressed ? 1 : 0;
            return digital[pin] ?? 0;
          }
          case "analogRead": return Math.max(0, Math.min(options.target === "arduino" ? 1023 : 4095, Math.round(options.analogValue)));
          case "analogWrite": pwm[pin] = Math.max(0, Math.min(255, numeric(args[1] ?? 0))); digital[pin] = pwm[pin] > 0 ? 1 : 0; return 0;
          case "ledcAttach": case "ledcAttachChannel": return 1;
          case "ledcWrite": pwm[pin] = Math.max(0, Math.min(255, numeric(args[1] ?? 0))); digital[pin] = pwm[pin] > 0 ? 1 : 0; return 0;
          case "delay": elapsedMs = Math.min(60_000, elapsedMs + Math.max(0, Math.min(10_000, numeric(args[0] ?? 0)))); return 0;
          case "delayMicroseconds": elapsedMs = Math.min(60_000, elapsedMs + Math.max(0, numeric(args[0] ?? 0)) / 1000); return 0;
          case "millis": return elapsedMs;
          case "Serial.begin": return 0;
          case "Serial.print": serial.push(toString(args[0] ?? "")); return 0;
          case "Serial.println": serial.push(`${toString(args[0] ?? "")}\n`); return 0;
          case "Serial.available": return serialInput.length - serialCursor;
          case "Serial.read": return serialCursor < serialInput.length ? serialInput.charCodeAt(serialCursor++) : -1;
          default: throw new Error(`Unsupported API “${name || "call"}”. Supported calls include pinMode, digitalWrite/read, analogRead/write, ledcWrite, delay, millis, and Serial begin/available/read/print functions.`);
        }
      }
    }
  };

  const execute = (statement: Statement): void => {
    instructionBudget -= 1;
    if (instructionBudget < 0) throw new Error("Sketch stopped after reaching the safe instruction limit.");
    switch (statement.kind) {
      case "block": for (const child of statement.body) execute(child); break;
      case "declaration": setVariable(statement.name, statement.value ? evaluate(statement.value) : 0); break;
      case "expression": evaluate(statement.value); break;
      case "if": execute(truthy(evaluate(statement.condition)) ? statement.yes : statement.no ?? { kind: "block", body: [] }); break;
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
    }
  };

  statements(globals).forEach(execute);
  if (functions.has("setup")) statements(functions.get("setup")!).forEach(execute);
  const cycles = Math.max(1, Math.min(20, Math.trunc(options.cycles ?? 4)));
  if (functions.has("loop")) {
    const loop = statements(functions.get("loop")!);
    for (loopCycles = 0; loopCycles < cycles; loopCycles += 1) loop.forEach(execute);
  }
  return { digitalPins: digital, pwmPins: pwm, pinModes: modes, serial: serial.join("").slice(0, 8_000), elapsedMs, cycles: loopCycles };
}
