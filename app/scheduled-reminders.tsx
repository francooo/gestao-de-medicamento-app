import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import * as Haptics from "expo-haptics";
import { cancelDoseNotification } from "@/lib/notifications";
import Colors from "@/constants/colors";

interface ScheduledReminder {
  identifier: string;
  medicationId: string;
  title: string;
  body: string;
  scheduledAt: Date;
}

function formatDateTime(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = diffMs / 3600000;

  const timeStr = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 86400000);
  const remDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  let dayLabel: string;
  if (remDay.getTime() === today.getTime()) {
    dayLabel = "Hoje";
  } else if (remDay.getTime() === tomorrow.getTime()) {
    dayLabel = "Amanhã";
  } else {
    dayLabel = date.toLocaleDateString("pt-BR", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  const hoursLabel =
    diffHours < 1
      ? `em ${Math.max(1, Math.round(diffHours * 60))}min`
      : `em ${Math.round(diffHours)}h`;

  return `${dayLabel} às ${timeStr} · ${hoursLabel}`;
}

export default function ScheduledRemindersScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const C = isDark ? Colors.dark : Colors.light;

  const [reminders, setReminders] = useState<ScheduledReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [canceling, setCanceling] = useState<string | null>(null);

  function extractTriggerDate(trigger: unknown): Date | null {
    if (!trigger || typeof trigger !== "object") return null;
    const t = trigger as Record<string, unknown>;

    const candidates = [t.value, t.date, t.timestamp, t.fireDate, t.nextTriggerDate];
    for (const c of candidates) {
      if (typeof c === "number" && c > 0) return new Date(c);
      if (typeof c === "string") {
        const parsed = Date.parse(c);
        if (!isNaN(parsed)) return new Date(parsed);
      }
      if (c instanceof Date && !isNaN(c.getTime())) return c;
    }

    if (typeof t.seconds === "number" && t.seconds > 0) {
      return new Date(Date.now() + t.seconds * 1000);
    }

    return null;
  }

  const loadReminders = useCallback(async () => {
    if (Platform.OS === "web") {
      setLoading(false);
      return;
    }
    setLoadError(false);
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const parsed: ScheduledReminder[] = [];

      for (const notif of scheduled) {
        const data = notif.content.data as { medicationId?: string } | undefined;
        const medicationId = data?.medicationId;
        if (!medicationId) continue;

        const scheduledAt = extractTriggerDate(notif.trigger);
        if (!scheduledAt) continue;

        parsed.push({
          identifier: notif.identifier,
          medicationId,
          title: notif.content.title ?? medicationId,
          body: notif.content.body ?? "",
          scheduledAt,
        });
      }

      parsed.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
      setReminders(parsed);
    } catch (_e) {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  async function handleCancel(reminder: ScheduledReminder) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCanceling(reminder.identifier);
    try {
      await cancelDoseNotification(reminder.medicationId);
      setReminders((prev) => prev.filter((r) => r.identifier !== reminder.identifier));
    } finally {
      setCanceling(null);
    }
  }

  async function handleClose() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }

  return (
    <View style={styles.overlay}>
      <View style={[StyleSheet.absoluteFill, styles.backdrop]} />

      <View
        style={[
          styles.modal,
          {
            backgroundColor: isDark ? Colors.surfaceDark : Colors.surfaceLight,
            paddingBottom: insets.bottom + 24,
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.headerIcon, { backgroundColor: Colors.primary + "20" }]}>
              <Ionicons name="notifications" size={20} color={Colors.primary} />
            </View>
            <View>
              <Text style={[styles.title, { color: C.text }]}>Lembretes Agendados</Text>
              <Text style={[styles.subtitle, { color: C.textMuted }]}>
                {loading
                  ? "Carregando..."
                  : loadError
                  ? "Erro ao carregar lembretes"
                  : reminders.length === 0
                  ? "Nenhum lembrete ativo"
                  : `${reminders.length} lembrete${reminders.length !== 1 ? "s" : ""} ativo${reminders.length !== 1 ? "s" : ""}`}
              </Text>
            </View>
          </View>
          <Pressable style={styles.closeBtn} onPress={handleClose}>
            <Ionicons name="close" size={20} color={C.textMuted} />
          </Pressable>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: C.border }]} />

        {/* Content */}
        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : loadError ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: Colors.roseLight }]}>
              <Ionicons name="alert-circle-outline" size={36} color={Colors.gentleRose} />
            </View>
            <Text style={[styles.emptyTitle, { color: C.text }]}>Algo deu errado</Text>
            <Text style={[styles.emptyBody, { color: C.textMuted }]}>
              Não foi possível carregar os lembretes. Tente fechar e abrir novamente.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.retryBtn, { opacity: pressed ? 0.8 : 1 }]}
              onPress={() => { setLoading(true); loadReminders(); }}
            >
              <Ionicons name="refresh" size={15} color={Colors.primaryContent} />
              <Text style={styles.retryText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : Platform.OS === "web" ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: Colors.lavenderLight }]}>
              <Ionicons name="notifications-off-outline" size={36} color={Colors.gentleLavender} />
            </View>
            <Text style={[styles.emptyTitle, { color: C.text }]}>Não disponível na web</Text>
            <Text style={[styles.emptyBody, { color: C.textMuted }]}>
              Notificações agendadas só funcionam em dispositivos móveis.
            </Text>
          </View>
        ) : reminders.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: Colors.primary + "18" }]}>
              <Ionicons name="checkmark-circle-outline" size={36} color={Colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: C.text }]}>Tudo limpo</Text>
            <Text style={[styles.emptyBody, { color: C.textMuted }]}>
              Não há lembretes agendados no momento. Eles aparecem aqui após registrar uma dose.
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {reminders.map((reminder, index) => (
              <View
                key={reminder.identifier}
                style={[
                  styles.reminderCard,
                  {
                    backgroundColor: isDark ? Colors.backgroundDark : Colors.backgroundLight,
                    borderColor: C.border,
                    marginBottom: index < reminders.length - 1 ? 10 : 0,
                  },
                ]}
              >
                <View style={[styles.reminderLeftBar, { backgroundColor: Colors.primary }]} />
                <View style={styles.reminderContent}>
                  <View style={styles.reminderTop}>
                    <View style={[styles.reminderMedIcon, { backgroundColor: Colors.primary + "18" }]}>
                      <Ionicons name="medkit-outline" size={18} color={Colors.primary} />
                    </View>
                    <View style={styles.reminderText}>
                      <Text style={[styles.reminderTitle, { color: C.text }]} numberOfLines={1}>
                        {reminder.title}
                      </Text>
                      <Text style={[styles.reminderBody, { color: C.textMuted }]} numberOfLines={1}>
                        {reminder.body}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.reminderBottom}>
                    <View style={styles.reminderTimeRow}>
                      <Ionicons name="time-outline" size={13} color={Colors.gentleLavender} />
                      <Text style={[styles.reminderTime, { color: Colors.gentleLavender }]}>
                        {formatDateTime(reminder.scheduledAt)}
                      </Text>
                    </View>
                    <Pressable
                      style={({ pressed }) => [
                        styles.cancelBtn,
                        {
                          backgroundColor: Colors.roseLight,
                          opacity: pressed || canceling === reminder.identifier ? 0.7 : 1,
                        },
                      ]}
                      onPress={() => handleCancel(reminder)}
                      disabled={canceling === reminder.identifier}
                    >
                      {canceling === reminder.identifier ? (
                        <ActivityIndicator size={12} color={Colors.gentleRose} />
                      ) : (
                        <>
                          <Ionicons name="close" size={13} color={Colors.gentleRose} />
                          <Text style={[styles.cancelText, { color: Colors.gentleRose }]}>Cancelar</Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modal: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  divider: {
    height: 1,
    marginHorizontal: 24,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  emptyBody: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 20,
  },
  reminderCard: {
    borderRadius: 16,
    flexDirection: "row",
    overflow: "hidden",
    borderWidth: 1,
  },
  reminderLeftBar: {
    width: 4,
  },
  reminderContent: {
    flex: 1,
    padding: 14,
    gap: 10,
  },
  reminderTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  reminderMedIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  reminderText: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.1,
  },
  reminderBody: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  reminderBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reminderTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  reminderTime: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 70,
    justifyContent: "center",
  },
  cancelText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 8,
  },
  retryText: {
    color: Colors.primaryContent,
    fontFamily: "Inter_700Bold",
    fontSize: 13,
  },
});
