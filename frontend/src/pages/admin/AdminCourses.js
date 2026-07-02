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
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '../../components/ui/tabs';
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

import { coursesAPI, uploadAPI } from '../../services/api';

import { toast } from 'sonner';

import {
  Plus,
  Edit,
  Trash2,
  BookOpen,
  Loader2,
  Image as ImageIcon,
  FileVideo,
  X,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*                              Initial form state                            */
/* -------------------------------------------------------------------------- */

const INITIAL_INSTRUCTOR = {
  name: '',
  photo: '',
  qualifications: '',
  experience: '',
  bio: '',
};

const INITIAL_FORM_STATE = {
  // Hero / basics
  title: '',
  short_description: '',
  full_description: '',
  duration: '',
  price: '',
  video_url: '',
  image_url: '',

  // String-list sections (stored as newline-separated in the form)
  learning_outcomes: '',
  problems: '',
  who_for: '',
  requirements: '',
  offer_includes: '',

  // Object sections
  instructor: { ...INITIAL_INSTRUCTOR },

  // Array-of-object sections
  projects: [],        // { title, description, image }
  careers: [],         // { role, salary }
  testimonials: [],    // { name, role, rating, quote, photo }
  why_choose: [],      // { icon, title, description }
  compare_rows: [],    // { feature, orbal, self, bootcamp }
  faqs: [],            // { q, a }
};

const FALLBACK_IMAGE = '/placeholder-course.jpg';

// Icon options matching CourseDetailPage.ICON_MAP
const ICON_OPTIONS = [
  'Rocket',
  'HeartHandshake',
  'ShieldCheck',
  'Lightbulb',
  'Sparkles',
  'Target',
  'Award',
  'GraduationCap',
];

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

// Convert array<string> <-> newline string
const arrToLines = (arr) =>
  Array.isArray(arr) ? arr.filter(Boolean).join('\n') : '';
const linesToArr = (s) =>
  (s || '')
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean);

// Compare-cell value handling. Stored as boolean | 'partial' | string.
const compareValueToSelect = (v) => {
  if (v === true) return 'yes';
  if (v === false) return 'no';
  if (v === 'partial') return 'partial';
  return 'text';
};
const selectToCompareValue = (sel, textValue) => {
  if (sel === 'yes') return true;
  if (sel === 'no') return false;
  if (sel === 'partial') return 'partial';
  return textValue || '';
};

/* -------------------------------------------------------------------------- */
/*                        Small reusable UI primitives                        */
/* -------------------------------------------------------------------------- */

const SectionCard = ({ title, description, children, onAdd, addLabel }) => (
  <div className="space-y-3">
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3 className="font-serif text-lg font-semibold text-secondary">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {onAdd && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onAdd}
          className="shrink-0"
        >
          <Plus className="w-4 h-4 mr-1" />
          {addLabel || 'Add'}
        </Button>
      )}
    </div>
    <div className="space-y-3">{children}</div>
  </div>
);

const RemoveBtn = ({ onClick, label = 'Remove' }) => (
  <Button
    type="button"
    variant="ghost"
    size="icon"
    onClick={onClick}
    aria-label={label}
    className="text-destructive hover:text-destructive shrink-0"
  >
    <X className="w-4 h-4" />
  </Button>
);

const ItemCard = ({ children, onRemove, title }) => (
  <div className="border border-border rounded-lg p-4 bg-muted/20 space-y-3">
    <div className="flex items-center justify-between">
      <p className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
        {title}
      </p>
      {onRemove && <RemoveBtn onClick={onRemove} />}
    </div>
    {children}
  </div>
);

/* -------------------------------------------------------------------------- */
/*                                Main component                              */
/* -------------------------------------------------------------------------- */

const AdminCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [activeTab, setActiveTab] = useState('basics');

  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingInstructor, setUploadingInstructor] = useState(false);
  // For per-item image uploads (projects, testimonials): keyed as "section-index"
  const [itemUploading, setItemUploading] = useState({});

  /* ------------------------------ Data loading ---------------------------- */

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await coursesAPI.getAll();
      setCourses(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(Number(price || 0));

  /* ------------------------------- Form utils ----------------------------- */

  const resetForm = () => {
    setFormData(INITIAL_FORM_STATE);
    setEditingCourse(null);
    setActiveTab('basics');
  };

  const handleDialogChange = (open) => {
    setDialogOpen(open);
    if (!open) resetForm();
  };

  const openEditDialog = (course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title || '',
      short_description: course.short_description || '',
      full_description: course.full_description || '',
      duration: course.duration || '',
      price: course.price?.toString() || '',
      video_url: course.video_url || '',
      image_url: course.image_url || '',

      learning_outcomes: arrToLines(course.learning_outcomes),
      problems: arrToLines(course.problems),
      who_for: arrToLines(course.who_for),
      requirements: arrToLines(course.requirements),
      offer_includes: arrToLines(course.offer_includes),

      instructor: { ...INITIAL_INSTRUCTOR, ...(course.instructor || {}) },

      projects: Array.isArray(course.projects) ? course.projects : [],
      careers: Array.isArray(course.careers) ? course.careers : [],
      testimonials: Array.isArray(course.testimonials)
        ? course.testimonials
        : [],
      why_choose: Array.isArray(course.why_choose) ? course.why_choose : [],
      compare_rows: Array.isArray(course.compare_rows)
        ? course.compare_rows
        : [],
      faqs: Array.isArray(course.faqs) ? course.faqs : [],
    });
    setActiveTab('basics');
    setDialogOpen(true);
  };

  const setField = (key, value) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const setInstructorField = (key, value) =>
    setFormData((prev) => ({
      ...prev,
      instructor: { ...prev.instructor, [key]: value },
    }));

  /* ---------------------- Array-of-object helpers (generic) --------------- */

  const addArrayItem = (key, blank) =>
    setFormData((prev) => ({ ...prev, [key]: [...prev[key], { ...blank }] }));

  const updateArrayItem = (key, index, patch) =>
    setFormData((prev) => ({
      ...prev,
      [key]: prev[key].map((it, i) => (i === index ? { ...it, ...patch } : it)),
    }));

  const removeArrayItem = (key, index) =>
    setFormData((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index),
    }));

  /* ---------------------------- File validators --------------------------- */

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

  /* --------------------------------- Uploads ------------------------------ */

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !validateImage(file)) return;
    setUploadingImage(true);
    try {
      const response = await uploadAPI.image(file);
      setField('image_url', response.data.url);
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
    if (!file || !validateVideo(file)) return;
    setUploadingVideo(true);
    try {
      const response = await uploadAPI.video(file);
      setField('video_url', response.data.url);
      toast.success('Video uploaded successfully');
    } catch (error) {
      console.error('Video upload failed:', error);
      toast.error('Failed to upload video');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleInstructorPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !validateImage(file)) return;
    setUploadingInstructor(true);
    try {
      const response = await uploadAPI.image(file);
      setInstructorField('photo', response.data.url);
      toast.success('Instructor photo uploaded');
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload photo');
    } finally {
      setUploadingInstructor(false);
    }
  };

  const handleItemImageUpload = async (section, index, field, file) => {
    if (!file || !validateImage(file)) return;
    const key = `${section}-${index}`;
    setItemUploading((s) => ({ ...s, [key]: true }));
    try {
      const response = await uploadAPI.image(file);
      updateArrayItem(section, index, { [field]: response.data.url });
      toast.success('Image uploaded');
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload image');
    } finally {
      setItemUploading((s) => ({ ...s, [key]: false }));
    }
  };

  /* --------------------------------- Submit ------------------------------- */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.price || isNaN(Number(formData.price))) {
      toast.error('Please enter a valid price');
      setActiveTab('basics');
      return;
    }

    setSubmitting(true);

    const courseData = {
      // Hero / basics
      title: formData.title.trim(),
      short_description: formData.short_description.trim(),
      full_description: formData.full_description.trim(),
      duration: formData.duration.trim(),
      price: Number(formData.price),
      video_url: formData.video_url || null,
      image_url: formData.image_url || null,

      // String lists
      learning_outcomes: linesToArr(formData.learning_outcomes),
      problems: linesToArr(formData.problems),
      who_for: linesToArr(formData.who_for),
      requirements: linesToArr(formData.requirements),
      offer_includes: linesToArr(formData.offer_includes),

      // Instructor (only keep if any field is filled)
      instructor:
        Object.values(formData.instructor).some((v) => v && v.trim())
          ? formData.instructor
          : null,

      // Object arrays (cleaned)
      projects: formData.projects.filter((p) => p.title || p.description),
      careers: formData.careers.filter((c) => c.role),
      testimonials: formData.testimonials
        .filter((t) => t.name || t.quote)
        .map((t) => ({ ...t, rating: Number(t.rating) || 5 })),
      why_choose: formData.why_choose.filter((w) => w.title),
      compare_rows: formData.compare_rows.filter((r) => r.feature),
      faqs: formData.faqs.filter((f) => f.q || f.a),
    };

    try {
      if (editingCourse) {
        const response = await coursesAPI.update(editingCourse.id, courseData);
        setCourses((prev) =>
          prev.map((c) => (c.id === editingCourse.id ? response.data : c))
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
        error?.response?.data?.detail || 'Failed to save course'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      await coursesAPI.delete(courseId);
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
      toast.success('Course deleted successfully');
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete course');
    }
  };

  const handlePublishToggle = async (course) => {
    const updated = !course.is_published;
    try {
      await coursesAPI.update(course.id, { is_published: updated });
      setCourses((prev) =>
        prev.map((it) =>
          it.id === course.id ? { ...it, is_published: updated } : it
        )
      );
      toast.success(updated ? 'Course published' : 'Course unpublished');
    } catch (error) {
      console.error('Publish toggle failed:', error);
      toast.error('Failed to update course');
    }
  };

  /* -------------------------------------------------------------------- */
  /*                              RENDER                                  */
  /* -------------------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />

      <main className="ml-64 p-8" data-testid="admin-courses">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl font-bold text-secondary">
              Courses
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your course catalog
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button className="rounded-full" data-testid="add-course-btn">
                <Plus className="w-4 h-4 mr-2" />
                Add Course
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-serif">
                  {editingCourse ? 'Edit Course' : 'Create New Course'}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="mt-4">
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 h-auto">
                    <TabsTrigger value="basics">Basics</TabsTrigger>
                    <TabsTrigger value="learning">Learning</TabsTrigger>
                    <TabsTrigger value="projects">Projects</TabsTrigger>
                    <TabsTrigger value="instructor">Instructor</TabsTrigger>
                    <TabsTrigger value="social">Social</TabsTrigger>
                    <TabsTrigger value="offer">Offer & FAQ</TabsTrigger>
                  </TabsList>

                  {/* ============================ BASICS ============================ */}
                  <TabsContent value="basics" className="space-y-4 mt-6">
                    <div className="space-y-2">
                      <Label htmlFor="title">Course Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setField('title', e.target.value)}
                        placeholder="e.g. Data Analytics with Power BI"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="short_description">
                        Short Description (Hero subtitle)
                      </Label>
                      <Input
                        id="short_description"
                        value={formData.short_description}
                        onChange={(e) =>
                          setField('short_description', e.target.value)
                        }
                        placeholder="One-line course overview shown in hero"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="full_description">Full Description</Label>
                      <Textarea
                        id="full_description"
                        rows={5}
                        value={formData.full_description}
                        onChange={(e) =>
                          setField('full_description', e.target.value)
                        }
                        placeholder="Detailed course description"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="duration">Duration</Label>
                        <Input
                          id="duration"
                          value={formData.duration}
                          onChange={(e) =>
                            setField('duration', e.target.value)
                          }
                          placeholder="e.g. 8 weeks"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="price">Price (₦)</Label>
                        <Input
                          id="price"
                          type="number"
                          min="0"
                          value={formData.price}
                          onChange={(e) => setField('price', e.target.value)}
                          placeholder="25000"
                          required
                        />
                      </div>
                    </div>

                    {/* Hero image */}
                    <div className="space-y-2">
                      <Label>Hero Image</Label>
                      <div className="flex items-center gap-4 flex-wrap">
                        {formData.image_url && (
                          <img
                            src={formData.image_url}
                            alt="Course Preview"
                            className="w-32 h-24 rounded object-cover border"
                            onError={(e) => {
                              e.currentTarget.src = FALLBACK_IMAGE;
                            }}
                          />
                        )}
                        <label className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-muted transition-colors">
                          {uploadingImage ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <ImageIcon className="w-4 h-4" />
                          )}
                          <span className="text-sm">
                            {uploadingImage ? 'Uploading...' : 'Upload Image'}
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

                    {/* Course video (optional) */}
                    <div className="space-y-2">
                      <Label>Course Video (Optional)</Label>
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
                            {uploadingVideo ? 'Uploading...' : 'Upload Video'}
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
                  </TabsContent>

                  {/* ============================ LEARNING ============================ */}
                  <TabsContent value="learning" className="space-y-6 mt-6">
                    <SectionCard
                      title="Problems (Agitate section)"
                      description="One problem per line — shown in the 'Are you facing any of these problems?' section."
                    >
                      <Textarea
                        rows={4}
                        value={formData.problems}
                        onChange={(e) => setField('problems', e.target.value)}
                        placeholder={`Struggling to get a tech job despite applying everywhere\nWatching endless tutorials without any practical results`}
                      />
                    </SectionCard>

                    <SectionCard
                      title="Learning Outcomes"
                      description="One outcome per line — shown in 'What you'll learn'."
                    >
                      <Textarea
                        rows={5}
                        value={formData.learning_outcomes}
                        onChange={(e) =>
                          setField('learning_outcomes', e.target.value)
                        }
                        placeholder={`Build responsive websites\nUnderstand HTML, CSS & JavaScript\nDeploy applications`}
                      />
                    </SectionCard>

                    <SectionCard
                      title="Who This Course Is For"
                      description="One audience per line."
                    >
                      <Textarea
                        rows={4}
                        value={formData.who_for}
                        onChange={(e) => setField('who_for', e.target.value)}
                        placeholder={`Beginners looking to switch into a tech career\nWorking professionals upskilling for a promotion`}
                      />
                    </SectionCard>

                    <SectionCard
                      title="Requirements"
                      description="One requirement per line."
                    >
                      <Textarea
                        rows={3}
                        value={formData.requirements}
                        onChange={(e) =>
                          setField('requirements', e.target.value)
                        }
                        placeholder={`A laptop with stable internet access\nWillingness to commit ~5 hours per week`}
                      />
                    </SectionCard>

                    <div className="text-sm text-muted-foreground bg-muted/40 rounded-lg p-4 border border-border">
                      <strong>Curriculum:</strong> Lessons are managed on the
                      dedicated lessons page for each course (click the video
                      icon in the courses list).
                    </div>
                  </TabsContent>

                  {/* ============================ PROJECTS & CAREERS ============================ */}
                  <TabsContent value="projects" className="space-y-8 mt-6">
                    <SectionCard
                      title="Portfolio Projects"
                      description="Projects students will build during the course."
                      onAdd={() =>
                        addArrayItem('projects', {
                          title: '',
                          description: '',
                          image: '',
                        })
                      }
                      addLabel="Add Project"
                    >
                      {formData.projects.length === 0 && (
                        <p className="text-sm text-muted-foreground italic">
                          No projects yet.
                        </p>
                      )}
                      {formData.projects.map((p, i) => {
                        const uploadKey = `projects-${i}`;
                        return (
                          <ItemCard
                            key={i}
                            title={`Project ${i + 1}`}
                            onRemove={() => removeArrayItem('projects', i)}
                          >
                            <Input
                              value={p.title}
                              onChange={(e) =>
                                updateArrayItem('projects', i, {
                                  title: e.target.value,
                                })
                              }
                              placeholder="Project title"
                            />
                            <Textarea
                              rows={2}
                              value={p.description}
                              onChange={(e) =>
                                updateArrayItem('projects', i, {
                                  description: e.target.value,
                                })
                              }
                              placeholder="Project description"
                            />
                            <div className="flex items-center gap-3 flex-wrap">
                              {p.image && (
                                <img
                                  src={p.image}
                                  alt={p.title}
                                  className="w-24 h-16 object-cover rounded border"
                                />
                              )}
                              <label className="flex items-center gap-2 px-3 py-1.5 border rounded-md cursor-pointer hover:bg-muted transition-colors text-sm">
                                {itemUploading[uploadKey] ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <ImageIcon className="w-4 h-4" />
                                )}
                                {itemUploading[uploadKey]
                                  ? 'Uploading...'
                                  : 'Upload Image'}
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) =>
                                    handleItemImageUpload(
                                      'projects',
                                      i,
                                      'image',
                                      e.target.files?.[0]
                                    )
                                  }
                                  disabled={itemUploading[uploadKey]}
                                />
                              </label>
                              <Input
                                value={p.image || ''}
                                onChange={(e) =>
                                  updateArrayItem('projects', i, {
                                    image: e.target.value,
                                  })
                                }
                                placeholder="…or paste image URL"
                                className="flex-1 min-w-[200px]"
                              />
                            </div>
                          </ItemCard>
                        );
                      })}
                    </SectionCard>

                    <SectionCard
                      title="Career Opportunities"
                      description="Roles graduates can pursue with salary ranges."
                      onAdd={() =>
                        addArrayItem('careers', { role: '', salary: '' })
                      }
                      addLabel="Add Career"
                    >
                      {formData.careers.length === 0 && (
                        <p className="text-sm text-muted-foreground italic">
                          No careers yet.
                        </p>
                      )}
                      {formData.careers.map((c, i) => (
                        <ItemCard
                          key={i}
                          title={`Career ${i + 1}`}
                          onRemove={() => removeArrayItem('careers', i)}
                        >
                          <div className="grid md:grid-cols-2 gap-3">
                            <Input
                              value={c.role}
                              onChange={(e) =>
                                updateArrayItem('careers', i, {
                                  role: e.target.value,
                                })
                              }
                              placeholder="Role e.g. Data Analyst"
                            />
                            <Input
                              value={c.salary}
                              onChange={(e) =>
                                updateArrayItem('careers', i, {
                                  salary: e.target.value,
                                })
                              }
                              placeholder="Salary range e.g. ₦300,000 – ₦1.2M/month"
                            />
                          </div>
                        </ItemCard>
                      ))}
                    </SectionCard>
                  </TabsContent>

                  {/* ============================ INSTRUCTOR ============================ */}
                  <TabsContent value="instructor" className="space-y-4 mt-6">
                    <SectionCard
                      title="Instructor Profile"
                      description="Shown in the 'Meet your instructor' section."
                    >
                      <div className="grid md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Full Name</Label>
                          <Input
                            value={formData.instructor.name}
                            onChange={(e) =>
                              setInstructorField('name', e.target.value)
                            }
                            placeholder="Dr. Adaeze Okafor"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Qualifications</Label>
                          <Input
                            value={formData.instructor.qualifications}
                            onChange={(e) =>
                              setInstructorField(
                                'qualifications',
                                e.target.value
                              )
                            }
                            placeholder="PhD in Computer Science…"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Experience</Label>
                        <Input
                          value={formData.instructor.experience}
                          onChange={(e) =>
                            setInstructorField('experience', e.target.value)
                          }
                          placeholder="12+ years of industry & teaching experience"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Bio</Label>
                        <Textarea
                          rows={4}
                          value={formData.instructor.bio}
                          onChange={(e) =>
                            setInstructorField('bio', e.target.value)
                          }
                          placeholder="Short professional bio…"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Photo</Label>
                        <div className="flex items-center gap-4 flex-wrap">
                          {formData.instructor.photo && (
                            <img
                              src={formData.instructor.photo}
                              alt={formData.instructor.name}
                              className="w-24 h-24 rounded-full object-cover border"
                            />
                          )}
                          <label className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-muted transition-colors">
                            {uploadingInstructor ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <ImageIcon className="w-4 h-4" />
                            )}
                            <span className="text-sm">
                              {uploadingInstructor
                                ? 'Uploading...'
                                : 'Upload Photo'}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleInstructorPhotoUpload}
                              disabled={uploadingInstructor}
                            />
                          </label>
                          <Input
                            value={formData.instructor.photo}
                            onChange={(e) =>
                              setInstructorField('photo', e.target.value)
                            }
                            placeholder="…or paste photo URL"
                            className="flex-1 min-w-[200px]"
                          />
                        </div>
                      </div>
                    </SectionCard>
                  </TabsContent>

                  {/* ============================ SOCIAL ============================ */}
                  <TabsContent value="social" className="space-y-8 mt-6">
                    <SectionCard
                      title="Testimonials"
                      description="Student reviews shown in the Reviews section."
                      onAdd={() =>
                        addArrayItem('testimonials', {
                          name: '',
                          role: '',
                          rating: 5,
                          quote: '',
                          photo: '',
                        })
                      }
                      addLabel="Add Testimonial"
                    >
                      {formData.testimonials.length === 0 && (
                        <p className="text-sm text-muted-foreground italic">
                          No testimonials yet.
                        </p>
                      )}
                      {formData.testimonials.map((t, i) => {
                        const uploadKey = `testimonials-${i}`;
                        return (
                          <ItemCard
                            key={i}
                            title={`Testimonial ${i + 1}`}
                            onRemove={() =>
                              removeArrayItem('testimonials', i)
                            }
                          >
                            <div className="grid md:grid-cols-3 gap-3">
                              <Input
                                value={t.name}
                                onChange={(e) =>
                                  updateArrayItem('testimonials', i, {
                                    name: e.target.value,
                                  })
                                }
                                placeholder="Student name"
                              />
                              <Input
                                value={t.role}
                                onChange={(e) =>
                                  updateArrayItem('testimonials', i, {
                                    role: e.target.value,
                                  })
                                }
                                placeholder="Role e.g. Frontend Developer"
                              />
                              <Input
                                type="number"
                                min="1"
                                max="5"
                                value={t.rating ?? 5}
                                onChange={(e) =>
                                  updateArrayItem('testimonials', i, {
                                    rating: Number(e.target.value),
                                  })
                                }
                                placeholder="Rating 1-5"
                              />
                            </div>
                            <Textarea
                              rows={3}
                              value={t.quote}
                              onChange={(e) =>
                                updateArrayItem('testimonials', i, {
                                  quote: e.target.value,
                                })
                              }
                              placeholder="What the student said…"
                            />
                            <div className="flex items-center gap-3 flex-wrap">
                              {t.photo && (
                                <img
                                  src={t.photo}
                                  alt={t.name}
                                  className="w-14 h-14 object-cover rounded-full border"
                                />
                              )}
                              <label className="flex items-center gap-2 px-3 py-1.5 border rounded-md cursor-pointer hover:bg-muted transition-colors text-sm">
                                {itemUploading[uploadKey] ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <ImageIcon className="w-4 h-4" />
                                )}
                                {itemUploading[uploadKey]
                                  ? 'Uploading...'
                                  : 'Upload Photo'}
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) =>
                                    handleItemImageUpload(
                                      'testimonials',
                                      i,
                                      'photo',
                                      e.target.files?.[0]
                                    )
                                  }
                                  disabled={itemUploading[uploadKey]}
                                />
                              </label>
                              <Input
                                value={t.photo || ''}
                                onChange={(e) =>
                                  updateArrayItem('testimonials', i, {
                                    photo: e.target.value,
                                  })
                                }
                                placeholder="…or paste photo URL"
                                className="flex-1 min-w-[200px]"
                              />
                            </div>
                          </ItemCard>
                        );
                      })}
                    </SectionCard>

                    <SectionCard
                      title="Why Choose Us"
                      description="Value propositions with an icon each."
                      onAdd={() =>
                        addArrayItem('why_choose', {
                          icon: 'Rocket',
                          title: '',
                          description: '',
                        })
                      }
                      addLabel="Add Item"
                    >
                      {formData.why_choose.length === 0 && (
                        <p className="text-sm text-muted-foreground italic">
                          No items yet — course will fall back to defaults.
                        </p>
                      )}
                      {formData.why_choose.map((w, i) => (
                        <ItemCard
                          key={i}
                          title={`Reason ${i + 1}`}
                          onRemove={() => removeArrayItem('why_choose', i)}
                        >
                          <div className="grid md:grid-cols-[160px_1fr] gap-3">
                            <div className="space-y-2">
                              <Label className="text-xs">Icon</Label>
                              <Select
                                value={w.icon || 'Rocket'}
                                onValueChange={(v) =>
                                  updateArrayItem('why_choose', i, { icon: v })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Icon" />
                                </SelectTrigger>
                                <SelectContent>
                                  {ICON_OPTIONS.map((ic) => (
                                    <SelectItem key={ic} value={ic}>
                                      {ic}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">Title</Label>
                              <Input
                                value={w.title}
                                onChange={(e) =>
                                  updateArrayItem('why_choose', i, {
                                    title: e.target.value,
                                  })
                                }
                                placeholder="Project-first learning"
                              />
                            </div>
                          </div>
                          <Textarea
                            rows={2}
                            value={w.description}
                            onChange={(e) =>
                              updateArrayItem('why_choose', i, {
                                description: e.target.value,
                              })
                            }
                            placeholder="Short description"
                          />
                        </ItemCard>
                      ))}
                    </SectionCard>

                    <SectionCard
                      title="Comparison Table"
                      description="Compare Orbal Academy vs. Self-Taught vs. Traditional Bootcamp."
                      onAdd={() =>
                        addArrayItem('compare_rows', {
                          feature: '',
                          orbal: true,
                          self: false,
                          bootcamp: 'partial',
                        })
                      }
                      addLabel="Add Row"
                    >
                      {formData.compare_rows.length === 0 && (
                        <p className="text-sm text-muted-foreground italic">
                          No rows yet — course will use default comparison.
                        </p>
                      )}
                      {formData.compare_rows.map((row, i) => (
                        <ItemCard
                          key={i}
                          title={`Row ${i + 1}`}
                          onRemove={() => removeArrayItem('compare_rows', i)}
                        >
                          <div className="space-y-2">
                            <Label className="text-xs">Feature</Label>
                            <Input
                              value={row.feature}
                              onChange={(e) =>
                                updateArrayItem('compare_rows', i, {
                                  feature: e.target.value,
                                })
                              }
                              placeholder="e.g. 1:1 mentor support & code reviews"
                            />
                          </div>
                          <div className="grid md:grid-cols-3 gap-3">
                            {['orbal', 'self', 'bootcamp'].map((col) => {
                              const label =
                                col === 'orbal'
                                  ? 'Orbal Academy'
                                  : col === 'self'
                                  ? 'Self-Taught'
                                  : 'Bootcamp';
                              const sel = compareValueToSelect(row[col]);
                              return (
                                <div key={col} className="space-y-2">
                                  <Label className="text-xs">{label}</Label>
                                  <Select
                                    value={sel}
                                    onValueChange={(v) =>
                                      updateArrayItem('compare_rows', i, {
                                        [col]:
                                          v === 'text'
                                            ? typeof row[col] === 'string'
                                              ? row[col]
                                              : ''
                                            : selectToCompareValue(v, ''),
                                      })
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="yes">Yes</SelectItem>
                                      <SelectItem value="no">No</SelectItem>
                                      <SelectItem value="partial">
                                        Partial
                                      </SelectItem>
                                      <SelectItem value="text">
                                        Custom text
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                  {sel === 'text' && (
                                    <Input
                                      value={
                                        typeof row[col] === 'string'
                                          ? row[col]
                                          : ''
                                      }
                                      onChange={(e) =>
                                        updateArrayItem('compare_rows', i, {
                                          [col]: e.target.value,
                                        })
                                      }
                                      placeholder="e.g. 8-12 weeks"
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </ItemCard>
                      ))}
                    </SectionCard>
                  </TabsContent>

                  {/* ============================ OFFER & FAQ ============================ */}
                  <TabsContent value="offer" className="space-y-8 mt-6">
                    <SectionCard
                      title="Offer Stack (What's Included)"
                      description="One item per line — shown in the Investment section."
                    >
                      <Textarea
                        rows={6}
                        value={formData.offer_includes}
                        onChange={(e) =>
                          setField('offer_includes', e.target.value)
                        }
                        placeholder={`Full lifetime course access\nVerifiable certificate of completion\nHands-on portfolio projects`}
                      />
                    </SectionCard>

                    <SectionCard
                      title="FAQ"
                      description="Questions and answers shown in the FAQ section."
                      onAdd={() =>
                        addArrayItem('faqs', { q: '', a: '' })
                      }
                      addLabel="Add FAQ"
                    >
                      {formData.faqs.length === 0 && (
                        <p className="text-sm text-muted-foreground italic">
                          No FAQs yet.
                        </p>
                      )}
                      {formData.faqs.map((f, i) => (
                        <ItemCard
                          key={i}
                          title={`FAQ ${i + 1}`}
                          onRemove={() => removeArrayItem('faqs', i)}
                        >
                          <Input
                            value={f.q}
                            onChange={(e) =>
                              updateArrayItem('faqs', i, {
                                q: e.target.value,
                              })
                            }
                            placeholder="Question"
                          />
                          <Textarea
                            rows={3}
                            value={f.a}
                            onChange={(e) =>
                              updateArrayItem('faqs', i, {
                                a: e.target.value,
                              })
                            }
                            placeholder="Answer"
                          />
                        </ItemCard>
                      ))}
                    </SectionCard>
                  </TabsContent>
                </Tabs>

                {/* ACTIONS */}
                <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-border sticky bottom-0 bg-background">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
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

        {/* ============================ COURSE LIST ============================ */}
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
                      src={course.image_url || FALLBACK_IMAGE}
                      alt={course.title}
                      className="w-24 h-16 object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_IMAGE;
                      }}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-secondary truncate">
                          {course.title}
                        </h3>
                        <Badge
                          variant={
                            course.is_published ? 'default' : 'secondary'
                          }
                        >
                          {course.is_published ? 'Published' : 'Draft'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {course.short_description}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="font-bold text-primary">
                          {formatPrice(course.price)}
                        </span>
                        <span>{course.duration}</span>
                        <span>{course.lesson_count || 0} lessons</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={course.is_published}
                        onCheckedChange={() => handlePublishToggle(course)}
                        aria-label="Toggle publish status"
                      />
                      <Link to={`/admin/courses/${course.id}/lessons`}>
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
                        onClick={() => openEditDialog(course)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete course"
                        className="text-destructive"
                        onClick={() => handleDelete(course.id)}
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
                  Create your first course to get started
                </p>
                <Button
                  className="rounded-full"
                  onClick={() => setDialogOpen(true)}
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
