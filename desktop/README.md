# KATALYST Desktop Wrapper

This optional Electron shell opens the live KATALYST site at the configured production Vercel `.vercel.app` origin. It does not bundle a second copy of the Next.js app or change the browser-based execution model. The site response keeps the COOP/COEP headers used by `SharedArrayBuffer` and WebAssembly. A custom domain is not required.

## Build and publish a release

Before publishing, install Node.js 22+, GitHub CLI, and Wine on Linux. Sign in to GitHub CLI with permission to publish releases in the public `adithyagoud20/Katalyst` repository, and increment `version` in `package.json` for each release. On Linux, electron-builder uses Wine for the Windows NSIS installer. Windows builds may show SmartScreen warnings until a code-signing certificate is configured.

After deployment, copy the exact production URL from Vercel and set it while building. The URL is embedded in the desktop package, so users do not need an environment variable:

```sh
cd desktop
npm install
KATALYST_APP_URL="https://your-project.vercel.app" KATALYST_SUPABASE_URL="https://your-project.supabase.co" npm run dist
```

The release script builds a Windows NSIS installer plus Linux AppImage and DEB packages, then uploads the artifacts and updater manifests to GitHub Releases. Set `KATALYST_APP_URL` to the production `.vercel.app` origin and `KATALYST_SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`) to the exact Auth project origin before packaging or the build stops with a clear error. The wrapper only permits that specific Supabase host and Google Auth hosts in its embedded windows; other HTTPS links open in the system browser. `electron-updater` checks that public GitHub feed when the packaged app starts. Users need no GitHub token to download updates from a public release.

For publishing, authenticate `gh` with permission to publish releases in `adithyagoud20/Katalyst`, then run `KATALYST_APP_URL="https://your-project.vercel.app" KATALYST_SUPABASE_URL="https://your-project.supabase.co" GH_TOKEN="$(gh auth token)" npm run release`. On Linux, electron-builder uses Wine for the Windows NSIS installer. Windows builds may show SmartScreen warnings until a code-signing certificate is configured. Desktop dependencies are isolated from the Next.js build.
