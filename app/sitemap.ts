import { MetadataRoute } from "next";
import { db } from "@/lib/db";

const siteUrl = process.env.APP_URL || "https://eventlite.context-collective.org";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/register`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/create-with-ai`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  // Dynamic event pages
  const events = await db.event.findMany({
    where: {
      status: "PUBLISHED",
    },
    select: {
      slug: true,
      updatedAt: true,
      startAt: true,
    },
    orderBy: {
      startAt: "desc",
    },
  });

  const eventPages: MetadataRoute.Sitemap = events.map((event) => {
    const isPast = new Date(event.startAt) < new Date();
    return {
      url: `${siteUrl}/e/${event.slug}`,
      lastModified: event.updatedAt,
      changeFrequency: isPast ? "yearly" : "weekly",
      priority: isPast ? 0.4 : 0.9,
    };
  });

  return [...staticPages, ...eventPages];
}
