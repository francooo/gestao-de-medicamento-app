import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Font from "expo-font";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { AppProvider } from "@/contexts/AppContext";
import { useColorScheme, Platform } from "react-native";
import * as Notifications from "expo-notifications";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: isDark ? "#10221d" : "#f6f8f7",
        },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="dose-logger"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="weight-check"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="safety-check"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="medication-insight"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="add-medication"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="add-profile"
        options={{ presentation: "modal", headerShown: false }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsReady, setFontsReady] = useState(false);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          Inter_400Regular,
          Inter_500Medium,
          Inter_600SemiBold,
          Inter_700Bold,
          ...Ionicons.font,
          ...MaterialCommunityIcons.font,
        });
      } catch (_e) {
      } finally {
        setFontsReady(true);
        SplashScreen.hideAsync().catch(() => {});
      }
    }
    loadFonts();
  }, []);

  useEffect(() => {
    if (Platform.OS === "web") return;

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      const data = response.notification.request.content.data as { medicationId?: string } | undefined;
      if (data?.medicationId) {
        router.push({
          pathname: "/dose-logger",
          params: { medicationId: data.medicationId },
        });
      }
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { medicationId?: string } | undefined;
      if (data?.medicationId) {
        router.push({
          pathname: "/dose-logger",
          params: { medicationId: data.medicationId },
        });
      }
    });

    return () => {
      responseListener.current?.remove();
    };
  }, []);

  if (!fontsReady) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <RootLayoutNav />
          </GestureHandlerRootView>
        </AppProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
