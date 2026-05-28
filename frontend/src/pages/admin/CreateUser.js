import { useState } from "react";
import { adminAPI } from "../../services/api";

export default function CreateUser() {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "student",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Handle input change
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await adminAPI.createUser(formData);

      setMessage("User created successfully ✅");

      // Reset form
      setFormData({
        full_name: "",
        email: "",
        password: "",
        role: "student",
      });

    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to create user"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Create User</h2>

      {/* SUCCESS MESSAGE */}
      {message && (
        <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
          {message}
        </div>
      )}

      {/* ERROR MESSAGE */}
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* FULL NAME */}
        <input
          type="text"
          name="full_name"
          placeholder="Full Name"
          value={formData.full_name}
          onChange={handleChange}
          required
          className="w-full border p-3 rounded"
        />

        {/* EMAIL */}
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full border p-3 rounded"
        />

        {/* PASSWORD */}
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
          className="w-full border p-3 rounded"
        />

        {/* ROLE */}
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="w-full border p-3 rounded"
        >
          <option value="student">Student</option>
          <option value="instructor">Instructor</option>
          <option value="moderator">Moderator</option>
          <option value="admin">Admin</option>
        </select>

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white p-3 rounded hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create User"}
        </button>

      </form>
    </div>
  );
}