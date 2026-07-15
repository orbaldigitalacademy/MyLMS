import { useState } from "react";
import { adminAPI } from "../../services/api";

export default function CreateUser() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const formatValidationError = (detail) => {
    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          const field = item.loc?.[item.loc.length - 1] || "field";
          return `${field}: ${item.msg}`;
        })
        .join(", ");
    }

    if (typeof detail === "string") {
      return detail;
    }

    return "Failed to create user.";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      role: formData.role,
    };

    try {
      await adminAPI.createUser(payload);

      setMessage("User created successfully.");

      setFormData({
        name: "",
        email: "",
        password: "",
        role: "student",
      });
    } catch (err) {
      console.error(
        "Create user error:",
        JSON.stringify(err.response?.data, null, 2)
      );

      setError(
        formatValidationError(err.response?.data?.detail)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl p-6">
      <h2 className="mb-6 text-2xl font-bold">
        Create User
      </h2>

      {message && (
        <div
          role="alert"
          className="mb-4 rounded bg-green-100 p-3 text-green-700"
        >
          {message}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-4 rounded bg-red-100 p-3 text-red-700"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="mb-1 block text-sm font-medium"
          >
            Full Name
          </label>

          <input
            id="name"
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            minLength={2}
            required
            disabled={loading}
            className="w-full rounded border p-3 disabled:opacity-60"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium"
          >
            Email
          </label>

          <input
            id="email"
            type="email"
            name="email"
            placeholder="Email address"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
            autoComplete="email"
            className="w-full rounded border p-3 disabled:opacity-60"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium"
          >
            Password
          </label>

          <input
            id="password"
            type="password"
            name="password"
            placeholder="Minimum 8 characters"
            value={formData.password}
            onChange={handleChange}
            minLength={8}
            required
            disabled={loading}
            autoComplete="new-password"
            className="w-full rounded border p-3 disabled:opacity-60"
          />
        </div>

        <div>
          <label
            htmlFor="role"
            className="mb-1 block text-sm font-medium"
          >
            Role
          </label>

          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            disabled={loading}
            className="w-full rounded border p-3 disabled:opacity-60"
          >
            <option value="student">Student</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-black p-3 text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create User"}
        </button>
      </form>
    </div>
  );
}
