import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StudentSidebar from '../../components/StudentSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { enrollmentsAPI, paymentsAPI, liveClassAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  BookOpen, 
  CreditCard, 
  Clock, 
  CheckCircle,
  ArrowRight,
  Play,
  Menu,
  X
} from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();

  const [enrollments, setEnrollments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [enrollRes, paymentRes] = await Promise.all([
          enrollmentsAPI.getMy(),
          paymentsAPI.getMy()
        ]);

        setEnrollments(enrollRes.data);
        setPayments(paymentRes.data);

        const courseIds = enrollRes.data.map(e => e.course_id);

        if (courseIds.length > 0) {
          const liveRes = await Promise.all(
            courseIds.map(id => liveClassAPI.getByCourse(id))
          );
          const allClasses = liveRes.flatMap(r => r?.data || []);
          setClasses(allClasses);
        } else {
          setClasses([]);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const approvedEnrollments = enrollments.filter(e => e.payment_status === 'approved');
  const pendingPayments = payments.filter(p => p.status === 'pending');

  const nextLiveClass = classes
    .filter(c => c.status === "scheduled")
    .sort((a, b) => {
      const dateA = new Date(`${a.scheduled_date} ${a.start_time}`);
      const dateB = new Date(`${b.scheduled_date} ${b.start_time}`);
      return dateA - dateB;
    })[0] || null;

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'badge-pending',
      approved: 'badge-approved',
      rejected: 'badge-rejected'
    };
    return <Badge className={styles[status] || ''}>{status}</Badge>;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(price);
  };

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
        <span className="font-serif font-bold text-lg text-secondary">Dashboard</span>
        <div className="w-10" />
      </div>

      {/* Sidebar - mobile drawer + desktop fixed */}
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
            className="absolute top-3 right-3 p-2 rounded-md hover:bg-muted z-10"
          >
            <X className="w-5 h-5" />
          </button>
          <StudentSidebar />
        </div>
      </div>

      <div className="hidden lg:block">
        <StudentSidebar />
      </div>

      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8">
        
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-secondary">
            Welcome back, {user?.full_name?.split(' ')[0]}!
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Continue your learning journey
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardContent className="p-4 sm:p-6 flex items-center gap-3 sm:gap-4">
              <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold">{approvedEnrollments.length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Active Courses</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6 flex items-center gap-3 sm:gap-4">
              <Clock className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-600 shrink-0" />
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold">{pendingPayments.length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Pending Payments</p>
              </div>
            </CardContent>
          </Card>

          <Card className="sm:col-span-2 lg:col-span-1">
            <CardContent className="p-4 sm:p-6 flex items-center gap-3 sm:gap-4">
              <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-green-600 shrink-0" />
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold">{enrollments.length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Enrollments</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Courses */}
        <Card className="mb-6 sm:mb-8">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base sm:text-lg">My Courses</CardTitle>
            <Link to="/dashboard/courses">
              <Button variant="ghost" size="sm" data-testid="view-all-courses-btn">
                View All
              </Button>
            </Link>
          </CardHeader>

          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : approvedEnrollments.length > 0 ? (
              approvedEnrollments.slice(0, 3).map(enrollment => (
                <div
                  key={enrollment.id}
                  className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 pb-4 border-b last:border-0 last:pb-0 last:mb-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{enrollment.course_title}</p>
                    <small className="text-muted-foreground">
                      {enrollment.completed_lessons?.length || 0} lessons
                    </small>
                  </div>

                  <Link
                    to={`/dashboard/learn/${enrollment.course_id}`}
                    className="w-full sm:w-auto"
                  >
                    <Button size="sm" className="w-full sm:w-auto" data-testid={`continue-course-${enrollment.course_id}`}>
                      <Play className="w-4 h-4 mr-1" />
                      Continue
                    </Button>
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No courses yet</p>
            )}
          </CardContent>
        </Card>

        {/* Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Recent Payments</CardTitle>
          </CardHeader>

          <CardContent>
            {payments.length > 0 ? (
              payments.slice(0, 5).map(payment => (
                <div
                  key={payment.id}
                  className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3 pb-3 border-b last:border-0 last:pb-0 last:mb-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{payment.course_title}</p>
                    <small className="text-muted-foreground">{formatPrice(payment.course_price)}</small>
                  </div>
                  <div className="self-start sm:self-auto">
                    {getStatusBadge(payment.status)}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No payments yet</p>
            )}
          </CardContent>
        </Card>

        {/* Live Class */}
        {nextLiveClass && (
          <div className="bg-red-100 p-4 mt-6 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base">🔴 Upcoming Live Class</h3>
              <p className="text-sm sm:text-base truncate">{nextLiveClass.title}</p>
            </div>

            <a 
              href={nextLiveClass.meeting_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors whitespace-nowrap"
              data-testid="join-live-class-link"
            >
              Join Class
            </a>
          </div>
        )}

      </main>
    </div>
  );
};

export default StudentDashboard;
