import { cp, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageRoot = resolve(root, "node_modules/@wasmer/sdk");
const publicRoot = resolve(root, "public/vendor/wasmer-sdk");

await mkdir(publicRoot, { recursive: true });
await Promise.all([
  cp(resolve(packageRoot, "dist"), resolve(publicRoot, "dist"), { recursive: true, force: true }),
  cp(resolve(packageRoot, "pkg"), resolve(publicRoot, "pkg"), { recursive: true, force: true }),
  cp(resolve(packageRoot, "LICENSE"), resolve(publicRoot, "LICENSE"), { force: true }),
]);
