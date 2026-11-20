export function getCLabRunnerContentSecurityPolicy(parentOrigin: string, runnerOrigin: string): string {
  const parsedParentOrigin = new URL(parentOrigin).origin;
  const parsedRunnerOrigin = new URL(runnerOrigin).origin;
  const frameAncestor = parsedParentOrigin === parsedRunnerOrigin ? "'self'" : parsedParentOrigin;
  const runnerScript = `${parsedRunnerOrigin}/lab-runner/c/runner.js`;
  const wasmerScripts = `${parsedRunnerOrigin}/lab-runner/c/wasmer/dist/`;
  const wasmerPackage = `${parsedRunnerOrigin}/lab-runner/c/wasmer/pkg/`;
  return [
    "default-src 'none'",
    `script-src ${runnerScript} ${wasmerScripts} ${wasmerPackage} blob: 'unsafe-eval' 'wasm-unsafe-eval'`,
    // The runtime only needs the Wasmer registry/CDN. Omitting 'self' blocks app APIs.
    `connect-src ${wasmerPackage} https://registry.wasmer.io https://cdn.wasmer.io https://cdn.jsdelivr.net`,
    `worker-src ${wasmerScripts} blob:`,
    "img-src 'none'",
    "font-src 'none'",
    "media-src 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    `frame-ancestors ${frameAncestor}`,
    "sandbox allow-scripts",
  ].join("; ");
}

export function getCLabRunnerAssetContentSecurityPolicy(runnerOrigin: string): string {
  const parsedRunnerOrigin = new URL(runnerOrigin).origin;
  const wasmerScripts = `${parsedRunnerOrigin}/lab-runner/c/wasmer/dist/`;
  const wasmerPackage = `${parsedRunnerOrigin}/lab-runner/c/wasmer/pkg/`;
  return [
    "default-src 'none'",
    `script-src ${wasmerScripts} ${wasmerPackage} blob: 'unsafe-eval' 'wasm-unsafe-eval'`,
    `connect-src ${wasmerPackage} https://registry.wasmer.io https://cdn.wasmer.io https://cdn.jsdelivr.net`,
    `worker-src ${wasmerScripts} blob:`,
    "object-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
  ].join("; ");
}
