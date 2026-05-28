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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';

import { coursesAPI, uploadAPI } from '../../services/api';

import { toast } from 'sonner';

import {
  Plus,
  Edit,
  Trash2,
  BookOpen,
  Loader2,
  Image,
  FileVideo,
} from 'lucide-react';

const INITIAL_FORM_STATE = {
  title: '',
  short_description: '',
  full_description: '',
  learning_outcomes: '',
  duration: '',
  price: '',
  video_url: '',
  image_url: '',
};

const FALLBACK_IMAGE = '/placeholder-course.jpg';

const AdminCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = useCallback(async () => {
    setLoading(true);

    try {
      const response = await coursesAPI.getAll(false);

      setCourses(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(Number(price || 0));
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM_STATE);
    setEditingCourse(null);
  };

  const handleDialogChange = (open) => {
    setDialogOpen(open);

    if (!open) {
      resetForm();
    }
  };

  const openEditDialog = (course) => {
    setEditingCourse(course);

    setFormData({
      title: course.title || '',
      short_description: course.short_description || '',
      full_description: course.full_description || '',
      learning_outcomes:
        course.learning_outcomes?.join('\n') || '',
      duration: course.duration || '',
      price: course.price?.toString() || '',
      video_url: course.video_url || '',
      image_url: course.image_url || '',
    });

    setDialogOpen(true);
  };

  const validateImage = (file) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image');
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return false;
    }

    return true;
  };

  const validateVideo = (file) => {
    if (!file.type.startsWith('video/')) {
      toast.error('Please upload a valid video');
      return false;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast.error('Video must be less than 100MB');
      return false;
    }

    return true;
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!validateImage(file)) return;

    setUploadingImage(true);

    try {
      const response = await uploadAPI.image(file);

      setFormData((prev) => ({
        ...prev,
        image_url: response.data.url,
      }));

      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Image upload failed:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!validateVideo(file)) return;

    setUploadingVideo(true);

    try {
      const response = await uploadAPI.video(file);

      setFormData((prev) => ({
        ...prev,
        video_url: response.data.url,
      }));

      toast.success('Video uploaded successfully');
    } catch (error) {
      console.error('Video upload failed:', error);
      toast.error('Failed to upload video');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.price || isNaN(Number(formData.price))) {
      toast.error('Please enter a valid price');
      return;
    }

    setSubmitting(true);

    const courseData = {
      title: formData.title.trim(),
      short_description: formData.short_description.trim(),
      full_description: formData.full_description.trim(),

      learning_outcomes: formData.learning_outcomes
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),

      duration: formData.duration.trim(),

      price: Number(formData.price),

      video_url: formData.video_url || null,
      image_url: formData.image_url || null,
    };

    try {
      if (editingCourse) {
        const response = await coursesAPI.update(
          editingCourse.id,
          courseData
        );

        setCourses((prev) =>
          prev.map((course) =>
            course.id === editingCourse.id
              ? response.data
              : course
          )
        );

        toast.success('Course updated successfully');
      } else {
        const response = await coursesAPI.create(courseData);

        setCourses((prev) => [response.data, ...prev]);

        toast.success('Course created successfully');
      }

      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Save failed:', error);

      toast.error(
        error?.response?.data?.detail ||
          'Failed to save course'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (courseId) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this course?'
    );

    if (!confirmed) return;

    try {
      await coursesAPI.delete(courseId);

      setCourses((prev) =>
        prev.filter((course) => course.id !== courseId)
      );

      toast.success('Course deleted successfully');
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete course');
    }
  };

  const handlePublishToggle = async (course) => {
    const updatedPublishState = !course.is_published;

    try {
      await coursesAPI.update(course.id, {
        is_published: updatedPublishState,
      });

      setCourses((prev) =>
        prev.map((item) =>
          item.id === course.id
            ? {
                ...item,
                is_published: updatedPublishState,
              }
            : item
        )
      );

      toast.success(
        updatedPublishState
          ? 'Course published'
          : 'Course unpublished'
      );
    } catch (error) {
      console.error('Publish toggle failed:', error);
      toast.error('Failed to update course');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />

      <main
        className="ml-64 p-8"
        data-testid="admin-courses"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl font-bold text-secondary">
              Courses
            </h1>

            <p className="text-muted-foreground mt-1">
              Manage your course catalog
            </p>
          </div>

          <Dialog
            open={dialogOpen}
            onOpenChange={handleDialogChange}
          >
            <DialogTrigger asChild>
              <Button
                className="rounded-full"
                data-testid="add-course-btn"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Course
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-serif">
                  {editingCourse
                    ? 'Edit Course'
                    : 'Create New Course'}
                </DialogTitle>
              </DialogHeader>

              <form
                onSubmit={handleSubmit}
                className="space-y-4 mt-4"
              >
                {/* TITLE */}
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Course Title
                  </Label>

                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="e.g. Web Development Fundamentals"
                    required
                  />
                </div>

                {/* SHORT DESCRIPTION */}
                <div className="space-y-2">
                  <Label htmlFor="short_description">
                    Short Description
                  </Label>

                  <Input
                    id="short_description"
                    value={formData.short_description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        short_description:
                          e.target.value,
                      }))
                    }
                    placeholder="Brief course overview"
                    required
                  />
                </div>

                {/* FULL DESCRIPTION */}
                <div className="space-y-2">
                  <Label htmlFor="full_description">
                    Full Description
                  </Label>

                  <Textarea
                    id="full_description"
                    rows={5}
                    value={formData.full_description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        full_description:
                          e.target.value,
                      }))
                    }
                    placeholder="Detailed course description"
                    required
                  />
                </div>

                {/* LEARNING OUTCOMES */}
                <div className="space-y-2">
                  <Label htmlFor="learning_outcomes">
                    Learning Outcomes
                  </Label>

                  <Textarea
                    id="learning_outcomes"
                    rows={4}
                    value={formData.learning_outcomes}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        learning_outcomes:
                          e.target.value,
                      }))
                    }
                    placeholder={`Build responsive websites
Understand HTML, CSS & JavaScript
Deploy applications`}
                  />
                </div>

                {/* DURATION + PRICE */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">
                      Duration
                    </Label>

                    <Input
                      id="duration"
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          duration: e.target.value,
                        }))
                      }
                      placeholder="e.g. 8 weeks"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">
                      Price (₦)
                    </Label>

                    <Input
                      id="price"
                      type="number"
                      min="0"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          price: e.target.value,
                        }))
                      }
                      placeholder="25000"
                      required
                    />
                  </div>
                </div>

                {/* VIDEO */}
                <div className="space-y-2">
                  <Label>
                    Course Video (Optional)
                  </Label>

                  <div className="flex items-center gap-4 flex-wrap">
                    {formData.video_url && (
                      <video
                        src={formData.video_url}
                        controls
                        preload="metadata"
                        className="w-40 h-24 rounded object-cover border"
                      />
                    )}

                    <label className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-muted transition-colors">
                      {uploadingVideo ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <FileVideo className="w-4 h-4" />
                      )}

                      <span className="text-sm">
                        {uploadingVideo
                          ? 'Uploading...'
                          : 'Upload Video'}
                      </span>

                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={handleVideoUpload}
                        disabled={uploadingVideo}
                      />
                    </label>
                  </div>
                </div>

                {/* IMAGE */}
                <div className="space-y-2">
                  <Label>
                    Course Image (Optional)
                  </Label>

                  <div className="flex items-center gap-4 flex-wrap">
                    {formData.image_url && (
                      <img
                        src={formData.image_url}
                        alt="Course Preview"
                        className="w-24 h-24 rounded object-cover border"
                        onError={(e) => {
                          e.currentTarget.src =
                            FALLBACK_IMAGE;
                        }}
                      />
                    )}

                    <label className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-muted transition-colors">
                      {uploadingImage ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Image className="w-4 h-4" />
                      )}

                      <span className="text-sm">
                        {uploadingImage
                          ? 'Uploading...'
                          : 'Upload Image'}
                      </span>

                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                      />
                    </label>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setDialogOpen(false)
                    }
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : editingCourse ? (
                      'Update Course'
                    ) : (
                      'Create Course'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* COURSE LIST */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="flex gap-4 p-4 animate-pulse"
                  >
                    <div className="w-24 h-16 bg-muted rounded" />

                    <div className="flex-1">
                      <div className="h-5 bg-muted rounded w-1/3 mb-2" />

                      <div className="h-4 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : courses.length > 0 ? (
              <div className="divide-y divide-border">
                {courses.map((course) => (
                  <div
                    key={course.id ?? course.title}
                    className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors"
                  >
                    <img
                      src={
                        course.image_url ||
                        FALLBACK_IMAGE
                      }
                      alt={course.title}
                      className="w-24 h-16 object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.src =
                          FALLBACK_IMAGE;
                      }}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-secondary truncate">
                          {course.title}
                        </h3>

                        <Badge
                          variant={
                            course.is_published
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {course.is_published
                            ? 'Published'
                            : 'Draft'}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground truncate">
                        {course.short_description}
                      </p>

                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="font-bold text-primary">
                          {formatPrice(course.price)}
                        </span>

                        <span>
                          {course.duration}
                        </span>

                        <span>
                          {course.lesson_count || 0}{' '}
                          lessons
                        </span>
                      </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={
                          course.is_published
                        }
                        onCheckedChange={() =>
                          handlePublishToggle(
                            course
                          )
                        }
                        aria-label="Toggle publish status"
                      />

                      <Link
                        to={`/admin/courses/${course.id}/lessons`}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Manage lessons"
                        >
                          <FileVideo className="w-4 h-4" />
                        </Button>
                      </Link>

                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Edit course"
                        onClick={() =>
                          openEditDialog(course)
                        }
                      >
                        <Edit className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete course"
                        className="text-destructive"
                        onClick={() =>
                          handleDelete(course.id)
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />

                <h3 className="font-serif text-xl font-bold text-secondary mb-2">
                  No Courses Yet
                </h3>

                <p className="text-muted-foreground mb-4">
                  Create your first course to get
                  started
                </p>

                <Button
                  className="rounded-full"
                  onClick={() =>
                    setDialogOpen(true)
                  }
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Course
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminCourses;