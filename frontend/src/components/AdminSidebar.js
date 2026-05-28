import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  BookOpen, 
  CreditCard, 
  Users, 
  Settings, 
  LogOut,
  GraduationCap,
  MessageSquare,
  FileVideo,
  TrendingUp
} from 'lucide-react';

const AdminSidebar = () => {
  const location = useLocation();
  const { logout, user } = useAuth();

  const links = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { to: '/admin/courses', icon: BookOpen, label: 'Courses' },
    { to: '/admin/payments', icon: CreditCard, label: 'Payments' },
    { to: '/admin/students', icon: Users, label: 'Students' },
    { to: '/admin/messages', icon: MessageSquare, label: 'Messages' },
    { to: '/admin/settings', icon: Settings, label: 'Settings' },
    { to: '/admin/testimonials', icon: FileVideo, label: 'Testimonials' },
    { to: '/admin/analytics', icon: TrendingUp, label: "Analytics"},
    { to: '/admin/create-user', icon: FileVideo, label: "Create User"},
  ];

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="bg-secondary text-white h-screen w-64 fixed left-0 top-0 flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <Link to="/admin" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-lg">Orbal Academy</h1>
            <p className="text-xs text-white/60">Admin Panel</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.to, link.exact);
          return (
            <Link
              key={link.to}
              to={link.to}
              data-testid={`admin-nav-${link.label.toLowerCase()}`}
              className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                active
                  ? 'bg-primary text-primary-foreground font-bold shadow-md'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User & Logout */}
      <div className="p-4 border-t border-white/10">
        <div className="mb-3 px-4">
          <p className="text-sm font-medium">{user?.full_name}</p>
          <p className="text-xs text-white/60">{user?.email}</p>
        </div>
        <button
          onClick={logout}
          data-testid="admin-logout-btn"
          className="flex items-center gap-3 px-4 py-3 rounded-md text-white/70 hover:text-white hover:bg-red-500/20 transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
