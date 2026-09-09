import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
export default function NotFound() {
  return (
    <div className='px-3 '>
      <div style={{minHeight:'75vh'}} className='row align-items-center justify-content-center p-5'>
        <div className='col-12 col-xl-10 col-xxl-8'>
          <div className='text-center '>
            <Image src="https://prium.github.io/phoenix/v1.24.0/assets/img/spot-illustrations/404.png" width={300} height={350} alt='logo' className='mb-4 h-auto' quality={100} />
            <h2 className='text-body-secondary fw-bolder mb-3'>Page Missing!</h2>
            <p className='text-body mb-5'>But no worries! Our ostrich is looking everywhere <br /> while you wait safely. </p>
            <Link href="/" className='btn btn-lg btn-success' >Go Home</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export const metadata = {
  title: '404 Not Found'
}