import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState(
    "Verifying your email address..."
  );

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setStatus("error");
        setMessage("The verification token is missing.");
        return;
      }

      try {
        const response = await axios.get(
          `${API_URL}/api/auth/verify-email`,
          {
            params: { token },
          }
        );

        setStatus("success");
        setMessage(
          response.data?.message ||
            "Your email has been verified successfully."
        );
      } catch (error) {
        console.error("Email verification error:", error);

        setStatus("error");
        setMessage(
          error.response?.data?.detail ||
            "The verification link is invalid or has expired."
        );
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader>
          <CardTitle>Email Verification</CardTitle>

          <CardDescription>
            Orbal Digital Academy
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {status === "loading" && (
            <Loader2 className="w-14 h-14 mx-auto animate-spin text-primary" />
          )}

          {status === "success" && (
            <CheckCircle className="w-14 h-14 mx-auto text-green-600" />
          )}

          {status === "error" && (
            <XCircle className="w-14 h-14 mx-auto text-red-600" />
          )}

          <p className="text-muted-foreground">
            {message}
          </p>

          {status === "success" && (
            <Link to="/login">
              <Button className="w-full">
                Continue to Login
              </Button>
            </Link>
          )}

          {status === "error" && (
            <Link to="/login">
              <Button variant="outline" className="w-full">
                Go to Login
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmailPage;
