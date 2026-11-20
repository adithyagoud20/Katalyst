import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { publishedCourseSummaries } from "@/data/curriculum/course-summaries";
import { loadCourseDetail } from "@/data/curriculum/course-loader";
import { getSiteOrigin } from "@/lib/site-origin";

const siteOrigin = getSiteOrigin();

export const dynamicParams = false;

export function generateStaticParams() {
  return publishedCourseSummaries.map((course) => ({ courseId: course.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ courseId: string }> }): Promise<Metadata> {
  const { courseId } = await params;
  const course = await loadCourseDetail(courseId);
  if (!course) return { title: "Course not found" };
  return {
    title: course.title,
    description: course.description,
    alternates: { canonical: "/courses/" + course.id },
    keywords: [course.title, course.level, ...course.learningOutcomes],
    openGraph: {
      type: "article",
      url: new URL("/courses/" + course.id, siteOrigin).toString(),
      siteName: "KATALYST",
      title: course.title + " — KATALYST",
      description: course.description,
      images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: "KATALYST course: " + course.title }],
    },
    twitter: { card: "summary_large_image", title: course.title + " — KATALYST", description: course.description, images: ["/opengraph-image.png"] },
  };
}

export default async function PublicCoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const course = await loadCourseDetail(courseId);
  const summary = publishedCourseSummaries.find((item) => item.slug === courseId);
  if (!course || !summary) notFound();
  const totalLessons = course.modules.reduce((total, module) => total + module.lessons.length, 0);
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.description,
    educationalLevel: course.level,
    url: new URL("/courses/" + course.id, siteOrigin).toString(),
    provider: { "@type": "EducationalOrganization", name: "KATALYST", url: siteOrigin },
    teaches: course.learningOutcomes,
    ...(course.prerequisites.length ? { coursePrerequisites: course.prerequisites.join(" ") } : {}),
  }).replace(/</g, "\\u003c");

  return (
    <main className="course-public-page">
      <div className="course-public-shell">
        <header className="course-public-header"><Link href="/" className="legal-brand"><BrandMark className="brand-mark" /><span>KATALYST</span></Link><Link href="/courses">All courses</Link></header>
        <article className="course-public-detail">
          <span className="eyebrow">{summary.subjectTitle} / {course.level.toUpperCase()} / {String(totalLessons).padStart(2, "0")} LESSONS</span>
          <h1>{course.title}</h1><p className="course-public-description">{course.description}</p>
          <div className="course-public-actions"><Link className="primary-button" href="/paths">Explore this course in KATALYST <span aria-hidden="true">→</span></Link><Link className="secondary-button" href="/login">Create an account</Link></div>
          <section><h2>What you will learn</h2><ul>{course.learningOutcomes.map((outcome) => <li key={outcome}>{outcome}</li>)}</ul></section>
          {course.prerequisites.length > 0 && <section><h2>Before you begin</h2><ul>{course.prerequisites.map((item) => <li key={item}>{item}</li>)}</ul></section>}
          <section><h2>Course modules</h2><ol className="public-course-modules">{course.modules.map((module) => <li key={module.id}><div><strong>{String(module.order).padStart(2, "0")} · {module.title}</strong><p>{module.summary}</p></div><span>{module.lessons.length} lessons</span><ul>{module.lessons.map((lesson) => <li key={lesson.id}><Link href={`/courses/${course.id}/${lesson.id}`}>{lesson.title}</Link></li>)}</ul></li>)}</ol></section>
        </article>
        <footer className="public-course-footer"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/account/delete">Account deletion</Link></footer>
      </div>
      <script nonce={nonce} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
    </main>
  );
}
