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
  const [phase, setPhase] = useState("loading"); // loading | active | submitting | finished | error
  const [error, setError] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [saveStatus, setSaveStatus] = useState("saved");

  const mountedRef = useRef(false);
  const deadlineRef = useRef(0);
  const sessionRef = useRef(null);
  const answersRef = useRef({});
  const saveQueueRef = useRef(Promise.resolve());
  const saveErrorsRef = useRef(false);
  const submittingRef = useRef(false);
  const phaseRef = useRef("loading");

  const setExamPhase = useCallback((next) => {
    phaseRef.current = next;
    if (mountedRef.current) setPhase(next);
  }, []);

  const recoverResult = useCallback(async () => {
    const { data } = await quizzesAPI.getMyAttempts(quizId);
    if (!mountedRef.current || !Array.isArray(data) || !data.length) return false;
    // This is a fallback for a timed-out/submitted session. The newest attempt is first.
    const latest = data[0];
    setResult({
      score: latest.score,
      passed: latest.passed,
      timed_out: !!latest.timed_out,
      attempts_remaining: null,
      passing_score: null,
    });
    setExamPhase("finished");
    return true;
  }, [quizId, setExamPhase]);

  const loadExam = useCallback(async () => {
    if (!quizId || !token) {
      setError(!token ? "You must log in to access this assessment." : "Invalid quiz ID.");
      setExamPhase("error");
      return;
    }
    setError("");
    setExamPhase("loading");
    try {
      const { data } = await quizzesAPI.getOne(quizId);
      if (!mountedRef.current) return;
      if (!data.session_id || !data.deadline_at || !data.server_time) {
        throw new Error("The timed examination backend is not deployed or returned an incomplete session.");
      }
      sessionRef.current = data.session_id;
      const saved = data.saved_answers || {};
      answersRef.current = saved;
      setAnswers(saved);
      setQuiz(data);
      saveQueueRef.current = Promise.resolve();
      saveErrorsRef.current = false;
      setSaveStatus("saved");
      const serverNow = Date.parse(data.server_time);
      const deadline = Date.parse(data.deadline_at);
      if (!Number.isFinite(serverNow) || !Number.isFinite(deadline)) {
        throw new Error("Invalid server timer response.");
      }
      // Offset from the server's current time rather than trusting the client's wall clock.
      deadlineRef.current = Date.now() + Math.max(0, deadline - serverNow);
      setSecondsLeft(Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000)));
      setExamPhase("active");
    } catch (err) {
      if (!mountedRef.current) return;
      const status = err.response?.status;
      if ([403, 409, 410].includes(status)) {
        try {
          if (await recoverResult()) return;
        } catch (_ignored) { /* display original error */ }
      }
      setError(err.response?.data?.detail || err.message || "Unable to load assessment.");
      setExamPhase("error");
    }
  }, [quizId, token, recoverResult, setExamPhase]);

  useEffect(() => {
    mountedRef.current = true;
    loadExam();
    return () => { mountedRef.current = false; };
  }, [loadExam]);

  const saveAnswer = useCallback((questionId, value) => {
    if (phaseRef.current !== "active" || !sessionRef.current || submittingRef.current) return;
    answersRef.current = { ...answersRef.current, [questionId]: value };
    setAnswers(answersRef.current);
    setSaveStatus("saving");
    const sessionId = sessionRef.current;
    // Serial requests: an earlier response can't overwrite a later choice.
    saveQueueRef.current = saveQueueRef.current.then(async () => {
      await quizzesAPI.saveAnswer(quizId, {
        session_id: sessionId,
        question_id: questionId,
        answer: value,
      });
    }).then(() => {
      if (mountedRef.current && phaseRef.current === "active" && !saveErrorsRef.current) {
        setSaveStatus("saved");
      }
    }).catch((err) => {
      saveErrorsRef.current = true;
      if (mountedRef.current && phaseRef.current === "active") {
        setSaveStatus("error");
        if (err.response?.status !== 410) {
          toast.error("One or more answers could not be saved. Check your connection.");
        }
      }
      // Allow later saves to continue instead of leaving the queue rejected.
    });
  }, [quizId]);

  const submitExam = useCallback(async (timedOut = false) => {
    if (phaseRef.current !== "active" || submittingRef.current || !sessionRef.current) return;
    submittingRef.current = true;
    setExamPhase("submitting");
    try {
      await saveQueueRef.current;
      // After time expires, the server grades only what was saved before the deadline.
      const payload = timedOut ? {} : answersRef.current;
      const { data } = await quizzesAPI.submit(quizId, payload);
      if (!mountedRef.current) return;
      setResult(data);
      setExamPhase("finished");
      if (data.passed) toast.success("Congratulations! You passed the assessment.");
      else toast.error("Assessment submitted. Passing score not reached.");
    } catch (err) {
      if (!mountedRef.current) return;
      if ([403, 409, 410].includes(err.response?.status)) {
        try {
          if (await recoverResult()) return;
        } catch (_ignored) { /* display original submission error */ }
      }
      setError(err.response?.data?.detail || "Unable to submit assessment. Retry or reload.");
      setExamPhase("error");
    } finally {
      submittingRef.current = false;
    }
  }, [quizId, recoverResult, setExamPhase]);

  useEffect(() => {
    if (phase !== "active") return undefined;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) submitExam(true);
    };
    tick();
    const timer = window.setInterval(tick, 500);
    return () => window.clearInterval(timer);
  }, [phase, submitExam]);

  // Warn on navigation away; do not auto-submit on window blur (file dialogs and
  // switching apps can trigger blur). Deadline and attempts are server-enforced.
  useEffect(() => {
    if (phase !== "active") return undefined;
    const beforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [phase]);

  if (phase === "loading") return (
    <div className="min-h-screen flex items-center justify-center">Loading assessment...</div>
  );

  if (phase === "error") return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-4">
        <h2 className="text-xl font-bold text-red-600">Assessment Unavailable</h2>
        <p>{error}</p>
        <button onClick={loadExam} className="px-5 py-2 bg-blue-600 text-white rounded">Reload Assessment</button>
        <button onClick={() => navigate("/dashboard")} className="ml-2 px-5 py-2 border rounded">Dashboard</button>
      </div>
    </div>
  );

  if (phase === "finished") return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow p-6 space-y-3">
        <h1 className="text-2xl font-bold">Assessment Result</h1>
        <p className="text-lg">Score: <strong>{result?.score}%</strong></p>
        {result?.passing_score != null && <p>Passing Score: {result.passing_score}%</p>}
        <p className={result?.passed ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
          {result?.passed ? "Assessment Passed" : "Assessment Failed"}
        </p>
        {result?.timed_out && <p>Your examination time expired. Saved answers were graded.</p>}
        {result?.attempts_remaining != null && <p>Attempts Remaining: {result.attempts_remaining}</p>}
        <button onClick={() => navigate("/dashboard")} className="px-5 py-2 bg-blue-600 text-white rounded">Return to Dashboard</button>
      </div>
    </div>
  );

  const remaining = Math.max(0, secondsLeft);
  const clock = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`;
  const questions = quiz?.questions || [];
  const answered = questions.filter(q => answers[q.id] != null && String(answers[q.id]).trim() !== "").length;
  const disabled = phase !== "active";

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-6">
        <div className="sticky top-0 z-10 bg-white border-b pb-4 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{quiz?.title}</h1>
              <p className="text-gray-600 text-sm">{answered} of {questions.length} answered</p>
              <p className={`text-xs mt-1 ${saveStatus === "error" ? "text-red-600" : "text-gray-500"}`}>
                {saveStatus === "saving" ? "Saving answers..." : saveStatus === "error" ? "Some answers not saved; check connection" : "Answers saved automatically"}
              </p>
            </div>
            <div role="timer" aria-label="Time remaining" className={`text-2xl font-mono font-bold ${remaining <= 300 ? "text-red-600" : "text-blue-700"}`}>
              {clock}
            </div>
          </div>
        </div>
        {questions.map((question, index) => (
          <section key={question.id} className="mb-6 p-4 border rounded-lg">
            <h3 className="font-semibold mb-3">{index + 1}. {question.question}</h3>
            {question.question_type === "short" ? (
              <textarea
                value={answers[question.id] || ""}
                onChange={(e) => saveAnswer(question.id, e.target.value)}
                disabled={disabled}
                className="w-full border rounded p-3"
                placeholder="Type your answer"
                rows={2}
              />
            ) : (
              <div className="space-y-2">
                {(question.options || []).map((option, optionIndex) => (
                  <button key={`${question.id}-${optionIndex}`} type="button"
                    onClick={() => saveAnswer(question.id, option)}
                    disabled={disabled}
                    aria-pressed={answers[question.id] === option}
                    className={`block w-full text-left p-3 border rounded disabled:opacity-70 ${answers[question.id] === option ? "bg-blue-100 border-blue-500" : "hover:bg-gray-50"}`}>
                    {option}
                  </button>
                ))}
              </div>
            )}
          </section>
        ))}
        <button onClick={() => submitExam(false)} disabled={disabled}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50">
          {phase === "submitting" ? "Submitting..." : "Submit Assessment"}
        </button>
        {phase === "submitting" && <p className="text-sm mt-3 text-center">Finalizing and grading your answers...</p>}
      </div>
    </div>
  );
};

export default QuizPage;
