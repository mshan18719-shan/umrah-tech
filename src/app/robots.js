export default function robots() {
    const baseUrl = process.env.NEXT_PUBLIC_WEBSITE_URL;
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/admin",
    },
   sitemap: `${baseUrl}/sitemap.xml`,
  };
}