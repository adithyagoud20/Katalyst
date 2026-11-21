"use client";

import dynamic from "next/dynamic";
import type { LessonToolsProps } from "@/components/lesson-tools";

const LessonTools = dynamic(() => import("@/components/lesson-tools").then((module) => module.LessonTools), {
  ssr: false,
  loading: () => <section className="lesson-tools-loading" aria-busy="true">Loading lesson tools…</section>,
});

export function LessonToolsLoader(props: LessonToolsProps) {
  return <LessonTools {...props} />;
}
