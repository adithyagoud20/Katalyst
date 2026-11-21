# Third-Party Notices and Licenses

KATALYST integrates open-source components for client-side WebAssembly execution.

## WebAssembly C Compiler Toolchain

The in-browser C toolchain uses binaries derived from the LLVM and WebAssembly projects:

1. **LLVM / Clang / LLD**
   - Upstream: https://llvm.org/
   - Copyright (c) 2003-2021 LLVM Team
   - License: Apache License v2.0 with LLVM Exceptions (SPDX: `Apache-2.0 WITH LLVM-exception`)

2. **WASI-libc (musl libc adaptation for WASI)**
   - Upstream: https://github.com/WebAssembly/wasi-libc
   - Copyright (c) 2019 WebAssembly Community Group
   - Musl libc portions: Copyright (c) 2005-2020 Rich Felker, et al.
   - License: MIT License and Apache-2.0 with LLVM Exceptions

3. **wasm-clang & MemFS**
   - Upstream: https://github.com/binji/wasm-clang
   - Copyright (c) 2019 Ben Smith
   - License: Apache License v2.0 and MIT License

4. **cpp-playground / zenith-cpp WASI Shims**
   - Upstream: https://github.com/ShahramMebashar/cpp-playground
   - Copyright (c) 2021 Shahram Mebashar
   - License: MIT License

All components are strictly permissive open-source software (Apache-2.0, MIT). No copyleft or AGPL-licensed code is used in KATALYST.
