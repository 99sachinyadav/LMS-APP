import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useApp } from "../context/AppContext";

export function AppTopBar({ title }) {
  const navigation = useNavigation();
  const { user, userData } = useApp();
  const imageUrl = userData?.imageUrl || user?.imageUrl || user?.profileImageUrl || "";

  return (
    <View style={styles.wrap}>
      <Text numberOfLines={1} style={styles.title}>
        {title}
      </Text>
      <Pressable
        style={styles.iconBtn}
        onPress={() => navigation.navigate("Settings")}
      >
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.avatar} />
        ) : (
          <Ionicons name="person-circle-outline" size={26} color="#FFFFFF" />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "#000000",
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 28,
    alignItems: "center",
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  title: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
});
