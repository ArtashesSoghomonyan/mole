"use client";

import { use, useEffect, useState } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { UsersIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

import { useAuth } from "@/context/AuthContext";
import { Post } from "@/types/posts";
import { SearchUserProfile } from "@/types/auth";
import { mediaUrl } from "@/utils";
import TextPost from "@/components/TextPost";
import ImagePost from "@/components/ImagePost";


const UserPage = ({
  params,
}: {
  params: Promise<{ username: string }>
}) => {
  const { username } = use(params);
  const { user, loading } = useAuth();
  const [searchUser, setSearchUser] = useState<SearchUserProfile | null>(null);
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const fetchSearchUser = async () => {
      try {
        const response = await axios.get<{ user: SearchUserProfile; posts: Post[] }>(`${process.env.NEXT_PUBLIC_API_URL}/users/${username}/`, {
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

  const handleMessages = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token  || !user || !searchUser) return;

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/conversations/`,
        {
          participant_ids: [searchUser?.id]
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log(response.data.id);
    } catch (error) {
      console.error("Failed to DM: ", error);
    }
  };

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-muted/20">
        <div className="mx-auto flex w-full max-w-2xl flex-col">
          {/* Profile skeleton */}
          <div className="border-b border-border/80 bg-card px-4 py-8 sm:px-6">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
              <div className="size-24 shrink-0 animate-pulse rounded-full bg-muted sm:size-28" />
              <div className="flex flex-1 flex-col items-center gap-3 sm:items-start">
                <div className="h-6 w-40 animate-pulse rounded bg-muted" />
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                <div className="h-4 w-64 animate-pulse rounded bg-muted" />
                <div className="flex gap-6">
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                </div>
                <div className="mt-2 h-9 w-28 animate-pulse rounded-lg bg-muted" />
              </div>
            </div>
          </div>

          {/* Post skeletons */}
          <div className="flex flex-col gap-4 px-4 py-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <div className="flex items-center gap-3 p-4">
                  <div className="size-10 shrink-0 animate-pulse rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                    <div className="h-2.5 w-24 animate-pulse rounded bg-muted" />
                  </div>
                </div>
                <div className="space-y-2.5 border-y border-border px-4 py-5">
                  <div className="h-3 w-full animate-pulse rounded bg-muted" />
                  <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
                </div>
                <div className="flex items-center gap-5 px-4 py-3">
                  <div className="size-5 animate-pulse rounded bg-muted" />
                  <div className="size-5 animate-pulse rounded bg-muted" />
                  <div className="size-5 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    redirect("/");
  }

  if (notFound) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted/20 px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <UsersIcon className="size-8" />
          </span>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold text-foreground">User not found</h1>
            <p className="text-sm text-muted-foreground">
              The user <span className="font-medium text-foreground">@{username}</span> does not exist.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Back to home
          </Link>
        </div>
      </main>
    );
  }

  const avatarSource = mediaUrl(searchUser?.profile?.avatar);

  const isOwnProfile = user.username === searchUser?.username;

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-muted/20">
      <div className="mx-auto flex w-full max-w-2xl flex-col">
        {/* Profile header */}
        <header className="border-b border-border/80 bg-card px-4 py-8 sm:px-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
            <img
              src={avatarSource}
              alt={`${searchUser?.first_name} ${searchUser?.last_name}`}
              className="size-24 shrink-0 rounded-full border-2 border-border object-cover sm:size-28"
            />

            <div className="flex flex-1 flex-col items-center gap-1.5 sm:items-start">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                {searchUser?.first_name} {searchUser?.last_name}
              </h1>
              <p className="text-sm text-muted-foreground">@{searchUser?.username}</p>

              {searchUser?.profile?.bio && (
                <p className="mt-1 max-w-md text-center text-sm leading-relaxed text-foreground/80 sm:text-start">
                  {searchUser.profile.bio}
                </p>
              )}

              <div className="mt-3 flex items-center gap-5">
                <span className="text-sm">
                  <span className="font-semibold text-foreground">{searchUser?.followers_count}</span>
                  <span className="ml-1 text-muted-foreground">followers</span>
                </span>
                <span className="text-sm">
                  <span className="font-semibold text-foreground">{searchUser?.following_count}</span>
                  <span className="ml-1 text-muted-foreground">following</span>
                </span>
              </div>

              <div className="mt-4">
                {isOwnProfile ? (
                  <Link
                    href="/profile"
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-input bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    Edit Profile
                  </Link>
                ) : (
                  <div className="flex gap-3">
                    <Button onClick={handleFollowToggle} variant={isFollowing ? "outline" : ""}>{isFollowing ? "Unfollow" : "Follow"}</Button>
                    {/* TODO: Disable the button if the user only wants to allow messages only from followers */}
                    <Button onClick={handleMessages} variant="outline">Message</Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Posts section */}
        <div className="flex flex-col">
          {posts && posts.length > 0 ? (
            posts.map((post) => {
              if (post.post_type === "text") {
                return (
                  <TextPost
                    isMine={post.author.username === user.username}
                    id={post.id}
                    author={{
                      username: post.author.username,
                      first_name: post.author.first_name,
                      last_name: post.author.last_name,
                      profile_img: post.author.profile.avatar,
                    }}
                    content={post.content.content}
                    created_at={post.created_at}
                    updated_at={post.updated_at}
                    likes_count={post.likes_count}
                    is_liked={post.is_liked}
                    key={post.content.post}
                  />
                );
              } else if (post.post_type === "image") {
                return (
                  <ImagePost
                    isMine={post.author.username === user.username}
                    id={post.id}
                    author={{
                      username: post.author.username,
                      first_name: post.author.first_name,
                      last_name: post.author.last_name,
                      profile_img: post.author.profile.avatar,
                    }}
                    image={post.content.image}
                    description={post.content.description}
                    created_at={post.created_at}
                    updated_at={post.updated_at}
                    likes_count={post.likes_count}
                    is_liked={post.is_liked}
                    key={post.content.post}
                  />
                );
              }
            })
          ) : (
            <div className="flex flex-col items-center gap-3 px-4 py-20 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <UsersIcon className="size-7" />
              </span>
              <div className="space-y-1">
                <p className="font-medium text-foreground">No posts yet</p>
                <p className="text-sm text-muted-foreground">
                  {isOwnProfile
                    ? "You haven't posted anything yet."
                    : `@${searchUser?.username} hasn't posted anything yet.`}
                </p>
              </div>
              {isOwnProfile && (
                <Link
                  href="/new/say"
                  className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Create your first post
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default UserPage;
