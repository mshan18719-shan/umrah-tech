'use client';

import { Pagination } from "@mantine/core";
import { useRouter, useSearchParams } from "next/navigation";

export default function BlogPagination({ totalPages, currentPage, total, from, to }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    router.push(`/blogs?${params.toString()}`);
  };

  if (totalPages <= 1) return null;

  return (
    <div className="col-12 mt-4">
      <div className="d-flex justify-content-center align-items-center flex-column gap-2">
        <Pagination 
          total={totalPages}
          value={currentPage}
          onChange={handlePageChange}
          size="md"
          radius="md"
          withEdges
        />
        {total > 0 && (
          <div className="text-muted small">
            Showing {from} to {to} of {total} blogs
          </div>
        )}
      </div>
    </div>
  );
}
