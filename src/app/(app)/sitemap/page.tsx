import Link from "next/link";
import { publishedCourseSummaries } from "@/data/curriculum/course-summaries";
import { LegalPage } from "@/components/legal-page";
import { createPageMetadata } from "@/lib/page-metadata";

export const metadata = createPageMetadata({ title: "KATALYST Site Map", description: "Browse KATALYST learning areas, legal pages, and every published course.", pathname: "/sitemap" });

const publicRoutes = [
  { href: "/", label: "KATALYST app", description: "Open the learning studio." },
  { href: "/courses", label: "All courses", description: "Browse the public course catalog." },
  { href: "/login", label: "Sign in or create an account", description: "Manage learning progress across devices." },
  { href: "/privacy", label: "Privacy notice", description: "How account, learning, and AI request data is handled." },
  { href: "/terms", label: "Terms of use", description: "Terms for using the KATALYST learning studio." },
  { href: "/account/delete", label: "Account and data deletion", description: "Learn how to export or delete account data." },
];

export default function SitemapPage() {
  return (
    <LegalPage
      eyebrow="SITE INDEX"
      title="Find your way around KATALYST."
      intro="A readable index of the public pages and published learning paths in this app."
    >
      <section>
        <h2>Public pages</h2>
        <ul className="sitemap-route-grid">
          {publicRoutes.map((route) => (
            <li key={route.href}>
              <Link href={route.href}>{route.label}</Link>
              <p>{route.description}</p>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2>Published learning paths ({publishedCourseSummaries.length})</h2>
        <ol className="sitemap-course-index">
          {publishedCourseSummaries.map((course) => (
            <li key={course.id}><Link href={`/courses/${course.slug}`}>{course.title}</Link><span> · {course.lessonCount} lessons</span></li>
          ))}
        </ol>
      </section>
      <Link className="sitemap-xml-link" href="/sitemap.xml">View the XML sitemap for search engines <span aria-hidden="true">↗</span></Link>
    </LegalPage>
  );
}
