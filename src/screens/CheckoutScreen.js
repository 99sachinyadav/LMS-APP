import React, { useMemo, useRef } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { env } from "../config/env";
import { useApp } from "../context/AppContext";

export function CheckoutScreen({ route, navigation }) {
  const { sessionUrl } = route.params || {};
  const handledRef = useRef(false);
  const { fetchUserEnrolledCourses } = useApp();

  const normalizedSessionUrl = useMemo(() => {
    if (!sessionUrl) return "";
    return /^https?:\/\//i.test(sessionUrl)
      ? sessionUrl
      : `https://${sessionUrl}`;
  }, [sessionUrl]);

  const successPath = "/loading/my-enrollments";
  const cancelPath = "/";

  const handleMaybeRedirect = async (url = "") => {
    if (!url || handledRef.current) return;

    const isSuccess = url.includes(successPath);
    if (isSuccess) {
      handledRef.current = true;
      await fetchUserEnrolledCourses();
      navigation.reset({
        index: 0,
        routes: [{ name: "MainTabs", params: { screen: "Enrollments" } }],
      });
      return;
    }

    const appOrigin = env.checkoutOrigin;
    const normalizedOrigin = appOrigin.endsWith("/")
      ? appOrigin.slice(0, -1)
      : appOrigin;
    const isCancel = url === normalizedOrigin + cancelPath;
    if (isCancel) {
      handledRef.current = true;
      navigation.goBack();
    }
  };

  if (!normalizedSessionUrl) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <WebView
      source={{ uri: normalizedSessionUrl }}
      onNavigationStateChange={(state) => {
        handleMaybeRedirect(state?.url);
      }}
      onShouldStartLoadWithRequest={(request) => {
        handleMaybeRedirect(request?.url);
        return true;
      }}
      startInLoadingState
      renderLoading={() => (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
});
