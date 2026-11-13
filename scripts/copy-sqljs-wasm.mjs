import { cp, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageDist = resolve(root, "node_modules/sql.js/dist");
const publicRoot = resolve(root, "public/vendor/sqljs");

await mkdir(publicRoot, { recursive: true });
await Promise.all([
  cp(resolve(packageDist, "sql-wasm.wasm"), resolve(publicRoot, "sql-wasm.wasm"), { force: true }),
  cp(resolve(packageDist, "sql-wasm.js"), resolve(publicRoot, "sql-wasm.js"), { force: true }),
]);
console.log("Copied sql.js assets to public/vendor/sqljs/");
