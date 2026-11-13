export const WORKSPACE_LAYOUT_STORAGE_KEY = "katalyst.workspace-layout.v1";

export interface WorkspaceLayout {
  threePanelWidths: [number, number, number];
  twoPanelWidths: [number, number];
  katOpen?: boolean;
}

export const DEFAULT_WORKSPACE_LAYOUT: WorkspaceLayout = {
  threePanelWidths: [35, 35, 30],
  twoPanelWidths: [50, 50],
  katOpen: false,
};

export function readWorkspaceLayout(storage?: Pick<Storage, "getItem">): WorkspaceLayout {
  try {
    const target = storage ?? (typeof window !== "undefined" ? window.localStorage : undefined);
    if (!target) return DEFAULT_WORKSPACE_LAYOUT;
    const raw = target.getItem(WORKSPACE_LAYOUT_STORAGE_KEY);
    if (!raw) return DEFAULT_WORKSPACE_LAYOUT;
    const parsed = JSON.parse(raw);
    const hasThree =
      Array.isArray(parsed.threePanelWidths) &&
      parsed.threePanelWidths.length === 3 &&
      parsed.threePanelWidths.every((n: unknown) => typeof n === "number" && n >= 15 && n <= 70);

    return {
      threePanelWidths: hasThree
        ? (parsed.threePanelWidths as [number, number, number])
        : DEFAULT_WORKSPACE_LAYOUT.threePanelWidths,
      twoPanelWidths:
        Array.isArray(parsed.twoPanelWidths) && parsed.twoPanelWidths.length === 2
          ? (parsed.twoPanelWidths as [number, number])
          : DEFAULT_WORKSPACE_LAYOUT.twoPanelWidths,
      katOpen: typeof parsed.katOpen === "boolean" ? parsed.katOpen : DEFAULT_WORKSPACE_LAYOUT.katOpen,
    };
  } catch {
    return DEFAULT_WORKSPACE_LAYOUT;
  }
}

export function writeWorkspaceLayout(layout: WorkspaceLayout, storage?: Pick<Storage, "setItem">): boolean {
  try {
    const target = storage ?? (typeof window !== "undefined" ? window.localStorage : undefined);
    if (!target) return false;
    target.setItem(WORKSPACE_LAYOUT_STORAGE_KEY, JSON.stringify(layout));
    return true;
  } catch {
    return false;
  }
}
