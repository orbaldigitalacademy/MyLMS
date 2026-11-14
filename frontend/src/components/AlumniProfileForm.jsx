
import React, { useEffect, useRef, useState } from "react";
import { Camera, Loader2, UserRound } from "lucide-react";
import api from "../services/api";

const fields = [
  ["professional_title", "Professional title"],
  ["bio", "About me"],
  ["linkedin_url", "LinkedIn URL"],
  ["github_url", "GitHub URL"],
  ["portfolio_url", "Portfolio URL"],
];

const initialData = (profile) => ({
  professional_title: profile?.professional_title || "",
  bio: profile?.bio || "",
  linkedin_url: profile?.linkedin_url || "",
  github_url: profile?.github_url || "",
  portfolio_url: profile?.portfolio_url || "",
  skills: (profile?.skills || []).join(", "),
  is_public: profile?.is_public ?? true,
});

export default function AlumniProfileForm({
  profile,
  onSave,
  saving,
}) {
  const [data, setData] = useState(() => initialData(profile));
  const [preview, setPreview] = useState(
    profile?.profile_image_url || ""
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

  const fileInputRef = useRef(null);

  useEffect(() => {
    setData(initialData(profile));
    setPreview(profile?.profile_image_url || "");
  }, [profile]);

  const updateField = (key, value) => {
    setData((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError("");
    setUploadSuccess("");

    if (
      !["image/jpeg", "image/png", "image/webp"].includes(
        file.type
      )
    ) {
      setUploadError("Only JPG, PNG and WebP images are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Profile picture must not exceed 5MB.");
      return;
    }

    const temporaryUrl = URL.createObjectURL(file);
    setPreview(temporaryUrl);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post(
        "/alumni/me/profile-picture",
        formData
      );

      const imageUrl = response.data?.profile_image_url;

      if (!imageUrl) {
        throw new Error("Image upload returned no URL.");
      }

      setPreview(imageUrl);
      setUploadSuccess("Profile picture uploaded successfully.");
    } catch (error) {
      setPreview(profile?.profile_image_url || "");
      setUploadError(
        typeof error.response?.data?.detail === "string"
          ? error.response.data.detail
          : error.message || "Unable to upload profile picture."
      );
    } finally {
      URL.revokeObjectURL(temporaryUrl);
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (uploading || saving) return;

    onSave({
      ...data,
      skills: data.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* PROFILE PICTURE */}
      <div className="rounded-xl border bg-slate-50 p-5">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">
          Profile Picture
        </h3>

        <div className="flex flex-wrap items-center gap-5">
          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-blue-100 bg-blue-50">
            {preview ? (
              <img
                src={preview}
                alt="Alumni profile"
                className="h-full w-full object-cover"
              />
            ) : (
              <UserRound className="h-14 w-14 text-blue-900" />
            )}
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || saving}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-5 py-3 font-medium text-white disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Camera className="h-5 w-5" />
              )}

              {uploading
                ? "Uploading..."
                : preview
                ? "Change Profile Picture"
                : "Upload Profile Picture"}
            </button>

            <p className="mt-2 text-xs text-slate-500">
              JPG, PNG or WebP. Maximum 5MB.
            </p>
          </div>
        </div>

        {uploadError && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {uploadError}
          </p>
        )}

        {uploadSuccess && (
          <p role="status" className="mt-3 text-sm text-green-700">
            {uploadSuccess}
          </p>
        )}
      </div>

      {/* PROFILE DETAILS */}
      {fields.map(([key, label]) => (
        <label key={key} className="block text-sm font-medium">
          {label}

          {key === "bio" ? (
            <textarea
              className="mt-1 w-full rounded-lg border p-3 text-slate-900"
              rows={4}
              maxLength={1200}
              value={data[key]}
              onChange={(e) =>
                updateField(key, e.target.value)
              }
            />
          ) : (
            <input
              className="mt-1 w-full rounded-lg border p-3 text-slate-900"
              value={data[key]}
              maxLength={
                key === "professional_title" ? 150 : 300
              }
              onChange={(e) =>
                updateField(key, e.target.value)
              }
            />
          )}
        </label>
      ))}

      {/* SKILLS */}
      <label className="block text-sm font-medium">
        Skills (comma separated)

        <input
          className="mt-1 w-full rounded-lg border p-3 text-slate-900"
          value={data.skills}
          onChange={(e) =>
            updateField("skills", e.target.value)
          }
        />
      </label>

      {/* DIRECTORY VISIBILITY */}
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={data.is_public}
          onChange={(e) =>
            updateField("is_public", e.target.checked)
          }
        />

        <span>
          Show my profile in the public Alumni Directory
          <span className="block text-xs text-slate-500">
            Uncheck to hide your profile.
          </span>
        </span>
      </label>

      {/* SAVE BUTTON */}
      <button
        type="submit"
        disabled={saving || uploading}
        className="rounded-lg bg-blue-900 px-5 py-3 font-semibold text-white disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save alumni profile"}
      </button>
    </form>
  );
}
