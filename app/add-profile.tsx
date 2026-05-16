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
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useApp } from "@/contexts/AppContext";
import Colors from "@/constants/colors";

const AVATAR_COLORS = [
  "#2beeba",
  "#E89D9D",
  "#B8B8D1",
  "#7C9A92",
  "#F4A261",
  "#A8DADC",
  "#E76F51",
  "#52B788",
  "#9B72CF",
  "#F9C74F",
];

function InputField({
  label,
  icon,
  isDark,
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
            borderColor: focused ? Colors.primary : isDark ? Colors.borderDark : "#e5e7eb",
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
          {...props}
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

export default function AddProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const { addProfile, updateProfile, removeProfile, profiles } = useApp();
  const params = useLocalSearchParams<{ editId?: string }>();

  const editingProfile = params.editId ? profiles.find((p) => p.id === params.editId) : null;
  const isEditing = !!editingProfile;

  const C = isDark ? Colors.dark : Colors.light;
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomPad = insets.bottom + (Platform.OS === "web" ? 34 : 16);

  const [name, setName] = useState(editingProfile?.name ?? "");
  const [weight, setWeight] = useState(editingProfile?.weight ? String(editingProfile.weight) : "");
  const [birthDate, setBirthDate] = useState("");
  const [avatarColor, setAvatarColor] = useState(editingProfile?.avatarColor ?? AVATAR_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const canSave = name.trim().length > 0;
  const initials = name.trim().slice(0, 2).toUpperCase() || "?";

  async function handleSave() {
    if (!canSave || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const profileData = {
        name: name.trim(),
        weight: parseFloat(weight) || 0,
        avatarColor,
      };
      if (isEditing && editingProfile) {
        await updateProfile(editingProfile.id, profileData);
      } else {
        await addProfile(profileData);
      }
      router.back();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Falha ao salvar perfil");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editingProfile) return;
    Alert.alert(
      "Remover Perfil",
      `Tem certeza que deseja remover o perfil de ${editingProfile.name}? Todos os medicamentos e registros associados também serão removidos.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            try {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              await removeProfile(editingProfile.id);
              router.back();
            } catch (err) {
              setSaveError(err instanceof Error ? err.message : "Falha ao remover perfil");
            }
          },
        },
      ]
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Pressable style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={[styles.cancelText, { color: C.textMuted }]}>Cancelar</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: C.text }]}>
          {isEditing ? "Editar Perfil" : "Novo Membro"}
        </Text>
        <Pressable
          style={[
            styles.saveBtn,
            { backgroundColor: canSave && !saving ? Colors.primary : Colors.primary + "50" },
          ]}
          onPress={handleSave}
          disabled={!canSave || saving}
        >
          <Text style={styles.saveBtnText}>{saving ? "..." : "Salvar"}</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        {saveError ? (
          <View style={[styles.errorBanner, { backgroundColor: Colors.gentleRose + "22" }]}>
            <Ionicons name="alert-circle-outline" size={16} color={Colors.gentleRose} />
            <Text style={[styles.errorBannerText, { color: Colors.gentleRose }]}>{saveError}</Text>
          </View>
        ) : null}

        {/* Avatar Preview */}
        <View style={styles.avatarPreviewSection}>
          <View
            style={[
              styles.avatarPreview,
              { backgroundColor: avatarColor + "22", borderColor: avatarColor + "60" },
            ]}
          >
            <Text style={[styles.avatarInitials, { color: avatarColor }]}>{initials}</Text>
          </View>
          <Text style={[styles.avatarHint, { color: C.textMuted }]}>
            {isEditing ? "Edite as informações abaixo" : "Escolha uma cor e preencha os dados"}
          </Text>
        </View>

        {/* Color Picker */}
        <View style={styles.colorSection}>
          <Text style={[styles.sectionLabel, { color: Colors.gentleSage }]}>COR DO AVATAR</Text>
          <View style={styles.colorGrid}>
            {AVATAR_COLORS.map((color) => (
              <Pressable
                key={color}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: color },
                  avatarColor === color && styles.colorSwatchSelected,
                ]}
                onPress={async () => {
                  await Haptics.selectionAsync();
                  setAvatarColor(color);
                }}
              >
                {avatarColor === color && (
                  <Ionicons name="checkmark" size={18} color="#fff" />
                )}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <InputField
            label="Nome"
            icon="person"
            value={name}
            onChangeText={setName}
            placeholder="ex.: Mãe, Leo, Papai..."
            isDark={isDark}
          />

          <InputField
            label="Peso (kg)"
            icon="fitness-outline"
            value={weight}
            onChangeText={setWeight}
            placeholder="ex.: 68.5"
            keyboardType="decimal-pad"
            isDark={isDark}
          />

          <View style={[styles.weightNote, { backgroundColor: isDark ? Colors.surfaceDark : Colors.mintSoft }]}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.gentleSage} />
            <Text style={[styles.weightNoteText, { color: Colors.gentleSage }]}>
              O peso é usado para calcular a dose segura de cada medicamento. Você pode atualizá-lo depois.
            </Text>
          </View>

          <InputField
            label="Data de Nascimento"
            icon="calendar"
            value={birthDate}
            onChangeText={setBirthDate}
            placeholder="dd/mm/aaaa"
            keyboardType="numbers-and-punctuation"
            isDark={isDark}
          />
        </View>

        {/* Delete Button (edit mode only) */}
        {isEditing && (
          <Pressable
            style={({ pressed }) => [
              styles.deleteBtn,
              {
                backgroundColor: isDark ? Colors.surfaceDark : Colors.surfaceLight,
                borderColor: Colors.gentleRose + "60",
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={18} color={Colors.gentleRose} />
            <Text style={[styles.deleteBtnText, { color: Colors.gentleRose }]}>
              Remover Perfil
            </Text>
          </Pressable>
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
    gap: 24,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  avatarPreviewSection: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  avatarPreview: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarInitials: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  avatarHint: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  colorSection: { gap: 12 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    paddingLeft: 4,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  colorSwatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  colorSwatchSelected: {
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    transform: [{ scale: 1.1 }],
  },
  form: { gap: 20 },
  weightNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  weightNoteText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    paddingVertical: 16,
    marginTop: 8,
  },
  deleteBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
