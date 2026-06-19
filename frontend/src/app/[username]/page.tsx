"use client";

import { use, useEffect, useState } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import axios from "axios";

import { useAuth } from "@/context/AuthContext";
import { SearchUser } from "@/types/auth";
import "./style.css";

const UserPage = ({
  params,
}: {
  params: Promise<{ username: string }>
}) => {
  const { username } = use(params);
  const { user, loading } = useAuth();
  const [searchUser, setSearchUser] = useState<SearchUser | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const fetchSearchUser = async () => {
      try {
        const response = await axios.get<SearchUser>(`${process.env.NEXT_PUBLIC_API_URL}/users/${username}/`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        });

        setSearchUser(response.data);
        setIsFollowing(response.data.is_following);
      } catch {
        setNotFound(true);
      }
    }

    fetchSearchUser();
  }, [username]);

  const handleFollowToggle = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      if (isFollowing) {
        await axios.delete(
          `${process.env.NEXT_PUBLIC_API_URL}/users/follow/${username}/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setIsFollowing(false);
      } else {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/users/follow/${username}/`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setIsFollowing(true);
      }
    } catch (error) {
      console.error("Failed to toggle follow:", error);
    }
  };

  if (loading) {
    return <h1>Loading...</h1>
  }

  if (!user) {
    redirect("/");
  }

  if (notFound) {
    return <h1>Oops! User @{username} does not exist.</h1>
  }

  return (
    <div className="profile">
      <div className="profile-top">
        <img src={
          searchUser?.profile?.avatar
            ? `${searchUser?.profile.avatar}`
            : "/person.jpg"
        } />
        <div className="block">
          <h1 className="name">{searchUser?.first_name} {searchUser?.last_name}</h1>
          <p>@{searchUser?.username}</p>
          <p>{searchUser?.profile?.bio || ""}</p>
          <div className="flex">
            <h3>{searchUser?.followers_count} followers</h3>
            <h3>{searchUser?.following_count} following</h3>
          </div>
          {user.username === searchUser?.username
            ? <Link href="/profile"><input type="button" value="Edit Profile" className="btn btn-outlined-secondary" /></Link>
            : <input
                type="button"
                value={isFollowing ? "Unfollow" : "Follow"}
                className={isFollowing ? "btn btn-filled-secondary" : "btn btn-outlined-secondary"}
                onClick={handleFollowToggle}
              />}
        </div>
      </div>

    </div>
  )
}

export default UserPage;
