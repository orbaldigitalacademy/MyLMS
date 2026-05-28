import React, { useEffect, useState } from "react";
import axios from "axios";

const QuizPage = ({ courseId, token }) => {
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  useEffect(() => {
    axios.get(`/api/courses/${courseId}/quiz`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setQuiz(res.data));
  }, []);

  useEffect(() => {
  const handleTabSwitch = () => {
    alert("Tab switching detected! Quiz will be submitted.");
    submitQuiz();
  };

  window.addEventListener("blur", handleTabSwitch);

  return () => window.removeEventListener("blur", handleTabSwitch);
}, []);

  const handleSelect = (qid, option) => {
    setAnswers({ ...answers, [qid]: option });
  }; 

  const submitQuiz = async () => {
    const res = await axios.post("/api/quiz/submit", {
      quiz_id: quiz.id,
      answers
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    setResult(res.data);
  };

  if (!quiz) return <p>Loading...</p>;

  return (
    <div>
      <h2>{quiz.title}</h2>

      {quiz.questions.map(q => (
        <div key={q.id}>
          <h4>{q.question}</h4>
          {q.options.map(opt => (
            <button key={opt} onClick={() => handleSelect(q.id, opt)}>
              {opt}
            </button>
          ))}
        </div>
      ))}

      <button onClick={submitQuiz}>Submit</button>

      {result && (
        <div>
          <h3>Score: {result.score}%</h3>
          <p>{result.passed ? "✅ Passed" : "❌ Failed"}</p>
        </div>
      )}
    </div>
  );
};

export default QuizPage;