import React from 'react'
import styles from "./SectionOne.module.css";
import { FaHotel, FaKaaba, FaMosque } from 'react-icons/fa';
import { IoMdAirplane } from "react-icons/io";
import { TbBuildingAirport } from "react-icons/tb";
import { BsSuitcase } from "react-icons/bs";

export default function SectionOne() {
    const data = [
        {
            name: "Hajj ",
            name1: "Packages",
            icon: <FaKaaba size={40} />,
        },
        {
            name: "Umrah",
            name1: "Packages",
            icon: <FaMosque size={40} />
        },
        {
            name: "Flight",
            name1: "Booking",
            icon: <IoMdAirplane size={40} />,
        },
        {
            name: "Hotel",
            name1: "Reservations",
            icon: <FaHotel size={40} />
        },
        {
            name: "Airport",
            name1: "Transfers",
            icon: <TbBuildingAirport size={40} />
        },
        {
            name: "Customized",
            name1: "Tours",
            icon: <BsSuitcase size={40} />
        }
    ];
    return (
        <div className={styles.SectionOneMainContainer}>
            <div className="container pb-5">
                <div className="row g-3 justify-content-center">

                    {data.map((p, i) => (
                        <div key={i} className="col-6 col-sm-4 col-md-2">
                            <div className={styles.SectionOnecardContainer}>
                                <div className={`${styles.card}  text-center `}>

                                    {/* Icon */}
                                    <div className={`${styles.icon} ${p.isJummah ? styles.jummahIcon : ""}`}>
                                        {p.icon}
                                    </div>

                                    {/* Title */}
                                    <div className={`${styles.title} ${p.isJummah ? styles.jummahTitle : ""}`}>
                                        {p.name} <br /> {p.name1}
                                    </div>

                                    {/* Bottom Dot */}
                                    {/* <div className={styles.dot}></div> */}

                                </div>
                            </div>
                        </div>
                    ))}

                </div>
            </div>
        </div>
    )
}
