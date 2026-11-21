# C execution options

Status: In-browser C compilation and execution implemented via client-side WebAssembly toolchain (`wasm-clang` + `wasm-ld` + custom WASI preview-1 shim), gated behind `NEXT_PUBLIC_C_RUN_ENABLED` (default `false` until operator rollout). C++ remains disabled pending C++ curriculum matrix verification.

This client-side architecture supersedes both the retired Wasmer/Clang integration and the hosted execution API alternatives.

## In-browser C Toolchain Architecture (Adopted)

KATALYST now executes C in the browser using an autonomous client-side WebAssembly toolchain:
- **Compiler Worker (`compiler-worker.js`)**: Runs `clang` (LLVM 12.0.0 frontend) and `wasm-ld` with an in-memory MemFS virtual filesystem and a WASI sysroot (`sysroot.tar`). It outputs a standalone `.wasm` module.
- **Execution Worker (`execution-worker.js`)**: Instantiates the compiled `.wasm` module with a custom, pure-JavaScript WASI preview-1 shim supporting standard I/O (stdin, stdout, stderr) and an in-memory virtual file table (`files` Map) for file handling (`fopen`, `fprintf`, `fclose`).
- **Security & Sandboxing**:
  - Zero server calls: Learner code and stdin never leave the client device.
  - Zero `eval` or `new Function`: Runs strictly under KATALYST's nonce CSP with `'wasm-unsafe-eval'` and `worker-src 'self' blob:`.
  - Resource bounds: 32 MB linear memory cap (`--max-memory=33554432`), 1 MB stack, 10s runtime timeout, 64 KB output buffer cap.
  - User abort: Stop button immediately terminates the execution worker.
  - Delivery: Binaries are downloaded at prebuild time via `scripts/download-c-toolchain.mjs` with cryptographic SHA-256 verification into gitignored `public/vendor/c-toolchain/`. No binaries are tracked in Git.
  - Caching: Immutable HTTP caching + browser Cache API (`katalyst-c-toolchain-v1`) eliminates repeat network downloads.

## Historical Retirement of Wasmer / Clang

An earlier integration based on `@wasmer/sdk` was retired (preserved at git tag `c-runtime-archive`). It was retired because:
1. Wasmer SDK required `unsafe-eval` (`new Function` in its JS glue), conflicting with KATALYST's strict nonce CSP.
2. The Wasmer Clang runner deadlocked in Chromium workers, causing execution to hang indefinitely.
3. The bundle required a 110 MB download.

By contrast, the new `wasm-clang` architecture compiles and runs reliably in ~300–700 ms warm, uses ~16.2 MB compressed payload (Brotli), and requires zero `unsafe-eval`.

## Hosted execution APIs (Evaluated & Superseded)

The following hosted code execution APIs were evaluated as potential fallbacks. They are not adopted because KATALYST's client-side toolchain eliminates privacy concerns, recurring costs, and server dependencies.

| Service | Published price and limits | Latency and terms | Data and operational concerns |
| --- | --- | --- | --- |
| **[JDoodle Compiler API](https://www.jdoodle.com/compiler-api)** | Free: 20 runs/day. Starter: US$10/month for 1,000/day; Growth: US$20 for 2,000/day. Exhausted quotas return HTTP 429 without queuing. | REST returns one result; WebSocket streams output. Terms disclaim timely service. | Learner code leaves the browser. Requires server-side key management, egress proxying, and strict daily spend caps. |
| **[Sphere Engine Compilers](https://sphere-engine.com/pricing)** | 14-day trial; commercial plans quoted per use case. Submission limits agreed individually. | Queues submissions when capacity is busy. Typical run: 1–15 seconds. | Source and data streams stored for one month. Terms place compliance responsibility on customer. |
| **[Judge0 Shared Cloud](https://judge0.com/)** | Pro: €27/month for 2,000/day; Ultra: €54 for 5,000/day. Overage €0.001/submission. | Asynchronous queue-based polling model. | Source code sent to Judge0 cloud. Requires backend credentials and strict quota management to prevent overage charges. |

## Declined Alternatives

- **c2wasm**: Only compiled ~30% of curriculum programs, lacked core language features (pointers, structs, standard library), lacked line diagnostics, and had no clear license.
- **TraceCC**: AGPL-3.0 license (incompatible with permissive distribution), ~85 MB payload, pre-release API.
