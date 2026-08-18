"use client";

import { useAuth } from "@/context/AuthContext";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { UserIcon } from "@phosphor-icons/react";

import AvatarCropper from "@/components/AvatarCropper";
import { mediaUrl } from "@/utils";
import Spinner from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const ProfilePage = () => {
  const { user, loading } = useAuth();
  const [bio, setBio] = useState(user?.profile.bio || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null);

  // Sync the bio field once the auth request resolves — the useState initializer
  // runs before `user` is loaded, so it would otherwise stay empty.
  useEffect(() => {
    if (user?.profile?.bio !== undefined) {
      setBio(user.profile.bio || "");
    }
  }, [user?.profile?.bio]);

  if (loading) {
    return <Spinner />;
  }

  if (!user) {
    redirect("/");
  }

  const handleAvatarCrop = (blob: Blob | null) => {
    setAvatarBlob(blob);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const formData = new FormData();
    formData.append("bio", bio);

    if (avatarBlob) {
      formData.append("avatar", avatarBlob, "avatar.jpg");
    }

    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/profile/`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setMessage({ type: "success", text: "Profile updated successfully!" });
      setAvatarBlob(null);
    } catch (error) {
      setMessage({ type: "error", text: "Failed to update profile. Please try again." });
      console.error("Profile update failed:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-muted/20 px-4 py-8">
      <div className="mx-auto w-full max-w-2xl">
        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm"
        >
          <header className="flex items-center gap-3 border-b border-border/80 px-5 py-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserIcon className="size-5" />
            </span>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Edit profile</h1>
              <p className="text-sm text-muted-foreground">Update your avatar and bio.</p>
            </div>
          </header>

          <div className="space-y-6 px-5 py-5">
            {message && (
              <p
                className={`rounded-md px-3 py-2 text-sm ${
                  message.type === "success"
                    ? "bg-primary/10 text-primary"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {message.text}
              </p>
            )}

            <div className="flex items-center gap-4">
              <img
                src={mediaUrl(user.profile?.avatar)}
                alt="Your avatar"
                className="size-20 shrink-0 rounded-full border-2 border-border object-cover"
              />
              <AvatarCropper onCropComplete={handleAvatarCrop} />
            </div>

            <div className="space-y-2">
              <label htmlFor="bio" className="text-sm font-medium text-foreground">
                Bio
              </label>
              <Textarea
                name="bio"
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell people a little about yourself..."
                rows={5}
                className="min-h-32 resize-y"
              />
            </div>
          </div>

          <footer className="flex items-center justify-end gap-3 border-t border-border/80 bg-muted/20 px-5 py-4">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </footer>
        </form>
      </div>
    </main>
  );
};

export default ProfilePage;
