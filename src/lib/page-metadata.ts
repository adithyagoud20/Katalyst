import type { Metadata } from "next";

const socialImage = "/opengraph-image.png";

export function createPageMetadata({
  title,
  description,
  pathname,
  index = true,
}: {
  title: string;
  description: string;
  pathname: string;
  index?: boolean;
}): Metadata {
  const socialTitle = title.includes("KATALYST") ? title : `${title} | KATALYST`;
  return {
    title,
    description,
    alternates: { canonical: pathname },
    robots: index ? { index: true, follow: true } : { index: false, follow: false, noarchive: true },
    openGraph: {
      type: "website",
      url: pathname,
      siteName: "KATALYST",
      title: socialTitle,
      description,
      images: [{ url: socialImage, width: 1200, height: 630, alt: "KATALYST technical learning" }],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [socialImage],
    },
  };
}
