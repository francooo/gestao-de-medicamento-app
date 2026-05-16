import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useColorScheme,
  Platform,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp } from "@/contexts/AppContext";
import Colors from "@/constants/colors";

const TIME_OPTIONS = [
  { label: "Agora", offset: 0 },
  { label: "15min atrás", offset: 15 },
  { label: "30min atrás", offset: 30 },
  { label: "1h atrás", offset: 60 },
];

export default function DoseLoggerScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const { medicationId } = useLocalSearchParams<{ medicationId: string }>();
  const { medications, selectedProfile, addDoseLog, getLastDoseLog } = useApp();

  const C = isDark ? Colors.dark : Colors.light;

  const med = useMemo(() => medications.find((m) => m.id === medicationId), [medications, medicationId]);
  const [doseAmount, setDoseAmount] = useState(5);
  const [selectedUnit, setSelectedUnit] = useState(med?.unit ?? "ml");
  const [selectedTimeIdx, setSelectedTimeIdx] = useState(0);

  const lastLog = med ? getLastDoseLog(med.id) : null;
  const lastLogHoursAgo = lastLog ? (Date.now() - lastLog.timestamp) / 3600000 : null;
  const isOverlapping = lastLogHoursAgo !== null && med !== undefined && lastLogHoursAgo < med.intervalHours;

  const safeMin = selectedProfile ? Math.round((selectedProfile.weight * 5) / 10) : 0;
  const safeMax = selectedProfile ? Math.round((selectedProfile.weight * 7) / 10) : 0;
  const maxDose = 15;
  const progressFraction = Math.min(doseAmount / maxDose, 1);

  function increment() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDoseAmount((v) => Math.min(v + 1, maxDose));
  }

  function decrement() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDoseAmount((v) => Math.max(v - 1, 0));
  }

  async function handleSave() {
    if (!med || !selectedProfile) return;

    if (isOverlapping) {
      router.push({
        pathname: "/safety-check",
        params: {
          medicationId: med.id,
          doseAmount: doseAmount.toString(),
          unit: selectedUnit,
          timeOffset: TIME_OPTIONS[selectedTimeIdx].offset.toString(),
        },
      });
      return;
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const ts = Date.now() - TIME_OPTIONS[selectedTimeIdx].offset * 60000;
    addDoseLog({
      profileId: selectedProfile.id,
      medicationId: med.id,
      medicationName: med.name,
      dose: doseAmount,
      unit: selectedUnit,
      timestamp: ts,
      type: "dose",
    });
    router.back();
  }

  if (!med) {
    return (
      <View style={[styles.container, { backgroundColor: C.background }]}>
        <Text style={[styles.errorText, { color: C.text }]}>Medicamento não encontrado</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={C.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: C.text }]}>Registrar Dose</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 140 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Medication Context Card */}
        <View style={[styles.contextCard, { backgroundColor: isDark ? Colors.backgroundDark : Colors.backgroundLight }]}>
          <View style={[styles.medThumb, { backgroundColor: isDark ? Colors.surfaceDark : Colors.surfaceLight }]}>
            <Ionicons name="medical" size={28} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.medName, { color: C.text }]}>{med.name}</Text>
            <View style={styles.medForRow}>
              <Ionicons name="person" size={13} color={Colors.gentleSage} />
              <Text style={[styles.medFor, { color: Colors.gentleSage }]}>Para {selectedProfile?.name ?? "—"}</Text>
            </View>
          </View>
          <Pressable
            style={[styles.editBtn, { backgroundColor: isDark ? Colors.surfaceDark : Colors.surfaceLight }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.editBtnText, { color: C.text }]}>Editar</Text>
          </Pressable>
        </View>

        {/* Dosage Stepper */}
        <View style={styles.dosageSection}>
          <Text style={[styles.sectionLabel, { color: C.textMuted }]}>QUANTO?</Text>
          <View style={styles.stepperRow}>
            <Pressable
              style={[styles.stepBtn, { backgroundColor: isDark ? Colors.backgroundDark : Colors.backgroundLight }]}
              onPress={decrement}
            >
              <Ionicons name="remove" size={28} color={C.textMuted} />
            </Pressable>

            <View style={styles.doseDisplay}>
              <Text style={[styles.doseAmount, { color: C.text }]}>{doseAmount}</Text>
              <View style={styles.unitRow}>
                <Pressable
                  onPress={() => {
                    const units = ["ml", "mg", "drops"];
                    const idx = units.indexOf(selectedUnit);
                    setSelectedUnit(units[(idx + 1) % units.length] as any);
                  }}
                  style={styles.unitBtn}
                >
                  <Text style={[styles.unitText, { color: Colors.gentleSage }]}>{selectedUnit}</Text>
                  <Ionicons name="chevron-down" size={14} color={Colors.gentleSage} />
                </Pressable>
              </View>
            </View>

            <Pressable
              style={[styles.stepBtn, styles.stepBtnPlus]}
              onPress={increment}
            >
              <Ionicons name="add" size={28} color={Colors.primaryContent} />
            </Pressable>
          </View>

          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressTrack, { backgroundColor: isDark ? Colors.backgroundDark : Colors.backgroundLight }]}>
              <View style={[styles.progressFill, { width: `${progressFraction * 100}%` }]} />
            </View>
            <View style={styles.progressLabels}>
              <Text style={[styles.progressLabel, { color: C.textMuted }]}>0{selectedUnit}</Text>
              <Text style={[styles.progressLabel, { color: C.textMuted }]}>{maxDose}{selectedUnit}</Text>
            </View>
          </View>
        </View>

        {/* Weight Check */}
        {selectedProfile && (
          <View style={styles.weightSection}>
            <View style={styles.weightSectionHeader}>
              <Text style={[styles.sectionLabel, { color: C.textMuted }]}>PESO ATUAL</Text>
              <View style={[styles.verifiedBadge, { backgroundColor: Colors.primary + "18" }]}>
                <Text style={[styles.verifiedBadgeText, { color: Colors.primaryDark }]}>Verificado há 2d</Text>
              </View>
            </View>
            <Pressable
              style={[styles.weightCard, { backgroundColor: Colors.primary + "12", borderColor: Colors.primary + "30" }]}
              onPress={() => router.push({ pathname: "/weight-check", params: { profileId: selectedProfile.id } })}
            >
              <View style={styles.weightLeft}>
                <View style={[styles.weightIcon, { backgroundColor: isDark ? Colors.surfaceDark : Colors.surfaceLight }]}>
                  <MaterialCommunityIcons name="scale-bathroom" size={22} color={Colors.primary} />
                </View>
                <View>
                  <Text style={[styles.weightValue, { color: C.text }]}>
                    {selectedProfile.weight} <Text style={[styles.weightUnit, { color: C.textMuted }]}>kg</Text>
                  </Text>
                  <Text style={[styles.safeRange, { color: C.textMuted }]}>
                    Dose segura: {safeMin} - {safeMax}{selectedUnit}
                  </Text>
                </View>
              </View>
              <Pressable
                style={[styles.confirmBtn, { backgroundColor: isDark ? Colors.surfaceDark : Colors.surfaceLight }]}
                onPress={() => router.push({ pathname: "/weight-check", params: { profileId: selectedProfile.id } })}
              >
                <Text style={[styles.confirmBtnText, { color: C.text }]}>Atualizar</Text>
              </Pressable>
            </Pressable>
          </View>
        )}

        {/* Time Picker */}
        <View style={styles.timeSection}>
          <Text style={[styles.sectionLabel, { color: C.textMuted }]}>HORÁRIO DADO</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeScroll}>
            {TIME_OPTIONS.map((opt, idx) => (
              <Pressable
                key={opt.label}
                style={[
                  styles.timeChip,
                  {
                    backgroundColor: idx === selectedTimeIdx
                      ? C.text
                      : (isDark ? Colors.backgroundDark : Colors.backgroundLight),
                    borderColor: isDark ? Colors.borderDark : Colors.border,
                  },
                ]}
                onPress={async () => {
                  await Haptics.selectionAsync();
                  setSelectedTimeIdx(idx);
                }}
              >
                {idx === 0 && (
                  <Ionicons name="time" size={16} color={idx === selectedTimeIdx ? C.background : C.textMuted} />
                )}
                <Text
                  style={[
                    styles.timeChipText,
                    { color: idx === selectedTimeIdx ? C.background : C.textMuted },
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: C.background,
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 16),
          },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.saveBtn,
            { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}
          onPress={handleSave}
        >
          <Ionicons name="checkmark-circle" size={22} color={Colors.primaryContent} />
          <Text style={styles.saveBtnText}>Salvar Registro</Text>
        </Pressable>
        <Text style={[styles.nextDoseText, { color: C.textMuted }]}>
          Próxima dose em {med.intervalHours} horas
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  content: {
    paddingHorizontal: 20,
    gap: 28,
  },
  contextCard: {
    borderRadius: 24,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    shadowColor: Colors.gentleSage,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 2,
  },
  medThumb: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  medName: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  medForRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  medFor: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  editBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  editBtnText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  dosageSection: { gap: 16 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
    textAlign: "center",
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  stepBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBtnPlus: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  doseDisplay: {
    alignItems: "center",
    minWidth: 100,
  },
  doseAmount: {
    fontSize: 72,
    fontFamily: "Inter_700Bold",
    letterSpacing: -2,
    lineHeight: 80,
  },
  unitRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  unitBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingVertical: 4,
  },
  unitText: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  progressContainer: { paddingHorizontal: 16, gap: 8 },
  progressTrack: {
    height: 12,
    borderRadius: 6,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 6,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  weightSection: { gap: 12 },
  weightSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  verifiedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
  weightCard: {
    borderRadius: 24,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
  },
  weightLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  weightIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  weightValue: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  weightUnit: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  safeRange: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  confirmBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  confirmBtnText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  timeSection: { gap: 12 },
  timeScroll: { gap: 10, flexDirection: "row", paddingVertical: 4 },
  timeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
  },
  timeChipText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 8,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    height: 60,
    borderRadius: 30,
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
  saveBtnText: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.primaryContent,
  },
  nextDoseText: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 40,
    fontFamily: "Inter_400Regular",
  },
});
