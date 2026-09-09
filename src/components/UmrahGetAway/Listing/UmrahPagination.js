'use client';
import React, { useEffect, useRef } from 'react';

export default function UmrahPagination({ hasMore, onLoadMore }) {
  const sentinelRef = useRef(null);
  const onLoadMoreRef = useRef(onLoadMore);

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    if (!hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMoreRef.current();
        }
      },
      { rootMargin: '200px' }
    );

    const el = sentinelRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [hasMore]);

  if (!hasMore) return null;

  return (
    <div
      ref={sentinelRef}
      className="d-flex justify-content-center align-items-center w-100 mt-4 py-3"
    >
      <div className="spinner-border spinner-border-sm text-secondary" role="status">
        <span className="visually-hidden">Loading more...</span>
      </div>
    </div>
  );
}
