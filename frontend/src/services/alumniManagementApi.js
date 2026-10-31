import api from './api';

export const alumniManagementApi = {
  adminList: async (kind) => (await api.get(`/alumni-management/admin/${kind}`)).data,
  create: async (kind, payload) => (await api.post(`/alumni-management/admin/${kind}`, payload)).data,
  update: async (kind, id, payload) => (await api.put(`/alumni-management/admin/${kind}/${encodeURIComponent(id)}`, payload)).data,
  remove: async (kind, id) => (await api.delete(`/alumni-management/admin/${kind}/${encodeURIComponent(id)}`)).data,
  feed: async (kind) => (await api.get(`/alumni-management/feed/${kind}`)).data,
  directory: async () => (await api.get('/alumni-management/admin/directory/visibility')).data,
  setHidden: async (userId, hidden) => (await api.patch(`/alumni-management/admin/directory/${encodeURIComponent(userId)}`, { hidden_by_admin: hidden })).data,
};
