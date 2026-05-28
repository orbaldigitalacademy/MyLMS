import React, { useState, useEffect } from "react";
import { liveClassAPI, coursesAPI } from "../../services/api";

const AdminLiveClasses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    course_id: "",
    meeting_link: "",
    scheduled_at: "",
    duration_minutes: 60,
  });

  // -------------------------
  // FETCH COURSES
  // -------------------------
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await coursesAPI.getAll(false);
        setCourses(res.data);
      } catch (err) {
        console.error(err);
        alert("Failed to load courses");
      }
    };

    fetchCourses();
  }, []);

  // -------------------------
  // HANDLE INPUT CHANGE
  // -------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // -------------------------
  // SUBMIT
  // -------------------------
  const handleSubmit = async () => {
    if (!form.title || !form.course_id || !form.scheduled_at) {
      alert("Please fill all required fields");
      return;
    }

    setLoading(true);

    try {
      const date = new Date(form.scheduled_at);

      // ❌ protect invalid date (IMPORTANT FIX)
      if (isNaN(date.getTime())) {
        alert("Invalid date selected");
        setLoading(false);
        return;
      }

      const payload = {
        title: form.title,
        course_id: form.course_id,
        meeting_link: form.meeting_link,
        duration_minutes: Number(form.duration_minutes) || 60,
        scheduled_at: date.toISOString(),
      };

      console.log("PAYLOAD SENT:", payload);

      await liveClassAPI.create(payload);

      alert("Live class created successfully");

      setForm({
        title: "",
        course_id: "",
        meeting_link: "",
        scheduled_at: "",
        duration_minutes: 60,
      });

    } catch (err) {
      console.log(err.response?.data || err);
      alert("Error creating class");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  // UI
  // -------------------------
  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-xl font-bold mb-4">Create Live Class</h1>

      <input
        name="title"
        placeholder="Class Title"
        value={form.title}
        onChange={handleChange}
        className="border p-2 w-full mb-3"
      />

      <select
        name="course_id"
        value={form.course_id}
        onChange={handleChange}
        className="border p-2 w-full mb-3"
      >
        <option value="">Select Course</option>
        {courses.map((c) => (
          <option key={c._id} value={c._id}>
            {c.title}
          </option>
        ))}
      </select>

      <input
        type="datetime-local"
        name="scheduled_at"
        value={form.scheduled_at}
        onChange={handleChange}
        className="border p-2 w-full mb-3"
      />

      <input
        type="number"
        name="duration_minutes"
        placeholder="Duration (minutes)"
        value={form.duration_minutes}
        onChange={handleChange}
        className="border p-2 w-full mb-3"
      />

      <input
        name="meeting_link"
        placeholder="Meeting Link"
        value={form.meeting_link}
        onChange={handleChange}
        className="border p-2 w-full mb-3"
      />

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2"
      >
        {loading ? "Creating..." : "Create Live Class"}
      </button>
    </div>
  );
};

export default AdminLiveClasses;