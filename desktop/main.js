import { app, BrowserWindow, shell, session } from "electron";
import { autoUpdater } from "electron-updater";
import path from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const appDirectory = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(appDirectory, "site-config.json");
let siteConfig;
try {
  siteConfig = JSON.parse(readFileSync(configPath, "utf8"));
} catch {
  throw new Error("Configure desktop/site-config.json with the production .vercel.app URL before starting or packaging the desktop app.");
}
const configuredSiteUrl = siteConfig?.siteUrl;
const APP_URL = new URL(configuredSiteUrl);
if (APP_URL.protocol !== "https:" || !APP_URL.hostname.toLowerCase().endsWith(".vercel.app") || APP_URL.username || APP_URL.password || APP_URL.pathname !== "/" || APP_URL.search || APP_URL.hash) {
  throw new Error("The desktop app must use the production HTTPS .vercel.app origin.");
}
const APP_URL_STRING = APP_URL.toString();
const APP_ORIGIN = new URL(APP_URL).origin;
const SUPABASE_ORIGIN = siteConfig?.supabaseOrigin;
let supabaseOriginUrl;
try {
  supabaseOriginUrl = new URL(SUPABASE_ORIGIN);
} catch {
  throw new Error("The desktop app must use the configured HTTPS Supabase Auth project origin.");
}
if (typeof SUPABASE_ORIGIN !== "string" || supabaseOriginUrl.protocol !== "https:" || !supabaseOriginUrl.hostname.toLowerCase().endsWith(".supabase.co") || supabaseOriginUrl.origin !== SUPABASE_ORIGIN) {
  throw new Error("The desktop app must use the configured HTTPS Supabase Auth project origin.");
}
const GOOGLE_AUTH_HOSTS = new Set(["accounts.google.com", "oauth.googleusercontent.com"]);

function isTrustedAuthUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    return url.protocol === "https:" && (
      GOOGLE_AUTH_HOSTS.has(url.hostname) ||
      url.origin === SUPABASE_ORIGIN
    );
  } catch {
    return false;
  }
}

function canLoadInApp(rawUrl) {
  try {
    const url = new URL(rawUrl);
    return url.protocol === "https:" && (url.origin === APP_ORIGIN || isTrustedAuthUrl(url.href));
  } catch {
    return false;
  }
}

function openExternalHttps(rawUrl) {
  try {
    const url = new URL(rawUrl);
    if (url.protocol === "https:" && url.origin !== APP_ORIGIN) void shell.openExternal(url.href);
  } catch {
    // Ignore malformed URLs and non-web protocols.
  }
}

function guardWebContents(contents) {
  contents.setWindowOpenHandler(({ url }) => {
    if (canLoadInApp(url)) {
      return {
        action: "allow",
        overrideBrowserWindowOptions: {
          width: 520,
          height: 720,
          autoHideMenuBar: true,
          webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            webSecurity: true,
          },
        },
      };
    }
    openExternalHttps(url);
    return { action: "deny" };
  });

  contents.on("will-navigate", (event, url) => {
    if (canLoadInApp(url)) return;
    event.preventDefault();
    openExternalHttps(url);
  });

  contents.on("will-redirect", (event, url, _isInPlace, isMainFrame) => {
    if (!isMainFrame || canLoadInApp(url)) return;
    event.preventDefault();
  });
}

function createWindow() {
  const iconDirectory = app.isPackaged ? path.join(process.resourcesPath, "assets") : path.join(appDirectory, "assets");
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 360,
    minHeight: 560,
    show: false,
    title: "KATALYST",
    icon: path.join(iconDirectory, process.platform === "win32" ? "icon.ico" : "icon.png"),
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      spellcheck: true,
    },
  });

  window.once("ready-to-show", () => window.show());
  window.loadURL(APP_URL_STRING);
  return window;
}

app.setAppUserModelId("in.katalystco.desktop");
app.on("web-contents-created", (_event, contents) => guardWebContents(contents));
session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  if (app.isPackaged) {
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
    setTimeout(() => {
      void autoUpdater.checkForUpdatesAndNotify().catch(() => undefined);
    }, 12_000);
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
