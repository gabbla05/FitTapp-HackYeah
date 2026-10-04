import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { ActiveWalkMapScreen } from './src/components/ActiveWalkMapScreen';
import { MinimalistDashboard } from './src/components/MinimalistDashboard';
import { ProgressScreen } from './src/components/ProgressScreen';
import { SettingsScreen } from './src/components/SettingsScreen';
import { OnboardingScreen } from './src/components/OnboardingScreen';
import { COLORS } from './src/theme/theme';
import { ActivityFeedback, ActivityType, AppStateData } from './src/types';
import { fetchLiveWeather } from './src/services/weatherService';
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

  // Initialize Database, User Profile & Native Notification Listeners
  useEffect(() => {
    let sub: any = null;

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

      // 4. Configure real notifications
      await registerNotificationCategories();
      await requestNotificationPermissions();

      // 5. Setup Action Click Listener from Lock-Screen Push Notifications
      sub = setupNotificationResponseListener((actionId, category) => {
        if (actionId === 'ACTION_DRINK_250') {
          logHabitEvent({
            category: 'water',
            value_num: 250,
            value_text: '+250ml',
            feedback: null,
            weather_condition: null,
            temperature_c: null,
            source: 'lock_push',
          });
          setAppState((prev) => ({ ...prev, waterMl: prev.waterMl + 250 }));
        } else if (
          actionId === 'ACTION_START_WALK' ||
          (category === NOTIFICATION_CATEGORIES.MOVEMENT_WALK && actionId.includes('DEFAULT'))
        ) {
          // Open Live Walk Map directly from lock-screen notification!
          setCurrentRoute('walk_map');
        } else if (actionId === 'ACTION_START_STRETCH') {
          logHabitEvent({
            category: 'movement',
            value_num: 2.0,
            value_text: 'stretch',
            feedback: 'just_right',
            weather_condition: 'rain',
            temperature_c: null,
            source: 'lock_push',
          });
          setAppState((prev) => ({ ...prev, movementDone: true, movementType: 'stretch' }));
        } else if (actionId.startsWith('ACTION_SLEEP_')) {
          const quality = actionId.replace('ACTION_SLEEP_', '');
          logHabitEvent({
            category: 'sleep',
            value_num: 7.5,
            value_text: quality,
            feedback: null,
            weather_condition: null,
            temperature_c: null,
            source: 'lock_push',
          });
          setAppState((prev) => ({ ...prev, sleepQuality: quality }));
        } else if (actionId.startsWith('ACTION_MOOD_')) {
          const mood = actionId.replace('ACTION_MOOD_', '');
          logHabitEvent({
            category: 'mood',
            value_num: null,
            value_text: mood,
            feedback: null,
            weather_condition: null,
            temperature_c: null,
            source: 'lock_push',
          });
          setAppState((prev) => ({ ...prev, moodLogged: mood }));
        }
      });

      // 6. Check if app was cold-launched by tapping a Walk notification
      const coldStartResponse = await checkColdStartNotificationResponse();
      if (coldStartResponse) {
        if (
          coldStartResponse.actionIdentifier === 'ACTION_START_WALK' ||
          coldStartResponse.category === NOTIFICATION_CATEGORIES.MOVEMENT_WALK
        ) {
          setCurrentRoute('walk_map');
        }
      }
    };

    startup();

    return () => {
      if (sub?.remove) sub.remove();
    };
  }, []);

  // Load Real Weather from Open-Meteo API using device coordinates
  const loadLiveWeather = () => {
    let lat = 51.7972;
    let lng = 18.3401;
    let locationLabel = 'Koźminek, Poland';

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem('fittapp_last_coord');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (typeof parsed?.lat === 'number' && typeof parsed?.lng === 'number') {
            lat = parsed.lat;
            lng = parsed.lng;
          }
        }
        const savedLabel = window.localStorage.getItem('fittapp_last_label');
        if (savedLabel) locationLabel = savedLabel;
      } catch {}
    }

    fetchLiveWeather(lat, lng, locationLabel).then((weatherData) => {
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

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchLiveWeather(pos.coords.latitude, pos.coords.longitude, locationLabel).then(
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
        { enableHighAccuracy: false, timeout: 6000, maximumAge: 300000 }
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
});
