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
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useApp } from "@/contexts/AppContext";
import Colors from "@/constants/colors";

type Mode = "login" | "register";

export default function WelcomeScreen() {
  const { login, register } = useApp();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const C = isDark ? Colors.dark : Colors.light;

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) {
      setError("Por favor, preencha e-mail e senha.");
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setError(null);
    try {
      if (mode === "login") {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password);
      }
      router.replace("/(tabs)");
    } catch (err: any) {
      setError(err.message || (mode === "login" ? "Falha ao entrar" : "Falha ao criar conta"));
    } finally {
      setLoading(false);
    }
  }

  function toggleMode() {
    setMode((m) => (m === "login" ? "register" : "login"));
    setError(null);
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? Colors.backgroundDark : Colors.backgroundLight }]}>
      <View style={[styles.heroArea, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) }]}>
        <LinearGradient
          colors={isDark ? ["#152e27", Colors.backgroundDark] : ["#e8f5f1", Colors.backgroundLight]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        <View style={[styles.blob1, { backgroundColor: isDark ? "rgba(43,238,186,0.08)" : "rgba(43,238,186,0.12)" }]} />
        <View style={[styles.blob2, { backgroundColor: isDark ? "rgba(184,184,209,0.06)" : "rgba(184,184,209,0.15)" }]} />
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
          <View style={styles.brandRow}>
            <View style={[styles.brandIcon, { backgroundColor: isDark ? Colors.surfaceDark : Colors.surfaceLight }]}>
              <Ionicons name="leaf" size={28} color={Colors.primary} />
            </View>
          </View>
          <Text style={[styles.title, { color: C.text }]}>Gentle Care</Text>
          <Text style={[styles.subtitle, { color: C.textMuted }]}>Saúde da família, simplificada.</Text>

          <View style={styles.actions}>
            {error ? (
              <View style={[styles.errorBox, { backgroundColor: isDark ? "rgba(232,157,157,0.15)" : "rgba(232,157,157,0.2)" }]}>
                <Ionicons name="alert-circle-outline" size={16} color={Colors.gentleRose} />
                <Text style={[styles.errorText, { color: Colors.gentleRose }]}>{error}</Text>
              </View>
            ) : null}

            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: isDark ? Colors.surfaceDark : "#E8F1EE",
                  borderColor: emailFocused ? Colors.primary : "transparent",
                  borderWidth: 2,
                },
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={20}
                color={emailFocused ? Colors.primary : Colors.gentleSage}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: C.text }]}
                placeholder="seuemail@exemplo.com"
                placeholderTextColor={Colors.gentleSage}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                editable={!loading}
              />
            </View>

            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: isDark ? Colors.surfaceDark : "#E8F1EE",
                  borderColor: passwordFocused ? Colors.primary : "transparent",
                  borderWidth: 2,
                },
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={passwordFocused ? Colors.primary : Colors.gentleSage}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: C.text }]}
                placeholder={mode === "register" ? "Mínimo 6 caracteres" : "Sua senha"}
                placeholderTextColor={Colors.gentleSage}
                secureTextEntry
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                editable={!loading}
                onSubmitEditing={handleSubmit}
              />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.loginButton,
                {
                  opacity: pressed || loading ? 0.85 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.primaryContent} size="small" />
              ) : (
                <>
                  <Text style={styles.loginButtonText}>
                    {mode === "login" ? "Entrar" : "Criar conta"}
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color={Colors.primaryContent} />
                </>
              )}
            </Pressable>

            <View style={styles.signupRow}>
              <Text style={[styles.signupText, { color: C.textMuted }]}>
                {mode === "login" ? "Novo por aqui?" : "Já tem uma conta?"}
              </Text>
              <Pressable onPress={toggleMode} disabled={loading}>
                <Text style={[styles.signupLink, { color: Colors.primaryDark }]}>
                  {mode === "login" ? "Criar uma conta" : "Entrar"}
                </Text>
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
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
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
