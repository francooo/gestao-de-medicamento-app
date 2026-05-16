import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp } from "@/contexts/AppContext";
import Colors from "@/constants/colors";

export default function SafetyCheckScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const { medicationId, doseAmount, unit, timeOffset } = useLocalSearchParams<{
    medicationId: string;
    doseAmount: string;
    unit: string;
    timeOffset: string;
  }>();
  const { medications, selectedProfile, addDoseLog } = useApp();

  const C = isDark ? Colors.dark : Colors.light;
  const med = medications.find((m) => m.id === medicationId);

  async function handleLogAnyway() {
    if (!med || !selectedProfile) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    const ts = Date.now() - parseInt(timeOffset ?? "0") * 60000;
    addDoseLog({
      profileId: selectedProfile.id,
      medicationId: med.id,
      medicationName: med.name,
      dose: parseFloat(doseAmount ?? "0"),
      unit: unit ?? "ml",
      timestamp: ts,
      type: "dose",
    });
    router.dismissAll();
  }

  async function handleCancel() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }

  return (
    <View style={styles.overlay}>
      <View style={[StyleSheet.absoluteFill, styles.backdrop]} />

      <View style={[styles.modal, { backgroundColor: isDark ? Colors.surfaceDark : Colors.surfaceLight }]}>
        {/* Close */}
        <Pressable style={styles.closeBtn} onPress={handleCancel}>
          <Ionicons name="close" size={22} color={C.textMuted} />
        </Pressable>

        {/* Icon */}
        <View style={styles.iconArea}>
          <View style={styles.iconGlow} />
          <View style={[styles.iconCircle, { backgroundColor: Colors.roseLight }]}>
            <Ionicons name="shield-checkmark" size={52} color={Colors.gentleRose} />
          </View>
        </View>

        {/* Content */}
        <View style={styles.textArea}>
          <Text style={[styles.title, { color: C.text }]}>Só um momento</Text>

          <View style={[styles.infoBox, { backgroundColor: isDark ? Colors.backgroundDark : Colors.surfaceLight, borderColor: isDark ? Colors.borderDark : "#f1f5f4" }]}>
            <Text style={[styles.infoText, { color: C.text }]}>
              Você registrou <Text style={[styles.infoStrong, { color: C.text }]}>{med?.name ?? "este medicamento"}</Text> há menos de{" "}
              <Text style={[styles.infoStrong, { color: C.text }]}>{med?.intervalHours ?? 6} horas</Text>.
            </Text>
            <View style={styles.warningRow}>
              <Ionicons name="information-circle" size={18} color={Colors.gentleRose} />
              <Text style={[styles.warningText, { color: C.textMuted }]}>
                Este medicamento requer um intervalo de{" "}
                <Text style={{ fontFamily: "Inter_700Bold", color: Colors.gentleRose }}>
                  {med?.intervalHours ?? 6} horas
                </Text>{" "}
                entre doses para ser seguro.
              </Text>
            </View>
          </View>

          <Text style={[styles.questionText, { color: C.textMuted }]}>
            Tem certeza de que deseja continuar?
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.cancelBtn,
              { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
            ]}
            onPress={handleCancel}
          >
            <Ionicons name="close-circle" size={20} color={Colors.primaryContent} />
            <Text style={styles.cancelBtnText}>Cancelar e Aguardar</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.logAnywayBtn, { opacity: pressed ? 0.9 : 1 }]}
            onPress={handleLogAnyway}
          >
            <Text style={[styles.logAnywayText, { color: C.textMuted }]}>Registrar Mesmo Assim</Text>
          </Pressable>
        </View>

        {/* Bottom accent */}
        <View style={styles.bottomAccent}>
          <View style={styles.bottomAccentFill} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  backdrop: {
    backgroundColor: "rgba(246,248,247,0.6)",
  },
  modal: {
    width: "100%",
    maxWidth: 460,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "rgba(31,38,135,0.1)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 32,
    elevation: 10,
  },
  closeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  iconArea: {
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 8,
  },
  iconGlow: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.gentleRose + "20",
    transform: [{ scaleX: 1.5 }],
    top: 24,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  textArea: {
    padding: 24,
    gap: 16,
    alignItems: "center",
  },
  title: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  infoBox: {
    width: "100%",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
  },
  infoText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  infoStrong: {
    fontFamily: "Inter_700Bold",
  },
  warningRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  questionText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  actions: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    gap: 8,
  },
  cancelBtn: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  cancelBtnText: {
    color: Colors.primaryContent,
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    letterSpacing: 0.2,
  },
  logAnywayBtn: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  logAnywayText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  bottomAccent: {
    height: 6,
    backgroundColor: "#f1f5f4",
    overflow: "hidden",
  },
  bottomAccentFill: {
    width: "33%",
    height: "100%",
    backgroundColor: Colors.gentleRose,
    alignSelf: "center",
    borderRadius: 3,
    opacity: 0.5,
  },
});
