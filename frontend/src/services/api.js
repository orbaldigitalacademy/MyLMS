import axios from "axios";

const API_URL = process.env.REACT_APP_BACKEND_URL;

if (!API_URL) {
  throw new Error("REACT_APP_BACKEND_URL is not defined");
}

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 15000,
});

console.log("BACKEND URL:", process.env.REACT_APP_BACKEND_URL);
console.log("AXIOS BASE URL:", api.defaults.baseURL);

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
// REQUEST INTERCEPTOR
// ==========================
api.interceptors.request.use(
  (config) => {
    config.headers = config.headers || {};

    // User JWT
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Admin token
    const adminToken = localStorage.getItem("admin_token");
    if (adminToken) {
      config.headers["X-Admin-Token"] = adminToken;
    }

    return config;
  },
  (error) => Promise.reject(error)
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
  getAll: (publishedOnly = null) =>{
    if (publishedOnly === null) {
      return api.get("/courses");
    }
    return api.get(`/courses?is_published=${publishedOnly}`);
  },

  getOne: (id) => api.get(`/courses/${id}`),

  create: (data) => api.post("/courses", data),

  update: (id, data) =>
    api.patch(`/courses/${id}`, data),

  delete: (id) =>
    api.delete(`/courses/${id}`),
};

// ==========================
// LESSONS API
// ==========================
export const lessonsAPI = {
  getByCourse: (courseId) =>
  api.get(`/lessons/by-course/${courseId}`),

  create: (data) =>
    api.post("/lessons", data),

  update: (id, data) =>
    api.put(`/lessons/${id}`, data),

  delete: (id) =>
    api.delete(`/lessons/${id}`),
};

// ==========================
// PAYMENTS API
// ==========================
export const paymentsAPI = {
  submit: (data) =>
    api.post("/payments/submit", data),

  getMy: () =>
    api.get("/payments/me"),

  getAll: (status) =>
    api.get("/admin/payments", {
      params: status ? { status } : {},
    }),

  approve: (id, remarks) =>
    api.put(`/admin/payments/${id}/approve`, {
      remarks,
    }),

  reject: (id, remarks) =>
    api.put(`/admin/payments/${id}/reject`, {
      remarks,
    }),
};

// ==========================
// ENROLLMENTS API
// ==========================
export const enrollmentsAPI = {
  getMy: () =>
    api.get("/enrollments/me"),

  checkAccess: (courseId) =>
    api.get(`/enrollments/check/${courseId}`),

  updateProgress: (data) =>
  api.post("/enrollments/progress", data)
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
    api.get("/settings"),

  addBank: (data) =>
    api.post("/settings/banks", data),

  updateBank: (bankId, data) =>
    api.put(`/settings/banks/${bankId}`, data),

  deleteBank: (bankId) =>
    api.delete(`/settings/banks/${bankId}`),
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
