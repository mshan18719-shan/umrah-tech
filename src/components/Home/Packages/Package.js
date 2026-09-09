'use client'
import React, { useEffect, useState } from "react";
import PackageCategories from "./PackageCategories";
import { usePackageCategories } from "@/contexts/PackageCategoriesContext";


export default function Package() {
  const { categories } = usePackageCategories();
  const [initialPackages, setInitialPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch packages for the first category
        if (categories.length > 0) {
          const packagesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/packages/search?`, {
            cache: 'no-store',
            headers: { 'Content-Type': 'application/json' }
          });
          const packagesData = await packagesRes.json();
          setInitialPackages(packagesData?.Content?.packages || []);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [categories]);

  return (
    <PackageCategories
      categories={categories}
      initialSlug={'all'}
      initialPackages={initialPackages}
    />
  );
}
