import axios from "axios";

console.log("AXIOS BASE URL:", process.env.REACT_APP_API_URL);

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

// Add a request interceptor to attach the JWT token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default API;
