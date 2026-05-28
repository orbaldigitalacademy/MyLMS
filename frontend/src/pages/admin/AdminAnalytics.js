import React, { useEffect, useState } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import axios from "axios";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Tooltip,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer
} from "recharts";

const AdminAnalytics = () => {

  const [revenueData, setRevenueData] = useState([]);
  const [enrollmentData, setEnrollmentData] = useState([]);
  const [studentGrowth, setStudentGrowth] = useState([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {

      const res = await axios.get("/api/admin/analytics");

      setRevenueData(res.data.revenue);
      setEnrollmentData(res.data.enrollments);
      setStudentGrowth(res.data.students);

    } catch (error) {
      console.error("Analytics fetch failed", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">

      <AdminSidebar />

      <main className="ml-64 p-8">

        <h1 className="text-3xl font-bold mb-8">
          Platform Analytics
        </h1>

        {/* Revenue Chart */}

        <div className="bg-white p-6 rounded-lg shadow mb-8">

          <h2 className="text-xl font-semibold mb-4">
            Monthly Revenue
          </h2>

          <ResponsiveContainer width="100%" height={300}>

            <LineChart data={revenueData}>

              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="month" />

              <YAxis />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#16a34a"
                strokeWidth={3}
              />

            </LineChart>

          </ResponsiveContainer>

        </div>


        {/* Course Enrollments */}

        <div className="bg-white p-6 rounded-lg shadow mb-8">

          <h2 className="text-xl font-semibold mb-4">
            Course Enrollments
          </h2>

          <ResponsiveContainer width="100%" height={300}>

            <BarChart data={enrollmentData}>

              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="course" />

              <YAxis />

              <Tooltip />

              <Bar
                dataKey="students"
                fill="#3b82f6"
              />

            </BarChart>

          </ResponsiveContainer>

        </div>


        {/* Student Growth */}

        <div className="bg-white p-6 rounded-lg shadow">

          <h2 className="text-xl font-semibold mb-4">
            Student Growth
          </h2>

          <ResponsiveContainer width="100%" height={300}>

            <PieChart>

              <Pie
                data={studentGrowth}
                dataKey="value"
                nameKey="name"
                outerRadius={120}
                fill="#8884d8"
                label
              />

              <Tooltip />

            </PieChart>

          </ResponsiveContainer>

        </div>

      </main>

    </div>
  );
};

export default AdminAnalytics;