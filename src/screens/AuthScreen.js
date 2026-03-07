import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useOAuth, useSignIn, useSignUp } from "@clerk/clerk-expo";

WebBrowser.maybeCompleteAuthSession();

export function AuthScreen() {
  const [mode, setMode] = useState("signin");

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.pageContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.brandPill}>
        <Text style={styles.brandPillText}>SDEMY</Text>
      </View>
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>Continue your learning journey</Text>

      <View style={styles.authCard}>
        <View style={styles.tabRow}>
          <Pressable
            style={[styles.tabBtn, mode === "signin" ? styles.tabActive : null]}
            onPress={() => setMode("signin")}
          >
            <Text style={mode === "signin" ? styles.tabActiveText : styles.tabText}>
              Sign In
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabBtn, mode === "signup" ? styles.tabActive : null]}
            onPress={() => setMode("signup")}
          >
            <Text style={mode === "signup" ? styles.tabActiveText : styles.tabText}>
              Sign Up
            </Text>
          </Pressable>
        </View>
        <GoogleOAuthButton />
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or use email</Text>
          <View style={styles.dividerLine} />
        </View>
        {mode === "signin" ? <SignInForm /> : <SignUpForm />}
      </View>
    </ScrollView>
  );
}

function GoogleOAuthButton() {
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const onGooglePress = async () => {
    setLoadingGoogle(true);
    try {
      const { createdSessionId, setActive } = await startOAuthFlow();
      if (createdSessionId) {
        await setActive?.({ session: createdSessionId });
      } else {
        Alert.alert("Google sign-in", "Could not complete Google sign-in.");
      }
    } catch (error) {
      const message =
        error?.errors?.[0]?.message || error?.message || "Google sign-in failed.";
      Alert.alert("Google sign-in", message);
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <Pressable
      style={styles.googleBtn}
      onPress={onGooglePress}
      disabled={loadingGoogle}
    >
      {loadingGoogle ? (
        <ActivityIndicator color="#0F172A" />
      ) : (
        <Text style={styles.googleBtnText}>Continue with Google</Text>
      )}
    </Pressable>
  );
}

function SignInForm() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!isLoaded) return;
    setLoading(true);
    setError("");
    try {
      console.log("[Auth][SignIn] Starting sign in for:", email.trim());
      const result = await signIn.create({
        identifier: email.trim(),
        password,
      });
      console.log("[Auth][SignIn] Result status:", result?.status);
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        console.log("[Auth][SignIn] Session activated.");
      } else {
        setError("Additional verification is required for this account.");
      }
    } catch (e) {
      const message = e?.errors?.[0]?.message || e?.message || "Unable to sign in.";
      console.log("[Auth][SignIn] Error:", JSON.stringify(e, null, 2));
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.form}>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        secureTextEntry
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.submitBtn} onPress={onSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>Sign In</Text>
        )}
      </Pressable>
    </View>
  );
}

function SignUpForm() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onStartSignUp = async () => {
    if (!isLoaded) return;
    setLoading(true);
    setError("");
    try {
      console.log("[Auth][SignUp] Step 1: create signup for:", email.trim());
      await signUp.create({
        emailAddress: email.trim(),
        password,
      });
      console.log("[Auth][SignUp] Step 2: request email verification code.");
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
      Alert.alert(
        "Verification code sent",
        "Check your inbox and spam folder for the Clerk verification email."
      );
      console.log("[Auth][SignUp] Verification code requested successfully.");
    } catch (e) {
      const message = e?.errors?.[0]?.message || e?.message || "Unable to sign up.";
      console.log("[Auth][SignUp] Error:", JSON.stringify(e, null, 2));
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async () => {
    if (!isLoaded) return;
    setLoading(true);
    setError("");
    try {
      console.log("[Auth][SignUp] Step 3: verify email code.");
      const result = await signUp.attemptEmailAddressVerification({ code });
      console.log("[Auth][SignUp] Verify status:", result?.status);
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        console.log("[Auth][SignUp] Session activated after verification.");
      } else {
        setError("Verification not complete yet.");
      }
    } catch (e) {
      const message =
        e?.errors?.[0]?.message || e?.message || "Invalid verification code.";
      console.log("[Auth][SignUp] Verify error:", JSON.stringify(e, null, 2));
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.form}>
      {!pendingVerification ? (
        <>
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            secureTextEntry
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable
            style={styles.submitBtn}
            onPress={onStartSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Create Account</Text>
            )}
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.helpText}>
            Enter the verification code sent to your email.
          </Text>
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            placeholder="Verification code"
            value={code}
            onChangeText={setCode}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable style={styles.submitBtn} onPress={onVerify} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Verify Email</Text>
            )}
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#EEF2FF",
  },
  pageContent: {
    paddingHorizontal: 18,
    paddingTop: 58,
    paddingBottom: 36,
  },
  brandPill: {
    alignSelf: "flex-start",
    backgroundColor: "#0F172A",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  brandPillText: {
    color: "#FFFFFF",
    fontWeight: "800",
    letterSpacing: 1,
  },
  title: {
    marginTop: 16,
    fontSize: 32,
    fontWeight: "800",
    color: "#0F172A",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: "#475569",
  },
  authCard: {
    marginTop: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    shadowColor: "#1E293B",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    borderRadius: 10,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "#FFFFFF",
  },
  tabText: {
    color: "#475569",
    fontWeight: "700",
  },
  tabActiveText: {
    color: "#0F172A",
    fontWeight: "800",
  },
  form: {
    marginTop: 12,
    gap: 12,
  },
  dividerRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  dividerText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
  },
  googleBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  googleBtnText: {
    color: "#0F172A",
    fontWeight: "700",
  },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
  },
  submitBtn: {
    backgroundColor: "#2563EB",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  submitText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  error: {
    color: "#DC2626",
    fontSize: 12,
  },
  helpText: {
    color: "#475569",
    fontSize: 13,
  },
});
