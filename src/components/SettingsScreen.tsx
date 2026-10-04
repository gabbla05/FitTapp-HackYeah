import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Platform } from 'react-native';
import { COLORS, RADII, SPACING, FONTS } from '../theme/theme';
import { SettingsScreenProps } from '../types';
import { SparkleIcon, SunIcon, CloudRainIcon, TabTodayIcon, TabProgressIcon, TabSettingsIcon, CheckIcon, ShieldIcon, ShieldLockIcon } from './common/Icons';
import { resetAttentionBudget } from '../database/storageService';

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  appState,
  onUpdateState,
  onTabChange,
  onTriggerNotification,
}) => {
  const setDailyLimit = (limit: number) => {
    onUpdateState({ attentionBudgetTotal: limit });
  };

  const toggleWeather = (weather: 'sunny' | 'rain') => {
    onUpdateState({ weather });
  };

  const resetDailyBudget = async () => {
    await resetAttentionBudget();
    onUpdateState({ attentionBudgetUsed: 0 });
  };

  const isBudgetExhausted = appState.attentionBudgetUsed >= appState.attentionBudgetTotal;

  const [cycleIndex, setCycleIndex] = useState<number>(0);
  const notificationCycle: Array<{ type: 'walk' | 'water' | 'sleep' | 'mood'; label: string }> = [
    { type: 'walk', label: 'Walk / Stretch' },
    { type: 'water', label: 'Water (+250ml)' },
    { type: 'sleep', label: 'Sleep Quality' },
    { type: 'mood', label: 'Mood & Energy' },
  ];

  const handleCycleTest = () => {
    const item = notificationCycle[cycleIndex % notificationCycle.length];
    onTriggerNotification(item.type);
    setCycleIndex((prev) => prev + 1);
  };

  const handleSendAll = () => {
    onTriggerNotification('walk');
    setTimeout(() => onTriggerNotification('water'), 1200);
    setTimeout(() => onTriggerNotification('sleep'), 2400);
    setTimeout(() => onTriggerNotification('mood'), 3600);
  };

  const nextNotification = notificationCycle[cycleIndex % notificationCycle.length];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.titleText}>FitTapp Settings</Text>
            <Text style={styles.subtitleText}>Manage your attention budget and sensors</Text>
          </View>
        </View>

        {/* 1. SECTION: Attention Budget (Hard Cap) */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.cardTitle}>Attention Budget (Hard Cap)</Text>
            <View style={styles.budgetStatusPill}>
              <Text style={styles.budgetStatusPillText}>
                {appState.attentionBudgetUsed} of {appState.attentionBudgetTotal} today
              </Text>
            </View>
          </View>
          <Text style={styles.cardDescription}>
            Strict notification limit. Once your budget is spent, the algorithm is strictly prohibited from interrupting you.
          </Text>

          {/* Daily limit selector */}
          <Text style={styles.fieldLabel}>Daily notification cap:</Text>
          <View style={styles.limitButtonsRow}>
            {[1, 2, 3, 4, 5].map((num) => {
              const isActive = appState.attentionBudgetTotal === num;
              return (
                <TouchableOpacity
                  key={num}
                  style={[styles.limitPill, isActive && styles.limitPillActive]}
                  activeOpacity={0.8}
                  onPress={() => setDailyLimit(num)}
                >
                  <Text style={[styles.limitPillText, isActive && styles.limitPillTextActive]}>
                    {num}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Budget Status Alert Box */}
          <View style={[styles.budgetAlertBox, isBudgetExhausted && styles.budgetAlertBoxExhausted]}>
            <View style={styles.alertIconWrap}>
              {isBudgetExhausted ? (
                <ShieldLockIcon size={16} color={COLORS.softCoral} />
              ) : (
                <ShieldIcon size={16} color={COLORS.primaryMint} />
              )}
            </View>
            <Text style={[styles.budgetAlertText, isBudgetExhausted && styles.budgetAlertTextExhausted]}>
              {isBudgetExhausted
                ? 'Daily limit reached. Strict silence mode active — zero notifications until tomorrow.'
                : `${appState.attentionBudgetTotal - appState.attentionBudgetUsed} hint slots remaining today.`}
            </Text>
          </View>

          {/* Individual Category Test Pills */}
          <Text style={styles.fieldLabel}>Test Single Notification Type:</Text>
          <View style={styles.testNotificationPillsRow}>
            <TouchableOpacity
              style={[styles.testPill, isBudgetExhausted && styles.testPillDisabled]}
              activeOpacity={0.8}
              onPress={() => onTriggerNotification('walk')}
              disabled={isBudgetExhausted}
            >
              <Text style={[styles.testPillText, isBudgetExhausted && styles.testPillTextDisabled]}>
                Walk / Stretch
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.testPill, isBudgetExhausted && styles.testPillDisabled]}
              activeOpacity={0.8}
              onPress={() => onTriggerNotification('water')}
              disabled={isBudgetExhausted}
            >
              <Text style={[styles.testPillText, isBudgetExhausted && styles.testPillTextDisabled]}>
                Water (+250ml)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.testPill, isBudgetExhausted && styles.testPillDisabled]}
              activeOpacity={0.8}
              onPress={() => onTriggerNotification('sleep')}
              disabled={isBudgetExhausted}
            >
              <Text style={[styles.testPillText, isBudgetExhausted && styles.testPillTextDisabled]}>
                Sleep Quality
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.testPill, isBudgetExhausted && styles.testPillDisabled]}
              activeOpacity={0.8}
              onPress={() => onTriggerNotification('mood')}
              disabled={isBudgetExhausted}
            >
              <Text style={[styles.testPillText, isBudgetExhausted && styles.testPillTextDisabled]}>
                Mood & Energy
              </Text>
            </TouchableOpacity>
          </View>

          {/* Cycle & Batch Action Buttons */}
          <View style={styles.testButtonsRow}>
            <TouchableOpacity
              style={[styles.triggerTestButton, isBudgetExhausted && styles.triggerTestButtonDisabled]}
              activeOpacity={0.8}
              onPress={handleCycleTest}
              disabled={isBudgetExhausted}
            >
              <SparkleIcon size={14} color={isBudgetExhausted ? COLORS.textMuted : COLORS.textDark} />
              <Text style={[styles.triggerTestText, isBudgetExhausted && styles.triggerTestTextDisabled]} numberOfLines={1}>
                {isBudgetExhausted ? 'Blocked by Cap' : `Test: ${nextNotification.label}`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.triggerTestButton, { backgroundColor: COLORS.surfaceElevated, borderWidth: 1, borderColor: COLORS.border }]}
              activeOpacity={0.8}
              onPress={handleSendAll}
              disabled={isBudgetExhausted}
            >
              <Text style={[styles.triggerTestText, { color: COLORS.primaryMint }]}>
                Send All 4 Types
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resetButton}
              activeOpacity={0.7}
              onPress={resetDailyBudget}
            >
              <Text style={styles.resetButtonText}>Reset Cap (0)</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. SECTION: Context Engine (Weather & GPS) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Context Engine (Weather & GPS)</Text>
          <Text style={styles.cardDescription}>
            Powered by live Open-Meteo API. Automatically checks temperature & precipitation at your coordinates to tailor hints:
          </Text>

          {/* Real API Status Banner */}
          <View style={styles.liveWeatherBanner}>
            <View style={styles.liveWeatherLeft}>
              <View style={styles.liveWeatherDot} />
              <View>
                <Text style={styles.liveWeatherTitle}>
                  Open-Meteo API: {appState.weatherDetails?.temperatureC ?? 13}°C • {appState.weatherDetails?.description ?? 'Clear sky'}
                </Text>
                <Text style={styles.liveWeatherSub}>
                  {appState.weatherDetails?.locationName ?? 'Local Area'} • Live auto-sync
                </Text>
              </View>
            </View>
          </View>

          {/* Manual override for demo */}
          <Text style={styles.fieldLabel}>Test Context Override:</Text>
          <View style={styles.weatherSwitcherRow}>
            {/* Option 1: Rain -> Desk stretch */}
            <TouchableOpacity
              style={[
                styles.weatherOption,
                appState.weather === 'rain' && styles.weatherOptionActive,
              ]}
              activeOpacity={0.8}
              onPress={() => toggleWeather('rain')}
            >
              <CloudRainIcon size={17} color={appState.weather === 'rain' ? COLORS.skyBlue : COLORS.textMuted} />
              <View>
                <Text style={[styles.weatherTitle, appState.weather === 'rain' && styles.weatherTitleActive]}>
                  Rain Mode
                </Text>
                <Text style={styles.weatherSubtext}>Hint: 2m desk stretch</Text>
              </View>
            </TouchableOpacity>

            {/* Option 2: Sun -> Outdoor walk */}
            <TouchableOpacity
              style={[
                styles.weatherOption,
                appState.weather === 'sunny' && styles.weatherOptionActive,
              ]}
              activeOpacity={0.8}
              onPress={() => toggleWeather('sunny')}
            >
              <SunIcon size={17} color={appState.weather === 'sunny' ? COLORS.amberWarm : COLORS.textMuted} />
              <View>
                <Text style={[styles.weatherTitle, appState.weather === 'sunny' && styles.weatherTitleActive]}>
                  Sunny Mode
                </Text>
                <Text style={styles.weatherSubtext}>Hint: 15m outdoor walk</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. SECTION: Tracked Pillars */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tracked Pillars (FitTapp Core)</Text>
          <Text style={styles.cardDescription}>
            All 5 health areas operate with zero cognitive friction:
          </Text>

          {[
            { title: '1. Movement (Weather & Location aware)', desc: 'Outdoor walk or indoor desk stretch' },
            { title: '2. Hydration (Zero-Friction reminder)', desc: "1-tap 'Drink' from notification" },
            { title: '3. Sleep (Morning detection)', desc: 'Collected automatically upon waking up' },
            { title: '4. Mood & Stress (Evening check-in)', desc: '3-second reflection without surveys' },
            { title: '5. Healthy Nutrition (Light reminder)', desc: 'Gentle nudge for fresh fruit / light meal' },
          ].map((item, index) => (
            <View key={index} style={styles.pillarItem}>
              <View style={styles.pillarCheck}>
                <CheckIcon size={11} color={COLORS.primaryMint} />
              </View>
              <View style={styles.pillarTextCol}>
                <Text style={styles.pillarTitle}>{item.title}</Text>
                <Text style={styles.pillarDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* 4. SECTION: Quiet Hours */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quiet Hours</Text>
          <Text style={styles.cardDescription}>
            10:00 PM – 7:30 AM • The app will never disturb your sleep.
          </Text>
        </View>

        {/* 5. SECTION: User Profile & Database */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Profile & Local Database</Text>
          <Text style={styles.cardDescription}>
            All micro-habit events and attention logs are persisted locally:
          </Text>

          <View style={styles.profileInfoBox}>
            <View>
              <Text style={styles.profileLabel}>ACTIVE USER</Text>
              <Text style={styles.profileHandle}>@{appState.userName || 'user'}</Text>
            </View>
            <View style={styles.storageTypeBadge}>
              <View style={styles.storageTypeDot} />
              <Text style={styles.storageTypeText}>
                {Platform.OS === 'web' ? 'Local-First DB' : 'SQLite Engine'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Tab Navigator: Today, Progress, Settings */}
      <View style={styles.bottomNavContainer}>
        <TouchableOpacity
          style={styles.navTabItem}
          activeOpacity={0.7}
          onPress={() => onTabChange('today')}
        >
          <TabTodayIcon size={22} color={COLORS.textMuted} />
          <Text style={styles.navTabLabel}>Today</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navTabItem}
          activeOpacity={0.7}
          onPress={() => onTabChange('progress')}
        >
          <TabProgressIcon size={22} color={COLORS.textMuted} />
          <Text style={styles.navTabLabel}>Progress</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navTabItem}
          activeOpacity={0.7}
          onPress={() => onTabChange('settings')}
        >
          <TabSettingsIcon size={22} color={COLORS.primaryMint} />
          <Text style={[styles.navTabLabel, styles.navTabLabelActive]}>Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.base,
    paddingBottom: 110,
  },
  headerRow: {
    marginBottom: SPACING.lg,
  },
  titleText: {
    fontFamily: FONTS.sans,
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  subtitleText: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.card,
    padding: SPACING.lg,
    marginBottom: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontFamily: FONTS.sans,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  budgetStatusPill: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
  },
  budgetStatusPillText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primaryMint,
  },
  cardDescription: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  fieldLabel: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  limitButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.md,
  },
  limitPill: {
    flex: 1,
    height: 40,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADII.pill,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  limitPillActive: {
    backgroundColor: COLORS.primaryMint,
    borderColor: COLORS.primaryMint,
  },
  limitPillText: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  limitPillTextActive: {
    color: COLORS.textDark,
    fontWeight: '700',
  },
  budgetAlertBox: {
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
    borderRadius: 14,
    padding: 10,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  budgetAlertBoxExhausted: {
    backgroundColor: 'rgba(251, 113, 133, 0.08)',
    borderColor: 'rgba(251, 113, 133, 0.3)',
  },
  alertIconWrap: {
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  budgetAlertText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.primaryMint,
    fontWeight: '500',
    flex: 1,
  },
  budgetAlertTextExhausted: {
    color: COLORS.softCoral,
  },
  testNotificationPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.md,
  },
  testPill: {
    flexBasis: '48%',
    flexGrow: 1,
    height: 38,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  testPillDisabled: {
    borderColor: COLORS.border,
    opacity: 0.5,
  },
  testPillText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primaryMint,
  },
  testPillTextDisabled: {
    color: COLORS.textMuted,
  },
  testButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  triggerTestButton: {
    flex: 1.5,
    height: 44,
    backgroundColor: COLORS.primaryMint,
    borderRadius: RADII.pill,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  triggerTestButtonDisabled: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  triggerTestText: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  triggerTestTextDisabled: {
    color: COLORS.textMuted,
  },
  resetButton: {
    flex: 1,
    height: 44,
    backgroundColor: COLORS.buttonDark,
    borderRadius: RADII.pill,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  resetButtonText: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.buttonTextLight,
  },
  liveWeatherBanner: {
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
    marginBottom: SPACING.base,
  },
  liveWeatherLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  liveWeatherDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primaryMint,
  },
  liveWeatherTitle: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryMint,
  },
  liveWeatherSub: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  weatherSwitcherRow: {
    flexDirection: 'row',
    gap: 10,
  },
  weatherOption: {
    flex: 1,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weatherOptionActive: {
    borderColor: COLORS.primaryMint,
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
  },
  weatherTitle: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  weatherTitleActive: {
    color: COLORS.primaryMint,
  },
  weatherSubtext: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  pillarItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  pillarCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primaryMintMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  pillarTextCol: {
    flex: 1,
  },
  pillarTitle: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  pillarDesc: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 84,
    backgroundColor: COLORS.surfaceCard,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 20,
    paddingHorizontal: SPACING.md,
  },
  navTabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minWidth: 70,
  },
  navTabLabel: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
    navTabLabelActive: {
    color: COLORS.primaryMint,
    fontWeight: '600',
  },
  profileInfoBox: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileLabel: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  profileHandle: {
    fontFamily: FONTS.mono,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  storageTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  storageTypeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primaryMint,
  },
  storageTypeText: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primaryMint,
  },
});
