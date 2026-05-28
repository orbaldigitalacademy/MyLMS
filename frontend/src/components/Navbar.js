import React, { useState } from 'react'; 
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Menu, X, User, LogOut, LayoutDashboard } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const location = useLocation();

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/courses', label: 'Courses' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
    { to: '/testimonials', label: 'Testimonials' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 md:px-8 py-2">
        {/* Logo + Brand Text */}
        <div className="flex items-center gap-2">
          <div className="w-15 h-15 rounded-full bg-primary flex items-center justify-center overflow-hidden">
            <img
              src="/images/logo.jpg"
              alt="Orbal Digital Academy Logo"
              className="w-12 h-12 object-contain"
            />
          </div>
          <span className="text-lg font-bold text-primary hidden sm:inline">
            Orbal Digital Academy
          </span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              data-testid={`nav-${link.label.toLowerCase()}`}
              className={`text-sm font-medium transition-colors ${
                isActive(link.to)
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2" data-testid="user-menu-btn">
                  <User className="w-4 h-4" />
                  <span className="max-w-32 truncate">{user?.full_name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link
                    to={isAdmin ? '/admin' : '/dashboard'}
                    className="flex items-center gap-2"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="text-red-600 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" data-testid="login-btn">Login</Button>
              </Link>
              <Link to="/register">
                <Button className="rounded-full px-6 btn-animate" data-testid="register-btn">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          data-testid="mobile-menu-btn"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden py-4 border-t border-border/50 animate-fade-in">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2 rounded-md transition-colors ${
                  isActive(link.to)
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {link.label}
              </Link>
            ))}

            <div className="border-t border-border/50 mt-2 pt-2">
              {isAuthenticated ? (
                <>
                  <Link
                    to={isAdmin ? '/admin' : '/dashboard'}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-2 rounded-md text-muted-foreground hover:bg-muted flex items-center gap-2"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="px-4 py-2 rounded-md text-red-600 hover:bg-red-50 flex items-center gap-2 w-full text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-2 rounded-md text-muted-foreground hover:bg-muted block"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 block mt-2 text-center font-medium"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;