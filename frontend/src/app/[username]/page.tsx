"use client";

import { use, useEffect, useState } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import axios from "axios";

import { useAuth } from "@/context/AuthContext";
import { SearchUser } from "@/types/auth";
import { Post } from "@/types/posts";
import TextPost from "@/components/TextPost";
import ImagePost from "@/components/ImagePost";
import "./style.css";

const UserPage = ({
  params,
}: {
  params: Promise<{ username: string }>
}) => {
  const { username } = use(params);
  const { user, loading } = useAuth();
  const [searchUser, setSearchUser] = useState<SearchUser | null>(null);
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const fetchSearchUser = async () => {
      try {
        const response = await axios.get<SearchUser>(`${process.env.NEXT_PUBLIC_API_URL}/users/${username}/`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        });

        setSearchUser(response.data.user);
        setPosts(response.data.posts);
        setIsFollowing(response.data.user.is_following);
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

      <div className="posts">{posts?.map((post) => {
          if (post.post_type === "text") {
            return <TextPost
              isMine={post.author.username === user.username}
              id={post.id}
              author={{
                username: post.author.username,
                first_name: post.author.first_name,
                last_name: post.author.last_name,
                profile_img: post.author.profile.avatar
              }}
              content={post.content.content}
              created_at={post.created_at}
              updated_at={post.updated_at}
              likes_count={post.likes_count}
              is_liked={post.is_liked}
              key={post.content.post}
            />;
          } else if (post.post_type === "image") {
            return <ImagePost
              isMine={post.author.username === user.username}
              id={post.id}
              author={{
                username: post.author.username,
                first_name: post.author.first_name,
                last_name: post.author.last_name,
                profile_img: post.author.profile.avatar
              }}
              image={post.content.image}
              description={post.content.description}
              created_at={post.created_at}
              updated_at={post.updated_at}
              likes_count={post.likes_count}
              is_liked={post.is_liked}
              key={post.content.post}
            />;
          }
        })}</div>
    </div>
  )
}

export default UserPage;
