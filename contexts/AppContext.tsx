import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiRequest, getToken, setToken, clearToken } from "@/lib/query-client";
import { scheduleNextDoseNotification, cancelDoseNotification, requestNotificationPermissions } from "@/lib/notifications";

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
  reminderLeadMinutes: number;
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

interface AuthUser {
  id: string;
  email: string;
}

interface AppContextValue {
  profiles: Profile[];
  selectedProfileId: string | null;
  selectedProfile: Profile | null;
  medications: Medication[];
  doseLogs: DoseLog[];
  isLoaded: boolean;
  isAuthenticated: boolean;
  authUser: AuthUser | null;
  authError: string | null;
  selectProfile: (id: string) => void;
  addProfile: (profile: Omit<Profile, "id">) => Promise<void>;
  updateProfile: (id: string, updates: Partial<Profile>) => Promise<void>;
  removeProfile: (id: string) => Promise<void>;
  addMedication: (medication: Omit<Medication, "id">) => Promise<void>;
  removeMedication: (id: string) => Promise<void>;
  addDoseLog: (log: Omit<DoseLog, "id">) => Promise<void>;
  getMedicationsForProfile: (profileId: string) => Medication[];
  getLogsForProfile: (profileId: string) => DoseLog[];
  getLastDoseLog: (medicationId: string) => DoseLog | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setAuthenticated: (value: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const SELECTED_PROFILE_KEY = "gc_selected_profile";

interface RawProfile {
  id: string;
  name: string;
  weight?: number;
  weightVerifiedAt?: number | null;
  weight_verified_at?: number | null;
  avatarColor?: string;
  avatar_color?: string;
}

interface RawMedication {
  id: string;
  profileId?: string;
  profile_id?: string;
  name: string;
  type?: string;
  strength?: number;
  unit?: string;
  notes?: string | null;
  intervalHours?: number;
  interval_hours?: number;
  durationDays?: number;
  duration_days?: number;
  reminderLeadMinutes?: number;
  reminder_lead_minutes?: number;
}

interface RawDoseLog {
  id: string;
  profileId?: string;
  profile_id?: string;
  medicationId?: string | null;
  medication_id?: string | null;
  medicationName?: string;
  medication_name?: string;
  dose?: number | null;
  unit?: string | null;
  timestamp: number;
  type?: string;
  value?: number | null;
  note?: string | null;
}

function mapProfile(raw: RawProfile): Profile {
  return {
    id: raw.id,
    name: raw.name,
    weight: raw.weight ?? 0,
    weightVerifiedAt: raw.weightVerifiedAt ?? raw.weight_verified_at ?? undefined,
    avatarColor: raw.avatarColor ?? raw.avatar_color ?? "#2beeba",
  };
}

function mapMedication(raw: RawMedication): Medication {
  return {
    id: raw.id,
    profileId: raw.profileId ?? raw.profile_id ?? "",
    name: raw.name,
    type: (raw.type as Medication["type"]) ?? "other",
    strength: raw.strength ?? 0,
    unit: (raw.unit as Medication["unit"]) ?? "mg",
    notes: raw.notes ?? undefined,
    intervalHours: raw.intervalHours ?? raw.interval_hours ?? 8,
    durationDays: raw.durationDays ?? raw.duration_days ?? 7,
    reminderLeadMinutes: raw.reminderLeadMinutes ?? raw.reminder_lead_minutes ?? 0,
  };
}

function mapLog(raw: RawDoseLog): DoseLog {
  return {
    id: raw.id,
    profileId: raw.profileId ?? raw.profile_id ?? "",
    medicationId: raw.medicationId ?? raw.medication_id ?? undefined,
    medicationName: raw.medicationName ?? raw.medication_name ?? "",
    dose: raw.dose ?? undefined,
    unit: raw.unit ?? undefined,
    timestamp: raw.timestamp,
    type: (raw.type as LogType) ?? "dose",
    value: raw.value ?? undefined,
    note: raw.note ?? undefined,
  };
}

function parseApiError(err: unknown, fallback: string): string {
  if (!(err instanceof Error)) return fallback;
  const msg = err.message.replace(/^\d+:\s*/, "");
  try {
    return (JSON.parse(msg) as { message?: string }).message || msg;
  } catch {
    return msg || fallback;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [doseLogs, setDoseLogs] = useState<DoseLog[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const token = await getToken();
      if (!token) {
        setIsLoaded(true);
        return;
      }
      const res = await apiRequest("GET", "/api/auth/me");
      const data = await res.json();
      setAuthUser(data.user);
      setIsAuthenticated(true);
      await loadData();
    } catch {
      await clearToken();
      setIsLoaded(true);
    }
  }

  async function loadData() {
    try {
      const [profilesRes, medsRes, logsRes] = await Promise.all([
        apiRequest("GET", "/api/profiles"),
        apiRequest("GET", "/api/medications"),
        apiRequest("GET", "/api/logs"),
      ]);
      const rawProfiles = await profilesRes.json();
      const rawMeds = await medsRes.json();
      const rawLogs = await logsRes.json();

      const loadedProfiles = rawProfiles.map(mapProfile);
      const loadedMeds = rawMeds.map(mapMedication);
      const loadedLogs = rawLogs.map(mapLog);

      setProfiles(loadedProfiles);
      setMedications(loadedMeds);
      setDoseLogs(loadedLogs);

      const savedId = await AsyncStorage.getItem(SELECTED_PROFILE_KEY);
      const hasProfile = loadedProfiles.find((p: Profile) => p.id === savedId);
      setSelectedProfileId(hasProfile ? savedId : (loadedProfiles[0]?.id ?? null));
    } catch (e) {
      console.error("Failed to load data:", e);
    } finally {
      setIsLoaded(true);
    }
  }

  async function login(email: string, password: string) {
    setAuthError(null);
    try {
      const res = await apiRequest("POST", "/api/auth/login", { email, password });
      const data = await res.json() as { token: string; user: AuthUser };
      await setToken(data.token);
      setAuthUser(data.user);
      setIsAuthenticated(true);
      await loadData();
      requestNotificationPermissions();
    } catch (err) {
      const msg = parseApiError(err, "Login failed");
      setAuthError(msg);
      throw new Error(msg);
    }
  }

  async function register(email: string, password: string) {
    setAuthError(null);
    try {
      const res = await apiRequest("POST", "/api/auth/register", { email, password });
      const data = await res.json() as { token: string; user: AuthUser };
      await setToken(data.token);
      setAuthUser(data.user);
      setIsAuthenticated(true);
      await loadData();
      requestNotificationPermissions();
    } catch (err) {
      const msg = parseApiError(err, "Registration failed");
      setAuthError(msg);
      throw new Error(msg);
    }
  }

  async function logout() {
    await clearToken();
    setAuthUser(null);
    setIsAuthenticated(false);
    setProfiles([]);
    setMedications([]);
    setDoseLogs([]);
    setSelectedProfileId(null);
    setAuthError(null);
    await AsyncStorage.removeItem(SELECTED_PROFILE_KEY);
  }

  function setAuthenticated(value: boolean) {
    setIsAuthenticated(value);
  }

  function selectProfile(id: string) {
    setSelectedProfileId(id);
    AsyncStorage.setItem(SELECTED_PROFILE_KEY, id);
  }

  async function addProfile(profile: Omit<Profile, "id">) {
    const res = await apiRequest("POST", "/api/profiles", profile);
    const raw = await res.json();
    const newProfile = mapProfile(raw);
    setProfiles((prev) => [...prev, newProfile]);
    if (!selectedProfileId) {
      setSelectedProfileId(newProfile.id);
    }
  }

  async function updateProfile(id: string, updates: Partial<Profile>) {
    const current = profiles.find((p) => p.id === id);
    if (!current) return;
    const merged = { ...current, ...updates };
    const res = await apiRequest("PUT", `/api/profiles/${id}`, merged);
    const raw = await res.json();
    setProfiles((prev) => prev.map((p) => (p.id === id ? mapProfile(raw) : p)));
  }

  async function removeProfile(id: string) {
    const profileMeds = medications.filter((m) => m.profileId === id);
    await apiRequest("DELETE", `/api/profiles/${id}`);
    await Promise.all(profileMeds.map((m) => cancelDoseNotification(m.id)));
    setProfiles((prev) => prev.filter((p) => p.id !== id));
    setMedications((prev) => prev.filter((m) => m.profileId !== id));
    setDoseLogs((prev) => prev.filter((l) => l.profileId !== id));
    if (selectedProfileId === id) {
      const remaining = profiles.filter((p) => p.id !== id);
      setSelectedProfileId(remaining[0]?.id ?? null);
    }
  }

  async function addMedication(medication: Omit<Medication, "id">) {
    const res = await apiRequest("POST", "/api/medications", medication);
    const raw = await res.json();
    setMedications((prev) => [...prev, mapMedication(raw)]);
  }

  async function removeMedication(id: string) {
    await apiRequest("DELETE", `/api/medications/${id}`);
    await cancelDoseNotification(id);
    setMedications((prev) => prev.filter((m) => m.id !== id));
  }

  async function addDoseLog(log: Omit<DoseLog, "id">) {
    const res = await apiRequest("POST", "/api/logs", log);
    const raw = await res.json();
    const mapped = mapLog(raw);
    setDoseLogs((prev) => [mapped, ...prev]);

    if (mapped.medicationId && mapped.type === "dose") {
      const med = medications.find((m) => m.id === mapped.medicationId);
      const profile = profiles.find((p) => p.id === mapped.profileId);
      if (med && profile) {
        await scheduleNextDoseNotification(
          med.id,
          med.name,
          profile.name,
          med.intervalHours,
          mapped.timestamp,
          med.reminderLeadMinutes
        );
      }
    }
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
      authUser,
      authError,
      selectProfile,
      addProfile,
      updateProfile,
      removeProfile,
      addMedication,
      removeMedication,
      addDoseLog,
      getMedicationsForProfile,
      getLogsForProfile,
      getLastDoseLog,
      login,
      register,
      logout,
      setAuthenticated,
    }),
    [profiles, selectedProfileId, selectedProfile, medications, doseLogs, isLoaded, isAuthenticated, authUser, authError]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
