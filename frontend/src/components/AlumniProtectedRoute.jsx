import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import api from "../services/api";

export default function AlumniProtectedRoute() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let active = true;

    const checkAccess = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        if (active) setLoading(false);
        return;
      }

      try {
        // Verify JWT with existing LMS backend
        await api.get("/auth/me");

        // Verify alumni eligibility
        const response = await api.get("/alumni/me");

        const alumni = response.data;

        if (active) {
          setAuthorized(
            alumni?.is_verified === true
          );
        }
      } catch (error) {
        console.error("Alumni access denied:", error);
        if (active) setAuthorized(false);
      } finally {
        if (active) setLoading(false);
      }
    };

    checkAccess();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Verifying alumni access...</p>
      </div>
    );
  }

  if (!localStorage.getItem("token")) {
    return <Navigate to="/login" replace />;
  }

  if (!authorized) {
    return <Navigate to="/student/dashboard" replace />;
  }

  return <Outlet />;
}
