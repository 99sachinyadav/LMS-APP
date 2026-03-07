import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Alert } from "react-native";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { env } from "../config/env";
import {
  calculateChapterTime,
  calculateCourseDuration,
  calculateNoOfLectures,
  calculateRating,
} from "../utils/course";

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [allCourses, setAllCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [userData, setUserData] = useState(null);
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();

  const api = useMemo(() => {
    return axios.create({
      baseURL: env.backendUrl,
      timeout: 20000,
    });
  }, []);

  const withAuthHeaders = async () => {
    const token = await getToken();
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  const fetchAllCourses = async () => {
    setLoadingCourses(true);
    try {
      const { data } = await api.get("/api/course/all");
      if (!data?.success) {
        Alert.alert("Error", data?.message || "Unable to fetch courses");
        return;
      }
      setAllCourses(data.courses || []);
    } catch (error) {
      Alert.alert("Error", error?.message || "Unable to fetch courses");
    } finally {
      setLoadingCourses(false);
    }
  };

  const fetchCourseById = async (courseId) => {
    try {
      const { data } = await api.get(`/api/course/${courseId}`);
      if (!data?.success && !data?.sucess) {
        Alert.alert("Error", data?.message || "Unable to fetch course details");
        return null;
      }
      return data.courseData || null;
    } catch (error) {
      Alert.alert("Error", error?.message || "Unable to fetch course details");
      return null;
    }
  };

  const fetchUserEnrolledCourses = async () => {
    if (!isSignedIn) {
      setEnrolledCourses([]);
      return [];
    }
    try {
      const headers = await withAuthHeaders();
      const { data } = await api.get(
        "/api/user/enrolled-courses",
        headers,
      );
      if (!data?.success) {
        Alert.alert("Error", data?.message || "Unable to fetch enrollments");
        return [];
      }
      const raw = data?.enrolledCourses;
      const courses = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.enrolledCourses)
          ? raw.enrolledCourses
          : [];
      const orderedCourses = [...courses].reverse();
      setEnrolledCourses(orderedCourses);
      return orderedCourses;
    } catch (error) {
      Alert.alert("Error", error?.message || "Unable to fetch enrollments");
      return [];
    }
  };

  const fetchUserData = async () => {
    if (!isSignedIn) {
      setUserData(null);
      return null;
    }
    try {
      const headers = await withAuthHeaders();
      const { data } = await api.get("/api/user/data", headers);
      if (!data?.success) return null;
      setUserData(data.user || null);
      return data.user || null;
    } catch {
      return null;
    }
  };

  const fetchCourseProgress = async (courseId) => {
    if (!isSignedIn) return null;
    try {
      const headers = await withAuthHeaders();
      const { data } = await api.get("/api/user/get-course-progress", {
        ...headers,
        params: { courseId },
      });
      if (!data?.success) return null;
      return data.progress || null;
    } catch {
      return null;
    }
  };

  const enrollCourse = async (courseId) => {
    if (!isSignedIn) {
      Alert.alert("Sign in required", "Please sign in with Clerk.");
      return null;
    }
    try {
      const headers = await withAuthHeaders();
      const requestConfig = {
        ...headers,
        headers: {
          ...(headers.headers || {}),
          origin: env.checkoutOrigin,
        },
      };
      const { data } = await api.post(
        "/api/user/purchase",
        { courseId },
        requestConfig,
      );
      if (!data?.success) {
        Alert.alert("Error", data?.message || "Unable to start enrollment");
        return null;
      }
      return data?.session_url || null;
    } catch (error) {
      Alert.alert("Error", error?.message || "Unable to start enrollment");
      return null;
    }
  };

  const markLectureComplete = async (courseId, lectureId) => {
    if (!isSignedIn) return false;
    try {
      const headers = await withAuthHeaders();
      const { data } = await api.post(
        "/api/user/update-course-progress",
        { courseId, lectureId },
        headers,
      );
      return Boolean(data?.success);
    } catch {
      return false;
    }
  };

  // Keep backend user profile synced for app-level display fields like name.
  useEffect(() => {
    if (!isSignedIn) {
      setUserData(null);
      return;
    }
    fetchUserData();
  }, [isSignedIn]);

  const value = {
    api,
    isSignedIn,
    user,
    userData,
    allCourses,
    enrolledCourses,
    loadingCourses,
    currency: env.currency,
    backendUrl: env.backendUrl,
    fetchAllCourses,
    fetchCourseById,
    fetchUserEnrolledCourses,
    fetchUserData,
    fetchCourseProgress,
    enrollCourse,
    markLectureComplete,
    calculateRating,
    calculateChapterTime,
    calculateCourseDuration,
    calculateNoOfLectures,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
};
