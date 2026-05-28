import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import { coursesAPI, lessonsAPI, uploadAPI } from '../../services/api';
import { toast } from 'sonner';
import { 
  Plus, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Loader2,
  Video,
  GripVertical,
  Play
} from 'lucide-react';

const AdminLessons = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_url: '',
    order: 1
  });
  const [submitting, setSubmitting] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const fetchData = useCallback(async () => {
  try {
    const [courseRes, lessonsRes] = await Promise.all([
      coursesAPI.getOne(courseId),
      lessonsAPI.getByCourse(courseId)
    ]);

    setCourse(courseRes.data);
    setLessons(lessonsRes.data);
  } catch (error) {
    console.error('Failed to fetch data:', error);
    toast.error('Failed to load course');
  } finally {
    setLoading(false);
  }
}, [courseId]);

useEffect(() => {
  fetchData();
}, [fetchData]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      video_url: '',
      order: lessons.length + 1
    });
    setEditingLesson(null);
  };

  const openEditDialog = (lesson) => {
    setEditingLesson(lesson);
    setFormData({
      title: lesson.title,
      description: lesson.description,
      video_url: lesson.video_url || '',
      order: lesson.order
    });
    setDialogOpen(true);
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      toast.error('Video must be less than 100MB');
      return;
    }

    setUploadingVideo(true);
    try {
      const response = await uploadAPI.video(file);
      setFormData({ ...formData, video_url: response.data.url });
      toast.success('Video uploaded');
    } catch (error) {
      toast.error('Failed to upload video');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const lessonData = {
      course_id: courseId,
      title: formData.title,
      description: formData.description,
      video_url: formData.video_url || null,
      order: parseInt(formData.order)
    };

    try {
      if (editingLesson) {
        await lessonsAPI.update(editingLesson.id, lessonData);
        toast.success('Lesson updated');
      } else {
        await lessonsAPI.create(lessonData);
        toast.success('Lesson created');
      }
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save lesson');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (lessonId) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;

    try {
      await lessonsAPI.delete(lessonId);
      toast.success('Lesson deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete lesson');
    }
  };

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
      
      <main className="ml-64 p-8" data-testid="admin-lessons">
        <Link to="/admin/courses" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Courses
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl font-bold text-secondary">
              {course?.title || 'Course'} - Lessons
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage lessons for this course
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="rounded-full" data-testid="add-lesson-btn">
                <Plus className="w-4 h-4 mr-2" />
                Add Lesson
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle className="font-serif">
                  {editingLesson ? 'Edit Lesson' : 'Create New Lesson'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Lesson Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Introduction to HTML"
                    required
                    data-testid="lesson-title-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="What will students learn in this lesson?"
                    rows={3}
                    required
                    data-testid="lesson-desc-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="order">Order</Label>
                  <Input
                    id="order"
                    type="number"
                    min="1"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                    required
                    data-testid="lesson-order-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Lesson Video</Label>
                  <div className="space-y-2">
                    {formData.video_url && (
                      <div className="flex items-center gap-2 p-2 bg-muted rounded">
                        <Play className="w-4 h-4 text-primary" />
                        <span className="text-sm truncate flex-1">{formData.video_url}</span>
                      </div>
                    )}
                    <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                      {uploadingVideo ? (
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      ) : (
                        <Video className="w-5 h-5 text-muted-foreground" />
                      )}
                      <span className="text-sm text-muted-foreground">
                        {uploadingVideo ? 'Uploading video...' : 'Click to upload video (MP4, max 100MB)'}
                      </span>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoUpload}
                        className="hidden"
                        disabled={uploadingVideo}
                      />
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting || uploadingVideo} data-testid="save-lesson-btn">
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : editingLesson ? 'Update Lesson' : 'Create Lesson'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Lessons List */}
        <Card>
          <CardContent className="p-0">
            {lessons.length > 0 ? (
              <div className="divide-y divide-border">
                {lessons.map((lesson, index) => (
                  <div key={lesson.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-bold text-primary">{lesson.order}</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-secondary">{lesson.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">{lesson.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {lesson.video_url ? (
                        <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                          Video uploaded
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">No video</span>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(lesson)} data-testid={`edit-lesson-${lesson.id}`}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(lesson.id)} className="text-destructive" data-testid={`delete-lesson-${lesson.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Video className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-serif text-xl font-bold text-secondary mb-2">No Lessons Yet</h3>
                <p className="text-muted-foreground mb-4">Add lessons to start building your course</p>
                <Button onClick={() => setDialogOpen(true)} className="rounded-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Lesson
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminLessons;
