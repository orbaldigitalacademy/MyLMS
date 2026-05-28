import axios from "axios";

const API_URL = process.env.REACT_APP_BACKEND_URL;

if (!API_URL) {
  throw new Error("REACT_APP_BACKEND_URL is not defined");
}

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 15000,
});

// ==========================
// REQUEST INTERCEPTOR
// ==========================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ==========================
// RESPONSE INTERCEPTOR
// ==========================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      console.error("Network error or server unavailable");
    }

    if (
      error.response?.status === 401 &&
      window.location.pathname !== "/login"
    ) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

// ==========================
// FILE UPLOAD HELPERS
// ==========================
const allowedImageTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_SIZE = 50 * 1024 * 1024; // 50MB

export const uploadFile = (endpoint, file) => {
  if (!file) {
    throw new Error("No file provided");
  }

  // Validate image uploads
  if (
    endpoint === "/upload/image" &&
    !allowedImageTypes.includes(file.type)
  ) {
    throw new Error("Invalid image format");
  }

  // Validate file size
  if (file.size > MAX_SIZE) {
    throw new Error("File too large");
  }

  const formData = new FormData();
  formData.append("file", file);

  return api.post(endpoint, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// ==========================
// AUTH API
// ==========================
export const authAPI = {
  login: (data) => api.post("/auth/login", data),
  register: (data) => api.post("/auth/register", data),
  getMe: () => api.get("/auth/me"),
};

// ==========================
// COURSES API
// ==========================
export const coursesAPI = {
  getAll: (publishedOnly = true) =>
    api.get(`/courses?published_only=${publishedOnly}`),

  getOne: (id) => api.get(`/courses/${id}`),

  create: (data) => api.post("/admin/courses", data),

  update: (id, data) =>
    api.put(`/admin/courses/${id}`, data),

  delete: (id) =>
    api.delete(`/admin/courses/${id}`),
};

// ==========================
// LESSONS API
// ==========================
export const lessonsAPI = {
  getByCourse: (courseId) =>
    api.get(`/courses/${courseId}/lessons`),

  create: (data) =>
    api.post("/admin/lessons", data),

  update: (id, data) =>
    api.put(`/admin/lessons/${id}`, data),

  delete: (id) =>
    api.delete(`/admin/lessons/${id}`),
};

// ==========================
// PAYMENTS API
// ==========================
export const paymentsAPI = {
  submit: (data) =>
    api.post("/payments/submit", data),

  getMy: () =>
    api.get("/payments/my"),

  getAll: (status) =>
    api.get("/admin/payments", {
      params: status ? { status } : {},
    }),

  approve: (id, note) =>
    api.put(
      `/admin/payments/${id}/approve`,
      null,
      {
        params: { admin_note: note },
      }
    ),

  reject: (id, note) =>
    api.put(
      `/admin/payments/${id}/reject`,
      null,
      {
        params: { admin_note: note },
      }
    ),
};

// ==========================
// ENROLLMENTS API
// ==========================
export const enrollmentsAPI = {
  getMy: () =>
    api.get("/enrollments/my"),

  checkAccess: (courseId) =>
    api.get(`/enrollments/${courseId}/access`),

  updateProgress: (courseId, data) =>
    api.post(
      `/enrollments/${courseId}/progress`,
      data
    ),
};

// ==========================
// CONTACT API
// ==========================
export const contactAPI = {
  submit: (data) =>
    api.post("/contact", data),

  getAll: () =>
    api.get("/admin/contacts"),

  markRead: (id) =>
    api.put(`/admin/contacts/${id}/read`),
};

// ==========================
// SETTINGS API
// ==========================
export const settingsAPI = {
  getBankDetails: () =>
    api.get("/settings/bank"),

  updateBankDetails: (data) =>
    api.put("/admin/settings/bank", data),
};

// ==========================
// UPLOAD API
// ==========================
export const uploadAPI = {
  image: (file) =>
    uploadFile("/upload/image", file),

  video: (file) =>
    uploadFile("/upload/video", file),

  document: (file) =>
    uploadFile("/upload/document", file),
};

// ==========================
// ADMIN API
// ==========================
export const adminAPI = {
  getStats: () =>
    api.get("/admin/stats"),

  getStudents: () =>
    api.get("/admin/students"),

  getTestimonials: () =>
    api.get("/admin/testimonials"),

  createUser: (data) =>
    api.post("/admin/users", data),

  getUsers: () =>
    api.get("/admin/users"),

  deleteUser: (id) =>
    api.delete(`/admin/users/${id}`),

  blockUser: (id) =>
    api.put(`/admin/users/${id}/block`),

  unblockUser: (id) =>
    api.put(`/admin/users/${id}/unblock`),

  enrollUser: (data) =>
    api.post("/admin/enroll", data),
};

// ==========================
// LIVE CLASS API
// ==========================
export const liveClassAPI = {
  create: (data) =>
    api.post("/live-classes", data),

  getAll: () =>
    api.get("/live-classes"),

  getByCourse: (courseId) =>
    api.get(`/live-classes/course/${courseId}`),
};

export default api;