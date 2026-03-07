import React, { useEffect, useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

const getFreeLectureCountFromCourse = (inputCourse) => {
  if (!Array.isArray(inputCourse?.courseContent)) return null;
  return (inputCourse?.courseContent || []).reduce((sum, chapter) => {
    const count = (chapter?.chapterContent || []).filter(
      (lecture) => lecture?.isPreviewFree,
    ).length;
    return sum + count;
  }, 0);
};

export function CourseListItem({
  course,
  currency = "$",
  onPress,
  fetchCourseById,
}) {
  const discount = Number(course.discount || 0);
  const basePrice = Number(course.coursePrice || 0);
  const salePrice = (basePrice - (discount * basePrice) / 100).toFixed(0);
  const initialFreeCount = useMemo(
    () => getFreeLectureCountFromCourse(course),
    [course],
  );
  const [freeLectures, setFreeLectures] = useState(initialFreeCount);

  useEffect(() => {
    setFreeLectures(initialFreeCount);
  }, [initialFreeCount]);

  useEffect(() => {
    if (freeLectures !== null || !fetchCourseById || !course?._id) return;
    let mounted = true;
    (async () => {
      const fullCourse = await fetchCourseById(course._id);
      if (!mounted || !fullCourse) return;
      setFreeLectures(getFreeLectureCountFromCourse(fullCourse));
    })();
    return () => {
      mounted = false;
    };
  }, [course?._id, fetchCourseById, freeLectures]);

  const freeTag =
    freeLectures === null ? "FREE CONTENT" : `FREE ${freeLectures} LECTURES`;
  const tags = [freeTag, "VIDEOS"];

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <View style={styles.imageWrap}>
          <Image source={{ uri: course.courseThumbnail }} style={styles.image} />
          <View style={styles.couponPill}>
            <Text style={styles.couponText}>COUPONS</Text>
          </View>
        </View>
        <View style={styles.info}>
          <View style={styles.tagRow}>
            <View style={[styles.tag, styles.newTag]}>
              <Text style={[styles.tagText, styles.newTagText]}>NEW</Text>
            </View>
            {tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
          <Text numberOfLines={2} style={styles.title}>
            {course.courseTitle}
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.sale}>
              {currency} {salePrice}
            </Text>
            <Text style={styles.strike}>
              {currency} {basePrice.toFixed(0)}
            </Text>
            <Text style={styles.off}>{discount}% OFF</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingVertical: 14,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  imageWrap: {
    width: 132,
    position: "relative",
    paddingBottom: 30,
  },
  image: {
    width: "100%",
    height: 95,
    borderRadius: 10,
    backgroundColor: "#E5E7EB",
  },
  couponPill: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 0,
    backgroundColor: "#F97316",
    borderRadius: 8,
    alignItems: "center",
    paddingVertical: 8,
  },
  couponText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  info: {
    flex: 1,
    gap: 8,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    backgroundColor: "#ECEFF3",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 11,
    color: "#4B5563",
    fontWeight: "600",
  },
  newTag: {
    backgroundColor: "#EF4444",
  },
  newTagText: {
    color: "#FFFFFF",
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1F2937",
    lineHeight: 24,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sale: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1F2937",
  },
  strike: {
    fontSize: 16,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  off: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F97316",
  },
});
