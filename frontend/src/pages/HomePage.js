import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";

import TrustSection from "../components/TrustSection";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

import { coursesAPI } from "../services/api";
import api from "../services/api";

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
        setCourses(response.data.slice(0, 3));
      } catch (error) {
        console.error("Failed to fetch courses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Fetch testimonials
  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const res = await api.get("/testimonials?limit=3");
        setTestimonials(res.data?.data || []);
      } catch (err) {
        console.error("Failed to load testimonials", err);
      }
    };

    fetchTestimonials();
  }, []);

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
      description: "Seamless payment methods.",
    },
    {
      icon: Zap,
      title: "Learn at Your Pace",
      description: "Access course materials anytime, anywhere on any device.",
    },
  ];

  const stats = [
    { value: "1000+", label: "Students Enrolled" },
    { value: "50+", label: "Quality Courses" },
    { value: "95%", label: "Success Rate" },
    { value: "24/7", label: "Support Available" },
  ];

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(price);

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Orbal Digital Academy</title>
        <meta
          name="description"
          content="Orbal Digital Academy - Unlock your potential with quality online courses"
        />
      </Helmet>

      <Navbar />

      {/* HERO SECTION */}
      <section className="relative bg-background overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24 z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">

            <div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                <span className="text-forest-green">Unlock Your </span>
                <span className="text-gold-gradient">Potential</span>
              </h1>

              <p className="text-lg text-muted-foreground mb-8">
                Join thousands of students advancing their careers with expert-led courses.
              </p>

              <div className="flex gap-4 flex-col sm:flex-row">
                <Link to="/courses">
                  <Button size="lg">
                    Browse Courses <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>

                <Link to="/register">
                  <Button size="lg" variant="outline">
                    Get Started Free
                  </Button>
                </Link>
              </div>
            </div>

            <img
              src="/images/hero.png"
              alt="Students learning"
              className="rounded-2xl shadow-xl"
            />
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-secondary py-12">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s, i) => (
            <div key={i}>
              <h2 className="text-3xl font-bold text-primary">{s.value}</h2>
              <p className="text-white/70">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* COURSES */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8">Featured Courses</h2>

          {loading ? (
            <p>Loading courses...</p>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Card key={course.id}>
                  <img
                    src={course.image_url || "/images/hero-desktop.jpg"}
                    alt={course.title}
                    className="h-48 w-full object-cover"
                  />

                  <CardContent className="p-4">
                    <h3 className="font-bold">{course.title}</h3>
                    <p className="text-sm text-gray-500">
                      {course.short_description}
                    </p>

                    <p className="mt-2 font-semibold">
                      {formatPrice(course.price)}
                    </p>

                    <Link to={`/courses/${course.id}`}>
                      <Button className="w-full mt-3">
                        View Details
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10">
            What Our Students Say
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.slice(0, 3).map((t) => (
              <div key={t.id} className="bg-white p-6 rounded shadow">
                <p className="text-yellow-500 mb-2">
                  {"⭐".repeat(t.rating)}
                </p>

                <p className="text-gray-600 mb-3">
                  {t.content}
                </p>

                <p className="font-semibold">
                  {t.user_name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-secondary py-16 text-center text-white">
        <h2 className="text-3xl font-bold mb-4">
          Ready to Start Learning?
        </h2>

        <Link to="/register">
          <Button size="lg">
            Create Free Account
          </Button>
        </Link>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;
