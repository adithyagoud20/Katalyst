/*
 * compiler-worker.js — Standalone in-browser C compiler worker for KATALYST.
 * Powered by wasm-clang, lld, and memfs.
 * ZERO eval, ZERO new Function, ZERO SharedArrayBuffer.
 */

'use strict';

function readStr(u8, o, len = -1) {
  let str = '';
  const end = len !== -1 ? o + len : u8.length;
  for (let i = o; i < end && u8[i] !== 0; ++i) {
    str += String.fromCharCode(u8[i]);
  }
  return str;
}

class ProcExit extends Error {
  constructor(code) {
    super(`process exited with code ${code}.`);
    this.code = code;
  }
}

class AbortError extends Error {
  constructor(msg = 'abort') { super(msg); }
}

class AssertError extends Error {
  constructor(msg) { super(msg); }
}

function assert(cond) {
  if (!cond) throw new AssertError('assertion failed.');
}

function getInstance(module, imports) {
  return WebAssembly.instantiate(module, imports);
}

function getImportObject(obj, names) {
  const result = {};
  for (const name of names) {
    result[name] = obj[name].bind(obj);
  }
  return result;
}

const ESUCCESS = 0;

class Memory {
  constructor(memory) {
    this.memory = memory;
    this.buffer = this.memory.buffer;
    this.u8 = new Uint8Array(this.buffer);
    this.u32 = new Uint32Array(this.buffer);
  }

  check() {
    if (this.buffer.byteLength === 0) {
      this.buffer = this.memory.buffer;
      this.u8 = new Uint8Array(this.buffer);
      this.u32 = new Uint32Array(this.buffer);
    }
  }

  read8(o) { return this.u8[o]; }
  read32(o) { return this.u32[o >> 2]; }
  write8(o, v) { this.u8[o] = v; }
  write32(o, v) { this.u32[o >> 2] = v; }
  write64(o, vlo, vhi = 0) {
    this.write32(o, vlo);
    this.write32(o + 4, vhi);
  }

  readStr(o, len) {
    return readStr(this.u8, o, len);
  }

  writeStr(o, str) {
    o += this.write(o, str);
    this.write8(o, 0);
    return str.length + 1;
  }

  write(o, buf) {
    if (buf instanceof ArrayBuffer) {
      return this.write(o, new Uint8Array(buf));
    } else if (typeof buf === 'string') {
      return this.write(o, buf.split('').map((x) => x.charCodeAt(0)));
    } else {
      const dst = new Uint8Array(this.buffer, o, buf.length);
      dst.set(buf);
      return buf.length;
    }
  }
}

class MemFS {
  constructor(options) {
    this.compileStreaming = options.compileStreaming;
    this.hostWrite = options.hostWrite;
    this.memfsFilename = options.memfsFilename || 'memfs';
    this.hostMem_ = null;

    const env = getImportObject(this, [
      'abort',
      'host_write',
      'host_read',
      'memfs_log',
      'copy_in',
      'copy_out',
    ]);

    this.ready = this.compileStreaming(this.memfsFilename)
      .then((module) => WebAssembly.instantiate(module, { env }))
      .then((instance) => {
        this.instance = instance;
        this.exports = instance.exports;
        this.mem = new Memory(this.exports.memory);
        this.exports.init();
      });
  }

  set hostMem(mem) {
    this.hostMem_ = mem;
  }

  addDirectory(path) {
    this.mem.check();
    this.mem.write(this.exports.GetPathBuf(), path);
    this.exports.AddDirectoryNode(path.length);
  }

  addFile(path, contents) {
    const length = contents instanceof ArrayBuffer ? contents.byteLength : contents.length;
    this.mem.check();
    this.mem.write(this.exports.GetPathBuf(), path);
    const inode = this.exports.AddFileNode(path.length, length);
    const addr = this.exports.GetFileNodeAddress(inode);
    this.mem.check();
    this.mem.write(addr, contents);
  }

  getFileContents(path) {
    this.mem.check();
    this.mem.write(this.exports.GetPathBuf(), path);
    const inode = this.exports.FindNode(path.length);
    const addr = this.exports.GetFileNodeAddress(inode);
    const size = this.exports.GetFileNodeSize(inode);
    return new Uint8Array(this.mem.buffer, addr, size);
  }

  abort() { throw new AbortError(); }

  host_write(fd, iovs, iovs_len, nwritten_out) {
    this.hostMem_.check();
    assert(fd <= 2);
    let size = 0;
    let str = '';
    for (let i = 0; i < iovs_len; ++i) {
      const buf = this.hostMem_.read32(iovs);
      iovs += 4;
      const len = this.hostMem_.read32(iovs);
      iovs += 4;
      str += this.hostMem_.readStr(buf, len);
      size += len;
    }
    this.hostMem_.write32(nwritten_out, size);
    this.hostWrite(str);
    return ESUCCESS;
  }

  host_read(fd, iovs, iovs_len, nread) {
    this.hostMem_.check();
    this.hostMem_.write32(nread, 0);
    return ESUCCESS;
  }

  memfs_log() {
    this.mem.check();
  }

  copy_out(clang_dst, memfs_src, size) {
    this.hostMem_.check();
    const dst = new Uint8Array(this.hostMem_.buffer, clang_dst, size);
    this.mem.check();
    const src = new Uint8Array(this.mem.buffer, memfs_src, size);
    dst.set(src);
  }

  copy_in(memfs_dst, clang_src, size) {
    this.mem.check();
    const dst = new Uint8Array(this.mem.buffer, memfs_dst, size);
    this.hostMem_.check();
    const src = new Uint8Array(this.hostMem_.buffer, clang_src, size);
    dst.set(src);
  }
}

class ToolProcess {
  constructor(module, memfs, name, ...args) {
    this.argv = [name, ...args];
    this.environ = { USER: 'katalyst' };
    this.memfs = memfs;

    const env = {};
    const wasi_unstable = getImportObject(this, [
      'proc_exit',
      'environ_sizes_get',
      'environ_get',
      'args_sizes_get',
      'args_get',
      'random_get',
      'clock_time_get',
      'poll_oneoff',
    ]);
    Object.assign(wasi_unstable, this.memfs.exports);

    this.ready = getInstance(module, { wasi_unstable, env }).then((instance) => {
      this.instance = instance;
      this.exports = this.instance.exports;
      this.mem = new Memory(this.exports.memory);
      this.memfs.hostMem = this.mem;
    });
  }

  async run() {
    await this.ready;
    try {
      this.exports._start();
    } catch (exn) {
      if (exn instanceof ProcExit) {
        if (exn.code === 0) return true;
      }
      throw exn;
    }
    return true;
  }

  proc_exit(code) { throw new ProcExit(code); }

  environ_sizes_get(environ_count_out, environ_buf_size_out) {
    this.mem.check();
    let size = 0;
    const names = Object.getOwnPropertyNames(this.environ);
    for (const name of names) {
      size += name.length + this.environ[name].length + 2;
    }
    this.mem.write64(environ_count_out, names.length);
    this.mem.write64(environ_buf_size_out, size);
    return ESUCCESS;
  }

  environ_get(environ_ptrs, environ_buf) {
    this.mem.check();
    const names = Object.getOwnPropertyNames(this.environ);
    for (const name of names) {
      this.mem.write32(environ_ptrs, environ_buf);
      environ_ptrs += 4;
      environ_buf += this.mem.writeStr(environ_buf, `${name}=${this.environ[name]}`);
    }
    this.mem.write32(environ_ptrs, 0);
    return ESUCCESS;
  }

  args_sizes_get(argc_out, argv_buf_size_out) {
    this.mem.check();
    let size = 0;
    for (const arg of this.argv) size += arg.length + 1;
    this.mem.write64(argc_out, this.argv.length);
    this.mem.write64(argv_buf_size_out, size);
    return ESUCCESS;
  }

  args_get(argv_ptrs, argv_buf) {
    this.mem.check();
    for (const arg of this.argv) {
      this.mem.write32(argv_ptrs, argv_buf);
      argv_ptrs += 4;
      argv_buf += this.mem.writeStr(argv_buf, arg);
    }
    this.mem.write32(argv_ptrs, 0);
    return ESUCCESS;
  }

  random_get(buf, buf_len) {
    const data = new Uint8Array(this.mem.buffer, buf, buf_len);
    for (let i = 0; i < buf_len; ++i) data[i] = (Math.random() * 256) | 0;
    return ESUCCESS;
  }

  clock_time_get(clock_id, precision, time_out) {
    this.mem.check();
    this.mem.write64(time_out, Date.now() * 1000000);
    return ESUCCESS;
  }

  poll_oneoff() {
    return ESUCCESS;
  }
}

class Tar {
  constructor(buffer) {
    this.u8 = new Uint8Array(buffer);
    this.offset = 0;
  }

  readStr(len) {
    const result = readStr(this.u8, this.offset, len);
    this.offset += len;
    return result;
  }

  readOctal(len) {
    return parseInt(this.readStr(len), 8);
  }

  alignUp() {
    this.offset = (this.offset + 511) & ~511;
  }

  readEntry() {
    if (this.offset + 512 > this.u8.length) return null;
    const entry = {
      filename: this.readStr(100),
      mode: this.readOctal(8),
      owner: this.readOctal(8),
      group: this.readOctal(8),
      size: this.readOctal(12),
      mtim: this.readOctal(12),
      checksum: this.readOctal(8),
      type: this.readStr(1),
      linkname: this.readStr(100),
    };
    if (this.readStr(8) !== 'ustar  ') return null;
    entry.ownerName = this.readStr(32);
    entry.groupName = this.readStr(32);
    entry.devMajor = this.readStr(8);
    entry.devMinor = this.readStr(8);
    entry.filenamePrefix = this.readStr(155);
    this.alignUp();

    if (entry.type === '0') {
      entry.contents = this.u8.subarray(this.offset, this.offset + entry.size);
      this.offset += entry.size;
      this.alignUp();
    } else if (entry.type !== '5') {
      assert(false);
    }
    return entry;
  }

  untar(memfs) {
    let entry;
    while ((entry = this.readEntry())) {
      switch (entry.type) {
        case '0':
          memfs.addFile(entry.filename, entry.contents);
          break;
        case '5':
          memfs.addDirectory(entry.filename);
          break;
      }
    }
  }
}

class CompilerAPI {
  constructor(options) {
    this.moduleCache = {};
    this.readBuffer = options.readBuffer;
    this.compileStreaming = options.compileStreaming;
    this.hostWrite = options.hostWrite;
    this.basePath = options.basePath || '/vendor/c-toolchain/';
    this.clangFilename = this.basePath + (options.clang || 'clang');
    this.lldFilename = this.basePath + (options.lld || 'lld');
    this.sysrootFilename = this.basePath + (options.sysroot || 'sysroot.tar');

    this.clangCommonArgs = [
      '-disable-free',
      '-isysroot', '/',
      '-internal-isystem', '/include/c++/v1',
      '-internal-isystem', '/include',
      '-internal-isystem', '/lib/clang/8.0.1/include',
      '-ferror-limit', '19',
      '-fmessage-length', '80',
      '-fcolor-diagnostics',
    ];

    this.memfs = new MemFS({
      compileStreaming: this.compileStreaming,
      hostWrite: this.hostWrite,
      memfsFilename: this.basePath + (options.memfs || 'memfs'),
    });

    this.ready = this.memfs.ready.then(async () => {
      postMessage({ type: 'status', message: 'Extracting sysroot headers and libraries...' });
      const tarBuf = await this.readBuffer(this.sysrootFilename);
      const tar = new Tar(tarBuf);
      tar.untar(this.memfs);
      postMessage({ type: 'status', message: 'Compiler engine initialized.' });
    });
  }

  async getModule(name) {
    if (this.moduleCache[name]) return this.moduleCache[name];
    const simpleName = name.split('/').pop() || name;
    postMessage({ type: 'status', message: `Compiling ${simpleName} WebAssembly binary...` });
    const wasmModule = await this.compileStreaming(name);
    this.moduleCache[name] = wasmModule;
    return wasmModule;
  }

  async compile(options) {
    const { input, contents, obj, language = 'c' } = options;
    await this.ready;
    this.memfs.addFile(input, contents);
    const clang = await this.getModule(this.clangFilename);
    const langFlag = language === 'cpp' ? 'c++' : 'c';
    const proc = new ToolProcess(
      clang,
      this.memfs,
      'clang',
      '-cc1',
      '-emit-obj',
      ...this.clangCommonArgs,
      '-O2',
      '-o',
      obj,
      '-x',
      langFlag,
      input
    );
    return await proc.run();
  }

  async link(obj, wasm) {
    const stackSize = 1024 * 1024; // 1 MB stack
    const maxMemory = 33554432;   // 32 MB linear memory cap
    const libdir = 'lib/wasm32-wasi';
    const crt1 = `${libdir}/crt1.o`;
    await this.ready;
    const lld = await this.getModule(this.lldFilename);
    const proc = new ToolProcess(
      lld,
      this.memfs,
      'wasm-ld',
      '--no-threads',
      '--export-dynamic',
      '-z',
      `stack-size=${stackSize}`,
      `--max-memory=${maxMemory}`,
      `-L${libdir}`,
      crt1,
      obj,
      '-lc',
      '-lc++',
      '-lc++abi',
      '-lcanvas',
      '-o',
      wasm
    );
    return await proc.run();
  }
}

let compilerApi = null;
let diagnosticLogs = '';

async function fetchWithCache(url) {
  if (typeof caches !== 'undefined') {
    try {
      const cache = await caches.open('katalyst-c-toolchain-v1');
      const cached = await cache.match(url);
      if (cached) return cached;
      const res = await fetch(url);
      if (res.ok) {
        await cache.put(url, res.clone());
      }
      return res;
    } catch {
      // Fallback to plain fetch if Cache API fails
    }
  }
  return fetch(url);
}

function initCompiler(basePath = '/vendor/c-toolchain/') {
  if (compilerApi) return compilerApi.ready;
  compilerApi = new CompilerAPI({
    basePath,
    async readBuffer(name) {
      const res = await fetchWithCache(name);
      if (!res.ok) throw new Error(`Failed to fetch ${name}: ${res.statusText}`);
      return res.arrayBuffer();
    },
    async compileStreaming(name) {
      if (WebAssembly.compileStreaming) {
        try {
          const res = await fetchWithCache(name);
          return await WebAssembly.compileStreaming(res);
        } catch {
          // fallback if MIME type or streaming unsupported
        }
      }
      const res = await fetchWithCache(name);
      return WebAssembly.compile(await res.arrayBuffer());
    },
    hostWrite(s) {
      diagnosticLogs += s;
      postMessage({ type: 'compiler_diag', text: s });
    },
  });
  return compilerApi.ready;
}

self.onmessage = async (event) => {
  const { id, type, source, language = 'c', basePath = '/vendor/c-toolchain/' } = event.data;

  if (type === 'init') {
    try {
      await initCompiler(basePath);
      postMessage({ id, type: 'ready' });
    } catch (err) {
      postMessage({ id, type: 'init_error', error: err.message });
    }
    return;
  }

  if (type === 'compile') {
    diagnosticLogs = '';
    const t0 = performance.now();
    try {
      await initCompiler(basePath);
      postMessage({ id, type: 'status', message: 'Compiling C source...' });
      const input = language === 'cpp' ? 'test.cpp' : 'test.c';
      const obj = 'test.o';
      const wasm = 'test.wasm';

      await compilerApi.compile({ input, contents: source, obj, language });
      postMessage({ id, type: 'status', message: 'Linking WebAssembly executable...' });
      await compilerApi.link(obj, wasm);

      const wasmBytes = compilerApi.memfs.getFileContents(wasm);
      const compileTimeMs = Math.round(performance.now() - t0);

      const transferBuffer = wasmBytes.buffer.slice(
        wasmBytes.byteOffset,
        wasmBytes.byteOffset + wasmBytes.byteLength
      );

      postMessage(
        {
          id,
          type: 'compile_success',
          wasmBuffer: transferBuffer,
          compileTimeMs,
          diagnostics: diagnosticLogs,
        },
        [transferBuffer]
      );
    } catch (err) {
      const compileTimeMs = Math.round(performance.now() - t0);
      postMessage({
        id,
        type: 'compile_error',
        error: err.message,
        diagnostics: diagnosticLogs,
        compileTimeMs,
      });
    }
  }
};
