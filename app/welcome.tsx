import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  useColorScheme,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/contexts/AppContext";
import Colors from "@/constants/colors";

export default function WelcomeScreen() {
  const { setAuthenticated } = useApp();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const C = isDark ? Colors.dark : Colors.light;

  async function handleLogin() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await setAuthenticated(true);
    router.replace("/(tabs)");
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? Colors.backgroundDark : Colors.backgroundLight }]}>
      {/* Top illustration area */}
      <View style={[styles.heroArea, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) }]}>
        <LinearGradient
          colors={isDark ? ["#152e27", Colors.backgroundDark] : ["#e8f5f1", Colors.backgroundLight]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        {/* Decorative blobs */}
        <View style={[styles.blob1, { backgroundColor: isDark ? "rgba(43,238,186,0.08)" : "rgba(43,238,186,0.12)" }]} />
        <View style={[styles.blob2, { backgroundColor: isDark ? "rgba(184,184,209,0.06)" : "rgba(184,184,209,0.15)" }]} />

        {/* Illustration */}
        <View style={styles.illustrationWrapper}>
          <Image
            source={require("@/assets/images/icon.png")}
            style={styles.heroIcon}
            resizeMode="contain"
          />
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.bottomSection}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 16) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand */}
          <View style={styles.brandRow}>
            <View style={[styles.brandIcon, { backgroundColor: isDark ? Colors.surfaceDark : Colors.surfaceLight }]}>
              <Ionicons name="leaf" size={28} color={Colors.primary} />
            </View>
          </View>
          <Text style={[styles.title, { color: C.text }]}>Gentle Care</Text>
          <Text style={[styles.subtitle, { color: C.textMuted }]}>Health tracking, simplified.</Text>

          <View style={styles.actions}>
            {/* Google button */}
            <Pressable
              style={({ pressed }) => [
                styles.googleButton,
                {
                  backgroundColor: isDark ? Colors.surfaceDark : Colors.surfaceLight,
                  borderColor: isDark ? Colors.borderDark : Colors.border,
                  opacity: pressed ? 0.85 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
              onPress={handleLogin}
            >
              <View style={styles.googleLogoRow}>
                <MaterialIcons name="language" size={20} color={Colors.primary} />
              </View>
              <Text style={[styles.googleButtonText, { color: C.text }]}>Continue with Google</Text>
            </Pressable>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#e2ece9" }]} />
              <Text style={[styles.dividerText, { color: Colors.gentleSage }]}>Or login with email</Text>
              <View style={[styles.dividerLine, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#e2ece9" }]} />
            </View>

            {/* Email input */}
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: isDark ? Colors.surfaceDark : "#E8F1EE",
                  borderColor: isFocused ? Colors.primary : "transparent",
                  borderWidth: 2,
                },
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={20}
                color={isFocused ? Colors.primary : Colors.gentleSage}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: C.text }]}
                placeholder="hello@email.com"
                placeholderTextColor={Colors.gentleSage}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              />
            </View>

            {/* Login CTA */}
            <Pressable
              style={({ pressed }) => [
                styles.loginButton,
                {
                  opacity: pressed ? 0.9 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
              onPress={handleLogin}
            >
              <Text style={styles.loginButtonText}>Step Inside</Text>
              <Ionicons name="arrow-forward" size={20} color={Colors.primaryContent} />
            </Pressable>

            {/* Sign up link */}
            <View style={styles.signupRow}>
              <Text style={[styles.signupText, { color: C.textMuted }]}>New here?</Text>
              <Pressable onPress={handleLogin}>
                <Text style={[styles.signupLink, { color: Colors.primaryDark }]}>Create an account</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroArea: {
    height: "42%",
    minHeight: 280,
    alignItems: "center",
    justifyContent: "flex-end",
    overflow: "hidden",
    borderBottomLeftRadius: 48,
    borderBottomRightRadius: 48,
  },
  blob1: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    top: 20,
    right: -40,
    transform: [{ scaleX: 1.2 }],
  },
  blob2: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    top: 60,
    left: -50,
  },
  illustrationWrapper: {
    width: 160,
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroIcon: {
    width: 140,
    height: 140,
    borderRadius: 36,
  },
  bottomSection: { flex: 1 },
  content: {
    paddingHorizontal: 28,
    paddingTop: 24,
  },
  brandRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 12,
  },
  brandIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 32,
    letterSpacing: 0.2,
  },
  actions: { gap: 16 },
  googleButton: {
    height: 56,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  googleLogoRow: {
    position: "absolute",
    left: 20,
  },
  googleButtonText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.2,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  inputContainer: {
    height: 56,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  inputIcon: { marginRight: 12 },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  loginButton: {
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  loginButtonText: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.primaryContent,
  },
  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  signupText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  signupLink: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
});
