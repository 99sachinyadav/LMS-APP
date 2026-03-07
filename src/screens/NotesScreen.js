import React, { useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

export function NotesScreen({ route }) {
  const { notesUrl } = route.params || {};

  const normalizedNotesUrl = useMemo(() => {
    if (!notesUrl) return "";
    return /^https?:\/\//i.test(notesUrl) ? notesUrl : `https://${notesUrl}`;
  }, [notesUrl]);

  const pdfJsViewerUrl = useMemo(() => {
    if (!normalizedNotesUrl) return "";
    return `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(normalizedNotesUrl)}`;
  }, [normalizedNotesUrl]);

  const gviewUrl = useMemo(() => {
    if (!normalizedNotesUrl) return "";
    return `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(normalizedNotesUrl)}`;
  }, [normalizedNotesUrl]);

  const [viewerUrl, setViewerUrl] = useState(pdfJsViewerUrl);
  const [triedFallback, setTriedFallback] = useState(false);

  if (!normalizedNotesUrl) {
    return (
      <View style={styles.center}>
        <Text>Notes URL is missing.</Text>
      </View>
    );
  }

  return (
    <WebView
      source={{ uri: viewerUrl }}
      onError={() => {
        if (triedFallback) return;
        setTriedFallback(true);
        setViewerUrl(gviewUrl);
      }}
      startInLoadingState
      renderLoading={() => (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
});
