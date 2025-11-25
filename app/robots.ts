import { MetadataRoute } from "next";

const siteUrl = process.env.APP_URL || "https://eventlite.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/api/",
          "/cancel/",
          "/approve/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
