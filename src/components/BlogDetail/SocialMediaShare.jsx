'use client'
import React from 'react'

export default function SocialMediaShare() {
    const currentURL = typeof window !== "undefined" ? window.location.href : "";

    const shareLinks = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${currentURL}`,
        twitter: `https://twitter.com/intent/tweet?url=${currentURL}`,
        linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${currentURL}`,
    };
    return (
        <div>
            <div className="blog-details-social-icon">
                <ul>
                    <li><a href={shareLinks.facebook} target="_blank"><i className="bi bi-facebook"></i></a></li>
                    <li><a href={shareLinks.twitter} target="_blank"><i className="bi bi-twitter"></i></a></li>
                    <li><a href={shareLinks.linkedin} target="_blank"><i className="bi bi-linkedin"></i></a></li>
                    {/* <li><a href={shareLinks.instagram} target="_blank"><i className="bi bi-instagram"></i></a></li> */}
                </ul>
            </div>
        </div>
    )
}
