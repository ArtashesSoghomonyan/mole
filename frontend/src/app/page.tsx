"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link"

import { useAuth } from "@/context/AuthContext";
import { Post } from "@/types/posts";
import ImagePost from "@/components/ImagePost";
import TextPost from "@/components/TextPost";
import "./style.css";


export default function Home() {
  const { user, loading, login, logout } = useAuth();

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

  if (loading) {
    return <h1>Loading...</h1>;
  }

  if (!user) {
    return (
      <>
        <form onSubmit={handleLogin} className="login-form">
          <h1>Log into mole </h1>
          {loginFail && <p className="error">Wrong credentials!</p>}
          <input
            type="email"
            name="email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
          />
          <input
            type="password"
            name="password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
          />
          <input
            type="submit"
            value="Login"
            className="btn btn-outlined-secondary"
            disabled={!loginEmail || !loginPassword}
          />
          <p>Need an account? <Link href="/register">Sign up now!</Link></p>
        </form>
      </>
    );
  }

  return (
    <div className="container">
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
      {hasMore && <div ref={sentinelRef} />}
      {postsLoading && <p>Loading more posts...</p>}
    </div>
  );
}
