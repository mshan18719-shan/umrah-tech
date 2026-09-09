'use client'
import React from 'react'
import { usePackageStore } from "@/components/Store/PackageStore";
import Link from 'next/link';

export default function BookNowButton({ PackageDetail }) {
    const {setSelectedPackage} = usePackageStore();
    const BookNow =() =>{
        setSelectedPackage(PackageDetail);
    }
    return (
        <div className="sticky-button-container">
            <Link onClick={BookNow}  href={`/${PackageDetail?.category.slug}/${PackageDetail?.slug}/selection`}>
                <button className="btn btn-success sticky-button">Book Now</button>
            </Link>
        </div>
    )
}
