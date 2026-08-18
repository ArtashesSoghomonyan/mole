"use client";

import { use, useEffect, useState } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { ArrowLeftIcon, WarningCircleIcon } from "@phosphor-icons/react";

import { Post } from "@/types/posts";
import { useAuth } from "@/context/AuthContext";
import Spinner from "@/components/Spinner";
import TextPost from "@/components/TextPost";
import ImagePost from "@/components/ImagePost";


const PostDetailPage = ({
  params,
}: {
  params: Promise<{ postid: string }>
}) => {
  const { postid } = use(params);
  const [post, setPost] = useState<Post | null>(null);
  const [notFound, setNotFound] = useState<boolean>(false);
  const { user, loading } = useAuth();
  const [postLoading, setPostLoading] = useState<boolean>(true);

  const postIdNum = Number(postid);
  const invalidId = isNaN(postIdNum);

  useEffect(() => {
    if (invalidId) return;

    const fetchPost = async () => {
      try {
        const response = await axios.get<Post>(`${process.env.NEXT_PUBLIC_API_URL}/posts/${postIdNum}/`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        });
        setPost(response.data);
      } catch {
        setNotFound(true);
      } finally {
        setPostLoading(false);
      }
    }

    fetchPost();
  }, [postIdNum, invalidId]);

  if (invalidId) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted/20 px-4">
        <ErrorState title="Invalid post" message="The post ID should be a valid number." />
      </main>
    );
  }

  if (loading || postLoading) {
    return <Spinner />;
  }

  if (!user) {
    redirect("/");
  }

  if (notFound) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted/20 px-4">
        <ErrorState title="Post not found" message={`The post #${postid} does not exist.`} />
      </main>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-muted/20">
      <div className="mx-auto w-full max-w-2xl">
        <div className="px-4 pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeftIcon className="size-4" />
            Back to feed
          </Link>
        </div>

        {post.post_type === "text" ? (
          <TextPost
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
          />
        ) : (
          <ImagePost
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
          />
        )}
      </div>
    </main>
  );
}

function ErrorState({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <WarningCircleIcon className="size-8" />
      </span>
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      <Link
        href="/"
        className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Back to home
      </Link>
    </div>
  );
}

export default PostDetailPage;
