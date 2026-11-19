import type { Metadata } from "next";
import Link from "next/link";
import { publishedLearningCourses, learningSubjects } from "@/data/curriculum/manifests";
import { BrandMark } from "@/components/brand-mark";

export const metadata: Metadata = {
  title: "Courses",
  description: "Explore KATALYST courses across software, embedded hardware, circuits, databases, AI, and visual media.",
  alternates: { canonical: "/courses" },
  openGraph: {
    type: "website",
    title: "Technical Courses — KATALYST",
    description: "Explore structured, interactive learning paths in programming, hardware, circuits, databases, AI, and digital media.",
    url: "/courses",
    siteName: "KATALYST",
    images: [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: "KATALYST technical course catalog" }],
  },
  twitter: { card: "summary_large_image", title: "Technical Courses — KATALYST", description: "Structured, interactive learning paths across technical subjects.", images: ["/opengraph-image.png"] },
};

const courseFaqs = [
  { question: "What is KATALYST?", answer: "KATALYST is an interactive technical learning studio with structured lessons and browser-based tools for programming, hardware, circuits, databases, AI, and digital media." },
  { question: "Can I start learning without an account?", answer: "You can explore the learning studio as a guest. Guest learning progress is kept in the browser; account features are available for learners who choose to sign in." },
  { question: "Does KATALYST compile C and C++ in the browser?", answer: "Yes. C11 and C++17 compile and run in a browser sandbox. First use downloads a pinned compiler package from Wasmer and caches it in the browser, so the first setup needs access to the Wasmer registry." },
  { question: "Does a circuit simulator replace physical hardware?", answer: "No. The circuit and board tools are educational simulations. They do not connect to or control physical hardware." },
  { question: "Is Kat AI always available?", answer: "Kat AI is available when the KATALYST deployment owner configures a server-side provider and enables shared access. Provider account limits, app credit limits, and maintenance settings can affect availability." },
];

export default function CoursesIndexPage() {
  const faqJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: courseFaqs.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  }).replace(/</g, "\\u003c");
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
        <section className="course-faq" aria-labelledby="course-faq-heading">
          <h2 id="course-faq-heading">Questions about KATALYST</h2>
          {courseFaqs.map(({ question, answer }) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}
        </section>
        <footer className="public-course-footer"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/account/delete">Account deletion</Link></footer>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqJsonLd }} />
    </main>
  );
}
