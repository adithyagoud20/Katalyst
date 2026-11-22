import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { LessonMarkdown } from "@/components/lesson-markdown";
import { publishedCourseSummaries, publishedLessonRouteParams } from "@/data/curriculum/course-summaries";
import { loadCourseDetail } from "@/data/curriculum/course-loader";
import { getSiteOrigin } from "@/lib/site-origin";
import { createPageMetadata } from "@/lib/page-metadata";

export const dynamicParams = false;

export function generateStaticParams() {
  return publishedLessonRouteParams.map(({ courseId, lessonSlug }) => ({ courseId, lessonSlug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ courseId: string; lessonSlug: string }>;
}) {
  const { courseId, lessonSlug } = await params;
  const course = await loadCourseDetail(courseId);
  const lesson = course?.modules.flatMap((moduleItem) => moduleItem.lessons).find((lessonItem) => lessonItem.id === lessonSlug);
  const pathname = `/courses/${courseId}/${lessonSlug}`;
  if (!course || !lesson) {
    return { title: "Lesson not found", robots: { index: false, follow: false } };
  }
  return createPageMetadata({
    title: `${lesson.title} — ${course.title}`,
    description: lesson.summary,
    pathname,
  });
}

export default async function LessonRoute({
  params,
}: {
  params: Promise<{ courseId: string; lessonSlug: string }>;
}) {
  const { courseId, lessonSlug } = await params;
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const course = await loadCourseDetail(courseId);
  const courseSummary = publishedCourseSummaries.find((item) => item.slug === courseId);
  const lessonModule = course?.modules.find((item) => item.lessons.some((lesson) => lesson.id === lessonSlug));
  const lessonIndex = lessonModule?.lessons.findIndex((lesson) => lesson.id === lessonSlug) ?? -1;
  const lesson = lessonIndex >= 0 ? lessonModule?.lessons[lessonIndex] : undefined;
  if (!course || !courseSummary || !lessonModule || !lesson) notFound();

  const siteOrigin = getSiteOrigin();
  const lessonUrl = new URL(`/courses/${course.id}/${lesson.id}`, siteOrigin).toString();
  const courseUrl = new URL(`/courses/${course.id}`, siteOrigin).toString();
  const breadcrumbJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Courses", item: new URL("/courses", siteOrigin).toString() },
      { "@type": "ListItem", position: 2, name: course.title, item: courseUrl },
      { "@type": "ListItem", position: 3, name: lesson.title, item: lessonUrl },
    ],
  }).replace(/</g, "\\u003c");

  return (
    <>
      <div className="sr-only" aria-hidden="true">
        <h1>{lesson.title}</h1>
        <p>{lesson.summary}</p>
        <section aria-labelledby="lesson-objectives-heading">
          <h2 id="lesson-objectives-heading">What you will learn</h2>
          <ul>
            {lesson.objectiveIds.map((objectiveId) => {
              const objective = course.objectives.find((item) => item.id === objectiveId);
              return objective ? <li key={objectiveId}>{objective.title}</li> : null;
            })}
          </ul>
        </section>
        <article aria-label="Lesson text">
          {lesson.theorySections?.length ? (
            lesson.theorySections.map((section) => (
              <section key={section.id}>
                <h2>{section.title}</h2>
                <LessonMarkdown content={section.content} />
              </section>
            ))
          ) : (
            <LessonMarkdown content={lesson.content} />
          )}
        </article>
      </div>
      <script nonce={nonce} type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd }} />
    </>
  );
}
