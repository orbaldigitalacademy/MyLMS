import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import axios from "axios";
import TrustSection from "../components/TrustSection";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { coursesAPI } from "../services/api";


import {
  GraduationCap,
  BookOpen,
  TrendingUp,
  Shield,
  Zap,
  Clock,
  ArrowRight,
} from "lucide-react";

const HomePage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testimonials, setTestimonials] = useState([]);

  // Fetch courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await coursesAPI.getAll();
        setCourses(response.data.slice(0, 3)); // Show top 3 featured courses
      } catch (error) {
        console.error("Failed to fetch courses:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const res = await axios.get(`${API}/testimonials?limit=3`);
      setTestimonials(res.data?.data || []);
    } catch (err) {
      console.error("Failed to load testimonials", err);
    }
  };

  // Benefits section
  const benefits = [
    {
      icon: BookOpen,
      title: "Quality Content",
      description:
        "Expert-crafted courses designed for both beginners, professionals and students.",
    },
    {
      icon: TrendingUp,
      title: "Career Growth",
      description: "Gain practical skills that employers are actively seeking.",
    },
    {
      icon: Shield,
      title: "Secure Payments",
      description:
        "Seemless payment methods.",
    },
    {
      icon: Zap,
      title: "Learn at Your Pace",
      description:
        "Access course materials anytime, anywhere on any device.",
    },
  ];

  // Stats section
  const stats = [
    { value: "1000+", label: "Students Enrolled" },
    { value: "50+", label: "Quality Courses" },
    { value: "95%", label: "Success Rate" },
    { value: "24/7", label: "Support Available" },
  ];

  // Format price
  const formatPrice = (price) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(price);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Meta tags */}
      <Helmet>
        <title>Orbal Digital Academy</title>
        <meta
          name="description"
          content="Orbal Digital Academy - Unlock your potential with quality online courses"
        />
      </Helmet>

      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-background overflow-hidden">
        {/* Background texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "url(/images/bg-texture.jpeg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            mixBlendMode: "multiply",
            opacity: 0.03,
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <div className="animate-fade-in">
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                <span className="text-forest-green">Unlock Your </span>
                <span className="text-gold-gradient">Potentials</span>
                <span className="text-forest-green"> With Digital Education</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Join thousands of students advancing their careers with
                expert-led courses. Learn practical skills that matter in
                today's digital job market.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/courses">
                  <Button
                    size="lg"
                    className="rounded-full px-8 py-6 font-bold shadow-lg btn-animate w-full sm:w-auto"
                  >
                    Browse Courses
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/register">
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full px-8 py-6 font-bold border-2 w-full sm:w-auto"
                  >
                    Get Started Free
                  </Button>
                </Link>
              </div>
            </div>

            {/* Hero Images */}
            <div className="relative">
              {/* Desktop */}
              <img
                src="/images/hero-desktop.jpg"
                alt="Students learning"
                className="hidden md:block w-full h-[400px] object-cover rounded-2xl shadow-2xl"
                loading="lazy"
              />
              {/* Mobile */}
              <img
                src="/images/hero-mobile.jpg"
                alt="Students learning"
                className="md:hidden w-full h-[300px] object-cover rounded-2xl shadow-2xl"
                loading="lazy"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-secondary/60 to-transparent pointer-events-none" />
              {/* CTA overlay */}
              <div className="absolute bottom-6 left-6 right-6">
                <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <GraduationCap className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-secondary">Start Learning Today</p>
                      <p className="text-sm text-muted-foreground">
                        No prior experience needed
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-secondary py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="font-serif text-3xl md:text-4xl font-bold text-primary mb-2">
                  {stat.value}
                </p>
                <p className="text-white/70 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-secondary mb-4">
              Why Choose Orbal Digital Academy?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We provide everything you need to succeed in your learning journey
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b, i) => {
              const Icon = b.icon;
              return (
                <Card key={i} className="card-hover border-border/60">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="font-serif font-bold text-lg text-secondary mb-2">
                      {b.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">{b.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-secondary mb-2">
                Featured Courses
              </h2>
              <p className="text-muted-foreground">
                Start learning with our most popular courses
              </p>
            </div>
            <Link to="/courses" className="mt-4 md:mt-0">
              <Button variant="outline" className="rounded-full">
                View All Courses
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="h-48 bg-muted animate-pulse" />
                  <CardContent className="p-6">
                    <div className="h-6 bg-muted rounded animate-pulse mb-2" />
                    <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : courses.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses.map((course) => (
                <Card
                  key={course.id}
                  className="overflow-hidden card-hover group"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={
                        course.image_url ||
                        "/images/hero-desktop.jpg"
                      }
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-bold">
                      {formatPrice(course.price)}
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="font-serif font-bold text-xl text-secondary mb-2 line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {course.short_description}
                    </p>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {course.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {course.lesson_count || 0} lessons
                      </span>
                    </div>
                    <Link to={`/courses/${course.id}`}>
                      <Button className="w-full rounded-full">
                        View Details
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No courses available yet. Check back soon!
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="py-16 bg-gray-50">

        <h2 className="text-3xl font-bold text-center mb-10">
          What Our Students Say
        </h2>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">

          {testimonials.slice(0,3).map(t => (
        <div key={t.id} className="bg-white p-6 rounded shadow">

        <p className="text-yellow-500 mb-2">
          {"⭐".repeat(t.rating)}
        </p>

        <p className="text-gray-600 mb-3">
          "{t.content}"
        </p>

        <p className="font-semibold">
          {t.user_name}
        </p>

      </div>

      ))}

      </div>

      </section>

      {/* CTA Section */}
      <section className="bg-secondary py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Start Your Learning Journey?
          </h2>
          <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of students who are already advancing their careers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="rounded-full px-8 py-6 font-bold shadow-lg btn-animate">
                Create Free Account
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/courses">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8 py-6 font-bold border-2 border-white/30 text-white hover:bg-white/10"
              >
                Browse Courses
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;
