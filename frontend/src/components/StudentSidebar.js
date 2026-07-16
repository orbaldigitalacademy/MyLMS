import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  BookOpen, 
  CreditCard,
  LogOut,
  GraduationCap
} from 'lucide-react';

const StudentSidebar = ({ onNavigate }) => {
  const location = useLocation();
  const { logout, user } = useAuth();

  const links = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { to: '/dashboard/courses', icon: BookOpen, label: 'My Courses' },
    { to: '/dashboard/payments', icon: CreditCard, label: 'Payments' },
  ];

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const handleNavClick = () => {
    if (typeof onNavigate === 'function') onNavigate();
  };

  return (
    <aside
      className="
        bg-secondary text-white flex flex-col
        h-full w-full
        lg:h-screen lg:w-64 lg:fixed lg:left-0 lg:top-0 lg:z-50
      "
      data-testid="student-sidebar"
    >
      {/* Logo */}
      <div className="p-5 sm:p-6 border-b border-white/10">
        <Link
          to="/"
          onClick={handleNavClick}
          className="flex items-center gap-3"
          data-testid="sidebar-logo-link"
        >
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h3 className="font-serif font-bold text-base sm:text-lg truncate">
              Orbal Academy
            </h3>
            <p className="text-xs text-white/60 truncate">Student Portal</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 sm:p-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.to, link.exact);
          return (
            <Link
              key={link.to}
              to={link.to}
              onClick={handleNavClick}
              data-testid={`student-nav-${link.label.toLowerCase().replace(' ', '-')}`}
              className={`flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-md transition-colors text-sm sm:text-base ${
                active
                  ? 'bg-primary text-primary-foreground font-bold shadow-md'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="truncate">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Browse Courses Link */}
      <div className="px-3 sm:px-4 mb-3 sm:mb-4">
        <Link
          to="/courses"
          onClick={handleNavClick}
          data-testid="sidebar-browse-courses-link"
          className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-primary/20 rounded-md text-primary hover:bg-primary/30 transition-colors"
        >
          <BookOpen className="w-4 h-4 shrink-0" />
          <span className="text-sm font-medium">Browse All Courses</span>
        </Link>
      </div>

      {/* User & Logout */}
      <div className="p-3 sm:p-4 border-t border-white/10">
        <div className="mb-3 px-2 sm:px-4 min-w-0">
          <p className="text-sm font-medium truncate">{user?.full_name}</p>
          <p className="text-xs text-white/60 truncate">{user?.email}</p>
        </div>
        <button
          onClick={() => {
            handleNavClick();
            logout();
          }}
          data-testid="student-logout-btn"
          className="flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-md text-white/70 hover:text-white hover:bg-red-500/20 transition-colors w-full text-sm sm:text-base"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default StudentSidebar;
