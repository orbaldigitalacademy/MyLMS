import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

const AdminTestimonial = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(false);

  const API = "http://localhost:8000/api";
  const token = localStorage.getItem("token");

  const headers = useMemo(
  () => ({
    Authorization: `Bearer ${token}`,
  }),
  [token]
  );
  const fetchTestimonials = useCallback(async () => {
  try {
    setLoading(true);

    const res = await axios.get(
      `${API}/admin/testimonials?status=${filter}`,
      { headers }
    );

    setTestimonials(res.data);
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
}, [filter, headers]);

useEffect(() => {
  fetchTestimonials();
}, [fetchTestimonials]);

  const approveTestimonial = async (id) => {
    await axios.put(
      `${API}/admin/testimonials/${id}/approve`,
      {},
      { headers }
    );

    fetchTestimonials();
  };

  const rejectTestimonial = async (id) => {
    await axios.put(
      `${API}/admin/testimonials/${id}/reject`,
      {},
      { headers }
    );

    fetchTestimonials();
  };

  const renderStars = (rating) => {
    return "⭐".repeat(rating);
  };

  return (
    <div className="p-6">

      <h2 className="text-2xl font-bold mb-4">
        Testimonial Management
      </h2>

      {/* Filter */}
      <div className="mb-6">
        <select
          className="border p-2 rounded"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading && <p>Loading testimonials...</p>}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

        {testimonials.map((t) => (
          <div
            key={t.id}
            className="bg-white shadow-lg rounded-xl p-4 border"
          >

            {/* User */}
            <div className="mb-2">
              <h3 className="font-semibold">
                {t.user_name}
              </h3>
              <p className="text-sm text-gray-500">
                {t.user_email}
              </p>
            </div>

            {/* Rating */}
            <div className="text-yellow-500 mb-2">
              {renderStars(t.rating)}
            </div>

            {/* Text testimonial */}
            {t.content && (
              <p className="text-gray-700 mb-3">
                {t.content}
              </p>
            )}

            {/* Video testimonial */}
            {t.video_url && (
              <video
                src={t.video_url}
                controls
                className="w-full rounded mb-3"
              />
            )}

            {/* Status */}
            <div className="mb-3">
              <span
                className={`px-2 py-1 text-xs rounded ${
                  t.status === "approved"
                    ? "bg-green-200 text-green-800"
                    : t.status === "rejected"
                    ? "bg-red-200 text-red-800"
                    : "bg-yellow-200 text-yellow-800"
                }`}
              >
                {t.status}
              </span>
            </div>

            {/* Actions */}
            {t.status === "pending" && (
              <div className="flex gap-2">

                <button
                  className="bg-green-600 text-white px-3 py-1 rounded"
                  onClick={() => approveTestimonial(t.id)}
                >
                  Approve
                </button>

                <button
                  className="bg-red-600 text-white px-3 py-1 rounded"
                  onClick={() => rejectTestimonial(t.id)}
                >
                  Reject
                </button>

              </div>
            )}

          </div>
        ))}

      </div>

    </div>
  );
};

export default AdminTestimonial;