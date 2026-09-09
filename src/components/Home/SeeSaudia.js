import Image from 'next/image'
import React from 'react'

export default function SeeSaudia() {
  return (
    <div className='container-fluid p-3 section-gap see-saudia'>
      <div className="heading-color text-center fw-bold">
      <h2>See Saudi in a Variety of Ways</h2>
    </div>
    <div className="row m-0 g-4 mt-5 justify-content-center w-100">
      <div className="col-12 col-sm-4 col-md-4 col-lg-2">
        <div className="city-card">
          <Image width={500} height={1000} src="/images/home/makkah.jpg" alt="Makkah"/>
          <div className="city-name">Makkah</div>
        </div>
      </div>
      <div className="col-12 col-sm-4 col-md-4 col-lg-2">
        <div className="city-card top-margin">
          <img width={400} height={1000} src="/images/home/madinah.jpg" alt="Madinah"/>
          <div className="city-name">Madinah</div>
        </div>
      </div>
      <div className="col-12 col-sm-4 col-md-4 col-lg-2">
        <div className="city-card">
          <img width={400} height={1000} src="/images/home/jeddah.jpg" alt="Jeddah"/>
          <div className="city-name">Jeddah</div>
        </div>
      </div>
      <div className="col-12 col-sm-4 col-md-4 col-lg-2">
        <div className="city-card top-margin">
          <img width={400} height={1000} src="/images/home/taif.jpg" alt="Taif"/>
          <div className="city-name">Taif</div>
        </div>
      </div>
      <div className="col-12 col-sm-4 col-md-4 col-lg-2">
        <div className="city-card">
          <img width={400} height={1000} src="/images/home/riyadh.jpg" alt="Riyadh"/>
          <div className="city-name">Riyadh</div>
        </div>
      </div>
    </div>
    </div>
  )
}
