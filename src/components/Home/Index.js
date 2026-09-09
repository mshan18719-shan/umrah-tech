'use client';
import dynamic from 'next/dynamic';
// Search is the above-fold hero — import it statically so it is included in
// the initial JS bundle and paints immediately (critical for LCP).
import Search from '@/components/Home/Search/Search';
import BuildOwnPackage from "@/components/Home/OwnPakage/BuildOwnPackage";
import Destinations from './Destinations/Destinations';
import Chooseus from './Chooseus/Chooseus';
import Testimonials from './Testimonials/Testimonials';
import FaqSection from './HomeFaq/Faqsection';
// Everything below the fold is code-split and loaded only when needed.
const Package = dynamic(() => import('@/components/Home/Packages/Package'));
// const Services = dynamic(() => import('@/components/Home/Services/Services'));
const TopHotels = dynamic(() => import('@/components/Home/TopHotels/TopHotels'), { ssr: false });
// const TopTransfers = dynamic(() => import('@/components/Home/TopTransfers/TopTransfers'));
// const TopActivities = dynamic(() => import('@/components/Home/TopActivities/TopActivities'));
// const AboutUs = dynamic(() => import('@/components/Home/AboutUs/AboutUs'));
export default function Index() {
  return (
    <div>
      <Search />
      <Package />
      <BuildOwnPackage />
      {/* <Services /> */}
      <TopHotels />
      {/* <TopTransfers /> */}
      <Destinations/>
      <Chooseus/>
      <Testimonials/>
      <FaqSection/>
      {/* <TopActivities /> */}
      {/* <AboutUs /> */}
    </div>
  );
}
