import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { coursesAPI, lessonsAPI, enrollmentsAPI, settingsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { 
  Clock, 
  BookOpen, 
  CheckCircle, 
  Play, 
  ArrowLeft, 
  Lock,
  CreditCard
} from 'lucide-react';

const CourseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [enrollment, setEnrollment] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courseRes, lessonsRes] = await Promise.all([
          coursesAPI.getOne(id),
          lessonsAPI.getByCourse(id)
        ]);
        setCourse(courseRes.data);
        setLessons(lessonsRes.data);

        if (isAuthenticated) {
          try {
            const accessRes = await enrollmentsAPI.checkAccess(id);
            setHasAccess(accessRes.data.has_access);
            
            const enrollmentsRes = await enrollmentsAPI.getMy();
            const myEnrollment = enrollmentsRes.data.find(e => e.course_id === id);
            setEnrollment(myEnrollment);
          } catch (error) {
            console.error('Error checking access:', error);
          }
        }
      } catch (error) {
        console.error('Failed to fetch course:', error);
        toast.error('Course not found');
        navigate('/courses');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isAuthenticated, navigate]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleEnrollClick = () => {
    if (!isAuthenticated) {
      toast.info('Please login or register to enroll');
      navigate('/login', { state: { from: `/courses/${id}` } });
      return;
    }
    navigate(`/payment/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Course Header */}
      <section className="bg-secondary py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/courses" className="inline-flex items-center text-white/70 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Courses
          </Link>
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            <div>
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-white mb-4">
                {course.title}
              </h1>
              <p className="text-white/80 text-lg mb-6">
                {course.short_description}
              </p>
              <div className="flex flex-wrap gap-4 text-white/70">
                <span className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  {course.duration}
                </span>
                <span className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  {lessons.length} lessons
                </span>
              </div>
            </div>
            <div className="lg:text-right">
              <div className="inline-block bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <p className="text-white/70 text-sm mb-2">Course Price</p>
                <p className="text-4xl font-bold text-primary price-tag mb-4">
                  {formatPrice(course.price)}
                </p>
                {hasAccess ? (
                  <Link to={`/dashboard/learn/${course.id}`}>
                    <Button size="lg" className="rounded-full px-8 w-full btn-animate" data-testid="start-learning-btn">
                      <Play className="w-5 h-5 mr-2" />
                      Start Learning
                    </Button>
                  </Link>
                ) : enrollment ? (
                  <div className="text-center">
                    <Badge className={`mb-3 ${
                      enrollment.payment_status === 'pending' ? 'badge-pending' :
                      enrollment.payment_status === 'rejected' ? 'badge-rejected' : ''
                    }`}>
                      Payment {enrollment.payment_status}
                    </Badge>
                    <p className="text-white/70 text-sm">
                      {enrollment.payment_status === 'pending' 
                        ? 'Your payment is being verified'
                        : 'Please submit a new payment'}
                    </p>
                  </div>
                ) : (
                  <Button 
                    size="lg" 
                    className="rounded-full px-8 w-full btn-animate" 
                    onClick={handleEnrollClick}
                    data-testid="enroll-now-btn"
                  >
                    <CreditCard className="w-5 h-5 mr-2" />
                    Proceed to Payment
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Course Content */}
      <section className="py-12 bg-background flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="font-serif text-2xl font-bold text-secondary mb-4">
                    About This Course
                  </h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {course.full_description}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Learning Outcomes */}
              {course.learning_outcomes && course.learning_outcomes.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h2 className="font-serif text-2xl font-bold text-secondary mb-4">
                      What You'll Learn
                    </h2>
                    <ul className="grid md:grid-cols-2 gap-3">
                      {course.learning_outcomes.map((outcome, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Curriculum */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="font-serif text-2xl font-bold text-secondary mb-4">
                    Course Curriculum
                  </h2>
                  {lessons.length > 0 ? (
                    <div className="space-y-3">
                      {lessons.map((lesson, index) => (
                        <div 
                          key={lesson.id}
                          className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            {hasAccess ? (
                              <Play className="w-5 h-5 text-primary" />
                            ) : (
                              <Lock className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-secondary">
                              {index + 1}. {lesson.title}
                            </p>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {lesson.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      Curriculum coming soon
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Course Image */}
              <Card className="overflow-hidden">
                <img 
                  src={course.image_url || 'https://images.unsplash.com/photo-1665586510291-ae722d1d1f00?crop=entropy&cs=srgb&fm=jpg&q=85'}
                  alt={course.title}
                  className="w-full h-48 object-cover"
                />
              </Card>

              {/* Course Info */}
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-serif font-bold text-lg text-secondary">Course Details</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration</span>
                      <span className="font-medium">{course.duration}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lessons</span>
                      <span className="font-medium">{lessons.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Access</span>
                      <span className="font-medium">Lifetime</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Certificate</span>
                      <span className="font-medium">Yes</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CourseDetailPage;
