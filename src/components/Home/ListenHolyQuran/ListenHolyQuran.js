import React from 'react'
import styles from './ListenHolyQuran.module.css';
export default function ListenHolyQuran() {
    return (
        <section className={styles.listenHolyQuranSection}>
            <div className='container'>
                <div className='row text-white'>
                    <div className='col-lg-6'>
                        <div className={styles.listenHolyQuranHeading}>
                            <p className='mb-1'>Listen Holy Quran</p>
                            <h2 className='fw-bold mb-3'>Listen to the Holy Quran</h2>
                            <h6>Duis aute irure dolor in reprehenit in voluptate velit esse cillum dolo re eu fugiat nulla pariatur.</h6>                    
                        </div>
                    </div>
                    <div className='offset-lg-1 col-lg-5 '>
                        <div className={styles.DonateContainer}>
                            <h3>Support us, we need your help.</h3>
                            <h6>Al-Hijaz is the pioneer tour operation in United Kingdom to offer Hajj and Umrah services from United Kingdom.</h6>
                            <h2 className='mt-3'>50+</h2>
                            <button className='mt-4 btn btn-warning'>Contact Now</button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
