"use client";

import { use, useEffect, useState } from "react";
import { redirect } from "next/navigation";
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

  useEffect(() => {
    const fetchSearchUser = async () => {
      try {
        const response = await axios.get<SearchUser>(`${process.env.NEXT_PUBLIC_API_URL}/users/${username}/`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        });

        setSearchUser(response.data);
      } catch {
        setNotFound(true);
      }
    }

    fetchSearchUser();
  }, [username]);

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
            ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/${searchUser?.profile.avatar}`
            : "/person.jpg"
        } />
        <div className="block">
          <h1 className="name">{searchUser?.first_name} {searchUser?.last_name}</h1>
          <p>@{searchUser?.username}</p>
          <p>{searchUser?.profile.bio || ""}</p>
          <div className="flex">
            <h3>78 followers</h3>
            <h3>17 following</h3>
          </div>
          {user.username === searchUser?.username
            ? <input type="button" value="Edit Profile" className="btn btn-outlined-secondary" />
            : <input type="button" value="Follow" className="btn btn-outlined-secondary" />}
        </div>
      </div>

    </div>
  )
}

export default UserPage;
