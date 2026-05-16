import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function scheduleNextDoseNotification(
  medicationId: string,
  medicationName: string,
  profileName: string,
  intervalHours: number,
  doseTimestamp: number,
  reminderLeadMinutes: number = 0
): Promise<void> {
  if (Platform.OS === "web") return;

  await cancelDoseNotification(medicationId);

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") return;

  const nextDoseMs = doseTimestamp + intervalHours * 3600000;
  const triggerMs = nextDoseMs - reminderLeadMinutes * 60000;
  const triggerTime = new Date(triggerMs);

  if (triggerTime.getTime() <= Date.now()) return;

  const leadLabel =
    reminderLeadMinutes === 5
      ? " em 5 minutos"
      : reminderLeadMinutes === 15
      ? " em 15 minutos"
      : "";

  await Notifications.scheduleNotificationAsync({
    identifier: `dose-${medicationId}`,
    content: {
      title: `Hora do ${medicationName}${leadLabel}`,
      body:
        reminderLeadMinutes > 0
          ? `${profileName} precisará tomar ${medicationName} em ${reminderLeadMinutes} minutos.`
          : `${profileName} precisa tomar ${medicationName} agora.`,
      data: {
        url: `/dose-logger?medicationId=${medicationId}`,
        medicationId,
      },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerTime,
    },
  });
}

export async function cancelDoseNotification(medicationId: string): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.cancelScheduledNotificationAsync(`dose-${medicationId}`);
}
