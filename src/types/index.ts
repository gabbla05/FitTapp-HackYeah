export type ActivityFeedback = 'too_easy' | 'just_right' | 'too_hard';

export type ActivityType = 'stretch' | 'walk';

export type WeatherContext = 'rain' | 'sunny';

export type HabitCategory = 'movement' | 'water' | 'sleep' | 'mood' | 'food';

export type MoodType = 'Calm' | 'Flow' | 'Relaxed' | 'Tired' | 'Tense';

export type SleepType = 'Deep sleep' | 'Rested' | 'Light sleep';

export interface LockScreenNotificationProps {
  appName?: string;
  timeAgo?: string;
  title?: string;
  description?: string;
  weather?: WeatherContext;
  temperatureC?: number;
  weatherLabel?: string;
  activityType?: ActivityType;
  budgetUsed?: number;
  budgetTotal?: number;
  onAccept?: () => void;
  onDismiss?: () => void;
  onToggleWeather?: () => void;
}

export interface LiveActivityWidgetProps {
  initialSeconds?: number;
  activityTitle?: string;
  activitySubtitle?: string;
  onFinish?: (feedback: ActivityFeedback) => void;
  onClose?: () => void;
}

export interface WalkActivityWidgetProps {
  targetDistanceKm?: number;
  activityTitle?: string;
  onFinish?: (feedback: ActivityFeedback) => void;
  onClose?: () => void;
}

export interface DayRitual {
  dayName: string; // 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'
  completed: boolean;
  isToday?: boolean;
}

export interface AppStateData {
  userName: string;
  streakWeeks: number;
  attentionBudgetUsed: number;
  attentionBudgetTotal: number;
  weather: WeatherContext;
  weatherDetails?: {
    temperatureC: number;
    description: string;
    isRaining: boolean;
    locationName?: string;
    lastUpdated?: string;
  };
  
  // 5 tracked health pillars (No emojis in state data)
  waterMl: number;
  waterGoalMl: number;
  movementDone: boolean;
  movementType: 'walk' | 'stretch' | null;
  sleepHours: number;
  sleepQuality: string;
  moodLogged: string;
  foodLogged: boolean;
  
  // Settings
  quietHoursStart: string;
  quietHoursEnd: string;
  strictLimitEnabled: boolean;
  contextSensorsEnabled: boolean;
}

export interface MinimalistDashboardProps {
  appState: AppStateData;
  onUpdateState: (updater: Partial<AppStateData> | ((prev: AppStateData) => AppStateData)) => void;
  onStartActivity: (type: ActivityType) => void;
  onSimulatePush: () => void;
  activeTab: 'today' | 'progress' | 'settings';
  onTabChange: (tab: 'today' | 'progress' | 'settings') => void;
}

export interface ProgressScreenProps {
  appState: AppStateData;
  onTabChange: (tab: 'today' | 'progress' | 'settings') => void;
}

export interface SettingsScreenProps {
  appState: AppStateData;
  onUpdateState: (updater: Partial<AppStateData> | ((prev: AppStateData) => AppStateData)) => void;
  onTabChange: (tab: 'today' | 'progress' | 'settings') => void;
  onTriggerNotification: () => void;
}
