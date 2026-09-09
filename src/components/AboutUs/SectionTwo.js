import React from 'react'
import styles from './about.module.css'
import Image from 'next/image'
export default function SectionTwo() {
    return (
        <div className={`${styles.sectionOneWrapper} ${styles.sectionTwoWrapper}`}>
            <div className='container'>
                <div className={styles.sectionTwoHeading}>
                    <p className='text-muted'> Making every Hajj and Umrah journey meaningful and memorable</p>
                    <h1 className='fw-bold'>Why Pilgrims Choose<br/> UmrahTech</h1>
                </div>
                <div className='row align-items-center mt-5'>
                    <div className='col-lg-3 mb-3'>
                        <div className={styles.sectionTwoServices}>
                            <Image src="/images/about/PilgrimagePlans.png" alt="Pilgrimage Plans" height={90} width={90} />
                            <h5 className='mt-3'>Pilgrimage Plans</h5>
                            <p className='text-muted'>Designed Umrah and Hajj trips for your comfort and needs.</p>
                        </div>
                        <div className={styles.sectionTwoServices}>
                            <Image src="/images/about/ExpertGuidance.png" alt="Expert Guidance" height={90} width={90} />
                            <h5 className='mt-3'>Expert Guidance</h5>
                            <p className='text-muted'>Experienced guides for support and advice.</p>
                        </div>
                    </div>
                    <div className='col-lg-6 mb-3'>
                        <div className={styles.sectionTwoServicesImg}>
                            <Image src="/images/about/image (6).png" alt="Why Choose Us" height={700} width={600} quality={100} className='img-fluid rounded' />
                        </div>
                    </div>
                    <div className='col-lg-3 mb-3'>
                        <div className={styles.sectionTwoServices}>
                           <Image src="/images/about/TravelArrangements.png" alt="Travel Arrangements" height={90} width={90} />
                            <h5 className='mt-3'>Travel Arrangements</h5>
                            <p className='text-muted'>Flights, hotels and transfers handled carefully.</p>
                        </div>
                        <div className={styles.sectionTwoServices}>
                            <Image src="/images/about/SpiritualExperiences.png" alt="Spiritual Experiences" height={90} width={90} />
                            <h5 className='mt-3'>Spiritual Experiences</h5>
                            <p className='text-muted'>Meaningful experiences that enrich your pilgrimage journey.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
