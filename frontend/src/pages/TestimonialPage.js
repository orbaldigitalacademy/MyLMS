import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";

export default function TestimonialPage() {
  const [testimonials, setTestimonials] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchTestimonials(page);
    fetchAverageRating();
  }, [page]);

  const fetchTestimonials = async (pageNum) => {
    try {
      setLoading(true);

      const res = await api.get(
        `/testimonials?page=${pageNum}&limit=100`
      );

      setTestimonials(res.data?.data || []);
      setPages(res.data?.pages || 1);
    } catch (err) {
      console.error("Failed to fetch testimonials", err);
      setTestimonials([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAverageRating = async () => {
    try {
      const res = await api.get(
        "/testimonials/average-rating"
      );

      setAverageRating(
        Number(res.data?.average_rating || 0).toFixed(1)
      );
    } catch (err) {
      console.error("Failed to fetch average rating", err);
    }
  };

  const submitTestimonial = async () => {
    if (!token) {
      alert("Please login first.");
      return;
    }

    if (!content.trim()) {
      alert("Please enter a testimonial.");
      return;
    }

    try {
      await api.post(
        "/testimonials",
        {
          content,
          video_url: videoUrl,
          rating,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Submitted successfully! Awaiting approval.");

      setContent("");
      setVideoUrl("");
      setRating(5);

      fetchTestimonials(page);
      fetchAverageRating();
    } catch (err) {
      console.error("Submission failed", err);

      alert(
        err?.response?.data?.detail ||
          "Failed to submit testimonial"
      );
    }
  };

  const getYoutubeEmbedUrl = (url) => {
    try {
      const parsedUrl = new URL(url);

      const videoId =
        parsedUrl.searchParams.get("v");

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }

      return url;
    } catch {
      return url;
    }
  };

  const ratingStats = useMemo(() => {
    return [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: testimonials.filter(
        (t) => t.rating === star
      ).length,
    }));
  }, [testimonials]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">

      <h1 className="text-3xl font-bold mb-2">
        Student Testimonials
      </h1>

      <p className="mb-6 text-gray-600">
        Average Rating:{" "}
        <span className="font-semibold">
          {averageRating}
        </span>{" "}
        ⭐
      </p>

      {/* Rating Summary */}

      <div className="mb-10 bg-gray-100 p-6 rounded-lg">

        <h3 className="text-xl font-semibold mb-4">
          Overall Rating
        </h3>

        <div className="flex items-center gap-4 mb-4">
          <span className="text-4xl font-bold">
            {averageRating}
          </span>

          <span className="text-yellow-500 text-xl">
            {"⭐".repeat(
              Math.round(Number(averageRating))
            )}
          </span>
        </div>

        {ratingStats.map((r) => (
          <div
            key={r.star}
            className="flex items-center gap-3 mb-2"
          >
            <span className="w-10">
              {r.star} ⭐
            </span>

            <div className="flex-1 bg-gray-300 rounded h-2">
              <div
                className="bg-yellow-500 h-2 rounded"
                style={{
                  width: `${
                    testimonials.length
                      ? (r.count /
                          testimonials.length) *
                        100
                      : 0
                  }%`,
                }}
              />
            </div>

            <span>{r.count}</span>
          </div>
        ))}
      </div>

      {/* Testimonial Form */}

      <div className="bg-gray-100 p-6 rounded-lg mb-10">
        <h2 className="text-xl font-semibold mb-4">
          Leave a Testimonial
        </h2>

        <textarea
          className="w-full border p-3 rounded mb-4"
          rows="4"
          placeholder="Write your testimonial..."
          value={content}
          onChange={(e) =>
            setContent(e.target.value)
          }
        />

        <input
          className="w-full border p-3 rounded mb-4"
          type="text"
          placeholder="Video URL (optional)"
          value={videoUrl}
          onChange={(e) =>
            setVideoUrl(e.target.value)
          }
        />

        <div className="flex items-center gap-3 mb-4">
          <span>Rating:</span>

          {[1, 2, 3, 4, 5].map((num) => (
            <span
              key={num}
              onClick={() => setRating(num)}
              className={`cursor-pointer text-2xl ${
                rating >= num
                  ? "text-yellow-500"
                  : "text-gray-400"
              }`}
            >
              ★
            </span>
          ))}
        </div>

        <button
          onClick={submitTestimonial}
          className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800"
        >
          Submit
        </button>
      </div>

      {/* Testimonials */}

      <h2 className="text-2xl font-semibold mb-6">
        What Our Students Say
      </h2>

      {loading ? (
        <div className="text-center py-10">
          Loading testimonials...
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

          {testimonials.length === 0 ? (
            <p>No testimonials found.</p>
          ) : (
            testimonials.map((t) => (
              <div
                key={t.id}
                className="border rounded-lg p-5 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-center gap-3 mb-3">

                  <img
                    loading="lazy"
                    src={
                      t.avatar_url ||
                      "/default-avatar.png"
                    }
                    alt={
                      t.user_name ||
                      "Student Avatar"
                    }
                    className="w-12 h-12 rounded-full object-cover"
                  />

                  <div>
                    <h4 className="font-semibold">
                      {t.user_name ||
                        "Anonymous Student"}
                    </h4>
                  </div>

                </div>

                <p className="text-yellow-500 mb-2">
                  {"⭐".repeat(
                    t.rating || 0
                  )}
                </p>

                {t.content && (
                  <p className="text-gray-600 mb-3">
                    {t.content}
                  </p>
                )}

                {t.video_url &&
                  t.video_url.includes(
                    "youtube"
                  ) && (
                    <iframe
                      className="w-full rounded"
                      height="200"
                      src={getYoutubeEmbedUrl(
                        t.video_url
                      )}
                      title="testimonial video"
                      allowFullScreen
                    />
                  )}

                {t.video_url &&
                  !t.video_url.includes(
                    "youtube"
                  ) && (
                    <video
                      controls
                      className="rounded w-full"
                    >
                      <source
                        src={t.video_url}
                        type="video/mp4"
                      />
                    </video>
                  )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Pagination */}

      {pages > 1 && (
        <div className="flex justify-center mt-10 gap-2">
          {Array.from(
            { length: pages },
            (_, i) => (
              <button
                key={i}
                onClick={() =>
                  setPage(i + 1)
                }
                className={`px-4 py-2 rounded ${
                  page === i + 1
                    ? "bg-black text-white"
                    : "bg-gray-200"
                }`}
              >
                {i + 1}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
