import BlogDetail from '@/components/BlogDetail/BlogDetail';
import React from 'react';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
  const { slug } = await params;

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/blogs/${slug}`, {
    method: 'GET',
    // headers: {
    //     'ngrok-skip-browser-warning': 'true',
    // },
  });

  if (!res.ok) {
    return {
      title: 'Blog Not Found',
    };
  }

  const blogDetail = await res.json();

  const SeoSetting = blogDetail?.Content?.post?.seo || {};
  return {
    title: SeoSetting?.title || "",
    description: SeoSetting?.meta_description || "",
    keywords: blogDetail?.meta_keywords || "",
    alternates: {
      canonical: `https://alhijaztours.net/blogs/${slug}`,
    },
    openGraph: {
      title: SeoSetting?.title || "",
      description: SeoSetting?.meta_description || "",
      images: [
        {
          url: blogDetail.thumbnail?.url, // must be absolute URL
          width: 1200,
          height: 630,
          alt: "Synch Travel",
        },
      ],
      type: 'website'
    }
  }

}

const page = async ({ params }) => {
  let blogDetail = {}
  const { slug } = await params;
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/blogs/${slug}`, {
    method: 'GET',
  });

  if (!res.ok) {
    notFound();
  }

  const response = await res.json();
  blogDetail = response?.Content?.post || {};

  if (!blogDetail || Object.keys(blogDetail).length === 0) {
    notFound();
  }

  return (
    <div className='blog-detail'>
      <BlogDetail selectedBlog={blogDetail}></BlogDetail>
    </div>
  );
};

export default page;