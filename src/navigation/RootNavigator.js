import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { HomeScreen } from "../screens/HomeScreen";
import { CoursesScreen } from "../screens/CoursesScreen";
import { CourseDetailsScreen } from "../screens/CourseDetailsScreen";
import { EnrollmentsScreen } from "../screens/EnrollmentsScreen";
import { PlayerScreen } from "../screens/PlayerScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { AuthScreen } from "../screens/AuthScreen";
import { CheckoutScreen } from "../screens/CheckoutScreen";
import { NotesScreen } from "../screens/NotesScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          const iconByRoute = {
            Home: "home-outline",
            Courses: "storefront-outline",
            Enrollments: "play-circle-outline",
            Settings: "person-circle-outline",
          };
          const iconName = iconByRoute[route.name] || "ellipse-outline";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#0284C7",
        tabBarInactiveTintColor: "#6B7280",
        tabBarLabelStyle: {
          fontWeight: "600",
          fontSize: 12,
        },
        tabBarStyle: {
          position: "absolute",
          left: 12,
          right: 12,
          bottom: 10,
          height: 62,
          paddingBottom: 6,
          paddingTop: 4,
          borderRadius: 16,
          backgroundColor: "#FFFFFF",
          shadowColor: "#000000",
          shadowOpacity: 0.12,
          shadowRadius: 8,
          elevation: 8,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: "Home" }} />
      <Tab.Screen name="Courses" component={CoursesScreen} options={{ title: "Store" }} />
      <Tab.Screen
        name="Enrollments"
        component={EnrollmentsScreen}
        options={{ title: "Enrollments" }}
      />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: "Profile" }} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return null;
  if (!isSignedIn) return <AuthScreen />;

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CourseDetails"
        component={CourseDetailsScreen}
        options={{ title: "Course Details" }}
      />
      <Stack.Screen
        name="Player"
        component={PlayerScreen}
        options={{ title: "Course Player" }}
      />
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{ title: "Checkout" }}
      />
      <Stack.Screen
        name="Notes"
        component={NotesScreen}
        options={{ title: "Lecture Notes" }}
      />
    </Stack.Navigator>
  );
}
