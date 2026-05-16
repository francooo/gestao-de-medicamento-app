import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useColorScheme,
  Platform,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp } from "@/contexts/AppContext";
import Colors from "@/constants/colors";

export default function WeightCheckScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const { profileId } = useLocalSearchParams<{ profileId: string }>();
  const { profiles, updateProfile } = useApp();

  const C = isDark ? Colors.dark : Colors.light;

  const profile = profiles.find((p) => p.id === profileId);
  const [weight, setWeight] = useState(profile?.weight?.toString() ?? "14.0");

  function increment() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setWeight((v) => (parseFloat(v) + 0.1).toFixed(1));
  }

  function decrement() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setWeight((v) => Math.max(0, parseFloat(v) - 0.1).toFixed(1));
  }

  async function handleConfirm() {
    if (!profile) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await updateProfile(profile.id, {
        weight: parseFloat(weight),
        weightVerifiedAt: Date.now(),
      });
    } catch (err) {
      console.error("Failed to update weight:", err);
    }
    router.back();
  }

  return (
    <View style={[styles.overlay]}>
      {/* Blurred backdrop */}
      <View style={[StyleSheet.absoluteFill, styles.backdrop]} />

      <View style={[styles.modal, { backgroundColor: isDark ? Colors.surfaceDark : Colors.surfaceLight }]}>
        {/* Close */}
        <View style={styles.closeRow}>
          <Pressable style={styles.closeBtn} onPress={() => router.back()}>
            <Ionicons name="close" size={22} color={C.textMuted} />
          </Pressable>
        </View>

        {/* Heading */}
        <View style={styles.heading}>
          <Text style={[styles.title, { color: C.text }]}>Vamos ser precisos</Text>
          <Text style={[styles.subtitle, { color: C.textMuted }]}>
            Qual é o peso atual de {profile?.name ?? "o paciente"}?
          </Text>
        </View>

        {/* Input */}
        <View style={styles.inputArea}>
          <View style={styles.stepperRow}>
            <Pressable
              style={[styles.stepBtn, { backgroundColor: isDark ? Colors.backgroundDark : Colors.backgroundLight }]}
              onPress={decrement}
            >
              <Ionicons name="remove" size={22} color={C.textMuted} />
            </Pressable>

            <View style={styles.valueWrapper}>
              <TextInput
                style={[styles.valueInput, { color: C.text }]}
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                selectTextOnFocus
              />
              <Text style={[styles.unitLabel, { color: C.textMuted }]}>kg</Text>
              <View style={[styles.underline, { backgroundColor: isDark ? Colors.backgroundDark : Colors.backgroundLight }]}>
                <View style={styles.underlineFill} />
              </View>
            </View>

            <Pressable
              style={[styles.stepBtn, { backgroundColor: isDark ? Colors.backgroundDark : Colors.backgroundLight }]}
              onPress={increment}
            >
              <Ionicons name="add" size={22} color={C.textMuted} />
            </Pressable>
          </View>

          {/* Last logged */}
          <View style={[styles.lastLogged, { backgroundColor: Colors.primary + "14" }]}>
            <Ionicons name="time" size={14} color={Colors.primary} />
            <Text style={[styles.lastLoggedText, { color: C.textMuted }]}>
              Último registro: {profile?.weight}kg (há 2 semanas)
            </Text>
          </View>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Ionicons name="information-circle" size={18} color="#ef4444" />
          <Text style={styles.disclaimerText}>
            Segurança em primeiro lugar: A dosagem será calculada com base nesse valor. Por favor, confirme se está correto.
          </Text>
        </View>

        {/* CTA */}
        <Pressable
          style={({ pressed }) => [
            styles.ctaBtn,
            { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}
          onPress={handleConfirm}
        >
          <Text style={styles.ctaBtnText}>Calcular Dose Segura</Text>
          <Ionicons name="arrow-forward" size={20} color={Colors.primaryContent} />
        </Pressable>
      </View>

      {/* Background orb */}
      <View style={styles.orb} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  backdrop: {
    backgroundColor: "rgba(16,34,29,0.65)",
  },
  modal: {
    width: "100%",
    maxWidth: 460,
    borderRadius: 28,
    padding: 24,
    gap: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 10,
    zIndex: 2,
  },
  closeRow: { alignItems: "flex-end" },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  heading: { alignItems: "center", gap: 8 },
  title: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 17,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  inputArea: { gap: 16 },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  stepBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  valueWrapper: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  valueInput: {
    fontSize: 64,
    fontFamily: "Inter_700Bold",
    letterSpacing: -2,
    minWidth: 140,
    textAlign: "center",
  },
  unitLabel: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    marginTop: 8,
    marginLeft: 4,
  },
  underline: {
    position: "absolute",
    bottom: -4,
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  underlineFill: {
    height: "100%",
    width: "100%",
    backgroundColor: Colors.primary,
  },
  lastLogged: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: "center",
  },
  lastLoggedText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  disclaimer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#fef2f2",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  disclaimerText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#991b1b",
    lineHeight: 20,
  },
  ctaBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 28,
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  ctaBtnText: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.primaryContent,
  },
  orb: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: Colors.primary + "20",
    zIndex: 0,
  },
});
