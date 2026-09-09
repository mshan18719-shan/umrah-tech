import React from 'react'
import styles from './about.module.css'
import Image from 'next/image'
export default function SectionOne() {
  return (
    <div className={styles.sectionOneWrapper}>
        <div className='container'>
            <div className={styles.sectionOneInner}>
                <h2 className={styles.sectionOneHeading}>Join Us on Your Journey</h2>
                <p className={styles.sectionOnePara}>At UmrahTech, we are dedicated to providing each pilgrim with compassionate care and comfort.<br/> Explore our Hajj or Umrah packages to book easily and have a memorable pilgrimage experience.</p>
                <div  className={styles.sectionOneImgWrapper}>
                    <Image src="/images/about/img1.png" alt="Mission Image" height={100} width={100} />
                    <Image src="/images/about/img2.png" alt="Mission Image" height={100} width={100} />
                    <Image src="/images/about/img3.png" alt="Mission Image" height={100} width={100} />
                    <Image src="/images/about/img4.png" alt="Mission Image" height={100} width={100} />
                </div>
            </div>
        </div>
    </div>
  )
}
