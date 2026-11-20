"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown, ArrowUp, BookOpen, Bot, Check, ChartNoAxesColumnIncreasing, Command, Compass, Copy, Cpu, Download, ExternalLink, FileDown, FileUp,
  FlaskConical, FolderArchive, FolderInput, GraduationCap, House, Menu, MessageSquare, MoreHorizontal, Moon, Palette, PanelLeftClose, PanelLeftOpen, Pencil, Pin, PinOff, Plus, RotateCcw, Search, Settings2, ShieldAlert, ShieldCheck, Sparkles, Sun, Terminal,
  SquarePen, Trash2, User as UserIcon, X,
} from "lucide-react";
import { AssistantMarkdown } from "@/components/assistant-markdown";
import { BrandMark } from "@/components/brand-mark";
import type { PlaygroundRuntimeSelection } from "@/components/c-playground";
import { AdminPanel } from "@/components/admin-panel";
import { SiteContentNotices } from "@/components/site-content-notices";
import type { CreditStatus } from "@/lib/ai-gateway/types";
import { LearningExperience } from "@/components/learning-experience";
import { publishedLearningCourses } from "@/data/curriculum/learning-index";
import type { LearningSection } from "@/lib/learning-model";
import { applicationViewFromPathname, findCourseSlugForLesson, makeApplicationPath, type ApplicationView } from "@/lib/learning-navigation";
import { composeWorkspaceContext, exportSkillMarkdown, MAX_SKILL_CONTEXT_CHARS, parseSkillMarkdown, skillCompatibilityLabels, starterSkills, type WorkspaceSkill } from "@/lib/skills";
import { getDefaultModel, providerCatalog, providerIds, type ModelDiscoveryDiagnostic, type ModelMetadata, type ProviderId } from "@/lib/providers/catalog";
import { DEFAULT_OLLAMA_BASE_URL, MAX_OLLAMA_URL_LENGTH } from "@/lib/providers/constants";
import { getProviderRequestHeaders, type CloudflareRequestMode } from "@/lib/providers/client-request-headers";
import { purgeLegacyStandaloneCredentials } from "@/lib/client-storage-cleanup";
import { readLocalWorkspace, writeLocalWorkspace, type StorageReadResult } from "@/lib/workspace-storage";
import { commitBackupImport, exportConversationBackup, exportProjectBackup, exportShareableConversation, exportWorkspaceBackup, MAX_BACKUP_BYTES, parseBackup, type ImportMode, type WorkspaceChat as Chat, type WorkspaceData, type WorkspaceMessage as Message, type WorkspaceProject as Project } from "@/lib/workspace-portability";
import { AI_ACTIVITY_KEY, readAIActivity, trackAIRequestFinish, trackAIRequestStart, type AIRequestActivity } from "@/lib/ai-activity";
import { deleteConversation, moveConversation, renameConversation, setConversationPinned } from "@/lib/workspace-actions";
import { DEFAULT_USER_PREFERENCES, readUserPreferences, USER_PREFERENCES_KEY, writeUserPreferences, type UserPreferences } from "@/lib/user-preferences";
import {
  ACCOUNT_ACTIVE_KEY, ACCOUNT_GUEST_BACKUP_KEY, ACCOUNT_LOCAL_CHANGE_EVENT, ACCOUNT_MIGRATION_PREFIX,
  type AccountActiveMarker, type AccountSnapshot, emptyAccountSnapshot, hashAccountSnapshot,
  mergeAccountSnapshots, parseAccountSnapshot, readAccountSnapshotFromStorage, writeAccountSnapshotToStorage,
} from "@/lib/account-data";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { readLearningProgress } from "@/lib/learning-progress";
type Status = { defaultProvider: ProviderId; defaultModel: string; providers: Record<ProviderId, { configured: boolean; tokenConfigured?: boolean; accountConfigured?: boolean }>; sharedAi?: { providerId: "cloudflare" | "gemini" | null; configured: boolean } };
type ModelCatalogState = { models: ModelMetadata[]; loading: boolean; error: string; errorKind?: string; selectionIssue?: string; diagnostic?: ModelDiscoveryDiagnostic; refreshedAt?: number; cached?: boolean };
type PricingFilter = "all" | "free" | "paid";
type AppView = ApplicationView;
type SettingsCategory = "account" | "appearance" | "ai-models" | "learning" | "workspace" | "privacy" | "admin";
type InferenceState = Partial<Record<ProviderId, "pending" | "success" | "permission" | "quota" | "network" | "failed">>;
type AccountPhase = "checking" | "unconfigured" | "guest" | "migration" | "active" | "conflict" | "error";
type AccountRemote = { snapshot: AccountSnapshot | null; revision: number; updatedAt: string | null };
type PendingAccountMigration = { userId: string; migrationId: string; expectedRevision: number; snapshot: AccountSnapshot };

function modelOptionLabel(model: ModelMetadata): string {
  const parts = [model.name, model.id];
  const formatPrice = (value: number) => "$" + new Intl.NumberFormat("en-US", { maximumSignificantDigits: 6 }).format(value);
  if (model.pricingStatus === "free") parts.push("Free");
  if (model.pricingStatus === "paid") {
    if (model.pricing?.inputPerMillion !== undefined) parts.push(formatPrice(model.pricing.inputPerMillion) + "/1M input");
    if (model.pricing?.outputPerMillion !== undefined) parts.push(formatPrice(model.pricing.outputPerMillion) + "/1M output");
    if (!model.pricing) parts.push("Paid");
  }
  if (model.pricingStatus === "unknown") parts.push("Pricing unavailable");
  return parts.join(" · ");
}

function readAccountActiveMarker(): AccountActiveMarker | null {
  try {
    const value = JSON.parse(window.localStorage.getItem(ACCOUNT_ACTIVE_KEY) ?? "null") as Partial<AccountActiveMarker> | null;
    if (!value || typeof value.userId !== "string" || !Number.isInteger(value.revision) || typeof value.snapshotHash !== "string") return null;
    return value as AccountActiveMarker;
  } catch { return null; }
}

function readPendingAccountMigration(userId: string): PendingAccountMigration | null {
  try {
    const value = JSON.parse(window.localStorage.getItem(ACCOUNT_MIGRATION_PREFIX + userId) ?? "null") as PendingAccountMigration | null;
    if (!value || value.userId !== userId || typeof value.migrationId !== "string" || !Number.isInteger(value.expectedRevision)) return null;
    return { ...value, snapshot: parseAccountSnapshot(value.snapshot) };
  } catch { return null; }
}

async function readRemoteAccountSnapshot(): Promise<AccountRemote> {
  const response = await fetch("/api/account/snapshot", { cache: "no-store" });
  const body = await response.json() as { snapshot?: unknown; revision?: number; updatedAt?: string | null; error?: string };
  if (!response.ok) throw new Error(body.error ?? "Account data could not be loaded.");
  if (!Number.isInteger(body.revision) || (body.revision ?? -1) < 0) throw new Error("The account service returned an invalid revision.");
  return { snapshot: body.snapshot === null ? null : parseAccountSnapshot(body.snapshot), revision: body.revision!, updatedAt: body.updatedAt ?? null };
}

async function saveRemoteAccountSnapshot(snapshot: AccountSnapshot, expectedRevision: number, migrationId?: string) {
  const response = await fetch("/api/account/snapshot", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ snapshot: parseAccountSnapshot(snapshot), expectedRevision, ...(migrationId ? { migrationId } : {}) }),
  });
  const body = await response.json() as { status?: string; revision?: number; error?: string };
  if (response.status === 409) return { conflict: true as const, revision: body.revision ?? 0 };
  if (!response.ok || !Number.isInteger(body.revision)) throw new Error(body.error ?? "Account data could not be saved. Your local copy remains available.");
  return { conflict: false as const, status: body.status ?? "saved", revision: body.revision! };
}

type SettingsNavItem = {
  id: SettingsCategory;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
};

type SettingsNavGroup = {
  group: string;
  items: SettingsNavItem[];
};

const settingsNavGroups: SettingsNavGroup[] = [
  {
    group: "Learner Preferences",
    items: [
      { id: "account", label: "Account & Profile", icon: UserIcon },
      { id: "appearance", label: "Appearance", icon: Palette },
      { id: "learning", label: "Learning & Workspace", icon: GraduationCap },
    ],
  },
  {
    group: "System & Developer",
    items: [
      { id: "ai-models", label: "AI & Kat", icon: Cpu },
      { id: "workspace", label: "Workspace Data", icon: FolderArchive },
      { id: "privacy", label: "Privacy & Data", icon: ShieldCheck },
    ],
  },
];

const storageKey = "katalyst.workspace.v1";
const starterPrompts = [
  { title: "Make a plan", prompt: "Help me turn this idea into a practical plan." },
  { title: "Explain a concept", prompt: "Explain a technical concept with a concrete example." },
  { title: "Review some code", prompt: "Review this code for correctness and maintainability: " },
];

function safeFileStem(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "katalyst";
}

function downloadText(filename: string, content: string, mimeType: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

function makeProject(name = "My workspace"): Project {
  return { id: crypto.randomUUID(), name, instructions: "", chats: [] };
}

function createDefaultWorkspace(): WorkspaceData {
  return {
    projects: [{ id: "default-project", name: "My workspace", instructions: "", chats: [] }],
    skills: starterSkills,
    provider: "cloudflare",
    models: { cloudflare: "", openai: getDefaultModel("openai"), gemini: getDefaultModel("gemini"), openrouter: getDefaultModel("openrouter"), ollama: "" },
    ollamaBaseUrl: DEFAULT_OLLAMA_BASE_URL,
    activeChatId: null,
  };
}

function emptyStatus(): Status {
  return {
    defaultProvider: "cloudflare",
    defaultModel: "",
    providers: { cloudflare: { configured: false }, openai: { configured: false }, gemini: { configured: false }, openrouter: { configured: false }, ollama: { configured: false } },
    sharedAi: { providerId: null, configured: false },
  };
}

function emptyModelState(provider: ProviderId): ModelCatalogState {
  return { models: [...providerCatalog[provider].models], loading: false, error: "" };
}

function playgroundSelectionFromSearch(search: string): PlaygroundRuntimeSelection | null {
  const params = new URLSearchParams(search);
  const lang = params.get("lang")?.toLowerCase();
  const circuitModes: Record<string, PlaygroundRuntimeSelection["circuitMode"]> = {
    arduino: "arduino", esp32: "esp32", breadboard: "breadboard", digital: "digital",
  };
  if (lang && circuitModes[lang]) return { language: "circuit", mode: "circuits", circuitMode: circuitModes[lang], launcherOpen: false };
  const languages: Record<string, PlaygroundRuntimeSelection["language"]> = {
    c: "c", cpp: "cpp", python: "python", js: "javascript", javascript: "javascript", sql: "sql", html: "html",
  };
  const language = lang ? languages[lang] : undefined;
  return language ? { language, mode: "code", circuitMode: "digital", launcherOpen: false } : null;
}

function playgroundRouteLanguage(selection: PlaygroundRuntimeSelection | null): string | undefined {
  if (!selection) return undefined;
  if (selection.language === "circuit") return selection.circuitMode;
  return selection.language === "javascript" ? "js" : selection.language;
}

function createInitialModelCatalogs(): Record<ProviderId, ModelCatalogState> {
  return Object.fromEntries(providerIds.map((provider) => [provider, emptyModelState(provider)])) as Record<ProviderId, ModelCatalogState>;
}

export function Workspace({ initialView, initialLessonId }: { initialView?: AppView; initialLessonId?: string } = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const [data, setData] = useState<WorkspaceData>(createDefaultWorkspace);
  const [ready, setReady] = useState(false);
  const [storageRecovery, setStorageRecovery] = useState<StorageReadResult | { kind: "unavailable"; issue: string } | null>(null);
  const [storageRecoveryRaw, setStorageRecoveryRaw] = useState<string | null>(null);
  const [originalRecordDownloadStarted, setOriginalRecordDownloadStarted] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);
  const [modelCatalogs, setModelCatalogs] = useState<Record<ProviderId, ModelCatalogState>>(createInitialModelCatalogs);
  const [sessionKeys, setSessionKeys] = useState<Record<ProviderId, string>>({ cloudflare: "", openai: "", gemini: "", openrouter: "", ollama: "" });
  const [sessionKeyDrafts, setSessionKeyDrafts] = useState<Record<ProviderId, string>>({ cloudflare: "", openai: "", gemini: "", openrouter: "", ollama: "" });
  const [sessionCloudflareAccountId, setSessionCloudflareAccountId] = useState("");
  const [cloudflareMode, setCloudflareMode] = useState<CloudflareRequestMode>("platform");
  const [visibleKeys, setVisibleKeys] = useState<Record<ProviderId, boolean>>({ cloudflare: false, openai: false, gemini: false, openrouter: false, ollama: false });
  const [modelSearch, setModelSearch] = useState("");
  const [pricingFilter, setPricingFilter] = useState<PricingFilter>("all");
  const [activeProjectId, setActiveProjectId] = useState("");
  const [view, setViewState] = useState<AppView>(() => initialView ?? applicationViewFromPathname(pathname) ?? "home");
  const [settingsCategory, setSettingsCategory] = useState<SettingsCategory>("appearance");
  const [activityFilter, setActivityFilter] = useState<ProviderId | "all">("all");
  const [aiSystem, setAiSystem] = useState<{ sharedAiEnabled: boolean; killSwitchActive: boolean } | null>(null);
  const [katModelId, setKatModelId] = useState("");
  const [katProviderId, setKatProviderId] = useState<"cloudflare" | "gemini" | "">("");
  const [inferenceState, setInferenceState] = useState<InferenceState>({});
  const [routeLessonId, setRouteLessonId] = useState(initialLessonId ?? "");
  const [skillTab, setSkillTab] = useState<"installed" | "available">("installed");
  const [skillSearch, setSkillSearch] = useState("");
  const [backupMode, setBackupMode] = useState<ImportMode>("merge");
  const [backupImportError, setBackupImportError] = useState("");
  const [backupImportSuccess, setBackupImportSuccess] = useState("");
  const [storageError, setStorageError] = useState("");
  const [selectedProjectExportId, setSelectedProjectExportId] = useState("");
  const [selectedConversationExportId, setSelectedConversationExportId] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [smallScreen, setSmallScreen] = useState(false);
  const [mobileHeaderCollapsed, setMobileHeaderCollapsed] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarPreferenceReady, setSidebarPreferenceReady] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES);
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [preferencesWritable, setPreferencesWritable] = useState(false);
  const [preferencesIssue, setPreferencesIssue] = useState("");
  const [accountPhase, setAccountPhase] = useState<AccountPhase>("checking");
  const [accountConfigured, setAccountConfigured] = useState(false);
  const [accountUser, setAccountUser] = useState<User | null>(null);
  const accountUserId = accountUser?.id;
  const [accountRemote, setAccountRemote] = useState<AccountRemote | null>(null);
  const [accountError, setAccountError] = useState("");
  const [signInPromptDismissed, setSignInPromptDismissed] = useState(false);
  const [signInPromptReady, setSignInPromptReady] = useState(false);
  const [playgroundSelection, setPlaygroundSelection] = useState<PlaygroundRuntimeSelection | null>(null);
  const [accountSyncState, setAccountSyncState] = useState<"synced" | "pending" | "error">("synced");
  const [accountPreferenceSource, setAccountPreferenceSource] = useState<"account" | "guest">("account");
  const [accountDeleteOpen, setAccountDeleteOpen] = useState(false);
  const [accountDeletePhrase, setAccountDeletePhrase] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [creditStatus, setCreditStatus] = useState<CreditStatus | null>(null);
  const [quotaNotice, setQuotaNotice] = useState<{ code: string; message: string; requiresSignIn?: boolean; resetDate?: string } | null>(null);
  const accountClient = useMemo(() => createSupabaseBrowserClient(), []);
  const currentWorkspaceRef = useRef(data);
  const currentPreferencesRef = useRef(preferences);
  currentWorkspaceRef.current = data;
  currentPreferencesRef.current = preferences;

  useEffect(() => {
    if (!ready || accountPhase !== "guest" || accountUser) {
      setSignInPromptReady(false);
      return;
    }
    const timer = window.setTimeout(() => setSignInPromptReady(true), 60_000);
    return () => window.clearTimeout(timer);
  }, [ready, accountPhase, accountUser]);
  const [conversationMenu, setConversationMenu] = useState<{ chatId: string; mode: "actions" | "move" } | null>(null);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingChatTitle, setEditingChatTitle] = useState("");
  const [conversationStatus, setConversationStatus] = useState("");
  const [prompt, setPrompt] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [conversationSearch, setConversationSearch] = useState("");
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);
  const [importError, setImportError] = useState("");
  const [cloudflareInferenceTestMessage, setCloudflareInferenceTestMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const backupFileRef = useRef<HTMLInputElement>(null);
  const requestControllerRef = useRef<AbortController | null>(null);
  const persistedSnapshotRef = useRef<string | null>(null);
  const selectedModelIdsRef = useRef(data.models);
  selectedModelIdsRef.current = data.models;
  const retryRequestRef = useRef<null | {
    projectId: string;
    chatId: string;
    messages: Message[];
    context?: string;
    provider: ProviderId;
    model: string;
    cloudflareMode: CloudflareRequestMode;
    sessionKey: string;
    cloudflareAccountId: string;
    ollamaBaseUrl: string;
  }>(null);

  const setView = useCallback((nextView: AppView, lessonId?: string) => {
    const contextLessonId = lessonId ?? ((nextView === "playground" || nextView === "tutor") ? routeLessonId || undefined : undefined);
    const courseSlug = nextView === "lesson" ? findCourseSlugForLesson(publishedLearningCourses, contextLessonId) : undefined;
    const nextPath = makeApplicationPath(nextView, {
      lessonId: contextLessonId,
      courseSlug,
      lang: nextView === "playground" ? playgroundRouteLanguage(playgroundSelection) : undefined,
    });
    setViewState(nextView);
    setRouteLessonId(contextLessonId ?? "");
    if (`${window.location.pathname}${window.location.search}` !== nextPath) router.push(nextPath, { scroll: false });
  }, [playgroundSelection, routeLessonId, router]);

  const updatePlaygroundSelection = useCallback((selection: PlaygroundRuntimeSelection) => {
    setPlaygroundSelection(selection);
    const nextPath = makeApplicationPath("playground", {
      lessonId: routeLessonId || undefined,
      lang: playgroundRouteLanguage(selection),
    });
    if (window.location.pathname === "/playground" && `${window.location.pathname}${window.location.search}` !== nextPath) {
      router.replace(nextPath, { scroll: false });
    }
  }, [routeLessonId, router]);

  const openSettings = (category?: SettingsCategory | "providers" | "models" | "usage-credits") => {
    if (category) {
      if (category === "providers" || category === "models" || category === "usage-credits") {
        setSettingsCategory("ai-models");
      } else {
        setSettingsCategory(category);
      }
    }
    setView("settings");
  };

  const refreshAiSession = useCallback(async () => {
    try {
      const res = await fetch("/api/ai/session");
      if (res.ok) {
        const data = await res.json();
        setIsAdmin(Boolean(data.isAdmin));
        setCreditStatus(data.creditStatus);
        if (data.system) setAiSystem(data.system);
      }
    } catch {
      // Keep existing memory state
    }
  }, []);

  useEffect(() => {
    void refreshAiSession();
    const handleRefresh = () => { void refreshAiSession(); };
    window.addEventListener("katalyst:refresh-ai-session", handleRefresh);
    return () => window.removeEventListener("katalyst:refresh-ai-session", handleRefresh);
  }, [refreshAiSession, accountUser]);

  useEffect(() => {
    const restoreRoute = () => {
      const nextView = applicationViewFromPathname(window.location.pathname);
      if (!nextView) return;
      setViewState(nextView);
      const search = new URLSearchParams(window.location.search);
      const nextLessonId = search.get("lesson") ?? "";
      setRouteLessonId(nextLessonId);
      const directPlaygroundSelection = nextView === "playground"
        ? playgroundSelectionFromSearch(window.location.search)
        : null;
      setPlaygroundSelection(directPlaygroundSelection);
      setMobileNav(false);
    };
    restoreRoute();
    window.addEventListener("popstate", restoreRoute);
    return () => window.removeEventListener("popstate", restoreRoute);
  }, [pathname]);

  const loadModels = useCallback(async (provider: ProviderId, refresh = false, sessionKey = "", ollamaBaseUrl = "", cloudflareAccountId = "") => {
    setModelCatalogs((current) => ({ ...current, [provider]: { ...current[provider], loading: true, error: "" } }));
    try {
      const query = new URLSearchParams({ provider, ...(refresh ? { refresh: "true" } : {}), ...(provider === "cloudflare" ? { mode: cloudflareMode } : {}) });
      const response = await fetch(`/api/models?${query.toString()}`, {
        cache: "no-store",
        headers: {
          ...getProviderRequestHeaders({ provider, sessionKey, cloudflareMode, cloudflareAccountId, ollamaBaseUrl: ollamaBaseUrl.trim() || DEFAULT_OLLAMA_BASE_URL }),
        },
      });
      const result = await response.json() as { models?: ModelMetadata[]; refreshedAt?: number; cached?: boolean; diagnostic?: ModelDiscoveryDiagnostic; error?: string; errorKind?: string };
      if (!response.ok || !Array.isArray(result.models)) {
        const requestError = new Error(result.error ?? `Could not load ${providerCatalog[provider].name} models.`) as Error & { httpStatus?: number; providerErrorKind?: string };
        requestError.httpStatus = response.status;
        requestError.providerErrorKind = result.errorKind;
        throw requestError;
      }
      const availableModels = result.models ?? [];
      const currentModel = selectedModelIdsRef.current[provider];
      const selectionIssue = currentModel && !availableModels.some((model) => model.id === currentModel)
        ? `The selected model is no longer available from ${providerCatalog[provider].name}. Choose a listed model explicitly.`
        : undefined;
      setModelCatalogs((current) => ({ ...current, [provider]: { models: availableModels, loading: false, error: "", selectionIssue, diagnostic: result.diagnostic, refreshedAt: result.refreshedAt, cached: result.cached } }));
      if (selectionIssue) setData((current) => current.models[provider] === currentModel
        ? { ...current, models: { ...current.models, [provider]: "" } }
        : current);
    } catch (loadError) {
      const statusCode = loadError instanceof Error ? (loadError as Error & { httpStatus?: number }).httpStatus : undefined;
      const providerKind = loadError instanceof Error ? (loadError as Error & { providerErrorKind?: string }).providerErrorKind : undefined;
      const errorKind = providerKind === "configuration" ? "Configuration required"
        : providerKind === "authentication" ? "Authentication failed"
          : providerKind === "permission" ? "Permission denied"
            : providerKind === "account" ? "Cloudflare account/API error"
              : providerKind === "timeout" ? "Request timed out"
                : providerKind === "network" ? "Network error"
                  : providerKind === "invalid-response" ? "Invalid provider response"
                    : providerKind === "rate-limit" ? "Rate limit reached"
        : statusCode === 401 || statusCode === 403 ? "Authentication or permission failed"
        : statusCode === 429 ? "Quota or rate limit reached"
          : statusCode && statusCode >= 500 || !statusCode ? "Network or provider failure"
            : "Configuration or model issue";
      setModelCatalogs((current) => ({ ...current, [provider]: { ...current[provider], loading: false, error: loadError instanceof Error ? loadError.message : "Could not load models.", errorKind } }));
    }
  }, [cloudflareMode]);

  const updateSessionKey = (provider: ProviderId, key: string) => {
    const savedKey = key.slice(0, 2_048);
    setSessionKeys((current) => ({ ...current, [provider]: savedKey }));
    setSessionKeyDrafts((current) => ({ ...current, [provider]: savedKey }));
    if (providerCatalog[provider].dynamicModels) {
      setModelCatalogs((current) => ({ ...current, [provider]: { ...emptyModelState(provider), error: "" } }));
      setData((current) => ({ ...current, models: { ...current.models, [provider]: "" } }));
    }
  };

  const updateSessionKeyDraft = (provider: ProviderId, key: string) => {
    setSessionKeyDrafts((current) => ({ ...current, [provider]: key.slice(0, 2_048) }));
  };

  const updateCloudflareAccountId = (accountId: string) => {
    setSessionCloudflareAccountId(accountId.slice(0, 128));
    setModelCatalogs((current) => ({ ...current, cloudflare: { ...emptyModelState("cloudflare"), error: "" } }));
    setData((current) => ({ ...current, models: { ...current.models, cloudflare: "" } }));
  };

  const refreshProviderModels = (provider: ProviderId) => {
    const draftKey = sessionKeyDrafts[provider].trim();
    if (provider !== "ollama" && draftKey !== sessionKeys[provider].trim()) updateSessionKey(provider, draftKey);
    void loadModels(provider, true, draftKey, data.ollamaBaseUrl || DEFAULT_OLLAMA_BASE_URL, sessionCloudflareAccountId);
  };

  const testCloudflareInference = async () => {
    if (inferenceState.cloudflare === "pending") return;
    const model = data.models.cloudflare;
    if (!model || !modelCatalogs.cloudflare.models.some((entry) => entry.id === model)) {
      setCloudflareInferenceTestMessage("Refresh the Cloudflare catalog and select one of its listed models first.");
      return;
    }
    const draftKey = sessionKeyDrafts.cloudflare.trim();
    const sessionKey = draftKey === sessionKeys.cloudflare.trim() ? sessionKeys.cloudflare.trim() : draftKey;
    setInferenceState((current) => ({ ...current, cloudflare: "pending" }));
    setCloudflareInferenceTestMessage("Sending a real request to the selected Cloudflare model. This may use account quota.");
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getProviderRequestHeaders({ provider: "cloudflare", sessionKey, cloudflareMode, cloudflareAccountId: sessionCloudflareAccountId }),
        },
        body: JSON.stringify({ provider: "cloudflare", model, cloudflareMode, messages: [{ role: "user", content: "Reply with only: OK." }] }),
      });
      const result = await response.json() as { text?: string; error?: string; errorKind?: string };
      if (!response.ok) {
        const requestError = new Error(result.error ?? "Cloudflare could not complete the inference test.") as Error & { providerErrorKind?: string };
        requestError.providerErrorKind = result.errorKind;
        throw requestError;
      }
      if (typeof result.text !== "string" || !result.text.trim()) throw new Error("Cloudflare returned an empty answer. The inference test did not succeed.");
      setInferenceState((current) => ({ ...current, cloudflare: "success" }));
      setCloudflareInferenceTestMessage(`Inference succeeded using ${model}.`);
    } catch (testError) {
      const kind = testError instanceof Error ? (testError as Error & { providerErrorKind?: string }).providerErrorKind : undefined;
      const nextState = kind === "authentication" || kind === "permission" ? "permission"
        : kind === "rate-limit" || kind === "account" ? "quota"
          : kind === "network" || kind === "timeout" ? "network"
            : "failed";
      setInferenceState((current) => ({ ...current, cloudflare: nextState }));
      setCloudflareInferenceTestMessage(testError instanceof Error ? testError.message : "Cloudflare inference failed. Check the provider settings and try again.");
    }
  };

  const updateOllamaBaseUrl = (baseUrl: string) => {
    setData((current) => ({ ...current, ollamaBaseUrl: baseUrl.slice(0, MAX_OLLAMA_URL_LENGTH), models: { ...current.models, ollama: "" } }));
    setModelCatalogs((current) => ({ ...current, ollama: emptyModelState("ollama") }));
  };

  useEffect(() => {
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(storageKey);
    } catch {
      setStorageRecovery({ kind: "unavailable", issue: "Browser storage could not be read. KATALYST has not overwritten the saved workspace. Check browser privacy settings or try again." });
      setReady(true);
      void fetch("/api/status", { cache: "no-store" }).then((response) => response.json()).then(setStatus).catch(() => setStatus(emptyStatus()));
      return;
    }
    const result = readLocalWorkspace(raw);
    const initialProvider = result.kind === "valid" ? result.workspace.provider : "cloudflare";
    const initialOllamaUrl = result.kind === "valid" ? result.workspace.ollamaBaseUrl || DEFAULT_OLLAMA_BASE_URL : DEFAULT_OLLAMA_BASE_URL;
    if (result.kind === "valid") {
      setData(result.workspace);
      persistedSnapshotRef.current = JSON.stringify(result.workspace);
      const activeProject = result.workspace.projects.find((project) => project.chats.some((chat) => chat.id === result.workspace.activeChatId)) ?? result.workspace.projects[0];
      setActiveProjectId(activeProject?.id ?? "default-project");
      setStorageRecovery(null);
    } else if (result.kind === "missing") {
      persistedSnapshotRef.current = null;
      setActiveProjectId("default-project");
      setStorageRecovery(null);
    } else {
      setStorageRecovery(result);
      setStorageRecoveryRaw(raw);
    }
    setReady(true);
    fetch("/api/status", { cache: "no-store" }).then((response) => response.json()).then((statusResult: Status) => {
      setStatus(statusResult);
      if (result.kind === "missing") setData((current) => ({
        ...current,
        provider: statusResult.defaultProvider,
        models: { ...current.models, ...(statusResult.defaultModel ? { [statusResult.defaultProvider]: statusResult.defaultModel } : {}) },
      }));
      for (const provider of providerIds) {
        if (provider !== "cloudflare" && (provider === "openai" || statusResult.providers[provider]?.configured || (provider === "ollama" && (initialProvider === "ollama" || statusResult.defaultProvider === "ollama")))) {
          void loadModels(provider, false, "", initialOllamaUrl, "");
        }
      }
    }).catch(() => setStatus(emptyStatus()));
  // Initialize browser-only state once.
  }, [loadModels]);

  useEffect(() => {
    if (!ready || (storageRecovery && storageRecovery.kind !== "valid" && storageRecovery.kind !== "missing")) return;
    try {
      const snapshot = JSON.stringify(data);
      if (persistedSnapshotRef.current === snapshot) return;
      writeLocalWorkspace(window.localStorage, storageKey, data);
      persistedSnapshotRef.current = snapshot;
      setStorageError("");
      window.dispatchEvent(new Event(ACCOUNT_LOCAL_CHANGE_EVENT));
    } catch (error) {
      if (error instanceof DOMException && error.name === "SecurityError") {
        setStorageError("Browser storage is unavailable. KATALYST kept the previous saved workspace and this session’s changes in memory; export a backup after storage access is restored.");
        return;
      }
      if (error instanceof Error && error.message.includes("8 MB")) {
        setStorageError(error.message);
        return;
      }
      setStorageError("Browser storage could not save the latest workspace change. Export a backup and free browser storage space before continuing.");
    }
  }, [data, ready, storageRecovery]);

  const activeProject = data.projects.find((project) => project.id === activeProjectId) ?? data.projects[0];
  const activeChat = activeProject?.chats.find((chat) => chat.id === data.activeChatId) ?? null;
  const enabledSkills = useMemo(() => data.skills.filter((skill) => skill.enabled), [data.skills]);
  const selectedProvider = providerCatalog[data.provider];
  const modelState = modelCatalogs[data.provider];
  const selectedModel = modelState.models.find((model) => model.id === data.models[data.provider]);
  const sharedKatMode = data.provider === "cloudflare" && cloudflareMode === "platform";
  const learningModel = sharedKatMode ? katModelId : data.models[data.provider];

  useEffect(() => {
    if (!sharedKatMode || (view !== "tutor" && view !== "lesson")) {
      if (!sharedKatMode) { setKatModelId(""); setKatProviderId(""); }
      return;
    }
    setKatModelId("");
    setKatProviderId("");
    let active = true;
    void fetch("/api/ai/kat-model", { cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<{ modelId?: string; providerId?: string }> : Promise.reject(new Error("Kat model unavailable")))
      .then((result) => {
        if (!active) return;
        setKatModelId(typeof result.modelId === "string" ? result.modelId : "");
        setKatProviderId(result.providerId === "gemini" || result.providerId === "cloudflare" ? result.providerId : "");
      })
      .catch(() => { if (active) { setKatModelId(""); setKatProviderId(""); } });
    return () => { active = false; };
  }, [sharedKatMode, view]);
  const providerCredentialPresent = (providerId: ProviderId) => providerId === "ollama" ? false
    : providerId === "cloudflare"
      ? cloudflareMode === "byok"
        ? Boolean(sessionKeys.cloudflare.trim() && sessionCloudflareAccountId.trim())
        : Boolean(status?.providers.cloudflare?.configured)
      : Boolean(sessionKeys[providerId].trim()) || (status?.providers[providerId]?.configured ?? false);
  const providerConfigured = data.provider === "ollama"
    ? modelState.models.length > 0
    : data.provider === "openrouter"
      ? providerCredentialPresent("openrouter") || data.models.openrouter === "openrouter/free"
      : sharedKatMode
        ? Boolean(status?.sharedAi?.configured && aiSystem?.sharedAiEnabled && !aiSystem?.killSwitchActive && katModelId)
        : providerCredentialPresent(data.provider);
  const isProviderConfigured = (providerId: ProviderId) => providerId === "ollama"
    ? modelCatalogs.ollama.models.length > 0
    : providerId === "openrouter"
      ? providerCredentialPresent("openrouter") || data.models.openrouter === "openrouter/free"
      : providerCredentialPresent(providerId);
  const visibleModels = modelState.models.filter((model) => {
    const searchMatch = `${model.name} ${model.id} ${model.namespace ?? ""} ${model.description ?? ""}`.toLowerCase().includes(modelSearch.toLowerCase());
    const priceMatch = data.provider === "ollama" || pricingFilter === "all" || model.pricingStatus === pricingFilter;
    return searchMatch && priceMatch;
  });
  const displayedModels = visibleModels.slice(0, 150);
  const projectForExport = data.projects.find((project) => project.id === selectedProjectExportId) ?? activeProject;
  const conversationForExport = projectForExport?.chats.find((chat) => chat.id === selectedConversationExportId) ?? projectForExport?.chats[0];
  const filteredSkills = data.skills.filter((skill) => `${skill.name} ${skill.description} ${skill.sourceName ?? ""} ${skill.author ?? ""} ${skill.license ?? ""} ${skill.metadata ? Object.values(skill.metadata).join(" ") : ""}`.toLowerCase().includes(skillSearch.trim().toLowerCase()));
  const searchableConversations = useMemo(() => {
    const query = conversationSearch.trim().toLowerCase();
    return data.projects.flatMap((project) => project.chats.map((chat) => ({ project, chat })))
      .filter(({ project, chat }) => !query || `${project.name} ${chat.title} ${chat.messages.map((message) => message.content).join(" ")}`.toLowerCase().includes(query))
      .sort((a, b) => Number(Boolean(b.chat.pinned)) - Number(Boolean(a.chat.pinned)) || b.chat.updatedAt - a.chat.updatedAt)
      .slice(0, 50);
  }, [conversationSearch, data.projects]);

  const workspaceDashboardSummary = useMemo(() => {
    const conversations = data.projects.flatMap((project) => project.chats.map((chat) => ({ title: chat.title, projectName: project.name, updatedAt: chat.updatedAt, pinned: Boolean(chat.pinned) })));
    conversations.sort((a, b) => b.updatedAt - a.updatedAt);
    return {
      projectCount: data.projects.length,
      conversationCount: conversations.length,
      recentConversations: conversations.slice(0, 5),
      pinnedConversations: conversations.filter((conversation) => conversation.pinned).slice(0, 5),
    };
  }, [data.projects]);

  const showConversationStatus = (message: string) => {
    setConversationStatus(message);
    window.setTimeout(() => setConversationStatus((current) => current === message ? "" : current), 4_000);
  };

  const saveConversationTitle = (chatId: string) => {
    const title = editingChatTitle.trim();
    if (!title) {
      showConversationStatus("Conversation titles cannot be empty.");
      return;
    }
    setData((current) => renameConversation(current, chatId, title));
    setEditingChatId(null);
    setEditingChatTitle("");
    setConversationMenu(null);
    showConversationStatus("Conversation renamed.");
  };

  const confirmDeleteConversation = (chat: Chat) => {
    if (!window.confirm(`Delete “${chat.title || "Untitled conversation"}”? This removes its messages from this browser.`)) return;
    setData((current) => deleteConversation(current, chat.id));
    if (chat.id === data.activeChatId) setView("workspace");
    setConversationMenu(null);
    showConversationStatus("Conversation deleted from this browser.");
  };

  const moveChatToProject = (chat: Chat, targetProject: Project) => {
    try {
      setData((current) => moveConversation(current, chat.id, targetProject.id));
      setActiveProjectId(targetProject.id);
      setConversationMenu(null);
      showConversationStatus(`Moved conversation to ${targetProject.name}.`);
    } catch (moveError) {
      showConversationStatus(moveError instanceof Error ? moveError.message : "Could not move this conversation.");
    }
  };

  const shareConversation = (chat: Chat) => {
    try {
      downloadText(`${safeFileStem(chat.title)}-conversation.md`, exportShareableConversation(chat), "text/markdown;charset=utf-8");
      setConversationMenu(null);
      showConversationStatus("Shareable conversation export downloaded. It contains the visible transcript only.");
    } catch (shareError) {
      showConversationStatus(shareError instanceof Error ? shareError.message : "Could not export this conversation.");
    }
  };

  const renderConversationRow = ({ project, chat }: { project: Project; chat: Chat }) => {
    const menuOpen = conversationMenu?.chatId === chat.id;
    const active = activeChat?.id === chat.id;
    const selectConversation = () => {
      setActiveProjectId(project.id);
      setData((current) => ({ ...current, activeChatId: chat.id }));
      setView("workspace");
      setMobileNav(false);
      setConversationMenu(null);
    };

    return <div key={`${project.id}-${chat.id}`} className={`chat-row ${active ? "chat-row-active" : ""}`}>
      {editingChatId === chat.id ? <form className="chat-rename-form" onSubmit={(event) => { event.preventDefault(); saveConversationTitle(chat.id); }}>
        <input aria-label={`Rename ${chat.title}`} autoFocus maxLength={200} value={editingChatTitle} onChange={(event) => setEditingChatTitle(event.target.value)} />
        <button type="submit" aria-label="Save conversation name"><Check size={13} /></button>
        <button type="button" aria-label="Cancel rename" onClick={() => { setEditingChatId(null); setEditingChatTitle(""); }}><X size={13} /></button>
      </form> : <>
        <button className={`chat-link ${active ? "chat-active" : ""}`} onClick={selectConversation}>
          {chat.pinned ? <Pin size={13} aria-label="Pinned" /> : <MessageSquare size={14} />}
          <span>{chat.title || "Untitled conversation"}</span>
        </button>
        <button className="chat-more" aria-label={`Actions for ${chat.title || "Untitled conversation"}`} aria-expanded={menuOpen} onClick={() => setConversationMenu((current) => current?.chatId === chat.id ? null : { chatId: chat.id, mode: "actions" })}><MoreHorizontal size={15} /></button>
        {menuOpen && <div className="chat-row-menu" aria-label={`Actions for ${chat.title || "Untitled conversation"}`}>
          <button onClick={() => { setEditingChatId(chat.id); setEditingChatTitle(chat.title); setConversationMenu(null); }}><Pencil size={13} />Rename</button>
          <button onClick={() => setConversationMenu((current) => current?.chatId === chat.id ? { ...current, mode: current.mode === "move" ? "actions" : "move" } : current)} aria-expanded={conversationMenu?.mode === "move"}><FolderInput size={13} />Move to project</button>
          {conversationMenu?.mode === "move" && <div className="chat-move-targets" aria-label="Choose a project">{data.projects.filter((target) => target.id !== project.id).map((target) => <button key={target.id} onClick={() => moveChatToProject(chat, target)}>{target.name}</button>)}{data.projects.length < 2 && <span>Create another project to move this conversation.</span>}</div>}
          <button onClick={() => shareConversation(chat)}><Download size={13} />Share / export</button>
          <button onClick={() => { const next = !chat.pinned; setData((current) => setConversationPinned(current, chat.id, next)); setConversationMenu(null); showConversationStatus(next ? "Conversation pinned." : "Conversation unpinned."); }}>{chat.pinned ? <PinOff size={13} /> : <Pin size={13} />}{chat.pinned ? "Unpin" : "Pin"}</button>
          <button className="chat-delete-action" onClick={() => confirmDeleteConversation(chat)}><Trash2 size={13} />Delete</button>
        </div>}
      </>}
    </div>;
  };

  const createChat = useCallback((project = activeProject) => {
    if (!project) return;
    const chat: Chat = { id: crypto.randomUUID(), title: "New conversation", messages: [], updatedAt: Date.now() };
    setData((current) => ({ ...current, activeChatId: chat.id, projects: current.projects.map((item) => item.id === project.id ? { ...item, chats: [chat, ...item.chats] } : item) }));
    setView("workspace");
    setMobileNav(false);
    window.setTimeout(() => textareaRef.current?.focus(), 50);
  }, [activeProject, setView]);

  const createProject = () => {
    const project = makeProject(`Workspace ${data.projects.length + 1}`);
    setData((current) => ({ ...current, projects: [project, ...current.projects], activeChatId: null }));
    setActiveProjectId(project.id);
    setView("workspace");
    setMobileNav(false);
  };

  const requestAssistantResponse = async (request: NonNullable<typeof retryRequestRef.current>) => {
    const controller = new AbortController();
    requestControllerRef.current = controller;
    retryRequestRef.current = request;
    const activityId = trackAIRequestStart(request.provider, request.model);
    setError("");
    setPending(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...getProviderRequestHeaders({ provider: request.provider, sessionKey: request.sessionKey, cloudflareMode: request.cloudflareMode, cloudflareAccountId: request.cloudflareAccountId, ollamaBaseUrl: request.ollamaBaseUrl }),
        },
        body: JSON.stringify({
          provider: request.provider,
          model: request.model,
          ...(request.provider === "cloudflare" ? { cloudflareMode: request.cloudflareMode } : {}),
          assistantSurface: "workspace",
          messages: request.messages.slice(-20).map(({ role, content }) => ({ role, content })),
          ...(request.context ? { context: request.context } : {}),
        }),
      });
      const result = await response.json() as {
        text?: string;
        provider?: ProviderId;
        model?: string;
        usage?: Message["usage"];
        creditsRemaining?: number;
        error?: string;
        code?: string;
        requiresSignIn?: boolean;
        resetDate?: string;
      };
      if (!response.ok) {
        if (result.code === "GUEST_TRIAL_EXHAUSTED" || result.code === "MONTHLY_QUOTA_EXHAUSTED" || result.code === "KILL_SWITCH_ACTIVE") {
          setQuotaNotice({
            code: result.code,
            message: result.error ?? "AI credit quota reached.",
            requiresSignIn: result.requiresSignIn,
            resetDate: result.resetDate,
          });
        }
        throw new Error(result.error ?? "The model could not answer this request.");
      }
      setQuotaNotice(null);
      if (result.creditsRemaining !== undefined) {
        setCreditStatus((prev) => prev ? ({ ...prev, ...(prev.isGuest ? { trialCreditsRemaining: result.creditsRemaining } : { creditsRemaining: result.creditsRemaining }) } as CreditStatus) : prev);
      }
      if (typeof result.text !== "string" || !result.text.trim()) throw new Error("The provider returned an empty response. Retry the request.");
      setInferenceState((current) => ({ ...current, [request.provider]: "success" }));
      const assistantMessage: Message = {
        role: "assistant",
        content: result.text,
        provider: result.provider ?? request.provider,
        model: result.model ?? request.model,
        requestStatus: "complete",
        ...(result.usage ? { usage: result.usage } : {}),
      };
      trackAIRequestFinish(activityId, "complete", {
        ...(result.usage?.inputTokens !== undefined ? { inputTokens: result.usage.inputTokens } : {}),
        ...(result.usage?.outputTokens !== undefined ? { outputTokens: result.usage.outputTokens } : {}),
      });
      setData((current) => ({ ...current, projects: current.projects.map((project) => project.id !== request.projectId ? project : {
        ...project,
        chats: project.chats.map((chat) => chat.id === request.chatId ? { ...chat, messages: [...request.messages, assistantMessage], updatedAt: Date.now() } : chat),
      }) }));
    } catch (requestError) {
      trackAIRequestFinish(activityId, controller.signal.aborted ? "stopped" : "failed");
      if (!controller.signal.aborted) {
        const message = requestError instanceof Error ? requestError.message.toLowerCase() : "";
        const failure = /quota|rate limit|billing|usage limit|resource_exhausted/.test(message) ? "quota"
          : /permission|denied|rejected .*key|unauthenticated|credentials/.test(message) ? "permission"
            : /network|could not reach|connection|took too long|timed out/.test(message) ? "network"
              : "failed";
        setInferenceState((current) => ({ ...current, [request.provider]: failure }));
      }
      setError(requestError instanceof DOMException && requestError.name === "AbortError" ? "Generation stopped. Retry to continue." : requestError instanceof Error ? requestError.message : "Could not reach the model provider.");
    } finally {
      if (requestControllerRef.current === controller) requestControllerRef.current = null;
      setPending(false);
      void refreshAiSession();
      window.setTimeout(() => textareaRef.current?.focus(), 0);
    }
  };

  const sendMessage = async (text = prompt) => {
    if (!text.trim() || pending || !activeProject) return;
    if (sharedKatMode) {
      setError("Shared Kat AI is available in the Kat tutor. To use Cloudflare in Workspace, switch Cloudflare access to BYOK in Settings.");
      return;
    }
    if (!selectedModel) {
      setError(`Load a supported ${selectedProvider.name} model in Settings before sending a message.`);
      return;
    }
    const currentChat = activeChat ?? { id: crypto.randomUUID(), title: text.trim().slice(0, 42), messages: [], updatedAt: Date.now() };
    const composition = composeWorkspaceContext(enabledSkills, activeProject.instructions, MAX_SKILL_CONTEXT_CHARS);
    const sourceMessages = currentChat.messages;
    const editedIndex = editingMessageIndex;
    const userMessage: Message = { role: "user", content: text.trim(), appliedSkills: composition.appliedSkills, omittedSkills: composition.omittedSkills };
    const messages = editedIndex === null ? [...sourceMessages, userMessage] : [...sourceMessages.slice(0, editedIndex), userMessage];
    setPrompt("");
    setEditingMessageIndex(null);
    if (!activeChat) {
      setData((current) => ({ ...current, activeChatId: currentChat.id, projects: current.projects.map((item) => item.id === activeProject.id ? { ...item, chats: [{ ...currentChat, messages }, ...item.chats] } : item) }));
    } else {
      setData((current) => ({ ...current, projects: current.projects.map((project) => project.id !== activeProject.id ? project : {
        ...project,
        chats: project.chats.map((chat) => chat.id === currentChat.id ? { ...chat, title: editedIndex === 0 || chat.messages.length === 0 ? text.trim().slice(0, 42) : chat.title, messages, updatedAt: Date.now() } : chat),
      }) }));
    }
    await requestAssistantResponse({
      projectId: activeProject.id,
      chatId: currentChat.id,
      messages,
      ...(composition.context ? { context: composition.context } : {}),
      provider: data.provider,
      model: selectedModel.id,
      cloudflareMode,
      sessionKey: sessionKeys[data.provider].trim(),
      cloudflareAccountId: sessionCloudflareAccountId.trim(),
      ollamaBaseUrl: data.ollamaBaseUrl || DEFAULT_OLLAMA_BASE_URL,
    });
  };

  const retryLastRequest = () => {
    if (retryRequestRef.current && !pending) void requestAssistantResponse(retryRequestRef.current);
  };

  const stopGeneration = () => requestControllerRef.current?.abort();

  const regenerateLastResponse = () => {
    if (pending || !activeProject || !activeChat || !selectedModel || activeChat.messages.at(-1)?.role !== "assistant") return;
    const messages = activeChat.messages.slice(0, -1);
    const lastUser = [...messages].reverse().find((message) => message.role === "user");
    if (!lastUser) return;
    const composition = composeWorkspaceContext(enabledSkills, activeProject.instructions, MAX_SKILL_CONTEXT_CHARS);
    const updatedMessages = messages.map((message) => message === lastUser ? { ...message, appliedSkills: composition.appliedSkills, omittedSkills: composition.omittedSkills } : message);
    setData((current) => ({ ...current, projects: current.projects.map((project) => project.id !== activeProject.id ? project : {
      ...project,
      chats: project.chats.map((chat) => chat.id === activeChat.id ? { ...chat, messages: chat.messages.map((message, index) => index === messages.indexOf(lastUser) ? updatedMessages[index] : message) } : chat),
    }) }));
    void requestAssistantResponse({
      projectId: activeProject.id,
      chatId: activeChat.id,
      messages: updatedMessages,
      ...(composition.context ? { context: composition.context } : {}),
      provider: data.provider,
      model: selectedModel.id,
      cloudflareMode,
      sessionKey: sessionKeys[data.provider].trim(),
      cloudflareAccountId: sessionCloudflareAccountId.trim(),
      ollamaBaseUrl: data.ollamaBaseUrl || DEFAULT_OLLAMA_BASE_URL,
    });
  };

  const editUserMessage = (index: number, message: Message) => {
    if (pending) return;
    setEditingMessageIndex(index);
    setPrompt(message.content);
    window.setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const copyMessage = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopyStatus(`Message ${index + 1} copied.`);
      window.setTimeout(() => setCopyStatus(""), 1_500);
    } catch {
      setCopyStatus("Clipboard access was denied.");
      window.setTimeout(() => setCopyStatus(""), 2_500);
    }
  };

  const importSkill = async (file: File | undefined) => {
    if (!file) return;
    setImportError("");
    try {
      if (!file.name.toLowerCase().endsWith(".md")) throw new Error("Import a Markdown skill file (.md).");
      if (file.size > 32_000) throw new Error("Skill files must be 32 KB or smaller.");
      if (data.skills.length >= 50) throw new Error("Keep up to 50 skills in this browser library.");
      const skill = parseSkillMarkdown(await file.text(), file.name);
      if (data.skills.some((item) => item.id === skill.id)) throw new Error("A skill with that name is already in your library.");
      setData((current) => ({ ...current, skills: [...current.skills, skill] }));
    } catch (importProblem) {
      setImportError(importProblem instanceof Error ? importProblem.message : "Could not read this skill file.");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const exportWorkspace = () => {
    try {
      const content = exportWorkspaceBackup(data);
      downloadText(`katalyst-workspace-${new Date().toISOString().slice(0, 10)}.json`, content, "application/json;charset=utf-8");
      setBackupImportError("");
      setBackupImportSuccess("Workspace backup downloaded. Keep a copy somewhere outside this browser.");
    } catch (exportError) {
      setBackupImportSuccess("");
      setBackupImportError(exportError instanceof Error ? exportError.message : "Could not export the workspace.");
    }
  };

  const downloadOriginalWorkspaceRecord = () => {
    if (storageRecoveryRaw === null) return;
    downloadText(`katalyst-original-workspace-${new Date().toISOString().slice(0, 10)}.txt`, storageRecoveryRaw, "text/plain;charset=utf-8");
    setOriginalRecordDownloadStarted(true);
  };

  const recoverWorkspaceRecord = () => {
    if (!storageRecovery || storageRecovery.kind !== "recoverable") return;
    if (!originalRecordDownloadStarted) return;
    if (!window.confirm("Replace the saved record with only the workspace data that passed validation?")) return;
    try {
      writeLocalWorkspace(window.localStorage, storageKey, storageRecovery.workspace);
      const recovered = storageRecovery.workspace;
      setData(recovered);
      const activeProject = recovered.projects.find((project) => project.chats.some((chat) => chat.id === recovered.activeChatId)) ?? recovered.projects[0];
      setActiveProjectId(activeProject?.id ?? "default-project");
      persistedSnapshotRef.current = JSON.stringify(recovered);
      setStorageRecovery(null);
      setStorageRecoveryRaw(null);
      setOriginalRecordDownloadStarted(false);
      setStorageError("");
      setBackupImportSuccess("Recovered validated projects, conversations, and skills. The original record download was initiated first.");
    } catch {
      setStorageError("KATALYST could not write the recovered workspace, likely because browser storage is full. The original saved record was left in place; download a backup and free space before trying again.");
    }
  };

  const startFreshFromStoredRecord = () => {
    if (!storageRecovery || (storageRecovery.kind !== "corrupt" && storageRecovery.kind !== "unsupported")) return;
    if (!originalRecordDownloadStarted) return;
    if (!window.confirm("Replace the saved record with a new empty workspace? This cannot be undone inside KATALYST.")) return;
    try {
      const fresh = createDefaultWorkspace();
      writeLocalWorkspace(window.localStorage, storageKey, fresh);
      setData(fresh);
      setActiveProjectId("default-project");
      persistedSnapshotRef.current = JSON.stringify(fresh);
      setStorageRecovery(null);
      setStorageRecoveryRaw(null);
      setOriginalRecordDownloadStarted(false);
      setStorageError("");
      setBackupImportSuccess("A new workspace was saved after initiating the original-record download.");
    } catch {
      setStorageError("KATALYST could not initialize a new workspace, likely because browser storage is unavailable. The original saved record was left in place.");
    }
  };

  const retryStorageRead = () => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      const result = readLocalWorkspace(raw);
      if (result.kind === "valid") {
        setData(result.workspace);
        setActiveProjectId(result.workspace.projects[0]?.id ?? "default-project");
        persistedSnapshotRef.current = JSON.stringify(result.workspace);
        setStorageRecovery(null);
        setStorageRecoveryRaw(null);
        setOriginalRecordDownloadStarted(false);
      } else if (result.kind === "missing") {
        setStorageRecovery(null);
        setStorageRecoveryRaw(null);
        setOriginalRecordDownloadStarted(false);
        persistedSnapshotRef.current = null;
      } else {
        setStorageRecovery(result);
        setStorageRecoveryRaw(raw);
        setOriginalRecordDownloadStarted(false);
      }
      setStorageError("");
    } catch {
      setStorageRecovery({ kind: "unavailable", issue: "Browser storage is still unavailable. KATALYST has not overwritten the saved workspace." });
    }
  };

  const exportProject = () => {
    if (!projectForExport) return;
    try {
      const content = exportProjectBackup(projectForExport, data.skills);
      downloadText(`katalyst-project-${safeFileStem(projectForExport.name)}.json`, content, "application/json;charset=utf-8");
      setBackupImportError("");
      setBackupImportSuccess(`Project “${projectForExport.name}” backup downloaded.`);
    } catch (exportError) {
      setBackupImportSuccess("");
      setBackupImportError(exportError instanceof Error ? exportError.message : "Could not export this project.");
    }
  };

  const exportConversation = () => {
    if (!projectForExport || !conversationForExport) return;
    try {
      const content = exportConversationBackup(projectForExport, conversationForExport, data.skills);
      downloadText(`katalyst-conversation-${safeFileStem(conversationForExport.title)}.json`, content, "application/json;charset=utf-8");
      setBackupImportError("");
      setBackupImportSuccess(`Conversation “${conversationForExport.title}” backup downloaded.`);
    } catch (exportError) {
      setBackupImportSuccess("");
      setBackupImportError(exportError instanceof Error ? exportError.message : "Could not export this conversation.");
    }
  };

  const rememberAndApplyAccount = async (snapshot: AccountSnapshot, revision: number, updatedAt?: string | null) => {
    if (!accountUser) return;
    await applyAccountSnapshot(accountUser.id, revision, snapshot);
    setAccountRemote({ snapshot, revision, updatedAt: updatedAt ?? new Date().toISOString() });
  };

  const handleUseRemoteAccountCopy = async () => {
    if (!accountUser || !accountRemote?.snapshot) return;
    try {
      const guest = currentAccountSnapshot();
      window.localStorage.setItem(ACCOUNT_GUEST_BACKUP_KEY, JSON.stringify(guest));
      await rememberAndApplyAccount(accountRemote.snapshot, accountRemote.revision, accountRemote.updatedAt);
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : "The account copy could not be restored. Guest data remains available.");
    }
  };

  const migrateGuestData = async (mode: "merge" | "account-empty" | "resolve-conflict") => {
    if (!accountUser) return;
    setAccountError("");
    try {
      const guest = currentAccountSnapshot();
      window.localStorage.setItem(ACCOUNT_GUEST_BACKUP_KEY, JSON.stringify(guest));
      const remote = accountRemote;
      const base = remote?.snapshot ?? emptyAccountSnapshot(createDefaultWorkspace());
      const snapshot = mode === "account-empty"
        ? emptyAccountSnapshot(createDefaultWorkspace())
        : remote?.snapshot
          ? mergeAccountSnapshots(base, guest, accountPreferenceSource)
          : guest;
      const expectedRevision = remote?.revision ?? 0;
      const priorPending = readPendingAccountMigration(accountUser.id);
      const pending: PendingAccountMigration = priorPending?.expectedRevision === expectedRevision
        ? priorPending
        : { userId: accountUser.id, migrationId: crypto.randomUUID(), expectedRevision, snapshot };
      const key = ACCOUNT_MIGRATION_PREFIX + accountUser.id;
      if (!priorPending || priorPending.expectedRevision !== expectedRevision) window.localStorage.setItem(key, JSON.stringify(pending));
      setAccountSyncState("pending");
      const result = await saveRemoteAccountSnapshot(snapshot, pending.expectedRevision, pending.migrationId);
      if (result.conflict) {
        setAccountRemote(await readRemoteAccountSnapshot());
        setAccountPhase("conflict");
        setAccountError("Account data changed before the guest migration was saved. Review the latest account copy and merge again.");
        setAccountSyncState("error");
        return;
      }
      const latest = await readRemoteAccountSnapshot();
      if (!latest.snapshot) throw new Error("The account service did not return the saved data. The migration will retry safely.");
      await rememberAndApplyAccount(latest.snapshot, latest.revision, latest.updatedAt);
      window.localStorage.removeItem(key);
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : "Guest data could not be moved. The original local records were left in place.");
      setAccountSyncState("error");
    }
  };

  const keepGuestData = async () => {
    if (!accountClient) return;
    try {
      if (accountPhase === "active") {
        const local = currentAccountSnapshot();
        const marker = readAccountActiveMarker();
        if (!marker || marker.userId !== accountUser?.id) throw new Error("Account state could not be verified before signing out.");
        const hash = await hashAccountSnapshot(local);
        if (hash !== marker.snapshotHash) {
          const result = await saveRemoteAccountSnapshot(local, marker.revision);
          if (result.conflict) {
            setAccountRemote(await readRemoteAccountSnapshot());
            setAccountPhase("conflict");
            setAccountError("Resolve the account conflict before signing out so the latest changes remain safe.");
            return;
          }
          await saveAccountMarker(accountUser!.id, result.revision, local);
        }
      } else if (accountPhase === "conflict") {
        throw new Error("Resolve the account conflict before signing out. Both copies are preserved.");
      }
      const { error: signOutError } = await accountClient.auth.signOut();
      if (signOutError) throw signOutError;
      const guestRaw = window.localStorage.getItem(ACCOUNT_GUEST_BACKUP_KEY);
      if (guestRaw) {
        const guest = parseAccountSnapshot(JSON.parse(guestRaw));
        writeAccountSnapshotToStorage(window.localStorage, guest);
        setData(guest.workspace);
        setPreferences(guest.preferences);
        const activeProject = guest.workspace.projects.find((project) => project.chats.some((chat) => chat.id === guest.workspace.activeChatId)) ?? guest.workspace.projects[0];
        setActiveProjectId(activeProject?.id ?? "default-project");
        persistedSnapshotRef.current = JSON.stringify(guest.workspace);
      }
      window.localStorage.removeItem(ACCOUNT_ACTIVE_KEY);
      window.localStorage.removeItem(ACCOUNT_MIGRATION_PREFIX + (accountUser?.id ?? ""));
      setAccountUser(null);
      setAccountRemote(null);
      setAccountPhase("guest");
      setAccountSyncState("synced");
      setAccountError("");
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : "Sign-out could not finish. Your local data remains available.");
    }
  };

  const exportAccountData = async () => {
    setAccountError("");
    try {
      const response = await fetch("/api/account/export", { cache: "no-store" });
      if (!response.ok) {
        const body = await response.json() as { error?: string };
        throw new Error(body.error ?? "Account data could not be exported.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `katalyst-account-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : "Account data could not be exported.");
    }
  };

  const deleteAccount = async () => {
    if (accountDeletePhrase !== "delete my account") return;
    setAccountError("");
    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: accountDeletePhrase }),
      });
      const body = await response.json() as { error?: string; deleted?: boolean };
      if (!response.ok || !body.deleted) throw new Error(body.error ?? "The account could not be deleted.");
      setAccountPhase("guest");
      const guestRaw = window.localStorage.getItem(ACCOUNT_GUEST_BACKUP_KEY);
      if (guestRaw) {
        const guest = writeAccountSnapshotToStorage(window.localStorage, JSON.parse(guestRaw));
        setData(guest.workspace);
        setPreferences(guest.preferences);
        persistedSnapshotRef.current = JSON.stringify(guest.workspace);
      }
      window.localStorage.removeItem(ACCOUNT_ACTIVE_KEY);
      window.localStorage.removeItem(ACCOUNT_MIGRATION_PREFIX + (accountUser?.id ?? ""));
      setAccountUser(null);
      setAccountRemote(null);
      setAccountDeleteOpen(false);
      setAccountDeletePhrase("");
      setAccountError("Account and active KATALYST records were deleted. The guest copy saved on this device was restored.");
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : "The account could not be deleted. The account record was left in place.");
    }
  };

  const importBackup = async (file: File | undefined) => {
    if (!file) return;
    setBackupImportError("");
    setBackupImportSuccess("");
    try {
      if (file.size > MAX_BACKUP_BYTES) throw new Error("Backup files must be 8 MB or smaller.");
      const raw = await file.text();
      const backup = parseBackup(raw);
      if (storageRecovery && storageRecovery.kind !== "valid" && storageRecovery.kind !== "missing") {
        if (!originalRecordDownloadStarted) {
          downloadOriginalWorkspaceRecord();
          setBackupImportSuccess("The original saved record download started. Review that copy, then choose the backup file again to continue.");
          return;
        }
        if (!window.confirm("Replace the saved record with this backup? The original download was initiated first.")) return;
      }
      if (backup.format === "katalyst-workspace" && backupMode === "replace" && !window.confirm("Replace this browser’s current workspace with the backup? This cannot be undone unless you have exported a backup first.")) return;
      const result = commitBackupImport(raw, data, backupMode, (serialized) => window.localStorage.setItem(storageKey, serialized));
      setData(result.workspace);
      persistedSnapshotRef.current = JSON.stringify(result.workspace);
      setStorageRecovery(null);
      setStorageRecoveryRaw(null);
      setOriginalRecordDownloadStarted(false);
      const activeChatProject = result.workspace.projects.find((project) => project.chats.some((chat) => chat.id === result.workspace.activeChatId));
      if (backup.format === "katalyst-workspace" && backupMode === "replace") setActiveProjectId(activeChatProject?.id ?? result.workspace.projects[0]?.id ?? "");
      else if (!result.workspace.projects.some((project) => project.id === activeProjectId)) setActiveProjectId(activeChatProject?.id ?? result.workspace.projects[0]?.id ?? "");
      setBackupImportSuccess(`Import complete: ${result.projectsAdded} project${result.projectsAdded === 1 ? "" : "s"}, ${result.conversationsAdded} conversation${result.conversationsAdded === 1 ? "" : "s"}, and ${result.skillsAdded} skill${result.skillsAdded === 1 ? "" : "s"} added${result.remappedIds ? `; ${result.remappedIds} conflicting ID${result.remappedIds === 1 ? "" : "s"} safely remapped` : ""}.`);
    } catch (importProblem) {
      setBackupImportError(importProblem instanceof Error ? importProblem.message : "Could not import this backup.");
    } finally {
      if (backupFileRef.current) backupFileRef.current.value = "";
    }
  };

  const exportSkill = (skill: WorkspaceSkill) => {
    try {
      downloadText(`${safeFileStem(skill.name)}.md`, exportSkillMarkdown(skill), "text/markdown;charset=utf-8");
      setImportError("");
    } catch (exportError) {
      setImportError(exportError instanceof Error ? exportError.message : "Could not export this skill.");
    }
  };

  const toggleSkill = (id: string) => setData((current) => ({ ...current, skills: current.skills.map((skill) => skill.id === id ? { ...skill, enabled: !skill.enabled } : skill) }));
  const deleteSkill = (id: string) => setData((current) => ({ ...current, skills: current.skills.filter((skill) => skill.id !== id) }));
  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); void sendMessage(); };

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        const project = data.projects.find((item) => item.id === activeProjectId) ?? data.projects[0];
        if (project) createChat(project);
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [activeProjectId, createChat, data.projects]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const sync = () => setSmallScreen(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!smallScreen) {
      setMobileHeaderCollapsed(false);
      return;
    }
    const scrollIntents = new WeakMap<HTMLElement, { position: number; direction: -1 | 0 | 1; distance: number }>();
    const onScroll = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement) || target.closest(".sidebar")) return;

      const isPageScroll = target.matches(".learning-view") && !target.classList.contains("learning-playground");
      const isPlaygroundPageScroll = target.id === "main-content" && target.classList.contains("main-panel-playground");
      if (!isPageScroll && !isPlaygroundPageScroll) return;

      const activeElement = document.activeElement;
      if (
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        (activeElement instanceof HTMLElement && activeElement.isContentEditable)
      ) return;
      const topbar = document.querySelector<HTMLElement>(".topbar");
      if (topbar?.contains(activeElement)) return;

      const current = target.scrollTop;
      const intent = scrollIntents.get(target) ?? { position: 0, direction: 0, distance: 0 };
      const delta = current - intent.position;
      intent.position = current;
      scrollIntents.set(target, intent);

      if (current <= 4) {
        intent.direction = 0;
        intent.distance = 0;
        setMobileHeaderCollapsed(false);
        return;
      }
      if (Math.abs(delta) < 1) return;

      const direction: -1 | 1 = delta > 0 ? 1 : -1;
      if (intent.direction !== direction) {
        intent.direction = direction;
        intent.distance = Math.abs(delta);
      } else {
        intent.distance += Math.abs(delta);
      }

      // Only the active lesson panel can affect the header; directional thresholds absorb scroll noise.
      if (direction > 0 && intent.distance >= 10) setMobileHeaderCollapsed(true);
      else if (direction < 0 && intent.distance >= 40) setMobileHeaderCollapsed(false);
    };
    document.addEventListener("scroll", onScroll, true);
    return () => document.removeEventListener("scroll", onScroll, true);
  }, [smallScreen]);

  useEffect(() => setMobileHeaderCollapsed(false), [view]);

  useEffect(() => {
    if (!mobileNav) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMobileNav(false);
      window.requestAnimationFrame(() => document.querySelector<HTMLButtonElement>(".mobile-menu")?.focus());
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [mobileNav]);

  useEffect(() => {
    try {
      purgeLegacyStandaloneCredentials(window.localStorage);
    } catch {
      // Credential cleanup is best-effort when browser storage is unavailable.
    }
  }, []);

  useEffect(() => {
    try {
      setSidebarCollapsed(window.localStorage.getItem("katalyst.sidebar.collapsed.v1") === "true");
    } catch {
      // Navigation remains available for this session when storage is disabled.
    }
    setSidebarPreferenceReady(true);
  }, []);

  useEffect(() => {
    try {
      const result = readUserPreferences(window.localStorage.getItem(USER_PREFERENCES_KEY));
      if (result.kind === "valid" || result.kind === "missing") {
        setPreferences(result.preferences);
        setPreferencesWritable(true);
      } else {
        setPreferencesIssue(result.issue);
      }
    } catch {
      setPreferencesIssue("Appearance preferences could not be read. The selected theme will last for this visit.");
    }
    setPreferencesReady(true);
  }, []);

  useEffect(() => {
    if (!preferencesReady) return;
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      const resolved = preferences.theme === "system"
        ? (mediaQuery.matches ? "dark" : "light")
        : preferences.theme;
      root.dataset.theme = resolved;
    };

    applyTheme();
    root.dataset.density = preferences.textDensity;

    if (preferences.theme === "system") {
      mediaQuery.addEventListener("change", applyTheme);
      return () => mediaQuery.removeEventListener("change", applyTheme);
    }
  }, [preferences, preferencesReady]);

  useEffect(() => {
    if (!preferencesReady || !preferencesWritable) return;
    try {
      writeUserPreferences(window.localStorage, preferences);
      setPreferencesIssue("");
      window.dispatchEvent(new Event(ACCOUNT_LOCAL_CHANGE_EVENT));
    } catch {
      setPreferencesIssue("Appearance preferences could not be saved. They will last for this visit.");
    }
  }, [preferences, preferencesReady, preferencesWritable]);

  const currentAccountSnapshot = useCallback((): AccountSnapshot => {
    const progress = readLearningProgress(window.localStorage.getItem("katalyst.learning.v1"));
    if (progress.kind !== "valid" && progress.kind !== "missing") throw new Error("Resolve the saved learning progress issue before syncing account data.");
    return parseAccountSnapshot({
      workspace: currentWorkspaceRef.current,
      learningProgress: progress.progress,
      preferences: currentPreferencesRef.current,
    });
  }, []);

  const saveAccountMarker = useCallback(async (userId: string, revision: number, snapshot: AccountSnapshot) => {
    const marker: AccountActiveMarker = { userId, revision, snapshotHash: await hashAccountSnapshot(snapshot) };
    window.localStorage.setItem(ACCOUNT_ACTIVE_KEY, JSON.stringify(marker));
    return marker;
  }, []);

  const applyAccountSnapshot = useCallback(async (userId: string, revision: number, input: AccountSnapshot) => {
    const snapshot = writeAccountSnapshotToStorage(window.localStorage, input);
    setData(snapshot.workspace);
    setPreferences(snapshot.preferences);
    setPreferencesReady(true);
    setPreferencesWritable(true);
    const activeProject = snapshot.workspace.projects.find((project) => project.chats.some((chat) => chat.id === snapshot.workspace.activeChatId)) ?? snapshot.workspace.projects[0];
    setActiveProjectId(activeProject?.id ?? "default-project");
    persistedSnapshotRef.current = JSON.stringify(snapshot.workspace);
    await saveAccountMarker(userId, revision, snapshot);
    setAccountRemote({ snapshot, revision, updatedAt: new Date().toISOString() });
    setAccountSyncState("synced");
    setAccountError("");
    setAccountPhase("active");
  }, [saveAccountMarker]);

  useEffect(() => {
    if (!accountClient) {
      setAccountConfigured(false);
      setAccountPhase("unconfigured");
      return;
    }
    setAccountConfigured(true);
    if (new URLSearchParams(window.location.search).get("account") === "sign-in-failed") {
      setAccountError("Account sign-in did not complete. Check the enabled Supabase sign-in method and redirect URL, then try again.");
    }
    let active = true;
    void accountClient.auth.getUser().then(({ data: authData, error: authError }) => {
      if (!active) return;
      if (authError && authError.name !== "AuthSessionMissingError") {
        setAccountError("The account session could not be checked. Refresh the page or continue as a guest.");
        setAccountPhase("error");
      } else setAccountUser(authData.user);
    }).catch(() => {
      if (!active) return;
      setAccountError("The account service could not be reached. Your local workspace is still available.");
      setAccountPhase("error");
    });
    const { data: { subscription } } = accountClient.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setAccountUser(session?.user ?? null);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [accountClient]);

  useEffect(() => {
    if (!ready || !accountConfigured) return;
    if (!accountUserId) {
      setAccountRemote(null);
      setAccountPhase("guest");
      setAccountSyncState("synced");
      return;
    }

    const userId = accountUserId;
    let active = true;
    setAccountPhase("checking");
    setAccountError("");
    void (async () => {
      const remote = await readRemoteAccountSnapshot();
      if (!active) return;
      setAccountRemote(remote);

      const pending = readPendingAccountMigration(userId);
      if (pending) {
        const currentDeviceCopy = currentAccountSnapshot();
        window.localStorage.setItem(ACCOUNT_GUEST_BACKUP_KEY, JSON.stringify(currentDeviceCopy));
        const result = await saveRemoteAccountSnapshot(pending.snapshot, pending.expectedRevision, pending.migrationId);
        if (!active) return;
        if (result.conflict) {
          setAccountRemote(await readRemoteAccountSnapshot());
          setAccountPhase("conflict");
          setAccountError("A saved guest migration is waiting because account data changed. Review the latest account copy, then retry the merge.");
          return;
        }
        const latest = await readRemoteAccountSnapshot();
        if (!active) return;
        if (!latest.snapshot) throw new Error("The completed migration could not be read back from the account.");
        await applyAccountSnapshot(userId, latest.revision, latest.snapshot);
        window.localStorage.removeItem(ACCOUNT_MIGRATION_PREFIX + userId);
        return;
      }

      const marker = readAccountActiveMarker();
      if (marker && marker.userId === userId) {
        const activeMarker = marker;
        const local = currentAccountSnapshot();
        const localHash = await hashAccountSnapshot(local);
        if (!active) return;
        if (!remote.snapshot) {
          setAccountPhase("conflict");
          setAccountError("The account snapshot is missing even though this device has an account marker. Your local copy is preserved; choose a recovery action.");
          return;
        }
        if (remote.revision > activeMarker.revision && localHash === activeMarker.snapshotHash) {
          await applyAccountSnapshot(userId, remote.revision, remote.snapshot);
          return;
        }
        if (remote.revision < activeMarker.revision || (remote.revision > activeMarker.revision && localHash !== activeMarker.snapshotHash)) {
          setAccountPhase("conflict");
          setAccountError("This account changed on another device while this device also has local changes. Choose which copy to keep or merge.");
          return;
        }
        setAccountPhase("active");
        if (localHash !== activeMarker.snapshotHash) setAccountSyncState("pending");
        return;
      }

      try {
        const guest = currentAccountSnapshot();
        window.localStorage.setItem(ACCOUNT_GUEST_BACKUP_KEY, JSON.stringify(guest));
      } catch (error) {
        setAccountError(error instanceof Error ? error.message : "This device's guest data could not be backed up before account setup.");
      }
      if (!active) return;
      setAccountPhase("migration");
    })().catch((error: unknown) => {
      if (!active) return;
      setAccountError(error instanceof Error ? error.message : "Account data could not be checked. Your local workspace is unchanged.");
      setAccountPhase("error");
    });
    return () => { active = false; };
  }, [ready, accountConfigured, accountUserId, currentAccountSnapshot, applyAccountSnapshot]);

  useEffect(() => {
    if (accountPhase !== "active" || !accountUserId) return;
    const userId = accountUserId;
    let timer: number | undefined;
    let stopped = false;
    const syncLocalData = async () => {
      if (stopped) return;
      setAccountSyncState("pending");
      try {
        const snapshot = readAccountSnapshotFromStorage(window.localStorage, currentWorkspaceRef.current);
        const marker = readAccountActiveMarker();
        if (!marker || marker.userId !== userId) throw new Error("Account sync has no matching user marker. Reopen Account settings to resolve it.");
        const hash = await hashAccountSnapshot(snapshot);
        if (hash === marker.snapshotHash) {
          setAccountSyncState("synced");
          return;
        }
        const result = await saveRemoteAccountSnapshot(snapshot, marker.revision);
        if (result.conflict) {
          const latest = await readRemoteAccountSnapshot();
          if (latest.snapshot && await hashAccountSnapshot(latest.snapshot) === hash) {
            await saveAccountMarker(userId, latest.revision, snapshot);
            setAccountRemote(latest);
            setAccountSyncState("synced");
            setAccountError("");
            return;
          }
          setAccountRemote(latest);
          setAccountPhase("conflict");
          setAccountSyncState("error");
          setAccountError("Account data changed on another device. The local copy has not overwritten it.");
          return;
        }
        await saveAccountMarker(userId, result.revision, snapshot);
        setAccountRemote({ snapshot, revision: result.revision, updatedAt: new Date().toISOString() });
        setAccountSyncState("synced");
        setAccountError("");
      } catch (error) {
        setAccountSyncState("error");
        setAccountError(error instanceof Error ? error.message : "Account sync failed. Your local copy remains available.");
      }
    };
    const queueSync = () => {
      if (timer !== undefined) window.clearTimeout(timer);
      setAccountSyncState("pending");
      timer = window.setTimeout(() => void syncLocalData(), 800);
    };
    window.addEventListener(ACCOUNT_LOCAL_CHANGE_EVENT, queueSync);
    window.addEventListener("online", queueSync);
    return () => {
      stopped = true;
      if (timer !== undefined) window.clearTimeout(timer);
      window.removeEventListener(ACCOUNT_LOCAL_CHANGE_EVENT, queueSync);
      window.removeEventListener("online", queueSync);
    };
  }, [accountPhase, accountUserId, saveAccountMarker]);

  useEffect(() => {
    if (!ready || accountPhase !== "active") return;
    window.dispatchEvent(new Event(ACCOUNT_LOCAL_CHANGE_EVENT));
  }, [data, preferences, ready, accountPhase]);

  useEffect(() => {
    if (!sidebarPreferenceReady) return;
    try {
      window.localStorage.setItem("katalyst.sidebar.collapsed.v1", String(sidebarCollapsed));
    } catch {
      // Persisting this preference is optional.
    }
  }, [sidebarCollapsed, sidebarPreferenceReady]);

  const renderUsageAndCreditsSettings = () => {
    let activityRequests: AIRequestActivity[] = [];
    try {
      const raw = window.localStorage.getItem(AI_ACTIVITY_KEY);
      const res = readAIActivity(raw);
      if (res.kind === "valid" || res.kind === "missing") activityRequests = res.activity.requests;
    } catch {
      // Activity unavailable
    }

    const filteredRequests = activityFilter === "all"
      ? activityRequests
      : activityRequests.filter((r) => r.provider === activityFilter);

    const isGuest = !creditStatus || creditStatus.isGuest;
    let allocated = 50;
    let remaining = 50;
    if (creditStatus) {
      if (creditStatus.isGuest) {
        allocated = creditStatus.trialCreditsAllocated;
        remaining = creditStatus.trialCreditsRemaining;
      } else {
        allocated = creditStatus.creditsAllocated;
        remaining = creditStatus.creditsRemaining;
      }
    }
    const used = Math.max(0, allocated - remaining);
    const percentRemaining = allocated > 0 ? Math.round((remaining / allocated) * 100) : 0;
    const sharedProviderConfigured = Boolean(status?.sharedAi?.configured);
    const sharedProviderName = status?.sharedAi?.providerId ? providerCatalog[status.sharedAi.providerId].name : "KATALYST AI";
    const isSharedActive = Boolean(sharedProviderConfigured && aiSystem?.sharedAiEnabled && !aiSystem?.killSwitchActive);
    const sharedStatusLabel = !status || !aiSystem
      ? "Checking setup…"
      : aiSystem.killSwitchActive
        ? "Maintenance Active"
        : !sharedProviderConfigured
          ? "Server setup needed"
          : !aiSystem.sharedAiEnabled
            ? "Disabled by administrator"
            : "Available";

    return (
      <>
        <div id="settings-usage-credits" className="settings-section-heading">
          <span className="eyebrow">QUOTA & TELEMETRY</span>
          <h2>Usage & Credits</h2>
          <p>KATALYST provides shared AI credits through the deployment owner’s configured provider. Personal BYOK usage consumes 0 KATALYST credits.</p>
        </div>

        <article className="settings-card shared-ai-status-card">
          <div className="context-head">
            <div>
              <h2>Shared AI Gateway</h2>
              <p>Managed {sharedProviderName} gateway serving Kat for all KATALYST learners.</p>
            </div>
            <span className={`status-pill ${isSharedActive ? "ready" : "needs-setup"}`}>
              <span className="connection-dot" />
              {sharedStatusLabel}
            </span>
          </div>
          {status && !sharedProviderConfigured && isAdmin && (
            <div className="shared-ai-setup-note" role="status">
              <strong>Enable shared Kat AI for everyone</strong>
              <p>Ask the deployment operator to configure a server-side Gemini provider and API key, or the required Cloudflare Workers AI credentials, then redeploy. Keep all credentials server-only and apply the Supabase migrations before enabling shared requests. The deployment guide lists the exact environment settings.</p>
            </div>
          )}
          <div className="provider-lifecycle" aria-label="Shared AI gateway configuration">
            <span><strong>Managed Provider</strong>{sharedProviderName}</span>
            <span><strong>Model</strong>Managed in Kat AI</span>
            <span><strong>Credit use</strong>Varies by model and request size</span>
            <span><strong>Infrastructure</strong>Zero-key server proxy</span>
          </div>
        </article>

        <article className="settings-card credit-balance-card">
          <div className="context-head">
            <div>
              <h2>{isGuest ? "Kat AI guest credits" : "Kat AI monthly credits"}</h2>
              <p>{isGuest ? "Trial credits for exploring KATALYST without signing in." : "Monthly recurring credits for your KATALYST account."}</p>
            </div>
            <span className="local-label">{isGuest ? "Guest Trial" : "Monthly Reset"}</span>
          </div>

          <div className="credit-meter-block">
            <div className="credit-meter-header">
              <span className="credit-meter-big">{remaining.toFixed(1)} <small>/ {allocated} credits</small></span>
              <span className="credit-meter-percent">{percentRemaining}% remaining</span>
            </div>
            <div className="progress-track" role="progressbar" aria-valuenow={percentRemaining} aria-valuemin={0} aria-valuemax={100} aria-label="Credits remaining">
              <span style={{ width: `${percentRemaining}%` }} />
            </div>
            <div className="credit-meter-footer">
              <span>{used.toFixed(1)} credits used this period</span>
              {!isGuest && creditStatus && "resetDate" in creditStatus && creditStatus.resetDate && (
                <span>Next replenishment: {new Date(creditStatus.resetDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
              )}
            </div>
          </div>

          {isGuest && (
            <div className="guest-upgrade-callout">
              <div>
                <strong>Keep learning across devices</strong>
                <p>Sign in or create an account to sync your progress and access your account credit allowance.</p>
              </div>
              <Link className="primary-button" href="/login">
                Sign in or create account
              </Link>
            </div>
          )}
        </article>

        <article className="settings-card byok-policy-card">
          <div className="context-head">
            <div>
              <h2>Bring Your Own Key (BYOK)</h2>
              <p>Direct provider connections require zero KATALYST credits.</p>
            </div>
            <span className="local-label">0 credits</span>
          </div>
          <p className="settings-explainer">
            When you select <strong>Gemini</strong>, <strong>OpenAI</strong>, <strong>OpenRouter</strong>, or local <strong>Ollama</strong> in the AI & Models tab with your own API key, requests bypass the KATALYST shared credit gateway and connect directly to the provider. <strong>These requests never deduct from your KATALYST monthly credit pool.</strong>
          </p>
          <div className="provider-card-actions">
            <button type="button" className="secondary-button" onClick={() => openSettings("ai-models")}>
              Configure BYOK Providers
            </button>
          </div>
        </article>

        <article className="settings-card ai-activity-log-card">
          <div className="context-head">
            <div>
              <h2>AI Request History</h2>
              <p>Recent inference requests initiated from this browser tab. Prompts and keys are never logged.</p>
            </div>
            <div className="activity-filter-pills" role="radiogroup" aria-label="Filter activity by provider">
              {(["all", ...providerIds] as const).map((filterId) => (
                <button
                  key={filterId}
                  type="button"
                  role="radio"
                  aria-checked={activityFilter === filterId}
                  className={`filter-pill ${activityFilter === filterId ? "is-active" : ""}`}
                  onClick={() => setActivityFilter(filterId)}
                >
                  {filterId === "all" ? "All" : providerCatalog[filterId].name}
                </button>
              ))}
            </div>
          </div>

          {filteredRequests.length > 0 ? (
            <div className="activity-table-wrapper">
              <table className="activity-log-table" aria-label="AI request log">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Provider</th>
                    <th>Model</th>
                    <th>Tokens</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.slice(-25).reverse().map((req, i) => (
                    <tr key={`${req.at}-${i}`}>
                      <td>
                        {new Date(req.at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}{" "}
                        {new Date(req.at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td>{providerCatalog[req.provider]?.name ?? req.provider}</td>
                      <td className="code-font" title={req.model}>{req.model.split("/").pop() ?? req.model}</td>
                      <td>
                        {req.usage?.inputTokens !== undefined || req.usage?.outputTokens !== undefined ? (
                          <small>In: {req.usage?.inputTokens ?? 0} · Out: {req.usage?.outputTokens ?? 0}</small>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>
                        <span className={`activity-status-tag status-${req.outcome}`}>
                          {req.outcome}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="activity-empty-state">
              <Bot size={18} />
              <p>No recent AI activity recorded for this filter. Start a conversation in the workspace or Kat tutor to generate activity records.</p>
            </div>
          )}
        </article>
      </>
    );
  };

  const renderAccountSettings = () => {
    const statusLabel = accountPhase === "checking" ? "Checking account"
      : accountPhase === "unconfigured" ? "Account service not configured"
        : accountPhase === "guest" ? "Guest · this browser only"
          : accountPhase === "migration" ? "Choose what to do with this device’s data"
            : accountPhase === "active" ? accountSyncState === "synced" ? "Account data synced" : accountSyncState === "pending" ? "Syncing account data…" : "Sync needs attention"
              : accountPhase === "conflict" ? "Account conflict needs a choice" : "Account status unavailable";
    const guestBackupAvailable = (() => {
      try { return Boolean(window.localStorage.getItem(ACCOUNT_GUEST_BACKUP_KEY)); } catch { return false; }
    })();

    return <article className="settings-card account-settings-card">
      <div className="context-head">
        <div><h2>{accountUser ? accountUser.user_metadata?.full_name ?? accountUser.user_metadata?.name ?? accountUser.email ?? "KATALYST account" : "Guest workspace"}</h2><p>{accountUser?.email ?? "You can keep using KATALYST without registering."}</p></div>
        <span className="local-label">{statusLabel}</span>
      </div>
      {accountUser && <dl className="account-identity"><div><dt>Account ID</dt><dd>{accountUser.id}</dd></div></dl>}
      {!accountConfigured && <>
        <p className="settings-explainer">Guest mode is ready. Account sign-in and sync are not configured for this deployment, so your workspace remains in this browser.</p>
        <p className="account-coming-soon" role="status">No account request is sent until the account service is configured.</p>
      </>}
      {accountConfigured && !accountUser && <>
        <p className="settings-explainer">This guest workspace is saved in this browser. Account sync is optional and only starts after you sign in and choose how to move your learning data.</p>
        {accountError && <p className="inline-error" role="alert">{accountError}</p>}
        {accountPhase === "checking" ? <p className="account-status" role="status">Checking account status…</p>
          : <Link className="secondary-button account-sign-in-link" href="/login">Open the sign-in page</Link>}
      </>}
      {accountUser && accountPhase === "checking" && <p className="account-status" role="status">Checking account data and this device’s saved copy…</p>}
      {accountUser && accountPhase === "migration" && <>
        <p className="settings-explainer">Your guest copy stays on this device as a separate backup. Choose how to initialize this account. No cloud copy is replaced until you choose an option.</p>
        {accountError && <p className="inline-error" role="alert">{accountError}</p>}
        {accountRemote?.snapshot ? <>
          <p className="account-status">This account already has data (revision {accountRemote.revision}). Merge keeps existing records, remaps conflicting project and conversation IDs, and combines learning history.</p>
          <fieldset className="account-preference-choice"><legend>Appearance preference during merge</legend>
            <label><input type="radio" name="account-preference-source" checked={accountPreferenceSource === "account"} onChange={() => setAccountPreferenceSource("account")} /> Keep account theme and reading density</label>
            <label><input type="radio" name="account-preference-source" checked={accountPreferenceSource === "guest"} onChange={() => setAccountPreferenceSource("guest")} /> Use this device’s theme and reading density</label>
          </fieldset>
          <div className="account-actions"><button className="primary-button" onClick={() => void migrateGuestData("merge")}>Merge this device into the account</button><button className="secondary-button" onClick={() => void handleUseRemoteAccountCopy()}>Use account copy on this device</button></div>
        </> : <>
          <p className="account-status">This account has no saved workspace yet. The migration choice will include workspace, conversations, learning progress, and appearance preferences. BYOK keys are not included.</p>
          <div className="account-actions"><button className="primary-button" onClick={() => void migrateGuestData("merge")}>Move guest data to the account</button><button className="secondary-button" onClick={() => void migrateGuestData("account-empty")}>Start with an empty account</button></div>
        </>}
        <button className="account-link-button" onClick={() => void keepGuestData()}>Sign out and keep working as a guest</button>
      </>}
      {accountUser && accountPhase === "active" && <>
        <p className="settings-explainer">Workspace records, conversations, learning progress, selected model settings, and appearance preferences sync to this account. Provider keys entered for this tab remain in memory and are not synced.</p>
        {accountRemote?.updatedAt && <p className="account-status">Last saved {new Date(accountRemote.updatedAt).toLocaleString()} · revision {accountRemote.revision}</p>}
        {accountError && <p className="inline-error" role="alert">{accountError}</p>}
        <div className="account-actions"><button className="secondary-button" onClick={() => window.dispatchEvent(new Event(ACCOUNT_LOCAL_CHANGE_EVENT))}>{accountSyncState === "error" ? "Retry sync" : "Sync now"}</button><button className="secondary-button" onClick={() => void exportAccountData()}><Download size={14} /> Export account data</button><button className="secondary-button" onClick={() => void keepGuestData()}>Sign out</button></div>
        {!accountDeleteOpen ? <button className="account-danger-button" onClick={() => setAccountDeleteOpen(true)}>Delete account and cloud data</button> : <div className="account-delete-confirm">
          <p>Deletion removes this Auth account and its active profile, snapshot, and migration records. Project backup retention follows the Supabase project’s configured backup plan. Your saved guest copy on this device can be restored.</p>
          <label>Type <strong>delete my account</strong> to confirm<input value={accountDeletePhrase} onChange={(event) => setAccountDeletePhrase(event.target.value)} autoComplete="off" /></label>
          <div className="account-actions"><button className="account-danger-button" disabled={accountDeletePhrase !== "delete my account"} onClick={() => void deleteAccount()}>Permanently delete account</button><button className="secondary-button" onClick={() => { setAccountDeleteOpen(false); setAccountDeletePhrase(""); }}>Cancel</button></div>
        </div>}
      </>}
      {accountUser && accountPhase === "conflict" && <>
        <p className="settings-explainer">Both the account copy and this device’s copy are preserved. Choose how to resolve the revision conflict; KATALYST will not overwrite either copy automatically.</p>
        {accountError && <p className="inline-error" role="alert">{accountError}</p>}
        {accountRemote?.snapshot && <fieldset className="account-preference-choice"><legend>Appearance preference if you merge</legend>
          <label><input type="radio" name="account-preference-source" checked={accountPreferenceSource === "account"} onChange={() => setAccountPreferenceSource("account")} /> Keep account theme and reading density</label>
          <label><input type="radio" name="account-preference-source" checked={accountPreferenceSource === "guest"} onChange={() => setAccountPreferenceSource("guest")} /> Use this device’s theme and reading density</label>
        </fieldset>}
        <div className="account-actions">{accountRemote?.snapshot && <button className="secondary-button" onClick={() => void handleUseRemoteAccountCopy()}>Use the latest account copy</button>}<button className="primary-button" onClick={() => void migrateGuestData("resolve-conflict")}>{accountRemote?.snapshot ? "Merge this device into the latest account" : "Restore this device’s saved copy to the account"}</button></div>
      </>}
      {accountUser && accountPhase === "error" && <>
        <p className="inline-error" role="alert">{accountError || "Account data could not be checked. Your local copy remains available."}</p>
        <button className="secondary-button" onClick={() => window.location.reload()}>Retry account check</button>
        {guestBackupAvailable && <button className="account-link-button" onClick={() => void keepGuestData()}>Sign out and restore the guest copy</button>}
      </>}
    </article>;
  };

  return (
    <div className={`app-shell${view === "playground" && playgroundSelection && !playgroundSelection.launcherOpen ? " app-shell-ide" : ""}`} data-ready={ready ? "true" : "false"} data-theme={preferences.theme} data-density={preferences.textDensity}>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      {mobileNav && <button className="nav-scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}
      <aside id="sidebar-nav" className={`sidebar ${mobileNav ? "sidebar-open" : ""} ${sidebarCollapsed && !smallScreen ? "sidebar-collapsed" : ""}`} aria-hidden={smallScreen && !mobileNav} inert={smallScreen && !mobileNav}>
        <div className="brand-row">
          <BrandMark className="brand-mark" />
          <span className="brand-name">KATALYST</span>
          <button className="icon-button close-nav" onClick={() => setMobileNav(false)} aria-label="Close navigation"><X size={17} /></button>
          <button className="icon-button collapse-nav" aria-label={sidebarCollapsed ? "Expand navigation" : "Collapse navigation"} aria-expanded={!sidebarCollapsed} aria-controls="sidebar-nav" onClick={() => setSidebarCollapsed((current) => !current)}>{sidebarCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}</button>
        </div>
        <nav className="primary-nav learning-nav" aria-label="Main navigation">
          <Link href="/" className={`nav-item ${view === "home" ? "selected" : ""}`} aria-label="Learning Home" title="Learning Home" aria-current={view === "home" ? "page" : undefined} onClick={() => setMobileNav(false)}><House size={17} /> Learning Home</Link>
          <Link href="/paths" className={`nav-item ${view === "paths" ? "selected" : ""}`} aria-label="Explore Learning Paths" title="Explore Learning Paths" aria-current={view === "paths" ? "page" : undefined} onClick={() => setMobileNav(false)}><Compass size={17} /> Explore Learning Paths</Link>
          <Link href="/my-learning" className={`nav-item ${view === "my-learning" ? "selected" : ""}`} aria-label="My Learning" title="My Learning" aria-current={view === "my-learning" ? "page" : undefined} onClick={() => setMobileNav(false)}><GraduationCap size={17} /> My Learning</Link>
          <Link href={makeApplicationPath("playground", { lessonId: routeLessonId || undefined, lang: playgroundRouteLanguage(playgroundSelection) })} className={`nav-item ${view === "playground" ? "selected" : ""}`} aria-label="Playground" title="Playground" aria-current={view === "playground" ? "page" : undefined} onClick={() => setMobileNav(false)}><Terminal size={17} /> Playground</Link>
          <Link href="/practice" className={`nav-item ${view === "practice" ? "selected" : ""}`} aria-label="Practice Lab" title="Practice Lab" aria-current={view === "practice" ? "page" : undefined} onClick={() => setMobileNav(false)}><FlaskConical size={17} /> Practice Lab</Link>
          <Link href="/progress" className={`nav-item ${view === "progress" ? "selected" : ""}`} aria-label="Progress" title="Progress" aria-current={view === "progress" ? "page" : undefined} onClick={() => setMobileNav(false)}><ChartNoAxesColumnIncreasing size={17} /> Progress</Link>
          <Link href={makeApplicationPath("tutor", { lessonId: routeLessonId || undefined })} className={`nav-item ${view === "tutor" ? "selected" : ""}`} aria-label="AI Tutor" title="AI Tutor" aria-current={view === "tutor" ? "page" : undefined} onClick={() => setMobileNav(false)}><Bot size={17} /> AI Tutor <span className="nav-kat">KAT</span></Link>
          <Link href="/settings" className={`nav-item ${view === "settings" ? "selected" : ""}`} aria-label="Settings" title="Settings" aria-current={view === "settings" ? "page" : undefined} onClick={() => setMobileNav(false)}><Settings2 size={17} /> Settings</Link>
        </nav>
        <div className="sidebar-tools">
          <div className="section-heading"><span>Workspace tools</span></div>
          <nav className="secondary-nav" aria-label="Workspace tools">
            <Link href="/workspace" className={`nav-item ${view === "workspace" ? "selected" : ""}`} aria-label="Workspace" title="Workspace" aria-current={view === "workspace" ? "page" : undefined} onClick={() => setMobileNav(false)}><MessageSquare size={16} /> Workspace</Link>
            <Link href="/skills" className={`nav-item ${view === "skills" ? "selected" : ""}`} aria-label="Skill library" title="Skill library" aria-current={view === "skills" ? "page" : undefined} onClick={() => setMobileNav(false)}><Sparkles size={16} /> Skill library <span className="nav-count">{data.skills.length}</span></Link>
          </nav>
        </div>
        {view === "workspace" && <button className="new-chat-button" onClick={() => createChat()} aria-keyshortcuts="Control+K Meta+K"><SquarePen size={16} /> New conversation <span className="shortcut">⌘&nbsp;K</span></button>}
        {view === "workspace" && <div className="sidebar-section">
          <div className="section-heading"><span>Projects</span><button className="mini-icon" onClick={createProject} aria-label="Create project"><Plus size={15} /></button></div>
          <div className="project-list">
            {data.projects.map((project) => <button key={project.id} className={`project-link ${project.id === activeProject?.id ? "project-active" : ""}`} onClick={() => { setActiveProjectId(project.id); setData((current) => ({ ...current, activeChatId: null })); setView("workspace"); setMobileNav(false); }}><span className="project-dot" />{project.name}<MoreHorizontal size={15} className="project-more" /></button>)}
          </div>
        </div>}
        {view === "workspace" && <>
          {conversationStatus && <span className="conversation-status" role="status">{conversationStatus}</span>}
          {!conversationSearch.trim() && searchableConversations.some(({ chat }) => chat.pinned) && <div className="sidebar-section pinned-section"><div className="section-heading"><span>Pinned</span><Pin size={12} /></div><div className="chat-list">{searchableConversations.filter(({ chat }) => chat.pinned).map(renderConversationRow)}</div></div>}
          <div className="sidebar-section recent-section"><div className="section-heading"><span>{conversationSearch.trim() ? "Search results" : "Recent"}</span></div><label className="conversation-search"><Search size={13} /><input type="search" aria-label="Search conversations" placeholder="Search conversations" value={conversationSearch} onChange={(event) => setConversationSearch(event.target.value)} /></label><div className="chat-list">{(conversationSearch.trim() ? searchableConversations.filter(({ chat }) => !chat.pinned) : searchableConversations.filter(({ project, chat }) => project.id === activeProject?.id && !chat.pinned).slice(0, 8)).map(renderConversationRow)}</div>{conversationSearch.trim() && searchableConversations.length === 0 && <span className="search-empty">No matching conversations.</span>}{!conversationSearch.trim() && !searchableConversations.some(({ project, chat }) => project.id === activeProject?.id && !chat.pinned) && <span className="search-empty">No recent conversations in this project.</span>}</div>
        </>}
        <div className="sidebar-bottom">
          <nav className="sidebar-legal-links" aria-label="Legal information"><Link className="sidebar-get-app" href="/download">Get App</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/account/delete">Delete account</Link><Link href="/sitemap">Sitemap</Link></nav>
        </div>
      </aside>

      <main className={`main-panel${view === "playground" ? " main-panel-playground" : ""}`} id="main-content" data-view={view} tabIndex={-1}>
        <header className={`topbar${mobileHeaderCollapsed ? " topbar-collapsed" : ""}`} aria-hidden={mobileHeaderCollapsed} inert={mobileHeaderCollapsed}>
          <button className="icon-button mobile-menu" aria-label="Open navigation" aria-expanded={mobileNav} aria-controls="sidebar-nav" onClick={() => setMobileNav(true)}><Menu size={20} /></button>
          <div className="breadcrumbs"><Link className="breadcrumb-root" href="/">KATALYST</Link>{view === "workspace" && <><span className="crumb-sep">/</span><span>{activeProject?.name ?? "Workspace"}</span></>}<span className="crumb-sep">/</span><strong>{view === "workspace" ? (activeChat?.title ?? "New conversation") : view === "skills" ? "Skill library" : view === "settings" ? "Settings" : view === "home" ? "Learning Home" : view === "paths" ? "Learning Paths" : view === "my-learning" ? "My Learning" : view === "playground" ? "Playground" : view === "practice" ? "Practice Lab" : view === "progress" ? "Progress" : view === "tutor" ? "AI Tutor" : "Lesson"}</strong></div>
          <div className="topbar-actions">
            {view === "home" && <button
              type="button"
              className="theme-quick-toggle"
              aria-label={preferences.theme === "system" ? "Toggle light and dark mode" : `Switch to ${preferences.theme === "dark" ? "light" : "dark"} mode`}
              title="Switch between light and dark mode"
              onClick={() => setPreferences((current) => ({
                ...current,
                theme: document.documentElement.dataset.theme === "dark" ? "light" : "dark",
              }))}
            >
              {preferences.theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              <span>{preferences.theme === "system" ? "Theme" : preferences.theme === "dark" ? "Light" : "Dark"}</span>
            </button>}
            <button className="top-icon" aria-label="Open settings" onClick={() => openSettings()}><Settings2 size={18} /></button>
          </div>
        </header>

        <SiteContentNotices isHome={view === "home"} />

        {ready && accountPhase === "guest" && !accountUser && signInPromptReady && !signInPromptDismissed && <aside className="guest-account-nudge" role="region" aria-label="Optional account sign-in">
          <div><strong>Save your learning progress</strong><span>Sync progress across devices. Guest learning stays on this device.</span></div>
          <Link href="/login" className="primary-button">Sign in or create account</Link>
          <button type="button" className="mini-icon" aria-label="Dismiss sign-in prompt" onClick={() => setSignInPromptDismissed(true)}><X size={15} /></button>
        </aside>}

        {quotaNotice && (
          <section className="quota-exhausted-banner" role="alert" style={{ margin: "10px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>{quotaNotice.code === "GUEST_TRIAL_EXHAUSTED" ? "Guest AI Trial Exhausted" : quotaNotice.code === "KILL_SWITCH_ACTIVE" ? "AI Maintenance Active" : "Monthly Allowance Exhausted"}</strong>
              <button className="mini-icon" onClick={() => setQuotaNotice(null)} aria-label="Dismiss"><X size={14} /></button>
            </div>
            <p>{quotaNotice.message}</p>
            <div className="banner-actions">
              {quotaNotice.requiresSignIn ? (
                <Link className="primary-button" href="/login">Sign in or create account</Link>
              ) : (
                <button type="button" className="secondary-button" onClick={() => openSettings("providers")}>Configure BYOK Providers</button>
              )}
            </div>
          </section>
        )}

        {storageRecovery && <section className="storage-recovery" role={storageRecovery.kind === "unavailable" ? "alert" : "status"}>
          <div><strong>{storageRecovery.kind === "recoverable" ? "Workspace recovery available" : storageRecovery.kind === "unavailable" ? "Browser storage unavailable" : storageRecovery.kind === "unsupported" ? "Workspace version not supported" : "Saved workspace needs recovery"}</strong><p>{storageRecovery.kind === "recoverable" ? storageRecovery.issues.join(" ") : "issue" in storageRecovery ? storageRecovery.issue : "The current workspace data is ready."} Any changes made before a recovery choice are kept in memory only. {storageRecoveryRaw !== null && !originalRecordDownloadStarted ? "Download the original record before choosing recovery, restore, or a fresh workspace." : originalRecordDownloadStarted ? "The original record download was initiated; choose whether to continue." : ""}</p></div>
          <div className="storage-recovery-actions">
            {(storageRecovery.kind === "recoverable" || storageRecovery.kind === "corrupt" || storageRecovery.kind === "unsupported") && <button className="secondary-button" onClick={downloadOriginalWorkspaceRecord}>{originalRecordDownloadStarted ? "Download original record again" : "Download original record"}</button>}
            {storageRecovery.kind === "recoverable" && <button className="secondary-button" disabled={!originalRecordDownloadStarted} onClick={recoverWorkspaceRecord}>Recover validated data</button>}
            {(storageRecovery.kind === "corrupt" || storageRecovery.kind === "unsupported") && <button className="secondary-button" disabled={!originalRecordDownloadStarted} onClick={startFreshFromStoredRecord}>Start a new workspace</button>}
            {storageRecovery.kind === "unavailable" && <button className="secondary-button" onClick={retryStorageRead}>Retry storage access</button>}
          </div>
        </section>}
        {storageError && <section className="storage-write-error" role="alert"><span>{storageError}</span><button className="secondary-button" onClick={() => openSettings("workspace")}>Open backup settings</button></section>}

        {(["home", "paths", "my-learning", "playground", "practice", "progress", "tutor", "lesson"] as LearningSection[]).includes(view as LearningSection) && <LearningExperience section={view as LearningSection} onNavigate={setView} routeLessonId={routeLessonId} onOpenSettings={() => openSettings("ai-models")} provider={data.provider} model={learningModel} sessionKey={sessionKeys[data.provider]} cloudflareAccountId={sessionCloudflareAccountId} cloudflareMode={cloudflareMode} ollamaBaseUrl={data.ollamaBaseUrl || DEFAULT_OLLAMA_BASE_URL} configured={providerConfigured} workspaceSummary={workspaceDashboardSummary} skills={data.skills} courses={publishedLearningCourses} playgroundSelection={playgroundSelection} onPlaygroundSelectionChange={updatePlaygroundSelection} />}

        {view === "skills" ? <section className="library-view">
          <div className="view-heading"><div><span className="eyebrow">TOOLS FOR YOUR WORK</span><h1>Skill library</h1><p>Add reusable instructions to the conversations where they help.</p></div><button className="primary-button" onClick={() => fileRef.current?.click()}><FileUp size={16} /> Import a skill</button></div>
          <div className="skill-tabs" role="tablist" aria-label="Skill library sections">
            <button role="tab" aria-selected={skillTab === "installed"} className={skillTab === "installed" ? "selected" : ""} onClick={() => setSkillTab("installed")}>Installed <span>{data.skills.length}</span></button>
            <button role="tab" aria-selected={skillTab === "available"} className={skillTab === "available" ? "selected" : ""} onClick={() => setSkillTab("available")}>Available</button>
          </div>
          <div className="library-toolbar">{skillTab === "installed" ? <label className="skill-search"><Search size={15} /><input type="search" aria-label="Search skills" placeholder="Search skills" value={skillSearch} onChange={(event) => setSkillSearch(event.target.value)} /></label> : <span>Search the Skill Issue directory after opening it</span>}<span>{skillTab === "installed" ? `${filteredSkills.length} of ${data.skills.length} skills` : "External catalog"}</span><span className="toolbar-hint">Markdown · local to this browser</span></div>
          {importError && <div className="inline-error" role="alert">{importError}</div>}
          {skillTab === "installed" ? <>
            <div className="skill-list">{filteredSkills.map((skill) => <article className="skill-row" key={skill.id}>
              <div className="skill-icon"><BookOpen size={17} /></div><div className="skill-copy"><div className="skill-title-row"><h2>{skill.name}</h2><span className={`source-badge ${skill.source}`}>{skill.source === "built-in" ? "Built in" : "Imported"}</span>{skill.version && <span className="metadata-pill">v{skill.version}</span>}</div><p>{skill.description}</p>
                <dl className="skill-facts"><div><dt>Author</dt><dd>{skill.author ?? "Not provided"}</dd></div><div><dt>License</dt><dd>{skill.license ?? "Not provided by source"}</dd></div><div><dt>Compatibility</dt><dd>{skill.compatibility?.length ? skill.compatibility.map((item) => skillCompatibilityLabels[item]).join(", ") : "Not specified"}</dd></div><div><dt>Added</dt><dd>{skill.installedAt ? new Date(skill.installedAt).toLocaleDateString() : skill.source === "built-in" ? "Included with KATALYST" : "Date not recorded"}</dd></div></dl>
                {skill.sourceName && <span className="skill-source">Source: {skill.sourceName}</span>}{skill.sourceUrl && <a className="skill-source-link" href={skill.sourceUrl} target="_blank" rel="noopener noreferrer">View upstream source <ExternalLink size={12} /></a>}
                <details><summary>View instructions</summary><pre>{skill.instructions}</pre></details>{skill.metadata && Object.keys(skill.metadata).length > 0 && <details className="skill-metadata"><summary>Additional source metadata</summary><dl>{Object.entries(skill.metadata).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl></details>}
              </div>
              <div className="skill-actions"><label className="switch"><input type="checkbox" checked={skill.enabled} onChange={() => toggleSkill(skill.id)} aria-label={`Enable ${skill.name}`} /><span className="switch-track" /></label><button className="mini-icon" onClick={() => exportSkill(skill)} aria-label={`Export ${skill.name}`} title="Export Markdown"><Download size={15} /></button>{skill.source === "imported" && <button className="mini-icon delete-skill" onClick={() => { if (window.confirm(`Remove ${skill.name} from this browser?`)) deleteSkill(skill.id); }} aria-label={`Remove ${skill.name}`}><X size={16} /></button>}</div>
            </article>)}</div>
            {!filteredSkills.length && <div className="skill-empty">No installed skills match “{skillSearch}”.</div>}
          </> : <div className="available-skill-card">
            <div className="skill-icon"><Sparkles size={17} /></div><div><span className="eyebrow">PUBLIC SKILL DIRECTORY</span><h2>Skill Issue</h2><p>Browse the public catalog and inspect each upstream source and license before bringing a Markdown skill into KATALYST.</p><a href="https://skill-issue.in/" target="_blank" rel="noopener noreferrer" className="secondary-button">Browse Skill Issue <ExternalLink size={14} /></a><ol><li>Open a listing and review its source repository and license.</li><li>Download or copy its Markdown skill file.</li><li>Return here and use <strong>Import a skill</strong> to add the reviewed file.</li></ol><p className="catalog-note">Skill Issue does not publish a documented machine-readable catalog API. KATALYST does not scrape the directory, fetch private endpoints, or install remote skills automatically. Imported content is validated as text and never executes scripts.</p></div>
          </div>}
          <input ref={fileRef} className="visually-hidden" type="file" accept=".md,text/markdown,text/plain" aria-label="Choose a Markdown skill file" onChange={(event) => void importSkill(event.target.files?.[0])} />
          <div className="format-note"><strong>Compatibility limits</strong><span>KATALYST passes enabled skill instructions as untrusted model context. It does not provide the filesystem, tools, or autonomous coding-agent capabilities of Codex, Claude Code, Gemini CLI, or other agents. Compatibility labels describe declared formats, not verified behavior.</span><code>---<br />name: Example<br />description: What it helps with<br />license: MIT<br />compatibility: general-ai-instructions<br />---</code></div>
        </section> : null}

        {view === "settings" ? <section className="settings-view">
          <div className="view-heading"><div><span className="eyebrow">WORKSPACE CONFIGURATION</span><h1>Settings</h1><p>Appearance, AI & Kat, and workspace options.</p></div></div>
          <div className="settings-layout-grid">
            <nav className="settings-section-nav settings-grouped-nav" role="tablist" aria-label="Settings sections" onKeyDown={(event) => {
              const allItems = [
                ...settingsNavGroups[0].items,
                ...settingsNavGroups[1].items,
                ...(isAdmin ? [{ id: "admin" as const, label: "Admin", icon: ShieldAlert }] : []),
              ];
              const currentIndex = allItems.findIndex(({ id }) => id === settingsCategory);
              const nextIndex = (event.key === "ArrowRight" || event.key === "ArrowDown") ? (currentIndex + 1) % allItems.length
                : (event.key === "ArrowLeft" || event.key === "ArrowUp") ? (currentIndex - 1 + allItems.length) % allItems.length
                  : event.key === "Home" ? 0 : event.key === "End" ? allItems.length - 1 : -1;
              if (nextIndex >= 0) {
                event.preventDefault();
                const next = allItems[nextIndex].id;
                setSettingsCategory(next);
                window.requestAnimationFrame(() => document.getElementById(`settings-tab-${next}`)?.focus());
              }
            }}>
              {settingsNavGroups.map((group) => (
                <div key={group.group} className="settings-nav-group">
                  <span className="settings-group-label">{group.group}</span>
                  {group.items.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      id={`settings-tab-${id}`}
                      type="button"
                      role="tab"
                      tabIndex={settingsCategory === id ? 0 : -1}
                      aria-selected={settingsCategory === id}
                      aria-controls="settings-category-panel"
                      className={`settings-nav-btn ${settingsCategory === id ? "active" : ""}`}
                      onClick={() => setSettingsCategory(id)}
                    >
                      <Icon size={15} aria-hidden="true" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              ))}
              {isAdmin && (
                <div className="settings-nav-group">
                  <span className="settings-group-label">Administration</span>
                  <button
                    id="settings-tab-admin"
                    type="button"
                    role="tab"
                    tabIndex={settingsCategory === "admin" ? 0 : -1}
                    aria-selected={settingsCategory === "admin"}
                    aria-controls="settings-category-panel"
                    className={`settings-nav-btn ${settingsCategory === "admin" ? "active" : ""}`}
                    onClick={() => setSettingsCategory("admin")}
                  >
                    <ShieldAlert size={15} aria-hidden="true" />
                    <span>Admin</span>
                  </button>
                </div>
              )}
            </nav>
            <div className="settings-category-content" id="settings-category-panel" role="tabpanel" aria-labelledby={`settings-tab-${settingsCategory}`}>
          {settingsCategory === "appearance" && <article className="settings-card appearance-card" id="settings-appearance">
            <div className="context-head"><div><h2>Appearance</h2><p>Choose a theme and reading density for this browser.</p></div><span className="local-label">Saved locally</span></div>
            <fieldset className="theme-fieldset"><legend>Theme</legend><div className="theme-options">{(["light", "dark", "system"] as const).map((theme) => <button type="button" key={theme} aria-pressed={preferences.theme === theme} className={preferences.theme === theme ? "selected" : ""} onClick={() => setPreferences((current) => ({ ...current, theme }))}>{theme === "system" ? "System" : theme === "dark" ? "Dark" : "Light"}</button>)}</div></fieldset>
            <label className="key-field density-field">Text density<select aria-label="Text density" value={preferences.textDensity} onChange={(event) => setPreferences((current) => ({ ...current, textDensity: event.target.value as UserPreferences["textDensity"] }))}><option value="comfortable">Comfortable reading</option><option value="compact">Compact</option></select></label>
            <p className="settings-explainer">{preferences.theme === "system" ? "System follows your device theme." : `${preferences.theme === "dark" ? "Dark" : "Light"} theme stays active in this browser.`} Comfortable reading uses slightly larger text and more generous line spacing.</p>
            {preferencesIssue && <p className="settings-data-issue" role="status">{preferencesIssue}</p>}
          </article>}
          {settingsCategory === "ai-models" && <>
          <div id="settings-ai-providers" className="settings-section-heading"><span className="eyebrow">CONNECTIONS & MODELS</span><h2>AI & Kat</h2><p>Choose how Kat and the Workspace assistant connect. Credentials stay server-side or in this tab’s memory; shared Kat settings are managed by an administrator.</p></div>
          <article className="settings-model-card model-settings-card" id="settings-models">
            <div className="context-head"><div><h2>Models</h2><p>Search and select from models this adapter supports.</p></div><span className="local-label">{selectedProvider.name}</span></div>
            <p className="active-model-setting">Active selection: <strong>{sharedKatMode ? "Kat AI" : selectedProvider.name}</strong>{sharedKatMode ? katModelId ? ` · ${katProviderId ? `${providerCatalog[katProviderId].name} · ` : ""}${katModelId}` : " · administrator-managed model" : selectedModel ? ` · ${selectedModel.name}` : " · no model selected"}</p>
            {sharedKatMode ? <p className="settings-explainer">The shared model is enabled by KATALYST administrators for Kat. Switch this connection to BYOK to select a personal model for Workspace.</p> : <>
              <div className="settings-model-controls">
                <label className="key-field">Search available models<input type="search" aria-label="Search models in settings" placeholder="Name, publisher, or model ID" value={modelSearch} onChange={(event) => setModelSearch(event.target.value)} /></label>
                {data.provider !== "ollama" && <label className="key-field">Filter by price<select aria-label="Filter by price" value={pricingFilter} onChange={(event) => setPricingFilter(event.target.value as PricingFilter)}><option value="all">All prices</option><option value="free">Free</option><option value="paid">Paid</option></select></label>}
                <label className="key-field">Selected model<select aria-label="Settings selected model" value={data.models[data.provider]} onChange={(event) => setData((current) => ({ ...current, models: { ...current.models, [current.provider]: event.target.value } }))} disabled={!displayedModels.length}><option value="">No supported models loaded</option>{displayedModels.map((model) => <option key={model.id} value={model.id}>{modelOptionLabel(model)}</option>)}</select></label>
                <button className="secondary-button" onClick={() => void loadModels(data.provider, true, sessionKeys[data.provider], data.ollamaBaseUrl || DEFAULT_OLLAMA_BASE_URL, sessionCloudflareAccountId)} disabled={modelState.loading}>{modelState.loading ? "Loading…" : "Refresh active catalog"}</button>
              </div>
              {modelState.error && <div className="inline-error" role="alert">{modelState.error}<button onClick={() => void loadModels(data.provider, true, sessionKeys[data.provider], data.ollamaBaseUrl || DEFAULT_OLLAMA_BASE_URL, sessionCloudflareAccountId)}>Retry</button></div>}
              <p className="model-catalog-summary">{modelState.models.length} supported model{modelState.models.length === 1 ? "" : "s"}{modelState.refreshedAt ? ` · ${modelState.cached ? "cached" : "checked"} ${new Date(modelState.refreshedAt).toLocaleTimeString()}` : " · select Refresh active catalog to check availability"}</p>
            </>}
          </article>
          {providerIds.map((providerId) => {
            const provider = providerCatalog[providerId];
            const configured = isProviderConfigured(providerId);
            const providerModels = modelCatalogs[providerId];
            const active = data.provider === providerId;
            const draftEntered = Boolean(sessionKeyDrafts[providerId].trim() || (providerId === "cloudflare" && sessionCloudflareAccountId.trim()));
            const keyConfigured = providerCredentialPresent(providerId);
            const credentialState = providerId === "ollama"
              ? configured ? "Local model list available" : "Local server not checked"
              : providerId === "openrouter" && !keyConfigured && data.models.openrouter === "openrouter/free" ? "No API key required for the free route"
              : configured
                ? sessionKeys[providerId].trim() || (providerId === "cloudflare" && sessionCloudflareAccountId.trim()) ? "Session credentials set for this tab" : keyConfigured ? "Server credentials configured" : "Provider route available without a key"
                : draftEntered ? "Credential entered · save or refresh to apply" : "Credentials missing";
            const discoveryState = providerModels.loading ? "Checking model catalog"
              : providerModels.error ? providerModels.errorKind ?? "Model discovery failed"
                : providerModels.refreshedAt ? providerId === "openai" ? `${providerModels.models.length} built-in models available` : providerId === "cloudflare" && providerModels.diagnostic ? `${providerModels.diagnostic.compatibleCount} compatible · ${providerModels.diagnostic.sourceCount} catalog entries` : providerModels.models.length ? `Model discovery successful · ${providerModels.models.length} compatible` : "No compatible models available"
                  : "Model discovery not checked";
            const authenticationState = providerId === "ollama" ? "No API key · local server required"
              : providerId === "cloudflare" && inferenceState.cloudflare === "success" ? "Authentication confirmed by successful inference"
                : providerId === "cloudflare" && inferenceState.cloudflare === "permission" ? "Inference authentication or permission failed"
                  : providerId === "cloudflare" && inferenceState.cloudflare === "quota" ? "Catalog accepted · inference hit an account usage limit"
                    : providerId === "cloudflare" && inferenceState.cloudflare === "network" ? "Catalog accepted · inference network failure"
                      : providerId === "cloudflare" && inferenceState.cloudflare === "failed" ? "Catalog accepted · inference failed"
                        : providerId === "cloudflare" && providerModels.refreshedAt && !providerModels.error ? "Catalog request accepted · inference untested"
              : inferenceState[providerId] === "success" ? "Authentication confirmed by successful inference"
                : inferenceState[providerId] === "permission" ? "Authentication or permission failed"
                  : inferenceState[providerId] === "quota" ? "Authenticated · quota or billing limit reached"
                    : providerModels.errorKind === "Authentication or permission failed" ? providerModels.errorKind
                      : providerModels.refreshedAt && configured && providerId !== "openai" && !providerModels.error ? "Authentication accepted for model discovery"
                          : providerId === "openrouter" && !keyConfigured && data.models.openrouter === "openrouter/free" ? "API key not used for the free route"
                        : configured ? "Credentials configured · not yet verified" : "No provider credentials configured";
            const lastInference = inferenceState[providerId] === "success" ? "Inference succeeded"
              : inferenceState[providerId] === "pending" ? "Inference test in progress"
              : inferenceState[providerId] === "permission" ? "Authentication or permission failure"
                : inferenceState[providerId] === "quota" ? "Quota or billing failure"
                  : inferenceState[providerId] === "network" ? "Network or provider failure"
                    : inferenceState[providerId] === "failed" ? "Provider rejected the request"
                      : "Inference not tested in this session";
            return <article className={`settings-card provider-settings-card ${active ? "provider-card-active" : ""}`} key={providerId}>
              <div className="settings-card-head"><div className="provider-logo large">{provider.logo}</div><div><h2>{provider.name}</h2><p>{provider.apiLabel} · {providerId === "ollama" ? "local inference" : "server-side requests"}</p></div><span className={`status-pill ${configured ? "ready" : "needs-setup"}`}><span className="connection-dot" />{active ? "Active provider" : "Available provider"}</span></div>
              <div className="provider-lifecycle" aria-label={`${provider.name} connection status`}><span><strong>Credentials</strong>{credentialState}</span><span><strong>Authentication</strong>{authenticationState}</span><span><strong>Catalog</strong>{discoveryState}</span><span><strong>Inference</strong>{lastInference}</span></div>
              {providerId === "ollama" ? <>
                <p className="settings-explainer">KATALYST connects to Ollama from this local server. Only HTTP loopback addresses on port 11434 are accepted; public deployments cannot use this provider. No API key is required and KATALYST will not download models.</p>
                <label className="key-field">Local Ollama address<input aria-label="Ollama local server address" type="url" spellCheck={false} maxLength={MAX_OLLAMA_URL_LENGTH} value={data.ollamaBaseUrl || DEFAULT_OLLAMA_BASE_URL} onChange={(event) => updateOllamaBaseUrl(event.target.value)} /></label>
                <p className="ollama-guidance">Install Ollama locally, start its server, then install a model yourself (for example, with <code>ollama pull &lt;model-name&gt;</code>). Model size is the download size; RAM and speed also depend on quantization, context length, and available hardware. Context limits are not reported by the model-list API.</p>
              </> : <>
                <p className="settings-explainer">Server credentials stay on the server. A session credential is held only in this tab, sent to KATALYST’s server over HTTPS, and cleared when this page reloads. It is never saved to browser storage or chat data.</p>
                {providerId === "cloudflare" && <fieldset className="cloudflare-mode-fieldset"><legend>Cloudflare access</legend><label><input type="radio" name="cloudflare-access-mode" checked={cloudflareMode === "platform"} onChange={() => setCloudflareMode("platform")} /><span><strong>Shared KATALYST access</strong><small>Uses server-managed credentials and your KATALYST credit allowance.</small></span></label><label><input type="radio" name="cloudflare-access-mode" checked={cloudflareMode === "byok"} onChange={() => setCloudflareMode("byok")} /><span><strong>Bring your own key</strong><small>Use a personal account. Its usage is billed by Cloudflare.</small></span></label></fieldset>}
                {providerId === "cloudflare" && cloudflareMode === "byok" && <label className="key-field">Personal Cloudflare account ID<input aria-label="Cloudflare account ID" type="text" autoComplete="off" spellCheck={false} maxLength={128} value={sessionCloudflareAccountId} placeholder="Enter your account ID for this tab" onChange={(event) => updateCloudflareAccountId(event.target.value)} /></label>}
                {(providerId !== "cloudflare" || cloudflareMode === "byok") && <div className="credential-input-row"><label className="key-field">{providerId === "cloudflare" ? "Personal Cloudflare API token" : provider.name + " API key"}<input aria-label={provider.name + " session API key"} type={visibleKeys[providerId] ? "text" : "password"} autoComplete="new-password" spellCheck={false} maxLength={2048} value={sessionKeyDrafts[providerId]} placeholder="Credential kept only for this tab" onChange={(event) => updateSessionKeyDraft(providerId, event.target.value)} /></label><button className="secondary-button reveal-key" type="button" aria-label={visibleKeys[providerId] ? "Hide credential" : "Show credential"} aria-pressed={visibleKeys[providerId]} onClick={() => setVisibleKeys((current) => ({ ...current, [providerId]: !current[providerId] }))}>{visibleKeys[providerId] ? "Hide" : "Show"}</button></div>}
              </>}
              <div className="provider-card-actions model-actions">
                <span>{active ? "Active provider for new requests" : "Available provider"}</span>
                <div>
                  {!(providerId === "cloudflare" && cloudflareMode === "platform") && <button className="secondary-button" onClick={() => refreshProviderModels(providerId)} disabled={providerModels.loading}>{providerModels.loading ? "Checking…" : "Save & refresh models"}</button>}
                  {providerId === "cloudflare" && cloudflareMode === "byok" && <button className="secondary-button" onClick={() => void testCloudflareInference()} disabled={inferenceState.cloudflare === "pending" || !providerModels.models.some((model) => model.id === data.models.cloudflare)}>{inferenceState.cloudflare === "pending" ? "Testing inference…" : "Test inference"}</button>}
                  {providerId !== "ollama" && (providerId !== "cloudflare" || cloudflareMode === "byok") && <><button className="secondary-button" onClick={() => updateSessionKey(providerId, sessionKeyDrafts[providerId])} disabled={sessionKeyDrafts[providerId] === sessionKeys[providerId]}>Save for this tab</button>{(sessionKeys[providerId] || sessionKeyDrafts[providerId]) && <button className="secondary-button" onClick={() => updateSessionKey(providerId, "")}>Clear session key</button>}</>}
                  {providerId === "cloudflare" && sessionCloudflareAccountId && <button className="secondary-button" onClick={() => updateCloudflareAccountId("")}>Clear session account ID</button>}
                  {!active && <button className="secondary-button" onClick={() => {
                    setData((current) => ({ ...current, provider: providerId }));
                    if (providerCatalog[providerId].dynamicModels && configured && !modelCatalogs[providerId].models.length && !modelCatalogs[providerId].refreshedAt) {
                      void loadModels(providerId, false, sessionKeys[providerId], data.ollamaBaseUrl || DEFAULT_OLLAMA_BASE_URL, sessionCloudflareAccountId);
                    }
                  }}>Use {provider.name}</button>}
                </div>
              </div>
              {providerModels.error && <div className="inline-error" role="alert">{providerModels.error}</div>}
              {providerId === "cloudflare" && cloudflareInferenceTestMessage && <p className={`provider-test-feedback ${inferenceState.cloudflare && !["success", "pending"].includes(inferenceState.cloudflare) ? "failed" : ""}`} role="status">{cloudflareInferenceTestMessage}</p>}
              {providerModels.selectionIssue && <div className="inline-error" role="alert">{providerModels.selectionIssue}</div>}
              {providerId === "cloudflare" && cloudflareMode === "platform" ? <div className="model-catalog-summary">Managed by KATALYST admins · available only in Kat AI</div> : <div className="model-catalog-summary">{providerModels.models.length} supported model{providerModels.models.length === 1 ? "" : "s"}{providerModels.refreshedAt ? ` · ${providerModels.cached ? "cached · " : "refreshed "}${new Date(providerModels.refreshedAt).toLocaleTimeString()}` : " · not loaded yet"}{providerId === "cloudflare" && providerModels.diagnostic ? ` · ${providerModels.diagnostic.sourceCount} raw catalog entries` : ""}</div>}
              {providerId === "cloudflare" && providerModels.diagnostic && <p className="model-catalog-diagnostic" role="status">{providerModels.diagnostic.message}</p>}
              {providerId === "ollama" && <div className="setup-steps"><strong>Local setup</strong><ol><li>Install Ollama using its official installer.</li><li>Start the Ollama server on this same machine.</li><li>Install a model outside KATALYST, then refresh the list.</li></ol><span>Local inference has no KATALYST cloud API charge. Hardware performance varies by model and machine.</span></div>}
              {providerId === "cloudflare" && <div className="setup-steps cloudflare-setup"><strong>Shared access and BYOK</strong><p>Shared mode keeps platform credentials on the KATALYST server and applies your KATALYST credit allowance. BYOK sends your personal credentials to the KATALYST server for the current request only; your Cloudflare account handles its own usage and billing.</p><span>Browser requests in shared mode contain no Cloudflare account ID or API token.</span></div>}
              {providerId !== "ollama" && providerId !== "cloudflare" && !configured && <div className="setup-steps"><strong>Provider setup</strong><p>The deployment operator may configure this provider on the server. You can also enter your own credential above; it stays in this tab’s memory and is sent only to KATALYST’s server.</p><span>Provider usage and charges follow {provider.name} terms.</span></div>}
            </article>;
          })}
          {renderUsageAndCreditsSettings()}
          </>}
          {settingsCategory === "learning" && <article className="settings-card learning-settings-card" id="settings-learning"><div className="context-head"><div><h2>Learning</h2><p>Learning progress is stored separately from workspace backups.</p></div><span className="local-label">Explicit completion</span></div><p className="settings-explainer">KATALYST records path enrollment, lesson opens, and lessons you mark complete. It does not infer mastery from chat history or time spent. Current progress stays in this browser.</p><button className="secondary-button" onClick={() => setView("progress")}>Open Progress dashboard</button></article>}
          {settingsCategory === "workspace" && <>
          <div id="settings-workspace" className="settings-section-heading"><span className="eyebrow">LOCAL DATA</span><h2>Workspace</h2><p>Export, restore, and manage your projects and conversations.</p></div>
          <article className="settings-card backup-card">
            <div className="context-head"><div><h2>Workspace backup</h2><p>Export or restore this browser’s projects, conversations, skills, and provider/model preferences.</p></div><span className="local-label">JSON · local only</span></div>
            {backupImportError && <div className="inline-error" role="alert">{backupImportError}</div>}
            {backupImportSuccess && <div className="success-message" role="status">{backupImportSuccess}</div>}
            <div className="backup-actions"><button className="primary-button" onClick={exportWorkspace}><Download size={15} /> Export workspace</button></div>
            <div className="backup-selectors">
              <label>Project to export<select aria-label="Project to export" value={projectForExport?.id ?? ""} onChange={(event) => { setSelectedProjectExportId(event.target.value); setSelectedConversationExportId(""); }}><option value="" disabled>Select a project</option>{data.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
              <button className="secondary-button" onClick={exportProject} disabled={!projectForExport}><FileDown size={14} /> Export project</button>
              <label>Conversation to export<select aria-label="Conversation to export" value={conversationForExport?.id ?? ""} onChange={(event) => setSelectedConversationExportId(event.target.value)} disabled={!projectForExport?.chats.length}><option value="" disabled>{projectForExport?.chats.length ? "Select a conversation" : "No conversations in this project"}</option>{projectForExport?.chats.map((chat) => <option key={chat.id} value={chat.id}>{chat.title}</option>)}</select></label>
              <button className="secondary-button" onClick={exportConversation} disabled={!conversationForExport}><FileDown size={14} /> Export conversation</button>
            </div>
            <div className="restore-panel"><div><strong>Restore a backup</strong><p>Merge adds records without overwriting existing ones. ID conflicts are remapped. Replace is available for full workspace backups and requires confirmation.</p></div><div className="restore-controls"><label>Import behavior<select aria-label="Import behavior" value={backupMode} onChange={(event) => setBackupMode(event.target.value as ImportMode)}><option value="merge">Merge safely</option><option value="replace">Replace workspace</option></select></label><button className="secondary-button" onClick={() => backupFileRef.current?.click()}><FileUp size={14} /> Choose backup file</button><input ref={backupFileRef} className="visually-hidden" type="file" accept=".json,application/json" aria-label="Choose a KATALYST backup JSON file" onChange={(event) => void importBackup(event.target.files?.[0])} /></div></div>
            <p className="backup-note">Backups contain project instructions, conversations, imported skill content and metadata, and model preferences. Session API keys and server credentials are excluded. Recognized credential strings in workspace text are redacted from exports. Keep backup files private.</p>
          </article>
          <article className="settings-card project-context"><div className="context-head"><div><h2>Project instructions</h2><p>Context included in each request for this project.</p></div><span className="local-label">Stored in this browser</span></div><textarea name="project-instructions" autoComplete="off" aria-label="Project instructions" value={activeProject?.instructions ?? ""} onChange={(event) => { if (!activeProject) return; setData((current) => ({ ...current, projects: current.projects.map((project) => project.id === activeProject.id ? { ...project, instructions: event.target.value.slice(0, 4_000) } : project) })); }} placeholder="For example: Use TypeScript, prefer small modules, and explain trade-offs." maxLength={4000} /><span className="field-count">{activeProject?.instructions.length ?? 0} / 4,000</span></article>
          </>}
          {settingsCategory === "privacy" && <>
          <div id="settings-privacy" className="settings-section-heading"><span className="eyebrow">DATA HANDLING</span><h2>Privacy and security</h2></div>
          <article className="settings-card privacy-settings-card"><p>Workspace records, learning progress, appearance preferences, and AI activity analytics stay in this browser while you use guest mode. When you explicitly connect an account, workspace snapshots, learning progress, and appearance preferences sync to that account. AI activity remains local and contains provider, model, request time, outcome, and provider-reported token counts only.</p><p>Provider keys entered for this tab are held in memory and sent to KATALYST’s server in request headers. They are never included in account snapshots. Server environment keys never enter the browser bundle. Workspace exports exclude keys and redact recognized credential strings.</p><p>Browser storage is not an encrypted backup. Account data is subject to the configured Supabase project’s access controls and backup retention. Export a private copy before clearing site data.</p></article>
          </>}
          {settingsCategory === "account" && <>
          <div id="settings-account" className="settings-section-heading"><span className="eyebrow">OPTIONAL ACCOUNT</span><h2>Account</h2></div>
          {renderAccountSettings()}
          </>}
          {settingsCategory === "admin" && isAdmin && <>
          <div id="settings-admin" className="settings-section-heading"><span className="eyebrow">ADMINISTRATION</span><h2>AI Controls</h2></div>
          <AdminPanel />
          </>}
          </div>
          </div>
        </section> : null}

        {view === "workspace" ? <div className="conversation-layout">
          {!activeChat?.messages.length ? <div className="welcome-area">
            <div className="welcome-orbit"><BrandMark className="welcome-mark" /><span className="orbit-node node-a" /><span className="orbit-node node-b" /><span className="orbit-node node-c" /></div>
            <span className="eyebrow welcome-eyebrow">A WORKSPACE THAT WORKS YOUR WAY</span><h1>Make room for<br /><em>what comes next.</em></h1><p className="welcome-copy">Bring a model, add the right skills, and get to work in your own space.</p>
            <div className="suggestion-list">{starterPrompts.map((item, index) => <button key={item.title} className="suggestion" onClick={() => { setPrompt(item.prompt); textareaRef.current?.focus(); }}><span className={`suggestion-glyph glyph-${index}`}>{index === 0 ? <ArrowUp size={15} /> : index === 1 ? <Command size={15} /> : <BookOpen size={15} />}</span><span><strong>{item.title}</strong><small>{item.prompt}</small></span><ArrowDown size={14} className="suggestion-arrow" /></button>)}</div>
            {!providerConfigured && <button className="setup-nudge" onClick={() => openSettings("ai-models")}><span className="connection-dot" />Set up AI access in Settings <ArrowDown size={14} /></button>}
          </div> : <div className="messages-scroll"><div className="message-thread" aria-live="polite">
            {activeChat.messages.map((message, index) => {
              const usageDetails = [
                message.usage?.inputTokens !== undefined ? `${message.usage.inputTokens.toLocaleString()} input tokens` : undefined,
                message.usage?.outputTokens !== undefined ? `${message.usage.outputTokens.toLocaleString()} output tokens` : undefined,
                message.usage?.costUsd !== undefined ? `$${new Intl.NumberFormat("en-US", { maximumSignificantDigits: 8 }).format(message.usage.costUsd)} reported cost` : undefined,
              ].filter(Boolean).join(" · ");
              return <div key={`${activeChat.id}-${index}`} className={`message ${message.role}`}>
                <div className="message-avatar">{message.role === "user" ? "Y" : <BrandMark className="mini-brand" />}</div>
                <div className="message-body"><div className="message-heading"><span className="message-author">{message.role === "user" ? "You" : "Katalyst"}</span><div className="message-actions">
                  <button className="message-action" aria-label={`Copy message ${index + 1}`} title="Copy message" onClick={() => void copyMessage(message.content, index)}><Copy size={13} /></button>
                  {message.role === "user" && <button className="message-action" aria-label="Edit and resend message" title="Edit and resend" onClick={() => editUserMessage(index, message)}><SquarePen size={13} /></button>}
                  {message.role === "assistant" && index === activeChat.messages.length - 1 && <button className="message-action" aria-label="Regenerate response" title="Regenerate response" disabled={pending} onClick={regenerateLastResponse}><RotateCcw size={13} /></button>}
                </div></div>{message.role === "assistant" ? <AssistantMarkdown content={message.content} /> : <p>{message.content}</p>}
                  {message.requestStatus === "complete" && <div className="message-metadata">Request complete{usageDetails ? ` · ${usageDetails}` : ""}</div>}
                  {message.role === "user" && message.appliedSkills?.length ? <div className="applied-skills" aria-label="Skills applied to this request"><Sparkles size={12} /><span>Skills used: {message.appliedSkills.map((skill) => skill.name).join(", ")}</span></div> : null}
                  {message.role === "user" && message.omittedSkills?.length ? <div className="omitted-skills">Not included: {message.omittedSkills.map((skill) => `${skill.name} (${skill.reason === "prompt-limit" ? "prompt limit" : "duplicate instructions"})`).join(", ")}</div> : null}
                </div>
              </div>;
            })}
            {pending && <div className="message assistant"><div className="message-avatar"><BrandMark className="mini-brand" /></div><div className="message-body"><span className="message-author">Katalyst</span><div className="typing-indicator"><i /><i /><i /></div><span className="sr-only">Generating a response</span><button className="stop-generation" onClick={stopGeneration}>Stop generation</button></div></div>}
            {error && <div className="send-error" role="alert"><strong>Couldn’t get a response</strong><span>{error}</span>{retryRequestRef.current && <button onClick={retryLastRequest}><RotateCcw size={12} /> Retry request</button>}<button onClick={() => openSettings("ai-models")}>Open AI settings</button></div>}
            {copyStatus && <span className="sr-only" role="status">{copyStatus}</span>}
          </div></div>}
          <div className={`composer-wrap ${!activeChat?.messages.length ? "composer-welcome" : ""}`}>
            {editingMessageIndex !== null && <div className="edit-mode"><span>Editing a message. Sending will replace it and remove later turns.</span><button onClick={() => { setEditingMessageIndex(null); setPrompt(""); }}>Cancel edit</button></div>}
            <form className="composer" onSubmit={onSubmit}><textarea ref={textareaRef} name="message" autoComplete="off" value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} rows={1} maxLength={8000} aria-label="Message Katalyst" placeholder="Ask anything, or bring in a skill…" disabled={pending} /><div className="composer-toolbar"><div className="composer-tools"><button type="button" className={`skill-chip ${enabledSkills.length ? "skill-chip-active" : ""}`} onClick={() => setView("skills")}><Sparkles size={14} /><span>{enabledSkills.length ? `${enabledSkills.length} skill${enabledSkills.length > 1 ? "s" : ""}` : "Add a skill"}</span></button><span className="composer-separator" /><button type="button" className="model-caption" onClick={() => openSettings("ai-models")}><Settings2 size={13} /><span>AI settings</span></button></div><button className="send-button" aria-label="Send message" disabled={!prompt.trim() || pending || !selectedModel}><ArrowUp size={18} /></button></div></form><div className="composer-footnote">AI can make mistakes. Check important information.</div></div>
        </div> : null}
      </main>
    </div>
  );
}
