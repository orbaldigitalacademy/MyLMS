import React, { useState, useEffect, useCallback } from 'react';

import AdminSidebar from '../../components/AdminSidebar';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';

import { toast } from 'sonner';

import {
  adminAPI,
  paymentsAPI,
  liveClassAPI,
} from '../../services/api';

import {
  Users,
  BookOpen,
  CreditCard,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Star,
  Video,
  ExternalLink,
} from 'lucide-react';


const AdminDashboard = () => {
  const [stats, setStats] = useState(null);

  const [recentPayments, setRecentPayments] = useState([]);

  const [testimonialStats, setTestimonialStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  const [liveClasses, setLiveClasses] = useState([]);

  const [loading, setLoading] = useState(true);


  // =========================================================
  // FETCH DASHBOARD DATA
  // =========================================================

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);

    try {
      const [
        statsRes,
        paymentsRes,
        testimonialsRes,
        liveClassesRes,
      ] = await Promise.all([
        adminAPI.getStats(),
        paymentsAPI.getAll(),
        adminAPI.getTestimonials(),
        liveClassAPI.getAll(),
      ]);


      // =====================================================
      // STATS
      // =====================================================

      setStats(statsRes.data || null);


      // =====================================================
      // PAYMENTS
      // =====================================================

      setRecentPayments(
        Array.isArray(paymentsRes.data)
          ? paymentsRes.data.slice(0, 5)
          : []
      );


      // =====================================================
      // TESTIMONIALS
      // =====================================================

      const testimonials = Array.isArray(
        testimonialsRes.data
      )
        ? testimonialsRes.data
        : [];

      const pending = testimonials.filter(
        (t) => t.status === 'pending'
      ).length;

      const approved = testimonials.filter(
        (t) => t.status === 'approved'
      ).length;

      const rejected = testimonials.filter(
        (t) => t.status === 'rejected'
      ).length;

      setTestimonialStats({
        pending,
        approved,
        rejected,
      });


      // =====================================================
      // LIVE CLASSES
      // =====================================================

      setLiveClasses(
        Array.isArray(liveClassesRes.data)
          ? liveClassesRes.data
          : []
      );

    } catch (error) {
      console.error(
        'Failed to fetch dashboard data:',
        error
      );

      toast.error(
        'Failed to load dashboard data'
      );

    } finally {
      setLoading(false);
    }
  }, []);


  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);


  // =========================================================
  // FORMAT PRICE
  // =========================================================

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(Number(price || 0));
  };


  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (dateString) => {
    if (!dateString) return '-';

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return '-';
    }

    return date.toLocaleDateString('en-NG', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };


  // =========================================================
  // FORMAT TIME
  // =========================================================

  const formatTime = (dateString) => {
    if (!dateString) return '-';

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return '-';
    }

    return date.toLocaleTimeString('en-NG', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };


  // =========================================================
  // STATUS ICON
  // =========================================================

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return (
          <CheckCircle className="w-5 h-5 text-green-600" />
        );

      case 'rejected':
        return (
          <XCircle className="w-5 h-5 text-red-600" />
        );

      default:
        return (
          <Clock className="w-5 h-5 text-yellow-600" />
        );
    }
  };


  // =========================================================
  // STAT CARD
  // =========================================================

  const StatCard = ({
    title,
    value,
    icon: Icon,
    iconColor,
    valueColor,
  }) => (
    <Card>
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {title}
          </p>

          <p
            className={`text-3xl font-bold mt-1 ${
              valueColor || ''
            }`}
          >
            {loading ? '...' : value}
          </p>
        </div>

        <Icon
          className={`w-8 h-8 ${iconColor}`}
        />
      </CardContent>
    </Card>
  );


  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="min-h-screen bg-background">

      <AdminSidebar />


      <main
        className="ml-64 p-8"
        data-testid="admin-dashboard"
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-8">

          <h1 className="font-serif text-3xl font-bold text-secondary">
            Dashboard
          </h1>

          <p className="text-muted-foreground mt-1">
            Overview of your LMS platform
          </p>

        </div>


        {/* =================================================
            LMS STATS
        ================================================= */}

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

          <StatCard
            title="Total Students"
            value={stats?.total_students || 0}
            icon={Users}
            iconColor="text-blue-600"
          />

          <StatCard
            title="Total Courses"
            value={stats?.total_courses || 0}
            icon={BookOpen}
            iconColor="text-purple-600"
          />

          <StatCard
            title="Pending Payments"
            value={stats?.pending_payments || 0}
            icon={CreditCard}
            iconColor="text-yellow-600"
            valueColor="text-yellow-600"
          />

          <StatCard
            title="Total Revenue"
            value={formatPrice(
              stats?.total_revenue || 0
            )}
            icon={TrendingUp}
            iconColor="text-green-600"
            valueColor="text-green-600 text-2xl"
          />

        </div>


        {/* =================================================
            TESTIMONIAL STATS
        ================================================= */}

        <div className="grid md:grid-cols-3 gap-6 mb-8">

          <StatCard
            title="Pending Testimonials"
            value={testimonialStats.pending}
            icon={Star}
            iconColor="text-yellow-600"
            valueColor="text-yellow-600"
          />

          <StatCard
            title="Approved Testimonials"
            value={testimonialStats.approved}
            icon={CheckCircle}
            iconColor="text-green-600"
            valueColor="text-green-600"
          />

          <StatCard
            title="Rejected Testimonials"
            value={testimonialStats.rejected}
            icon={XCircle}
            iconColor="text-red-600"
            valueColor="text-red-600"
          />

        </div>


        {/* =================================================
            LIVE CLASSES
        ================================================= */}

        <Card className="mb-8">

          <CardHeader>

            <CardTitle className="font-serif flex items-center gap-2">

              <Video className="w-5 h-5" />

              Scheduled Live Classes

            </CardTitle>

          </CardHeader>


          <CardContent>

            {loading ? (

              // -------------------------------------------------
              // LOADING STATE
              // -------------------------------------------------

              <div className="space-y-4">

                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-16 bg-muted rounded animate-pulse"
                  />
                ))}

              </div>

            ) : liveClasses.length > 0 ? (

              // -------------------------------------------------
              // LIVE CLASSES TABLE
              // -------------------------------------------------

              <div className="overflow-x-auto rounded-lg border">

                <table className="min-w-full">

                  <thead className="bg-muted">

                    <tr>

                      <th className="text-left px-4 py-3 text-sm font-medium">
                        Title
                      </th>

                      <th className="text-left px-4 py-3 text-sm font-medium">
                        Course
                      </th>

                      <th className="text-left px-4 py-3 text-sm font-medium">
                        Date
                      </th>

                      <th className="text-left px-4 py-3 text-sm font-medium">
                        Start
                      </th>

                      <th className="text-left px-4 py-3 text-sm font-medium">
                        End
                      </th>

                      <th className="text-left px-4 py-3 text-sm font-medium">
                        Link
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {liveClasses.map((liveClass) => (

                      <tr
                        key={liveClass.id}
                        className="border-t hover:bg-muted/30"
                      >

                        {/* TITLE */}

                        <td className="px-4 py-3">

                          {liveClass.title || '-'}

                        </td>


                        {/* COURSE */}

                        <td className="px-4 py-3">

                          {liveClass.course_title ||
                            liveClass.course_id ||
                            '-'}

                        </td>


                        {/* DATE */}

                        <td className="px-4 py-3">

                          {formatDate(
                            liveClass.start_time
                          )}

                        </td>


                        {/* START */}

                        <td className="px-4 py-3">

                          {formatTime(
                            liveClass.start_time
                          )}

                        </td>


                        {/* END */}

                        <td className="px-4 py-3">

                          {formatTime(
                            liveClass.end_time
                          )}

                        </td>


                        {/* MEETING LINK */}

                        <td className="px-4 py-3">

                          {liveClass.meeting_url ? (

                            <a
                              href={liveClass.meeting_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                            >

                              Join

                              <ExternalLink className="w-4 h-4" />

                            </a>

                          ) : (

                            <span className="text-muted-foreground">
                              No link
                            </span>

                          )}

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            ) : (

              // -------------------------------------------------
              // EMPTY STATE
              // -------------------------------------------------

              <p className="text-center text-muted-foreground py-6">

                No live classes scheduled yet.

              </p>

            )}

          </CardContent>

        </Card>


        {/* =================================================
            RECENT PAYMENTS
        ================================================= */}

        <Card>

          <CardHeader>

            <CardTitle className="font-serif">
              Recent Payment Submissions
            </CardTitle>

          </CardHeader>


          <CardContent>

            {loading ? (

              // -------------------------------------------------
              // LOADING
              // -------------------------------------------------

              <div className="space-y-4">

                {[1, 2, 3].map((item) => (

                  <div
                    key={item}
                    className="p-4 bg-muted rounded animate-pulse h-20"
                  />

                ))}

              </div>

            ) : recentPayments.length > 0 ? (

              // -------------------------------------------------
              // PAYMENTS
              // -------------------------------------------------

              <div className="space-y-4">

                {recentPayments.map((payment) => (

                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                  >

                    <div className="flex items-center gap-4">

                      {getStatusIcon(
                        payment.status
                      )}

                      <div>

                        <p className="font-medium">

                          {payment.user_name || '-'}

                        </p>

                        <p className="text-sm text-muted-foreground">

                          {payment.course_title || '-'}

                        </p>

                      </div>

                    </div>


                    <div className="text-right">

                      <p className="font-bold text-primary">

                        {formatPrice(
                          payment.course_price
                        )}

                      </p>

                      <p className="text-xs text-muted-foreground">

                        {formatDate(
                          payment.created_at
                        )}

                      </p>

                    </div>

                  </div>

                ))}

              </div>

            ) : (

              // -------------------------------------------------
              // EMPTY STATE
              // -------------------------------------------------

              <p className="text-center text-muted-foreground py-8">

                No payment submissions yet

              </p>

            )}

          </CardContent>

        </Card>

      </main>

    </div>
  );
};


export default AdminDashboard;
