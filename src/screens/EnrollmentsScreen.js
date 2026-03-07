import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useApp } from "../context/AppContext";
import { calculateCourseDuration, calculateNoOfLectures } from "../utils/course";
import { AppTopBar } from "../components/AppTopBar";

function StatChip({ icon, label, value }) {
  return (
    <View style={styles.statChip}>
      <Ionicons name={icon} size={15} color="#0F172A" />
      <View>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
    </View>
  );
}

export function EnrollmentsScreen({ navigation }) {
  const { enrolledCourses, fetchUserEnrolledCourses, fetchCourseProgress } = useApp();
  const [loading, setLoading] = useState(false);
  const [progressByCourse, setProgressByCourse] = useState({});

  const loadData = useCallback(async () => {
    setLoading(true);
    const courses = await fetchUserEnrolledCourses();
    const nextProgress = {};
    await Promise.all(
      (courses || []).map(async (course) => {
        const progress = await fetchCourseProgress(course._id);
        const total = calculateNoOfLectures(course);
        nextProgress[course._id] = {
          completed: progress?.lectureCompleted?.length || 0,
          total,
        };
      }),
    );
    setProgressByCourse(nextProgress);
    setLoading(false);
  }, [fetchUserEnrolledCourses, fetchCourseProgress]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const summary = useMemo(() => {
    let completedCourses = 0;
    let totalLectures = 0;
    let doneLectures = 0;
    enrolledCourses.forEach((course) => {
      const progress = progressByCourse[course._id] || { completed: 0, total: 0 };
      totalLectures += progress.total;
      doneLectures += progress.completed;
      if (progress.total > 0 && progress.completed >= progress.total) {
        completedCourses += 1;
      }
    });
    const overallPct =
      totalLectures > 0 ? Math.round((doneLectures / totalLectures) * 100) : 0;
    return { completedCourses, totalLectures, doneLectures, overallPct };
  }, [enrolledCourses, progressByCourse]);

  if (loading && enrolledCourses.length === 0) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppTopBar title="SDEMY" />
      <FlatList
        data={enrolledCourses}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            <Text style={styles.title}>My Enrollments</Text>
            <Text style={styles.subtitle}>Track progress and continue learning</Text>
            <View style={styles.statsRow}>
              <StatChip
                icon="book-outline"
                label="Courses"
                value={`${enrolledCourses.length}`}
              />
              <StatChip
                icon="checkmark-circle-outline"
                label="Completed"
                value={`${summary.completedCourses}`}
              />
              <StatChip
                icon="analytics-outline"
                label="Overall"
                value={`${summary.overallPct}%`}
              />
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const progress = progressByCourse[item._id] || { completed: 0, total: 0 };
          const pct =
            progress.total > 0
              ? Math.round((progress.completed / progress.total) * 100)
              : 0;
          return (
            <View style={styles.card}>
              <Image source={{ uri: item.courseThumbnail }} style={styles.thumb} />
              <View style={styles.content}>
                <Text style={styles.courseTitle} numberOfLines={2}>
                  {item.courseTitle}
                </Text>
                <Text style={styles.meta}>
                  {calculateCourseDuration(item)} | {progress.completed}/{progress.total} lessons
                </Text>
                <View style={styles.progressMetaRow}>
                  <Text style={styles.progressText}>Progress</Text>
                  <Text style={styles.progressPct}>{pct}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${pct}%` }]} />
                </View>
                <Pressable
                  style={[styles.playerBtn, pct === 100 ? styles.doneBtn : null]}
                  onPress={() => navigation.navigate("Player", { courseId: item._id })}
                >
                  <Ionicons
                    name={pct === 100 ? "checkmark-done-circle-outline" : "play-circle-outline"}
                    size={16}
                    color="#FFFFFF"
                  />
                  <Text style={styles.playerText}>{pct === 100 ? "Completed" : "Continue"}</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="book-outline" size={32} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No enrollments yet</Text>
            <Text style={styles.emptyText}>
              Enroll in a course to start tracking your learning progress.
            </Text>
            <Pressable
              style={styles.emptyBtn}
              onPress={() => navigation.navigate("Courses")}
            >
              <Text style={styles.emptyBtnText}>Explore Courses</Text>
            </Pressable>
          </View>
        }
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 120,
    gap: 12,
  },
  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  headerSection: {
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0F172A",
  },
  subtitle: {
    marginTop: 4,
    color: "#475569",
    fontSize: 13,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  statChip: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "700",
  },
  statValue: {
    marginTop: 2,
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "800",
  },
  card: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  thumb: {
    width: "100%",
    height: 145,
    backgroundColor: "#E2E8F0",
  },
  content: {
    padding: 12,
    gap: 8,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  meta: {
    color: "#64748B",
    fontSize: 12,
  },
  progressMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressText: {
    color: "#475569",
    fontWeight: "600",
    fontSize: 12,
  },
  progressPct: {
    color: "#1D4ED8",
    fontWeight: "700",
    fontSize: 12,
  },
  progressBar: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#2563EB",
  },
  playerBtn: {
    marginTop: 4,
    backgroundColor: "#0F172A",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  doneBtn: {
    backgroundColor: "#16A34A",
  },
  playerText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  emptyWrap: {
    marginTop: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
  },
  emptyTitle: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  emptyText: {
    marginTop: 6,
    textAlign: "center",
    color: "#64748B",
  },
  emptyBtn: {
    marginTop: 12,
    backgroundColor: "#2563EB",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
