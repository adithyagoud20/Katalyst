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
export type ApplicationCourseIndex = {
  id: string;
  modules: Array<{ lessons: Array<{ id: string }> }>;
};
export type ApplicationLessonRoute = { courseId: string; lessonSlug: string };

const applicationPaths: Partial<Record<ApplicationView, string>> = {
  home: "/",
  paths: "/paths",
  "my-learning": "/my-learning",
  playground: "/playground",
  practice: "/practice",
  progress: "/progress",
  tutor: "/tutor",
  workspace: "/workspace",
  skills: "/skills",
  settings: "/settings",
};

const applicationViewSet = new Set<string>(applicationViews);
const lessonIdPattern = /^[a-z0-9-]{1,100}$/;
const routeSlugPattern = /^[a-z0-9-]{1,100}$/;

export function applicationViewFromPathname(pathname: string): ApplicationView | null {
  if (pathname === "/") return "home";
  for (const [view, path] of Object.entries(applicationPaths)) {
    if (path === pathname) return view as ApplicationView;
  }
  return null;
}

export function findCourseSlugForLesson(
  courses: readonly ApplicationCourseIndex[],
  lessonId: string | undefined
): string | undefined {
  if (!lessonId || !lessonIdPattern.test(lessonId)) return undefined;
  return courses.find((course) => course.modules.some((module) => module.lessons.some((lesson) => lesson.id === lessonId)))?.id;
}

export function makeApplicationPath(
  view: ApplicationView,
  options: { lessonId?: string; courseSlug?: string; lang?: string } = {}
): string {
  if (view === "lesson") {
    if (options.courseSlug && routeSlugPattern.test(options.courseSlug) && options.lessonId && lessonIdPattern.test(options.lessonId)) {
      return `/courses/${options.courseSlug}/${options.lessonId}`;
    }
    return "/paths";
  }

  const pathname = applicationPaths[view] ?? "/";
  const query = new URLSearchParams();
  if ((view === "playground" || view === "tutor") && options.lessonId && lessonIdPattern.test(options.lessonId)) {
    query.set("lesson", options.lessonId);
  }
  if (view === "playground" && options.lang && /^[a-z]{1,16}$/i.test(options.lang)) {
    query.set("lang", options.lang.toLowerCase());
  }
  const search = query.toString();
  return search ? `${pathname}?${search}` : pathname;
}

export function makeApplicationPathFromHash(hash: string, courses: readonly ApplicationCourseIndex[]): string | null {
  const location = readApplicationHash(hash);
  if (!location) return null;
  const params = new URLSearchParams(hash.slice(1));
  const courseSlug = location.view === "lesson" ? findCourseSlugForLesson(courses, location.lessonId) : undefined;
  if (location.view === "lesson" && !courseSlug) return "/paths";
  return makeApplicationPath(location.view, {
    lessonId: location.lessonId,
    courseSlug,
    lang: params.get("lang") ?? undefined,
  });
}

export function makeApplicationPathFromLessonRoutes(hash: string, routes: readonly ApplicationLessonRoute[]): string | null {
  const location = readApplicationHash(hash);
  if (!location) return null;
  const params = new URLSearchParams(hash.slice(1));
  const courseSlug = location.view === "lesson"
    ? routes.find((route) => route.lessonSlug === location.lessonId)?.courseId
    : undefined;
  if (location.view === "lesson" && !courseSlug) return "/paths";
  return makeApplicationPath(location.view, {
    lessonId: location.lessonId,
    courseSlug,
    lang: params.get("lang") ?? undefined,
  });
}

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
