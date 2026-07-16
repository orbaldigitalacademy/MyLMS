import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StudentSidebar from '../../components/StudentSidebar';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { enrollmentsAPI, liveClassAPI } from '../../services/api';
import { BookOpen, Play, Lock, Clock, Menu, X } from 'lucide-react';

const StudentCourses = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await enrollmentsAPI.getMy();
        const enrollData = res.data || [];
        setEnrollments(enrollData);

        const accessibleCourseIds = enrollData
          .filter(e => e.access_granted)
          .map(e => e.course_id);

        if (accessibleCourseIds.length > 0) {
          const liveRes = await Promise.all(
            accessibleCourseIds.map(id => liveClassAPI.getByCourse(id))
          );
          const allClasses = liveRes.flatMap(r => r.data || []);
          setClasses(allClasses);
        } else {
          setClasses([]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'badge-pending',
      approved: 'badge-approved',
      rejected: 'badge-rejected'
    };
    return <Badge className={styles[status] || ''}>{status}</Badge>;
  };

  const getTimeLeft = (cls) => {
    const now = new Date();
    const start = new Date(`${cls.scheduled_date}T${cls.start_time}`);
    const diff = Math.floor((start - now) / 60000);
    if (diff <= 0) return "Starting...";
    if (diff < 60) return `${diff} mins`;
    return `${Math.floor(diff / 60)}h ${diff % 60}m`;
  };

  const canJoin = (cls) => {
    const now = new Date();
    const start = new Date(`${cls.scheduled_date}T${cls.start_time}`);
    const diff = (start - now) / 60000;
    return diff <= 10;
  };

  const liveNow = classes.filter(c => c.status === "live");
  const upcoming = classes.filter(c => c.status === "scheduled");

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Top Bar */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-background border-b">
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
          data-testid="mobile-menu-open-btn"
          className="p-2 rounded-md hover:bg-muted"
        >
          <Menu className="w-6 h-6" />
        </button>
        <span className="font-serif font-bold text-lg text-secondary">My Courses</span>
        <div className="w-10" />
      </div>

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-opacity ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className="absolute inset-0 bg-black/50"
          onClick={() => setSidebarOpen(false)}
          data-testid="mobile-sidebar-backdrop"
        />
        <div className="absolute left-0 top-0 h-full w-64 bg-background shadow-xl">
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
            data-testid="mobile-menu-close-btn"
            className="absolute top-3 right-3 p-2 rounded-md hover:bg-white/10 text-white z-10"
          >
            <X className="w-5 h-5" />
          </button>
          <StudentSidebar onNavigate={() => setSidebarOpen(false)} />
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <StudentSidebar />
      </div>

      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8">

        {/* HEADER */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">My Courses</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            View and access your enrolled courses
          </p>
        </div>

        {/* COURSES GRID */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <div className="h-36 sm:h-40 bg-muted animate-pulse" />
                <CardContent className="p-4 sm:p-6">
                  <div className="h-6 bg-muted mb-2 animate-pulse rounded" />
                  <div className="h-4 bg-muted w-1/2 animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : enrollments.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {enrollments.map(enrollment => (
              <Card key={enrollment.id} className="overflow-hidden flex flex-col">
                {/* IMAGE */}
                <div className="relative h-36 sm:h-40 shrink-0">
                  <img
                    src={enrollment.course_image || 'https://images.unsplash.com/photo-1665586510291-ae722d1d1f00'}
                    alt={enrollment.course_title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                    {getStatusBadge(enrollment.payment_status)}
                  </div>
                  {!enrollment.access_granted && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Lock className="w-8 h-8 text-white" />
                    </div>
                  )}
                </div>

                {/* CONTENT */}
                <CardContent className="p-4 sm:p-6 flex-1 flex flex-col">
                  <h3 className="font-bold text-base sm:text-lg mb-2 line-clamp-2">
                    {enrollment.course_title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-4">
                    <Clock className="w-4 h-4 shrink-0" />
                    <span className="truncate">
                      {enrollment.completed_lessons?.length || 0} lessons completed
                    </span>
                  </div>

                  <div className="mt-auto">
                    {enrollment.access_granted ? (
                      <Link
                        to={`/dashboard/learn/${enrollment.course_id}`}
                        className="block"
                      >
                        <Button
                          className="w-full"
                          data-testid={`continue-learning-${enrollment.course_id}`}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Continue Learning
                        </Button>
                      </Link>
                    ) : enrollment.payment_status === 'pending' ? (
                      <Button disabled className="w-full">
                        Payment Pending
                      </Button>
                    ) : (
                      <Link
                        to={`/payment/${enrollment.course_id}`}
                        className="block"
                      >
                        <Button
                          variant="outline"
                          className="w-full"
                          data-testid={`retry-payment-${enrollment.course_id}`}
                        >
                          Retry Payment
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 sm:py-16 px-4">
            <BookOpen className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg sm:text-xl font-bold mb-4">No Courses Yet</h3>
            <Link to="/courses">
              <Button data-testid="browse-courses-btn">Browse Courses</Button>
            </Link>
          </div>
        )}

        {/* LIVE CLASSES */}
        {(liveNow.length > 0 || upcoming.length > 0) && (
          <h2 className="text-lg sm:text-xl font-bold mt-8 sm:mt-10 mb-4">
            Live Classes
          </h2>
        )}

        {/* 🔴 LIVE NOW */}
        {liveNow.length > 0 && (
          <div className="mb-6">
            <h3 className="text-red-600 font-semibold mb-2 text-sm sm:text-base">
              🔴 Live Now
            </h3>
            <div className="space-y-2">
              {liveNow.map(cls => (
                <div
                  key={cls._id || cls.id}
                  className="p-4 border rounded-lg bg-red-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <h3 className="font-semibold text-sm sm:text-base truncate">
                    {cls.title}
                  </h3>
                  <Link
                    to={`/dashboard/live/${cls._id || cls.id}`}
                    className="w-full sm:w-auto"
                  >
                    <button
                      className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md font-semibold text-sm hover:bg-red-700 transition-colors"
                      data-testid={`join-live-${cls._id || cls.id}`}
                    >
                      🔴 Join Now
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ⏳ UPCOMING */}
        {upcoming.length > 0 && (
          <div>
            <h3 className="text-yellow-600 font-semibold mb-2 text-sm sm:text-base">
              Upcoming
            </h3>
            <div className="space-y-2">
              {upcoming.slice(0, 3).map(cls => (
                <div
                  key={cls._id || cls.id}
                  className="p-4 border rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm sm:text-base font-medium truncate">
                      {cls.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                      {cls.scheduled_date} • {cls.start_time}
                    </p>
                    <p className="text-yellow-600 text-xs sm:text-sm mt-0.5">
                      Starts in: {getTimeLeft(cls)}
                    </p>
                  </div>

                  <div className="w-full sm:w-auto">
                    {cls.status === "live" || canJoin(cls) ? (
                      <Link
                        to={`/dashboard/live/${cls._id || cls.id}`}
                        className="w-full sm:w-auto block"
                      >
                        <button
                          className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md font-semibold text-sm hover:bg-green-700 transition-colors"
                          data-testid={`join-upcoming-${cls._id || cls.id}`}
                        >
                          🔴 Join Now
                        </button>
                      </Link>
                    ) : (
                      <span className="text-gray-400 text-xs sm:text-sm block sm:text-right">
                        Join opens 10 mins before
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentCourses;
