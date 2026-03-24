import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const csrfToken = localStorage.getItem('csrfToken');
  const csrfSecret = localStorage.getItem('csrfSecret');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method?.toUpperCase())) {
    if (csrfToken) config.headers['x-csrf-token'] = csrfToken;
    if (csrfSecret) config.headers['x-csrf-secret'] = csrfSecret;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('csrfToken');
      localStorage.removeItem('csrfSecret');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const userAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

/** Khóa học */
export const courseAPI = {
  getAll: () => api.get('/courses'),
  getStats: () => api.get('/courses/stats'),
  getAdmin: () => api.get('/courses/admin'),
  getById: (id) => api.get(`/courses/${id}`),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  delete: (id) => api.delete(`/courses/${id}`),

  // Quản lý sinh viên trong khóa (chỉ admin)
  manageStudents: (courseId, studentIds, action) =>
    api.post(`/courses/${courseId}/students`, { studentIds, action }),

  // Bài giảng (giảng viên / admin)
  addLesson: (courseId, lesson) =>
    api.post(`/courses/${courseId}/lessons`, { lesson }),
  updateLesson: (courseId, lessonId, lesson) =>
    api.post(`/courses/${courseId}/lessons`, { lessonId, lesson }),
  deleteLesson: (courseId, lessonId) =>
    api.delete(`/courses/${courseId}/lessons/${lessonId}`),

  // Chấm điểm (giảng viên / admin)
  grade: (courseId, studentId, score, comment) =>
    api.post(`/courses/${courseId}/grades`, { studentId, score, comment }),

  // Bài tập (giảng viên / admin)
  addAssignment: (courseId, assignment) =>
    api.post(`/courses/${courseId}/assignments`, { assignment }),
  updateAssignment: (courseId, assignmentId, assignment) =>
    api.post(`/courses/${courseId}/assignments`, { assignmentId, assignment }),
  deleteAssignment: (courseId, assignmentId) =>
    api.delete(`/courses/${courseId}/assignments/${assignmentId}`),

  // Bài nộp (sinh viên nộp / giảng viên chấm)
  submitAssignment: (courseId, assignmentId, content, attachments) =>
    api.post(`/courses/${courseId}/submissions`, { assignmentId, content, attachments }),
  gradeSubmission: (courseId, submissionId, score, instructorComment) =>
    api.post(`/courses/${courseId}/submissions/grade`, { submissionId, score, instructorComment }),

  // Chat — tin nhắn khóa học
  getMessages: (courseId) => api.get(`/chat/${courseId}/messages`),
  sendMessage: (courseId, content) =>
    api.post(`/chat/${courseId}/messages`, { content }),
  pinMessage: (courseId, messageId) =>
    api.patch(`/chat/${courseId}/messages/${messageId}/pin`),
  deleteMessage: (courseId, messageId) =>
    api.delete(`/chat/${courseId}/messages/${messageId}`),
};

/** Upload file — multipart/form-data */
export const uploadAPI = {
  uploadFiles: (courseId, files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    return axios.post(`${API_URL}/upload/${courseId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        'x-csrf-token': localStorage.getItem('csrfToken') || '',
        'x-csrf-secret': localStorage.getItem('csrfSecret') || '',
      },
    });
  },
};

/** Môn học — admin CRUD */
export const subjectAPI = {
  getAll: (all = false) => api.get('/subjects', { params: all ? { all: 'true' } : {} }),
  getById: (id) => api.get(`/subjects/${id}`),
  create: (data) => api.post('/subjects', data),
  update: (id, data) => api.put(`/subjects/${id}`, data),
  delete: (id) => api.delete(`/subjects/${id}`),
};

/** Kì học mặc định — không cần token */
export const metaAPI = {
  getNextSemester: () => api.get('/meta/next-semester'),
};

export default api;
