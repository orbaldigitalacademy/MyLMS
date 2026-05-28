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
  Play
} from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();

  const [enrollments, setEnrollments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [enrollRes, paymentRes] = await Promise.all([
          enrollmentsAPI.getMy(),
          paymentsAPI.getMy()
        ]);

        setEnrollments(enrollRes.data);
        setPayments(paymentRes.data);

        // ✅ Extract course IDs
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

  // ✅ Derived Data
  const approvedEnrollments = enrollments.filter(e => e.payment_status === 'approved');
  const pendingPayments = payments.filter(p => p.status === 'pending');

  // ✅ Next live class
  const nextLiveClass = classes
    .filter(c => c.status === "scheduled")
    .sort((a, b) => {
      const dateA = new Date(`${a.scheduled_date} ${a.start_time}`);
      const dateB = new Date(`${b.scheduled_date} ${b.start_time}`);
      return dateA - dateB;
    })[0] || null;

  // ✅ Helpers
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
      <StudentSidebar />
      
      <main className="ml-64 p-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-secondary">
            Welcome back, {user?.full_name?.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Continue your learning journey
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <BookOpen className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{approvedEnrollments.length}</p>
                <p className="text-sm text-muted-foreground">Active Courses</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{pendingPayments.length}</p>
                <p className="text-sm text-muted-foreground">Pending Payments</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{enrollments.length}</p>
                <p className="text-sm text-muted-foreground">Total Enrollments</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Courses */}
        <Card className="mb-8">
          <CardHeader className="flex justify-between">
            <CardTitle>My Courses</CardTitle>
            <Link to="/dashboard/courses">
              <Button variant="ghost">View All</Button>
            </Link>
          </CardHeader>

          <CardContent>
            {loading ? (
              <p>Loading...</p>
            ) : approvedEnrollments.length > 0 ? (
              approvedEnrollments.slice(0, 3).map(enrollment => (
                <div key={enrollment.id} className="flex justify-between items-center mb-4">
                  <div>
                    <p>{enrollment.course_title}</p>
                    <small>{enrollment.completed_lessons?.length || 0} lessons</small>
                  </div>

                  <Link to={`/dashboard/learn/${enrollment.course_id}`}>
                    <Button size="sm">
                      <Play className="w-4 h-4 mr-1" />
                      Continue
                    </Button>
                  </Link>
                </div>
              ))
            ) : (
              <p>No courses yet</p>
            )}
          </CardContent>
        </Card>

        {/* Payments */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
          </CardHeader>

          <CardContent>
            {payments.length > 0 ? (
              payments.slice(0, 5).map(payment => (
                <div key={payment.id} className="flex justify-between mb-3">
                  <div>
                    <p>{payment.course_title}</p>
                    <small>{formatPrice(payment.course_price)}</small>
                  </div>
                  {getStatusBadge(payment.status)}
                </div>
              ))
            ) : (
              <p>No payments yet</p>
            )}
          </CardContent>
        </Card>

        {/* Live Class */}
        {nextLiveClass && (
          <div className="bg-red-100 p-4 mt-6 rounded">
            <h3 className="font-bold">🔴 Upcoming Live Class</h3>
            <p>{nextLiveClass.title}</p>

            <a 
              href={nextLiveClass.meeting_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
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