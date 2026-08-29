import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import StudentSidebar from "../../components/StudentSidebar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  BookOpen,
  CreditCard,
  Clock,
  CheckCircle,
  ArrowRight,
  Play,
  Menu,
  X,
  ClipboardCheck,
  GraduationCap,
  Trophy,
  FileText,
  Lock,
  AlertCircle,
} from "lucide-react";
import { enrollmentsAPI, paymentsAPI, liveClassAPI } from "../../services/api";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [enrollments, setEnrollments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [classes, setClasses] = useState([]);

  const [courseAssessments, setCourseAssessments] = useState({});
  const [loadingAssessments, setLoadingAssessments] = useState(false);

  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /*
   * ---------------------------------------------------------
   * FETCH DASHBOARD DATA
   * ---------------------------------------------------------
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [enrollRes, paymentRes] = await Promise.all([
          enrollmentsAPI.getMy(),
          paymentsAPI.getMy(),
        ]);

        const enrollmentData = enrollRes.data || [];
        const paymentData = paymentRes.data || [];

        setEnrollments(enrollmentData);
        setPayments(paymentData);

        /*
         * Fetch live classes for enrolled courses
         */
        const courseIds = enrollmentData.map((e) => e.course_id);

        if (courseIds.length > 0) {
          try {
            const liveRes = await Promise.all(
              courseIds.map((id) => liveClassAPI.getByCourse(id))
            );

            const allClasses = liveRes.flatMap(
              (r) => r?.data || []
            );

            setClasses(allClasses);
          } catch (error) {
            console.error(
              "Failed to fetch live classes:",
              error
            );
            setClasses([]);
          }
        } else {
          setClasses([]);
        }

        /*
         * Fetch quizzes/assessments for enrolled courses
         */
        if (courseIds.length > 0) {
          await fetchCourseAssessments(
            enrollmentData.filter(
              (e) => e.payment_status === "approved"
            )
          );
        }
      } catch (error) {
        console.error(
          "Failed to fetch dashboard data:",
          error
        );
        toast.error("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /*
   * ---------------------------------------------------------
   * FETCH COURSE ASSESSMENTS
   * ---------------------------------------------------------
   */
  const fetchCourseAssessments = async (approvedEnrollments) => {
    setLoadingAssessments(true);

    const assessmentMap = {};

    await Promise.all(
      approvedEnrollments.map(async (enrollment) => {
        const courseId = enrollment.course_id;

        try {
          /*
           * Get quizzes belonging to the course.
           *
           * Expected endpoint:
           * GET /api/courses/{course_id}/quizzes
           */
          const response = await axios.get(
            `/api/courses/${courseId}/quizzes`
          );

          const quizzes = response.data || [];

          const lessonQuizzes = quizzes.filter(
            (quiz) => quiz.quiz_type === "lesson"
          );

          const finalTests = quizzes.filter(
            (quiz) =>
              quiz.quiz_type === "final" ||
              quiz.quiz_type === "test"
          );

          assessmentMap[courseId] = {
            quizzes,
            lessonQuizzes,
            finalTests,
          };
        } catch (error) {
          /*
           * If the course doesn't have quizzes or the endpoint
           * doesn't return anything, don't break the dashboard.
           */
          if (error.response?.status !== 404) {
            console.error(
              `Failed to fetch quizzes for course ${courseId}:`,
              error
            );
          }

          assessmentMap[courseId] = {
            quizzes: [],
            lessonQuizzes: [],
            finalTests: [],
          };
        }
      })
    );

    setCourseAssessments(assessmentMap);
    setLoadingAssessments(false);
  };

  /*
   * ---------------------------------------------------------
   * STATUS HELPERS
   * ---------------------------------------------------------
   */
  const approvedEnrollments = enrollments.filter(
    (e) => e.payment_status === "approved"
  );

  const pendingPayments = payments.filter(
    (p) => p.status === "pending"
  );

  /*
   * ---------------------------------------------------------
   * NEXT LIVE CLASS
   * ---------------------------------------------------------
   */
  const nextLiveClass =
    classes
      .filter((c) => c.status === "scheduled")
      .sort((a, b) => {
        const dateA = new Date(
          `${a.scheduled_date} ${a.start_time}`
        );

        const dateB = new Date(
          `${b.scheduled_date} ${b.start_time}`
        );

        return dateA - dateB;
      })[0] || null;

  /*
   * ---------------------------------------------------------
   * PAYMENT BADGE
   * ---------------------------------------------------------
   */
  const getStatusBadge = (status) => {
    const styles = {
      pending: "badge-pending",
      approved: "badge-approved",
      rejected: "badge-rejected",
    };

    return (
      <Badge className={styles[status] || ""}>
        {status}
      </Badge>
    );
  };

  /*
   * ---------------------------------------------------------
   * PRICE FORMAT
   * ---------------------------------------------------------
   */
  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(price || 0);
  };

  /*
   * ---------------------------------------------------------
   * COURSE PROGRESS
   * ---------------------------------------------------------
   */
  const getProgress = (enrollment) => {
    if (
      typeof enrollment.progress === "number"
    ) {
      return Math.round(enrollment.progress);
    }

    return 0;
  };

  /*
   * ---------------------------------------------------------
   * COURSE COMPLETION
   * ---------------------------------------------------------
   */
  const isCourseCompleted = (enrollment) => {
    return Boolean(enrollment.is_completed);
  };

  /*
   * ---------------------------------------------------------
   * GET COURSE QUIZ DATA
   * ---------------------------------------------------------
   */
  const getAssessmentData = (enrollment) => {
    return (
      courseAssessments[enrollment.course_id] || {
        quizzes: [],
        lessonQuizzes: [],
        finalTests: [],
      }
    );
  };

  /*
   * ---------------------------------------------------------
   * FIND NEXT AVAILABLE ASSESSMENT
   * ---------------------------------------------------------
   */
  const getNextAssessment = (enrollment) => {
    const data = getAssessmentData(enrollment);

    /*
     * If there are lesson quizzes, show the first available
     * lesson quiz.
     */
    if (data.lessonQuizzes.length > 0) {
      return data.lessonQuizzes[0];
    }

    /*
     * Otherwise show the final test if the course lessons
     * have been completed.
     */
    if (
      enrollment.is_completed &&
      data.finalTests.length > 0
    ) {
      return data.finalTests[0];
    }

    return null;
  };

  /*
   * ---------------------------------------------------------
   * CERTIFICATE
   * ---------------------------------------------------------
   */
  const handleCertificate = (courseId) => {
    /*
     * Certificate endpoint already exists in your
     * enrollments router.
     */
    window.open(
      `/api/enrollments/certificate/${courseId}`,
      "_blank"
    );
  };

  /*
   * ---------------------------------------------------------
   * LOADING SCREEN
   * ---------------------------------------------------------
   */
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <StudentSidebar />

        <main className="lg:ml-64 p-8 flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />

            <p className="text-muted-foreground">
              Loading your dashboard...
            </p>
          </div>
        </main>
      </div>
    );
  }

  /*
   * ---------------------------------------------------------
   * DASHBOARD
   * ---------------------------------------------------------
   */
  return (
    <div className="min-h-screen bg-background">

      {/* =====================================================
          MOBILE TOP BAR
      ====================================================== */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-background border-b">

        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
          className="p-2 rounded-md hover:bg-muted"
        >
          <Menu className="w-6 h-6" />
        </button>

        <span className="font-serif font-bold text-lg text-secondary">
          Dashboard
        </span>

        <div className="w-10" />
      </div>

      {/* =====================================================
          MOBILE SIDEBAR
      ====================================================== */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-opacity ${
          sidebarOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >

        <div
          className="absolute inset-0 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />

        <div className="absolute left-0 top-0 h-full w-64 bg-background shadow-xl">

          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
            className="absolute top-3 right-3 p-2 rounded-md hover:bg-muted z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <StudentSidebar />

        </div>
      </div>

      {/* =====================================================
          DESKTOP SIDEBAR
      ====================================================== */}
      <div className="hidden lg:block">
        <StudentSidebar />
      </div>

      {/* =====================================================
          MAIN
      ====================================================== */}
      <main className="lg:ml-64 p-4 sm:p-6 lg:p-8">

        {/* ===================================================
            HEADER
        ==================================================== */}
        <div className="mb-6 sm:mb-8">

          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-secondary">
            Welcome back,{" "}
            {user?.full_name?.split(" ")[0] ||
              user?.name?.split(" ")[0] ||
              "Student"}
            !
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Continue your learning journey
          </p>

        </div>

        {/* ===================================================
            STATS
        ==================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">

          {/* ACTIVE COURSES */}
          <Card>
            <CardContent className="p-4 sm:p-6 flex items-center gap-3 sm:gap-4">

              <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 text-primary shrink-0" />

              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold">
                  {approvedEnrollments.length}
                </p>

                <p className="text-xs sm:text-sm text-muted-foreground">
                  Active Courses
                </p>
              </div>

            </CardContent>
          </Card>

          {/* PENDING PAYMENTS */}
          <Card>
            <CardContent className="p-4 sm:p-6 flex items-center gap-3 sm:gap-4">

              <Clock className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-600 shrink-0" />

              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold">
                  {pendingPayments.length}
                </p>

                <p className="text-xs sm:text-sm text-muted-foreground">
                  Pending Payments
                </p>
              </div>

            </CardContent>
          </Card>

          {/* TOTAL ENROLLMENTS */}
          <Card className="sm:col-span-2 lg:col-span-1">
            <CardContent className="p-4 sm:p-6 flex items-center gap-3 sm:gap-4">

              <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-green-600 shrink-0" />

              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold">
                  {enrollments.length}
                </p>

                <p className="text-xs sm:text-sm text-muted-foreground">
                  Total Enrollments
                </p>
              </div>

            </CardContent>
          </Card>

        </div>

        {/* ===================================================
            MY COURSES
        ==================================================== */}
        <Card className="mb-6 sm:mb-8">

          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">

            <CardTitle className="text-base sm:text-lg">
              My Courses
            </CardTitle>

            <Link to="/dashboard/courses">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>

          </CardHeader>

          <CardContent>

            {approvedEnrollments.length > 0 ? (

              <div className="space-y-5">

                {approvedEnrollments.slice(0, 3).map(
                  (enrollment) => {

                    const progress =
                      getProgress(enrollment);

                    const completed =
                      isCourseCompleted(enrollment);

                    const assessment =
                      getNextAssessment(enrollment);

                    const assessmentData =
                      getAssessmentData(enrollment);

                    return (
                      <div
                        key={enrollment.id}
                        className="border rounded-lg p-4 sm:p-5"
                      >

                        {/* COURSE HEADER */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                          <div className="min-w-0">

                            <div className="flex items-center gap-2">

                              <BookOpen className="w-5 h-5 text-primary shrink-0" />

                              <p className="font-semibold truncate">
                                {enrollment.course_title}
                              </p>

                            </div>

                            <p className="text-sm text-muted-foreground mt-1">
                              {enrollment.completed_lessons?.length || 0}{" "}
                              lessons completed
                            </p>

                          </div>

                          {completed && (
                            <Badge className="bg-green-100 text-green-700 border-green-200">
                              <Trophy className="w-3 h-3 mr-1" />
                              Course Completed
                            </Badge>
                          )}

                        </div>

                        {/* PROGRESS */}
                        <div className="mt-4">

                          <div className="flex justify-between text-sm mb-1">

                            <span className="text-muted-foreground">
                              Course Progress
                            </span>

                            <span className="font-medium">
                              {progress}%
                            </span>

                          </div>

                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">

                            <div
                              className="h-full bg-primary rounded-full transition-all duration-500"
                              style={{
                                width: `${progress}%`,
                              }}
                            />

                          </div>

                        </div>

                        {/* ACTIONS */}
                        <div className="mt-5 flex flex-col gap-3">

                          {/* CONTINUE COURSE */}
                          <Link
                            to={`/dashboard/learn/${enrollment.course_id}`}
                            className="w-full"
                          >
                            <Button className="w-full">

                              <Play className="w-4 h-4 mr-2" />

                              {completed
                                ? "Review Course"
                                : "Continue Learning"}

                              <ArrowRight className="w-4 h-4 ml-auto" />

                            </Button>
                          </Link>

                          {/* =================================================
                              ASSESSMENT SECTION
                          ================================================== */}
                          {!loadingAssessments && (
                            <div className="border rounded-lg p-4 bg-muted/30">

                              <div className="flex items-start gap-3">

                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">

                                  <ClipboardCheck className="w-5 h-5 text-primary" />

                                </div>

                                <div className="flex-1">

                                  <h4 className="font-semibold">
                                    Assessments
                                  </h4>

                                  <p className="text-sm text-muted-foreground mt-1">

                                    {assessmentData.quizzes.length > 0
                                      ? `${assessmentData.quizzes.length} assessment${
                                          assessmentData.quizzes.length > 1
                                            ? "s"
                                            : ""
                                        } available`
                                      : "No assessment available yet"}

                                  </p>

                                </div>

                              </div>

                              {/* LESSON QUIZ */}
                              {assessment &&
                                assessment.quiz_type ===
                                  "lesson" && (
                                  <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-background border rounded-md p-3">

                                    <div className="flex items-center gap-3">

                                      <FileText className="w-5 h-5 text-primary" />

                                      <div>

                                        <p className="font-medium text-sm">
                                          {assessment.title}
                                        </p>

                                        <p className="text-xs text-muted-foreground">
                                          Lesson Quiz
                                        </p>

                                      </div>

                                    </div>

                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        navigate(
                                          `/dashboard/quiz/${assessment.id}`
                                        )
                                      }
                                    >
                                      Take Quiz
                                      <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>

                                  </div>
                                )}

                              {/* FINAL TEST */}
                              {completed &&
                                assessmentData.finalTests
                                  .length > 0 && (
                                  <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-background border rounded-md p-3">

                                    <div className="flex items-center gap-3">

                                      <GraduationCap className="w-5 h-5 text-primary" />

                                      <div>

                                        <p className="font-medium text-sm">
                                          {
                                            assessmentData
                                              .finalTests[0]
                                              .title
                                          }
                                        </p>

                                        <p className="text-xs text-muted-foreground">
                                          Final Course Test
                                        </p>

                                      </div>

                                    </div>

                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        navigate(
                                          `/dashboard/quiz/${assessmentData.finalTests[0].id}`
                                        )
                                      }
                                    >
                                      Take Final Test
                                      <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>

                                  </div>
                                )}

                              {/* NO QUIZ */}
                              {!assessment &&
                                !completed &&
                                assessmentData.quizzes.length ===
                                  0 && (
                                  <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">

                                    <AlertCircle className="w-4 h-4" />

                                    <span>
                                      Complete your lessons to unlock
                                      available assessments.
                                    </span>

                                  </div>
                                )}

                              {/* COURSE COMPLETED BUT NO FINAL TEST */}
                              {completed &&
                                assessmentData.finalTests.length ===
                                  0 && (
                                  <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">

                                    <Lock className="w-4 h-4" />

                                    <span>
                                      Final assessment is not available
                                      yet.
                                    </span>

                                  </div>
                                )}

                            </div>
                          )}

                          {/* CERTIFICATE */}
                          {completed && (
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() =>
                                handleCertificate(
                                  enrollment.course_id
                                )
                              }
                            >

                              <GraduationCap className="w-4 h-4 mr-2" />

                              Download Certificate

                            </Button>
                          )}

                        </div>

                      </div>
                    );
                  }
                )}

              </div>

            ) : (
              <div className="text-center py-10">

                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />

                <p className="text-muted-foreground">
                  You are not enrolled in any courses yet.
                </p>

                <Link
                  to="/dashboard/courses"
                  className="inline-block mt-4"
                >
                  <Button>
                    Browse Courses
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>

              </div>
            )}

          </CardContent>
        </Card>

        {/* ===================================================
            LIVE CLASS
        ==================================================== */}
        {nextLiveClass && (
          <Card className="mb-6 border-red-200">

            <CardContent className="p-4 sm:p-5">

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                <div>

                  <div className="flex items-center gap-2">

                    <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />

                    <h3 className="font-bold">
                      Upcoming Live Class
                    </h3>

                  </div>

                  <p className="font-medium mt-1">
                    {nextLiveClass.title}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {nextLiveClass.scheduled_date}{" "}
                    {nextLiveClass.start_time}
                  </p>

                </div>

                {nextLiveClass.meeting_link && (
                  <a
                    href={nextLiveClass.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="bg-red-600 hover:bg-red-700 w-full sm:w-auto">
                      Join Class
                    </Button>
                  </a>
                )}

              </div>

            </CardContent>

          </Card>
        )}

        {/* ===================================================
            RECENT PAYMENTS
        ==================================================== */}
        <Card>

          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">

              <CreditCard className="w-5 h-5" />

              Recent Payments

            </CardTitle>
          </CardHeader>

          <CardContent>

            {payments.length > 0 ? (

              <div className="space-y-3">

                {payments.slice(0, 5).map(
                  (payment) => (

                    <div
                      key={payment.id}
                      className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 pb-3 border-b last:border-0"
                    >

                      <div className="min-w-0">

                        <p className="font-medium truncate">
                          {payment.course_title}
                        </p>

                        <small className="text-muted-foreground">
                          {formatPrice(
                            payment.course_price
                          )}
                        </small>

                      </div>

                      <div className="self-start sm:self-auto">
                        {getStatusBadge(
                          payment.status
                        )}
                      </div>

                    </div>

                  )
                )}

              </div>

            ) : (

              <p className="text-sm text-muted-foreground">
                No payments yet
              </p>

            )}

          </CardContent>

        </Card>

      </main>

    </div>
  );
};

export default StudentDashboard;
