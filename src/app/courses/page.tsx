import type { Metadata } from "next";
import Link from "next/link";
import { publishedLearningCourses, learningSubjects } from "@/data/curriculum/manifests";
import { BrandMark } from "@/components/brand-mark";

export const metadata: Metadata = {
  title: "Courses",
  description: "Explore KATALYST courses across software, embedded hardware, circuits, databases, AI, and visual media.",
  alternates: { canonical: "/courses" },
};

export default function CoursesIndexPage() {
  return (
    <main className="course-public-page">
      <div className="course-public-shell">
        <header className="course-public-header"><Link href="/" className="legal-brand"><BrandMark className="brand-mark" /><span>KATALYST</span></Link><Link href="/login">Sign in</Link></header>
        <div className="course-public-intro"><span className="eyebrow">LEARNING CATALOG / {String(publishedLearningCourses.length).padStart(2, "0")} PATHS</span><h1>Many disciplines.<br /><em>One place to explore.</em></h1><p>Build practical understanding across software, physical computing, data, AI, circuits, and digital media. Each path includes focused lessons and an interactive way to test what you learn.</p></div>
        <section className="public-course-grid" aria-label="Published learning courses">
          {publishedLearningCourses.map((course, index) => {
            const subject = learningSubjects.find((item) => item.id === course.subjectId);
            const lessonCount = course.modules.reduce((total, module) => total + module.lessons.length, 0);
            return <Link key={course.id} className="public-course-card" href={"/courses/" + course.id}>
              <span className="home-mono-label">{String(index + 1).padStart(3, "0")} / {subject?.title ?? "TECHNICAL STUDIES"}</span>
              <h2>{course.title}</h2><p>{course.description}</p><span className="public-course-meta">{course.level} · {lessonCount} lessons · {course.modules.length} modules</span><span className="public-course-open">View course <span aria-hidden="true">→</span></span>
            </Link>;
          })}
        </section>
        <footer className="public-course-footer"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/account/delete">Account deletion</Link></footer>
      </div>
    </main>
  );
}
