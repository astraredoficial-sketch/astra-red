import type { Metadata } from "next";

export function publicPageMetadata({
  title,
  description,
  path,
  type = "website",
}: {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: path,
      siteName: "AstraRed",
      locale: "es_VE",
      type,
      images: ["/astrared-social.png"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/astrared-social.png"],
    },
  };
}
