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

/**
 * Registers interactive lock-screen action categories for iOS and Android
 */
export async function registerNotificationCategories(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    // 1. Water
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

    // 2. Outdoor Walk
    await Notifications.setNotificationCategoryAsync(NOTIFICATION_CATEGORIES.MOVEMENT_WALK, [
      {
        identifier: 'ACTION_START_WALK',
        buttonTitle: 'Start Walk (GPS Map)',
        options: { opensAppToForeground: true },
      },
      {
        identifier: 'ACTION_SKIP',
        buttonTitle: 'Not now',
        options: { opensAppToForeground: false },
      },
    ]);

    // 3. Desk Stretch
    await Notifications.setNotificationCategoryAsync(NOTIFICATION_CATEGORIES.MOVEMENT_STRETCH, [
      {
        identifier: 'ACTION_START_STRETCH',
        buttonTitle: 'Start 2m Stretch',
        options: { opensAppToForeground: true },
      },
      {
        identifier: 'ACTION_SKIP',
        buttonTitle: 'Not today',
        options: { opensAppToForeground: false },
      },
    ]);

    // 4. Sleep
    await Notifications.setNotificationCategoryAsync(NOTIFICATION_CATEGORIES.SLEEP, [
      {
        identifier: 'ACTION_SLEEP_RESTED',
        buttonTitle: 'Rested',
        options: { opensAppToForeground: false },
      },
      {
        identifier: 'ACTION_SLEEP_MODERATE',
        buttonTitle: 'Moderate',
        options: { opensAppToForeground: false },
      },
      {
        identifier: 'ACTION_SLEEP_FATIGUED',
        buttonTitle: 'Fatigued',
        options: { opensAppToForeground: false },
      },
    ]);

    // 5. Mood
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
        identifier: 'ACTION_MOOD_TENSE',
        buttonTitle: 'Tense',
        options: { opensAppToForeground: false },
      },
    ]);
  } catch (err) {
    console.warn('Error configuring notification categories:', err);
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
 * Sets up a listener for lock screen button clicks
 */
export function setupNotificationResponseListener(
  onAction: (actionIdentifier: string, category: string, data: any) => void
) {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const actionIdentifier = response.actionIdentifier;
    const category = response.notification.request.content.categoryIdentifier || '';
    const data = response.notification.request.content.data;
    onAction(actionIdentifier, category, data);
  });
  return subscription;
}
