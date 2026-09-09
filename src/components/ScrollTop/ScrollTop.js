'use client'
import React from 'react';
import AnchorLink from 'react-anchor-link-smooth-scroll'
import style from './style.module.css'
import { FaArrowUp } from "react-icons/fa";
import { usePathname } from 'next/navigation';


const ScrollTop = () => {
    const pathname = usePathname();
    const lastSegment = pathname?.split("/");
    const hideLayout = lastSegment && (lastSegment.includes("voucher") || lastSegment.includes("invoice"));
    return (
        <ul className={style.smothscroll} >
            {hideLayout ? null : (
                <li><AnchorLink href='#scrool'><i className="ti-arrow-up"><FaArrowUp /></i></AnchorLink></li>
            )}
        </ul>

    )
}

export default ScrollTop;
