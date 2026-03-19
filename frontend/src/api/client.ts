import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Get CSRF cookie before requests
export const getCsrfCookie = () =>
  axios.get('http://localhost:8000/sanctum/csrf-cookie', { withCredentials: true });

// Interceptor: read XSRF-TOKEN cookie and attach as header for cross-origin requests
apiClient.interceptors.request.use((config) => {
  const token = document.cookie
    .split('; ')
    .find((row) => row.startsWith('XSRF-TOKEN='))
    ?.split('=')[1];
  if (token) {
    config.headers['X-XSRF-TOKEN'] = decodeURIComponent(token);
  }
  return config;
});

export default apiClient;
