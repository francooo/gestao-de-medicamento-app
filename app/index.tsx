import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useApp } from "@/contexts/AppContext";
import Colors from "@/constants/colors";

export default function IndexScreen() {
  const { isLoaded, isAuthenticated } = useApp();

  useEffect(() => {
    if (!isLoaded) return;
    if (isAuthenticated) {
      router.replace("/(tabs)");
    } else {
      router.replace("/welcome");
    }
  }, [isLoaded, isAuthenticated]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.backgroundLight }}>
      <ActivityIndicator color={Colors.primary} size="large" />
    </View>
  );
}
