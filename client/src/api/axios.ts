import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";

const API: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

API.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const setAuthToken = (token: string | null): void => {
  if (token) {
    API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete API.defaults.headers.common["Authorization"];
  }
};

export default API;
