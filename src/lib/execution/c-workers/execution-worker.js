/*
 * execution-worker.js — Isolated runtime worker for compiled C/C++ WebAssembly.
 * Pure JS WASI shim with in-memory stdio, virtual file table, and resource limits.
 * ZERO eval, ZERO new Function, ZERO SharedArrayBuffer.
 */

'use strict';

class ProcExit extends Error {
  constructor(code) {
    super(`process exited with code ${code}.`);
    this.code = code;
  }
}

const DEFAULT_OUTPUT_LIMIT = 64_000;

self.onmessage = async (event) => {
  const { id, type, wasmBuffer, stdin = '', initialFiles = {}, maxOutputBytes = DEFAULT_OUTPUT_LIMIT } = event.data;

  if (type !== 'run') return;

  const t0 = performance.now();
  let stdout = '';
  let stderr = '';
  let outputTruncated = false;
  let stdinPos = 0;
  let memInstance = null;

  function getMem() {
    return new DataView(memInstance.buffer);
  }
  function getU8() {
    return new Uint8Array(memInstance.buffer);
  }

  // Virtual in-memory filesystem
  const files = new Map();
  for (const [k, v] of Object.entries(initialFiles)) {
    files.set(k, typeof v === 'string' ? new TextEncoder().encode(v) : v);
  }

  const openFiles = new Map();
  let nextFd = 4; // 0: stdin, 1: stdout, 2: stderr, 3: preopen dir "."

  const wasi = {
    proc_exit(code) {
      throw new ProcExit(code);
    },

    environ_sizes_get(countPtr, bufSizePtr) {
      getMem().setBigUint64(countPtr, 0n, true);
      getMem().setBigUint64(bufSizePtr, 0n, true);
      return 0;
    },

    environ_get() {
      return 0;
    },

    args_sizes_get(argcPtr, bufSizePtr) {
      getMem().setBigUint64(argcPtr, 1n, true);
      getMem().setBigUint64(bufSizePtr, 10n, true);
      return 0;
    },

    args_get(argvPtrs, argvBuf) {
      getMem().setUint32(argvPtrs, argvBuf, true);
      const name = 'app.wasm\0';
      const u8 = getU8();
      for (let i = 0; i < name.length; i++) {
        u8[argvBuf + i] = name.charCodeAt(i);
      }
      return 0;
    },

    fd_prestat_get(fd, bufPtr) {
      if (fd === 3) {
        const view = getMem();
        view.setUint8(bufPtr, 0); // __WASI_PREOPENTYPE_DIR
        view.setUint32(bufPtr + 4, 1, true); // length of "."
        return 0;
      }
      return 8; // EBADF
    },

    fd_prestat_dir_name(fd, pathPtr) {
      if (fd === 3) {
        getU8()[pathPtr] = '.'.charCodeAt(0);
        return 0;
      }
      return 8;
    },

    fd_fdstat_get(fd, statPtr) {
      const view = getMem();
      if (fd <= 2) {
        view.setUint8(statPtr, 2); // character device (stdin/stdout/stderr)
      } else if (fd === 3) {
        view.setUint8(statPtr, 3); // directory
      } else if (openFiles.has(fd)) {
        view.setUint8(statPtr, 4); // regular file
      } else {
        return 8; // EBADF
      }
      view.setUint16(statPtr + 2, 0, true);
      view.setBigUint64(statPtr + 8, 0xffffffffffffffffn, true);
      view.setBigUint64(statPtr + 16, 0xffffffffffffffffn, true);
      return 0;
    },

    fd_fdstat_set_flags() {
      return 0;
    },

    path_open(fd, dirflags, pathPtr, pathLen, oflags, fs_rights_base, fs_rights_inheriting, fdflags, openedFdPtr) {
      const u8 = getU8();
      let filePath = '';
      for (let i = 0; i < pathLen; i++) filePath += String.fromCharCode(u8[pathPtr + i]);
      filePath = filePath.replace(/^\.\//, '');

      const O_CREAT = 1;
      const O_TRUNC = 8;

      let fileData = files.get(filePath);
      if (!fileData) {
        if (oflags & O_CREAT) {
          fileData = new Uint8Array(0);
          files.set(filePath, fileData);
        } else {
          return 44; // ENOENT
        }
      } else if (oflags & O_TRUNC) {
        fileData = new Uint8Array(0);
        files.set(filePath, fileData);
      }

      const openedFd = nextFd++;
      openFiles.set(openedFd, { path: filePath, offset: 0 });
      getMem().setUint32(openedFdPtr, openedFd, true);
      return 0;
    },

    fd_close(fd) {
      if (openFiles.has(fd)) {
        openFiles.delete(fd);
        return 0;
      }
      return 0;
    },

    fd_seek(fd, offsetLo, offsetHi, whence, newOffsetPtr) {
      const f = openFiles.get(fd);
      if (!f) return 8;
      const fileData = files.get(f.path) || new Uint8Array(0);
      const offset = Number(offsetLo);
      if (whence === 0) f.offset = offset;
      else if (whence === 1) f.offset += offset;
      else if (whence === 2) f.offset = fileData.length + offset;
      getMem().setBigUint64(newOffsetPtr, BigInt(f.offset), true);
      return 0;
    },

    fd_write(fd, iovs, iovsLen, nwrittenPtr) {
      let written = 0;
      const view = getMem();
      const u8 = getU8();

      if (fd === 1 || fd === 2) {
        let text = '';
        for (let i = 0; i < iovsLen; i++) {
          const ptr = view.getUint32(iovs + i * 8, true);
          const len = view.getUint32(iovs + i * 8 + 4, true);
          for (let j = 0; j < len; j++) text += String.fromCharCode(u8[ptr + j]);
          written += len;
        }
        view.setUint32(nwrittenPtr, written, true);

        if (stdout.length + stderr.length + text.length > maxOutputBytes) {
          if (!outputTruncated) {
            outputTruncated = true;
            const remaining = Math.max(0, maxOutputBytes - (stdout.length + stderr.length));
            const chunk = text.slice(0, remaining) + '\n[Output limit reached — truncated]';
            if (fd === 1) {
              stdout += chunk;
              postMessage({ id, type: 'stdout', data: chunk });
            } else {
              stderr += chunk;
              postMessage({ id, type: 'stderr', data: chunk });
            }
          }
          return 0;
        }

        if (fd === 1) {
          stdout += text;
          postMessage({ id, type: 'stdout', data: text });
        } else {
          stderr += text;
          postMessage({ id, type: 'stderr', data: text });
        }
        return 0;
      }

      const f = openFiles.get(fd);
      if (!f) return 8;
      let fileData = files.get(f.path) || new Uint8Array(0);
      for (let i = 0; i < iovsLen; i++) {
        const ptr = view.getUint32(iovs + i * 8, true);
        const len = view.getUint32(iovs + i * 8 + 4, true);
        if (f.offset + len > fileData.length) {
          const newBuf = new Uint8Array(f.offset + len);
          newBuf.set(fileData);
          fileData = newBuf;
          files.set(f.path, fileData);
        }
        fileData.set(u8.subarray(ptr, ptr + len), f.offset);
        f.offset += len;
        written += len;
      }
      view.setUint32(nwrittenPtr, written, true);
      return 0;
    },

    fd_read(fd, iovs, iovsLen, nreadPtr) {
      const view = getMem();
      const u8 = getU8();
      let totalRead = 0;

      if (fd === 0) {
        for (let i = 0; i < iovsLen; i++) {
          const ptr = view.getUint32(iovs + i * 8, true);
          const len = view.getUint32(iovs + i * 8 + 4, true);
          const toCopy = Math.min(len, stdin.length - stdinPos);
          for (let j = 0; j < toCopy; j++) u8[ptr + j] = stdin.charCodeAt(stdinPos + j);
          stdinPos += toCopy;
          totalRead += toCopy;
          if (toCopy < len) break;
        }
        view.setUint32(nreadPtr, totalRead, true);
        return 0;
      }

      const f = openFiles.get(fd);
      if (!f) return 8;
      const fileData = files.get(f.path) || new Uint8Array(0);
      for (let i = 0; i < iovsLen; i++) {
        const ptr = view.getUint32(iovs + i * 8, true);
        const len = view.getUint32(iovs + i * 8 + 4, true);
        const available = Math.max(0, fileData.length - f.offset);
        const toCopy = Math.min(len, available);
        u8.set(fileData.subarray(f.offset, f.offset + toCopy), ptr);
        f.offset += toCopy;
        totalRead += toCopy;
        if (toCopy < len) break;
      }
      view.setUint32(nreadPtr, totalRead, true);
      return 0;
    },

    clock_time_get(id, precision, timeOutPtr) {
      getMem().setBigUint64(timeOutPtr, BigInt(Date.now()) * 1000000n, true);
      return 0;
    },

    random_get(buf, bufLen) {
      const u8 = getU8();
      for (let i = 0; i < bufLen; i++) u8[buf + i] = (Math.random() * 256) | 0;
      return 0;
    },
  };

  try {
    const mod = await WebAssembly.compile(wasmBuffer);
    const instance = await WebAssembly.instantiate(mod, {
      wasi_unstable: wasi,
      wasi_snapshot_preview1: wasi,
    });
    memInstance = instance.exports.memory;

    let exitCode = 0;
    try {
      instance.exports._start();
    } catch (e) {
      if (e instanceof ProcExit) {
        exitCode = e.code;
      } else {
        throw e;
      }
    }

    const durationMs = Math.round(performance.now() - t0);
    const serializedFiles = {};
    for (const [k, v] of files.entries()) {
      serializedFiles[k] = new TextDecoder().decode(v);
    }

    postMessage({
      id,
      type: 'done',
      exitCode,
      stdout,
      stderr,
      durationMs,
      files: serializedFiles,
    });
  } catch (err) {
    const durationMs = Math.round(performance.now() - t0);
    const errorMsg = err instanceof Error ? err.message : String(err);
    postMessage({
      id,
      type: 'error',
      error: errorMsg,
      stdout,
      stderr,
      durationMs,
    });
  }
};
