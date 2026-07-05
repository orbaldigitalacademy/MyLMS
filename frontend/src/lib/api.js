import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const TOKEN_KEY = "settings_admin_token";

export const getAdminToken = () => localStorage.getItem(TOKEN_KEY) || "";
export const setAdminToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearAdminToken = () => localStorage.removeItem(TOKEN_KEY);

export const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const t = getAdminToken();
  if (t) config.headers["X-Admin-Token"] = t;
  return config;
});

// Verify the token by hitting the server; returns true/false
export const verifyAdminToken = async (token) => {
  try {
    await axios.post(
      `${API}/settings/auth/verify`,
      {},
      { headers: { "X-Admin-Token": token } }
    );
    return true;
  } catch {
    return false;
  }
};
