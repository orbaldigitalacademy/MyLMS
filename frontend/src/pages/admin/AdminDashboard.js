import React, {
  useState,
  useEffect,
  useCallback,
} from 'react';

import AdminSidebar from '../../components/AdminSidebar';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';

import { Button } from '../../components/ui/button';

import { Input } from '../../components/ui/input';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

import { toast } from 'sonner';

import {
  adminAPI,
  paymentsAPI,
  liveClassAPI,
  coursesAPI,
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
  Loader2,
  Video,
  ExternalLink,
} from 'lucide-react';

const INITIAL_LIVE_FORM = {
  title: '',
  course_id: '',
  meeting_link: '',
  scheduled_date: '',
  start_time: '',
  end_time: '',
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);

  const [recentPayments, setRecentPayments] =
    useState([]);

  const [testimonialStats, setTestimonialStats] =
    useState({
      pending: 0,
      approved: 0,
      rejected: 0,
    });

  const [courses, setCourses] = useState([]);

  const [liveClasses, setLiveClasses] = useState(
    []
  );

  const [liveForm, setLiveForm] = useState(
    INITIAL_LIVE_FORM
  );

  const [loading, setLoading] = useState(true);

  const [creatingLiveClass, setCreatingLiveClass] =
    useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);

    try {
      const [
        statsRes,
        paymentsRes,
        testimonialsRes,
        coursesRes,
        liveClassesRes,
      ] = await Promise.all([
        adminAPI.getStats(),
        paymentsAPI.getAll(),
        adminAPI.getTestimonials(),
        coursesAPI.getAll(false),
        liveClassAPI.getAll(),
      ]);

      // STATS
      setStats(statsRes.data || null);

      // PAYMENTS
      setRecentPayments(
        Array.isArray(paymentsRes.data)
          ? paymentsRes.data.slice(0, 5)
          : []
      );

      // TESTIMONIALS
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

      // COURSES
      setCourses(
        Array.isArray(coursesRes.data)
          ? coursesRes.data
          : []
      );

      // LIVE CLASSES
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

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(Number(price || 0));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';

    return new Date(dateString).toLocaleDateString(
      'en-NG',
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }
    );
  };

  const formatTime = (time) => {
    if (!time) return '-';

    return time.slice(0, 5);
  };

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

  const validateLiveForm = () => {
    if (
      !liveForm.title.trim() ||
      !liveForm.course_id ||
      !liveForm.meeting_link ||
      !liveForm.scheduled_date ||
      !liveForm.start_time ||
      !liveForm.end_time
    ) {
      toast.error(
        'Please complete all live class fields'
      );

      return false;
    }

    try {
      new URL(liveForm.meeting_link);
    } catch {
      toast.error(
        'Please enter a valid meeting link'
      );

      return false;
    }

    if (
      liveForm.start_time >= liveForm.end_time
    ) {
      toast.error(
        'End time must be later than start time'
      );

      return false;
    }

    return true;
  };

  const handleLiveSubmit = async (e) => {
    e.preventDefault();

    if (!validateLiveForm()) return;

    setCreatingLiveClass(true);

    try {
      const payload = {
        ...liveForm,
        course_id: Number(
          liveForm.course_id
        ),
      };

      const response =
        await liveClassAPI.create(payload);

      setLiveClasses((prev) => [
        response.data,
        ...prev,
      ]);

      toast.success(
        'Live class created successfully'
      );

      setLiveForm(INITIAL_LIVE_FORM);
    } catch (error) {
      console.error(
        'Failed to create live class:',
        error
      );

      toast.error(
        error?.response?.data?.detail ||
          'Failed to create live class'
      );
    } finally {
      setCreatingLiveClass(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />

      <main
        className="ml-64 p-8"
        data-testid="admin-dashboard"
      >
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-secondary">
            Dashboard
          </h1>

          <p className="text-muted-foreground mt-1">
            Overview of your LMS platform
          </p>
        </div>

        {/* LMS STATS */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Students"
            value={
              stats?.total_students || 0
            }
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
            value={
              stats?.pending_payments || 0
            }
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

        {/* TESTIMONIAL STATS */}
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

        {/* LIVE CLASSES */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="font-serif flex items-center gap-2">
              <Video className="w-5 h-5" />
              Manage Live Classes
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* CREATE FORM */}
            <div>
              <h2 className="font-semibold text-lg mb-4">
                Create New Live Class
              </h2>

              <form
                onSubmit={handleLiveSubmit}
                className="grid md:grid-cols-2 gap-4"
              >
                <Input
                  placeholder="Live Class Title"
                  value={liveForm.title}
                  onChange={(e) =>
                    setLiveForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                />

                <Select
                  value={liveForm.course_id}
                  onValueChange={(value) =>
                    setLiveForm((prev) => ({
                      ...prev,
                      course_id: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Course" />
                  </SelectTrigger>

                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem
                        key={course.id}
                        value={String(course.id)}
                      >
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  type="date"
                  value={
                    liveForm.scheduled_date
                  }
                  onChange={(e) =>
                    setLiveForm((prev) => ({
                      ...prev,
                      scheduled_date:
                        e.target.value,
                    }))
                  }
                />

                <Input
                  placeholder="Meeting Link"
                  type="url"
                  value={liveForm.meeting_link}
                  onChange={(e) =>
                    setLiveForm((prev) => ({
                      ...prev,
                      meeting_link:
                        e.target.value,
                    }))
                  }
                />

                <Input
                  type="time"
                  value={liveForm.start_time}
                  onChange={(e) =>
                    setLiveForm((prev) => ({
                      ...prev,
                      start_time:
                        e.target.value,
                    }))
                  }
                />

                <Input
                  type="time"
                  value={liveForm.end_time}
                  onChange={(e) =>
                    setLiveForm((prev) => ({
                      ...prev,
                      end_time:
                        e.target.value,
                    }))
                  }
                />

                <div className="md:col-span-2">
                  <Button
                    type="submit"
                    disabled={
                      creatingLiveClass
                    }
                  >
                    {creatingLiveClass ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Live Class'
                    )}
                  </Button>
                </div>
              </form>
            </div>

            {/* LIVE CLASSES TABLE */}
            <div>
              <h2 className="font-semibold text-lg mb-4">
                Scheduled Live Classes
              </h2>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="h-16 bg-muted rounded animate-pulse"
                    />
                  ))}
                </div>
              ) : liveClasses.length > 0 ? (
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
                      {liveClasses.map(
                        (liveClass) => (
                          <tr
                            key={
                              liveClass.id
                            }
                            className="border-t hover:bg-muted/30"
                          >
                            <td className="px-4 py-3">
                              {
                                liveClass.title
                              }
                            </td>

                            <td className="px-4 py-3">
                              {
                                liveClass.course_title
                              }
                            </td>

                            <td className="px-4 py-3">
                              {formatDate(
                                liveClass.scheduled_date
                              )}
                            </td>

                            <td className="px-4 py-3">
                              {formatTime(
                                liveClass.start_time
                              )}
                            </td>

                            <td className="px-4 py-3">
                              {formatTime(
                                liveClass.end_time
                              )}
                            </td>

                            <td className="px-4 py-3">
                              <a
                                href={
                                  liveClass.meeting_link
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                              >
                                Join

                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-6">
                  No live classes scheduled yet.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* RECENT PAYMENTS */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">
              Recent Payment Submissions
            </CardTitle>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="p-4 bg-muted rounded animate-pulse h-20"
                  />
                ))}
              </div>
            ) : recentPayments.length > 0 ? (
              <div className="space-y-4">
                {recentPayments.map(
                  (payment) => (
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
                            {
                              payment.user_name
                            }
                          </p>

                          <p className="text-sm text-muted-foreground">
                            {
                              payment.course_title
                            }
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
                  )
                )}
              </div>
            ) : (
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