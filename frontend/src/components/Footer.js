import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-secondary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-serif font-bold text-xl">Orbal Academy</span>
            </Link>
            <p className="text-white/70 text-sm mb-4">
              We train and empower learners of diverse background with quality online education and professional skills relevant to today's digital space.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-white/70 hover:text-primary transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-white/70 hover:text-primary transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-white/70 hover:text-primary transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-white/70 hover:text-primary transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif font-bold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/courses" className="text-white/70 hover:text-primary transition-colors text-sm">
                  Browse Courses
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-white/70 hover:text-primary transition-colors text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-white/70 hover:text-primary transition-colors text-sm">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-white/70 hover:text-primary transition-colors text-sm">
                  Student Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-serif font-bold text-lg mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-white/70 hover:text-primary transition-colors text-sm">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 hover:text-primary transition-colors text-sm">
                  Payment Guide
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 hover:text-primary transition-colors text-sm">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 hover:text-primary transition-colors text-sm">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-serif font-bold text-lg mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-0.5" />
                <span className="text-white/70 text-sm">
                  GRA Katsina, Katsina State, Nigeria
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary" />
                <span className="text-white/70 text-sm">+234 803 580 7517</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary" />
                <span className="text-white/70 text-sm">info@orbaldigitals.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-8 text-center">
          <p className="text-white/50 text-sm">
            © {new Date().getFullYear()} Orbal Digitals. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
