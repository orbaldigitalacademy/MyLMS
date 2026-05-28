import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { AuthProvider, useAuth } from './context/AuthContext';


// Pages
import HomePage from './pages/HomePage';
import CoursesPage from './pages/CoursesPage';
import CourseDetailPage from './pages/CourseDetailPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PaymentPage from './pages/PaymentPage';
import TestimonialPage from "./pages/TestimonialPage";

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentCourses from './pages/student/StudentCourses';
import StudentPayments from './pages/student/StudentPayments';
import CoursePlayer from './pages/student/CoursePlayer';
import LiveClassRoomPage from "./pages/student/LiveClassRoomPage";
import StudentLiveClasses from "./pages/student/LiveClassRoomPage";


// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCourses from './pages/admin/AdminCourses';
import AdminLessons from './pages/admin/AdminLessons';
import AdminPayments from './pages/admin/AdminPayments';
import AdminStudents from './pages/admin/AdminStudents';
import AdminMessages from './pages/admin/AdminMessages';
import AdminSettings from './pages/admin/AdminSettings';
import AdminTestimonial from "./pages/admin/AdminTestimonial";
import AdminAnalytics from './pages/admin/AdminAnalytics';
import CreateUser from "./pages/admin/CreateUser";

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Student Route - redirects admins to admin dashboard
const StudentRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/courses" element={<CoursesPage />} />
      <Route path="/courses/:id" element={<CourseDetailPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/testimonials" element={<TestimonialPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/admin/create-user" element={<CreateUser />} />
      
      

      {/* Payment Route - requires auth */}
      <Route path="/payment/:courseId" element={<ProtectedRoute><PaymentPage /></ProtectedRoute> } />

      {/* Student Routes */}
      <Route path="/dashboard" element={<StudentRoute><StudentDashboard /></StudentRoute>} />
      <Route path="/dashboard/courses" element={<StudentRoute><StudentCourses /></StudentRoute>} />
      <Route path="/dashboard/payments" element={<StudentRoute><StudentPayments /></StudentRoute>} />
      <Route path="/dashboard/learn/:courseId" element={<StudentRoute><CoursePlayer /></StudentRoute>} />
      <Route path="/dashboard/live/:classId" element={<LiveClassRoomPage />} />
      <Route path="/student/live-classes" element={<StudentLiveClasses />} />
      <Route path="/live-class/:classId" element={<LiveClassRoomPage />} />

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/courses" element={<ProtectedRoute adminOnly><AdminCourses /></ProtectedRoute>} />
      <Route path="/admin/courses/:courseId/lessons" element={<ProtectedRoute adminOnly><AdminLessons /></ProtectedRoute>} />
      <Route path="/admin/payments" element={<ProtectedRoute adminOnly><AdminPayments /></ProtectedRoute>} />
      <Route path="/admin/students" element={<ProtectedRoute adminOnly><AdminStudents /></ProtectedRoute>} />
      <Route path="/admin/messages" element={<ProtectedRoute adminOnly><AdminMessages /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute adminOnly><AdminSettings /></ProtectedRoute>} />
      <Route path="/admin/testimonials" element={<ProtectedRoute adminOnly> <AdminTestimonial /></ProtectedRoute>} />
      <Route path="/admin/analytics" element={<ProtectedRoute adminOnly> <AdminAnalytics /></ProtectedRoute>} />
      <Route path="/admin/create-user" element={<ProtectedRoute role="admin"><CreateUser /> </ProtectedRoute>}/>
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
