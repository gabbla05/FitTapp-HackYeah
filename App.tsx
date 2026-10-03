import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LockScreenNotification } from './src/components/LockScreenNotification';
import { LiveActivityWidget } from './src/components/LiveActivityWidget';
import { WalkActivityWidget } from './src/components/WalkActivityWidget';
import { ActiveWalkMapScreen } from './src/components/ActiveWalkMapScreen';
import { NotificationShowcase } from './src/components/NotificationShowcase';
import { MinimalistDashboard } from './src/components/MinimalistDashboard';
import { ProgressScreen } from './src/components/ProgressScreen';
import { SettingsScreen } from './src/components/SettingsScreen';
import { OnboardingScreen } from './src/components/OnboardingScreen';
import { COLORS, RADII, SPACING, FONTS } from './src/theme/theme';
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
  sendRealPushNotification,
  setupNotificationResponseListener,
  NOTIFICATION_CATEGORIES,
} from './src/services/notificationService';

type ScreenRoute =
  | 'push'
  | 'activity_stretch'
  | 'activity_walk'
  | 'walk_map'
  | 'all_notifications'
  | 'app';

export default function App() {
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const [currentRoute, setCurrentRoute] = useState<ScreenRoute>('push');
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
      sub = setupNotificationResponseListener((actionId) => {
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
        } else if (actionId === 'ACTION_START_WALK') {
          setCurrentRoute('walk_map');
        } else if (actionId === 'ACTION_START_STRETCH') {
          setCurrentRoute('activity_stretch');
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

  const toggleWeatherContext = () => {
    setAppState((prev) => ({
      ...prev,
      weather: prev.weather === 'rain' ? 'sunny' : 'rain',
    }));
  };

  const handleAcceptPush = () => {
    if (appState.weather === 'rain') {
      setCurrentRoute('activity_stretch');
    } else {
      setCurrentRoute('walk_map');
    }
  };

  const handleDismissPush = () => {
    setCurrentRoute('app');
    setActiveTab('today');
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
      setCurrentRoute('activity_stretch');
    }
  };

  const handleTriggerTestPush = async () => {
    if (appState.attentionBudgetUsed < appState.attentionBudgetTotal) {
      await incrementAttentionBudget();

      handleUpdateState((prev) => ({
        ...prev,
        attentionBudgetUsed: prev.attentionBudgetUsed + 1,
      }));

      // Fire a REAL native system push notification to lock screen!
      const isRain = appState.weather === 'rain';
      await sendRealPushNotification({
        title: isRain
          ? `FitTapp • ${appState.weatherDetails?.description || 'Rain'} (${appState.weatherDetails?.temperatureC ?? 12}°C)`
          : `FitTapp • ${appState.weatherDetails?.description || 'Clear sky'} (${appState.weatherDetails?.temperatureC ?? 13}°C)`,
        body: isRain
          ? "Weather isn't ideal for a walk. Take 2 minutes for a gentle neck & shoulder stretch at your desk."
          : 'A perfect moment to rest your eyes. Take a 15-minute breath-of-fresh-air walk around the park.',
        categoryIdentifier: isRain
          ? NOTIFICATION_CATEGORIES.MOVEMENT_STRETCH
          : NOTIFICATION_CATEGORIES.MOVEMENT_WALK,
      });

      setCurrentRoute('push');
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
        {/* Top Switcher Bar */}
        <View style={styles.topSwitcherContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.topSwitcherScroll}
          >
            <TouchableOpacity
              style={[
                styles.switcherTab,
                currentRoute === 'push' && styles.switcherTabActive,
              ]}
              activeOpacity={0.8}
              onPress={() => setCurrentRoute('push')}
            >
              <Text
                style={[
                  styles.switcherText,
                  currentRoute === 'push' && styles.switcherTextActive,
                ]}
              >
                1. Push Preview ({appState.weather === 'rain' ? 'Rain' : 'Sun'})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.switcherTab,
                currentRoute === 'activity_stretch' && styles.switcherTabActive,
              ]}
              activeOpacity={0.8}
              onPress={() => setCurrentRoute('activity_stretch')}
            >
              <Text
                style={[
                  styles.switcherText,
                  currentRoute === 'activity_stretch' && styles.switcherTextActive,
                ]}
              >
                2. Live Stretch
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.switcherTab,
                currentRoute === 'walk_map' && styles.switcherTabActive,
              ]}
              activeOpacity={0.8}
              onPress={() => setCurrentRoute('walk_map')}
            >
              <Text
                style={[
                  styles.switcherText,
                  currentRoute === 'walk_map' && styles.switcherTextActive,
                ]}
              >
                3. Live Walk Map
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.switcherTab,
                currentRoute === 'all_notifications' && styles.switcherTabActive,
              ]}
              activeOpacity={0.8}
              onPress={() => setCurrentRoute('all_notifications')}
            >
              <Text
                style={[
                  styles.switcherText,
                  currentRoute === 'all_notifications' && styles.switcherTextActive,
                ]}
              >
                4. All 5 Push Types
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.switcherTab,
                currentRoute === 'activity_walk' && styles.switcherTabActive,
              ]}
              activeOpacity={0.8}
              onPress={() => setCurrentRoute('activity_walk')}
            >
              <Text
                style={[
                  styles.switcherText,
                  currentRoute === 'activity_walk' && styles.switcherTextActive,
                ]}
              >
                5. Lock Walk Widget
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.switcherTab,
                currentRoute === 'app' && styles.switcherTabActive,
              ]}
              activeOpacity={0.8}
              onPress={() => setCurrentRoute('app')}
            >
              <Text
                style={[
                  styles.switcherText,
                  currentRoute === 'app' && styles.switcherTextActive,
                ]}
              >
                6. In-App ({activeTab})
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* View Router */}
        <View style={styles.screenContent}>
          {/* ROUTE 1: Rich Push Notification on Lock Screen */}
          {currentRoute === 'push' && (
            <LockScreenNotification
              appName="FitTapp"
              timeAgo="now"
              weather={appState.weather}
              temperatureC={appState.weatherDetails?.temperatureC}
              weatherLabel={appState.weatherDetails?.description}
              budgetUsed={appState.attentionBudgetUsed}
              budgetTotal={appState.attentionBudgetTotal}
              onAccept={handleAcceptPush}
              onDismiss={handleDismissPush}
              onToggleWeather={toggleWeatherContext}
            />
          )}

          {/* ROUTE 2: In-App Real GPS Map Walk Screen */}
          {currentRoute === 'walk_map' && (
            <ActiveWalkMapScreen
              onFinishWalk={(feedback) => handleFinishActivity(feedback, 'walk')}
              onBack={() => {
                setCurrentRoute('app');
                setActiveTab('today');
              }}
            />
          )}

          {/* ROUTE 3: All 5 Actionable Notification Types Showcase */}
          {currentRoute === 'all_notifications' && (
            <NotificationShowcase
              appState={appState}
              onUpdateState={handleUpdateState}
              onLaunchWalk={() => setCurrentRoute('walk_map')}
              onLaunchStretch={() => setCurrentRoute('activity_stretch')}
              onBack={() => {
                setCurrentRoute('app');
                setActiveTab('today');
              }}
            />
          )}

          {/* ROUTE 4: Live Activity - Walk Widget */}
          {currentRoute === 'activity_walk' && (
            <WalkActivityWidget
              targetDistanceKm={1.5}
              activityTitle="Outdoor Reset Walk"
              onOpenMap={() => setCurrentRoute('walk_map')}
              onFinish={(feedback) => handleFinishActivity(feedback, 'walk')}
            />
          )}

          {/* ROUTE 5: Live Activity - Desk Stretch Widget */}
          {currentRoute === 'activity_stretch' && (
            <LiveActivityWidget
              initialSeconds={120}
              activityTitle="Desk Stretch (Rainy Context)"
              activitySubtitle="Neck & shoulder tension release"
              onFinish={(feedback) => handleFinishActivity(feedback, 'stretch')}
              onClose={() => {
                setCurrentRoute('app');
                setActiveTab('today');
              }}
            />
          )}

          {/* ROUTE 6: Main In-App Interface */}
          {currentRoute === 'app' && (
            <View style={styles.appContainer}>
              {activeTab === 'today' && (
                <MinimalistDashboard
                  appState={appState}
                  onUpdateState={handleUpdateState}
                  onStartActivity={handleStartActivity}
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
  topSwitcherContainer: {
    backgroundColor: '#0F1118',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 8,
  },
  topSwitcherScroll: {
    paddingHorizontal: 12,
    gap: 6,
  },
  switcherTab: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  switcherTabActive: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderColor: COLORS.primaryMint,
  },
  switcherText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  switcherTextActive: {
    color: COLORS.primaryMint,
    fontWeight: '700',
  },
  screenContent: {
    flex: 1,
  },
  appContainer: {
    flex: 1,
  },
});
