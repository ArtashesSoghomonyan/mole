"use client";

import { useAuth } from "@/context/AuthContext";
import { redirect } from "next/navigation";

import "./style.css";

const ProfilePage = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <h1>Loading...</h1>
  }

  if (!user) {
    redirect("/");
  }

  return <>
    <h1>Profile page</h1>
    <img src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/${user.profile.avatar}` || "/person.jpg"} />
    <p>{user.profile.bio || ""}</p>
  </>;
};

export default ProfilePage;
