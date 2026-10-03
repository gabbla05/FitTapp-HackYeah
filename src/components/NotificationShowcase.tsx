import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { COLORS, RADII, SPACING, FONTS } from '../theme/theme';
import { AppStateData } from '../types';
import {
  PlayIcon,
  SparkleIcon,
  WaterIcon,
  MoonIcon,
  FoodIcon,
  SunIcon,
  CloudRainIcon,
  WalkIcon,
  CheckIcon,
  MoodCalmIcon,
  MoodFlowIcon,
  MoodTenseIcon,
  SleepRestedIcon,
  SleepNeutralIcon,
  MoodTiredIcon,
} from './common/Icons';
import { sendRealPushNotification, NOTIFICATION_CATEGORIES } from '../services/notificationService';

interface NotificationShowcaseProps {
  appState: AppStateData;
  onUpdateState: (updater: Partial<AppStateData> | ((prev: AppStateData) => AppStateData)) => void;
  onLaunchWalk: () => void;
  onLaunchStretch: () => void;
  onBack: () => void;
}

export const NotificationShowcase: React.FC<NotificationShowcaseProps> = ({
  appState,
  onUpdateState,
  onLaunchWalk,
  onLaunchStretch,
  onBack,
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleDrinkWater = () => {
    onUpdateState((prev) => ({
      ...prev,
      waterMl: prev.waterMl + 250,
    }));
    showToast('Logged +250ml water directly from notification');
  };

  const handleLogFood = () => {
    onUpdateState({ foodLogged: true });
    showToast('Logged healthy nutrition directly from notification');
  };

  const handleLogSleep = (quality: string) => {
    onUpdateState({ sleepQuality: quality });
    showToast(`Sleep logged as: "${quality}"`);
  };

  const handleLogMood = (mood: string) => {
    onUpdateState({ moodLogged: mood });
    showToast(`Evening mood logged as: "${mood}"`);
  };

  const handleSendRealPush = async (type: 'walk' | 'stretch' | 'water' | 'sleep' | 'mood' | 'food') => {
    try {
      if (type === 'water') {
        await sendRealPushNotification({
          title: 'FitTapp • Hydration Check',
          body: 'Have a fresh glass of water to keep your mental clarity sharp (+250 ml).',
          categoryIdentifier: NOTIFICATION_CATEGORIES.WATER,
        });
      } else if (type === 'walk') {
        await sendRealPushNotification({
          title: 'FitTapp • Sunny & 70°F. Outdoor reset walk?',
          body: 'Great time to rest your eyes. Take a 15-minute breath-of-fresh-air walk around the park.',
          categoryIdentifier: NOTIFICATION_CATEGORIES.MOVEMENT_WALK,
        });
      } else if (type === 'stretch') {
        await sendRealPushNotification({
          title: "FitTapp • It's raining outside. Quick hint?",
          body: 'Take 2 minutes for a gentle neck & shoulder stretch at your desk.',
          categoryIdentifier: NOTIFICATION_CATEGORIES.MOVEMENT_STRETCH,
        });
      } else if (type === 'sleep') {
        await sendRealPushNotification({
          title: 'FitTapp • Good morning',
          body: 'Phone detected you woke up (7.5h sleep). How do you feel?',
          categoryIdentifier: NOTIFICATION_CATEGORIES.SLEEP,
        });
      } else if (type === 'mood') {
        await sendRealPushNotification({
          title: 'FitTapp • Evening Wind-Down',
          body: 'A 3-second check-in before unwinding. What was your dominant vibe today?',
          categoryIdentifier: NOTIFICATION_CATEGORIES.MOOD,
        });
      } else if (type === 'food') {
        await sendRealPushNotification({
          title: 'FitTapp • Mindful Eating',
          body: 'Mid-afternoon recharge: Grab a piece of fresh fruit or clean hydration.',
          categoryIdentifier: NOTIFICATION_CATEGORIES.FOOD,
        });
      }
      showToast('Real lock-screen push notification sent to device!');
    } catch {
      showToast('Push scheduled.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={onBack}>
          <Text style={styles.backButtonText}>← Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Rich Push Notifications</Text>
        <View style={styles.dummy} />
      </View>

      {/* Toast Notification */}
      {toastMessage && (
        <View style={styles.toastCard}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.introText}>
          Here are all 5 actionable Zero-UI notification types. Every button below is live and logs data immediately without opening the app:
        </Text>

        {/* 1. MOVEMENT - OUTDOOR WALK (Context: Sunny) */}
        <View style={styles.notiCard}>
          <View style={styles.notiHeader}>
            <View style={styles.appIconWrap}>
              <WalkIcon size={13} color={COLORS.primaryMint} />
            </View>
            <Text style={styles.appName}>FitTapp • 2:15 PM</Text>
            <View style={styles.tagContext}>
              <SunIcon size={12} color={COLORS.amberWarm} />
              <Text style={styles.tagContextText}>Sunny Context</Text>
            </View>
          </View>

          <Text style={styles.notiTitle}>Sunny & 70°F. Outdoor reset walk?</Text>
          <Text style={styles.notiDesc}>
            Great time to rest your eyes. Take a 15-minute breath-of-fresh-air walk around the park.
          </Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              activeOpacity={0.75}
              onPress={() => showToast('Skip recorded. Zero guilt.')}
            >
              <Text style={styles.secondaryBtnText}>Not now</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryBtn}
              activeOpacity={0.85}
              onPress={onLaunchWalk}
            >
              <PlayIcon size={14} color={COLORS.textDark} />
              <Text style={styles.primaryBtnText}>Start Walk (GPS Map)</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. MOVEMENT - DESK STRETCH (Context: Rainy) */}
        <View style={styles.notiCard}>
          <View style={styles.notiHeader}>
            <View style={styles.appIconWrap}>
              <SparkleIcon size={13} color={COLORS.primaryMint} />
            </View>
            <Text style={styles.appName}>FitTapp • 11:30 AM</Text>
            <View style={styles.tagContext}>
              <CloudRainIcon size={12} color={COLORS.skyBlue} />
              <Text style={styles.tagContextText}>Rainy Context</Text>
            </View>
          </View>

          <Text style={styles.notiTitle}>It's raining outside. Quick hint?</Text>
          <Text style={styles.notiDesc}>
            Weather isn't great for a walk. Take 2 minutes for a gentle neck & shoulder stretch at your desk.
          </Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              activeOpacity={0.75}
              onPress={() => showToast('Skip recorded. Zero guilt.')}
            >
              <Text style={styles.secondaryBtnText}>Not today</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryBtn}
              activeOpacity={0.85}
              onPress={onLaunchStretch}
            >
              <PlayIcon size={14} color={COLORS.textDark} />
              <Text style={styles.primaryBtnText}>Start 2m Stretch</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. HYDRATION REMINDER (One-tap drink) */}
        <View style={styles.notiCard}>
          <View style={styles.notiHeader}>
            <View style={styles.appIconWrap}>
              <WaterIcon size={13} color={COLORS.primaryMint} />
            </View>
            <Text style={styles.appName}>FitTapp • 1:00 PM</Text>
            <View style={styles.tagContext}>
              <Text style={styles.tagContextText}>Hydration</Text>
            </View>
          </View>

          <Text style={styles.notiTitle}>Hydration Check</Text>
          <Text style={styles.notiDesc}>
            Have a fresh glass of water to keep your mental clarity sharp (+250 ml).
          </Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              activeOpacity={0.75}
              onPress={() => showToast('Reminder snoozed for 1 hour.')}
            >
              <Text style={styles.secondaryBtnText}>Snooze 1h</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryBtn}
              activeOpacity={0.85}
              onPress={handleDrinkWater}
            >
              <CheckIcon size={14} color={COLORS.textDark} />
              <Text style={styles.primaryBtnText}>Drank it (+250ml)</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. SLEEP QUALITY (Morning Detection) */}
        <View style={styles.notiCard}>
          <View style={styles.notiHeader}>
            <View style={styles.appIconWrap}>
              <MoonIcon size={13} color={COLORS.primaryMint} />
            </View>
            <Text style={styles.appName}>FitTapp • 7:35 AM</Text>
            <View style={styles.tagContext}>
              <Text style={styles.tagContextText}>Morning Wake-up</Text>
            </View>
          </View>

          <Text style={styles.notiTitle}>Good morning, Gabriel</Text>
          <Text style={styles.notiDesc}>
            Phone detected you woke up at 7:30 AM (7.5h sleep). How do you feel?
          </Text>

          {/* 3 Instant Pill Buttons with Vector Icons */}
          <View style={styles.threePillsRow}>
            <TouchableOpacity
              style={styles.threePillItem}
              activeOpacity={0.75}
              onPress={() => handleLogSleep('Rested')}
            >
              <SleepRestedIcon size={16} color={COLORS.primaryMint} />
              <Text style={styles.threePillText}>Rested</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.threePillItem}
              activeOpacity={0.75}
              onPress={() => handleLogSleep('Moderate')}
            >
              <SleepNeutralIcon size={16} color={COLORS.textSecondary} />
              <Text style={styles.threePillText}>Moderate</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.threePillItem}
              activeOpacity={0.75}
              onPress={() => handleLogSleep('Fatigued')}
            >
              <MoodTiredIcon size={16} color={COLORS.textMuted} />
              <Text style={styles.threePillText}>Fatigued</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 5. MOOD & STRESS (Evening Check-in) */}
        <View style={styles.notiCard}>
          <View style={styles.notiHeader}>
            <View style={styles.appIconWrap}>
              <SparkleIcon size={13} color={COLORS.accentLime} />
            </View>
            <Text style={styles.appName}>FitTapp • 8:45 PM</Text>
            <View style={styles.tagContext}>
              <Text style={styles.tagContextText}>Evening Reflection</Text>
            </View>
          </View>

          <Text style={styles.notiTitle}>Evening Wind-Down</Text>
          <Text style={styles.notiDesc}>
            A 3-second check-in before unwinding. What was your dominant vibe today?
          </Text>

          {/* 3 Instant Pill Buttons with Vector Icons */}
          <View style={styles.threePillsRow}>
            <TouchableOpacity
              style={styles.threePillItem}
              activeOpacity={0.75}
              onPress={() => handleLogMood('Calm')}
            >
              <MoodCalmIcon size={16} color={COLORS.primaryMint} />
              <Text style={styles.threePillText}>Calm</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.threePillItem}
              activeOpacity={0.75}
              onPress={() => handleLogMood('Flow')}
            >
              <MoodFlowIcon size={16} color={COLORS.accentLime} />
              <Text style={styles.threePillText}>Flow</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.threePillItem}
              activeOpacity={0.75}
              onPress={() => handleLogMood('Tense')}
            >
              <MoodTenseIcon size={16} color={COLORS.softCoral} />
              <Text style={styles.threePillText}>Tense</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 6. HEALTHY NUTRITION (Light Meal Reminder) */}
        <View style={styles.notiCard}>
          <View style={styles.notiHeader}>
            <View style={styles.appIconWrap}>
              <FoodIcon size={13} color={COLORS.primaryMint} />
            </View>
            <Text style={styles.appName}>FitTapp • 4:10 PM</Text>
            <View style={styles.tagContext}>
              <Text style={styles.tagContextText}>Nutrition</Text>
            </View>
          </View>

          <Text style={styles.notiTitle}>Nourish your body</Text>
          <Text style={styles.notiDesc}>
            Time for an afternoon boost. Grab a piece of fresh fruit or a healthy light snack.
          </Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              activeOpacity={0.75}
              onPress={() => showToast('Skipped. Zero guilt.')}
            >
              <Text style={styles.secondaryBtnText}>Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryBtn}
              activeOpacity={0.85}
              onPress={handleLogFood}
            >
              <CheckIcon size={14} color={COLORS.textDark} />
              <Text style={styles.primaryBtnText}>Ate Healthy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backButtonText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primaryMint,
  },
  headerTitle: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  dummy: {
    width: 60,
  },
  toastCard: {
    backgroundColor: COLORS.primaryMint,
    paddingVertical: 9,
    paddingHorizontal: SPACING.base,
    alignItems: 'center',
  },
  toastText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.base,
    paddingBottom: 40,
  },
  introText: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  notiCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADII.card,
    padding: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.base,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  notiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  appIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: COLORS.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  appName: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    flex: 1,
  },
  tagContext: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tagContextText: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  notiTitle: {
    fontFamily: FONTS.sans,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  notiDesc: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryBtn: {
    flex: 1.2,
    height: 38,
    backgroundColor: COLORS.primaryMint,
    borderRadius: RADII.pill,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  primaryBtnText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  secondaryBtn: {
    flex: 1,
    height: 38,
    backgroundColor: COLORS.buttonDark,
    borderRadius: RADII.pill,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryBtnText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.buttonTextLight,
  },
  threePillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  threePillItem: {
    flex: 1,
    height: 38,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADII.pill,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  threePillText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
});
