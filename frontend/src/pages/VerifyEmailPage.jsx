import React, { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import api from "../services/api";
import {
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState(
    "Verifying your email address..."
  );

  const token = searchParams.get("token");
  const requestedNext = searchParams.get("next");

  const safeNext =
    requestedNext &&
    requestedNext.startsWith("/") &&
    !requestedNext.startsWith("//")
      ? requestedNext
      : "/dashboard";

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus("error");
        setMessage("The verification token is missing.");
        return;
      }

      try {
        const response = await api.get(
          "/auth/verify-email",
          {
            params: { token },
          }
        );

        const accessToken = response.data?.access_token;
        const user = response.data?.user;

        if (accessToken) {
          localStorage.setItem("token", accessToken);
        }

        if (user) {
          localStorage.setItem(
            "user",
            JSON.stringify(user)
          );
        }

        setStatus("success");
        setMessage(
          response.data?.message ||
            "Your email has been verified successfully."
        );

        // Redirect back to the original course after a short delay.
        setTimeout(() => {
          navigate(safeNext, {
            replace: true,
          });
        }, 2000);
      } catch (error) {
        console.error(
          "Email verification error:",
          error
        );

        const detail = error.response?.data?.detail;

        setStatus("error");

        if (Array.isArray(detail)) {
          setMessage(
            detail[0]?.msg ||
              "The verification request could not be processed."
          );
        } else if (typeof detail === "string") {
          setMessage(detail);
        } else if (!error.response) {
          setMessage(
            "Unable to connect to the verification server."
          );
        } else {
          setMessage(
            "The verification link is invalid or has expired."
          );
        }
      }
    };

    verifyEmail();
  }, [token, safeNext, navigate]);

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
            <>
              <p className="text-sm text-muted-foreground">
                Redirecting you shortly...
              </p>

              <Button
                className="w-full"
                onClick={() =>
                  navigate(safeNext, {
                    replace: true,
                  })
                }
              >
                Continue
              </Button>
            </>
          )}

          {status === "error" && (
            <Link
              to={`/login?next=${encodeURIComponent(
                safeNext
              )}`}
            >
              <Button
                variant="outline"
                className="w-full"
              >
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
