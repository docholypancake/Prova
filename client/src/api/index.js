import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// --- Auth ---
export const getMe = () => api.get('/auth/me').then((r) => r.data.user);
export const logout = () => api.post('/auth/logout').then((r) => r.data);

// GitHub OAuth is a full-page redirect, not an XHR.
export const githubLoginUrl = () => `${import.meta.env.VITE_API_URL}/auth/github`;

// --- Projects ---
export const listProjects = () => api.get('/api/projects').then((r) => r.data.projects);
export const getProject = (id) => api.get(`/api/projects/${id}`).then((r) => r.data.project);
export const createProject = (data) =>
  api.post('/api/projects', data).then((r) => r.data.project);
export const updateProject = (id, data) =>
  api.put(`/api/projects/${id}`, data).then((r) => r.data.project);
export const deleteProject = (id) => api.delete(`/api/projects/${id}`).then((r) => r.data);

// --- Suites ---
export const listSuites = (projectId) =>
  api.get(`/api/projects/${projectId}/suites`).then((r) => r.data.suites);
export const createSuite = (projectId, data) =>
  api.post(`/api/projects/${projectId}/suites`, data).then((r) => r.data.suite);
export const updateSuite = (id, data) =>
  api.put(`/api/suites/${id}`, data).then((r) => r.data.suite);
export const deleteSuite = (id) => api.delete(`/api/suites/${id}`).then((r) => r.data);

// --- Cases ---
export const listCases = (suiteId) =>
  api.get(`/api/suites/${suiteId}/cases`).then((r) => r.data.cases);
export const createCase = (suiteId, data) =>
  api.post(`/api/suites/${suiteId}/cases`, data).then((r) => r.data.case);
export const updateCase = (id, data) =>
  api.put(`/api/cases/${id}`, data).then((r) => r.data.case);
export const deleteCase = (id) => api.delete(`/api/cases/${id}`).then((r) => r.data);

// --- Runs ---
export const listRuns = (projectId) =>
  api.get(`/api/projects/${projectId}/runs`).then((r) => r.data.runs);
export const createRun = (projectId, data) =>
  api.post(`/api/projects/${projectId}/runs`, data).then((r) => r.data.run);
export const getRun = (id) => api.get(`/api/runs/${id}`).then((r) => r.data.run);
export const updateRunCase = (runId, caseId, data) =>
  api.put(`/api/runs/${runId}/cases/${caseId}`, data).then((r) => r.data.run);
export const completeRun = (id) =>
  api.post(`/api/runs/${id}/complete`).then((r) => r.data);

// --- Upload ---
export const uploadScreenshot = (dataUri) =>
  api.post('/api/upload', { image: dataUri }).then((r) => r.data.url);

// --- GitHub ---
export const connectGitHub = (projectId, data) =>
  api.post(`/api/projects/${projectId}/github/connect`, data).then((r) => r.data);
export const disconnectGitHub = (projectId) =>
  api.post(`/api/projects/${projectId}/github/disconnect`).then((r) => r.data.project);

// --- Notifications ---
export const listNotifications = () =>
  api.get('/api/notifications').then((r) => r.data);
export const markNotificationRead = (id) =>
  api.put(`/api/notifications/${id}/read`).then((r) => r.data.notification);

// --- Bugs ---
export const listBugs = (projectId) =>
  api.get(`/api/projects/${projectId}/bugs`).then((r) => r.data.bugs);
export const createBug = (projectId, data) =>
  api.post(`/api/projects/${projectId}/bugs`, data).then((r) => r.data.bug);
export const syncBugToGitHub = (bugId) =>
  api.post(`/api/bugs/${bugId}/github-sync`).then((r) => r.data.bug);
export const deleteBug = (bugId) => api.delete(`/api/bugs/${bugId}`).then((r) => r.data);

// --- Public report + badge ---
export const getSharedReport = (token) =>
  api.get(`/api/runs/share/${token}`).then((r) => r.data);
export const badgeUrl = (token) => `${import.meta.env.VITE_API_URL}/api/badge/${token}`;
export const shareUrl = (token) => `${window.location.origin}/share/${token}`;

// --- Dashboard stats ---
export const getProjectStats = (projectId) =>
  api.get(`/api/projects/${projectId}/stats`).then((r) => r.data);

export default api;
