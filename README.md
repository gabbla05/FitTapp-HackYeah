# FitTapp (Minimal-UI Habit Assistant)

> A habit tracking and contextual health recommendation mobile app that shifts 90% of user interactions to **actionable lock-screen push notifications** and **Live Activities**.
>
> **Core Value:** Users never waste time navigating complex menus or manually typing logs. One tap directly on the lock screen is all it takes.

---

## 🚀 Live Preview & Running

The app is running live:
- **Local Browser:** [http://localhost:8081](http://localhost:8081)
- **Dev Server Command:** `npx expo start --web`

---

## 📱 Latest Updates & Architecture

### 1. Ultra-Minimalist Today Screen (`MinimalistDashboard.tsx`)
- **Zero Clutter:** Removed weekly rhythm circles and streak badges from the Today screen.
- Contains only:
  - Clean greeting: *"Hey, Gabriel"* with contextual weather hint.
  - **Today's Micro-Habits** (Movement, Hydration, Nutrition, Sleep, Mood).

### 2. Statistics & Streaks Moved to Progress Tab (`ProgressScreen.tsx`)
- Accessible via the bottom navigation bar: **`Progress`**.
- Hosts the **7-Day Weekly Rhythm** (`Mon, Tue, Wed, Thu, Fri, Sat, Sun`).
- Displays **Weekly Streak** consistency (`Streak: 5 weeks`, `Wk 36`, `Wk 37`, `Wk 38`, `This Wk`).
- Attention Budget usage breakdown (`1 / 3 hints today`).
- **FitTapp Adaptive Engine** calibration status.
- **Zero-UI Scorecard** (92% lock-screen interactions, 48 min saved).

### 3. In-App Real GPS Live Walk Map (`ActiveWalkMapScreen.tsx`)
- **Clean Lock Screen Widget:** Removed the wave/green chart lines from the Live Walk notification.
- **Direct Navigation:** Tapping the notification or *"Open Live GPS Map in App ↗"* takes the user directly to the in-app GPS map screen.
- **Real User Geolocation:** Fetches live GPS coordinates from the user's device (`navigator.geolocation.watchPosition`).
- **Interactive Street Map:** Real OpenStreetMap display showing real streets and real-time position.
- **Live Metrics:** Dynamic distance (computed via Haversine formula), real-time elapsed timer, estimated steps, and pace.
- **Adaptive Finish Flow:** Question *"How did your walk feel? [Too easy] [Just right] [Too hard]"* automatically calibrates future walk targets.

### 4. All 5 Actionable Notification Types Showcase (`NotificationShowcase.tsx`)
Accessible from the top demo switcher (`3. All 5 Push Types`):
1. **Movement - Outdoor Walk:** (Context: Sunny & 70°F) -> `[Start Walk (GPS Map)]` `[Not now]`
2. **Movement - Desk Stretch:** (Context: Rainy) -> `[Start 2m Stretch]` `[Not today]`
3. **Hydration:** (Water Check) -> `[Drank it (+250ml)]` `[Snooze 1h]`
4. **Sleep Quality:** (Morning Wake-up) -> `[Rested]` `[Moderate]` `[Fatigued]`
5. **Mood & Stress:** (Evening Reflection) -> `[Calm]` `[Flow]` `[Tense]`
6. **Healthy Nutrition:** (Light Meal Reminder) -> `[Ate Healthy]` `[Not today]`
### 5. Local-First SQLite Database (`storageService.ts`, `schema.ts`)
- **Native APK SQLite Engine:** Uses `expo-sqlite` on native Android/iOS builds to persist habit events and attention budgets with sub-2ms latency.
- **Event-Sourcing Architecture:** Instead of destructively overwriting counts, logs every micro-habit interaction as an immutable time-series event (`habit_events`).
- **Web Fallback:** Seamlessly bridges to persistent browser storage on web.

### 6. Zero-Friction Onboarding (`OnboardingScreen.tsx`)
- **No Passwords:** Users only enter a `@handle` upon first launch.
- **Live Validation:** Checks availability against existing users and reserved keywords. Taken names immediately display a neutral warning.
- **Persistent Profile:** Once reserved, the profile is permanently saved in SQLite and the user never sees onboarding again.

### 7. Real Device Push Notifications (`notificationService.ts`)
- **Actionable Categories:** Registers lock-screen action buttons (`Drank it`, `Start Walk`, `Snooze`, `Rested`, `Calm`).
- **Lock-Screen Background Listener:** Tapping action buttons logs habit events directly into SQLite without needing to bring the full app to foreground.
- **Live Weather Integration:** Open-Meteo API automatically informs notifications (e.g. suggesting desk stretch when it rains).
