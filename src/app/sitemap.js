function safeDate(value) {
  if (!value) return new Date();
  const d = new Date(value);
  return isNaN(d.getTime()) ? new Date() : d;
}

async function fetchAllBlogSlugs(apiUrl) {
  try {
    // Fetch first page to discover total page count
    const firstRes = await fetch(`${apiUrl}/api/blogs?page=1`, { next: { revalidate: 3600 } });
    if (!firstRes.ok) return [];
    const firstData = await firstRes.json();
    const posts = firstData?.Content?.posts ?? [];
    const lastPage = firstData?.Content?.pagination?.last_page ?? 1;

    // Fetch remaining pages in parallel
    if (lastPage > 1) {
      const pageNumbers = Array.from({ length: lastPage - 1 }, (_, i) => i + 2);
      const restResults = await Promise.all(
        pageNumbers.map((p) =>
          fetch(`${apiUrl}/api/blogs?page=${p}`, { next: { revalidate: 3600 } })
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null)
        )
      );
      for (const result of restResults) {
        if (result?.Content?.posts) posts.push(...result.Content.posts);
      }
    }

    return posts;
  } catch {
    return [];
  }
}


export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_WEBSITE_URL;

  // -----------------------------
  // 1️⃣ STATIC PAGES
  // -----------------------------
  const staticPages = [
    { url: "", priority: 1.0 },
    { url: "about-us", priority: 0.8 },
    { url: "contact-us", priority: 0.8 },
    { url: "faqs", priority: 0.8 },
    { url: "privacy-policy", priority: 0.8 },
    { url: "terms-and-conditions", priority: 0.8 },
    { url: "hajj-package", priority: 0.8 },
    { url: "umrah-packages", priority: 0.8 },
  ].map((page) => ({
    url: `${baseUrl}/${page.url}`,
    lastModified: new Date(),
    priority: page.priority,
  }));

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const allPosts = await fetchAllBlogSlugs(apiUrl);
  const blogPages = allPosts.map((post) => ({
    url: `${baseUrl}/blogs/${post.slug}`,
    lastModified: post.updated_at
      ? safeDate(post.updated_at)
      : post.created_at
        ? safeDate(post.created_at.replace(/(\d{2})-(\d{2})-(\d{4})/, "$3-$2-$1"))
        : new Date(),
    priority: 0.9,
  }));
  return [...staticPages, ...blogPages];
}
