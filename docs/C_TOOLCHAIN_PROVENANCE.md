# C Toolchain Provenance & Build Specification

This document records the provenance, licensing, integrity checksums, and delivery architecture for KATALYST's in-browser C compilation toolchain.

## 1. Overview

KATALYST compiles and executes C programs entirely inside the learner's browser without sending code to an external server or third-party API. The compiler runs in a Web Worker, producing a WebAssembly binary that is executed by a separate sandboxed WASI worker.

None of the compiler binaries are stored in Git. Instead, they are downloaded and cryptographically verified at prebuild time into the gitignored `public/vendor/c-toolchain/` directory.

## 2. Toolchain Components & Provenance

| Component | Upstream Source | License | Raw Size | Brotli Size | SHA-256 Hash |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `clang.wasm` | LLVM 12.0.0 Clang (`binji/wasm-clang`, `ShahramMebashar/cpp-playground`) | Apache-2.0 with LLVM Exception | 31,438,719 B (~30.0 MB) | ~8.3 MB | `95fe81da0cf5a73a388e6a575e9f8a3297a731efc77bf408307616198f12ee52` |
| `lld.wasm` | LLVM 12.0.0 LLD Linker (`wasm-ld`) | Apache-2.0 with LLVM Exception | 13,858,353 B (~13.2 MB) | ~3.6 MB | `fdb3793f0b83b6cbba0225d7efd6ee8a9ce7ebdf4d092534ce644be2904b77d6` |
| `memfs.wasm` | LLVM MemFS virtual filesystem | Apache-2.0 with LLVM Exception / MIT | 1,061,042 B (~1.0 MB) | ~276 KB | `31fb177567885b565a4435cefc3e790a16cfa2b9d0b67e008fb56ebdc2391263` |
| `sysroot.tar` | WASI-libc sysroot (`crt1.o`, `libc.a`, `libm.a`, headers) | MIT (musl/wasi-libc) + LLVM Exception | 13,865,984 B (~13.2 MB) | ~4.0 MB | `785d0642fa60c6d5b03f0b2f8e1215b4976c6c74fbff60582ca3ff6eebe6fbe9` |

**Total uncompressed payload**: ~60.2 MB  
**Total compressed transfer**: ~16.2 MB (Brotli)

## 3. Delivery & Verification Pipeline

1. **Prebuild Automation**:
   - `scripts/download-c-toolchain.mjs` executes automatically during `predev` and `prebuild`.
   - Artifacts are downloaded over HTTPS from pinned release assets.
   - Every file's SHA-256 digest is calculated and matched against the pinned hash table in the script.
   - If any checksum fails or a network download fails, the build exits immediately with code 1.
2. **Git Hygiene**:
   - `public/vendor/c-toolchain/` is added to `.gitignore`.
   - No `.wasm` or `.tar` binaries are committed to the repository, keeping repository clone size under 5 MB.
3. **Vercel Build Impact**:
   - Build time overhead: ~3-5 seconds to download and verify the 4 artifacts.
   - Static asset output: within Vercel's 100 MB per-file and 300 MB deployment limits.

## 4. Browser Caching Architecture

1. **HTTP Caching**:
   - `next.config.ts` assigns `Cache-Control: public, max-age=31536000, immutable` to all `/vendor/c-toolchain/:path*` assets.
   - Browsers cache the compressed responses indefinitely.
2. **Cache API (`katalyst-c-toolchain-v1`)**:
   - The compiler worker and runner explicitly store downloaded toolchain assets in the browser's Cache API (`caches.open('katalyst-c-toolchain-v1')`).
   - Subsequent visits, lesson switches, and runs read directly from `CacheStorage` with 0 network bytes transferred.

## 5. Security Architecture

1. **CSP Conformance**:
   -KATALYST maintains a strict nonce-based Content Security Policy with `'strict-dynamic'`.
   - Scripts: **No** `'unsafe-eval'` or `'unsafe-inline'`.
   - WebAssembly: `'wasm-unsafe-eval'` is permitted exclusively for WebAssembly module compilation on lesson and playground routes.
   - Workers: `worker-src 'self' blob:`.
2. **Execution Sandbox**:
   - Two-worker isolation: `compiler-worker.js` and `execution-worker.js`.
   - Memory limits: User program memory is strictly capped at 32 MB (`--max-memory=33554432`) and 1 MB stack. Large allocations trap safely rather than crashing the browser tab.
   - Virtual File System: `execution-worker.js` provides an in-memory `Map<string, Uint8Array>` virtual file table for `fopen`, `fprintf`, and `fread`. Code has zero access to the host disk or network.
   - Execution Limits: 10-second wall-clock execution timeout, 64 KB maximum stdout/stderr output buffer.
   - Stop Control: User can abort execution immediately via the Stop button, which terminates `execution-worker` while leaving `compiler-worker` warm.
