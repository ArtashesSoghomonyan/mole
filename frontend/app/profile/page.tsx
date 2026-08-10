"use client";

import { useAuth } from "@/context/AuthContext";
import { redirect } from "next/navigation";
import { useState } from "react";
import axios from "axios";

import AvatarCropper from "@/components/AvatarCropper";
import "./style.css";

const ProfilePage = () => {
  const { user, loading } = useAuth();
  const [bio, setBio] = useState(user?.profile.bio || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null);

  if (loading) {
    return <h1>Loading...</h1>;
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
    <form className="profile" onSubmit={handleSubmit}>
      <h1 className="no-select">Edit your profile page</h1>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="avatar-bar">
        <img className="avatar" src={
          user.profile?.avatar
          ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/${user.profile?.avatar}/`
          : "/person.jpg"
        } alt="Avatar" />
        <AvatarCropper onCropComplete={handleAvatarCrop} />
      </div>

      <label htmlFor="bio">Bio:</label>
      <textarea
        name="bio"
        id="bio"
        value={bio}
        onChange={(e) => setBio(e.target.value)}
      >
        {user?.profile.bio}
      </textarea>

      <button type="submit" className="btn btn-filled" disabled={saving}>
        {saving ? "Saving..." : "Save"}
      </button>
    </form>
  );
};

export default ProfilePage;
