import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import YoutubePlayer from "react-native-youtube-iframe";
import { useApp } from "../context/AppContext";
import { calculateChapterTime, extractYouTubeVideoId } from "../utils/course";

export function PlayerScreen({ route, navigation }) {
  const { courseId, initialLectureId } = route.params;
  const { fetchUserEnrolledCourses, fetchCourseProgress, markLectureComplete } = useApp();
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [currentLecture, setCurrentLecture] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const courses = await fetchUserEnrolledCourses();
      const selected = (courses || []).find((c) => c._id === courseId) || null;
      setCourse(selected);
      const p = await fetchCourseProgress(courseId);
      setProgress(p);
      if (selected && initialLectureId) {
        let picked = null;
        (selected.courseContent || []).forEach((chapter, chapterIdx) => {
          (chapter.chapterContent || []).forEach((lecture, lectureIdx) => {
            if (lecture.lectureId === initialLectureId && !picked) {
              picked = {
                ...lecture,
                chapter: chapterIdx + 1,
                lecture: lectureIdx + 1,
              };
            }
          });
        });
        if (picked) setCurrentLecture(picked);
      }
      setLoading(false);
    })();
  }, [courseId, initialLectureId]);

  const videoId = useMemo(() => {
    if (!currentLecture?.lectureUrl) return "";
    return extractYouTubeVideoId(currentLecture.lectureUrl);
  }, [currentLecture]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!course) {
    return (
      <View style={styles.loader}>
        <Text>This enrolled course was not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.videoWrap}>
        {videoId ? (
          <YoutubePlayer height={220} play={false} videoId={videoId} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Select a lecture to start watching</Text>
          </View>
        )}
      </View>

      {currentLecture ? (
        <View style={styles.currentCard}>
          <Text style={styles.currentTitle}>{currentLecture.lectureTitle}</Text>
          <View style={styles.actionsRow}>
            <Pressable
              style={styles.completeBtn}
              onPress={async () => {
                const ok = await markLectureComplete(courseId, currentLecture.lectureId);
                if (ok) {
                  const p = await fetchCourseProgress(courseId);
                  setProgress(p);
                }
              }}
            >
              <Text style={styles.completeText}>Mark Complete</Text>
            </Pressable>
            {currentLecture.lectureNotesUrl ? (
              <Pressable
                style={styles.notesBtn}
                onPress={() =>
                  navigation.navigate("Notes", {
                    notesUrl: currentLecture.lectureNotesUrl,
                  })
                }
              >
                <Text style={styles.notesText}>Open Notes</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Course Structure</Text>
      {course.courseContent?.map((chapter, chapterIdx) => {
        const open = Boolean(expanded[chapterIdx]);
        return (
          <View key={chapterIdx} style={styles.chapterCard}>
            <Pressable
              style={styles.chapterHead}
              onPress={() =>
                setExpanded((prev) => ({ ...prev, [chapterIdx]: !prev[chapterIdx] }))
              }
            >
              <Text style={styles.chapterTitle}>{chapter.chapterTitle}</Text>
              <Text style={styles.chapterMeta}>
                {chapter.chapterContent?.length || 0} lectures | {calculateChapterTime(chapter)}
              </Text>
            </Pressable>
            {open &&
              chapter.chapterContent?.map((lecture, lectureIdx) => {
                const done = progress?.lectureCompleted?.includes(lecture.lectureId);
                return (
                  <Pressable
                    key={lecture.lectureId || lectureIdx}
                    style={styles.lectureRow}
                    onPress={() =>
                      setCurrentLecture({
                        ...lecture,
                        chapter: chapterIdx + 1,
                        lecture: lectureIdx + 1,
                      })
                    }
                  >
                    <Text style={styles.lectureText}>
                      {done ? "[Done] " : ""}
                      {lecture.lectureTitle}
                    </Text>
                    <Text style={styles.lectureTime}>{lecture.lectureDuration} min</Text>
                  </Pressable>
                );
              })}
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
    gap: 12,
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  videoWrap: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#000000",
  },
  placeholder: {
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
  },
  placeholderText: {
    color: "#CBD5E1",
  },
  currentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    gap: 8,
  },
  currentTitle: {
    fontWeight: "700",
    color: "#0F172A",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  completeBtn: {
    flex: 1,
    backgroundColor: "#2563EB",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  completeText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  notesBtn: {
    flex: 1,
    backgroundColor: "#0F172A",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  notesText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  sectionTitle: {
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
  },
  chapterHead: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  chapterTitle: {
    fontWeight: "700",
    color: "#0F172A",
  },
  chapterMeta: {
    color: "#64748B",
    fontSize: 12,
  },
  lectureRow: {
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  lectureText: {
    flex: 1,
    color: "#334155",
  },
  lectureTime: {
    color: "#64748B",
    fontSize: 12,
  },
});
