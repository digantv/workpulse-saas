import axios from 'axios';

const rawBase = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? '';

/**
 * Axios instance with `withCredentials: true` for HttpOnly session cookies.
 * - If `VITE_API_URL` is set → requests go directly to the backend (e.g. http://localhost:4000).
 * - If unset → same-origin paths like `/api/v1/...` hit the Vite dev server, which proxies `/api` to the backend.
 */
export const apiClient = axios.create({
  baseURL: rawBase || undefined,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const onLoginPage = window.location.pathname.startsWith('/login');
    if (status === 401 && !onLoginPage) {
      window.location.assign('/login');
    }
    return Promise.reject(error);
  }
);
