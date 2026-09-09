import React from "react";
import moment from "moment";
import Image from "next/image";
import Link from "next/link";
import BlogPagination from "./BlogPagination";
import { FaAngleRight, FaPhone, FaThLarge } from "react-icons/fa";
import styles from "./Blogs.module.css";

export default async function page({ searchParams }) {
  const resolvedParams = await searchParams;
  const page = resolvedParams?.page || 1;

  let blogs = [];
  var paggination = {};
  try {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/blogs?page=${page}`;
    const res = await fetch(url, {
      // next: { revalidate: 60 },
      cache: "no-store",
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // 'ngrok-skip-browser-warning': 'true',
      },
    });
    // console.log("API Response:", await res.json());

    const response = await res.json();
    // console.log("API Response:", response);
    if (response?.Success) {
      blogs = response?.Content?.posts || [];
      paggination = response?.Content?.pagination || {};
      // console.log("Blogs Data:", response);
    }

  } catch (error) {
    console.error("Fetch Error:", error);
  }

  // If blogs comes null → convert to empty array
  if (!blogs || blogs === null) blogs = [];
  const featuredBlog = blogs[0] || null;
  const restBlogs = blogs.slice(1);
  const currentPage = paggination.current_page || 1;
  const totalPages = paggination.last_page || 1;
  const total = paggination.total || 0;
  const from = paggination.from || 0;
  const to = paggination.to || 0;
  return (
    <div>
      <section className={styles.heroSection}>
        <div className={styles.heroOverlay}></div>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Umrah Travel Guides, Tips & Spiritual Advice</h1>
          <p className={styles.heroSubtitle}>
           Stay informed with expert-written articles covering Umrah packages, visa guidance, travel planning, and step-by-step pilgrimage support for travellers.
          </p>
        </div>
      </section>

      {/* ── Featured Blog Card ── */}
      {featuredBlog && (
        <div className="container mt-4">
          <div className={styles.featuredCard}>
            <div className={styles.featuredImageWrap}>
              <Image
                src={featuredBlog?.thumbnail?.url}
                alt={featuredBlog?.title || featuredBlog?.slug}
                fill
                className={styles.featuredImage}
                sizes="(max-width: 768px) 100vw, 44vw"
              />
            </div>
            <div className={styles.featuredBody}>
              <p className={styles.featuredMeta}>
                {featuredBlog?.author?.name || "UmrahTech"}
                <span> &bull; {moment(featuredBlog.created_at, "DD-MM-YYYY HH:mm:ss").format("D MMM YYYY")}</span>
              </p>
              <h2 className={styles.featuredTitle}>{featuredBlog.title}</h2>
              {(featuredBlog?.excerpt || featuredBlog?.seo?.meta_description) && (
                <p className={styles.featuredExcerpt}>
                  {featuredBlog?.seo?.meta_description || featuredBlog?.excerpt}
                </p>
              )}
              <div className={styles.featuredActions}>
                <Link href={`/blogs/${featuredBlog.slug}`} className={styles.btnView}>
                  <FaThLarge size={13} /> Read More
                </Link>
                <Link href="/contact-us" className={styles.btnCall}>
                  <FaPhone size={13} /> Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}


      <div className={`container px-2 ${styles.allBlogsSection}`}>
        <h2 className={styles.allBlogsHeading}>Explore Sacred Travel Articles</h2>
        {restBlogs.length === 0 ? (
          <div className={styles.emptyState}>
            <h3 className="mb-3">No Blogs Found</h3>
            <p className="text-muted mb-4">
              We couldn&apos;t find any blog posts at the moment. Please check back later.
            </p>
            <Link href="/" className="btn btn-success">Back to Home</Link>
          </div>
        ) : (
          <>
            <div className={styles.blogGrid}>
              {restBlogs.map((item, index) => (
                <div key={index} className={styles.blogCard}>
                  <div className={styles.blogCardImageWrap}>
                    <Image
                      src={item?.thumbnail?.url}
                      alt={item?.title || item?.slug}
                      fill
                      className={styles.blogCardImage}
                      sizes="(max-width: 576px) 100vw, (max-width: 992px) 50vw, 33vw"
                    />
                  </div>
                  <div className={styles.blogCardBody}>
                    <p className={styles.blogCardMeta}>
                      {item?.author?.name || "UmrahTech"}
                      <span> &bull; {moment(item.created_at, "DD-MM-YYYY HH:mm:ss").format("D MMM YYYY")}</span>
                    </p>
                    <h3 className={styles.blogCardTitle}>{item.title}</h3>
                    {(item?.excerpt || item?.seo?.meta_description) && (
                      <p className={styles.blogCardExcerpt}>
                        {item?.seo?.meta_description || item?.excerpt}
                      </p>
                    )}
                    <div className={styles.blogCardActions}>
                      <Link href={`/blogs/${item.slug}`} className={styles.blogCardBtnView}>
                        <FaThLarge size={12} /> Read More
                      </Link>
                      <Link href="/contact-us" className={styles.blogCardBtnCall}>
                        <FaPhone size={12} /> Contact Us
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <BlogPagination
              totalPages={totalPages}
              currentPage={currentPage}
              total={total}
              from={from}
              to={to}
            />
          </>
        )}
      </div>
    </div>
  );
}

export const metadata = {
  title: "The Ultimate Guide for Hajj and Umrah: A Complete Picture Guide to Every Step",
  description: "Explore expert Umrah & Hajj guides, travel tips, and spiritual insights for pilgrims. Your trusted resource for Islamic journeys to Makkah & Madinah.",
  keywords: "Umrah Blogs, Islamic Blogs, Islamic travel blogs, Travel tips, Hajj and Umrah travel guide, Umrah travel guide, Umrah travel tips, Hajj travel tips, Umrah guide, Muslim travel guide, Spiritual journeys for Muslims, Guide for Hajj and Umrah",
  alternates: {
    canonical: "https://alhijaztours.net/blogs",
  },
};