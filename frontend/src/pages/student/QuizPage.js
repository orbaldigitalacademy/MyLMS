import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

const QuizPage = ({ token }) => {
  const { quizId } = useParams();

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Fetch quiz
 useEffect(() => {
  const fetchQuiz = async () => {
    try {
      const res = await axios.get(`/api/quizzes/${quizId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setQuiz(res.data);
    } catch (error) {
      console.error("Failed to load quiz:", error);
    }
  };

  if (quizId && token) {
    fetchQuiz();
  }
}, [quizId, token]);
  // Submit quiz
  const submitQuiz = useCallback(async () => {
    // Prevent submission if quiz hasn't loaded
    if (!quiz) {
      console.warn("Quiz is not loaded yet.");
      return;
    }

    // Prevent multiple submissions
    if (isSubmitted) {
      return;
    }

    try {
      const res = await axios.post(
        "/api/quiz/submit",
        {
          quiz_id: quiz.id,
          answers,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setResult(res.data);
      setIsSubmitted(true);
    } catch (error) {
      console.error("Failed to submit quiz:", error);
    }
  }, [quiz, answers, token, isSubmitted]);

  // Detect tab switching
  useEffect(() => {
    const handleTabSwitch = () => {
      if (!quiz || isSubmitted) {
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
  const handleSelect = (qid, option) => {
    if (isSubmitted) {
      return;
    }

    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [qid]: option,
    }));
  };

  if (!quiz) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <h2>{quiz.title}</h2>

      {quiz.questions.map((q) => (
        <div key={q.id}>
          <h4>{q.question}</h4>

          {q.options.map((opt) => (
            <button
              key={opt}
              onClick={() => handleSelect(q.id, opt)}
              disabled={isSubmitted}
            >
              {opt}
            </button>
          ))}
        </div>
      ))}

      <button onClick={submitQuiz} disabled={isSubmitted}>
        {isSubmitted ? "Quiz Submitted" : "Submit"}
      </button>

      {result && (
        <div>
          <h3>Score: {result.score}%</h3>

          <p>
            {result.passed ? "✅ Passed" : "❌ Failed"}
          </p>
        </div>
      )}
    </div>
  );
};

export default QuizPage;
