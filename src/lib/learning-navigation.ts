export const applicationViews = [
  "home",
  "paths",
  "my-learning",
  "playground",
  "practice",
  "progress",
  "tutor",
  "lesson",
  "workspace",
  "skills",
  "settings",
] as const;

export type ApplicationView = (typeof applicationViews)[number];
export type ApplicationLocation = { view: ApplicationView; lessonId?: string };

const applicationViewSet = new Set<string>(applicationViews);
const lessonIdPattern = /^[a-z0-9-]{1,100}$/;

export function makeApplicationHash(view: ApplicationView, lessonId?: string): string {
  const params = new URLSearchParams({ katalyst: view });
  if ((view === "lesson" || view === "playground" || view === "tutor") && lessonId && lessonIdPattern.test(lessonId)) {
    params.set("lesson", lessonId);
  }
  return `#${params.toString()}`;
}

export function readApplicationHash(hash: string): ApplicationLocation | null {
  if (!hash.startsWith("#katalyst=")) return null;
  const params = new URLSearchParams(hash.slice(1));
  const view = params.get("katalyst");
  if (!view || !applicationViewSet.has(view)) return null;
  const lessonId = params.get("lesson") ?? undefined;
  if (lessonId && !lessonIdPattern.test(lessonId)) return null;
  return {
    view: view as ApplicationView,
    ...(lessonId && (view === "lesson" || view === "playground" || view === "tutor") ? { lessonId } : {}),
  };
}
