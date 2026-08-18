"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CircleNotchIcon, ImageIcon, NotePencilIcon, PawPrintIcon, SparkleIcon } from "@phosphor-icons/react";

import { useAuth } from "@/context/AuthContext";
import { Post } from "@/types/posts";
import { mediaUrl } from "@/utils";
import Spinner from "@/components/Spinner";
import ImagePost from "@/components/ImagePost";
import TextPost from "@/components/TextPost";


export default function Home() {
  const { user, loading, login } = useAuth();

  const [loginEmail, setLoginEmail] = useState<string>("");
  const [loginPassword, setLoginPassword] = useState<string>("");
  const [loginFail, setLoginFail] = useState<boolean>(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginFail(false);

    try {
      await login({ email: loginEmail, password: loginPassword });
    } catch {
      setLoginFail(true);
    }
  };

  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState<number>(1);
  const [postsLoading, setPostsLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMorePosts = async () => {
    if (postsLoading || !hasMore) return;

    setPostsLoading(true);

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/feed/?page=${page}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      const results = data?.results;
      if (!Array.isArray(results)) {
        setHasMore(false);
        return;
      }

      setPosts(prev => [...prev, ...results]);
      setPage(page => page + 1);
      if (results.length === 0) setHasMore(false);
    } catch (error) {
      console.error("Failed to load posts:", error);
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    loadMorePosts();
  }, []);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMorePosts();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, page]);

  const avatarSource = mediaUrl(user?.profile.avatar);

  if (loading) {
    return <Spinner />;
  }

  if (!user) {
    return (
      <main className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden bg-muted/20 px-4 py-10">
        <div aria-hidden className="pointer-events-none absolute -top-32 -left-32 size-96 rounded-full bg-primary/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-32 -bottom-32 size-96 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative mx-auto w-full max-w-md">
          <form onSubmit={handleLogin} className="flex w-full flex-col gap-4 rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm sm:p-8">
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Enter your details to continue.</p>
            {loginFail && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">Wrong credentials!</p>}
            <input
              type="email"
              name="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="Email"
              aria-label="Email"
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
            />
            <input
              type="password"
              name="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="Password"
              aria-label="Password"
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
            />
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
              disabled={!loginEmail || !loginPassword}
            >
              Log in
            </button>
            <p className="text-center text-sm text-muted-foreground">Need an account? <Link href="/register" className="font-medium text-primary hover:underline">Sign up now!</Link></p>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-muted/20">
      <div className="mx-auto flex w-full max-w-2xl flex-col">
        <header className="sticky top-16 z-30 border-b border-border/80 bg-background/90 px-4 py-3 backdrop-blur-xl sm:px-6">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold tracking-tight text-foreground">Home</h1>
            <span className="text-xs text-muted-foreground">{posts.length} post{posts.length === 1 ? "" : "s"}</span>
          </div>
        </header>

        <div className="flex items-center gap-3 border-b border-border/80 bg-card px-4 py-3 sm:px-6">
          <img src={avatarSource} alt="Your avatar" className="size-10 shrink-0 rounded-full border border-border object-cover" />
          <Link
            href="/new/say"
            className="flex-1 rounded-full border border-input bg-background px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-ring hover:text-foreground"
          >
            What&apos;s on your mind, {user.username}?
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/new/image"
              title="Create image post"
              className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <ImageIcon className="size-5" />
            </Link>
            <Link
              href="/new/say"
              title="Create text post"
              className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <NotePencilIcon className="size-5" />
            </Link>
          </div>
        </div>

        <div className="flex flex-col">
          {posts.map(post => (
            <div key={post.id}>
              {post.post_type === "image" ? (
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
                />
              ) : (
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
                />
              )}
            </div>
          ))}
        </div>

        {hasMore && <div ref={sentinelRef} />}

        {postsLoading && (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <CircleNotchIcon className="size-4 animate-spin" weight="bold" />
            Loading more posts...
          </div>
        )}

        {!postsLoading && posts.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-4 py-20 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <SparkleIcon className="size-7" />
            </span>
            <div className="space-y-1">
              <p className="font-medium text-foreground">No posts to show yet</p>
              <p className="text-sm text-muted-foreground">Be the first to share something with the community.</p>
            </div>
            <Link
              href="/new/say"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Create your first post
            </Link>
          </div>
        )}

        {!postsLoading && posts.length > 0 && !hasMore && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <PawPrintIcon className="size-4" />
            You&apos;re all caught up
          </div>
        )}
      </div>
    </main>
  );
}
