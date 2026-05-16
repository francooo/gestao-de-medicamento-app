# Gentle Care - Family Health Tracker

## Overview
A polished mobile app for tracking medications, doses, and health data for family members. Built with Expo React Native using Expo Router for file-based navigation.

## App Flow
1. **Welcome Screen** (`app/welcome.tsx`) - Branded login/signup with real email/password auth
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
- **State**: `contexts/AppContext.tsx` - manages profiles, medications, dose logs via API calls + JWT auth
- **Navigation**: Expo Router file-based routing with Stack + Tabs
- **Tabs**: Home, Cabinet, History with liquid glass on iOS 26+
- **Fonts**: Inter (400, 500, 600, 700) from @expo-google-fonts/inter

## Tech Stack
- Expo Router for navigation
- PostgreSQL via Drizzle ORM for data persistence (NEON_DATABASE_URL / DATABASE_URL)
- JWT authentication (jsonwebtoken + bcryptjs) stored in AsyncStorage
- React Native Reanimated for animations
- @expo/vector-icons (Ionicons, MaterialCommunityIcons)
- expo-haptics for tactile feedback
- expo-linear-gradient for visual effects

## Workflows
- `Start Backend`: Express server on port 5000 — serves API routes and landing page
- `Start Frontend`: Expo dev server on port 8081

## Database
- Uses Replit's built-in PostgreSQL (env: `NEON_DATABASE_URL` or `DATABASE_URL`)
- Schema defined in `shared/schema.ts` using Drizzle ORM
- Tables: `users`, `profiles`, `medications`, `dose_logs`
- **Apply schema changes**: run `npm run db:push` after editing `shared/schema.ts`
- Auth secret: `JWT_SECRET` stored in Replit Secrets (not env vars)

## API Routes (all prefixed `/api`)
- `POST /api/auth/register` — create account
- `POST /api/auth/login` — get JWT token
- `GET /api/auth/me` — validate token
- `GET/POST/PUT/DELETE /api/profiles` — manage family profiles
- `GET/POST/PUT/DELETE /api/medications` — manage medications
- `GET/POST/PUT/DELETE /api/logs` — manage dose logs
