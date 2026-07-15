import React, { useState, useEffect } from 'react';
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
import { Clock, BookOpen, Search } from 'lucide-react';

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { fx, fxLoading } = useLocalCurrency();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await coursesAPI.getAll();
        setCourses(response.data);
      } catch (error) {
        console.error('Failed to fetch courses:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.short_description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              Explore our carefully curated courses designed to help you succeed in your career
            </p>
          </div>
        </div>
      </section>

      {/* Search & Filter */}
      <section className="py-8 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="course-search-input"
              />
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
              <p className="text-muted-foreground text-sm">
                {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} available
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
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="h-48 bg-muted animate-pulse" />
                  <CardContent className="p-6">
                    <div className="h-6 bg-muted rounded animate-pulse mb-2" />
                    <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredCourses.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCourses.map((course) => (
                <Card key={course.id} className="overflow-hidden card-hover group" data-testid={`course-card-${course.id}`}>
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={course.image_url || 'https://images.unsplash.com/photo-1665586510291-ae722d1d1f00?crop=entropy&cs=srgb&fm=jpg&q=85'}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
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
                      <Button className="w-full rounded-full" data-testid={`view-course-${course.id}-btn`}>
                        View Details
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-serif text-xl font-bold text-secondary mb-2">No Courses Found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Try adjusting your search terms' : 'Check back soon for new courses!'}
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
