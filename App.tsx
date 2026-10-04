import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  StatusBar,
  Platform,
  ActivityIndicator,
  AppState,
} from 'react-native';
import { ActiveWalkMapScreen } from './src/components/ActiveWalkMapScreen';
import { MinimalistDashboard } from './src/components/MinimalistDashboard';
import { ProgressScreen } from './src/components/ProgressScreen';
import { SettingsScreen } from './src/components/SettingsScreen';
import { OnboardingScreen } from './src/components/OnboardingScreen';
import { COLORS } from './src/theme/theme';
import { ActivityFeedback, ActivityType, AppStateData } from './src/types';
import { fetchLiveWeather, detectCurrentLocation } from './src/services/weatherService';
import {
  initDatabase,
  getUserProfile,
  getTodayHabitSummary,
  getAttentionBudgetStatus,
  logHabitEvent,
  incrementAttentionBudget,
} from './src/database/storageService';
import {
  registerNotificationCategories,
  requestNotificationPermissions,
  setupNotificationResponseListener,
  checkColdStartNotificationResponse,
  sendMovementNotification,
  sendHydrationNotification,
  sendSleepNotification,
  sendMoodNotification,
  NOTIFICATION_CATEGORIES,
} from './src/services/notificationService';

type ScreenRoute = 'app' | 'walk_map';

export default function App() {
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  // Default to main in-app screen
  const [currentRoute, setCurrentRoute] = useState<ScreenRoute>('app');
  const [activeTab, setActiveTab] = useState<'today' | 'progress' | 'settings'>('today');
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Global State for FitTapp
  const [appState, setAppState] = useState<AppStateData>({
    userName: '',
    streakWeeks: 5,
    attentionBudgetUsed: 1,
    attentionBudgetTotal: 3,
    weather: 'sunny',

    // 5 Health Pillars
    waterMl: 1250,
    waterGoalMl: 2000,
    movementDone: false,
    movementType: null,
    sleepHours: 7.5,
    sleepQuality: 'Deep sleep (logged AM)',
    moodLogged: 'Calm',
    foodLogged: true,

    // Settings
    quietHoursStart: '22:00',
    quietHoursEnd: '07:30',
    strictLimitEnabled: true,
    contextSensorsEnabled: true,
  });

  // Inject Google Fonts on Web platform
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const fontId = 'fittapp-fonts';
      if (!document.getElementById(fontId)) {
        const link = document.createElement('link');
        link.id = fontId;
        link.rel = 'stylesheet';
        link.href =
          'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap';
        document.head.appendChild(link);
      }
    }
  }, []);

  // Helper to re-query SQLite and update dashboard metrics in real time
  const syncTodayStateFromDb = async () => {
    try {
      const summary = await getTodayHabitSummary();
      const budget = await getAttentionBudgetStatus();
      setAppState((prev) => ({
        ...prev,
        waterMl: summary.waterMl,
        movementDone: summary.movementDone,
        movementType: summary.movementType,
        sleepHours: summary.sleepHours,
        sleepQuality: summary.sleepQuality,
        moodLogged: summary.moodLogged,
        foodLogged: summary.foodLogged,
        attentionBudgetUsed: budget.pushedCount,
        attentionBudgetTotal: budget.dailyCap,
      }));
    } catch (e) {
      console.warn('Error reading updated habit summary from DB:', e);
    }
  };

  // Unified Handler for Lock-Screen Notification Button Clicks & Taps
  const handleNotificationAction = async (actionId: string, category: string, data: any) => {
    let toastMessage = '';

    // 1. Water Prompt
    if (actionId === 'ACTION_DRINK_250' || (actionId.includes('DEFAULT') && data?.type === 'water')) {
      await logHabitEvent({
        category: 'water',
        value_num: 250,
        value_text: '+250ml',
        feedback: null,
        weather_condition: null,
        temperature_c: null,
        source: 'lock_push',
      });
      toastMessage = '💧 Logged +250ml Water from Lock Screen!';
    }
    // 2. Outdoor Walk Prompt
    else if (
      actionId === 'ACTION_START_WALK' ||
      category === NOTIFICATION_CATEGORIES.MOVEMENT_WALK ||
      (actionId.includes('DEFAULT') && data?.type === 'walk')
    ) {
      setCurrentRoute('walk_map');
      toastMessage = '🏃 Opening Live GPS Walk Tracking...';
    }
    // 3. Desk Stretch Prompt
    else if (
      actionId === 'ACTION_START_STRETCH' ||
      category === NOTIFICATION_CATEGORIES.MOVEMENT_STRETCH ||
      (actionId.includes('DEFAULT') && data?.type === 'stretch')
    ) {
      await logHabitEvent({
        category: 'movement',
        value_num: 2.0,
        value_text: 'stretch',
        feedback: 'just_right',
        weather_condition: 'rain',
        temperature_c: null,
        source: 'lock_push',
      });
      toastMessage = '🧘 2-min Desk Stretch logged!';
    }
    // 4. Sleep Prompt
    else if (actionId.startsWith('ACTION_SLEEP_') || (actionId.includes('DEFAULT') && data?.type === 'sleep')) {
      const rawQuality = actionId.startsWith('ACTION_SLEEP_')
        ? actionId.replace('ACTION_SLEEP_', '').toLowerCase()
        : 'rested';
      const formatted = rawQuality.charAt(0).toUpperCase() + rawQuality.slice(1);
      await logHabitEvent({
        category: 'sleep',
        value_num: 7.5,
        value_text: formatted,
        feedback: null,
        weather_condition: null,
        temperature_c: null,
        source: 'lock_push',
      });
      toastMessage = `🌙 Morning sleep logged: ${formatted}!`;
    }
    // 5. Mood Prompt
    else if (actionId.startsWith('ACTION_MOOD_') || (actionId.includes('DEFAULT') && data?.type === 'mood')) {
      const rawMood = actionId.startsWith('ACTION_MOOD_')
        ? actionId.replace('ACTION_MOOD_', '').toLowerCase()
        : 'calm';
      const formatted = rawMood.charAt(0).toUpperCase() + rawMood.slice(1);
      await logHabitEvent({
        category: 'mood',
        value_num: null,
        value_text: formatted,
        feedback: null,
        weather_condition: null,
        temperature_c: null,
        source: 'lock_push',
      });
      toastMessage = `⚡ Evening reflection logged: ${formatted}!`;
    }
    // 6. Skip / Snooze
    else if (actionId === 'ACTION_SKIP' || actionId === 'ACTION_SNOOZE') {
      toastMessage = 'Notification dismissed.';
    }

    if (toastMessage) {
      setFeedbackToast(toastMessage);
      setTimeout(() => setFeedbackToast(null), 3500);
    }

    // Refresh state from database immediately
    await syncTodayStateFromDb();
  };

  // Initialize Database, User Profile, Native Notification Listeners & AppState
  useEffect(() => {
    let sub: any = null;
    let appStateSub: any = null;

    const startup = async () => {
      // 1. Initialize SQLite on device or storage on web
      await initDatabase();

      // 2. Check user profile
      const profile = await getUserProfile();
      if (profile && profile.username) {
        setIsOnboarded(true);
        setAppState((prev) => ({ ...prev, userName: profile.username }));
      } else {
        setIsOnboarded(false);
      }

      // 3. Load today's persistent records from DB
      await syncTodayStateFromDb();

      // 4. Configure real notifications and Android channels
      await registerNotificationCategories();
      await requestNotificationPermissions();

      // 5. Setup Action Click Listener from Lock-Screen Push Notifications
      sub = setupNotificationResponseListener((actionId, category, data) => {
        handleNotificationAction(actionId, category, data);
      });

      // 6. Check if app was cold-launched by tapping a notification
      const coldStartResponse = await checkColdStartNotificationResponse();
      if (coldStartResponse) {
        handleNotificationAction(
          coldStartResponse.actionIdentifier,
          coldStartResponse.category,
          coldStartResponse.data
        );
      }

      // 7. Re-sync DB when app is brought from background to foreground
      appStateSub = AppState.addEventListener('change', async (nextState) => {
        if (nextState === 'active') {
          await syncTodayStateFromDb();
          const resumeNotification = await checkColdStartNotificationResponse();
          if (resumeNotification) {
            handleNotificationAction(
              resumeNotification.actionIdentifier,
              resumeNotification.category,
              resumeNotification.data
            );
          }
        }
      });
    };

    startup();

    return () => {
      if (sub?.remove) sub.remove();
      if (appStateSub?.remove) appStateSub.remove();
    };
  }, []);

  // Load Real Weather from Open-Meteo API using device coordinates
  const loadLiveWeather = async () => {
    // 1. Detect location dynamically (via cached coords or fast IP lookup)
    const detected = await detectCurrentLocation();

    // 2. Fetch live weather for user's actual city / region
    fetchLiveWeather(detected.lat, detected.lng, detected.label).then((weatherData) => {
      setAppState((prev) => ({
        ...prev,
        weather: weatherData.condition,
        weatherDetails: {
          temperatureC: weatherData.temperatureC,
          description: weatherData.weatherDescription,
          isRaining: weatherData.isRaining,
          locationName: weatherData.locationName,
          lastUpdated: weatherData.lastUpdated,
        },
      }));
    });

    // 3. If high-accuracy GPS responds, refine with hyper-local coordinates
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchLiveWeather(pos.coords.latitude, pos.coords.longitude, detected.label).then(
            (weatherData) => {
              setAppState((prev) => ({
                ...prev,
                weather: weatherData.condition,
                weatherDetails: {
                  temperatureC: weatherData.temperatureC,
                  description: weatherData.weatherDescription,
                  isRaining: weatherData.isRaining,
                  locationName: weatherData.locationName,
                  lastUpdated: weatherData.lastUpdated,
                },
              }));
            }
          );
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    }
  };

  useEffect(() => {
    loadLiveWeather();
  }, []);

  const handleUpdateState = (
    updater: Partial<AppStateData> | ((prev: AppStateData) => AppStateData)
  ) => {
    setAppState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };

      // Write to Database on state change
      if (next.waterMl > prev.waterMl) {
        logHabitEvent({
          category: 'water',
          value_num: next.waterMl - prev.waterMl,
          value_text: `+${next.waterMl - prev.waterMl}ml`,
          feedback: null,
          weather_condition: next.weather,
          temperature_c: next.weatherDetails?.temperatureC ?? null,
          source: 'in_app',
        });
      }
      if (next.sleepQuality !== prev.sleepQuality) {
        logHabitEvent({
          category: 'sleep',
          value_num: next.sleepHours,
          value_text: next.sleepQuality,
          feedback: null,
          weather_condition: next.weather,
          temperature_c: next.weatherDetails?.temperatureC ?? null,
          source: 'in_app',
        });
      }
      if (next.moodLogged !== prev.moodLogged) {
        logHabitEvent({
          category: 'mood',
          value_num: null,
          value_text: next.moodLogged,
          feedback: null,
          weather_condition: next.weather,
          temperature_c: next.weatherDetails?.temperatureC ?? null,
          source: 'in_app',
        });
      }
      if (next.foodLogged !== prev.foodLogged && next.foodLogged) {
        logHabitEvent({
          category: 'food',
          value_num: 1,
          value_text: 'Healthy nutrition',
          feedback: null,
          weather_condition: next.weather,
          temperature_c: next.weatherDetails?.temperatureC ?? null,
          source: 'in_app',
        });
      }

      return next;
    });
  };

  const handleFinishActivity = (feedback: ActivityFeedback, type: 'stretch' | 'walk') => {
    logHabitEvent({
      category: 'movement',
      value_num: type === 'walk' ? 1.4 : 2.0,
      value_text: type,
      feedback,
      weather_condition: appState.weather,
      temperature_c: appState.weatherDetails?.temperatureC ?? null,
      source: 'live_activity',
    });

    handleUpdateState((prev) => ({
      ...prev,
      movementDone: true,
      movementType: type,
    }));
    setCurrentRoute('app');
    setActiveTab('today');
  };

  const handleStartActivity = (type: ActivityType) => {
    if (type === 'walk') {
      setCurrentRoute('walk_map');
    } else {
      // Desk stretch
      logHabitEvent({
        category: 'movement',
        value_num: 2.0,
        value_text: 'stretch',
        feedback: 'just_right',
        weather_condition: appState.weather,
        temperature_c: appState.weatherDetails?.temperatureC ?? null,
        source: 'in_app',
      });
      handleUpdateState((prev) => ({
        ...prev,
        movementDone: true,
        movementType: 'stretch',
      }));
    }
  };

  // Triggers real system lock-screen notification
  const handleTriggerTestPush = async (type: 'walk' | 'water' | 'sleep' | 'mood' = 'walk') => {
    if (appState.attentionBudgetUsed < appState.attentionBudgetTotal) {
      await incrementAttentionBudget();

      handleUpdateState((prev) => ({
        ...prev,
        attentionBudgetUsed: prev.attentionBudgetUsed + 1,
      }));

      // Fire a REAL native system push notification to lock screen!
      if (type === 'walk') {
        const isRain = appState.weather === 'rain';
        await sendMovementNotification({
          isRaining: isRain,
          temperatureC: appState.weatherDetails?.temperatureC,
          description: appState.weatherDetails?.description,
        });
      } else if (type === 'water') {
        await sendHydrationNotification();
      } else if (type === 'sleep') {
        await sendSleepNotification();
      } else if (type === 'mood') {
        await sendMoodNotification();
      }
    }
  };

  // Loading state during database check
  if (isOnboarded === null) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={COLORS.primaryMint} />
      </View>
    );
  }

  // First time launch -> Onboarding screen
  if (isOnboarded === false) {
    return (
      <OnboardingScreen
        onComplete={(newUsername) => {
          setIsOnboarded(true);
          setAppState((prev) => ({ ...prev, userName: newUsername }));
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <View style={styles.phoneFrame}>
        {feedbackToast && (
          <View style={styles.toastContainer}>
            <Text style={styles.toastText}>{feedbackToast}</Text>
          </View>
        )}

        {/* ROUTE 1: In-App Live GPS Map Screen (Opened only when starting a walk or via notification) */}
        {currentRoute === 'walk_map' && (
          <ActiveWalkMapScreen
            onFinishWalk={(feedback) => handleFinishActivity(feedback, 'walk')}
            onBack={() => {
              setCurrentRoute('app');
              setActiveTab('today');
            }}
          />
        )}

        {/* ROUTE 2: Main In-App Interface (Today, Progress, Settings) */}
        {currentRoute === 'app' && (
          <View style={styles.appContainer}>
            {activeTab === 'today' && (
              <MinimalistDashboard
                appState={appState}
                onUpdateState={handleUpdateState}
                onStartActivity={handleStartActivity}
                activeTab={activeTab}
                onTabChange={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'progress' && (
              <ProgressScreen
                appState={appState}
                onTabChange={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsScreen
                appState={appState}
                onUpdateState={handleUpdateState}
                onTabChange={(tab) => setActiveTab(tab)}
                onTriggerNotification={handleTriggerTestPush}
              />
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#050608',
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneFrame: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    backgroundColor: COLORS.background,
    overflow: 'hidden',
  },
  appContainer: {
    flex: 1,
  },
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 24 : 48,
    left: 16,
    right: 16,
    backgroundColor: '#0F172A',
    borderColor: COLORS.primaryMint,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 99999,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    alignItems: 'center',
  },
  toastText: {
    color: COLORS.primaryMint,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
});
