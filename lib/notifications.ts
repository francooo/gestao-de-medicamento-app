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
  doseTimestamp: number
): Promise<void> {
  if (Platform.OS === "web") return;

  await cancelDoseNotification(medicationId);

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") return;

  const nextDoseTime = new Date(doseTimestamp + intervalHours * 3600000);

  if (nextDoseTime.getTime() <= Date.now()) return;

  await Notifications.scheduleNotificationAsync({
    identifier: `dose-${medicationId}`,
    content: {
      title: `Hora do ${medicationName}`,
      body: `${profileName} precisa tomar ${medicationName} agora.`,
      data: {
        url: `/dose-logger?medicationId=${medicationId}`,
        medicationId,
      },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: nextDoseTime,
    },
  });
}

export async function cancelDoseNotification(medicationId: string): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.cancelScheduledNotificationAsync(`dose-${medicationId}`);
}
