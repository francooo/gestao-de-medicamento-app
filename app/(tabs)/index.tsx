import React, { useMemo } from "react";
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
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Svg, { Path } from "react-native-svg";
import { useApp } from "@/contexts/AppContext";
import Colors from "@/constants/colors";

function ProfileAvatar({ name, color, isSelected, size = 64 }: { name: string; color: string; isSelected: boolean; size?: number }) {
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <View
      style={[
        styles.avatarOuter,
        {
          width: size + 8,
          height: size + 8,
          borderRadius: (size + 8) / 2,
          borderColor: isSelected ? Colors.primary : "transparent",
          borderWidth: 2.5,
          padding: 2,
        },
      ]}
    >
      <View
        style={[
          styles.avatarInner,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color + "22",
            borderColor: color + "40",
            borderWidth: 1,
          },
        ]}
      >
        <Text style={[styles.avatarInitials, { color, fontSize: size * 0.32 }]}>{initials}</Text>
        {isSelected && (
          <View style={[styles.avatarCheck, { backgroundColor: Colors.primary }]}>
            <Ionicons name="checkmark" size={10} color={Colors.primaryContent} />
          </View>
        )}
      </View>
    </View>
  );
}

function Sparkline() {
  return (
    <Svg width="100%" height="60" style={StyleSheet.absoluteFill} preserveAspectRatio="none">
      <Path
        d="M0 52 Q 20 46, 40 38 T 100 18 L 100 60 L 0 60 Z"
        fill="rgba(43, 238, 186, 0.15)"
      />
      <Path
        d="M0 52 Q 20 46, 40 38 T 100 18"
        fill="none"
        stroke="#2beeba"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const { profiles, selectedProfile, selectedProfileId, selectProfile, getMedicationsForProfile, getLogsForProfile, getLastDoseLog } = useApp();

  const C = isDark ? Colors.dark : Colors.light;
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  const profileMeds = useMemo(
    () => (selectedProfile ? getMedicationsForProfile(selectedProfile.id) : []),
    [selectedProfile, getMedicationsForProfile]
  );

  const nextDueMed = useMemo(() => {
    for (const med of profileMeds) {
      const lastLog = getLastDoseLog(med.id);
      if (!lastLog) return { med, hoursUntilDue: 0, isDue: true };
      const nextDueTime = lastLog.timestamp + med.intervalHours * 3600000;
      const hoursUntilDue = (nextDueTime - Date.now()) / 3600000;
      if (hoursUntilDue <= 0) return { med, hoursUntilDue: 0, isDue: true };
      return { med, hoursUntilDue, isDue: false };
    }
    return null;
  }, [profileMeds, getLastDoseLog]);

  const upcomingMed = useMemo(() => {
    if (!nextDueMed) return null;
    return profileMeds.find((m) => m.id !== nextDueMed?.med.id) ?? null;
  }, [profileMeds, nextDueMed]);

  const weightVerifiedText = useMemo(() => {
    if (!selectedProfile?.weightVerifiedAt) return "Não verificado";
    const diff = Date.now() - selectedProfile.weightVerifiedAt;
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Verificado hoje";
    if (days === 1) return "Verificado ontem";
    return `Verificado há ${days}d`;
  }, [selectedProfile]);

  async function handleLogNow(medId: string) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({ pathname: "/dose-logger", params: { medicationId: medId } });
  }

  async function handleProfileSelect(id: string) {
    await Haptics.selectionAsync();
    selectProfile(id);
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom Dia" : hour < 17 ? "Boa Tarde" : "Boa Noite";
  const today = new Date().toLocaleDateString("pt-BR", { month: "short", day: "numeric", weekday: "long" });

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: C.background }]}>
        <View>
          <Text style={[styles.greeting, { color: C.text }]}>{greeting}, Sara</Text>
          <Text style={[styles.dateText, { color: Colors.gentleLavender }]}>{today.toUpperCase()}</Text>
        </View>
        <Pressable
          style={styles.notifButton}
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/scheduled-reminders");
          }}
        >
          <Ionicons name="notifications" size={26} color={isDark ? Colors.primary + "99" : Colors.gentleSage} />
          <View style={styles.notifDot} />
        </Pressable>
      </View>

      {/* Profile Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.profileScroll]}
        style={styles.profileScrollOuter}
      >
        {profiles.map((profile) => (
          <Pressable
            key={profile.id}
            style={styles.profileItem}
            onPress={() => handleProfileSelect(profile.id)}
            onLongPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push({ pathname: "/add-profile", params: { editId: profile.id } });
            }}
          >
            <ProfileAvatar
              name={profile.name}
              color={profile.avatarColor}
              isSelected={profile.id === selectedProfileId}
            />
            <Text
              style={[
                styles.profileName,
                {
                  color: profile.id === selectedProfileId ? Colors.primary : C.textMuted,
                  fontFamily: profile.id === selectedProfileId ? "Inter_700Bold" : "Inter_500Medium",
                },
              ]}
            >
              {profile.name}
            </Text>
          </Pressable>
        ))}
        <Pressable
          style={styles.profileItem}
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/add-profile");
          }}
        >
          <View style={[styles.addProfileBtn, { borderColor: Colors.gentleLavender, backgroundColor: isDark ? Colors.surfaceDark : Colors.lavenderLight }]}>
            <Ionicons name="add" size={24} color={Colors.gentleLavender} />
          </View>
          <Text style={[styles.profileName, { color: C.textMuted }]}>Adicionar</Text>
        </Pressable>
      </ScrollView>

      {/* Main Feed */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.feed,
          { paddingBottom: bottomPad + 100 },
        ]}
        style={styles.feedScroll}
      >
        {/* Next Dose Card */}
        {nextDueMed && (
          <View style={[styles.card, { backgroundColor: C.surface }]}>
            <View style={[styles.cardLeftBar, { backgroundColor: Colors.gentleLavender }]} />
            <View style={styles.cardContent}>
              <View style={styles.cardTop}>
                <View style={styles.cardTitleRow}>
                  <View style={[styles.medIcon, { backgroundColor: Colors.lavenderLight }]}>
                    <Ionicons name="medkit" size={22} color={Colors.gentleLavender} />
                  </View>
                  <View>
                    <Text style={[styles.medName, { color: C.text }]}>{nextDueMed.med.name}</Text>
                    <Text style={[styles.medSubtitle, { color: C.textMuted }]}>
                      {nextDueMed.med.strength}{nextDueMed.med.unit} • {nextDueMed.med.type === "liquid" ? "Líquido" : nextDueMed.med.type === "tablet" ? "Comprimido" : "Outro"}
                    </Text>
                  </View>
                </View>
                <View style={[styles.dueBadge, { backgroundColor: Colors.roseLight }]}>
                  <Ionicons name="time" size={13} color={Colors.gentleRose} />
                  <Text style={[styles.dueBadgeText, { color: Colors.gentleRose }]}>
                    {nextDueMed.isDue ? "Agora" : `Em ${Math.ceil(nextDueMed.hoursUntilDue)}h`}
                  </Text>
                </View>
              </View>
              <View style={styles.cardActions}>
                <Pressable
                  style={({ pressed }) => [
                    styles.logNowBtn,
                    { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
                  ]}
                  onPress={() => handleLogNow(nextDueMed.med.id)}
                >
                  <Ionicons name="checkmark" size={18} color={Colors.primaryContent} />
                  <Text style={styles.logNowText}>Registrar</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {/* Widget Row */}
        <View style={styles.widgetRow}>
          {/* Weight Widget */}
          <View style={[styles.widget, { backgroundColor: C.surface }]}>
            <View style={styles.widgetHeader}>
              <View>
                <Text style={[styles.widgetLabel, { color: Colors.gentleLavender }]}>PESO</Text>
                <Text style={[styles.widgetValue, { color: C.text }]}>
                  {selectedProfile?.weight ?? "—"}{" "}
                  <Text style={[styles.widgetUnit, { color: C.textMuted }]}>kg</Text>
                </Text>
              </View>
              <View style={[styles.widgetIcon, { backgroundColor: Colors.primary + "18" }]}>
                <MaterialCommunityIcons name="scale-bathroom" size={18} color={Colors.primary} />
              </View>
            </View>
            <View style={styles.widgetSparkline}>
              <Sparkline />
            </View>
            <Text style={[styles.widgetFooter, { color: C.textMuted }]}>{weightVerifiedText}</Text>
          </View>

          {/* Upcoming Widget */}
          <View style={[styles.widget, { backgroundColor: C.surface }]}>
            <View style={styles.widgetHeader}>
              <View>
                <Text style={[styles.widgetLabel, { color: Colors.gentleLavender }]}>PRÓXIMO</Text>
                <Text style={[styles.widgetValue, { color: C.text }]} numberOfLines={1}>
                  {upcomingMed?.name ?? "Nenhum"}
                </Text>
                {upcomingMed && (
                  <Text style={[styles.widgetSubValue, { color: C.textMuted }]}>
                    {upcomingMed.type === "tablet" ? "Comprimido" : "Líquido"} • {upcomingMed.strength}{upcomingMed.unit}
                  </Text>
                )}
              </View>
              <View style={[styles.widgetIcon, { backgroundColor: Colors.lavenderLight }]}>
                <Ionicons name="calendar" size={18} color={Colors.gentleLavender} />
              </View>
            </View>
            {upcomingMed && (
              <View style={[styles.upcomingTime, { marginTop: "auto" }]}>
                <Ionicons name="time-outline" size={14} color={C.textMuted} />
                <Text style={[styles.upcomingTimeText, { color: C.textMuted }]}>A cada {upcomingMed.intervalHours}h</Text>
              </View>
            )}
          </View>
        </View>

        {/* Yesterday Summary */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionLabel, { color: Colors.gentleLavender }]}>ONTEM</Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.summaryCard,
            {
              backgroundColor: C.surface,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          onPress={() => router.push("/(tabs)/history")}
        >
          <View style={[styles.summaryIcon, { backgroundColor: "#dcf5ec" }]}>
            <Ionicons name="checkmark-circle" size={22} color="#2da870" />
          </View>
          <View>
            <Text style={[styles.summaryTitle, { color: C.text }]}>Todas as Doses Registradas</Text>
            <Text style={[styles.summarySubtitle, { color: C.textMuted }]}>{selectedProfile?.name ?? "—"} teve um bom dia</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.gentleLavender} style={{ marginLeft: "auto" }} />
        </Pressable>
      </ScrollView>

      {/* FAB */}
      <Pressable
        style={({ pressed }) => [
          styles.fab,
          { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] },
        ]}
        onPress={async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push("/add-medication");
        }}
      >
        <Ionicons name="add" size={30} color={Colors.primaryContent} />
      </Pressable>
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
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  dateText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
    marginTop: 2,
  },
  notifButton: {
    position: "relative",
    padding: 4,
  },
  notifDot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.gentleRose,
    borderWidth: 2,
    borderColor: "white",
  },
  profileScrollOuter: { flexGrow: 0 },
  profileScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  profileItem: {
    alignItems: "center",
    gap: 6,
    minWidth: 72,
  },
  avatarOuter: {
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInner: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  avatarInitials: {
    fontFamily: "Inter_700Bold",
  },
  avatarCheck: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  addProfileBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  profileName: {
    fontSize: 12,
    letterSpacing: 0.2,
  },
  feedScroll: { flex: 1 },
  feed: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 16,
  },
  card: {
    borderRadius: 20,
    flexDirection: "row",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  cardLeftBar: { width: 6 },
  cardContent: {
    flex: 1,
    padding: 18,
    gap: 14,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  medIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  medName: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.2,
  },
  medSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
  dueBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  dueBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  logNowBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logNowText: {
    color: Colors.primaryContent,
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
  widgetRow: {
    flexDirection: "row",
    gap: 14,
  },
  widget: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    height: 140,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 4,
  },
  widgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  widgetLabel: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
  },
  widgetValue: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    marginTop: 4,
    letterSpacing: -0.5,
  },
  widgetSubValue: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  widgetUnit: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  widgetIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  widgetSparkline: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  widgetFooter: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    position: "absolute",
    bottom: 12,
    left: 16,
  },
  upcomingTime: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  upcomingTimeText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  sectionHeader: { paddingHorizontal: 4, marginTop: 4 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
  },
  summaryCard: {
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  summarySubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  fab: {
    position: "absolute",
    bottom: 90,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
});
