import React, { useState, useEffect } from "react";
import { liveClassAPI, coursesAPI } from "../../services/api";

const AdminLiveClasses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  // Field names match the backend model: meeting_url, start_time (ISO), duration_minutes
  const [form, setForm] = useState({
    title: "",
    course_id: "",
    meeting_url: "",
    start_time: "", // datetime-local value
    duration_minutes: 60,
  });

  // -------------------------
  // FETCH COURSES
  // -------------------------
   useEffect(() => {
      const fetchCourses = async () => {
        try {
          const res = await coursesAPI.getAll();
    
          console.log("COURSES RESPONSE:", res.data);
    
          if (!Array.isArray(res.data)) {
            console.error("Expected courses array but received:", res.data);
            setCourses([]);
            return;
          }
    
          const normalizedCourses = res.data.map((course) => ({
            ...course,
            id: String(course.id || course._id || course.course_id),
          }));
    
          console.log("NORMALIZED COURSES:", normalizedCourses);
    
          setCourses(normalizedCourses);
        } catch (err) {
          console.error("FAILED TO LOAD COURSES:", err);
          alert("Failed to load courses");
        }
      };
    
      fetchCourses();
    }, []);
  
  // -------------------------
  // HANDLE INPUT CHANGE  (works for every field, including the select)
  // -------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // -------------------------
  // SUBMIT
  // -------------------------
  const handleSubmit = async () => {
    // ---- Guards ----
    if (!form.title.trim()) return alert("Title is required");
    if (!form.course_id) return alert("Please select a course");
    if (!/^https?:\/\//.test(form.meeting_url.trim()))
      return alert("Meeting URL must start with http:// or https://");

    const date = new Date(form.start_time);
    if (isNaN(date.getTime())) return alert("Invalid date selected");

    const duration = Number(form.duration_minutes);
    if (!duration || duration <= 0)
      return alert("Duration must be greater than 0");

    setLoading(true);
    try {
      // datetime-local (local time) -> UTC ISO
      const startISO = date.toISOString();

      const payload = {
        title: form.title.trim(),
        course_id: form.course_id,
        meeting_url: form.meeting_url.trim(),
        start_time: startISO,
        duration_minutes: duration,
      };

      console.log("PAYLOAD SENT:", payload);
      await liveClassAPI.create(payload);

      alert("Live class created successfully");
      setForm({
        title: "",
        course_id: "",
        meeting_url: "",
        start_time: "",
        duration_minutes: 60,
      });
    } catch (err) {
      console.log(err.response?.data || err);
      alert(err.response?.data?.detail || "Error creating class");
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
        {courses.map((course) => (
          <option key={course.id} value={course.id}>
            {course.title}
          </option>
        ))}
      </select>

      <input
        type="datetime-local"
        name="start_time"
        value={form.start_time}
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
        name="meeting_url"
        placeholder="Meeting Link"
        value={form.meeting_url}
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
