import axios from 'axios';
import { API_BASE_URL } from './constants';


export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,  // send HttpOnly cookies automatically
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach access token if stored
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
