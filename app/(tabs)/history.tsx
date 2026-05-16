import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useColorScheme,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp, DoseLog } from "@/contexts/AppContext";
import Colors from "@/constants/colors";

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("pt-BR", { hour: "numeric", minute: "2-digit", hour12: false });
}

function getDateGroup(ts: number): string {
  const now = new Date();
  const date = new Date(ts);
  const diffDays = Math.floor((now.setHours(0, 0, 0, 0) - date.setHours(0, 0, 0, 0)) / 86400000);
  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Ontem";
  if (diffDays < 7) return date.toLocaleDateString("pt-BR", { weekday: "long" });
  return date.toLocaleDateString("pt-BR", { month: "short", day: "numeric" });
}

function LogIcon({ type, isDark }: { type: string; isDark: boolean }) {
  if (type === "dose") {
    return (
      <View style={[styles.logIcon, { backgroundColor: Colors.primary + "18" }]}>
        <Ionicons name="medical" size={20} color={Colors.primary} />
      </View>
    );
  }
  if (type === "weight") {
    return (
      <View style={[styles.logIcon, { backgroundColor: "#3b82f620" }]}>
        <MaterialCommunityIcons name="scale-bathroom" size={20} color="#3b82f6" />
      </View>
    );
  }
  if (type === "temperature") {
    return (
      <View style={[styles.logIcon, { backgroundColor: Colors.gentleRose + "22" }]}>
        <MaterialCommunityIcons name="thermometer" size={20} color={Colors.gentleRose} />
      </View>
    );
  }
  return (
    <View style={[styles.logIcon, { backgroundColor: "#f97316" + "22" }]}>
      <Ionicons name="document-text" size={20} color="#f97316" />
    </View>
  );
}

function LogCard({ log, isDark }: { log: DoseLog; isDark: boolean }) {
  const C = isDark ? Colors.dark : Colors.light;

  const subtitle = useMemo(() => {
    if (log.type === "dose") return `${log.dose}${log.unit} • ${log.medicationName}`;
    if (log.type === "weight") return `${log.value}kg • Peso`;
    if (log.type === "temperature") return `${log.value}°C • Temperatura`;
    if (log.type === "note") return log.note ?? "Nota";
    return "";
  }, [log]);

  const hasAlert = log.type === "temperature" && (log.value ?? 0) > 38;

  return (
    <View
      style={[
        styles.logCard,
        {
          backgroundColor: C.surface,
          borderColor: hasAlert ? Colors.gentleRose + "30" : "transparent",
          borderWidth: hasAlert ? 1.5 : 0,
        },
      ]}
    >
      <LogIcon type={log.type} isDark={isDark} />
      <View style={styles.logInfo}>
        <Text style={[styles.logTitle, { color: C.text }]}>{log.medicationName}</Text>
        <Text style={[styles.logSubtitle, { color: C.textMuted }]}>{subtitle}</Text>
      </View>
      <View style={styles.logMeta}>
        <Text style={[styles.logTime, { color: C.textMuted }]}>{formatTime(log.timestamp)}</Text>
        {log.type === "dose" && (
          <View style={[styles.logDot, { backgroundColor: Colors.primary }]} />
        )}
        {hasAlert && (
          <View style={[styles.logDot, { backgroundColor: Colors.gentleRose }]} />
        )}
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const { profiles, selectedProfileId, selectProfile, getLogsForProfile } = useApp();

  const C = isDark ? Colors.dark : Colors.light;
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  const [filterProfileId, setFilterProfileId] = useState<string | null>(null);

  const effectiveProfileId = filterProfileId ?? selectedProfileId;
  const logs = effectiveProfileId ? getLogsForProfile(effectiveProfileId) : [];

  const grouped = useMemo(() => {
    const groups: { label: string; logs: DoseLog[] }[] = [];
    const seen = new Map<string, number>();

    for (const log of logs) {
      const label = getDateGroup(log.timestamp);
      if (!seen.has(label)) {
        seen.set(label, groups.length);
        groups.push({ label, logs: [log] });
      } else {
        groups[seen.get(label)!].logs.push(log);
      }
    }
    return groups;
  }, [logs]);

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: C.background }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.headerTitle, { color: C.text }]}>Histórico</Text>
          <Pressable style={[styles.filterBtn, { backgroundColor: isDark ? Colors.surfaceDark : Colors.surfaceLight, borderColor: C.border }]}>
            <Ionicons name="filter" size={18} color={C.textMuted} />
          </Pressable>
        </View>

        {/* Profile Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <Pressable
            style={[
              styles.filterChip,
              {
                backgroundColor: !filterProfileId ? Colors.primary : (isDark ? Colors.surfaceDark : Colors.surfaceLight),
                borderColor: !filterProfileId ? "transparent" : C.border,
              },
            ]}
            onPress={async () => {
              await Haptics.selectionAsync();
              setFilterProfileId(null);
            }}
          >
            <Text style={[styles.filterChipText, { color: !filterProfileId ? Colors.primaryContent : C.textMuted }]}>Todos</Text>
          </Pressable>
          {profiles.map((p) => (
            <Pressable
              key={p.id}
              style={[
                styles.filterChip,
                {
                  backgroundColor: filterProfileId === p.id ? Colors.primary : (isDark ? Colors.surfaceDark : Colors.surfaceLight),
                  borderColor: filterProfileId === p.id ? "transparent" : C.border,
                },
              ]}
              onPress={async () => {
                await Haptics.selectionAsync();
                setFilterProfileId(p.id);
              }}
            >
              <Text style={[styles.filterChipText, { color: filterProfileId === p.id ? Colors.primaryContent : C.textMuted }]}>
                {p.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 120 }]}
      >
        {grouped.length === 0 ? (
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: isDark ? Colors.surfaceDark : Colors.mintSoft }]}>
              <Ionicons name="time-outline" size={40} color={Colors.gentleSage} />
            </View>
            <Text style={[styles.emptyTitle, { color: C.text }]}>Nenhum registro ainda</Text>
            <Text style={[styles.emptySubtitle, { color: C.textMuted }]}>Os registros de doses aparecerão aqui após você começar a rastrear</Text>
          </View>
        ) : (
          grouped.map((group) => (
            <View key={group.label} style={styles.group}>
              <Text style={[styles.groupLabel, { color: C.textMuted }]}>{group.label.toUpperCase()}</Text>
              <View style={styles.groupCards}>
                {group.logs.map((log) => (
                  <LogCard key={log.id} log={log} isDark={isDark} />
                ))}
              </View>
            </View>
          ))
        )}

        {grouped.length > 0 && (
          <Text style={[styles.endText, { color: isDark ? Colors.borderDark : Colors.border }]}>
            Fim do histórico desta semana
          </Text>
        )}
      </ScrollView>

      {/* Share with Doctor button */}
      <View style={[styles.shareContainer, { paddingBottom: bottomPad + 80 }]}>
        <Pressable
          style={({ pressed }) => [
            styles.shareBtn,
            {
              backgroundColor: isDark ? Colors.surfaceLight : Colors.textMain,
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }}
        >
          <Ionicons name="share" size={18} color={isDark ? Colors.textMain : "#fff"} />
          <Text style={[styles.shareBtnText, { color: isDark ? Colors.textMain : "#fff" }]}>Compartilhar com Médico</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 8,
    gap: 12,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  filterScroll: { gap: 10, flexDirection: "row" },
  filterChip: {
    height: 36,
    paddingHorizontal: 18,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 20,
  },
  group: { gap: 10 },
  groupLabel: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
    paddingHorizontal: 4,
  },
  groupCards: { gap: 10 },
  logCard: {
    borderRadius: 20,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  logIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  logInfo: { flex: 1 },
  logTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.1,
  },
  logSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginTop: 3,
  },
  logMeta: { alignItems: "flex-end", gap: 6 },
  logTime: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  logDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  empty: {
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
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 32,
    lineHeight: 21,
  },
  endText: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
    marginTop: 8,
  },
  shareContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 32,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  shareBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
});
