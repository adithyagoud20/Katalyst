import { describe, expect, it } from "vitest";
import { executionRegistry } from "../src/lib/execution/runner";
import { SqlWasmRunner, formatSqlResults } from "../src/lib/execution/sql-runner";
import { verifyExerciseSubmission } from "../src/lib/exercise-verifier";

describe("SqlWasmRunner & SQLite WebAssembly", () => {
  it("is registered in the ExecutionRegistry for language 'sql'", () => {
    const runner = executionRegistry.resolveRunner("sql", "browser-wasm");
    expect(runner).toBeDefined();
    expect(runner?.id).toBe("browser-sql-wasm");
  });

  it("executes a simple mathematical and string projection query", async () => {
    const runner = new SqlWasmRunner();
    const result = await runner.execute({
      language: "sql",
      files: [{ path: "query.sql", content: "SELECT 42 AS answer, 'KATALYST' AS platform;" }],
    });

    expect(result.ok).toBe(true);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("answer");
    expect(result.stdout).toContain("platform");
    expect(result.stdout).toContain("42");
    expect(result.stdout).toContain("KATALYST");
    expect(result.stdout).toContain("(1 row)");
  });

  it("executes deterministic stdin setup SQL schema and seed data", async () => {
    const runner = new SqlWasmRunner();
    const setupSql = `
      CREATE TABLE employees (id INT PRIMARY KEY, name TEXT, department TEXT, salary INT);
      INSERT INTO employees VALUES (1, 'Ada Lovelace', 'Engineering', 140000);
      INSERT INTO employees VALUES (2, 'Charles Babbage', 'Hardware', 120000);
      INSERT INTO employees VALUES (3, 'Grace Hopper', 'Engineering', 150000);
    `;
    const userQuery = `
      SELECT name, salary
      FROM employees
      WHERE department = 'Engineering'
      ORDER BY salary DESC;
    `;

    const result = await runner.execute({
      language: "sql",
      files: [{ path: "query.sql", content: userQuery }],
      stdin: setupSql,
    });

    expect(result.ok).toBe(true);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Grace Hopper");
    expect(result.stdout).toContain("Ada Lovelace");
    expect(result.stdout).not.toContain("Charles Babbage");
    expect(result.stdout).toContain("(2 rows)");
  });

  it("formats multi-column result sets into aligned monospace tables", () => {
    const sampleResults = [
      {
        columns: ["user_id", "email", "is_active"],
        values: [
          [1, "ada@example.com", 1],
          [202, "grace@navy.mil", 1],
          [9999, null, 0],
        ],
      },
    ];

    const formatted = formatSqlResults(sampleResults);
    expect(formatted).toContain("user_id");
    expect(formatted).toContain("email");
    expect(formatted).toContain("is_active");
    expect(formatted).toContain("---+");
    expect(formatted).toContain("NULL");
    expect(formatted).toContain("(3 rows)");
  });

  it("captures syntax errors and surfaces error message in stderr", async () => {
    const runner = new SqlWasmRunner();
    const result = await runner.execute({
      language: "sql",
      files: [{ path: "query.sql", content: "SELCT * FRM nowhere;" }],
    });

    expect(result.ok).toBe(false);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("syntax error");
  });

  it("verifies SQL exercise submissions using verifyExerciseSubmission with stdin schemas", async () => {
    const setupSchema = `
      CREATE TABLE orders (id INT, customer TEXT, amount REAL);
      INSERT INTO orders VALUES (1, 'Alice', 50.0);
      INSERT INTO orders VALUES (2, 'Bob', 150.0);
      INSERT INTO orders VALUES (3, 'Charlie', 200.0);
    `;

    const solutionCode = `
      SELECT customer, amount
      FROM orders
      WHERE amount > 100.0
      ORDER BY amount ASC;
    `;

    const report = await verifyExerciseSubmission({
      language: "sql",
      code: solutionCode,
      testCases: [
        {
          id: "tc-orders-filter",
          label: "Filter orders over 100",
          stdin: setupSchema,
          expectedStdout: "Bob",
          matchMode: "contains",
        },
        {
          id: "tc-orders-order",
          label: "Verify Charlie is present",
          stdin: setupSchema,
          expectedStdout: "Charlie",
          matchMode: "contains",
        },
      ],
    });

    expect(report.allPassed).toBe(true);
    expect(report.passedCount).toBe(2);
    expect(report.totalCount).toBe(2);
  });
});
