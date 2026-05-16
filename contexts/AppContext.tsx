import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Profile {
  id: string;
  name: string;
  weight: number;
  weightVerifiedAt?: number;
  avatarColor: string;
}

export interface Medication {
  id: string;
  profileId: string;
  name: string;
  type: "liquid" | "tablet" | "other";
  strength: number;
  unit: "ml" | "mg" | "drops" | "mcg" | "units";
  notes?: string;
  intervalHours: number;
  durationDays: number;
}

export type LogType = "dose" | "weight" | "temperature" | "note";

export interface DoseLog {
  id: string;
  profileId: string;
  medicationId?: string;
  medicationName: string;
  dose?: number;
  unit?: string;
  timestamp: number;
  type: LogType;
  value?: number;
  note?: string;
}

interface AppContextValue {
  profiles: Profile[];
  selectedProfileId: string | null;
  selectedProfile: Profile | null;
  medications: Medication[];
  doseLogs: DoseLog[];
  isLoaded: boolean;
  isAuthenticated: boolean;
  selectProfile: (id: string) => void;
  addProfile: (profile: Omit<Profile, "id">) => void;
  updateProfile: (id: string, updates: Partial<Profile>) => void;
  addMedication: (medication: Omit<Medication, "id">) => void;
  removeMedication: (id: string) => void;
  addDoseLog: (log: Omit<DoseLog, "id">) => void;
  getMedicationsForProfile: (profileId: string) => Medication[];
  getLogsForProfile: (profileId: string) => DoseLog[];
  getLastDoseLog: (medicationId: string) => DoseLog | null;
  setAuthenticated: (value: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEYS = {
  profiles: "gc_profiles",
  selectedProfileId: "gc_selected_profile",
  medications: "gc_medications",
  doseLogs: "gc_dose_logs",
  isAuthenticated: "gc_authenticated",
};

const AVATAR_COLORS = ["#2beeba", "#E89D9D", "#B8B8D1", "#7C9A92", "#F5A623", "#9B59B6"];

const DEFAULT_PROFILES: Profile[] = [
  { id: "1", name: "Leo", weight: 14.2, weightVerifiedAt: Date.now() - 2 * 24 * 3600000, avatarColor: "#2beeba" },
  { id: "2", name: "Dad", weight: 80, avatarColor: "#7C9A92" },
  { id: "3", name: "Mom", weight: 62, avatarColor: "#E89D9D" },
];

const DEFAULT_MEDICATIONS: Medication[] = [
  { id: "m1", profileId: "1", name: "Amoxicillin", type: "liquid", strength: 250, unit: "mg", notes: "Tomar com alimento", intervalHours: 8, durationDays: 5 },
  { id: "m2", profileId: "1", name: "Ibuprofen", type: "liquid", strength: 200, unit: "mg", notes: "Evitar estômago vazio", intervalHours: 6, durationDays: 3 },
  { id: "m3", profileId: "2", name: "Vitamina D", type: "tablet", strength: 1000, unit: "units", intervalHours: 24, durationDays: 30 },
];

const DEFAULT_LOGS: DoseLog[] = [
  { id: "l1", profileId: "1", medicationId: "m2", medicationName: "Ibuprofen", dose: 5, unit: "ml", timestamp: Date.now() - 2 * 3600000, type: "dose" },
  { id: "l2", profileId: "1", medicationName: "Verificação de Peso", timestamp: Date.now() - 2.5 * 3600000, type: "weight", value: 14.2 },
  { id: "l3", profileId: "1", medicationId: "m1", medicationName: "Amoxicillin", dose: 5, unit: "ml", timestamp: Date.now() - 26 * 3600000, type: "dose" },
  { id: "l4", profileId: "1", medicationName: "Temperatura", timestamp: Date.now() - 26.5 * 3600000, type: "temperature", value: 38.5 },
  { id: "l5", profileId: "1", medicationName: "Nota do Médico", timestamp: Date.now() - 38 * 3600000, type: "note", note: "Beba bastante água" },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [doseLogs, setDoseLogs] = useState<DoseLog[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAuthenticated, setIsAuthenticatedState] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [profilesStr, selectedId, medsStr, logsStr, authStr] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.profiles),
        AsyncStorage.getItem(STORAGE_KEYS.selectedProfileId),
        AsyncStorage.getItem(STORAGE_KEYS.medications),
        AsyncStorage.getItem(STORAGE_KEYS.doseLogs),
        AsyncStorage.getItem(STORAGE_KEYS.isAuthenticated),
      ]);

      const loadedProfiles = profilesStr ? JSON.parse(profilesStr) : DEFAULT_PROFILES;
      const loadedMeds = medsStr ? JSON.parse(medsStr) : DEFAULT_MEDICATIONS;
      const loadedLogs = logsStr ? JSON.parse(logsStr) : DEFAULT_LOGS;
      const loadedAuth = authStr === "true";

      setProfiles(loadedProfiles);
      setSelectedProfileId(selectedId || (loadedProfiles[0]?.id ?? null));
      setMedications(loadedMeds);
      setDoseLogs(loadedLogs);
      setIsAuthenticatedState(loadedAuth);
    } catch (e) {
      setProfiles(DEFAULT_PROFILES);
      setSelectedProfileId(DEFAULT_PROFILES[0].id);
      setMedications(DEFAULT_MEDICATIONS);
      setDoseLogs(DEFAULT_LOGS);
    } finally {
      setIsLoaded(true);
    }
  }

  async function saveProfiles(data: Profile[]) {
    setProfiles(data);
    await AsyncStorage.setItem(STORAGE_KEYS.profiles, JSON.stringify(data));
  }

  async function saveMedications(data: Medication[]) {
    setMedications(data);
    await AsyncStorage.setItem(STORAGE_KEYS.medications, JSON.stringify(data));
  }

  async function saveDoseLogs(data: DoseLog[]) {
    setDoseLogs(data);
    await AsyncStorage.setItem(STORAGE_KEYS.doseLogs, JSON.stringify(data));
  }

  function selectProfile(id: string) {
    setSelectedProfileId(id);
    AsyncStorage.setItem(STORAGE_KEYS.selectedProfileId, id);
  }

  function addProfile(profile: Omit<Profile, "id">) {
    const newProfile: Profile = {
      ...profile,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
      avatarColor: AVATAR_COLORS[profiles.length % AVATAR_COLORS.length],
    };
    saveProfiles([...profiles, newProfile]);
  }

  function updateProfile(id: string, updates: Partial<Profile>) {
    const updated = profiles.map((p) => (p.id === id ? { ...p, ...updates } : p));
    saveProfiles(updated);
  }

  function addMedication(medication: Omit<Medication, "id">) {
    const newMed: Medication = {
      ...medication,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
    };
    saveMedications([...medications, newMed]);
  }

  function removeMedication(id: string) {
    saveMedications(medications.filter((m) => m.id !== id));
  }

  function addDoseLog(log: Omit<DoseLog, "id">) {
    const newLog: DoseLog = {
      ...log,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
    };
    saveDoseLogs([newLog, ...doseLogs]);
  }

  function getMedicationsForProfile(profileId: string) {
    return medications.filter((m) => m.profileId === profileId);
  }

  function getLogsForProfile(profileId: string) {
    return doseLogs
      .filter((l) => l.profileId === profileId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  function getLastDoseLog(medicationId: string): DoseLog | null {
    const logs = doseLogs
      .filter((l) => l.medicationId === medicationId && l.type === "dose")
      .sort((a, b) => b.timestamp - a.timestamp);
    return logs[0] ?? null;
  }

  async function setAuthenticated(value: boolean) {
    setIsAuthenticatedState(value);
    await AsyncStorage.setItem(STORAGE_KEYS.isAuthenticated, value ? "true" : "false");
  }

  const selectedProfile = useMemo(
    () => profiles.find((p) => p.id === selectedProfileId) ?? null,
    [profiles, selectedProfileId]
  );

  const value = useMemo(
    () => ({
      profiles,
      selectedProfileId,
      selectedProfile,
      medications,
      doseLogs,
      isLoaded,
      isAuthenticated,
      selectProfile,
      addProfile,
      updateProfile,
      addMedication,
      removeMedication,
      addDoseLog,
      getMedicationsForProfile,
      getLogsForProfile,
      getLastDoseLog,
      setAuthenticated,
    }),
    [profiles, selectedProfileId, selectedProfile, medications, doseLogs, isLoaded, isAuthenticated]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
