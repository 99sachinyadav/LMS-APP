import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";
import { useNavigation } from "@react-navigation/native";
import { useApp } from "../context/AppContext";
import { AppTopBar } from "../components/AppTopBar";

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={20} color="#6B7280" style={styles.infoIcon} />
      <View style={styles.infoTextWrap}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || "-----"}</Text>
      </View>
    </View>
  );
}

export function SettingsScreen() {
  const { user, userData } = useApp();
  const { signOut } = useAuth();
  const navigation = useNavigation();
  const [signingOut, setSigningOut] = useState(false);

  const profile = useMemo(() => {
    const email = userData?.email || user?.primaryEmailAddress?.emailAddress || "";
    const phone = user?.primaryPhoneNumber?.phoneNumber || "";
    const name = userData?.name || user?.fullName || user?.firstName || "Student";
    const imageUrl = userData?.imageUrl || user?.imageUrl || user?.profileImageUrl || "";
    return { name, email, phone, imageUrl };
  }, [user, userData]);

  return (
    <View style={styles.container}>
      <AppTopBar title="SDEMY" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileHead}>
          {profile.imageUrl ? (
            <Image source={{ uri: profile.imageUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Ionicons name="person-outline" size={52} color="#111827" />
            </View>
          )}
          <View style={styles.headText}>
            <Text style={styles.name}>{profile.name}</Text>
            <Pressable style={styles.editBtn}>
              <Ionicons name="create-outline" size={16} color="#0284C7" />
            </Pressable>
          </View>
        </View>

        <View style={styles.tabsRow}>
          <Text style={[styles.tabText, styles.tabActive]}>INFO</Text>
          <Pressable onPress={() => navigation.navigate("Enrollments")}>
            <Text style={styles.tabText}>COURSES</Text>
          </Pressable>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoCardHead}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>1</Text>
            </View>
            <Text style={styles.cardTitle}>Basic Information</Text>
            <Pressable style={styles.inlineEdit}>
              <Ionicons name="create-outline" size={18} color="#0284C7" />
              <Text style={styles.inlineEditText}>Edit</Text>
            </Pressable>
          </View>

          <InfoRow icon="person-outline" label="Name" value={profile.name} />
          <InfoRow icon="call-outline" label="Mobile Number" value={profile.phone} />
          <InfoRow icon="mail-outline" label="Email" value={profile.email} />
          <InfoRow icon="information-circle-outline" label="About" value="" />
          <InfoRow icon="id-card-outline" label="Roll Number" value="" />
          <InfoRow icon="calendar-outline" label="Date of Joining" value="" />
        </View>

        <Pressable
          style={styles.signOutBtn}
          onPress={async () => {
            try {
              setSigningOut(true);
              await signOut();
            } catch {
              Alert.alert("Error", "Failed to sign out.");
            } finally {
              setSigningOut(false);
            }
          }}
        >
          <Text style={styles.signOutText}>
            {signingOut ? "Signing out..." : "Sign Out"}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EFEFEF",
  },
  content: {
    paddingBottom: 120,
  },
  profileHead: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "#E5E7EB",
  },
  headText: {
    marginLeft: 18,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  name: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1F2937",
    flex: 1,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  tabsRow: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tabText: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "700",
  },
  tabActive: {
    color: "#111827",
    borderBottomWidth: 3,
    borderBottomColor: "#000000",
  },
  infoCard: {
    marginTop: 10,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  infoCardHead: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  cardTitle: {
    marginLeft: 12,
    fontSize: 18,
    fontWeight: "700",
    color: "#374151",
    flex: 1,
  },
  inlineEdit: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  inlineEditText: {
    color: "#0284C7",
    fontWeight: "700",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  infoIcon: {
    marginTop: 2,
    width: 24,
  },
  infoTextWrap: {
    marginLeft: 14,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  infoValue: {
    marginTop: 4,
    fontSize: 20,
    color: "#111827",
  },
  signOutBtn: {
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#111827",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 12,
  },
  signOutText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
});
