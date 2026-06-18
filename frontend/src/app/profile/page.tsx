"use client";

import { useAuth } from "@/context/AuthContext";
import { redirect } from "next/navigation";
import { FormEvent, useState } from "react";
import axios from "axios";

import "./style.css";

const ProfilePage = () => {
  const { user, loading } = useAuth();
  const [bio, setBio] = useState(user?.profile.bio || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (loading) {
    return <h1>Loading...</h1>;
  }

  if (!user) {
    redirect("/");
  }

  const currentAvatar = avatarPreview
    || (user.profile.avatar
      ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/${user.profile.avatar}`
      : "/person.jpg");

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const formData = new FormData();
    formData.append("bio", bio);
    if (avatarFile) {
      formData.append("avatar", avatarFile);
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
        <img className="avatar" src={currentAvatar} alt="Avatar" />
        <label htmlFor="avatar-upload" className="btn btn-outlined-secondary">
          Change photo
        </label>
        <input
          type="file"
          id="avatar-upload"
          className="hidden"
          accept="image/*"
          onChange={handleAvatarChange}
        />
      </div>

      <label htmlFor="bio">Bio:</label>
      <textarea
        name="bio"
        id="bio"
        value={bio}
        onChange={(e) => setBio(e.target.value)}
      />

      <button type="submit" className="btn btn-filled" disabled={saving}>
        {saving ? "Saving..." : "Save"}
      </button>
    </form>
  );
};

export default ProfilePage;
