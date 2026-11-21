import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const targetDir = path.resolve(root, 'public/vendor/c-toolchain');
const sourceWorkerDir = path.resolve(root, 'src/lib/execution/c-workers');

const TOOLCHAIN_FILES = [
  {
    name: 'clang',
    size: 31214472,
    sha256: '2a466f0e990329d3230b869d04fc20803eae96a7feb3a3f6c93e25a77b8aed1d',
    url: 'https://binji.github.io/wasm-clang/clang',
  },
  {
    name: 'lld',
    size: 19490094,
    sha256: '36419ed202011765222098d7701218378b67f634d50f0a4625059ae2c9860f48',
    url: 'https://binji.github.io/wasm-clang/lld',
  },
  {
    name: 'memfs',
    size: 345442,
    sha256: '2c72ee42bd9430029dda8c6bafc9f37143f6fe88d5f1ea950a70259ab748bcfe',
    url: 'https://binji.github.io/wasm-clang/memfs',
  },
  {
    name: 'sysroot.tar',
    size: 9297920,
    sha256: '2435a7b549af30c2be7ec249c405bc2e911ab0c6003012f0909ec3c131bff867',
    url: 'https://binji.github.io/wasm-clang/sysroot.tar',
  },
];

function computeSha256(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function downloadFile(url, destPath, expectedSha256) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const hash = crypto.createHash('sha256');

    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to download ${url}: HTTP ${res.statusCode}`));
          return;
        }

        res.on('data', (chunk) => {
          hash.update(chunk);
          file.write(chunk);
        });

        res.on('end', () => {
          file.end(() => {
            const actualSha256 = hash.digest('hex');
            if (actualSha256 !== expectedSha256) {
              fs.unlinkSync(destPath);
              reject(
                new Error(
                  `SHA-256 mismatch for ${url}: expected ${expectedSha256}, got ${actualSha256}`
                )
              );
            } else {
              resolve();
            }
          });
        });
      })
      .on('error', (err) => {
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        reject(err);
      });
  });
}

async function main() {
  fs.mkdirSync(targetDir, { recursive: true });

  console.log('Synchronizing C WebAssembly toolchain to public/vendor/c-toolchain/ ...');

  // 1. Copy worker scripts from src/lib/execution/c-workers/
  const workerFiles = ['compiler-worker.js', 'execution-worker.js'];
  for (const workerFile of workerFiles) {
    const srcPath = path.join(sourceWorkerDir, workerFile);
    const destPath = path.join(targetDir, workerFile);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`✓ Copied ${workerFile}`);
    }
  }

  // 2. Download / verify binary assets
  for (const item of TOOLCHAIN_FILES) {
    const destPath = path.join(targetDir, item.name);

    if (fs.existsSync(destPath)) {
      const currentSha256 = computeSha256(destPath);
      if (currentSha256 === item.sha256) {
        console.log(`✓ ${item.name} is present and SHA-256 verified.`);
        continue;
      }
      console.log(`Hash mismatch for ${item.name}; re-downloading...`);
    }

    console.log(`Downloading ${item.name} from ${item.url} ...`);
    await downloadFile(item.url, destPath, item.sha256);
    console.log(`✓ ${item.name} downloaded and SHA-256 verified.`);
  }

  // 3. Write metadata manifest
  const manifest = {
    version: '1.0.0',
    provenance: 'wasm-clang (LLVM 8.0.1 / WASI-libc / memfs)',
    files: TOOLCHAIN_FILES.map((f) => ({
      name: f.name,
      size: f.size,
      sha256: f.sha256,
      url: f.url,
    })),
    generatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(path.join(targetDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('✓ C toolchain setup complete in public/vendor/c-toolchain/\n');
}

main().catch((err) => {
  console.error('C toolchain download failed:', err);
  process.exit(1);
});
