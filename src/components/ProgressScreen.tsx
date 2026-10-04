import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { COLORS, RADII, SPACING, FONTS } from '../theme/theme';
import { ProgressScreenProps, DayRitual } from '../types';
import { CheckIcon, SparkleIcon, TabTodayIcon, TabProgressIcon, TabSettingsIcon, WalkIcon, WaterIcon } from './common/Icons';
import { getZeroUiStats } from '../database/storageService';

export const ProgressScreen: React.FC<ProgressScreenProps> = ({ appState, onTabChange }) => {
  // Calculate dynamic weekly rhythm based on actual current day
  const today = new Date();
  const todayIndex = (today.getDay() + 6) % 7; // Monday = 0, Sunday = 6
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const weeklyDays: DayRitual[] = dayNames.map((name, idx) => ({
    dayName: name,
    completed: idx < todayIndex ? true : idx === todayIndex ? appState.movementDone : false,
    isToday: idx === todayIndex,
  }));

  // Real Zero-UI metrics loaded from SQLite database
  const [zeroUiStats, setZeroUiStats] = useState<{
    scorePercent: number;
    lockScreenCount: number;
    inAppCount: number;
    totalEvents: number;
    timeSavedMins: number;
  }>({
    scorePercent: 100,
    lockScreenCount: 0,
    inAppCount: 0,
    totalEvents: 0,
    timeSavedMins: 0,
  });

  useEffect(() => {
    getZeroUiStats().then((stats) => {
      setZeroUiStats(stats);
    });
  }, [appState.waterMl, appState.movementDone, appState.sleepQuality, appState.moodLogged]);

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
            <Text style={styles.titleText}>Statistics & Streaks</Text>
            <Text style={styles.subtitleText}>Weekly rhythm and habit performance</Text>
          </View>
          <View style={styles.zeroStressBadge}>
            <Text style={styles.zeroStressText}>Zero-Pressure</Text>
          </View>
        </View>

        {/* 1. Card: 7-Day Weekly Rhythm */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Weekly Rhythm</Text>
            <View style={styles.streakBadge}>
              <Text style={styles.streakBadgeText}>Streak: {appState.streakWeeks} weeks</Text>
            </View>
          </View>
          <Text style={styles.cardDescription}>
            We count whole weeks, not fragile single days. Today is {dayNames[todayIndex]}. One missed day never resets your streak.
          </Text>

          {/* 7 Days Row */}
          <View style={styles.daysRow}>
            {weeklyDays.map((day, idx) => (
              <View key={idx} style={styles.dayColumn}>
                <View
                  style={[
                    styles.dayCircle,
                    day.completed && styles.dayCircleCompleted,
                    day.isToday && !day.completed && styles.dayCircleToday,
                  ]}
                >
                  {day.completed ? (
                    <CheckIcon size={13} color={COLORS.textDark} />
                  ) : (
                    <View
                      style={[
                        styles.emptyCircleDot,
                        day.isToday && styles.todayActiveDot,
                      ]}
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.dayLabel,
                    day.isToday && styles.dayLabelToday,
                  ]}
                >
                  {day.dayName}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 2. Card: Multi-Week Consistency */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Weekly Streak Consistency</Text>
          <Text style={styles.cardDescription}>
            Progress measured across past cycles:
          </Text>

          {/* Last 4 weeks */}
          <View style={styles.weeksRow}>
            {['Wk 36', 'Wk 37', 'Wk 38', 'This Wk'].map((label, idx) => (
              <View key={idx} style={styles.weekItem}>
                <View style={[styles.weekBar, styles.weekBarDone]}>
                  <CheckIcon size={13} color={COLORS.textDark} />
                </View>
                <Text style={styles.weekLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 3. Card: Attention Budget Stats */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Attention Budget Usage</Text>
            <Text style={styles.budgetMini}>
              {appState.attentionBudgetUsed} / {appState.attentionBudgetTotal} hints today
            </Text>
          </View>
          <View style={styles.segmentedProgressBar}>
            {Array.from({ length: appState.attentionBudgetTotal }).map((_, index) => {
              const isFilled = index < appState.attentionBudgetUsed;
              return (
                <View
                  key={index}
                  style={[
                    styles.progressSegment,
                    isFilled && styles.progressSegmentFilled,
                  ]}
                />
              );
            })}
          </View>
          <Text style={styles.budgetNote}>
            Strictly limited to prevent mental fatigue and app burnout.
          </Text>
        </View>

        {/* 4. Card: Adaptive Engine Status */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>FitTapp Adaptive Engine</Text>
            <View style={styles.activeEngineBadge}>
              <View style={styles.engineDot} />
              <Text style={styles.engineText}>Active</Text>
            </View>
          </View>
          <Text style={styles.cardDescription}>
            How challenge difficulty was calibrated based on your feedback:
          </Text>

          <View style={styles.adaptiveRows}>
            <View style={styles.adaptiveRow}>
              <View style={styles.adaptiveIconWrap}>
                <WalkIcon size={15} color={COLORS.primaryMint} />
              </View>
              <View style={styles.adaptiveTextCol}>
                <Text style={styles.adaptiveName}>Outdoor Walk</Text>
                <Text style={styles.adaptiveStatus}>Distance: 1.5 km (Optimal pace)</Text>
              </View>
              <Text style={styles.adaptiveBadge}>Calibrated</Text>
            </View>

            <View style={styles.adaptiveRow}>
              <View style={styles.adaptiveIconWrap}>
                <SparkleIcon size={15} color={COLORS.primaryMint} />
              </View>
              <View style={styles.adaptiveTextCol}>
                <Text style={styles.adaptiveName}>Desk Stretch</Text>
                <Text style={styles.adaptiveStatus}>Duration: 2 mins (Adapted for rainy weather)</Text>
              </View>
              <Text style={styles.adaptiveBadge}>Easy</Text>
            </View>

            <View style={styles.adaptiveRow}>
              <View style={styles.adaptiveIconWrap}>
                <WaterIcon size={15} color={COLORS.primaryMint} />
              </View>
              <View style={styles.adaptiveTextCol}>
                <Text style={styles.adaptiveName}>Hydration</Text>
                <Text style={styles.adaptiveStatus}>Target: 2000 ml (Reminder every 3h)</Text>
              </View>
              <Text style={styles.adaptiveBadge}>Just right</Text>
            </View>
          </View>
        </View>

        {/* 5. Card: Zero-UI Scorecard */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Zero-UI Scorecard (Real Data)</Text>
          <Text style={styles.cardDescription}>
            Pokrycie interakcji: ile razy nawyk został zrealizowany prosto z ekranu blokady telefonu vs wewnątrz otwartej aplikacji:
          </Text>
          <View style={styles.statsBigRow}>
            <View style={styles.bigStatCol}>
              <Text style={styles.bigStatNumber}>{zeroUiStats.scorePercent}%</Text>
              <Text style={styles.bigStatLabel}>Z ekranu blokady</Text>
            </View>
            <View style={styles.bigStatDivider} />
            <View style={styles.bigStatCol}>
              <Text style={styles.bigStatNumber}>{zeroUiStats.timeSavedMins} min</Text>
              <Text style={styles.bigStatLabel}>Czas zaoszczędzony</Text>
            </View>
          </View>
          <Text style={styles.budgetNote}>
            {zeroUiStats.totalEvents > 0
              ? `${zeroUiStats.lockScreenCount} z ${zeroUiStats.totalEvents} akcji zarejestrowano bezpośrednio z powiadomień (${zeroUiStats.inAppCount} w aplikacji). Szacunek: ~35s zaoszczędzone na każdym kliknięciu z ekranu blokady.`
              : 'Brak zarejestrowanych akcji w bazie SQLite. Kliknij przycisk na powiadomieniu (np. "+250ml Drink"), aby zaktualizować statystyki na żywo.'}
          </Text>
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
          <TabProgressIcon size={22} color={COLORS.primaryMint} />
          <Text style={[styles.navTabLabel, styles.navTabLabelActive]}>Progress</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navTabItem}
          activeOpacity={0.7}
          onPress={() => onTabChange('settings')}
        >
          <TabSettingsIcon size={22} color={COLORS.textMuted} />
          <Text style={styles.navTabLabel}>Settings</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  zeroStressBadge: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
  },
  zeroStressText: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primaryMint,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.card,
    padding: SPACING.lg,
    marginBottom: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeaderRow: {
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
  streakBadge: {
    backgroundColor: 'rgba(200, 255, 46, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADII.pill,
  },
  streakBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accentLime,
  },
  budgetMini: {
    fontFamily: FONTS.mono,
    fontSize: 12,
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
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  dayColumn: {
    alignItems: 'center',
    gap: 8,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dayCircleCompleted: {
    backgroundColor: COLORS.primaryMint,
    borderColor: COLORS.primaryMint,
  },
  dayCircleToday: {
    borderColor: COLORS.primaryMint,
  },
  emptyCircleDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.textMuted,
  },
  todayActiveDot: {
    backgroundColor: COLORS.primaryMint,
  },
  dayLabel: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  dayLabelToday: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  weeksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  weekItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  weekBar: {
    width: '100%',
    height: 46,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  weekBarDone: {
    backgroundColor: COLORS.primaryMint,
    borderColor: COLORS.primaryMint,
  },
  weekLabel: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  segmentedProgressBar: {
    flexDirection: 'row',
    height: 8,
    gap: 6,
    marginVertical: SPACING.xs,
  },
  progressSegment: {
    flex: 1,
    backgroundColor: COLORS.buttonDark,
    borderRadius: 4,
  },
  progressSegmentFilled: {
    backgroundColor: COLORS.primaryMint,
  },
  activeEngineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADII.pill,
  },
  engineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primaryMint,
  },
  engineText: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    color: COLORS.primaryMint,
    fontWeight: '600',
  },
  adaptiveRows: {
    gap: 10,
  },
  adaptiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    padding: 10,
    borderRadius: 16,
    gap: 10,
  },
  adaptiveIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adaptiveTextCol: {
    flex: 1,
  },
  adaptiveName: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  adaptiveStatus: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  adaptiveBadge: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.accentLime,
    backgroundColor: 'rgba(200, 255, 46, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADII.pill,
  },
  statsBigRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  bigStatCol: {
    alignItems: 'center',
  },
  bigStatNumber: {
    fontFamily: FONTS.mono,
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primaryMint,
  },
  bigStatLabel: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 2,
    maxWidth: 110,
  },
  bigStatDivider: {
    width: 1,
    height: 36,
    backgroundColor: COLORS.border,
  },
  budgetNote: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 6,
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
});
