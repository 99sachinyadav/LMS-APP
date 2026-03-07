import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useApp } from "../context/AppContext";
import { AppTopBar } from "../components/AppTopBar";

function HighlightCard({ title, icon, value, tint }) {
  return (
    <View style={[styles.highlightCard, { backgroundColor: tint }]}>
      <Ionicons name={icon} size={20} color="#FFFFFF" />
      <Text style={styles.highlightTitle}>{title}</Text>
      <Text style={styles.highlightValue}>{value}</Text>
    </View>
  );
}

function findContinueLearning(enrolledCourses, progressByCourse) {
  for (const course of enrolledCourses) {
    const done = new Set(progressByCourse[course._id]?.lectureCompleted || []);
    let firstNotDone = null;
    let lastDone = null;

    (course.courseContent || []).forEach((chapter, chapterIdx) => {
      (chapter.chapterContent || []).forEach((lecture, lectureIdx) => {
        const entry = {
          ...lecture,
          chapterIdx,
          lectureIdx,
          courseId: course._id,
          courseTitle: course.courseTitle,
          courseThumbnail: course.courseThumbnail,
        };
        if (done.has(lecture.lectureId)) {
          lastDone = entry;
        } else if (!firstNotDone) {
          firstNotDone = entry;
        }
      });
    });

    if (firstNotDone) return { course, lecture: firstNotDone, pct: getCoursePercent(course, done) };
    if (lastDone) return { course, lecture: lastDone, pct: 100 };
  }
  return null;
}

function getCoursePercent(course, doneSet) {
  let total = 0;
  (course.courseContent || []).forEach((chapter) => {
    total += (chapter.chapterContent || []).length;
  });
  if (total === 0) return 0;
  return Math.round((doneSet.size / total) * 100);
}

function formatMinutesToHrMin(totalMinutes) {
  const mins = Number(totalMinutes || 0);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function HomeScreen({ navigation }) {
  const {
    allCourses,
    loadingCourses,
    fetchAllCourses,
    user,
    userData,
    enrolledCourses,
    fetchUserEnrolledCourses,
    fetchCourseProgress,
    calculateRating,
  } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [progressByCourse, setProgressByCourse] = useState({});
  const didInitialLoad = useRef(false);

  const loadAll = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchAllCourses(), fetchUserEnrolledCourses()]);
    setRefreshing(false);
  }, [fetchAllCourses, fetchUserEnrolledCourses]);

  useFocusEffect(
    useCallback(() => {
      if (!didInitialLoad.current) {
        didInitialLoad.current = true;
        loadAll();
      } else {
        // Keep enrollments fresh on return without reloading all course lists repeatedly.
        fetchUserEnrolledCourses();
      }
    }, [loadAll]),
  );

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const map = {};
        await Promise.all(
          (enrolledCourses || []).map(async (course) => {
            const p = await fetchCourseProgress(course._id);
            map[course._id] = p || { lectureCompleted: [] };
          }),
        );
        if (!cancelled) setProgressByCourse(map);
      })();
      return () => {
        cancelled = true;
      };
    }, [enrolledCourses, fetchCourseProgress]),
  );

  const continueItem = useMemo(
    () => findContinueLearning(enrolledCourses, progressByCourse),
    [enrolledCourses, progressByCourse],
  );

  const studyMinutes = useMemo(() => {
    let minutes = 0;
    enrolledCourses.forEach((course) => {
      const done = new Set(progressByCourse[course._id]?.lectureCompleted || []);
      (course.courseContent || []).forEach((chapter) => {
        (chapter.chapterContent || []).forEach((lecture) => {
          if (done.has(lecture.lectureId)) {
            minutes += Number(lecture.lectureDuration || 0);
          }
        });
      });
    });
    return minutes;
  }, [enrolledCourses, progressByCourse]);

  const formattedStudyTime = useMemo(
    () => formatMinutesToHrMin(studyMinutes),
    [studyMinutes],
  );

  const totalDoneLectures = useMemo(() => {
    return Object.values(progressByCourse).reduce(
      (sum, p) => sum + ((p?.lectureCompleted || []).length || 0),
      0,
    );
  }, [progressByCourse]);

  const streakDays = useMemo(() => {
    if (totalDoneLectures === 0) return 0;
    return Math.min(14, Math.max(1, Math.ceil(totalDoneLectures / 2)));
  }, [totalDoneLectures]);

  const recommendedCourses = useMemo(() => {
    const enrolledIds = new Set(enrolledCourses.map((c) => c._id));
    const titleTokens = new Set(
      enrolledCourses
        .flatMap((c) => (c.courseTitle || "").toLowerCase().split(/\s+/))
        .filter((t) => t.length > 3),
    );
    const scored = allCourses
      .filter((c) => !enrolledIds.has(c._id))
      .map((course) => {
        const words = (course.courseTitle || "").toLowerCase().split(/\s+/);
        const overlap = words.filter((w) => titleTokens.has(w)).length;
        const rating = calculateRating(course);
        const score = rating * 2 + overlap * 3 + Number(course.discount || 0) / 20;
        return { course, score, rating };
      })
      .sort((a, b) => b.score - a.score);
    return scored.slice(0, 6);
  }, [allCourses, enrolledCourses, calculateRating]);

  const topCourses = allCourses.slice(0, 5);

  return (
    <View style={styles.container}>
      <AppTopBar title="SDEMY" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadAll} />}
      >
        <View style={styles.hero}>
          <View style={styles.heroTextWrap}>
            <Text style={styles.helloText}>
              Hi {userData?.name || user?.fullName || user?.firstName || "Learner"},
            </Text>
            <Text style={styles.heroTitle}>Keep your streak alive today</Text>
            <Text style={styles.heroSub}>
              Learn smarter with preview lectures, coding practice, and notes.
            </Text>
          </View>
          <View style={styles.avatarWrap}>
            <Ionicons name="school" size={34} color="#0F172A" />
          </View>
        </View>

        <View style={styles.highlightGrid}>
          <HighlightCard
            title="Courses"
            icon="book-outline"
            value={`${allCourses.length}`}
            tint="#2563EB"
          />
          <HighlightCard
            title="My Learning"
            icon="play-circle-outline"
            value={`${enrolledCourses.length} Enrolled`}
            tint="#0F172A"
          />
          <HighlightCard
            title="New Offers"
            icon="pricetag-outline"
            value="Coupons"
            tint="#F97316"
          />
        </View>

        <View style={styles.metricsCard}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{streakDays} days</Text>
            <Text style={styles.metricLabel}>Daily streak</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{formattedStudyTime}</Text>
            <Text style={styles.metricLabel}>Study minutes</Text>
          </View>
        </View>

        {continueItem ? (
          <Pressable
            style={styles.continueCard}
            onPress={() =>
              navigation.navigate("Player", {
                courseId: continueItem.course._id,
                initialLectureId: continueItem.lecture.lectureId,
              })
            }
          >
            <Image
              source={{ uri: continueItem.course.courseThumbnail }}
              style={styles.continueImage}
            />
            <View style={styles.continueTextWrap}>
              <Text style={styles.continueLabel}>Continue Learning</Text>
              <Text style={styles.continueCourse} numberOfLines={1}>
                {continueItem.course.courseTitle}
              </Text>
              <Text style={styles.continueLecture} numberOfLines={1}>
                Next: {continueItem.lecture.lectureTitle}
              </Text>
              <View style={styles.continueProgressBar}>
                <View
                  style={[
                    styles.continueProgressFill,
                    { width: `${continueItem.pct}%` },
                  ]}
                />
              </View>
            </View>
            <Ionicons name="play-circle" size={34} color="#2563EB" />
          </Pressable>
        ) : null}

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Recommended for You</Text>
        </View>
        <FlatList
          horizontal
          data={recommendedCourses}
          keyExtractor={(item) => item.course._id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          ListEmptyComponent={
            <View style={styles.emptyRecommend}>
              <Text style={styles.emptyRecommendText}>
                Start enrolling to get personalized recommendations.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.recommendCard}
              onPress={() =>
                navigation.navigate("CourseDetails", { courseId: item.course._id })
              }
            >
              <Image source={{ uri: item.course.courseThumbnail }} style={styles.recommendImage} />
              <View style={styles.recommendBody}>
                <Text numberOfLines={2} style={styles.recommendTitle}>
                  {item.course.courseTitle}
                </Text>
                <Text style={styles.recommendMeta}>
                  Rating {item.rating}/5 • {item.course.discount}% off
                </Text>
              </View>
            </Pressable>
          )}
        />

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Trending Batches</Text>
          <Pressable onPress={() => navigation.navigate("Courses")}>
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        </View>

        {loadingCourses ? (
          <ActivityIndicator size="large" color="#2563EB" style={styles.loader} />
        ) : (
          <FlatList
            horizontal
            data={topCourses}
            keyExtractor={(item) => item._id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <Pressable
                style={styles.courseTile}
                onPress={() =>
                  navigation.navigate("CourseDetails", { courseId: item._id })
                }
              >
                <Image source={{ uri: item.courseThumbnail }} style={styles.courseImage} />
                <Text numberOfLines={2} style={styles.courseTitle}>
                  {item.courseTitle}
                </Text>
              </Pressable>
            )}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 120,
  },
  hero: {
    backgroundColor: "#DBEAFE",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  heroTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  helloText: {
    color: "#1D4ED8",
    fontSize: 13,
    fontWeight: "700",
  },
  heroTitle: {
    marginTop: 6,
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
  },
  heroSub: {
    marginTop: 8,
    color: "#334155",
    lineHeight: 20,
  },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  highlightGrid: {
    flexDirection: "row",
    gap: 8,
  },
  highlightCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    minHeight: 96,
    justifyContent: "space-between",
  },
  highlightTitle: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    opacity: 0.9,
  },
  highlightValue: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  metricsCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  metricItem: {
    flex: 1,
    alignItems: "center",
  },
  metricValue: {
    fontSize: 20,
    color: "#0F172A",
    fontWeight: "800",
  },
  metricLabel: {
    marginTop: 2,
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
  },
  metricDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#E2E8F0",
  },
  continueCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  continueImage: {
    width: 74,
    height: 74,
    borderRadius: 10,
    backgroundColor: "#E2E8F0",
  },
  continueTextWrap: {
    flex: 1,
  },
  continueLabel: {
    fontSize: 11,
    color: "#2563EB",
    fontWeight: "800",
    textTransform: "uppercase",
  },
  continueCourse: {
    marginTop: 2,
    color: "#0F172A",
    fontWeight: "700",
  },
  continueLecture: {
    marginTop: 2,
    color: "#64748B",
    fontSize: 12,
  },
  continueProgressBar: {
    marginTop: 8,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
  },
  continueProgressFill: {
    height: "100%",
    backgroundColor: "#2563EB",
  },
  sectionHead: {
    marginTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  seeAll: {
    color: "#2563EB",
    fontWeight: "700",
  },
  loader: {
    marginTop: 20,
  },
  horizontalList: {
    gap: 12,
    paddingBottom: 6,
  },
  recommendCard: {
    width: 210,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  recommendImage: {
    width: "100%",
    height: 110,
    backgroundColor: "#E2E8F0",
  },
  recommendBody: {
    padding: 10,
  },
  recommendTitle: {
    color: "#1F2937",
    fontWeight: "700",
    minHeight: 42,
  },
  recommendMeta: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 12,
  },
  emptyRecommend: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    width: 260,
  },
  emptyRecommendText: {
    color: "#64748B",
  },
  courseTile: {
    width: 220,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  courseImage: {
    width: "100%",
    height: 128,
    backgroundColor: "#E2E8F0",
  },
  courseTitle: {
    padding: 10,
    fontWeight: "700",
    color: "#1F2937",
    minHeight: 62,
  },
});
