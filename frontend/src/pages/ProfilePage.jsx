import React, { useEffect, useState } from "react";
import { profileAPI } from "../services/api";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [bio, setBio] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);

      const res = await profileAPI.getMe();

      setUser(res.data);
      setBio(res.data?.bio || "");
      setAvatarPreview(res.data?.avatar_url || "/default-avatar.png");
    } catch (err) {
      console.error("Failed to load profile", err);
      alert("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);

      const res = await profileAPI.uploadAvatar(formData);

      setUser(res.data);
      setAvatarPreview(res.data?.avatar_url || "/default-avatar.png");

      alert("Profile picture updated successfully.");
    } catch (err) {
      console.error("Avatar upload failed", err);

      alert(
        err?.response?.data?.detail ||
          "Failed to upload profile picture."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);

      const res = await profileAPI.updateMe({
        bio,
      });

      setUser(res.data);

      alert("Profile updated successfully.");
    } catch (err) {
      console.error("Profile update failed", err);

      alert(
        err?.response?.data?.detail ||
          "Failed to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>

      <div className="bg-white border rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex flex-col items-center">
            <img
              src={avatarPreview}
              alt={user?.name || "Student"}
              className="w-32 h-32 rounded-full object-cover border mb-4"
            />

            <label className="bg-black text-white px-5 py-2 rounded cursor-pointer hover:bg-gray-800">
              {uploading ? "Uploading..." : "Upload Picture"}

              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>

          <div className="flex-1">
            <div className="mb-4">
              <label className="block font-medium mb-1">
                Name
              </label>

              <input
                value={user?.name || ""}
                disabled
                className="w-full border rounded p-3 bg-gray-100"
              />
            </div>

            <div className="mb-4">
              <label className="block font-medium mb-1">
                Email
              </label>

              <input
                value={user?.email || ""}
                disabled
                className="w-full border rounded p-3 bg-gray-100"
              />
            </div>

            <div className="mb-4">
              <label className="block font-medium mb-1">
                Bio
              </label>

              <textarea
                rows="4"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us a little about yourself..."
                className="w-full border rounded p-3"
              />
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
