import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import YoutubePlayer from "react-native-youtube-iframe";
import { useApp } from "../context/AppContext";
import {
  calculateCourseDuration,
  calculateNoOfLectures,
  calculateRating,
  extractYouTubeVideoId,
} from "../utils/course";

export function CourseDetailsScreen({ route, navigation }) {
  const { courseId } = route.params;
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [previewLecture, setPreviewLecture] = useState(null);
  const {
    fetchCourseById,
    enrollCourse,
    currency,
    enrolledCourses,
    fetchUserEnrolledCourses,
    isSignedIn,
  } = useApp();

  const isAlreadyEnrolled = useMemo(
    () => enrolledCourses.some((item) => item._id === courseId),
    [enrolledCourses, courseId],
  );

  const stats = useMemo(() => {
    if (!course) return null;
    const finalPrice = (
      course.coursePrice -
      (course.discount * course.coursePrice) / 100
    ).toFixed(2);
    return {
      rating: calculateRating(course),
      duration: calculateCourseDuration(course),
      lectures: calculateNoOfLectures(course),
      finalPrice,
    };
  }, [course]);

  const freeLecturesCount = useMemo(() => {
    if (!course) return 0;
    return (course.courseContent || []).reduce((sum, chapter) => {
      return (
        sum +
        (chapter.chapterContent || []).filter((lecture) => lecture?.isPreviewFree).length
      );
    }, 0);
  }, [course]);

  const previewVideoId = useMemo(
    () => extractYouTubeVideoId(previewLecture?.lectureUrl || ""),
    [previewLecture],
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await fetchCourseById(courseId);
      setCourse(data);
      setLoading(false);
    })();
  }, [courseId]);

  useFocusEffect(
    React.useCallback(() => {
      if (!isSignedIn) return;
      fetchUserEnrolledCourses();
    }, [isSignedIn, fetchUserEnrolledCourses]),
  );

  const onEnroll = async () => {
    if (isAlreadyEnrolled || enrolling) return;
    setEnrolling(true);
    const sessionUrl = await enrollCourse(courseId);
    if (sessionUrl) {
      navigation.navigate("Checkout", { sessionUrl });
    }
    setEnrolling(false);
  };

  if (loading) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!course) {
    return (
      <View style={styles.loaderWrap}>
        <Text>Course not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {previewVideoId ? (
        <View style={styles.previewWrap}>
          <YoutubePlayer height={220} play={false} videoId={previewVideoId} />
        </View>
      ) : (
        <Image source={{ uri: course.courseThumbnail }} style={styles.hero} />
      )}
      <Text style={styles.title}>{course.courseTitle}</Text>
      <Text style={styles.meta}>
        Rating {stats.rating}/5 | {stats.lectures} lessons | {stats.duration}
      </Text>
      <View style={styles.freePill}>
        <Text style={styles.freePillText}>
          {freeLecturesCount} free lecture{freeLecturesCount === 1 ? "" : "s"}
        </Text>
      </View>
      {previewVideoId ? (
        <Text style={styles.previewTitle}>Preview: {previewLecture?.lectureTitle}</Text>
      ) : null}
      <View style={styles.priceRow}>
        <Text style={styles.priceNow}>
          {currency}
          {stats.finalPrice}
        </Text>
        <Text style={styles.priceOld}>
          {currency}
          {course.coursePrice}
        </Text>
      </View>
      <Pressable
        style={[
          styles.enrollBtn,
          (isAlreadyEnrolled || enrolling) && styles.enrollBtnDisabled,
        ]}
        onPress={onEnroll}
        disabled={isAlreadyEnrolled || enrolling}
      >
        <Text style={styles.enrollText}>
          {isAlreadyEnrolled
            ? "Already Enrolled"
            : enrolling
              ? "Please wait..."
              : "Enroll Now"}
        </Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Course Structure</Text>
      {course.courseContent?.map((chapter, index) => {
        const open = Boolean(expanded[index]);
        return (
          <View key={index} style={styles.chapterCard}>
            <Pressable
              style={styles.chapterHead}
              onPress={() =>
                setExpanded((prev) => ({ ...prev, [index]: !prev[index] }))
              }
            >
              <Text style={styles.chapterTitle}>{chapter.chapterTitle}</Text>
              <Text style={styles.chapterInfo}>
                {chapter.chapterContent?.length || 0} lectures
              </Text>
            </Pressable>
            {open &&
              chapter.chapterContent?.map((lecture, lectureIndex) => (
                <Pressable
                  key={lecture.lectureId || lectureIndex}
                  style={styles.lectureRow}
                  onPress={() => {
                    if (!lecture?.isPreviewFree) {
                      Alert.alert(
                        "Locked lecture",
                        "This lecture is not free. Enroll to watch full content.",
                      );
                      return;
                    }
                    setPreviewLecture(lecture);
                  }}
                >
                  <View style={styles.lectureLeft}>
                    <Text style={styles.lectureTitle}>{lecture.lectureTitle}</Text>
                    {lecture?.isPreviewFree ? (
                      <Text style={styles.previewBadge}>Preview</Text>
                    ) : null}
                  </View>
                  <Text style={styles.lectureDur}>{lecture.lectureDuration} min</Text>
                </Pressable>
              ))}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    padding: 16,
    gap: 8,
  },
  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
  },
  hero: {
    width: "100%",
    height: 210,
    borderRadius: 14,
    backgroundColor: "#E2E8F0",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 8,
  },
  meta: {
    color: "#475569",
  },
  freePill: {
    alignSelf: "flex-start",
    marginTop: 8,
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  freePillText: {
    color: "#0369A1",
    fontWeight: "700",
    fontSize: 12,
  },
  previewWrap: {
    marginTop: 10,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#000000",
  },
  previewTitle: {
    color: "#0F172A",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontWeight: "700",
  },
  priceRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginTop: 4,
  },
  priceNow: {
    color: "#1D4ED8",
    fontSize: 22,
    fontWeight: "800",
  },
  priceOld: {
    textDecorationLine: "line-through",
    color: "#64748B",
  },
  enrollBtn: {
    backgroundColor: "#2563EB",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  enrollBtnDisabled: {
    backgroundColor: "#64748B",
  },
  enrollText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  sectionTitle: {
    marginTop: 14,
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  chapterCard: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    marginTop: 8,
  },
  chapterHead: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  chapterTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    flex: 1,
    paddingRight: 10,
  },
  chapterInfo: {
    fontSize: 12,
    color: "#64748B",
  },
  lectureRow: {
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  lectureLeft: {
    flex: 1,
    paddingRight: 8,
  },
  lectureTitle: {
    color: "#334155",
  },
  previewBadge: {
    marginTop: 3,
    alignSelf: "flex-start",
    fontSize: 11,
    color: "#0EA5E9",
    fontWeight: "700",
  },
  lectureDur: {
    color: "#64748B",
    fontSize: 12,
  },
});
