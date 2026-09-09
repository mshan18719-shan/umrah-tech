import Image from "next/image";
import React from "react";

export default function ServicesForYou() {
  return (
    <div className="container section-gap home1">
      <div className="row m-0 align-items-center justify-content-between">
        <div className="col-xl-5 col-lg-5 col-md-6">
          <Image
            height={400}
            width={400}
            src="/images/home/home1.png"
            alt="Image"
          />
        </div>
        <div className="col-xl-5 col-lg-5 col-md-6">
          <div className="bestExperience-block">
            <h2 className="fw-bold lh-base">
              Our Experience And Services For you!
            </h2>
            <p className="fw-light fs-6 text-justify mt-2" >
              Alhijaz Tours is well known within the Hajj and Umrah industry. We
              have a highly experienced team who know the ins and outs of Umrah
              and Hajj. We have immense experience on how traveling and
              accommodation work within Makkah and Medinah so we can make it
              easier for all pilgrims.{" "}
            </p>
            <p className="fw-light fs-6 text-justify ">
                 Additionally, we have an abundance of
              knowledge on how one needs to perform their Hajj or Umrah and what
              they will need to take with them on their journey. We provide all
              the necessary information and keep our pilgrims updated at all
              times to make your travels easier. Our highly experienced and well
              versatile team is ready to take your queries.
            </p>
            <div
              className="d-flex g-2 w-100 mt-4 "
            >
              <div className="d-inline-flex w-100 flex-column justify-content-center align-items-center py-3 px-3 rounded gray-simple ">
                <h6 className="fw-bold fs-3 m-0">25</h6>
                <p className="m-0 text-sm text-muted-2 mt-2">Years Experience</p>
              </div>
              <div className="d-inline-flex w-100 flex-column justify-content-center align-items-center py-3 px-3 rounded gray-simple ">
                <h6 className="fw-bold fs-3 m-0">500K+</h6>
                <p className="m-0 text-sm text-muted-2 mt-2">Umrah Customers</p>
              </div>
              <div className="d-inline-flex w-100 flex-column justify-content-center align-items-center py-4 px-4 rounded gray-simple ">
                <h6 className="fw-bold fs-3 m-0">12K+</h6>
                <p className="m-0 text-sm text-muted-2 mt-2">Hajj Customers</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
