import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp } from "@/contexts/AppContext";
import Colors from "@/constants/colors";

const WATCH_OUTS: Record<string, { icon: string; title: string; desc: string }[]> = {
  Amoxicillin: [
    { icon: "restaurant", title: "Tomar com alimento", desc: "Para evitar dores de barriga, é melhor dar esta dose logo após uma refeição ou lanche." },
    { icon: "bed", title: "Pode causar sonolência", desc: "O paciente pode ficar um pouco mais sonolento que o normal. Monitore durante atividades." },
  ],
  Ibuprofen: [
    { icon: "restaurant", title: "Evitar estômago vazio", desc: "Sempre dar após uma refeição ou com um copo de leite para proteger o estômago." },
    { icon: "timer", title: "Intervalo estrito obrigatório", desc: "Nunca dar com mais frequência do que o intervalo recomendado para evitar superdose." },
  ],
};

export default function MedicationInsightScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const { medicationId } = useLocalSearchParams<{ medicationId: string }>();
  const { medications, selectedProfile } = useApp();

  const med = medications.find((m) => m.id === medicationId);
  const C = isDark ? Colors.dark : Colors.light;

  const safeMin = selectedProfile ? Math.round((selectedProfile.weight * 4.5) / 10) : 0;
  const safeMax = selectedProfile ? Math.round((selectedProfile.weight * 5) / 10) : 0;

  const watchOuts = med ? (WATCH_OUTS[med.name] ?? []) : [];

  if (!med) {
    return (
      <View style={[styles.container, { backgroundColor: C.background }]}>
        <Text style={[styles.errorText, { color: C.text }]}>Medicamento não encontrado</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? Colors.backgroundDark : Colors.backgroundLight }]}>
      {/* Drag handle */}
      <View style={[styles.handle, { paddingTop: insets.top + 16 }]}>
        <View style={[styles.handleBar, { backgroundColor: isDark ? "#333" : "#d1d5db" }]} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <View style={[styles.aiBadge, { backgroundColor: isDark ? "#3730a3" + "30" : "#e8e8f5" }]}>
            <Ionicons name="sparkles" size={14} color={isDark ? "#818cf8" : "#5a5a75"} />
            <Text style={[styles.aiBadgeText, { color: isDark ? "#818cf8" : "#5a5a75" }]}>Resumo IA</Text>
          </View>
          <Text style={[styles.medName, { color: C.text }]}>{med.name}</Text>
          <Text style={[styles.medSubtitle, { color: C.textMuted }]}>
            {med.type === "liquid" ? "Suspensão Oral" : med.type === "tablet" ? "Comprimido" : "Outro"} •{" "}
            {med.strength}{med.unit}
          </Text>
        </View>
        <Pressable style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={22} color={C.textMuted} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 140 }]}
      >
        {/* Dosage Card */}
        <View style={styles.dosageCard}>
          <View style={styles.dosageBlob1} />
          <View style={styles.dosageBlob2} />

          <View style={styles.dosageInner}>
            <View style={styles.dosageLabel}>
              <Ionicons name="calculator" size={18} color={Colors.primaryDark} />
              <Text style={styles.dosageLabelText}>DOSE SEGURA CALCULADA</Text>
            </View>

            <View style={styles.dosageRange}>
              <View style={styles.dosageRangeBox}>
                <Text style={styles.dosageValue}>{safeMin}</Text>
                <Text style={styles.dosageSeparator}>—</Text>
                <Text style={styles.dosageValue}>{safeMax}</Text>
                <Text style={styles.dosageUnit}>{med.unit}</Text>
              </View>
            </View>

            <View style={styles.dosageMeta}>
              <View style={styles.dosageMetaItem}>
                <View style={styles.dosageMetaIcon}>
                  <Ionicons name="time" size={20} color={Colors.primaryContent} />
                </View>
                <View>
                  <Text style={styles.dosageMetaLabel}>FREQUÊNCIA</Text>
                  <Text style={styles.dosageMetaValue}>A cada {med.intervalHours} horas</Text>
                </View>
              </View>
              <View style={styles.dosageMetaDivider} />
              <View style={styles.dosageMetaItem}>
                <View style={styles.dosageMetaIcon}>
                  <Ionicons name="calendar" size={20} color={Colors.primaryContent} />
                </View>
                <View>
                  <Text style={styles.dosageMetaLabel}>DURAÇÃO</Text>
                  <Text style={styles.dosageMetaValue}>{med.durationDays} Dias</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Watch Out */}
        {watchOuts.length > 0 && (
          <View style={styles.watchSection}>
            <View style={styles.watchHeader}>
              <Ionicons name="warning" size={20} color="#c04d4d" />
              <Text style={[styles.watchTitle, { color: C.text }]}>Atenção</Text>
            </View>
            <View style={[styles.watchCard, { backgroundColor: "#fff0f0", borderColor: "#fecaca" }]}>
              {watchOuts.map((item, idx) => (
                <View key={idx} style={[styles.watchItem, idx > 0 && styles.watchItemBorder]}>
                  <View style={styles.watchIcon}>
                    <Ionicons
                      name={item.icon as any}
                      size={16}
                      color="#c04d4d"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.watchItemTitle}>{item.title}</Text>
                    <Text style={styles.watchItemDesc}>{item.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Leaflet */}
        <Pressable style={styles.leafletBtn}>
          <Ionicons name="document-text-outline" size={18} color={C.textMuted} />
          <Text style={[styles.leafletText, { color: C.textMuted }]}>Ler bula oficial (PDF)</Text>
        </Pressable>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16, backgroundColor: isDark ? Colors.backgroundDark : Colors.backgroundLight }]}>
        <Pressable
          style={({ pressed }) => [
            styles.gotItBtn,
            {
              backgroundColor: isDark ? Colors.surfaceLight : Colors.textMain,
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.back();
          }}
        >
          <Ionicons name="checkmark-circle" size={22} color={isDark ? Colors.textMain : "#fff"} />
          <Text style={[styles.gotItText, { color: isDark ? Colors.textMain : "#fff" }]}>Entendi, Obrigado</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  handle: {
    alignItems: "center",
    paddingBottom: 8,
  },
  handleBar: {
    width: 40,
    height: 5,
    borderRadius: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 28,
    paddingTop: 8,
    paddingBottom: 20,
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  aiBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  medName: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  medSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 20,
    gap: 24,
  },
  dosageCard: {
    borderRadius: 28,
    backgroundColor: Colors.primary,
    padding: 28,
    overflow: "hidden",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  dosageBlob1: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.2)",
    top: -30,
    right: -30,
  },
  dosageBlob2: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.1)",
    bottom: -20,
    left: -20,
  },
  dosageInner: { gap: 20, zIndex: 1 },
  dosageLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dosageLabelText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: Colors.primaryDark,
    letterSpacing: 1.5,
  },
  dosageRange: { alignItems: "flex-start" },
  dosageRangeBox: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.3)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  dosageValue: {
    fontSize: 52,
    fontFamily: "Inter_700Bold",
    color: Colors.textMain,
    letterSpacing: -1,
  },
  dosageSeparator: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.textMain + "80",
  },
  dosageUnit: {
    fontSize: 24,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMain + "80",
  },
  dosageMeta: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    padding: 16,
  },
  dosageMetaItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dosageMetaIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  dosageMetaLabel: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: Colors.primaryDark,
    letterSpacing: 1,
  },
  dosageMetaValue: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: Colors.textMain,
    marginTop: 2,
  },
  dosageMetaDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.textMain + "18",
    marginHorizontal: 12,
  },
  watchSection: { gap: 14 },
  watchHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  watchTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  watchCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    gap: 16,
  },
  watchItem: {
    flexDirection: "row",
    gap: 16,
    alignItems: "flex-start",
  },
  watchItemBorder: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#fecaca",
  },
  watchIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  watchItemTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#1f2937",
  },
  watchItemDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#6b7280",
    lineHeight: 19,
    marginTop: 4,
  },
  leafletBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: "center",
  },
  leafletText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  gotItBtn: {
    borderRadius: 28,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  gotItText: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 40,
    fontFamily: "Inter_400Regular",
  },
});
