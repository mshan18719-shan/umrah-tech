'use client';
import React from 'react';
import { Pagination } from '@mantine/core';
import { useTransferList } from "./TransferListingContext";

export default function TransferPaginations() {
  const { currentPage, setCurrentPage, totalPages } = useTransferList();

  if (totalPages <= 1) return null; // ✅ hide if only one page

  return (
    <div className=" d-flex justify-content-center align-items-center w-100 mt-4">
      <Pagination
        total={totalPages}             
        value={currentPage}             
        onChange={setCurrentPage}       
        size="md"                       
        radius="md"                     
        withEdges                       
      />
    </div>
  );
}
