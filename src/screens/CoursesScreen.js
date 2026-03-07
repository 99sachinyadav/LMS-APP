import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useApp } from "../context/AppContext";
import { CourseListItem } from "../components/CourseListItem";
import { AppTopBar } from "../components/AppTopBar";

export function CoursesScreen({ navigation }) {
  const { allCourses, currency, loadingCourses, fetchAllCourses, fetchCourseById } =
    useApp();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!allCourses.length) fetchAllCourses();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allCourses;
    return allCourses.filter((course) =>
      course.courseTitle?.toLowerCase().includes(q),
    );
  }, [query, allCourses]);

  return (
    <View style={styles.container}>
      <AppTopBar title="SDEMY" />
      <View style={styles.body}>
        <Text style={styles.title}>Courses ({filtered.length})</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by course title"
          style={styles.input}
          autoCapitalize="none"
        />
        {loadingCourses ? (
          <ActivityIndicator size="large" color="#2563EB" style={styles.loader} />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <CourseListItem
                course={item}
                currency={currency}
                fetchCourseById={fetchCourseById}
                onPress={() =>
                  navigation.navigate("CourseDetails", { courseId: item._id })
                }
              />
            )}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<Text style={styles.empty}>No courses found.</Text>}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EFEFEF",
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#374151",
  },
  input: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#F8FAFC",
  },
  loader: {
    marginTop: 36,
  },
  list: {
    paddingVertical: 8,
  },
  empty: {
    marginTop: 20,
    color: "#64748B",
  },
});
