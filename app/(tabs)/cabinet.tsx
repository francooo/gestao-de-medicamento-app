import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useColorScheme,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp, Medication } from "@/contexts/AppContext";
import Colors from "@/constants/colors";

function MedTypeIcon({ type, color }: { type: string; color: string }) {
  return (
    <View style={[styles.medTypeIcon, { backgroundColor: color + "18" }]}>
      <Ionicons
        name={type === "liquid" ? "water" : type === "tablet" ? "ellipse" : "bandage"}
        size={22}
        color={color}
      />
    </View>
  );
}

function MedCard({ med, isDark, onLog, onInfo, onDelete }: {
  med: Medication;
  isDark: boolean;
  onLog: () => void;
  onInfo: () => void;
  onDelete: () => void;
}) {
  const C = isDark ? Colors.dark : Colors.light;
  const iconColor =
    med.type === "liquid" ? Colors.primary : med.type === "tablet" ? Colors.gentleLavender : Colors.gentleRose;

  return (
    <View style={[styles.medCard, { backgroundColor: C.surface }]}>
      <Pressable
        style={styles.medCardInner}
        onPress={onInfo}
        onLongPress={async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }}
      >
        <MedTypeIcon type={med.type} color={iconColor} />
        <View style={styles.medInfo}>
          <Text style={[styles.medName, { color: C.text }]}>{med.name}</Text>
          <Text style={[styles.medDetails, { color: C.textMuted }]}>
            {med.strength}{med.unit} • Every {med.intervalHours}h
          </Text>
          {med.notes ? (
            <Text style={[styles.medNotes, { color: C.textMuted }]} numberOfLines={1}>
              {med.notes}
            </Text>
          ) : null}
        </View>
        <View style={styles.medActions}>
          <Pressable
            style={({ pressed }) => [
              styles.logBtn,
              { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.96 : 1 }] },
            ]}
            onPress={onLog}
          >
            <Ionicons name="add-circle" size={18} color={Colors.primaryContent} />
            <Text style={styles.logBtnText}>Log</Text>
          </Pressable>
          <Pressable style={styles.deleteBtn} onPress={onDelete}>
            <Ionicons name="trash-outline" size={18} color={Colors.gentleRose} />
          </Pressable>
        </View>
      </Pressable>
    </View>
  );
}

export default function CabinetScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const { profiles, selectedProfile, getMedicationsForProfile, removeMedication } = useApp();

  const C = isDark ? Colors.dark : Colors.light;
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  const meds = selectedProfile ? getMedicationsForProfile(selectedProfile.id) : [];

  function handleDelete(id: string, name: string) {
    Alert.alert(`Remove ${name}?`, "This will remove the medication from the cabinet.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          removeMedication(id);
        },
      },
    ]);
  }

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: C.background }]}>
        <Text style={[styles.headerTitle, { color: C.text }]}>Medicine Cabinet</Text>
        <Pressable
          style={({ pressed }) => [
            styles.addBtn,
            { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.96 : 1 }] },
          ]}
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/add-medication");
          }}
        >
          <Ionicons name="add" size={18} color={Colors.primaryContent} />
          <Text style={styles.addBtnText}>Add</Text>
        </Pressable>
      </View>

      {/* Profile banner */}
      {selectedProfile && (
        <View style={[styles.profileBanner, { backgroundColor: isDark ? Colors.surfaceDark : Colors.mintSoft, borderColor: Colors.primary + "20" }]}>
          <Ionicons name="person" size={16} color={Colors.primary} />
          <Text style={[styles.profileBannerText, { color: C.text }]}>
            Showing meds for{" "}
            <Text style={{ fontFamily: "Inter_700Bold", color: Colors.primary }}>{selectedProfile.name}</Text>{" "}
            <Text style={{ color: C.textMuted, fontSize: 12 }}>({selectedProfile.weight}kg)</Text>
          </Text>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: bottomPad + 100 },
        ]}
      >
        {meds.length === 0 ? (
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: isDark ? Colors.surfaceDark : Colors.mintSoft }]}>
              <Ionicons name="medkit-outline" size={40} color={Colors.gentleSage} />
            </View>
            <Text style={[styles.emptyTitle, { color: C.text }]}>Cabinet is empty</Text>
            <Text style={[styles.emptySubtitle, { color: C.textMuted }]}>Add medications to track doses and get reminders</Text>
            <Pressable
              style={({ pressed }) => [styles.emptyBtn, { opacity: pressed ? 0.85 : 1 }]}
              onPress={() => router.push("/add-medication")}
            >
              <Text style={styles.emptyBtnText}>Add First Medication</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={[styles.sectionLabel, { color: Colors.gentleLavender }]}>
              {meds.length} MEDICATION{meds.length !== 1 ? "S" : ""}
            </Text>
            {meds.map((med) => (
              <MedCard
                key={med.id}
                med={med}
                isDark={isDark}
                onLog={async () => {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push({ pathname: "/dose-logger", params: { medicationId: med.id } });
                }}
                onInfo={async () => {
                  await Haptics.selectionAsync();
                  router.push({ pathname: "/medication-insight", params: { medicationId: med.id } });
                }}
                onDelete={() => handleDelete(med.id, med.name)}
              />
            ))}
          </>
        )}
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
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addBtnText: {
    color: Colors.primaryContent,
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
  profileBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
  },
  profileBannerText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  medCard: {
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  medCardInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
  },
  medTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  medInfo: { flex: 1, gap: 3 },
  medName: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.2,
  },
  medDetails: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  medNotes: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
  },
  medActions: {
    alignItems: "center",
    gap: 8,
  },
  logBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  logBtnText: {
    color: Colors.primaryContent,
    fontFamily: "Inter_700Bold",
    fontSize: 13,
  },
  deleteBtn: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    paddingTop: 80,
    gap: 16,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 32,
    lineHeight: 21,
  },
  emptyBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  emptyBtnText: {
    color: Colors.primaryContent,
    fontFamily: "Inter_700Bold",
    fontSize: 16,
  },
});
