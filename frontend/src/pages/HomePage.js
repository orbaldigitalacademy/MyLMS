import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

import { coursesAPI } from "../services/api";
import api from "../services/api";

import {
  BookOpen,
  TrendingUp,
  Shield,
  Zap,
  ArrowRight,
} from "lucide-react";

const HomePage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testimonials, setTestimonials] = useState([]);
  const [activeHeroImage, setActiveHeroImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveHeroImage((prev) => (prev + 1) % 3);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

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
    }).format(price || 0);

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Orbal Digital Academy</title>
        <meta
          name="description"
          content="Orbal Digital Academy - Unlock your potentials with quality digital courses"
        />
      </Helmet>

      <Navbar />

      {/* HERO SECTION */}
      <section className="relative bg-background overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24 z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                <span className="text-forest-green">
                  Unlock Your Potentials{" "}
                </span>
                <span className="text-gold-gradient">
                  with Our Practical Oriented Courses
                </span>
              </h1>

              <p className="text-lg text-muted-foreground mb-8">
                Join thousands of students advancing their careers with
                expert-led courses.
              </p>

              <div className="flex gap-4 flex-col sm:flex-row">
                <Link to="/register">
                  <Button size="lg">
                    Get Started Now!
                  </Button>
                </Link>
              </div>
            </div>

            {/* Sliding hero image */}
            <div className="relative w-full h-[420px] rounded-2xl overflow-hidden shadow-xl">
              {[
                "/images/heroo.png",
                "/images/hero-desktop.jpg",
                "/images/hero.png",
              ].map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Orbal Digital Academy hero ${index + 1}`}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                    index === activeHeroImage ? "opacity-100" : "opacity-0"
                  }`}
                />
              ))}
            </div>
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
            <>
              <div className="grid md:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <Card key={course.id}>
                    <img
                      src={course.image_url || "/images/hero.png"}
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
                        <Button className="w-full mt-3">View Details</Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-center mt-10">
                <Link to="/courses">
                  <Button size="lg">
                    Browse More Courses <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10">
            What Our Students Say
          </h2>
      
          {testimonials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <div
                  key={t.id}
                  className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition duration-300"
                >
                  {/* Student Info */}
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={t.avatar_url || "/default-avatar.png"}
                      alt={t.user_name || "Student"}
                      className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = "/default-avatar.png";
                      }}
                    />
      
                    <div>
                      <h4 className="font-semibold text-lg">
                        {t.user_name || "Anonymous Student"}
                      </h4>
      
                      <div
                        className="text-yellow-500 text-sm"
                        aria-label={`${t.rating || 0} out of 5 stars`}
                      >
                        {"⭐".repeat(t.rating || 0)}
                      </div>
                    </div>
                  </div>
      
                  {/* Testimonial */}
                  <p className="text-gray-600 leading-relaxed">
                    “{t.content}”
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">
              No testimonials are available yet.
            </p>
          )}
        </div>
      </section>
      {/* CTA */}
      <section className="bg-secondary py-16 text-center text-white">
        <h2 className="text-3xl font-bold mb-4">Ready to Start Learning?</h2>

        <Link to="/register">
          <Button size="lg">Create Free Account</Button>
        </Link>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;
