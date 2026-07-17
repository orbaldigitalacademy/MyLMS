import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CurrencySelector from '../components/CurrencySelector';

import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';

import { coursesAPI } from '../services/api';
import { useLocalCurrency } from '../context/CurrencyContext';
import { formatLocalPrice } from '../lib/currency';

import {
  BookOpen,
  CalendarDays,
  Clock,
  MapPin,
  Search,
  Timer,
} from 'lucide-react';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1665586510291-ae722d1d1f00?crop=entropy&cs=srgb&fm=jpg&q=85';

/**
 * Convert a date string such as 2026-08-15 into a readable date.
 * Parsing the date parts manually avoids timezone-related date changes.
 */
const formatStartDate = (dateValue) => {
  if (!dateValue) return '';

  try {
    const [year, month, day] = dateValue.split('-').map(Number);

    if (!year || !month || !day) {
      return dateValue;
    }

    const date = new Date(year, month - 1, day);

    return new Intl.DateTimeFormat('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateValue;
  }
};

/**
 * Convert 24-hour time, such as 18:00, into 6:00 PM.
 */
const formatClassTime = (timeValue) => {
  if (!timeValue) return '';

  try {
    const [hours, minutes] = timeValue.split(':').map(Number);

    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes) ||
      hours < 0 ||
      hours > 23
    ) {
      return timeValue;
    }

    const date = new Date();
    date.setHours(hours, minutes || 0, 0, 0);

    return new Intl.DateTimeFormat('en-NG', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return timeValue;
  }
};

/**
 * Format the selected class days.
 */
const formatClassDays = (classDays) => {
  if (!Array.isArray(classDays) || classDays.length === 0) {
    return '';
  }

  return classDays.join(', ');
};

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const { fx, fxLoading } = useLocalCurrency();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);

        const response = await coursesAPI.getAll();

        setCourses(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Failed to fetch courses:', error);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const filteredCourses = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return courses;
    }

    return courses.filter((course) => {
      const title = course?.title?.toLowerCase() || '';
      const description =
        course?.short_description?.toLowerCase() || '';
      const venue = course?.venue?.toLowerCase() || '';
      const classDays = Array.isArray(course?.class_days)
        ? course.class_days.join(' ').toLowerCase()
        : '';

      return (
        title.includes(normalizedSearch) ||
        description.includes(normalizedSearch) ||
        venue.includes(normalizedSearch) ||
        classDays.includes(normalizedSearch)
      );
    });
  }, [courses, searchTerm]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Header */}
      <section className="bg-secondary py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mb-4">
              Our Courses
            </h1>

            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              Explore our carefully curated courses designed to help you
              succeed in your career.
            </p>
          </div>
        </div>
      </section>

      {/* Search and currency selector */}
      <section className="py-8 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />

              <Input
                type="text"
                placeholder="Search courses, days or venue..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="course-search-input"
              />
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
              <p className="text-muted-foreground text-sm">
                {filteredCourses.length}{' '}
                course{filteredCourses.length !== 1 ? 's' : ''} available
              </p>

              <CurrencySelector
                variant="compact"
                testId="courses-currency-selector"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Course Grid */}
      <section className="py-12 bg-background flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <Card key={item} className="overflow-hidden">
                  <div className="h-48 bg-muted animate-pulse" />

                  <CardContent className="p-6">
                    <div className="h-6 bg-muted rounded animate-pulse mb-2" />
                    <div className="h-4 bg-muted rounded animate-pulse w-3/4 mb-5" />

                    <div className="space-y-3">
                      <div className="h-4 bg-muted rounded animate-pulse" />
                      <div className="h-4 bg-muted rounded animate-pulse w-4/5" />
                      <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredCourses.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCourses.map((course) => {
                const startDate = formatStartDate(course.start_date);
                const classDays = formatClassDays(course.class_days);
                const classTime = formatClassTime(course.class_time);

                const hasSchedule =
                  startDate ||
                  classDays ||
                  classTime ||
                  course.class_duration ||
                  course.venue;

                return (
                  <Card
                    key={course.id}
                    className="overflow-hidden card-hover group flex flex-col"
                    data-testid={`course-card-${course.id}`}
                  >
                    {/* Course image */}
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={course.image_url || FALLBACK_IMAGE}
                        alt={course.title || 'Course'}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.src = FALLBACK_IMAGE;
                        }}
                      />

                      {/* Price */}
                      <div
                        className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-bold price-tag min-w-[70px] text-center"
                        data-testid={`course-price-${course.id}`}
                      >
                        {fxLoading ? (
                          <Skeleton className="h-4 w-16 bg-white/30" />
                        ) : (
                          formatLocalPrice(course.price, fx)
                        )}
                      </div>
                    </div>

                    <CardContent className="p-6 flex flex-col flex-1">
                      {/* Course title */}
                      <h3 className="font-serif font-bold text-xl text-secondary mb-2 line-clamp-2">
                        {course.title}
                      </h3>

                      {/* Short description */}
                      <p className="text-muted-foreground text-sm mb-5 line-clamp-2">
                        {course.short_description}
                      </p>

                      {/* General course information */}
                      <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground mb-5">
                        <span className="flex items-center gap-2">
                          <Clock className="w-4 h-4 shrink-0 text-primary" />
                          <span>{course.duration || 'Not specified'}</span>
                        </span>

                        <span className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 shrink-0 text-primary" />

                          <span>
                            {course.lesson_count || 0}{' '}
                            lesson{course.lesson_count === 1 ? '' : 's'}
                          </span>
                        </span>
                      </div>

                      {/* Class schedule */}
                      {hasSchedule && (
                        <div className="border-t border-border pt-4 mb-5">
                          <p className="text-xs font-semibold uppercase tracking-wide text-secondary mb-3">
                            Class Schedule
                          </p>

                          <div className="space-y-2.5 text-sm text-muted-foreground">
                            {startDate && (
                              <div className="flex items-start gap-2">
                                <CalendarDays className="w-4 h-4 mt-0.5 shrink-0 text-primary" />

                                <div>
                                  <span className="font-medium text-secondary">
                                    Starts:
                                  </span>{' '}
                                  {startDate}
                                </div>
                              </div>
                            )}

                            {classDays && (
                              <div className="flex items-start gap-2">
                                <CalendarDays className="w-4 h-4 mt-0.5 shrink-0 text-primary" />

                                <div>
                                  <span className="font-medium text-secondary">
                                    Days:
                                  </span>{' '}
                                  {classDays}
                                </div>
                              </div>
                            )}

                            {classTime && (
                              <div className="flex items-start gap-2">
                                <Clock className="w-4 h-4 mt-0.5 shrink-0 text-primary" />

                                <div>
                                  <span className="font-medium text-secondary">
                                    Time:
                                  </span>{' '}
                                  {classTime}
                                </div>
                              </div>
                            )}

                            {course.class_duration && (
                              <div className="flex items-start gap-2">
                                <Timer className="w-4 h-4 mt-0.5 shrink-0 text-primary" />

                                <div>
                                  <span className="font-medium text-secondary">
                                    Class duration:
                                  </span>{' '}
                                  {course.class_duration}
                                </div>
                              </div>
                            )}

                            {course.venue && (
                              <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-primary" />

                                <div className="break-words">
                                  <span className="font-medium text-secondary">
                                    Venue:
                                  </span>{' '}
                                  {course.venue}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* View details */}
                      <div className="mt-auto">
                        <Link to={`/courses/${course.id}`}>
                          <Button
                            className="w-full rounded-full"
                            data-testid={`view-course-${course.id}-btn`}
                          >
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />

              <h3 className="font-serif text-xl font-bold text-secondary mb-2">
                No Courses Found
              </h3>

              <p className="text-muted-foreground">
                {searchTerm
                  ? 'Try adjusting your search terms.'
                  : 'Check back soon for new courses!'}
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CoursesPage;
