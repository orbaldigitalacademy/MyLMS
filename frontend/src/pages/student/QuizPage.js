
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { quizzesAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";

const QuizPage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Prevent duplicate submissions, including rapid tab switches.
  const submittingRef = useRef(false);

  // Fetch quiz
  useEffect(() => {
    let active = true;

    const fetchQuiz = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await quizzesAPI.getOne(quizId);

        if (active) {
          setQuiz(response.data);
        }
      } catch (err) {
        console.error("Failed to load quiz:", err);

        if (active) {
          setError(
            err.response?.data?.detail ||
            "Unable to load quiz. Please try again."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    if (quizId && token) {
      fetchQuiz();
    } else {
      setLoading(false);
      setError(
        !token
          ? "You must log in to access this assessment."
          : "Invalid quiz ID."
      );
    }

    return () => {
      active = false;
    };
  }, [quizId, token]);

  // Submit quiz
  const submitQuiz = useCallback(async () => {
    if (!quiz || isSubmitted || submittingRef.current) {
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      const response = await quizzesAPI.submit(
        quiz.id,
        answers
      );

      setResult(response.data);
      setIsSubmitted(true);

      if (response.data.passed) {
        toast.success("Congratulations! You passed the assessment.");
      } else {
        toast.error("Assessment submitted. Passing score not reached.");
      }
    } catch (err) {
      console.error("Failed to submit quiz:", err);

      toast.error(
        err.response?.data?.detail ||
        "Unable to submit assessment."
      );
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [quiz, answers, isSubmitted]);

  // Detect tab switching
  useEffect(() => {
    const handleTabSwitch = () => {
      if (!quiz || isSubmitted || submittingRef.current) {
        return;
      }

      alert("Tab switching detected! Quiz will be submitted.");
      submitQuiz();
    };

    window.addEventListener("blur", handleTabSwitch);

    return () => {
      window.removeEventListener("blur", handleTabSwitch);
    };
  }, [quiz, submitQuiz, isSubmitted]);

  // Handle answer selection
  const handleAnswer = (questionId, value) => {
    if (isSubmitted || isSubmitting) {
      return;
    }

    setAnswers((previous) => ({
      ...previous,
      [questionId]: value,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading assessment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h2 className="text-xl font-bold text-red-600">
            Unable to Load Assessment
          </h2>

          <p className="mt-3 text-gray-600">{error}</p>

          <button
            onClick={() => navigate("/dashboard")}
            className="mt-4 px-5 py-2 bg-blue-600 text-white rounded"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return <p>Assessment not found.</p>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-6">

        <h1 className="text-2xl font-bold mb-3">
          {quiz.title}
        </h1>

        <p className="text-gray-600 mb-6">
          Answer all questions and submit your assessment.
        </p>

        {quiz.questions.map((question, index) => (
          <div
            key={question.id}
            className="mb-6 p-4 border rounded-lg"
          >
            <h3 className="font-semibold mb-3">
              {index + 1}. {question.question}
            </h3>

            {question.question_type === "short" ? (
              <input
                type="text"
                value={answers[question.id] || ""}
                onChange={(e) =>
                  handleAnswer(question.id, e.target.value)
                }
                disabled={isSubmitted || isSubmitting}
                placeholder="Type your answer"
                className="w-full border rounded p-3"
              />
            ) : (
              <div className="space-y-2">
                {(question.options || []).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() =>
                      handleAnswer(question.id, option)
                    }
                    disabled={isSubmitted || isSubmitting}
                    className={`block w-full text-left p-3 border rounded ${
                      answers[question.id] === option
                        ? "bg-blue-100 border-blue-500"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {!isSubmitted && (
          <button
            onClick={submitQuiz}
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            {isSubmitting
              ? "Submitting..."
              : "Submit Assessment"}
          </button>
        )}

        {result && (
          <div className="mt-6 p-5 bg-gray-100 rounded-lg">
            <h2 className="text-xl font-bold mb-2">
              Assessment Result
            </h2>

            <p className="text-lg">
              Score: <strong>{result.score}%</strong>
            </p>

            <p>
              Passing Score: {result.passing_score}%
            </p>

            <p className={`font-bold mt-2 ${
              result.passed
                ? "text-green-600"
                : "text-red-600"
            }`}>
              {result.passed
                ? "Assessment Passed"
                : "Assessment Failed"}
            </p>

            <p className="mt-2 text-sm">
              Attempts Remaining: {result.attempts_remaining}
            </p>

            <button
              onClick={() => navigate("/dashboard")}
              className="mt-4 px-5 py-2 bg-blue-600 text-white rounded"
            >
              Return to Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default QuizPage;
