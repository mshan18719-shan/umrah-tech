import React from 'react'
import styles from './about.module.css';
import Image from 'next/image';
export default function SectionThree() {
    return (
        <div className={styles.sectionOneWrapper}>
            <div className='container'>
                <div>
                    <p className='text-muted h5'>Committed to Supporting Pilgrims Every Step</p>
                    <h1>The Journey of UmrahTech</h1>
                </div>
                <div className='row mt-5'>
                    <div className='col-lg-7'>
                        <div className={`position-relative ${styles.sectionThreeImgHeading}`}>
                            <h4><span>Established in</span> 2005</h4>
                            <Image src="/images/about/about2.png" alt="Image" height={450} width={600} quality={100} className="object-fit-cover w-100 rounded" />
                            <Image src="/images/about/about1.png" alt="Image" height={300} width={300} quality={100} className={`${styles.sectionThreeImg}`} />
                        </div>
                    </div>
                    <div className='col-lg-5'>
                        <div className={styles.sectionThreeContent}>
                            <h4>About Us</h4>
                            <p className='text-justify'>
                            UmrahTech is one of the most trusted travel agencies that offers affordable Umrah package options from the UK. Our carefully designed umrah tours from the UK guarantee a convenient and spiritually fulfilling journey. With experienced umrah guides and easy-to-book websites through which you can explore packages without compromising quality and service.
                            </p>
                            <h4>Our Mission</h4>
                            <ul className="ps-0 ms-0">
                                <li>Make journeys that are memorable and lasting</li>
                                <li>Offer guidance at every stage of the journey</li>
                                <li>Make the reservation process easy and simple</li>
                                <li>Ensure comfort and safety throughout the journey</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}