import React, { useState, useEffect } from "react";
import AdminSidebar from '../../components/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { adminAPI, paymentsAPI, liveClassAPI, coursesAPI } from '../../services/api';
import { Users, BookOpen, CreditCard, TrendingUp, Clock, CheckCircle, XCircle, Star } from 'lucide-react';

const AdminDashboard = () => {

  const [stats, setStats] = useState(null);
  const [recentPayments, setRecentPayments] = useState([]);
  const [testimonialStats, setTestimonialStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);

  // Live Class Form
  const [courses, setCourses] = useState([]);
  const [liveForm, setLiveForm] = useState({
    title: "",
    course_id: "",
    meeting_link: "",
    scheduled_date: "",
    start_time: "",
    end_time: "",
  });
  const [liveClasses, setLiveClasses] = useState([]);

  // Fetch all dashboard data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, paymentsRes] = await Promise.all([adminAPI.getStats(), paymentsAPI.getAll()]);
        setStats(statsRes.data);
        setRecentPayments(paymentsRes.data.slice(0,5));

        // Testimonials
        const tRes = await adminAPI.getTestimonials();
        const pending = tRes.data.filter(t => t.status === 'pending').length;
        const approved = tRes.data.filter(t => t.status === 'approved').length;
        const rejected = tRes.data.filter(t => t.status === 'rejected').length;
        setTestimonialStats({ pending, approved, rejected });

        // Courses for live class form
        const cRes = await coursesAPI.getAll(false);
        setCourses(cRes.data);

        // Live classes
        const lcRes = await liveClassAPI.getAll();
        setLiveClasses(lcRes.data);

      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatPrice = price => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(price);
  const formatDate = dateString => new Date(dateString).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const getStatusIcon = status => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const handleLiveSubmit = async () => {
    try {
      await liveClassAPI.create(liveForm);
      alert("Live class created successfully!");
      setLiveForm({ title: "", course_id: "", meeting_link: "", scheduled_date: "", start_time: "", end_time: "" });

      // Refresh live classes table
      const res = await liveClassAPI.getAll();
      setLiveClasses(res.data);

    } catch (error) {
      console.error(error);
      alert("Error creating live class");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />

      <main className="ml-64 p-8" data-testid="admin-dashboard">

        {/* DASHBOARD HEADER */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-secondary">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your LMS platform</p>
        </div>

        {/* LMS STATS */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-3xl font-bold mt-1">{loading ? "..." : stats?.total_students || 0}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Total Courses</p>
                <p className="text-3xl font-bold mt-1">{loading ? "..." : stats?.total_courses || 0}</p>
              </div>
              <BookOpen className="w-8 h-8 text-purple-600" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Pending Payments</p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">{loading ? "..." : stats?.pending_payments || 0}</p>
              </div>
              <CreditCard className="w-8 h-8 text-yellow-600" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{loading ? "..." : formatPrice(stats?.total_revenue || 0)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </CardContent>
          </Card>
        </div>

        {/* TESTIMONIAL STATS */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Pending Testimonials</p>
                <p className="text-3xl font-bold text-yellow-600">{testimonialStats.pending}</p>
              </div>
              <Star className="w-8 h-8 text-yellow-600" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Approved Testimonials</p>
                <p className="text-3xl font-bold text-green-600">{testimonialStats.approved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Rejected Testimonials</p>
                <p className="text-3xl font-bold text-red-600">{testimonialStats.rejected}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </CardContent>
          </Card>
        </div>

        {/* LIVE CLASS FORM & TABLE */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="font-serif">Manage Live Classes</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">

            <h2 className="font-semibold text-lg">Create New Live Class</h2>
            <input placeholder="Title" className="border p-2 rounded" value={liveForm.title} onChange={e => setLiveForm({...liveForm, title: e.target.value})} />
            <select className="border p-2 rounded" value={liveForm.course_id} onChange={e => setLiveForm({...liveForm, course_id: e.target.value})}>
              <option value="">Select Course</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            <input type="date" className="border p-2 rounded" value={liveForm.scheduled_date} onChange={e => setLiveForm({...liveForm, scheduled_date: e.target.value})} />
            <input type="time" className="border p-2 rounded" value={liveForm.start_time} onChange={e => setLiveForm({...liveForm, start_time: e.target.value})} />
            <input type="time" className="border p-2 rounded" value={liveForm.end_time} onChange={e => setLiveForm({...liveForm, end_time: e.target.value})} />
            <input placeholder="Meeting Link" className="border p-2 rounded" value={liveForm.meeting_link} onChange={e => setLiveForm({...liveForm, meeting_link: e.target.value})} />
            <button className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700" onClick={handleLiveSubmit}>Create Live Class</button>

            <h2 className="font-semibold text-lg mt-6">Scheduled Live Classes</h2>
            {loading ? (
              <div className="p-4">Loading classes...</div>
            ) : liveClasses.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border px-4 py-2 text-left">Title</th>
                      <th className="border px-4 py-2 text-left">Course</th>
                      <th className="border px-4 py-2">Date</th>
                      <th className="border px-4 py-2">Start</th>
                      <th className="border px-4 py-2">End</th>
                      <th className="border px-4 py-2">Meeting Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liveClasses.map(lc => (
                      <tr key={lc.id} className="hover:bg-gray-50">
                        <td className="border px-4 py-2">{lc.title}</td>
                        <td className="border px-4 py-2">{lc.course_title}</td>
                        <td className="border px-4 py-2">{new Date(lc.scheduled_date).toLocaleDateString()}</td>
                        <td className="border px-4 py-2">{lc.start_time}</td>
                        <td className="border px-4 py-2">{lc.end_time}</td>
                        <td className="border px-4 py-2"><a href={lc.meeting_link} target="_blank" className="text-blue-600 underline">Join</a></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No live classes scheduled yet.</p>
            )}

          </CardContent>
        </Card>

        {/* RECENT PAYMENTS */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Recent Payment Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => <div key={i} className="p-4 bg-muted rounded animate-pulse"/> )}
              </div>
            ) : recentPayments.length > 0 ? (
              <div className="space-y-4">
                {recentPayments.map(payment => (
                  <div key={payment.id} className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(payment.status)}
                      <div>
                        <p className="font-medium">{payment.user_name}</p>
                        <p className="text-sm text-muted-foreground">{payment.course_title}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{formatPrice(payment.course_price)}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(payment.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No payment submissions yet</p>
            )}
          </CardContent>
        </Card>

      </main>
    </div>
  );
};

export default AdminDashboard;