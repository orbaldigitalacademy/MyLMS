import api from './api';
const base = '/alumni-networking';
export const alumniNetworkingApi = {
  discover: async (q = '') => (await api.get(`${base}/discover`, { params: { q } })).data,
  mentors: async () => (await api.get(`${base}/mentors`)).data,
  myMentor: async () => (await api.get(`${base}/mentor/me`)).data,
  saveMentor: async (payload) => (await api.put(`${base}/mentor/me`, payload)).data,
  request: async (payload) => (await api.post(`${base}/requests`, payload)).data,
  requests: async () => (await api.get(`${base}/requests/me`)).data,
  decide: async (id, status) => (await api.patch(`${base}/requests/${encodeURIComponent(id)}`, { status })).data,
};
