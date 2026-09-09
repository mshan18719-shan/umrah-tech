import React, { Suspense } from "react";
import PackageList from "@/components/Package/PackageList";
import UmrahPackagesHero from "@/app/umrah-packages/UmrahPackagesHero";

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
};

function formatCategoryText(category) {
  if (!category) return "Packages";
  return category
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

async function PackageCategoryPage({ params }) {
  const resolvedParams = typeof params?.then === "function" ? await params : params;
  const category_slug = resolvedParams?.slug;
  const formattedCategory = formatCategoryText(category_slug);

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
            "UK Pilgrimage Services",
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
    </>
  );
}

export default PackageCategoryPage;
