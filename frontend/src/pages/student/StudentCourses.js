import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StudentSidebar from '../../components/StudentSidebar';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { enrollmentsAPI, liveClassAPI } from '../../services/api';
import { BookOpen, Play, Lock, Clock } from 'lucide-react';

const StudentCourses = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔄 FETCH DATA
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

  // 🎯 STATUS BADGE
  const getStatusBadge = (status) => {
    const styles = {
      pending: 'badge-pending',
      approved: 'badge-approved',
      rejected: 'badge-rejected'
    };
    return <Badge className={styles[status] || ''}>{status}</Badge>;
  };

  // ⏳ COUNTDOWN
  const getTimeLeft = (cls) => {
    const now = new Date();
    const start = new Date(`${cls.scheduled_date}T${cls.start_time}`);
    const diff = Math.floor((start - now) / 60000);

    if (diff <= 0) return "Starting...";
    if (diff < 60) return `${diff} mins`;
    return `${Math.floor(diff / 60)}h ${diff % 60}m`;
  };

  // 🔓 JOIN LOGIC (10 mins before)
  const canJoin = (cls) => {
    const now = new Date();
    const start = new Date(`${cls.scheduled_date}T${cls.start_time}`);
    const diff = (start - now) / 60000;
    return diff <= 10;
  };

  // 📊 FILTERS
  const liveNow = classes.filter(c => c.status === "live");
  const upcoming = classes.filter(c => c.status === "scheduled");

  return (
    <div className="min-h-screen bg-background">
      <StudentSidebar />
      
      <main className="ml-64 p-8">
        
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Courses</h1>
          <p className="text-muted-foreground">
            View and access your enrolled courses
          </p>
        </div>

        {/* LOADING */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <div className="h-40 bg-muted animate-pulse" />
                <CardContent className="p-6">
                  <div className="h-6 bg-muted mb-2 animate-pulse" />
                  <div className="h-4 bg-muted w-1/2 animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>

        ) : enrollments.length > 0 ? (

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map(enrollment => (
              <Card key={enrollment.id} className="overflow-hidden">

                {/* IMAGE */}
                <div className="relative h-40">
                  <img
                    src={enrollment.course_image || 'https://images.unsplash.com/photo-1665586510291-ae722d1d1f00'}
                    alt={enrollment.course_title}
                    className="w-full h-full object-cover"
                  />

                  <div className="absolute top-4 right-4">
                    {getStatusBadge(enrollment.payment_status)}
                  </div>

                  {!enrollment.access_granted && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Lock className="w-8 h-8 text-white" />
                    </div>
                  )}
                </div>

                {/* CONTENT */}
                <CardContent className="p-6">
                  <h3 className="font-bold mb-2">
                    {enrollment.course_title}
                  </h3>

                  <div className="flex items-center gap-2 text-sm mb-4">
                    <Clock className="w-4 h-4" />
                    {enrollment.completed_lessons?.length || 0} lessons completed
                  </div>

                  {enrollment.access_granted ? (
                    <Link to={`/dashboard/learn/${enrollment.course_id}`}>
                      <Button className="w-full">
                        <Play className="w-4 h-4 mr-2" />
                        Continue Learning
                      </Button>
                    </Link>
                  ) : enrollment.payment_status === 'pending' ? (
                    <Button disabled className="w-full">
                      Payment Pending
                    </Button>
                  ) : (
                    <Link to={`/payment/${enrollment.course_id}`}>
                      <Button variant="outline" className="w-full">
                        Retry Payment
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

        ) : (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-bold">No Courses Yet</h3>
            <Link to="/courses">
              <Button>Browse Courses</Button>
            </Link>
          </div>
        )}

        {/* LIVE CLASSES */}
        <h2 className="text-xl font-bold mt-10 mb-4">Live Classes</h2>

        {/* 🔴 LIVE NOW */}
        {liveNow.length > 0 && (
          <div className="mb-6">
            <h3 className="text-red-600 font-semibold mb-2">🔴 Live Now</h3>

            {liveNow.map(cls => (
              <div key={cls._id || cls.id} className="p-4 border rounded bg-red-50 mb-2">
                <h3 className="font-semibold">{cls.title}</h3>

                <Link to={`/dashboard/live/${cls._id || cls.id}`}>
                  <button className="text-green-600 font-bold">
                    🔴 Join Now
                  </button>
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* ⏳ UPCOMING */}
        {upcoming.length > 0 && (
          <div>
            <h3 className="text-yellow-600 font-semibold mb-2">Upcoming</h3>

            {upcoming.slice(0, 3).map(cls => (
              <div key={cls._id || cls.id} className="p-4 border rounded mb-2">
                <h3>{cls.title}</h3>

                <p className="text-sm text-gray-500">
                  {cls.scheduled_date} • {cls.start_time}
                </p>

                <p className="text-yellow-500 text-sm">
                  Starts in: {getTimeLeft(cls)}
                </p>

                {cls.status === "live" || canJoin(cls) ? (
                  <Link to={`/dashboard/live/${cls._id || cls.id}`}>
                    <button className="text-green-600 font-semibold">
                      🔴 Join Now
                    </button>
                  </Link>
                ) : (
                  <span className="text-gray-400 text-sm">
                    Join opens 10 mins before
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
};

export default StudentCourses;