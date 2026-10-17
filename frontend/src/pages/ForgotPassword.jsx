import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Mail, Loader2, GraduationCap } from 'lucide-react';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Card, CardContent, CardHeader,
  CardTitle, CardDescription
} from '../components/ui/card';

const API_URL = (
  process.env.REACT_APP_BACKEND_URL ||
  'https://newlms-zgva.onrender.com'
).replace(/\/$/, '');

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API_URL}/api/auth/forgot-password`, {
        email: email.trim()
      });

      setSubmitted(true);
      toast.success('Request received.');
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
        'Unable to process your request. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        <Link to="/" className="flex items-center justify-center gap-3 mb-8">
          <GraduationCap className="w-10 h-10 text-primary" />
          <span className="font-serif font-bold text-2xl">
            Orbal LMS
          </span>
        </Link>

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <Mail className="w-12 h-12 text-primary mx-auto mb-3" />
            <CardTitle>Forgot Password?</CardTitle>
            <CardDescription>
              Enter your registered email address to request a password reset.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {submitted ? (
              <div className="space-y-4 text-center">
                <p>
                  If an account exists for this email address,
                  you will receive a password reset link.
                </p>
                <Link to="/login" className="text-primary hover:underline">
                  Back to Login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your registered email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>

                <div className="text-center">
                  <Link to="/login" className="text-primary hover:underline">
                    Back to Login
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
