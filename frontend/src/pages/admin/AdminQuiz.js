import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Switch } from '../../components/ui/switch';
import { Badge } from '../../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import { coursesAPI, lessonsAPI, quizzesAPI } from '../../services/api';
import { toast } from 'sonner';
import {
  Plus,
  Trash2,
  ArrowLeft,
  Loader2,
  ClipboardList,
  CheckCircle2,
  X,
  GraduationCap,
  Edit,
  BarChart3,
} from 'lucide-react';

// Simple id generator for questions
const genId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const emptyMcqQuestion = () => ({
  id: genId(),
  type: 'mcq',
  question: '',
  options: ['', ''],
  correctIndex: 0,
});

const trueFalseQuestion = () => ({
  id: genId(),
  type: 'truefalse',
  question: '',
  options: ['True', 'False'],
  correctIndex: 0,
});

const shortQuestion = () => ({
  id: genId(),
  type: 'short',
  question: '',
  correctText: '',
});

const AdminQuiz = () => {
  const [courses, setCourses] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Lessons for the currently selected course in the form
  const [formLessons, setFormLessons] = useState([]);
  const [loadingLessons, setLoadingLessons] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    quiz_type: 'lesson',
    course_id: '',
    lesson_id: '',
    passing_score: 70,
    max_attempts: 3,
    is_published: true,
  });
  const [questions, setQuestions] = useState([emptyMcqQuestion()]);

  // Edit quiz (metadata) dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    passing_score: 70,
    max_attempts: 3,
    is_published: true,
  });
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Attempt insights dialog
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [insightsQuiz, setInsightsQuiz] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [coursesRes, quizzesRes] = await Promise.all([
        coursesAPI.getAll(),
        quizzesAPI.getAll(),
      ]);
      setCourses(coursesRes.data);
      setQuizzes(quizzesRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Load lessons whenever a course is chosen for a lesson quiz
  useEffect(() => {
    const loadLessons = async () => {
      if (!formData.course_id) {
        setFormLessons([]);
        return;
      }
      setLoadingLessons(true);
      try {
        const res = await lessonsAPI.getByCourse(formData.course_id);
        setFormLessons(res.data);
      } catch (error) {
        console.error('Failed to load lessons:', error);
        setFormLessons([]);
      } finally {
        setLoadingLessons(false);
      }
    };
    loadLessons();
  }, [formData.course_id]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      quiz_type: 'lesson',
      course_id: '',
      lesson_id: '',
      passing_score: 70,
      max_attempts: 3,
      is_published: true,
    });
    setQuestions([emptyMcqQuestion()]);
    setFormLessons([]);
  };

  // -------- Question builder handlers --------
  const updateQuestion = (qId, patch) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === qId ? { ...q, ...patch } : q))
    );
  };

  const changeQuestionType = (qId, type) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        if (type === 'truefalse') {
          return { ...q, type, options: ['True', 'False'], correctIndex: 0 };
        }
        if (type === 'short') {
          return { ...q, type, correctText: q.correctText || '' };
        }
        return {
          ...q,
          type,
          options: q.options && q.options.length >= 2 ? q.options : ['', ''],
          correctIndex: 0,
        };
      })
    );
  };

  const updateOption = (qId, index, value) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId
          ? { ...q, options: q.options.map((o, i) => (i === index ? value : o)) }
          : q
      )
    );
  };

  const addOption = (qId) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === qId ? { ...q, options: [...q.options, ''] } : q))
    );
  };

  const removeOption = (qId, index) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        if (q.options.length <= 2) return q;
        const options = q.options.filter((_, i) => i !== index);
        let correctIndex = q.correctIndex;
        if (index === correctIndex) correctIndex = 0;
        else if (index < correctIndex) correctIndex -= 1;
        return { ...q, options, correctIndex };
      })
    );
  };

  const addQuestion = () => setQuestions((prev) => [...prev, emptyMcqQuestion()]);
  const addTrueFalse = () => setQuestions((prev) => [...prev, trueFalseQuestion()]);
  const addShort = () => setQuestions((prev) => [...prev, shortQuestion()]);
  const removeQuestion = (qId) =>
    setQuestions((prev) => (prev.length > 1 ? prev.filter((q) => q.id !== qId) : prev));

  // -------- Submit --------
  const validate = () => {
    if (!formData.title.trim()) return 'Quiz title is required';
    if (!formData.course_id) return 'Please select a course';
    if (formData.quiz_type === 'lesson' && !formData.lesson_id)
      return 'Please select a lesson for a lesson quiz';
    if (questions.length === 0) return 'Add at least one question';
    for (let i = 0; i < questions.length; i += 1) {
      const q = questions[i];
      if (!q.question.trim()) return `Question ${i + 1}: text is required`;
      if (q.type === 'short') {
        if (!q.correctText || !q.correctText.trim())
          return `Question ${i + 1}: enter the correct answer`;
      } else {
        const cleaned = q.options.map((o) => o.trim());
        if (cleaned.some((o) => !o)) return `Question ${i + 1}: options cannot be empty`;
        if (cleaned.length < 2) return `Question ${i + 1}: needs at least 2 options`;
        if (q.correctIndex == null || !cleaned[q.correctIndex])
          return `Question ${i + 1}: select a correct answer`;
      }
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }
    setSubmitting(true);

    const payload = {
      title: formData.title,
      description: formData.description || null,
      quiz_type: formData.quiz_type,
      course_id: formData.course_id,
      lesson_id: formData.quiz_type === 'lesson' ? formData.lesson_id : null,
      passing_score: parseFloat(formData.passing_score),
      max_attempts: parseInt(formData.max_attempts, 10),
      is_published: formData.is_published,
      questions: questions.map((q) => {
        if (q.type === 'short') {
          return {
            id: q.id,
            question: q.question.trim(),
            question_type: 'short',
            options: [],
            correct_answer: q.correctText.trim(),
          };
        }
        const options = q.options.map((o) => o.trim());
        return {
          id: q.id,
          question: q.question.trim(),
          question_type: q.type,
          options,
          correct_answer: options[q.correctIndex],
        };
      }),
    };

    try {
      await quizzesAPI.create(payload);
      toast.success('Quiz created');
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (quizId) => {
    if (!window.confirm('Are you sure you want to delete this quiz? All attempts will be removed.'))
      return;
    try {
      await quizzesAPI.delete(quizId);
      toast.success('Quiz deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete quiz');
    }
  };

  const togglePublish = async (quiz) => {
    try {
      await quizzesAPI.update(quiz.id, { is_published: !quiz.is_published });
      toast.success(quiz.is_published ? 'Quiz unpublished' : 'Quiz published');
      fetchData();
    } catch (error) {
      toast.error('Failed to update quiz');
    }
  };

  const openEdit = (quiz) => {
    setEditingQuiz(quiz);
    setEditForm({
      title: quiz.title,
      description: quiz.description || '',
      passing_score: quiz.passing_score,
      max_attempts: quiz.max_attempts,
      is_published: quiz.is_published,
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.title.trim()) {
      toast.error('Title is required');
      return;
    }
    setEditSubmitting(true);
    try {
      await quizzesAPI.update(editingQuiz.id, {
        title: editForm.title,
        description: editForm.description || null,
        passing_score: parseFloat(editForm.passing_score),
        max_attempts: parseInt(editForm.max_attempts, 10),
        is_published: editForm.is_published,
      });
      toast.success('Quiz updated');
      setEditDialogOpen(false);
      setEditingQuiz(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update quiz');
    } finally {
      setEditSubmitting(false);
    }
  };

  const openInsights = async (quiz) => {
    setInsightsQuiz(quiz);
    setInsightsOpen(true);
    setLoadingAttempts(true);
    setAttempts([]);
    try {
      const res = await quizzesAPI.getAllAttempts(quiz.id);
      setAttempts(res.data);
    } catch (error) {
      toast.error('Failed to load attempts');
    } finally {
      setLoadingAttempts(false);
    }
  };

  const courseTitle = (id) => courses.find((c) => c.id === id)?.title || 'Unknown course';

  const insightTotal = attempts.length;
  const insightPassed = attempts.filter((a) => a.passed).length;
  const insightPassRate = insightTotal ? Math.round((insightPassed / insightTotal) * 100) : 0;
  const insightAvg = insightTotal
    ? Math.round(attempts.reduce((s, a) => s + (a.score || 0), 0) / insightTotal)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminSidebar />
        <main className="ml-64 p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />

      <main className="ml-64 p-8" data-testid="admin-quiz">
        <Link
          to="/admin/courses"
          className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Courses
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl font-bold text-secondary">Quizzes</h1>
            <p className="text-muted-foreground mt-1">
              Create lesson quizzes and final tests for your courses
            </p>
          </div>

          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button className="rounded-full" data-testid="add-quiz-btn">
                <Plus className="w-4 h-4 mr-2" />
                Create Quiz
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-serif">Create New Quiz</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Quiz Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., HTML Basics Quiz"
                    data-testid="quiz-title-input"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Short description of this quiz"
                    rows={2}
                    data-testid="quiz-desc-input"
                  />
                </div>

                {/* Quiz type + Course */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quiz Type</Label>
                    <Select
                      value={formData.quiz_type}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          quiz_type: value,
                          lesson_id: value === 'final' ? '' : formData.lesson_id,
                        })
                      }
                    >
                      <SelectTrigger data-testid="quiz-type-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lesson">Lesson Quiz</SelectItem>
                        <SelectItem value="final">Final Test</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Course</Label>
                    <Select
                      value={formData.course_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, course_id: value, lesson_id: '' })
                      }
                    >
                      <SelectTrigger data-testid="quiz-course-select">
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Lesson (only lesson quiz) */}
                {formData.quiz_type === 'lesson' && (
                  <div className="space-y-2">
                    <Label>Lesson</Label>
                    <Select
                      value={formData.lesson_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, lesson_id: value })
                      }
                      disabled={!formData.course_id || loadingLessons}
                    >
                      <SelectTrigger data-testid="quiz-lesson-select">
                        <SelectValue
                          placeholder={
                            !formData.course_id
                              ? 'Select a course first'
                              : loadingLessons
                              ? 'Loading lessons...'
                              : 'Select lesson'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {formLessons.map((l) => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.order}. {l.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Passing score + Max attempts */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="passing_score">Passing Score (%)</Label>
                    <Input
                      id="passing_score"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.passing_score}
                      onChange={(e) =>
                        setFormData({ ...formData, passing_score: e.target.value })
                      }
                      data-testid="quiz-passing-score-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_attempts">Maximum Attempts</Label>
                    <Input
                      id="max_attempts"
                      type="number"
                      min="1"
                      value={formData.max_attempts}
                      onChange={(e) =>
                        setFormData({ ...formData, max_attempts: e.target.value })
                      }
                      data-testid="quiz-max-attempts-input"
                    />
                  </div>
                </div>

                {/* Publish toggle */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Label htmlFor="publish">Published</Label>
                    <p className="text-xs text-muted-foreground">
                      Published quizzes are visible to students
                    </p>
                  </div>
                  <Switch
                    id="publish"
                    checked={formData.is_published}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_published: checked })
                    }
                    data-testid="quiz-publish-switch"
                  />
                </div>

                {/* Questions builder */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base">Questions</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addQuestion}
                        data-testid="add-mcq-btn"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Multiple Choice
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addTrueFalse}
                        data-testid="add-truefalse-btn"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        True / False
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addShort}
                        data-testid="add-short-btn"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Short Answer
                      </Button>
                    </div>
                  </div>

                  {questions.map((q, qIndex) => (
                    <div
                      key={q.id}
                      className="border rounded-lg p-4 space-y-3 bg-muted/20"
                      data-testid={`question-block-${qIndex}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold text-secondary">
                          Question {qIndex + 1}
                          <Badge variant="secondary" className="ml-2">
                            {q.type === 'short'
                              ? 'Short Answer'
                              : q.type === 'truefalse'
                              ? 'True/False'
                              : 'Multiple Choice'}
                          </Badge>
                        </span>
                        <div className="flex items-center gap-2">
                          <Select
                            value={q.type}
                            onValueChange={(value) => changeQuestionType(q.id, value)}
                          >
                            <SelectTrigger className="h-8 w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mcq">Multiple Choice</SelectItem>
                              <SelectItem value="truefalse">True / False</SelectItem>
                              <SelectItem value="short">Short Answer</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive h-8 w-8"
                            onClick={() => removeQuestion(q.id)}
                            data-testid={`remove-question-${qIndex}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <Input
                        value={q.question}
                        onChange={(e) => updateQuestion(q.id, { question: e.target.value })}
                        placeholder="Enter the question"
                        data-testid={`question-text-${qIndex}`}
                      />

                      {q.type === 'short' ? (
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">
                            Correct answer (matched case-insensitively)
                          </Label>
                          <Input
                            value={q.correctText || ''}
                            onChange={(e) => updateQuestion(q.id, { correctText: e.target.value })}
                            placeholder="Expected answer"
                            data-testid={`short-answer-${qIndex}`}
                          />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">
                            Select the radio button next to the correct answer
                          </p>
                          {q.options.map((opt, oIndex) => (
                            <div key={oIndex} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`correct-${q.id}`}
                                checked={q.correctIndex === oIndex}
                                onChange={() => updateQuestion(q.id, { correctIndex: oIndex })}
                                className="w-4 h-4 accent-primary cursor-pointer"
                                data-testid={`correct-${qIndex}-${oIndex}`}
                              />
                              <Input
                                value={opt}
                                onChange={(e) => updateOption(q.id, oIndex, e.target.value)}
                                placeholder={`Option ${oIndex + 1}`}
                                disabled={q.type === 'truefalse'}
                                data-testid={`option-${qIndex}-${oIndex}`}
                              />
                              {q.type === 'mcq' && q.options.length > 2 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground"
                                  onClick={() => removeOption(q.id, oIndex)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          {q.type === 'mcq' && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => addOption(q.id)}
                              data-testid={`add-option-${qIndex}`}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Add Option
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting} data-testid="save-quiz-btn">
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Create Quiz'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Quizzes list */}
        <Card>
          <CardContent className="p-0">
            {quizzes.length > 0 ? (
              <div className="divide-y divide-border">
                {quizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors"
                    data-testid={`quiz-row-${quiz.id}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      {quiz.quiz_type === 'final' ? (
                        <GraduationCap className="w-5 h-5 text-primary" />
                      ) : (
                        <ClipboardList className="w-5 h-5 text-primary" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-secondary truncate">{quiz.title}</h3>
                        <Badge variant={quiz.quiz_type === 'final' ? 'default' : 'secondary'}>
                          {quiz.quiz_type === 'final' ? 'Final Test' : 'Lesson Quiz'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {courseTitle(quiz.course_id)} · {quiz.questions?.length || 0} questions ·
                        pass {quiz.passing_score}% · {quiz.max_attempts} attempts
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {quiz.is_published ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                          <CheckCircle2 className="w-3 h-3" />
                          Published
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          Draft
                        </span>
                      )}

                      <div className="flex items-center gap-1">
                        <Switch
                          checked={quiz.is_published}
                          onCheckedChange={() => togglePublish(quiz)}
                          data-testid={`toggle-publish-${quiz.id}`}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openInsights(quiz)}
                          data-testid={`insights-quiz-${quiz.id}`}
                        >
                          <BarChart3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(quiz)}
                          data-testid={`edit-quiz-${quiz.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(quiz.id)}
                          className="text-destructive"
                          data-testid={`delete-quiz-${quiz.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <ClipboardList className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-serif text-xl font-bold text-secondary mb-2">
                  No Quizzes Yet
                </h3>
                <p className="text-muted-foreground mb-4">
                  Create lesson quizzes and final tests for your courses
                </p>
                <Button onClick={() => setDialogOpen(true)} className="rounded-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Quiz
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit quiz (metadata) dialog */}
        <Dialog
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) setEditingQuiz(null);
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-serif">Edit Quiz</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  data-testid="edit-quiz-title-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-desc">Description</Label>
                <Textarea
                  id="edit-desc"
                  rows={2}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  data-testid="edit-quiz-desc-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-score">Passing Score (%)</Label>
                  <Input
                    id="edit-score"
                    type="number"
                    min="0"
                    max="100"
                    value={editForm.passing_score}
                    onChange={(e) => setEditForm({ ...editForm, passing_score: e.target.value })}
                    data-testid="edit-quiz-score-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-attempts">Max Attempts</Label>
                  <Input
                    id="edit-attempts"
                    type="number"
                    min="1"
                    value={editForm.max_attempts}
                    onChange={(e) => setEditForm({ ...editForm, max_attempts: e.target.value })}
                    data-testid="edit-quiz-attempts-input"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="edit-publish">Published</Label>
                <Switch
                  id="edit-publish"
                  checked={editForm.is_published}
                  onCheckedChange={(c) => setEditForm({ ...editForm, is_published: c })}
                  data-testid="edit-quiz-publish-switch"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={editSubmitting} data-testid="update-quiz-btn">
                  {editSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Attempt insights dialog */}
        <Dialog open={insightsOpen} onOpenChange={setInsightsOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif">
                Attempt Insights{insightsQuiz ? ` · ${insightsQuiz.title}` : ''}
              </DialogTitle>
            </DialogHeader>
            {loadingAttempts ? (
              <div className="py-10 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4 mt-2" data-testid="insights-content">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-muted/40 text-center">
                    <p className="text-2xl font-bold text-secondary" data-testid="insights-total">
                      {insightTotal}
                    </p>
                    <p className="text-xs text-muted-foreground">Attempts</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40 text-center">
                    <p className="text-2xl font-bold text-green-600" data-testid="insights-passrate">
                      {insightPassRate}%
                    </p>
                    <p className="text-xs text-muted-foreground">Pass Rate</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40 text-center">
                    <p className="text-2xl font-bold text-primary" data-testid="insights-avg">
                      {insightAvg}%
                    </p>
                    <p className="text-xs text-muted-foreground">Avg Score</p>
                  </div>
                </div>
                {insightTotal > 0 ? (
                  <div className="border rounded-lg divide-y">
                    {attempts.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between gap-2 p-3 text-sm"
                      >
                        <span className="font-mono text-xs text-muted-foreground truncate max-w-[150px]">
                          {a.user_id}
                        </span>
                        <span className="font-medium">{a.score}%</span>
                        <Badge variant={a.passed ? 'default' : 'secondary'}>
                          {a.passed ? 'Passed' : 'Failed'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(a.submitted_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-6">No attempts yet</p>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default AdminQuiz;
