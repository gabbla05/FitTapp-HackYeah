import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const NOTIFICATION_CATEGORIES = {
  WATER: 'fittapp_water',
  MOVEMENT_WALK: 'fittapp_walk',
  MOVEMENT_STRETCH: 'fittapp_stretch',
  SLEEP: 'fittapp_sleep',
  MOOD: 'fittapp_mood',
  FOOD: 'fittapp_food',
};

export const NOTIFICATION_CHANNEL_ID = 'fittapp_reminders_v1';

/**
 * Registers interactive lock-screen action categories for iOS and Android
 * and configures the native Android notification channel
 */
export async function registerNotificationCategories(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    // 0. Ensure Android high-priority channel with lock-screen visibility
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
        name: 'FitTapp Daily Habit Prompts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#5EEAD4',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: false,
        sound: 'default',
        enableVibrate: true,
      });
    }

    // 1. Water (Silent background action)
    await Notifications.setNotificationCategoryAsync(NOTIFICATION_CATEGORIES.WATER, [
      {
        identifier: 'ACTION_DRINK_250',
        buttonTitle: 'Drank it (+250ml)',
        options: { opensAppToForeground: false },
      },
      {
        identifier: 'ACTION_SNOOZE',
        buttonTitle: 'Snooze 1h',
        options: { opensAppToForeground: false },
      },
    ]);

    // 2. Outdoor Walk (Opens live walk GPS map!)
    await Notifications.setNotificationCategoryAsync(NOTIFICATION_CATEGORIES.MOVEMENT_WALK, [
      {
        identifier: 'ACTION_START_WALK',
        buttonTitle: 'Start Walk (Live Map)',
        options: { opensAppToForeground: true },
      },
      {
        identifier: 'ACTION_SKIP',
        buttonTitle: 'Not now',
        options: { opensAppToForeground: false },
      },
    ]);

    // 3. Desk Stretch (Silent background action)
    await Notifications.setNotificationCategoryAsync(NOTIFICATION_CATEGORIES.MOVEMENT_STRETCH, [
      {
        identifier: 'ACTION_START_STRETCH',
        buttonTitle: 'Done Stretch (2m)',
        options: { opensAppToForeground: false },
      },
      {
        identifier: 'ACTION_SKIP',
        buttonTitle: 'Not today',
        options: { opensAppToForeground: false },
      },
    ]);

    // 4. Sleep (Silent background action)
    await Notifications.setNotificationCategoryAsync(NOTIFICATION_CATEGORIES.SLEEP, [
      {
        identifier: 'ACTION_SLEEP_RESTED',
        buttonTitle: 'Rested (8h)',
        options: { opensAppToForeground: false },
      },
      {
        identifier: 'ACTION_SLEEP_MODERATE',
        buttonTitle: 'Moderate (6.5h)',
        options: { opensAppToForeground: false },
      },
      {
        identifier: 'ACTION_SLEEP_TIRED',
        buttonTitle: 'Tired (5h)',
        options: { opensAppToForeground: false },
      },
    ]);

    // 5. Mood (Silent background action: Calm, Flow, Tired)
    await Notifications.setNotificationCategoryAsync(NOTIFICATION_CATEGORIES.MOOD, [
      {
        identifier: 'ACTION_MOOD_CALM',
        buttonTitle: 'Calm',
        options: { opensAppToForeground: false },
      },
      {
        identifier: 'ACTION_MOOD_FLOW',
        buttonTitle: 'Flow',
        options: { opensAppToForeground: false },
      },
      {
        identifier: 'ACTION_MOOD_TIRED',
        buttonTitle: 'Tired',
        options: { opensAppToForeground: false },
      },
    ]);
  } catch (err) {
    console.warn('Error configuring notification categories/channels:', err);
  }
}

/**
 * Requests notification permissions on device / browser
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await window.Notification.requestPermission();
      return perm === 'granted';
    }
    return true;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus === 'granted' && Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
        name: 'FitTapp Daily Habit Prompts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#5EEAD4',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: false,
        sound: 'default',
        enableVibrate: true,
      });
    }

    return finalStatus === 'granted';
  } catch (e) {
    console.warn('Error requesting notification permissions:', e);
    return false;
  }
}

/**
 * Sends a real system notification directly to the user's device lock screen
 */
export async function sendRealPushNotification(options: {
  title: string;
  body: string;
  categoryIdentifier?: string;
  data?: Record<string, any>;
}): Promise<string | null> {
  // Web fallback (Desktop notifications)
  if (Platform.OS === 'web') {
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      window.Notification.permission === 'granted'
    ) {
      new window.Notification(options.title, {
        body: options.body,
      });
      return 'web_notification';
    }
  }

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: options.title,
        body: options.body,
        categoryIdentifier: options.categoryIdentifier,
        data: options.data,
        sound: true,
        autoDismiss: true,
        ...(Platform.OS === 'android' ? { channelId: NOTIFICATION_CHANNEL_ID } : {}),
      },
      trigger: null, // immediate fire
    });
    return id;
  } catch (e) {
    console.warn('Error scheduling push notification:', e);
    return null;
  }
}

/**
 * Helper to fire a Walk or Stretch notification based on weather
 */
export async function sendMovementNotification(options: {
  isRaining: boolean;
  temperatureC?: number;
  description?: string;
}): Promise<string | null> {
  const isRain = options.isRaining;
  const temp = options.temperatureC ?? 14;
  const desc = options.description ?? (isRain ? 'Light Rain' : 'Clear sky');

  return sendRealPushNotification({
    title: isRain ? `FitTapp • ${desc} (${temp}°C)` : `FitTapp • ${desc} (${temp}°C)`,
    body: isRain
      ? "Weather isn't ideal for a walk. Take 2 minutes for a gentle neck & shoulder stretch at your desk."
      : 'A perfect moment to rest your eyes. Take a 15-minute breath-of-fresh-air walk around the park.',
    categoryIdentifier: isRain
      ? NOTIFICATION_CATEGORIES.MOVEMENT_STRETCH
      : NOTIFICATION_CATEGORIES.MOVEMENT_WALK,
    data: { type: isRain ? 'stretch' : 'walk' },
  });
}

/**
 * Helper to fire a Hydration notification
 */
export async function sendHydrationNotification(): Promise<string | null> {
  return sendRealPushNotification({
    title: 'FitTapp • Hydration Check',
    body: 'Time for 250ml of fresh water to keep your focus sharp and steady.',
    categoryIdentifier: NOTIFICATION_CATEGORIES.WATER,
    data: { type: 'water' },
  });
}

/**
 * Helper to fire a Sleep check-in notification
 */
export async function sendSleepNotification(): Promise<string | null> {
  return sendRealPushNotification({
    title: 'FitTapp • Good Morning',
    body: 'How did you rest tonight? One tap to log your morning sleep quality.',
    categoryIdentifier: NOTIFICATION_CATEGORIES.SLEEP,
    data: { type: 'sleep' },
  });
}

/**
 * Helper to fire a Mood reflection notification
 */
export async function sendMoodNotification(): Promise<string | null> {
  return sendRealPushNotification({
    title: 'FitTapp • Evening Reflection',
    body: 'How is your energy right now? Tap a feeling to close out your day.',
    categoryIdentifier: NOTIFICATION_CATEGORIES.MOOD,
    data: { type: 'mood' },
  });
}

/**
 * Dismisses a single notification by ID
 */
export async function dismissNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.dismissNotificationAsync(notificationId);
  } catch (e) {
    console.warn('Error dismissing notification:', e);
  }
}

/**
 * Dismisses all active notifications from drawer
 */
export async function dismissAllNotifications(): Promise<void> {
  try {
    await Notifications.dismissAllNotificationsAsync();
  } catch (e) {
    console.warn('Error dismissing all notifications:', e);
  }
}

/**
 * Sets up a listener for lock screen button clicks
 */
export function setupNotificationResponseListener(
  onAction: (actionIdentifier: string, category: string, data: any, notificationId?: string) => void
) {
  const subscription = Notifications.addNotificationResponseReceivedListener(async (response) => {
    const notificationId = response.notification.request.identifier;
    if (notificationId) {
      await dismissNotification(notificationId);
    }
    const actionIdentifier = response.actionIdentifier;
    const category = (response.notification.request.content as any).categoryIdentifier || '';
    const data = response.notification.request.content.data;
    onAction(actionIdentifier, category, data, notificationId);
  });
  return subscription;
}

/**
 * Checks if the app was launched by tapping a notification on cold start
 */
export async function checkColdStartNotificationResponse(): Promise<{
  actionIdentifier: string;
  category: string;
  data: any;
  notificationId?: string;
} | null> {
  if (Platform.OS === 'web') return null;
  try {
    const response = await Notifications.getLastNotificationResponseAsync();
    if (response) {
      const notificationId = response.notification.request.identifier;
      if (notificationId) {
        await dismissNotification(notificationId);
      }
      return {
        actionIdentifier: response.actionIdentifier,
        category: (response.notification.request.content as any).categoryIdentifier || '',
        data: response.notification.request.content.data,
        notificationId,
      };
    }
  } catch (e) {
    console.warn('Error reading cold start notification response:', e);
  }
  return null;
}
