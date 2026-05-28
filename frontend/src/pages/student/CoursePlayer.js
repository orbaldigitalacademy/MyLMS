import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import StudentSidebar from '../../components/StudentSidebar';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Checkbox } from '../../components/ui/checkbox';
import { coursesAPI, lessonsAPI, enrollmentsAPI } from '../../services/api';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Play, 
  CheckCircle, 
  Lock,
  ChevronRight
} from 'lucide-react';

const CoursePlayer = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check access first
        const accessRes = await enrollmentsAPI.checkAccess(courseId);
        if (!accessRes.data.has_access) {
          toast.error('You do not have access to this course');
          navigate('/dashboard/courses');
          return;
        }
        setHasAccess(true);

        const [courseRes, lessonsRes, enrollmentsRes] = await Promise.all([
          coursesAPI.getOne(courseId),
          lessonsAPI.getByCourse(courseId),
          enrollmentsAPI.getMy()
        ]);

        setCourse(courseRes.data);
        setLessons(lessonsRes.data);

        const enrollment = enrollmentsRes.data.find(e => e.course_id === courseId);
        if (enrollment) {
          setCompletedLessons(enrollment.completed_lessons || []);
        }

        // Set first lesson as current
        if (lessonsRes.data.length > 0) {
          setCurrentLesson(lessonsRes.data[0]);
        }
      } catch (error) {
        console.error('Failed to fetch course:', error);
        toast.error('Failed to load course');
        navigate('/dashboard/courses');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [courseId, navigate]);

  const handleLessonComplete = async (lessonId, completed) => {
    try {
      const response = await enrollmentsAPI.updateProgress(courseId, {
        lesson_id: lessonId,
        completed
      });
      setCompletedLessons(response.data.completed_lessons);
      if (completed) {
        toast.success('Lesson marked as complete!');
      }
    } catch (error) {
      console.error('Failed to update progress:', error);
      toast.error('Failed to update progress');
    }
  };

  const progressPercentage = lessons.length > 0 
    ? Math.round((completedLessons.length / lessons.length) * 100) 
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <StudentSidebar />
        <main className="ml-64 p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
        </main>
      </div>
    );
  }

  if (!hasAccess || !course) return null;

  return (
    <div className="min-h-screen bg-background">
      <StudentSidebar />
      
      <main className="ml-64" data-testid="course-player">
        {/* Header */}
        <div className="bg-secondary p-6">
          <Link to="/dashboard/courses" className="inline-flex items-center text-white/70 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Courses
          </Link>
          <h1 className="font-serif text-2xl font-bold text-white">{course.title}</h1>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-white/70 mb-2">
              <span>Progress</span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-0">
          {/* Video Player */}
          <div className="lg:col-span-2 p-6">
            {currentLesson ? (
              <div>
                <div className="video-container bg-black rounded-lg overflow-hidden mb-6">
                  {currentLesson.video_url ? (
                    <video 
                      key={currentLesson.id}
                      controls 
                      className="w-full"
                      poster="https://images.unsplash.com/photo-1665586510291-ae722d1d1f00?crop=entropy&cs=srgb&fm=jpg&q=85"
                    >
                      <source src={currentLesson.video_url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                      <p className="text-muted-foreground">Video coming soon</p>
                    </div>
                  )}
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-serif text-xl font-bold text-secondary mb-2">
                      {currentLesson.title}
                    </h2>
                    <p className="text-muted-foreground">{currentLesson.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="complete"
                      checked={completedLessons.includes(currentLesson.id)}
                      onCheckedChange={(checked) => handleLessonComplete(currentLesson.id, checked)}
                    />
                    <label htmlFor="complete" className="text-sm font-medium cursor-pointer">
                      Mark as complete
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <Play className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No lessons available yet</p>
              </div>
            )}
          </div>

          {/* Lesson List */}
          <div className="border-l border-border bg-card">
            <div className="p-4 border-b border-border">
              <h3 className="font-serif font-bold text-secondary">Course Content</h3>
              <p className="text-sm text-muted-foreground">
                {completedLessons.length} of {lessons.length} completed
              </p>
            </div>
            <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
              {lessons.map((lesson, index) => {
                const isCompleted = completedLessons.includes(lesson.id);
                const isCurrent = currentLesson?.id === lesson.id;
                
                return (
                  <button
                    key={lesson.id}
                    onClick={() => setCurrentLesson(lesson)}
                    className={`w-full text-left p-4 border-b border-border/50 hover:bg-muted/50 transition-colors ${
                      isCurrent ? 'bg-primary/10 border-l-4 border-l-primary' : ''
                    }`}
                    data-testid={`lesson-${lesson.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isCompleted ? 'bg-green-100' : 'bg-muted'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <span className="text-sm font-medium text-muted-foreground">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm truncate ${
                          isCurrent ? 'text-primary' : 'text-secondary'
                        }`}>
                          {lesson.title}
                        </p>
                      </div>
                      {isCurrent && <ChevronRight className="w-4 h-4 text-primary" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CoursePlayer;
