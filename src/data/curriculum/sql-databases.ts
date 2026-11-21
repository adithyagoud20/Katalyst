import type {
  ExerciseTestCase,
  LearningCheckpoint,
  LearningCourse,
  LearningDifficulty,
  LearningExampleRun,
  LearningExercise,
  LearningLesson,
  LearningModule,
  LearningObjective,
  LearningSubject,
} from "@/lib/learning-curriculum";

export const sqlDatabasesSubject: LearningSubject = {
  id: "databases-sql",
  title: "Relational Databases & SQL",
  description: "Relational data modeling, schema definition, SQL queries, multi-table joins, aggregations, CTEs, and transactional ACID guarantees.",
};

export const sqlDatabasesObjectives: LearningObjective[] = [
  { id: "sql-ddl-types", title: "Define relational schemas with primary keys, unique constraints, and strict data types in SQLite." },
  { id: "sql-where-predicates", title: "Filter tabular datasets using WHERE predicates, boolean logic (AND/OR/NOT), and NULL checks." },
  { id: "sql-order-limit", title: "Sort query results deterministically with ORDER BY and manage pagination using LIMIT and OFFSET." },
  { id: "sql-aggregates-grouping", title: "Compute summary statistics using COUNT, SUM, AVG, and filter grouped records using HAVING." },
  { id: "sql-joins-relational", title: "Combine records across relational tables using INNER JOIN and enforce foreign key integrity." },
  { id: "sql-outer-joins-set", title: "Retrieve unmatched records using LEFT OUTER JOIN and combine query streams with UNION." },
  { id: "sql-ctes-subqueries", title: "Structure complex hierarchical queries using Common Table Expressions (WITH syntax) and subqueries." },
  { id: "sql-transactions-acid", title: "Execute atomic data mutations using INSERT, UPDATE, and DELETE enclosed in ACID transactions." },
  { id: "sql-btree-indexes", title: "Accelerate query execution times by creating B-Tree indexes on high-cardinality columns." },
  { id: "sql-explain-plans", title: "Analyze query execution plans using EXPLAIN QUERY PLAN to detect full table scans." },
  { id: "sql-window-analytics", title: "Compute running totals and rankings using SQL window functions (OVER, PARTITION BY)." },
  { id: "sql-capstone-optimization", title: "Synthesize relational schema design, indexing, and window analytics in a database capstone." },
];

function exercise(
  id: string,
  title: string,
  prompt: string,
  solution: string,
  objectiveId: string,
  expectedOutcome: string,
  hints: string[],
  difficulty: LearningDifficulty = "Beginner",
  starterCode?: string,
  testCases?: ExerciseTestCase[],
): LearningExercise {
  return {
    id,
    title,
    prompt,
    solution,
    objectiveId,
    expectedOutcome,
    hints,
    hint: hints[0],
    difficulty,
    ...(starterCode ? { starterCode } : {}),
    ...(testCases ? { testCases } : {}),
  };
}

function checkpoint(prompt: string, answer: string): LearningCheckpoint {
  return { prompt, answer };
}

function exampleRun(expectedOutput: string, sampleInput?: string): LearningExampleRun {
  return { expectedOutput, ...(sampleInput !== undefined ? { sampleInput } : {}) };
}

function moduleData(
  id: string,
  order: number,
  title: string,
  summary: string,
  lessons: LearningLesson[],
): LearningModule {
  return { id, order, title, summary, lessons };
}

export const sqlDatabasesLessons: LearningLesson[] = [
  // Module 1: Relational Foundations & DDL
  {
    id: "sql-relational-tables",
    order: 1,
    title: "Relational Schemas, Tables, and Data Types",
    summary: "Master core concepts and hands-on engineering techniques for relational schemas, tables, and data types.",
    type: "guided-coding",
    objectiveIds: ["sql-ddl-types"],
    prerequisiteLessonIds: [],
    estimatedDurationMinutes: 25,
    content: `Relational databases organize information into **relations** (tables) consisting of **attributes** (columns) and **tuples** (rows). Every row represents a unique entity identified by a **Primary Key**.

In SQLite, the primary storage classes are:
- \`INTEGER\`: Signed integers (1, 2, 3, 4, 6, or 8 bytes depending on magnitude).
- \`REAL\`: 8-byte IEEE floating-point numbers.
- \`TEXT\`: UTF-8 encoded text strings.
- \`BLOB\`: Binary Large Object stored exactly as input.
- \`NULL\`: Absence of a value.

### Data Definition Language (DDL)
We declare schemas using \`CREATE TABLE\`:
\`\`\`sql
CREATE TABLE servers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hostname TEXT NOT NULL UNIQUE,
  ip_address TEXT NOT NULL,
  memory_gb INTEGER NOT NULL CHECK (memory_gb > 0),
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);
\`\`\`

Constraints guarantee relational invariants:
1. \`PRIMARY KEY\`: Uniquely identifies each record and generates an underlying B-tree index.
2. \`NOT NULL\`: Prevents missing data for essential fields.
3. \`UNIQUE\`: Enforces column distinctness across all rows.
4. \`CHECK\`: Validates runtime business conditions before permitting write operations.`,
    theorySections: [
      {
        title: "Relational Integrity Constraints",
        id: "sql-databases-sec-1",
        content: `Software applications often fail when data assumptions are violated. Relying exclusively on application-level checks allows race conditions and malformed writes. Defining constraints inside the database schema guarantees that invalid states can never be committed.

In SQLite, \`INTEGER PRIMARY KEY\` is an alias for the 64-bit signed integer \`rowid\`, which provides $O(\\log N)$ lookup performance via the primary B-tree.`,
      },
      {
        title: "SQLite Type Affinity Mechanism",
        id: "sql-databases-sec-2",
        content: `Unlike strict SQL engines (e.g. PostgreSQL), SQLite uses type affinity. When a column is declared as \`INTEGER\`, SQLite attempts to convert incoming text or real values into integers before storing them. Declaring columns with explicit types ensures predictable sorting and indexing behavior.`,
      },
    ],
    codeExamples: [
      {
        title: "Defining an Inventory Table",
        description: "Creates an equipment inventory table with primary keys and constraints.",
        code: `CREATE TABLE equipment (
  serial_number TEXT PRIMARY KEY,
  model_name TEXT NOT NULL,
  unit_cost REAL NOT NULL CHECK (unit_cost >= 0.0),
  stock_count INTEGER DEFAULT 0
);

INSERT INTO equipment VALUES ('SN-1001', 'Core Router X1', 1249.50, 4);
SELECT * FROM equipment;`,
        language: "sql",
      },
    ],
    exercise: exercise(
      "ex-sql-relational-tables",
      "Create the Microservices Table",
      "Write a SQL statement to create a table named `microservices` with `id INTEGER PRIMARY KEY`, `name TEXT NOT NULL UNIQUE`, and `port INTEGER NOT NULL CHECK (port > 1024)`. Then insert one row with id 1, name 'auth-service', and port 8080. Finally, select all records from `microservices`.",
      `CREATE TABLE microservices (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  port INTEGER NOT NULL CHECK (port > 1024)
);

INSERT INTO microservices (id, name, port) VALUES (1, 'auth-service', 8080);
SELECT * FROM microservices;`,
      "sql-ddl-types",
      "Table created with constraints, sample row inserted, and selected.",
      [
        "Use CREATE TABLE microservices (id INTEGER PRIMARY KEY, ...);",
        "Enforce CHECK (port > 1024) on the port column.",
        "End with SELECT * FROM microservices;",
      ],
      "Beginner",
      `-- Create the microservices table with constraints
CREATE TABLE microservices (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  port INTEGER NOT NULL CHECK (port > 1024)
);

-- Insert sample service
INSERT INTO microservices (id, name, port) VALUES (1, 'auth-service', 8080);

-- Query the table
SELECT * FROM microservices;`,
      [
        {
          id: "tc-sql-ddl-1",
          label: "Microservices table exists with id 1 and port 8080",
          stdin: "",
          expectedStdout: "auth-service",

          matchMode: "contains",
        },
      ],
    ),
    checkpoint: checkpoint(
      "What is the role of an INTEGER PRIMARY KEY in SQLite?",
      "It serves as a direct alias for the internal 64-bit rowid, providing unique entity identification and fast B-tree search.",
    ),
    exampleRun: exampleRun("1|auth-service|8080"),
  },
  {
    id: "sql-select-filtering",
    order: 2,
    title: "SELECT Queries, WHERE Predicates, and NULL Handling",
    summary: "Master core concepts and hands-on engineering techniques for select queries, where predicates, and null handling.",
    type: "guided-coding",
    objectiveIds: ["sql-where-predicates"],
    prerequisiteLessonIds: ["sql-relational-tables"],
    estimatedDurationMinutes: 25,
    content: `The \`SELECT\` statement is the fundamental mechanism for querying tabular data. It projects specific columns and filters rows using the \`WHERE\` clause.

\`\`\`sql
SELECT hostname, memory_gb 
FROM servers 
WHERE is_active = 1 AND memory_gb >= 16;
\`\`\`

### Three-Valued Logic & NULL
In SQL, \`NULL\` represents missing or unknown information. Comparisons with \`NULL\` yield \`UNKNOWN\`, not \`TRUE\` or \`FALSE\`:
- \`value = NULL\` is **never true**!
- Always use \`IS NULL\` or \`IS NOT NULL\` to evaluate missing attributes.

### Logical Operators
- \`AND\`: Both conditions must evaluate to true.
- \`OR\`: At least one condition evaluates to true.
- \`BETWEEN a AND b\`: Inclusive range check ($a \\le x \\le b$).
- \`IN (v1, v2, ...)\`: Membership testing against a discrete value set.`,
    theorySections: [
      {
        title: "Three-Valued Logic in Relational Algebra",
        id: "sql-databases-sec-3",
        content: `Relational algebra treats NULL as unknown. Because NULL represents an absent value, two NULLs cannot be judged equal. Consequently, WHERE column = NULL produces UNKNOWN, which the WHERE clause filters out. This makes IS NULL mandatory for detecting missing entries.`,
      },
      {
        title: "Predicate Pushdown & Query Optimizer",
        id: "sql-databases-sec-4",
        content: `When a query executes, the SQLite query planner evaluates the WHERE predicates. When an index exists on the filtered columns, the engine conducts a logarithmic B-tree search rather than scanning all rows, minimizing I/O overhead.`,
      },
    ],
    codeExamples: [
      {
        title: "Filtering Users by Region and Status",
        description: "Selects active users in North America with verified emails.",
        code: `SELECT user_id, email 
FROM users 
WHERE status = 'ACTIVE' 
  AND country_code IN ('US', 'CA', 'MX') 
  AND verified_at IS NOT NULL;`,
        language: "sql",
      },
    ],
    exercise: exercise(
      "ex-sql-select-filtering",
      "Filter Active High-Memory Nodes",
      "Given the pre-seeded `nodes` table, select the `hostname` and `ram_mb` of all nodes that are active (`status = 'online'`) and have at least 8192 MB of RAM (`ram_mb >= 8192`).",
      `SELECT hostname, ram_mb FROM nodes WHERE status = 'online' AND ram_mb >= 8192;`,
      "sql-where-predicates",
      "Filtered online nodes with >= 8192 MB of RAM.",
      [
        "Use SELECT hostname, ram_mb FROM nodes",
        "Add WHERE status = 'online' AND ram_mb >= 8192;",
      ],
      "Beginner",
      `-- Schema is pre-seeded in stdin.
-- Write a query to select hostname and ram_mb for online nodes with >= 8192 MB RAM:
SELECT hostname, ram_mb 
FROM nodes 
WHERE status = 'online' AND ram_mb >= 8192;`,
      [
        {
          id: "tc-sql-filter-1",
          label: "Returns only online nodes with >= 8192 MB RAM",
          stdin: `CREATE TABLE nodes (hostname TEXT, status TEXT, ram_mb INTEGER);
INSERT INTO nodes VALUES ('node-alpha', 'online', 16384), ('node-beta', 'offline', 32768), ('node-gamma', 'online', 4096), ('node-delta', 'online', 8192);`,
          expectedStdout: "node-alpha",

          matchMode: "contains",
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why is expression 'col = NULL' always invalid for detecting NULL values?",
      "Comparisons with NULL yield UNKNOWN under three-valued logic; you must use 'col IS NULL'.",
    ),
    exampleRun: exampleRun("node-alpha|16384\nnode-delta|8192"),
  },
  {
    id: "sql-ordering-pagination",
    order: 3,
    title: "ORDER BY Sorting and LIMIT/OFFSET Pagination",
    summary: "Master core concepts and hands-on engineering techniques for order by sorting and limit/offset pagination.",
    type: "guided-coding",
    objectiveIds: ["sql-order-limit"],
    prerequisiteLessonIds: ["sql-select-filtering"],
    estimatedDurationMinutes: 20,
    content: `Relational tables represent unordered sets of rows. Unless an explicit \`ORDER BY\` clause is specified, a SQL database makes **no guarantee** regarding row order.

### Sorting Syntax
\`\`\`sql
SELECT title, price, release_year
FROM books
ORDER BY release_year DESC, price ASC;
\`\`\`
1. Rows are first sorted by \`release_year\` descending (newest first).
2. Ties in release year are broken by \`price\` ascending (cheapest first).

### Deterministic Pagination
Pagination extracts fixed-size page windows using \`LIMIT\` and \`OFFSET\`:
\`\`\`sql
-- Page 1: Items 1 through 10
SELECT * FROM products ORDER BY id ASC LIMIT 10 OFFSET 0;

-- Page 2: Items 11 through 20
SELECT * FROM products ORDER BY id ASC LIMIT 10 OFFSET 10;
\`\`\`
To avoid duplicate or omitted rows across pages, the ordering criteria must be strictly deterministic (typically by including the primary key as the final tiebreaker).`,
    theorySections: [
      {
        title: "Offset vs Keysets in Pagination",
        id: "sql-databases-sec-5",
        content: `Using high OFFSET values (e.g. OFFSET 1000000) forces the database to read and discard one million rows before returning results. In production systems, keyset pagination (WHERE id > last_seen_id ORDER BY id LIMIT 10) provides constant $O(1)$ seek time.`,
      },
      {
        title: "Collation and Lexicographical Sorting",
        id: "sql-databases-sec-6",
        content: `Text columns sort according to collation sequences. SQLite defaults to BINARY collation (case-sensitive byte comparison). Using COLLATE NOCASE enables case-insensitive alphabetical ordering.`,
      },
    ],
    codeExamples: [
      {
        title: "Top 5 Most Expensive Inventory Items",
        description: "Sorts items by unit price descending and limits output to 5 items.",
        code: `SELECT item_name, unit_price 
FROM warehouse 
ORDER BY unit_price DESC 
LIMIT 5;`,
        language: "sql",
      },
    ],
    exercise: exercise(
      "ex-sql-ordering-pagination",
      "Page the Top CPU Users",
      "Query the `processes` table to find the top 3 processes consuming the most CPU (`cpu_percent` in descending order). In the event of a tie, sort by `pid` ascending. Select `pid`, `name`, and `cpu_percent`.",
      `SELECT pid, name, cpu_percent FROM processes ORDER BY cpu_percent DESC, pid ASC LIMIT 3;`,
      "sql-order-limit",
      "Selected top 3 processes by cpu_percent desc and pid asc.",
      [
        "Use ORDER BY cpu_percent DESC, pid ASC",
        "Add LIMIT 3 to return only 3 records.",
      ],
      "Beginner",
      `-- Query the top 3 processes sorted by cpu_percent DESC, then pid ASC:
SELECT pid, name, cpu_percent
FROM processes
ORDER BY cpu_percent DESC, pid ASC
LIMIT 3;`,
      [
        {
          id: "tc-sql-order-1",
          label: "Top 3 CPU processes correctly ordered",
          stdin: `CREATE TABLE processes (pid INTEGER, name TEXT, cpu_percent REAL);
INSERT INTO processes VALUES (101, 'nginx', 12.5), (102, 'postgres', 45.2), (103, 'redis', 3.1), (104, 'backup', 45.2), (105, 'compiler', 88.0);`,
          expectedStdout: "compiler",

          matchMode: "contains",
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why must queries intended for pagination use deterministic ORDER BY clauses?",
      "Without deterministic ordering, identical queries can return rows in arbitrary order, causing duplicate or missing records between pages.",
    ),
    exampleRun: exampleRun("105|compiler|88\n102|postgres|45.2\n104|backup|45.2"),
  },

  // Module 2: Aggregations & Relational Joins
  {
    id: "sql-aggregate-groupby",
    order: 4,
    title: "Aggregate Functions and GROUP BY Summaries",
    summary: "Master core concepts and hands-on engineering techniques for aggregate functions and group by summaries.",
    type: "guided-coding",
    objectiveIds: ["sql-aggregates-grouping"],
    prerequisiteLessonIds: ["sql-ordering-pagination"],
    estimatedDurationMinutes: 30,
    content: `Aggregate functions collapse multiple input rows into a single summary value.

### Standard Aggregate Functions
- \`COUNT(*)\`: Total number of matching rows.
- \`COUNT(column)\`: Number of non-NULL values in the column.
- \`SUM(column)\`: Arithmetic sum of numeric values.
- \`AVG(column)\`: Arithmetic mean.
- \`MIN(column)\` / \`MAX(column)\`: Minimum / maximum value.

### Partitioning with GROUP BY
\`\`\`sql
SELECT department, COUNT(*) AS emp_count, AVG(salary) AS avg_sal
FROM employees
GROUP BY department;
\`\`\`

### Filtering Groups: WHERE vs. HAVING
- \`WHERE\`: Filters individual rows **before** aggregation occurs.
- \`HAVING\`: Filters aggregated groups **after** calculation.
\`\`\`sql
SELECT department, AVG(salary) AS avg_sal
FROM employees
WHERE is_active = 1
GROUP BY department
HAVING AVG(salary) > 85000;
\`\`\``,
    theorySections: [
      {
        title: "Execution Order of SQL Queries",
        id: "sql-databases-sec-7",
        content: `SQL queries are not executed in top-to-bottom textual order. The logical execution order is:
1. FROM / JOIN: Resolves source tables and Cartesian products.
2. WHERE: Filters individual input rows.
3. GROUP BY: Groups remaining rows into partition buckets.
4. HAVING: Discards groups failing aggregate predicates.
5. SELECT: Evaluates expressions, aliases, and aggregates.
6. DISTINCT: Eliminates duplicate projection rows.
7. ORDER BY: Sorts the final result set.
8. LIMIT / OFFSET: Truncates output window.`,
      },
      {
        title: "COUNT(*) vs COUNT(column)",
        id: "sql-databases-sec-8",
        content: `COUNT(*) counts all physical rows matching the query, regardless of column contents. COUNT(column) evaluates the column expression for every row and skips rows where the value is NULL. COUNT(*) is typically faster as the database engine can satisfy it using index metadata.`,
      },
    ],
    codeExamples: [
      {
        title: "Regional Sales Summary",
        description: "Calculates total orders and revenue per geographic region.",
        code: `SELECT region, COUNT(order_id) AS total_orders, SUM(amount) AS total_revenue
FROM sales
GROUP BY region
HAVING SUM(amount) >= 10000.0
ORDER BY total_revenue DESC;`,
        language: "sql",
      },
    ],
    exercise: exercise(
      "ex-sql-aggregate-groupby",
      "Department Salary Analysis",
      "From the `staff` table, write a query to output each `dept` along with the number of employees (`emp_count`) and average salary (`avg_salary` rounded to 2 decimal places using `ROUND(AVG(salary), 2)`). Only include departments with at least 2 employees (`COUNT(*) >= 2`). Sort by `avg_salary` descending.",
      `SELECT dept, COUNT(*) AS emp_count, ROUND(AVG(salary), 2) AS avg_salary FROM staff GROUP BY dept HAVING COUNT(*) >= 2 ORDER BY avg_salary DESC;`,
      "sql-aggregates-grouping",
      "Summarized departments with >= 2 staff members.",
      [
        "Use GROUP BY dept",
        "Add HAVING COUNT(*) >= 2",
        "Order by avg_salary DESC",
      ],
      "Developing",
      `-- Summarize staff departments with at least 2 employees:
SELECT 
  dept, 
  COUNT(*) AS emp_count, 
  ROUND(AVG(salary), 2) AS avg_salary
FROM staff
GROUP BY dept
HAVING COUNT(*) >= 2
ORDER BY avg_salary DESC;`,
      [
        {
          id: "tc-sql-agg-1",
          label: "Calculates correct department aggregates",
          stdin: `CREATE TABLE staff (id INTEGER, dept TEXT, salary REAL);
INSERT INTO staff VALUES (1, 'Engineering', 120000), (2, 'Engineering', 140000), (3, 'Marketing', 80000), (4, 'Marketing', 90000), (5, 'HR', 75000);`,
          expectedStdout: "Engineering",

          matchMode: "contains",
        },
      ],
    ),
    checkpoint: checkpoint(
      "What is the fundamental distinction between WHERE and HAVING clauses?",
      "WHERE filters individual rows prior to grouping, while HAVING filters aggregate groups after computation.",
    ),
    exampleRun: exampleRun("Engineering|2|130000\nMarketing|2|85000"),
  },
  {
    id: "sql-inner-joins",
    order: 5,
    title: "Relational Modeling and INNER JOIN Operations",
    summary: "Master core concepts and hands-on engineering techniques for relational modeling and inner join operations.",
    type: "guided-coding",
    objectiveIds: ["sql-joins-relational"],
    prerequisiteLessonIds: ["sql-aggregate-groupby"],
    estimatedDurationMinutes: 30,
    content: `Relational normalization splits data across multiple dedicated tables to eliminate redundancy and update anomalies. Tables are connected via **Foreign Keys** that reference primary keys in related tables.

### INNER JOIN Syntax
An \`INNER JOIN\` matches rows from two tables whenever the join condition evaluates to true:
\`\`\`sql
SELECT orders.order_id, customers.name, orders.total_amount
FROM orders
INNER JOIN customers ON orders.customer_id = customers.customer_id;
\`\`\`
Rows in either table that do not satisfy the \`ON\` predicate are excluded from the result set.

### Multi-Table Joins
Complex schemas chain multiple joins:
\`\`\`sql
SELECT u.username, r.role_name, p.permission_key
FROM users u
INNER JOIN user_roles ur ON u.id = ur.user_id
INNER JOIN roles r ON ur.role_id = r.id
INNER JOIN role_permissions rp ON r.id = rp.role_id
INNER JOIN permissions p ON rp.permission_id = p.id;
\`\`\``,
    theorySections: [
      {
        title: "Join Algorithms: Nested Loop vs Hash Joins",
        id: "sql-databases-sec-9",
        content: `Relational engines employ several algorithms:
- Nested Loop Join: For each row in the outer table, scans the inner table. When the inner column is indexed, this runs in $O(N \\log M)$ time.
- Hash Join: Builds an in-memory hash table of the smaller relation, then probes it with rows from the second relation in $O(N + M)$ time.
SQLite primarily utilizes indexed nested loop joins.`,
      },
      {
        title: "Referential Integrity and Foreign Keys",
        id: "sql-databases-sec-10",
        content: `Foreign keys guarantee that dependent child records cannot point to non-existent parent records. SQLite supports ON DELETE CASCADE, which automatically deletes dependent child rows when a referenced parent record is removed.`,
      },
    ],
    codeExamples: [
      {
        title: "Joining Authors and Books",
        description: "Retrieves book titles alongside author names using an inner join.",
        code: `SELECT b.isbn, b.title, a.full_name
FROM books b
INNER JOIN authors a ON b.author_id = a.author_id
ORDER BY a.full_name ASC;`,
        language: "sql",
      },
    ],
    exercise: exercise(
      "ex-sql-inner-joins",
      "Query User Project Assignments",
      "Write a query joining the `developers` and `projects` tables on `developers.project_id = projects.id`. Select `developers.name AS developer_name` and `projects.title AS project_title`. Sort the output by `developer_name` ascending.",
      `SELECT developers.name AS developer_name, projects.title AS project_title FROM developers INNER JOIN projects ON developers.project_id = projects.id ORDER BY developer_name ASC;`,
      "sql-joins-relational",
      "Joined developers with their corresponding projects.",
      [
        "Use SELECT developers.name AS developer_name, projects.title AS project_title",
        "Add INNER JOIN projects ON developers.project_id = projects.id",
        "Sort by developer_name ASC",
      ],
      "Developing",
      `-- Join developers with projects on project_id:
SELECT 
  developers.name AS developer_name, 
  projects.title AS project_title
FROM developers
INNER JOIN projects ON developers.project_id = projects.id
ORDER BY developer_name ASC;`,
      [
        {
          id: "tc-sql-join-1",
          label: "Correctly joins developers with projects",
          stdin: `CREATE TABLE projects (id INTEGER PRIMARY KEY, title TEXT);
CREATE TABLE developers (id INTEGER PRIMARY KEY, name TEXT, project_id INTEGER);
INSERT INTO projects VALUES (1, 'Cloud Engine'), (2, 'Auth Gateway');
INSERT INTO developers VALUES (10, 'Ada Lovelace', 1), (11, 'Grace Hopper', 2), (12, 'Linus Torvalds', 1);`,
          expectedStdout: "Ada Lovelace",

          matchMode: "contains",
        },
      ],
    ),
    checkpoint: checkpoint(
      "What happens to rows in an INNER JOIN if their foreign key has no matching primary key?",
      "They are omitted from the query result set entirely.",
    ),
    exampleRun: exampleRun("Ada Lovelace|Cloud Engine\nGrace Hopper|Auth Gateway\nLinus Torvalds|Cloud Engine"),
  },
  {
    id: "sql-outer-joins-set",
    order: 6,
    title: "LEFT OUTER JOIN and Set Operations (UNION)",
    summary: "Master core concepts and hands-on engineering techniques for left outer join and set operations (union).",
    type: "guided-coding",
    objectiveIds: ["sql-outer-joins-set"],
    prerequisiteLessonIds: ["sql-inner-joins"],
    estimatedDurationMinutes: 25,
    content: `When reporting on data, you often need to include records from the primary table even if they have **no associated entries** in the joined table.

### LEFT OUTER JOIN
A \`LEFT JOIN\` returns all rows from the left table. For rows without a match on the right, all right-table columns evaluate to \`NULL\`:
\`\`\`sql
SELECT c.name, o.order_id, o.total_amount
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id;
\`\`\`
If customer "Alice" has placed no orders, \`o.order_id\` and \`o.total_amount\` will be \`NULL\`.

### Set Operations: UNION vs UNION ALL
Set operations combine outputs of two structurally identical queries:
- \`UNION\`: Combines row sets and **eliminates duplicates** (requires sorting/hashing).
- \`UNION ALL\`: Concatenates row sets directly without deduplication (faster).`,
    theorySections: [
      {
        title: "Anti-Joins for Orphan Detection",
        id: "sql-databases-sec-11",
        content: `A common SQL pattern for finding unused records (e.g. customers with zero orders or inactive servers with no deployed containers) is the anti-join:
SELECT c.id, c.name FROM customers c LEFT JOIN orders o ON c.id = o.customer_id WHERE o.customer_id IS NULL;
This leverages the index on orders to quickly identify records without references.`,
      },
      {
        title: "UNION Performance Characteristics",
        id: "sql-databases-sec-12",
        content: `UNION performs a sorting and deduplication step across the entire combined dataset. When you know two queries produce disjoint sets (e.g. archival rows vs active rows), using UNION ALL saves significant CPU time and memory allocation.`,
      },
    ],
    codeExamples: [
      {
        title: "Finding Inactive Customers with LEFT JOIN",
        description: "Lists customers who have never placed an order.",
        code: `SELECT c.customer_id, c.name
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
WHERE o.order_id IS NULL;`,
        language: "sql",
      },
    ],
    exercise: exercise(
      "ex-sql-outer-joins-set",
      "List All Clients and Their Active Contracts",
      "Write a query selecting `clients.name` and `contracts.contract_code`. Perform a `LEFT JOIN` on `clients.id = contracts.client_id`. If a client has no contract, the `contract_code` should appear as NULL. Order by `clients.name` ascending.",
      `SELECT clients.name, contracts.contract_code FROM clients LEFT JOIN contracts ON clients.id = contracts.client_id ORDER BY clients.name ASC;`,
      "sql-outer-joins-set",
      "All clients preserved via LEFT JOIN.",
      [
        "Use SELECT clients.name, contracts.contract_code",
        "Use LEFT JOIN contracts ON clients.id = contracts.client_id",
        "Sort by clients.name ASC",
      ],
      "Developing",
      `-- Select all clients and their contracts using a LEFT JOIN:
SELECT 
  clients.name, 
  contracts.contract_code
FROM clients
LEFT JOIN contracts ON clients.id = contracts.client_id
ORDER BY clients.name ASC;`,
      [
        {
          id: "tc-sql-outer-1",
          label: "Preserves clients with null contracts",
          stdin: `CREATE TABLE clients (id INTEGER PRIMARY KEY, name TEXT);
CREATE TABLE contracts (id INTEGER PRIMARY KEY, client_id INTEGER, contract_code TEXT);
INSERT INTO clients VALUES (1, 'Acme Corp'), (2, 'Globex'), (3, 'Initech');
INSERT INTO contracts VALUES (101, 1, 'CTR-2024-A'), (102, 3, 'CTR-2024-B');`,
          expectedStdout: "Acme Corp",

          matchMode: "contains",
        },
      ],
    ),
    checkpoint: checkpoint(
      "How do the columns of the right table appear in a LEFT JOIN when no matching row exists?",
      "They evaluate to NULL for that row.",
    ),
    exampleRun: exampleRun("Acme Corp|CTR-2024-A\nGlobex|null\nInitech|CTR-2024-B"),
  },

  // Module 3: Advanced Queries & Mutations
  {
    id: "sql-subqueries-ctes",
    order: 7,
    title: "Subqueries and Common Table Expressions (WITH)",
    summary: "Master core concepts and hands-on engineering techniques for subqueries and common table expressions (with).",
    type: "guided-coding",
    objectiveIds: ["sql-ctes-subqueries"],
    prerequisiteLessonIds: ["sql-outer-joins-set"],
    estimatedDurationMinutes: 30,
    content: `When queries grow complex, nesting subqueries inside \`WHERE\` or \`FROM\` clauses can make code difficult to read and maintain. **Common Table Expressions (CTEs)** solve this by defining named temporary result sets using the \`WITH\` clause.

### Common Table Expression (CTE)
\`\`\`sql
WITH high_value_orders AS (
  SELECT customer_id, SUM(total_amount) AS total_spent
  FROM orders
  GROUP BY customer_id
  HAVING SUM(total_amount) > 5000.0
)
SELECT c.name, h.total_spent
FROM customers c
INNER JOIN high_value_orders h ON c.id = h.customer_id
ORDER BY h.total_spent DESC;
\`\`\`

### Recursive CTEs
CTEs can also be recursive, enabling graph traversal, trees, and series generation:
\`\`\`sql
WITH RECURSIVE countdown(n) AS (
  SELECT 5
  UNION ALL
  SELECT n - 1 FROM countdown WHERE n > 1
)
SELECT * FROM countdown;
\`\`\``,
    theorySections: [
      {
        title: "Materialized vs Inlined CTEs",
        id: "sql-databases-sec-13",
        content: `Older SQL engines treated CTEs as optimization fences, evaluating them once and caching the result in temporary memory. Modern SQLite can inline CTEs directly into the outer query, enabling the query planner to push WHERE predicates into the CTE definition for index-backed evaluation.`,
      },
      {
        title: "Correlated Subqueries",
        id: "sql-databases-sec-14",
        content: `A correlated subquery executes once for each row evaluated by the outer query:
SELECT e.name, e.salary FROM employees e WHERE e.salary > (SELECT AVG(salary) FROM employees WHERE department = e.department);
Because correlated subqueries can execute $N$ times, rewriting them with window functions or CTE joins usually yields superior performance.`,
      },
    ],
    codeExamples: [
      {
        title: "Generating a Number Sequence with Recursive CTE",
        description: "Produces integers 1 through 5 using recursive iteration.",
        code: `WITH RECURSIVE numbers(val) AS (
  SELECT 1
  UNION ALL
  SELECT val + 1 FROM numbers WHERE val < 5
)
SELECT val FROM numbers;`,
        language: "sql",
      },
    ],
    exercise: exercise(
      "ex-sql-subqueries-ctes",
      "Filter Employees Above Department Average",
      "Using a CTE named `dept_averages` that computes `dept` and `avg_sal` from `staff`, write a query joining `staff` with `dept_averages` on `dept` to select `staff.name`, `staff.dept`, and `staff.salary` for employees whose salary is strictly greater than their department's average (`staff.salary > dept_averages.avg_sal`). Sort by `staff.name` ascending.",
      `WITH dept_averages AS (
  SELECT dept, AVG(salary) AS avg_sal
  FROM staff
  GROUP BY dept
)
SELECT staff.name, staff.dept, staff.salary
FROM staff
INNER JOIN dept_averages ON staff.dept = dept_averages.dept
WHERE staff.salary > dept_averages.avg_sal
ORDER BY staff.name ASC;`,
      "sql-ctes-subqueries",
      "Computed department averages via CTE and filtered higher earners.",
      [
        "Start with WITH dept_averages AS (SELECT dept, AVG(salary) AS avg_sal FROM staff GROUP BY dept)",
        "Join staff with dept_averages ON staff.dept = dept_averages.dept",
        "Add WHERE staff.salary > dept_averages.avg_sal",
      ],
      "Applied",
      `-- Use a CTE to find employees earning above their department average:
WITH dept_averages AS (
  SELECT dept, AVG(salary) AS avg_sal
  FROM staff
  GROUP BY dept
)
SELECT 
  staff.name, 
  staff.dept, 
  staff.salary
FROM staff
INNER JOIN dept_averages ON staff.dept = dept_averages.dept
WHERE staff.salary > dept_averages.avg_sal
ORDER BY staff.name ASC;`,
      [
        {
          id: "tc-sql-cte-1",
          label: "Filters employees earning above department average",
          stdin: `CREATE TABLE staff (id INTEGER, name TEXT, dept TEXT, salary REAL);
INSERT INTO staff VALUES (1, 'Alice', 'Engineering', 140000), (2, 'Bob', 'Engineering', 110000), (3, 'Charlie', 'Design', 95000), (4, 'David', 'Design', 85000);`,
          expectedStdout: "Alice",

          matchMode: "contains",
        },
      ],
    ),
    checkpoint: checkpoint(
      "What keyword initiates a Common Table Expression in SQL?",
      "The WITH keyword.",
    ),
    exampleRun: exampleRun("Alice|Engineering|140000\nCharlie|Design|95000"),
  },
  {
    id: "sql-dml-transactions",
    order: 8,
    title: "DML Mutations and ACID Transactions",
    summary: "Master core concepts and hands-on engineering techniques for dml mutations and acid transactions.",
    type: "guided-coding",
    objectiveIds: ["sql-transactions-acid"],
    prerequisiteLessonIds: ["sql-subqueries-ctes"],
    estimatedDurationMinutes: 30,
    content: `Data Manipulation Language (DML) manages table content:
- \`INSERT INTO table (cols...) VALUES (vals...)\`: Creates new records.
- \`UPDATE table SET col = val WHERE condition\`: Modifies existing rows.
- \`DELETE FROM table WHERE condition\`: Removes rows matching a predicate.

### ACID Properties
1. **Atomicity**: All operations in a transaction complete successfully, or none do (all-or-nothing).
2. **Consistency**: Database invariants and constraints are preserved across state transitions.
3. **Isolation**: Concurrent transactions execute without cross-contamination.
4. **Durability**: Committed data survives system failures and restarts.

### Transaction Syntax
\`\`\`sql
BEGIN TRANSACTION;

UPDATE accounts SET balance = balance - 250.0 WHERE account_id = 101;
UPDATE accounts SET balance = balance + 250.0 WHERE account_id = 202;

COMMIT; -- Or ROLLBACK if an error occurs!
\`\`\`
Enclosing multiple write operations inside an explicit transaction ensures that if a crash or constraint violation happens mid-transfer, \`ROLLBACK\` restores the original state.`,
    theorySections: [
      {
        title: "Write-Ahead Logging (WAL) in SQLite",
        id: "sql-databases-sec-15",
        content: `In traditional rollback journal mode, writing locks the entire database file. In WAL (Write-Ahead Logging) mode, changes are appended to a separate -wal file, allowing readers to query existing database snapshots concurrently without blocking writes.`,
      },
      {
        title: "Transaction Batching for Bulk Writes",
        id: "sql-databases-sec-16",
        content: `Every standalone INSERT statement in SQLite triggers an implicit transaction, forcing a disk sync (fsync). By wrapping 10,000 inserts in a single BEGIN TRANSACTION / COMMIT block, disk synchronization occurs once at the end, accelerating write speeds by 100x or more.`,
      },
    ],
    codeExamples: [
      {
        title: "Atomic Fund Transfer Between Bank Accounts",
        description: "Executes a balanced debit and credit inside a transaction.",
        code: `BEGIN TRANSACTION;

UPDATE accounts SET balance = balance - 500 WHERE id = 1;
UPDATE accounts SET balance = balance + 500 WHERE id = 2;

COMMIT;

SELECT id, balance FROM accounts;`,
        language: "sql",
      },
    ],
    exercise: exercise(
      "ex-sql-dml-transactions",
      "Process Account Transfer and Deletion",
      "Inside a transaction: 1) Deduct 100 from account id 1. 2) Add 100 to account id 2. 3) Delete inactive account id 3 (`WHERE id = 3`). Commit the transaction, then select all records from `accounts` ordered by `id ASC`.",
      `BEGIN TRANSACTION;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
DELETE FROM accounts WHERE id = 3;
COMMIT;
SELECT id, balance FROM accounts ORDER BY id ASC;`,
      "sql-transactions-acid",
      "Transactional mutation executed atomically.",
      [
        "Start with BEGIN TRANSACTION;",
        "Execute both UPDATE statements and the DELETE statement.",
        "End transaction with COMMIT;",
        "Final statement: SELECT id, balance FROM accounts ORDER BY id ASC;",
      ],
      "Developing",
      `-- Execute atomic account updates and deletion inside a transaction:
BEGIN TRANSACTION;

UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
DELETE FROM accounts WHERE id = 3;

COMMIT;

SELECT id, balance FROM accounts ORDER BY id ASC;`,
      [
        {
          id: "tc-sql-dml-1",
          label: "Balances correctly updated and inactive account removed",
          stdin: `CREATE TABLE accounts (id INTEGER PRIMARY KEY, balance REAL);
INSERT INTO accounts VALUES (1, 500.0), (2, 200.0), (3, 0.0);`,
          expectedStdout: "400",

          matchMode: "contains",
        },
      ],
    ),
    checkpoint: checkpoint(
      "What does Atomicity guarantee in an ACID relational transaction?",
      "It guarantees that either all operations in the transaction succeed, or the entire transaction is rolled back with zero partial changes committed.",
    ),
    exampleRun: exampleRun("1|400\n2|300"),
  },

  {
    id: "sql-indexes-b-tree",
    order: 9,
    title: "B-Tree Indexes and Query Performance",
    summary: "Accelerate SELECT query execution from O(N) linear table scans to O(log N) tree lookups with CREATE INDEX.",
    type: "guided-coding",
    objectiveIds: ["sql-btree-indexes"],
    prerequisiteLessonIds: ["sql-dml-transactions"],
    estimatedDurationMinutes: 30,
    content: `Without an index, finding rows matching \`WHERE email = 'alice@example.com'\` requires a full **table scan**, checking every page on disk in $O(N)$ time.

### B-Tree Index Architecture
A database index is a separate, self-balancing search tree data structure pointing back to the underlying table rows:
~~~sql
CREATE INDEX idx_users_email ON users(email);
~~~
With a B-Tree index, equality searches run in $O(\\log N)$ time, resolving millions of rows in single-digit disk reads.

### Composite Indexes
An index on multiple columns \`(department, salary)\` can optimize queries filtering on \`department\` alone, or on both \`department AND salary\`, but not on \`salary\` alone due to left-prefix ordering rules.`,
    theorySections: [
      {
        id: "sql-index-write-overhead",
        title: "The Write Overhead of Indexes",
        content: "Every index added speeds up read queries but slows down INSERT, UPDATE, and DELETE operations, because the database engine must synchronously update all corresponding B-Trees on every write.",
      },
    ],
    codeExamples: [
      {
        title: "Creating and Querying with Indexes",
        language: "sql",
        code: `CREATE TABLE readings (
  id INTEGER PRIMARY KEY,
  device_id TEXT,
  val REAL
);
CREATE INDEX idx_readings_dev ON readings(device_id);

SELECT device_id, val FROM readings WHERE device_id = 'SENS-01';`,
        description: "Creating an index to accelerate device filtering.",
      },
    ],
    resources: [
      {
        title: "SQLite Query Optimizer and Indexes",
        url: "https://www.sqlite.org/queryplanner.html",
        description: "Official guide to B-tree indexes and query planning in SQLite.",
        type: "documentation",
      },
    ],
    execution: { language: "sql", target: "browser-wasm" },
    exampleRun: exampleRun("SENS-01|24.5\n"),
    exercise: exercise(
      "ex-sql-create-index",
      "Create a composite index on telemetry logs",
      "Given table `telemetry (id INTEGER PRIMARY KEY, station TEXT, metric TEXT, value REAL)`: 1) Create an index named `idx_station_metric` on columns `(station, metric)`. 2) Query all rows where `station = 'ST-01'` and `metric = 'temp'`, ordered by `value ASC`. Select `station`, `metric`, and `value`.",
      `CREATE INDEX idx_station_metric ON telemetry(station, metric);
SELECT station, metric, value FROM telemetry WHERE station = 'ST-01' AND metric = 'temp' ORDER BY value ASC;`,
      "sql-btree-indexes",
      "Accelerate composite queries with multi-column indexes.",
      [
        "Use CREATE INDEX idx_station_metric ON telemetry(station, metric);",
        "Add WHERE station = 'ST-01' AND metric = 'temp' ORDER BY value ASC;",
      ],
      "Developing",
      `-- Create index and query filtered telemetry:
CREATE INDEX idx_station_metric ON telemetry(station, metric);

SELECT station, metric, value FROM telemetry WHERE station = 'ST-01' AND metric = 'temp' ORDER BY value ASC;`,
      [
        {
          id: "tc-idx-1",
          label: "Retrieves indexed telemetry records in ascending value order",
          stdin: `CREATE TABLE telemetry (id INTEGER PRIMARY KEY, station TEXT, metric TEXT, value REAL);
INSERT INTO telemetry VALUES (1, 'ST-01', 'temp', 22.4), (2, 'ST-02', 'temp', 25.1), (3, 'ST-01', 'temp', 21.0), (4, 'ST-01', 'press', 1013.2);`,
          expectedStdout: "21",
          matchMode: "contains",
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why does adding too many indexes degrade database write performance?",
      "Every INSERT, UPDATE, or DELETE operation must update every index on that table, incurring additional disk I/O and tree balancing operations.",
    ),
  },

  {
    id: "sql-explain-query-plan",
    order: 10,
    title: "Analyzing Query Execution with EXPLAIN QUERY PLAN",
    summary: "Inspect query optimizer execution plans to detect SCAN TABLE bottlenecks and verify USING INDEX utilization.",
    type: "practical-exercise",
    objectiveIds: ["sql-explain-plans"],
    prerequisiteLessonIds: ["sql-indexes-b-tree"],
    estimatedDurationMinutes: 30,
    content: `When queries feel sluggish, the primary diagnostic tool is \`EXPLAIN QUERY PLAN\`. Prefixing any SQL statement with this command reveals how the database engine plans to execute the query without actually running it.

### Reading Execution Plans in SQLite
~~~sql
EXPLAIN QUERY PLAN
SELECT * FROM customers WHERE email = 'bob@corp.com';
~~~
- \`SCAN TABLE customers\`: **Warning!** The engine scans every single row in the table from top to bottom ($O(N)$).
- \`SEARCH TABLE customers USING INDEX idx_email\`: **Fast!** The engine navigates a B-Tree directly to the target record in $O(\\log N)$ time.
- \`SEARCH TABLE customers USING INTEGER PRIMARY KEY (rowid = ?)\`: **Optimal!** Direct rowid hash/B-Tree lookup ($O(1)$).`,
    theorySections: [
      {
        id: "sql-plan-cost-estimator",
        title: "Cost-Based Query Optimization",
        content: "Modern SQL planners analyze table statistics, column cardinality, and index availability to select the lowest-cost execution path among dozens of candidate access plans.",
      },
    ],
    codeExamples: [
      {
        title: "Verifying Index Usage with EXPLAIN",
        language: "sql",
        code: `CREATE TABLE items (id INTEGER PRIMARY KEY, sku TEXT);
CREATE INDEX idx_items_sku ON items(sku);
EXPLAIN QUERY PLAN SELECT * FROM items WHERE sku = 'ABC-123';`,
        description: "Checking that the SQLite query planner uses the sku index.",
      },
    ],
    resources: [
      {
        title: "EXPLAIN QUERY PLAN in SQLite",
        url: "https://www.sqlite.org/eqp.html",
        description: "Official guide to interpreting SQLite query plan output.",
        type: "documentation",
      },
    ],
    execution: { language: "sql", target: "browser-wasm" },
    exampleRun: exampleRun("0|0|0|SEARCH items USING INDEX idx_items_sku (sku=?)\n"),
    exercise: exercise(
      "ex-sql-explain-plan",
      "Inspect execution plan for an indexed search",
      "Given table `products (id INTEGER PRIMARY KEY, barcode TEXT, name TEXT)`. 1) Create index `idx_barcode ON products(barcode)`. 2) Run `EXPLAIN QUERY PLAN SELECT id, name FROM products WHERE barcode = '9780132350884';` to verify index utilization.",
      `CREATE INDEX idx_barcode ON products(barcode);
EXPLAIN QUERY PLAN SELECT id, name FROM products WHERE barcode = '9780132350884';`,
      "sql-explain-plans",
      "Inspect and confirm index utilization with EXPLAIN QUERY PLAN.",
      [
        "Create index idx_barcode on products(barcode).",
        "Prefix the query with EXPLAIN QUERY PLAN.",
      ],
      "Developing",
      `-- Create index and inspect query plan:
CREATE INDEX idx_barcode ON products(barcode);

EXPLAIN QUERY PLAN SELECT id, name FROM products WHERE barcode = '9780132350884';`,
      [
        {
          id: "tc-explain-1",
          label: "Output confirms USING INDEX idx_barcode execution",
          stdin: `CREATE TABLE products (id INTEGER PRIMARY KEY, barcode TEXT, name TEXT);`,
          expectedStdout: "USING INDEX idx_barcode",
          matchMode: "contains",
        },
      ],
    ),
    checkpoint: checkpoint(
      "In an EXPLAIN QUERY PLAN output, what is the critical difference between SCAN TABLE and SEARCH TABLE?",
      "SCAN TABLE traverses every row sequentially (O(N)), whereas SEARCH TABLE navigates an index or primary key directly (O(log N) or O(1)).",
    ),
  },

  {
    id: "sql-window-functions",
    order: 11,
    title: "Analytical Window Functions",
    summary: "Compute running totals, rankings, and partitioned metrics using ROW_NUMBER(), RANK(), and OVER (PARTITION BY ...).",
    type: "guided-coding",
    objectiveIds: ["sql-window-analytics"],
    prerequisiteLessonIds: ["sql-explain-query-plan"],
    estimatedDurationMinutes: 35,
    content: `Standard \`GROUP BY\` queries collapse rows into single summary records. In contrast, **Window Functions** compute aggregate and ranking metrics over a sliding frame of rows while **preserving individual row identities**.

### Anatomy of an OVER() Clause
~~~sql
SELECT
  id,
  department,
  salary,
  ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS dept_rank,
  SUM(salary) OVER (PARTITION BY department) AS dept_total
FROM employees;
~~~
- \`PARTITION BY department\`: Divides the rows into groups for independent calculation.
- \`ORDER BY salary DESC\`: Defines the ranking and cumulative sequence within each partition.
- \`ROW_NUMBER()\`: Assigns sequential integers (1, 2, 3...) starting over for each partition.`,
    theorySections: [
      {
        id: "sql-window-vs-groupby",
        title: "Window Functions vs. GROUP BY",
        content: "Window functions execute late in the query lifecycle, right after WHERE, GROUP BY, and HAVING, operating over the final filtered result set without collapsing records.",
      },
    ],
    codeExamples: [
      {
        title: "Running Total Calculation",
        language: "sql",
        code: `CREATE TABLE sales (id INTEGER PRIMARY KEY, day_num INT, amount REAL);
INSERT INTO sales VALUES (1, 1, 100), (2, 2, 150), (3, 3, 200);

SELECT day_num, amount,
       SUM(amount) OVER (ORDER BY day_num) AS running_total
FROM sales;`,
        description: "Computing cumulative cumulative sum across days.",
      },
    ],
    resources: [
      {
        title: "SQLite Window Functions",
        url: "https://www.sqlite.org/windowfunctions.html",
        description: "Official guide to OVER, PARTITION BY, and ranking functions in SQLite.",
        type: "documentation",
      },
    ],
    execution: { language: "sql", target: "browser-wasm" },
    exampleRun: exampleRun("1|100.0|100.0\n2|150.0|250.0\n3|200.0|450.0\n"),
    exercise: exercise(
      "ex-sql-window-rank",
      "Rank students within each department by GPA",
      "Given table `students (id INTEGER PRIMARY KEY, dept TEXT, name TEXT, gpa REAL)`. Write a query selecting `dept`, `name`, `gpa`, and `ROW_NUMBER() OVER (PARTITION BY dept ORDER BY gpa DESC) AS rnk`, ordered by `dept ASC, rnk ASC`.",
      `SELECT dept, name, gpa, ROW_NUMBER() OVER (PARTITION BY dept ORDER BY gpa DESC) AS rnk FROM students ORDER BY dept ASC, rnk ASC;`,
      "sql-window-analytics",
      "Partition records and compute departmental student rankings.",
      [
        "Use ROW_NUMBER() OVER (PARTITION BY dept ORDER BY gpa DESC) AS rnk.",
        "Add final ORDER BY dept ASC, rnk ASC.",
      ],
      "Developing",
      `-- Select dept, name, gpa, and rank within department:
SELECT dept, name, gpa,
       ROW_NUMBER() OVER (PARTITION BY dept ORDER BY gpa DESC) AS rnk
FROM students
ORDER BY dept ASC, rnk ASC;`,
      [
        {
          id: "tc-win-1",
          label: "Ranks students within department by descending GPA",
          stdin: `CREATE TABLE students (id INTEGER PRIMARY KEY, dept TEXT, name TEXT, gpa REAL);
INSERT INTO students VALUES (1, 'CS', 'Alice', 3.9), (2, 'CS', 'Bob', 3.7), (3, 'EE', 'Charlie', 3.8);`,
          expectedStdout: "Alice",
          matchMode: "contains",
        },
      ],
    ),
    checkpoint: checkpoint(
      "How does a window function differ fundamentally from a standard GROUP BY aggregation?",
      "GROUP BY collapses multiple rows into a single summary row, while a window function produces aggregate calculations while preserving all original individual rows.",
    ),
  },

  {
    id: "sql-capstone-database-assessment",
    order: 12,
    title: "Relational Architecture & Performance Assessment",
    summary: "Synthesize relational schema design, multi-table joins, indexing, and window analytics in a comprehensive database capstone.",
    type: "assessment",
    objectiveIds: ["sql-capstone-optimization"],
    prerequisiteLessonIds: ["sql-window-functions"],
    estimatedDurationMinutes: 45,
    content: `### Capstone Database Assessment
This comprehensive assessment validates your complete mastery of relational database architecture:
1. **Schema Integrity**: Defining robust primary and foreign key constraints.
2. **Multi-Table Joins**: Correlating relational entities without data duplication.
3. **Performance Optimization**: B-Tree indexes and execution plan verification.
4. **Advanced Analytics**: Window functions and Common Table Expressions.

Review the prompt below to implement the warehouse inventory tracking query.`,
    theorySections: [
      {
        id: "sql-capstone-rubric",
        title: "Relational Design Best Practices",
        content: "High-performance database systems eliminate data anomalies through 3rd Normal Form (3NF), index all foreign key columns, and avoid unindexed full-table scans.",
      },
    ],
    codeExamples: [
      {
        title: "Complete Inventory Aggregation",
        language: "sql",
        code: `SELECT p.name, SUM(i.quantity) as total_qty
FROM products p
JOIN inventory i ON p.id = i.product_id
GROUP BY p.name;`,
        description: "Aggregating warehouse stock across relational entities.",
      },
    ],
    resources: [
      {
        title: "Relational Database Normalization",
        url: "https://en.wikipedia.org/wiki/Database_normalization",
        description: "1NF, 2NF, 3NF, and Boyce-Codd normal forms.",
        type: "reference",
      },
    ],
    execution: { language: "sql", target: "browser-wasm" },
    exampleRun: exampleRun("Widget|150\n"),
    exercise: exercise(
      "ex-sql-capstone-inventory",
      "Calculate warehouse stock and running totals",
      "Given tables `warehouses (id INT, location TEXT)` and `stock (id INT, warehouse_id INT, sku TEXT, qty INT)`. Join warehouses and stock on `warehouse_id = warehouses.id`. Select `warehouses.location`, `stock.sku`, `stock.qty`, and the cumulative sum `SUM(stock.qty) OVER (PARTITION BY warehouses.location ORDER BY stock.qty DESC) AS running_qty`. Order by `warehouses.location ASC, stock.qty DESC`.",
      `SELECT w.location, s.sku, s.qty, SUM(s.qty) OVER (PARTITION BY w.location ORDER BY s.qty DESC) AS running_qty FROM warehouses w JOIN stock s ON w.id = s.warehouse_id ORDER BY w.location ASC, s.qty DESC;`,
      "sql-capstone-optimization",
      "Combine relational joins with cumulative window totals in a single query.",
      [
        "Join warehouses w with stock s on w.id = s.warehouse_id.",
        "Use SUM(s.qty) OVER (PARTITION BY w.location ORDER BY s.qty DESC) AS running_qty.",
        "Order by w.location ASC, s.qty DESC.",
      ],
      "Applied",
      `-- Join warehouses and stock with running total:
SELECT w.location, s.sku, s.qty,
       SUM(s.qty) OVER (PARTITION BY w.location ORDER BY s.qty DESC) AS running_qty
FROM warehouses w
JOIN stock s ON w.id = s.warehouse_id
ORDER BY w.location ASC, s.qty DESC;`,
      [
        {
          id: "tc-sql-cap-1",
          label: "Returns warehouse locations with SKU quantities and cumulative running totals",
          stdin: `CREATE TABLE warehouses (id INT, location TEXT);
CREATE TABLE stock (id INT, warehouse_id INT, sku TEXT, qty INT);
INSERT INTO warehouses VALUES (1, 'Austin'), (2, 'Seattle');
INSERT INTO stock VALUES (1, 1, 'SKU-A', 50), (2, 1, 'SKU-B', 30), (3, 2, 'SKU-C', 80);`,
          expectedStdout: "Austin|SKU-A|50|50",
          matchMode: "contains",
        },
      ],
    ),
    checkpoint: checkpoint(
      "Why is normalizing tables to Third Normal Form (3NF) beneficial in high-volume relational systems?",
      "3NF eliminates data redundancy and update anomalies, guaranteeing that each non-key field depends solely on the primary key.",
    ),
  },
];

// Module Groupings
export const sqlDatabasesModules: LearningModule[] = [
  moduleData(
    "sql-module-foundations",
    1,
    "Relational Foundations & DDL",
    "Master relational table architecture, strong data typing, constraints, SELECT queries, WHERE predicates, and deterministic pagination.",
    sqlDatabasesLessons.slice(0, 3),
  ),
  moduleData(
    "sql-module-aggregates-joins",
    2,
    "Aggregations & Relational Joins",
    "Perform statistical aggregations with GROUP BY and HAVING, join normalized tables with INNER JOIN, and preserve records with LEFT JOIN.",
    sqlDatabasesLessons.slice(3, 6),
  ),
  moduleData(
    "sql-module-advanced-mutations",
    3,
    "Advanced Queries & ACID Transactions",
    "Deconstruct hierarchical data with Common Table Expressions (WITH syntax) and execute safe mutations with ACID transactions.",
    sqlDatabasesLessons.slice(6, 8),
  ),
  moduleData(
    "sql-module-indexing-optimization",
    4,
    "Indexing, Query Plans & Performance Optimization",
    "B-Tree indexes, EXPLAIN QUERY PLAN, analytical window functions, and database normalization.",
    sqlDatabasesLessons.slice(8),
  ),
];

export const sqlDatabasesPath: LearningCourse = {
  id: "sql-databases",
  subjectId: sqlDatabasesSubject.id,
  title: "Relational Databases & SQL Foundations",
  description: "Relational modeling, schema integrity, multi-table joins, aggregations, CTEs, indexes, window functions, and ACID transactions.",
  level: "Beginner",
  version: "1.0.0",
  prerequisites: [
      "Basic computer literacy and understanding of tabular data."
  ],
  objectives: sqlDatabasesObjectives,
  learningOutcomes: [
      "Define normalized relational schemas with primary keys and constraints.",
      "Filter, sort, and paginate tabular data using SQL SELECT and WHERE clauses.",
      "Compute aggregate metrics using GROUP BY and HAVING.",
      "Join multiple relational tables using INNER JOIN and LEFT JOIN.",
      "Construct complex hierarchical queries with Common Table Expressions (WITH).",
      "Execute safe data modifications using ACID transactions.",
      "Accelerate query performance with B-Tree indexes and inspect EXPLAIN plans.",
      "Calculate running totals and rankings with analytical window functions."
  ],
  estimatedDurationMinutes: 480,
  publicationStatus: "published",
  modules: sqlDatabasesModules,
};
