import Link from "next/link";
import RecentBlogs from "./RecentBlogs";
import moment from "moment";
import Image from "next/image";
import styles from "./BlogDetailHero.module.css";

const readTime = (text = "") => {
  const words = text?.trim().split(/\s+/).length || 0;
  return `${Math.max(1, Math.round(words / 200))} minute read`;
};

const BlogDetail = ({ selectedBlog }) => {
  return (
    <>
      {/* ── Hero header ── */}
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.inner}>
            {selectedBlog?.category?.name && (
              <span className={styles.badge}>{selectedBlog.category.name}</span>
            )}
            <h1 className={styles.title}>{selectedBlog?.title}</h1>
            {(selectedBlog?.excerpt || selectedBlog?.seo?.meta_description) && (
              <p className={styles.excerpt}>
                {( selectedBlog.seo?.meta_description || selectedBlog.excerpt )}
              </p>
            )}
            <div className={styles.author}>
              <div className={styles.authorIcon}>
                <Image
                  src="/images/logoblack.png"
                  alt="Synch"
                  fill
                  style={{ objectFit: "contain", padding: "8px" }}
                />
              </div>
              <div className={styles.authorInfo}>
                <span className={styles.authorName}>{selectedBlog?.author?.name}</span>
                <span className={styles.authorMeta}>
                  {moment(selectedBlog?.created_at, "DD-MM-YYYY HH:mm:ss").format("MMMM D, YYYY")}
                  {" • "}
                  {selectedBlog?.reading_time} minute read
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="blog-details-area">
        <div className="container">
          <div className={styles.blogContent}>
          <div className="row">
            <div className="col-lg-12">
              {/* <div className="blog-details-thumb">
                {selectedBlog?.thumbnail?.url && (
                  <Image
                    src={selectedBlog.thumbnail.url}
                    style={{ height: "auto", width: "100%" }}
                    loading="lazy"
                    alt="img"
                    width={856}
                    height={501}
                  />
                )}
              </div> */}
              <div className="blog-details-content text-justify">
                <div>
                  <div
                    className={`blog-details-desc ${styles.blogContentBody}`}
                    dangerouslySetInnerHTML={{
                      __html: selectedBlog?.content,
                    }}
                  ></div>
                </div>
              </div>
          
              {/* <div className="single-comment-area">
                <div className="row">
                  <div className="col-lg-12">
                    <div className="blog-details-comment">
                      <div className="blog-details-comment-content">
                        <h2>Zahid Aslam</h2>
                        <p>
                          I am working as a professional travel consultant
                          specializing in the UK travel market. With extensive
                          travel experience across the world, I provide expert
                          guidance on international destinations and help
                          clients plan smooth, enjoyable, and memorable trips.
                          I focus on offering personalized travel solutions,
                          including holiday packages, adventure tours, and
                          business travel arrangements.
                        </p>
                        <p>
                          I am passionate about sharing travel insights,
                          helping people explore new places with confidence,
                          and creating inspiring travel experiences tailored
                          to their needs.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div> */}
            </div>
          </div>
          </div>
        </div>
      </div>
      {/* ── CTA Banner ── */}
      <div className={styles.ctaWrap}>
        <div className="container">
          <div className={styles.ctaBox}>
            <div className={styles.ctaContent}>
              <h2 className={styles.ctaTitle}>Plan Your Umrah in Minutes</h2>
              <p className={styles.ctaSubtitle}>Talk to our travel specialists and get the best available options tailored for you.</p>
              <Link href="/contact-us" className={styles.ctaBtn}>Get Started</Link>
            </div>
          </div>
        </div>
      </div>
      <RecentBlogs />
    </>
  );
};

export default BlogDetail;
