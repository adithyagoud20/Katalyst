import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { BrandMark } from "@/components/brand-mark";
import { LessonMarkdown } from "@/components/lesson-markdown";
import { LessonToolsLoader } from "@/components/lesson-tools-loader";
import { publishedCourseSummaries, publishedLessonRouteParams } from "@/data/curriculum/course-summaries";
import { loadCourseDetail } from "@/data/curriculum/course-loader";
import { resolveLessonExecution, resolveLessonType } from "@/lib/learning-model";
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

  const execution = resolveLessonExecution(course, lesson)
    ?? (lesson.codeExamples?.[0] ? { language: lesson.codeExamples[0].language } : undefined);
  const previousLesson = lessonIndex > 0 ? lessonModule.lessons[lessonIndex - 1] : undefined;
  const nextLesson = lessonModule.lessons[lessonIndex + 1];
  const lessonType = resolveLessonType(lesson);
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
    <main className="course-public-page lesson-public-page">
      <div className="course-public-shell">
        <header className="course-public-header">
          <Link href="/" className="legal-brand"><BrandMark className="brand-mark" /><span>KATALYST</span></Link>
          <Link href={`/courses/${course.id}`}>Course overview</Link>
        </header>
        <nav className="lesson-public-breadcrumbs" aria-label="Breadcrumb">
          <Link href="/courses">Courses</Link><span aria-hidden="true">/</span><Link href={`/courses/${course.id}`}>{course.title}</Link><span aria-hidden="true">/</span><span>{lessonModule.title}</span>
        </nav>
        <article className="lesson-public-content">
          <header className="lesson-public-heading">
            <div className="lesson-public-meta"><span>{courseSummary.subjectTitle}</span><span>{lessonType.replaceAll("-", " ")}</span>{lesson.estimatedDurationMinutes ? <span>{lesson.estimatedDurationMinutes} min</span> : null}</div>
            <h1>{lesson.title}</h1>
            <p className="course-public-description">{lesson.summary}</p>
          </header>

          <section className="lesson-public-objectives" aria-labelledby="lesson-objectives-heading">
            <h2 id="lesson-objectives-heading">What you will learn</h2>
            <ul>{lesson.objectiveIds.map((objectiveId) => {
              const objective = course.objectives.find((item) => item.id === objectiveId);
              return objective ? <li key={objectiveId}>{objective.title}</li> : null;
            })}</ul>
          </section>

          <article className="lesson-public-reading" aria-label="Lesson text">
            {lesson.theorySections?.length ? lesson.theorySections.map((section) => (
              <section key={section.id}>
                <h2>{section.title}</h2>
                <LessonMarkdown content={section.content} />
              </section>
            )) : <LessonMarkdown content={lesson.content} />}
          </article>

          {lesson.codeExamples?.length ? <section className="lesson-public-examples" aria-label="Code examples">
            <h2>Code examples</h2>
            {lesson.codeExamples.map((example, index) => <article key={`${example.title}-${index}`}>
              <div><h3>{example.title}</h3><span>{example.language.toUpperCase()}</span></div>
              {example.description ? <p>{example.description}</p> : null}
              <pre><code>{example.code}</code></pre>
            </article>)}
          </section> : null}

          {lesson.exampleRun ? <section className="lesson-public-example-run" aria-label="Expected example output">
            <h2>Example run</h2>
            {lesson.exampleRun.sampleInput !== undefined ? <div><strong>Sample input</strong><pre><code>{lesson.exampleRun.sampleInput}</code></pre></div> : null}
            <div><strong>Expected output</strong><pre><code>{lesson.exampleRun.expectedOutput}</code></pre></div>
          </section> : null}

          <section className="lesson-public-exercise" aria-labelledby="lesson-exercise-heading">
            <span className="eyebrow">PRACTICAL EXERCISE · {lesson.exercise.difficulty.toUpperCase()}</span>
            <h2 id="lesson-exercise-heading">{lesson.exercise.title}</h2>
            <p>{lesson.exercise.prompt}</p>
            <p><strong>Practice goal:</strong> {lesson.exercise.expectedOutcome}</p>
            {lesson.exercise.starterCode ? <details><summary>Show {lesson.exercise.language === "javascript" ? "JavaScript " : lesson.exercise.language ? `${lesson.exercise.language.toUpperCase()} ` : ""}starter code</summary><pre><code>{lesson.exercise.starterCode}</code></pre></details> : null}
            {(lesson.exercise.hints?.length || lesson.exercise.hint) ? <details><summary>Show a hint</summary><ul>{(lesson.exercise.hints?.length ? lesson.exercise.hints : [lesson.exercise.hint!]).map((hint, index) => <li key={index}>{hint}</li>)}</ul></details> : null}
            <details><summary>Reveal a suggested answer</summary><LessonMarkdown content={lesson.exercise.solution} /></details>
            {lesson.exercise.testCases?.length ? <p>{lesson.exercise.testCases.length} automated checks are available in the code tool.</p> : null}
          </section>

          {lesson.checkpoint ? <section className="lesson-public-checkpoint">
            <h2>Check your understanding</h2><p>{lesson.checkpoint.prompt}</p><details><summary>Show explanation</summary><p>{lesson.checkpoint.answer}</p></details>
          </section> : null}

          {lesson.resources?.length ? <section className="lesson-public-resources">
            <h2>Resources and references</h2><ul>{lesson.resources.map((resource, index) => <li key={`${resource.title}-${index}`}>
              <strong>{resource.title}</strong><span>{resource.description}</span>{resource.url ? <a href={resource.url} target="_blank" rel="noreferrer">Open resource</a> : null}
            </li>)}</ul>
          </section> : null}

          {lesson.interactiveDemo ? <section className="lesson-public-demo-note">
            <h2>{lesson.interactiveDemo.title ?? "Interactive demonstration"}</h2>
            {lesson.interactiveDemo.description ? <p>{lesson.interactiveDemo.description}</p> : null}
            <p>Open the simulator below to explore this concept.</p>
          </section> : null}

          <LessonToolsLoader
            courseId={course.id}
            lessonId={lesson.id}
            lessonTitle={lesson.title}
            exerciseId={lesson.exercise.id}
            execution={execution}
            initialCode={lesson.codeExamples?.find((example) => example.language === execution?.language)?.code ?? lesson.exercise.starterCode ?? ""}
            exerciseStarterCode={lesson.exercise.starterCode}
            testCases={lesson.exercise.testCases ?? []}
            sampleInput={lesson.exampleRun?.sampleInput}
            interactiveDemo={lesson.interactiveDemo}
          />
        </article>
        <nav className="lesson-public-pagination" aria-label="Lesson navigation">
          {previousLesson ? <Link href={`/courses/${course.id}/${previousLesson.id}`}><span>Previous lesson</span><strong>{previousLesson.title}</strong></Link> : <span />}
          {nextLesson ? <Link href={`/courses/${course.id}/${nextLesson.id}`}><span>Next lesson</span><strong>{nextLesson.title}</strong></Link> : <Link href={`/courses/${course.id}`}><span>Course complete</span><strong>Back to course</strong></Link>}
        </nav>
        <footer className="public-course-footer"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/account/delete">Account deletion</Link></footer>
      </div>
      <script nonce={nonce} type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd }} />
    </main>
  );
}
