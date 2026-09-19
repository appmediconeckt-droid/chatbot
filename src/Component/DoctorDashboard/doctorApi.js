import { useState } from "react";
import axiosInstance, { API_BASE_URL as SERVER_URL } from "../../axiosConfig";

export const API_BASE_URL = `${SERVER_URL.replace(/\/api\/?$/, "")}/api`;
export const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getAuthToken = () =>
  localStorage.getItem("accessToken") || localStorage.getItem("token") || "";

export const getDoctorUser = () => {
  try {
    return JSON.parse(localStorage.getItem("userData") || "null");
  } catch {
    return null;
  }
};

export const useDoctorUser = () => useState(getDoctorUser)[0];
export default axiosInstance;
