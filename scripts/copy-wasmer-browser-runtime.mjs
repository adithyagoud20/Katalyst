import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
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

const browserEntryPath = resolve(publicRoot, "dist/index.js");
const browserEntry = await readFile(browserEntryPath, "utf8");
const workerUrlSetup = 'setWorkerUrl(new URL("./browser-worker.js", import.meta.url).href);';
if (!browserEntry.includes(workerUrlSetup)) {
  throw new Error("Wasmer browser entry changed; review the isolated C worker URL patch before updating the SDK.");
}
await writeFile(browserEntryPath, browserEntry.replace(
  workerUrlSetup,
  '// Opaque sandbox origins require the C lab to provide a blob worker bootstrap.\n        setWorkerUrl(globalThis.__katalystCLabWorkerUrl ?? new URL("./browser-worker.js", import.meta.url).href);',
));
