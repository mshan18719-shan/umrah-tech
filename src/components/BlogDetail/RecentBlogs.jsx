import Image from "next/image";
import Link from "next/link";
import styles from "./RecentBlogs.module.css";

export default async function RecentBlogs() {
  let posts = [];
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/blogs`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data = await res.json();
      posts = data?.Content?.posts?.slice(0, 3) ?? [];
    }
  } catch {}

  if (posts.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.header}>
          <h2 className={styles.heading}>Related Articles</h2>
          <Link href="/blogs" className={styles.browseBtn}>Browse All Articles</Link>
        </div>
        <div className={styles.grid}>
          {posts.map((item, i) => (
            <div key={i} className={styles.card}>
              <div className={styles.imgWrap}>
                <Image
                  src={item.thumbnail?.url || "/assets/images/blog1.webp"}
                  alt={item.title || "Blog"}
                  fill
                  className={styles.img}
                  sizes="(max-width: 576px) 100vw, (max-width: 900px) 50vw, 33vw"
                />
              </div>
              <div className={styles.body}>
                <span className={styles.category}>{item.category?.name || "Company News"}</span>
                <h3 className={styles.title}>
                  <Link href={`/blogs/${item.slug}`}>{item.title}</Link>
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
