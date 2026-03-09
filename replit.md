# Gentle Care - Family Health Tracker

## Overview
A polished mobile app for tracking medications, doses, and health data for family members. Built with Expo React Native using Expo Router for file-based navigation.

## App Flow
1. **Welcome Screen** (`app/welcome.tsx`) - Branded login/signup with email and Google button
2. **Dashboard** (`app/(tabs)/index.tsx`) - Profile selector, next dose card, weight widget, upcoming meds
3. **Medicine Cabinet** (`app/(tabs)/cabinet.tsx`) - List of medications for selected profile
4. **History Log** (`app/(tabs)/history.tsx`) - Grouped log entries filterable by profile

## Modal Screens
- **Dose Logger** (`app/dose-logger.tsx`) - Stepper for dose amount, time picker, safety check trigger
- **Weight Check** (`app/weight-check.tsx`) - Update profile weight before dose calculation
- **Safety Check** (`app/safety-check.tsx`) - Alert when logging dose too soon
- **Medication Insight** (`app/medication-insight.tsx`) - AI summary with safe dose calculation
- **Add Medication** (`app/add-medication.tsx`) - Form to add a new medication with scan label

## Design System
- **Primary**: `#2beeba` (mint green)
- **Background Light**: `#f6f8f7`
- **Background Dark**: `#10221d`
- **Gentle Sage**: `#7C9A92`
- **Gentle Rose**: `#E89D9D`
- **Gentle Lavender**: `#B8B8D1`

## Architecture
- **State**: `contexts/AppContext.tsx` - manages profiles, medications, dose logs with AsyncStorage persistence
- **Navigation**: Expo Router file-based routing with Stack + Tabs
- **Tabs**: Home, Cabinet, History with liquid glass on iOS 26+
- **Fonts**: Inter (400, 500, 600, 700) from @expo-google-fonts/inter

## Tech Stack
- Expo Router for navigation
- AsyncStorage for data persistence (no backend required)
- React Native Reanimated for animations
- @expo/vector-icons (Ionicons, MaterialCommunityIcons)
- expo-haptics for tactile feedback
- expo-linear-gradient for visual effects

## Workflows
- `Start Backend`: Express server on port 5000 (minimal, just serves the landing page)
- `Start Frontend`: Expo dev server on port 8081
