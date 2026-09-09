import Image from 'next/image'
import React from 'react'

export default function loading() {
    return (
        <div className='main-loader'>
            <div className="loader-content">
                <Image
                    src="/images/navlogo.png" 
                    alt="Loading"
                    className="loader-logo w-auto"
                    height={200}
                    width={400}
                />
                <div className="loader-line"></div>
            </div>
        </div>
    )
}
