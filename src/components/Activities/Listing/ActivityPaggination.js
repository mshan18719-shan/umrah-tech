
'use client'
import React from 'react'
import { Pagination } from '@mantine/core'
import { useRouter, useSearchParams } from 'next/navigation'

export default function ActivityPaggination({ pdata }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentPage = Number(searchParams.get('page')) || pdata?.current_page 
  const perPage = Number(searchParams.get('per_page')) || pdata?.per_page 

  const handlePageChange = (page) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', page)
    params.set('per_page', perPage)

    router.push(`?${params.toString()}`)
  }

  return (
    <div className="mt-4 d-flex justify-content-center">
      <Pagination
        total={pdata?.last_page}      // total pages from API
        value={currentPage}          // current active page
        onChange={handlePageChange}  // update on page change
      />
    </div>
  )
}
