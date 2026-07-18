import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Card, CardContent } from '../components/ui/card';
import { Target, Eye, Users, Award, BookOpen, Heart } from 'lucide-react';
import studentsImage from '../assets/student-learning.png';


const AboutPage = () => {
  const values = [
    {
      icon: BookOpen,
      title: 'Quality Contents',
      description: 'We provide world-class educational content tailored to diverse learners across the globe.'
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Building a supportive community of learners who grow together.'
    },
    {
      icon: Award,
      title: 'Excellence',
      description: 'Committed to delivering excellence in every course and interaction.'
    },
    {
      icon: Heart,
      title: 'Accessibility',
      description: 'Making quality digital education accessible to everyone across the globe.'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="bg-secondary py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mb-4">
            About Orbal Digital Academy
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Empowering students, career switchers, and professionals worldwide with high-quality online and offline learning experiences.
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-serif text-3xl font-bold text-secondary mb-6">Our Story</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Orbal Digital Academy was founded with a simple yet powerful mission: to make quality digital education 
                  accessible to every citizens of the world, regardless of location or background.
                </p>
                <p>
                  We understand the unique challenges faced by some learners, particularly Africans - from unreliable 
                  internet connectivity to limited access to international payment methods. That's 
                  why we've built a platform that works for you, with local payment options and 
                  content optimized for this context.
                </p>
                <p>
                  Our courses are designed by industry experts who understand the global job 
                  market and the skills employers are looking for. Whether you're looking to 
                  advance your career, switch fields, or learn something new, we have a course 
                  for you.
                </p>
              </div>
            </div>
            <div className="relative">
              <img 
                src={studentsImage}
                alt="Students learning"
                className="rounded-2xl shadow-xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-primary text-primary-foreground p-6 rounded-xl shadow-lg">
                <p className="font-serif text-3xl font-bold">1000+</p>
                <p className="text-sm">Happy Students</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="card-hover">
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Target className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-secondary mb-4">Our Mission</h3>
                <p className="text-muted-foreground">
                  At Orbal Digital Academy, our mission is to empower individuals with 
                  cutting-edge skills and knowledge in emerging feilds like Data Science, Data Analytics, Data Engineering, 
                  Artificial Intelligence, Web Development, Cyber Security, Cloud Computing, Digital Marketing and others. We are committed to providing high-quality, accessible, and practical online education that bridges the gap between theoretical learning and real-world application. Our goal is to foster a community of lifelong learners and innovators who are equipped to tackle the challenges of tomorrow's digital landscape.
                </p>
              </CardContent>
            </Card>
            <Card className="card-hover">
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Eye className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-secondary mb-4">Our Vision</h3>
                <p className="text-muted-foreground">
                  To take a lead in technology education globally, inspiring and nurturing the next generation of tech professionals and experts. 
                  We aspire to create a transformative learning environment that cultivates creativity, innovation, and excellence. 
                  By continually evolving our curriculum and embracing emerging technologies, we aim to prepare our students to become influential leaders and problem-solvers in the rapidly changing digital world.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl font-bold text-secondary mb-4">Our Values</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              These core values guide everything we do at Orbal Digital Academy
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <Card key={index} className="card-hover text-center">
                  <CardContent className="p-6">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="font-serif font-bold text-lg text-secondary mb-2">{value.title}</h3>
                    <p className="text-muted-foreground text-sm">{value.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl font-bold text-white mb-4">Our Team</h2>
          <p className="text-white/70 max-w-2xl mx-auto mb-8">
            We're a passionate team of educators, technologists, and industry experts 
            dedicated to transforming education in Nigeria.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Dorcas Kr', role: 'CEO & Founder', image: './images/doo.jpeg' },
              { name: 'Kor Moses', role: 'Head of Training', image: './images/hero.png' },
              { name: 'Abutu Gabriel', role: 'Student Success Lead', image: './images/Abu.png' }
            ].map((member, index) => (
              <div key={index} className="bg-white/10 rounded-xl p-6">
                <img 
                  src={member.image}
                  alt={member.name}
                  className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                />
                <h3 className="font-serif font-bold text-white">{member.name}</h3>
                <p className="text-white/70 text-sm">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutPage;
