import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  useColorScheme,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp } from "@/contexts/AppContext";
import Colors from "@/constants/colors";

type MedType = "liquid" | "tablet" | "other";
type MedUnit = "ml" | "mg" | "drops" | "mcg" | "units";

const TYPE_OPTIONS: { value: MedType; label: string; icon: string }[] = [
  { value: "liquid", label: "Liquid", icon: "water" },
  { value: "tablet", label: "Tablet", icon: "ellipse" },
  { value: "other", label: "Other", icon: "bandage" },
];

const UNIT_OPTIONS: MedUnit[] = ["ml", "mg", "drops", "mcg", "units"];

function InputField({
  label,
  icon,
  ...props
}: {
  label: string;
  icon: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType?: any;
  isDark: boolean;
}) {
  const { isDark, ...inputProps } = props;
  const C = isDark ? Colors.dark : Colors.light;
  const [focused, setFocused] = useState(false);

  return (
    <View style={inputStyles.wrapper}>
      <Text style={[inputStyles.label, { color: Colors.gentleSage }]}>{label}</Text>
      <View
        style={[
          inputStyles.container,
          {
            backgroundColor: isDark ? Colors.surfaceDark : Colors.surfaceLight,
            borderColor: focused ? Colors.primary : (isDark ? Colors.borderDark : "#e5e7eb"),
            borderWidth: focused ? 2 : 1,
          },
        ]}
      >
        <Ionicons
          name={icon as any}
          size={20}
          color={focused ? Colors.primary : Colors.gentleSage}
          style={{ marginRight: 12 }}
        />
        <TextInput
          style={[inputStyles.input, { color: C.text }]}
          placeholderTextColor={Colors.gentleSage + "88"}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...inputProps}
        />
      </View>
    </View>
  );
}

const inputStyles = StyleSheet.create({
  wrapper: { gap: 8 },
  label: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    paddingLeft: 16,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
});

export default function AddMedicationScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const { selectedProfile, addMedication } = useApp();

  const C = isDark ? Colors.dark : Colors.light;
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === "web" ? 34 : 16);

  const [name, setName] = useState("");
  const [type, setType] = useState<MedType>("liquid");
  const [strength, setStrength] = useState("");
  const [unit, setUnit] = useState<MedUnit>("ml");
  const [notes, setNotes] = useState("");
  const [intervalHours, setIntervalHours] = useState("8");
  const [durationDays, setDurationDays] = useState("5");

  const canSave = name.trim().length > 0 && strength.trim().length > 0;

  async function handleSave() {
    if (!canSave || !selectedProfile) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addMedication({
      profileId: selectedProfile.id,
      name: name.trim(),
      type,
      strength: parseFloat(strength) || 0,
      unit,
      notes: notes.trim() || undefined,
      intervalHours: parseInt(intervalHours) || 8,
      durationDays: parseInt(durationDays) || 5,
    });
    router.back();
  }

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Pressable
          style={styles.cancelBtn}
          onPress={() => router.back()}
        >
          <Text style={[styles.cancelText, { color: C.textMuted }]}>Cancel</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: C.text }]}>Add Medication</Text>
        <Pressable
          style={[styles.saveBtn, { backgroundColor: canSave ? Colors.primary : Colors.primary + "50" }]}
          onPress={handleSave}
          disabled={!canSave}
        >
          <Text style={styles.saveBtnText}>Save</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Profile Banner */}
        {selectedProfile && (
          <View style={[styles.profileBanner, { backgroundColor: isDark ? Colors.surfaceDark : Colors.mintSoft, borderColor: Colors.primary + "20" }]}>
            <Ionicons name="person" size={16} color={Colors.primary} />
            <Text style={[styles.profileBannerText, { color: C.text }]}>
              Adding for{" "}
              <Text style={{ fontFamily: "Inter_700Bold", color: Colors.primary }}>{selectedProfile.name}</Text>{" "}
              <Text style={{ color: C.textMuted, fontSize: 12 }}>({selectedProfile.weight}kg)</Text>
            </Text>
          </View>
        )}

        {/* Scan Label Hero */}
        <Pressable
          style={[
            styles.scanHero,
            {
              backgroundColor: isDark ? Colors.surfaceDark : Colors.mintSoft,
              borderColor: Colors.primary + "40",
            },
          ]}
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
        >
          <View style={styles.scanDecorBlob} />
          <View style={[styles.scanIconCircle, { backgroundColor: isDark ? Colors.surfaceDark : Colors.surfaceLight }]}>
            <Ionicons name="camera" size={30} color={Colors.primary} />
          </View>
          <Text style={[styles.scanTitle, { color: C.text }]}>Scan Label</Text>
          <Text style={[styles.scanSubtitle, { color: Colors.gentleSage }]}>
            Snap a photo of the box to auto-fill details instantly.
          </Text>
          <View style={[styles.aiBadge, { backgroundColor: Colors.primary + "18" }]}>
            <Text style={[styles.aiBadgeText, { color: Colors.primaryDark }]}>AI ENABLED</Text>
          </View>
        </Pressable>

        {/* Form */}
        <View style={styles.form}>
          {/* Name */}
          <InputField
            label="Medicine Name"
            icon="medical"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Ibuprofen"
            isDark={isDark}
          />

          {/* Type Toggle */}
          <View style={styles.typeSection}>
            <Text style={[styles.typeLabel, { color: Colors.gentleSage }]}>TYPE</Text>
            <View style={[styles.typeToggle, { backgroundColor: isDark ? Colors.surfaceDark : Colors.surfaceLight }]}>
              {TYPE_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  style={[
                    styles.typeOption,
                    type === opt.value && styles.typeOptionActive,
                  ]}
                  onPress={async () => {
                    await Haptics.selectionAsync();
                    setType(opt.value);
                  }}
                >
                  <Ionicons
                    name={opt.icon as any}
                    size={18}
                    color={type === opt.value ? Colors.primaryContent : Colors.gentleSage}
                  />
                  <Text
                    style={[
                      styles.typeOptionText,
                      { color: type === opt.value ? Colors.primaryContent : Colors.gentleSage },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Strength */}
          <View style={styles.strengthRow}>
            <View style={[inputStyles.wrapper, { flex: 1 }]}>
              <Text style={[inputStyles.label, { color: Colors.gentleSage }]}>STRENGTH</Text>
              <View
                style={[
                  inputStyles.container,
                  {
                    backgroundColor: isDark ? Colors.surfaceDark : Colors.surfaceLight,
                    borderColor: isDark ? Colors.borderDark : "#e5e7eb",
                    borderWidth: 1,
                  },
                ]}
              >
                <Ionicons name="flask" size={20} color={Colors.gentleSage} style={{ marginRight: 12 }} />
                <TextInput
                  style={[inputStyles.input, { color: C.text }]}
                  value={strength}
                  onChangeText={setStrength}
                  placeholder="e.g. 100"
                  placeholderTextColor={Colors.gentleSage + "88"}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View style={styles.unitPicker}>
              <Text style={[inputStyles.label, { color: Colors.gentleSage }]}>UNIT</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.unitScroll}
              >
                {UNIT_OPTIONS.map((u) => (
                  <Pressable
                    key={u}
                    style={[
                      styles.unitChip,
                      {
                        backgroundColor: unit === u ? Colors.primary : (isDark ? Colors.backgroundDark : Colors.backgroundLight),
                        borderColor: unit === u ? "transparent" : (isDark ? Colors.borderDark : "#e5e7eb"),
                      },
                    ]}
                    onPress={async () => {
                      await Haptics.selectionAsync();
                      setUnit(u);
                    }}
                  >
                    <Text
                      style={[
                        styles.unitChipText,
                        { color: unit === u ? Colors.primaryContent : C.textMuted },
                      ]}
                    >
                      {u}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Interval */}
          <View style={styles.twoCol}>
            <View style={[inputStyles.wrapper, { flex: 1 }]}>
              <Text style={[inputStyles.label, { color: Colors.gentleSage }]}>INTERVAL (HOURS)</Text>
              <View
                style={[
                  inputStyles.container,
                  {
                    backgroundColor: isDark ? Colors.surfaceDark : Colors.surfaceLight,
                    borderColor: isDark ? Colors.borderDark : "#e5e7eb",
                    borderWidth: 1,
                  },
                ]}
              >
                <Ionicons name="time" size={20} color={Colors.gentleSage} style={{ marginRight: 12 }} />
                <TextInput
                  style={[inputStyles.input, { color: C.text }]}
                  value={intervalHours}
                  onChangeText={setIntervalHours}
                  placeholder="8"
                  placeholderTextColor={Colors.gentleSage + "88"}
                  keyboardType="number-pad"
                />
              </View>
            </View>
            <View style={[inputStyles.wrapper, { flex: 1 }]}>
              <Text style={[inputStyles.label, { color: Colors.gentleSage }]}>DURATION (DAYS)</Text>
              <View
                style={[
                  inputStyles.container,
                  {
                    backgroundColor: isDark ? Colors.surfaceDark : Colors.surfaceLight,
                    borderColor: isDark ? Colors.borderDark : "#e5e7eb",
                    borderWidth: 1,
                  },
                ]}
              >
                <Ionicons name="calendar" size={20} color={Colors.gentleSage} style={{ marginRight: 12 }} />
                <TextInput
                  style={[inputStyles.input, { color: C.text }]}
                  value={durationDays}
                  onChangeText={setDurationDays}
                  placeholder="5"
                  placeholderTextColor={Colors.gentleSage + "88"}
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </View>

          {/* Notes */}
          <View style={inputStyles.wrapper}>
            <Text style={[inputStyles.label, { color: Colors.gentleSage }]}>INSTRUCTIONS / NOTES</Text>
            <View
              style={[
                styles.notesContainer,
                {
                  backgroundColor: isDark ? Colors.surfaceDark : Colors.surfaceLight,
                  borderColor: isDark ? Colors.borderDark : "#e5e7eb",
                },
              ]}
            >
              <TextInput
                style={[styles.notesInput, { color: C.text }]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Take with food, keep refrigerated..."
                placeholderTextColor={Colors.gentleSage + "88"}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>
      </ScrollView>
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
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cancelText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  saveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveBtnText: {
    color: Colors.primaryContent,
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
  content: {
    paddingHorizontal: 20,
    gap: 20,
  },
  profileBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    alignSelf: "center",
  },
  profileBannerText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  scanHero: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    gap: 12,
    overflow: "hidden",
  },
  scanDecorBlob: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
    backgroundColor: Colors.primary + "18",
    borderRadius: 24,
  },
  scanIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  scanTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  scanSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    maxWidth: 240,
    lineHeight: 21,
  },
  aiBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  aiBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  form: { gap: 20 },
  typeSection: { gap: 8 },
  typeLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    paddingLeft: 16,
  },
  typeToggle: {
    flexDirection: "row",
    borderRadius: 24,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  typeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 20,
  },
  typeOptionActive: {
    backgroundColor: Colors.primary,
  },
  typeOptionText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  strengthRow: {
    gap: 12,
  },
  unitPicker: { gap: 8 },
  unitScroll: { gap: 8, flexDirection: "row", paddingVertical: 4 },
  unitChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  unitChipText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  twoCol: {
    flexDirection: "row",
    gap: 12,
  },
  notesContainer: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    minHeight: 100,
  },
  notesInput: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
});
