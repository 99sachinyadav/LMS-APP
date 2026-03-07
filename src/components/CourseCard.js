import React from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { calculateRating } from "../utils/course";

export function CourseCard({ course, currency = "$", onPress }) {
  const salePrice = (
    course.coursePrice -
    (course.discount * course.coursePrice) / 100
  ).toFixed(2);

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <Image source={{ uri: course.courseThumbnail }} style={styles.thumb} />
      <View style={styles.body}>
        <Text numberOfLines={2} style={styles.title}>
          {course.courseTitle}
        </Text>
        <Text style={styles.meta}>Rating: {calculateRating(course)} / 5</Text>
        <View style={styles.priceRow}>
          <Text style={styles.sale}>
            {currency}
            {salePrice}
          </Text>
          <Text style={styles.original}>
            {currency}
            {course.coursePrice}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
    overflow: "hidden",
  },
  thumb: {
    width: "100%",
    height: 160,
    backgroundColor: "#F3F4F6",
  },
  body: {
    padding: 12,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  meta: {
    fontSize: 13,
    color: "#4B5563",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sale: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1D4ED8",
  },
  original: {
    fontSize: 13,
    color: "#6B7280",
    textDecorationLine: "line-through",
  },
});
