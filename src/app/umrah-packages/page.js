import React, { Suspense } from "react";
import PackageList from "@/components/Package/PackageList";
import UmrahPackagesHero from "./UmrahPackagesHero";

export const metadata = {
    title: "Hajj & Umrah Packages UK, Cheap & Affordable Deals | UmrahTech ",
    description:
        "Browse Hajj & Umrah packages UK with UmrahTech. We offer cheap and affordable pilgrimage packages including flights, visa, hotels in Makkah & Madinah, and full travel support.  ",
    keywords: [
        "Hajj & Umrah Packages UK",
        "Hajj packages UK",
        "Umrah packages UK ",
        "Cheap Umrah packages ",
        "Affordable Hajj packages ",
        "Islamic travel packages ",
        "Pilgrimage travel deals ",
        "Makkah Madinah packages ",
        "Best Hajj Umrah deals UK",
    ],
    alternates: {
        canonical: "https://alhijaztours.net/umrah-packages",
    },

};

async function page() {
    const category_slug = 'umrah-packages';
    const formattedCategory = 'Umrah Packages';


    return (
        <>
            {/* <script type="application/ld+json" id="organization-schema">
                {JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "TravelAgency",
                    name: "UmrahTech",
                    url: "https://alhijaztours.net",
                    keywords: [
                        "Hajj",
                        "Umrah",
                        "Makkah",
                        "Madinah",
                        "Masjid al-Haram",
                        "Masjid an-Nabawi",
                        "Saudi Arabia ",
                        "Flight & Visa Services",
                        "Hotel Accommodation",
                        "Islamic Travel Agency",
                        "UK Pilgrimage Services"
                    ],
                })}
            </script> */}
            <Suspense fallback={null}>
                <UmrahPackagesHero
                    title={formattedCategory}
                    defaultCategory={category_slug}
                />
            </Suspense>
            <PackageList category_slug={category_slug} />

            {/* Package Seo Content */}
            {/* <div className="container mt-4 mb-4">
                <h2 className="mb-5 text-center">Umrah Packages 2026 – Embark on Your Spiritual Journey<br /> with Al Hijaz Tours </h2>
                <div className="scrool-text">
                    <h3>Start Your Spiritual Journey with Confidence</h3>
                    <p>Umrah is an opportunity to reconnect with your faith and spiritual renewal. UmrahTech packages are guided tours designed to make your journey more special.
                        Whether you're travelling with your family or in a group, our UK Umrah Packages 2026  accommodate all pilgrims.
                    </p>
                    <p>
                        From hotels to visas, everything is taken care of so you can focus on your worship completely. Our cheap Umrah packages UK to luxury 5-star packages near the Haram offer a perfect balance of comfort, convenience, and spiritual focus for pilgrims.
                    </p>
                    <p><b>Primary CTA:</b> Explore Umrah Packages</p>
                    <p><b>Secondary CTA:</b> Speak to an Umrah Specialist</p>
                    <h3>Umrah Packages UK Designed for Every Pilgrim</h3>
                    <p>
                        We offer various Umrah packages from the UK to match your budget, comfort, and spiritual goals:

                    </p>
                    <ul>
                        <li>Budget-Friendly Umrah Packages UK</li>
                        <li>All-Inclusive Umrah Packages</li>
                        <li>Luxury & 5-Star Packages</li>
                        <li>Family & Group Packages</li>
                    </ul>
                    <p><b>CTA:</b> View Package Options</p>
                    <h3>What’s Included in Your Cheap Umrah Package</h3>
                    <p>Transparency is key. Our packages clearly include:</p>
                    <ul>
                        <li>Return flights from major UK airports</li>
                        <li>Comfortable hotels in Makkah and Madinah</li>
                        <li>Saudi Umrah visa processing and approval</li>
                        <li>Airport and city transfers</li>
                        <li>Guided Ziyarat tours</li>
                        <li>24/7 support for any question</li>
                    </ul>
                    <p>Every detail is explained upfront, no hidden surprises, no last-minute worries.</p>
                    <h3>Simple Booking Steps – Your Stress-Free Path to Umrah</h3>
                    <p>We make travel convenient for pilgrims across the UK: <br />
                        <b>London • Birmingham • Manchester • Bradford • Leicester • Glasgow</b>
                    </p>
                    <p>No matter your departure city, our service provides smooth, comfortable travel from start to finish.</p>
                    <h3>Bookings Steps Made Simple</h3>
                    <p>Our easy-to-follow process ensures a stress-free start to your Umrah journey:</p>
                    <ul>
                        <li>Speak with our Umrah specialists</li>
                        <li> Select your preferred package</li>
                        <li>Submit your documents</li>
                        <li>We handle flights, hotels, visas, and transfers</li>
                        <li>Travel with peace of mind and spiritual focus</li>
                    </ul>
                    <p>Clear steps and guidance set us apart from competitors, making your journey easier.</p>
                    <h3>Preparing for Your Next Umrah 2027 Journey</h3>
                    <p>We help you prepare both practically and spiritually:</p>
                    <p> Best months to perform Umrah, including Umrah in Ramadan, and off-peak months like January and December</p>
                    <ul>
                        <li>Packing tips for comfort and convenience</li>
                        <li>Ihram preparation and intention guidance</li>
                        <li>Health and travel advice for UK pilgrims</li>
                    </ul>
                    <p>Being prepared ensures your journey is safe, smooth, and spiritually rewarding.</p>
                    <h4>Choose UmrahTech for Your Next Umrah</h4>
                    <p>Making plans for Umrah can feel overwhelming, especially when choosing between multiple Umrah packages from the UK and online deals that sound almost the same. Pilgrims choose UmrahTech because we offer clarity, guidance, and reassurance at every stage of the journey. Whether you are exploring cheap Umrah packages UK for your family, considering all-inclusive Umrah packages, or preparing early for Umrah packages 2026, our approach remains personal and honest. We take the time to understand your needs, answer real concerns, and guide you towards the best Umrah packages for your situation, not just the most expensive option.</p>
                </div>
                <h2 className='mt-5'>Frequently Asked Questions</h2>
                <div className="accordion mt-4 umrah-package-accordian" id="accordionExample">
                    <div className="accordion-item">
                        <h2 className="accordion-header">
                            <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
                                What is included in your Umrah packages?
                            </button>
                        </h2>
                        <div id="collapseOne" className="accordion-collapse collapse show" data-bs-parent="#accordionExample">
                            <div className="accordion-body">
                                Our Umrah packages offer visas, accommodation, return flights, guided tours in Makkah and Madina, and on-ground support to make your pilgrimage smooth.
                            </div>
                        </div>
                    </div>
                    <div className="accordion-item">
                        <h2 className="accordion-header">
                            <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">
                                Are the Umrah packages ATOL-protected and fully licensed in the UK?
                            </button>
                        </h2>
                        <div id="collapseTwo" className="accordion-collapse collapse" data-bs-parent="#accordionExample">
                            <div className="accordion-body">
                                Yes, all our packages come under ATOL protection, which ensures safe payments and financial management through proper licensing travel arrangements in the UK
                            </div>
                        </div>
                    </div>
                    <div className="accordion-item">
                        <h2 className="accordion-header">
                            <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseThree" aria-expanded="false" aria-controls="collapseThree">
                                How much does an Umrah from the UK cost?
                            </button>
                        </h2>
                        <div id="collapseThree" className="accordion-collapse collapse" data-bs-parent="#accordionExample">
                            <div className="accordion-body">
                                The umrah cost usually depends on your travel dates, flights, room sharing, and the hotel's distance from the Holy places. We offer affordable packages, which include mid-range packages to luxury packages.
                            </div>
                        </div>
                    </div>
                    <div className="accordion-item">
                        <h2 className="accordion-header">
                            <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseFour" aria-expanded="false" aria-controls="collapseFour">
                                What documents and vaccinations are required for Umrah?
                            </button>
                        </h2>
                        <div id="collapseFour" className="accordion-collapse collapse" data-bs-parent="#accordionExample">
                            <div className="accordion-body">
                                A valid passport and proof of vaccinations, which include Meningococcal and COVID-19 vaccines. Our team will help you with the visa process documentation guidance.
                            </div>
                        </div>
                    </div>
                    <div className="accordion-item">
                        <h2 className="accordion-header">
                            <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseFive" aria-expanded="false" aria-controls="collapseFive">
                                Is a group guide or religious scholar included during Umrah?
                            </button>
                        </h2>
                        <div id="collapseFive" className="accordion-collapse collapse" data-bs-parent="#accordionExample">
                            <div className="accordion-body">
                                Yes, mostly packages include guided support or religious scholars to help pligrims to perform the umrah rituals correctly.
                            </div>
                        </div>
                    </div>
                </div>
                <h4 className="mt-4 mb-2">Begin Your Sacred Journey with Al Hijaz Tours</h4>
                <p className="mb-4">Your Umrah pilgrimage is a lifetime opportunity. With Al Hijaz Tours, every detail is handled professionally so you can focus on your devotion, reflection, and connection with Allah.</p>

            </div> */}
        </>
    );
}

export default page;
