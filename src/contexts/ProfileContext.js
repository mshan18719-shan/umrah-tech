"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";

const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
  const { data: session, status } = useSession();
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      fetchProfileData();
    }
  }, [status]);
  
  const fetchProfileData = async () => {
    if (!session?.user?.apiToken) return;

    try {
      setLoadingProfile(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/b2b/auth/me`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.user?.apiToken}`,
          },
        },
      );

      const data = await response.json();
      setProfileData(data?.data);
    } catch (error) {
      console.log("Profile error:", error);
    } finally {
      setLoadingProfile(false);
    }
  };

  return (
    <ProfileContext.Provider
      value={{ profileData, setProfileData, loadingProfile, fetchProfileData }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext);
