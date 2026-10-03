import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, RADII, SPACING, FONTS } from '../theme/theme';
import { LockScreenNotificationProps } from '../types';
import { PlayIcon, SparkleIcon, LockIcon, SunIcon, CloudRainIcon, ShieldIcon } from './common/Icons';

export const LockScreenNotification: React.FC<LockScreenNotificationProps> = ({
  appName = 'FitTapp',
  timeAgo = 'now',
  weather = 'sunny',
  temperatureC,
  weatherLabel,
  budgetUsed = 1,
  budgetTotal = 3,
  onAccept,
  onDismiss,
  onToggleWeather,
}) => {
  const isRain = weather === 'rain';
  const isBudgetExhausted = budgetUsed > budgetTotal;

  // Contextual title and description based on weather
  const title = isRain
    ? weatherLabel
      ? `${weatherLabel}${temperatureC !== undefined ? ` • ${temperatureC}°C` : ''}. Quick indoor hint?`
      : "It's raining outside. Quick hint?"
    : temperatureC !== undefined
    ? `${weatherLabel || 'Clear sky'} • ${temperatureC}°C. Outdoor reset walk?`
    : 'Sunny & 70°F. Outdoor reset walk?';

  const description = isRain
    ? "Weather isn't ideal for a walk. Take 2 minutes for a gentle neck & shoulder stretch at your desk."
    : 'A perfect moment to rest your eyes. Take a 15-minute breath-of-fresh-air walk around the park.';

  return (
    <View style={styles.lockScreenWrapper}>
      {/* System Lock Screen Context (Top Clock & Status) */}
      <View style={styles.systemClockContainer}>
        <View style={styles.lockIconBadge}>
          <LockIcon size={14} color={COLORS.textMuted} />
        </View>
        <Text style={styles.systemDate}>Saturday, October 3</Text>
        <Text style={styles.systemClock}>09:41</Text>
      </View>

      {/* Centered iOS-Style Rich Push Notification Card */}
      {!isBudgetExhausted ? (
        <View style={styles.notificationCard}>
          {/* Header: App icon, name, contextual weather indicator */}
          <View style={styles.cardHeader}>
            <View style={styles.appIconContainer}>
              <SparkleIcon size={13} color={COLORS.primaryMint} />
            </View>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.appNameText}>
                {appName} <Text style={styles.metaDot}>•</Text> {timeAgo}
              </Text>
              <Text style={styles.budgetMiniText}>
                (Budget: {budgetUsed}/{budgetTotal})
              </Text>
            </View>

            {/* Quick Context Switcher for Demonstration */}
            {onToggleWeather && (
              <TouchableOpacity
                style={styles.weatherTag}
                activeOpacity={0.7}
                onPress={onToggleWeather}
              >
                {isRain ? (
                  <CloudRainIcon size={13} color={COLORS.skyBlue} />
                ) : (
                  <SunIcon size={13} color={COLORS.amberWarm} />
                )}
                <Text style={styles.weatherTagText}>
                  {temperatureC !== undefined ? `${temperatureC}°C` : isRain ? 'Rain' : 'Sun'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Content Body */}
          <View style={styles.cardBody}>
            <Text style={styles.titleText}>{title}</Text>
            <Text style={styles.descriptionText}>{description}</Text>
          </View>

          {/* Actions Row */}
          <View style={styles.actionsRow}>
            {/* Button 2: Secondary / Dismiss ("Not today") */}
            <TouchableOpacity
              style={styles.secondaryButton}
              activeOpacity={0.75}
              onPress={onDismiss}
            >
              <Text style={styles.secondaryButtonText}>Not today</Text>
            </TouchableOpacity>

            {/* Button 1: Primary Accent ("I'm in" + Play Icon) */}
            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.85}
              onPress={onAccept}
            >
              <PlayIcon size={15} color={COLORS.textDark} />
              <Text style={styles.primaryButtonText}>I'm in</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* HARD CAP BUDGET EXHAUSTED CARD (No emojis, sleek vector shield) */
        <View style={styles.exhaustedCard}>
          <View style={styles.shieldIconWrap}>
            <ShieldIcon size={22} color={COLORS.primaryMint} />
          </View>
          <Text style={styles.exhaustedTitle}>Attention Budget Reached</Text>
          <Text style={styles.exhaustedText}>
            You've received all {budgetTotal} of {budgetTotal} planned notifications today. Zero spam — FitTapp stays quiet until tomorrow.
          </Text>
          <TouchableOpacity
            style={styles.openDashboardButton}
            activeOpacity={0.8}
            onPress={onDismiss}
          >
            <Text style={styles.openDashboardButtonText}>Open Dashboard</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Lock Screen Bottom Ambient Shortcut Decorators */}
      <View style={styles.bottomLockShortcuts}>
        <View style={styles.quickAccessCircle} />
        <View style={styles.homeIndicator} />
        <View style={styles.quickAccessCircle} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  lockScreenWrapper: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: 48,
    paddingBottom: 24,
  },
  systemClockContainer: {
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  lockIconBadge: {
    marginBottom: 6,
    opacity: 0.8,
  },
  systemDate: {
    fontFamily: FONTS.sans,
    fontSize: 16,
    fontWeight: '400',
    color: COLORS.textSecondary,
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  systemClock: {
    fontFamily: FONTS.sans,
    fontSize: 78,
    fontWeight: '200',
    color: COLORS.textPrimary,
    letterSpacing: -2,
  },
  notificationCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADII.card,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  appIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: COLORS.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appNameText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  metaDot: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  budgetMiniText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.primaryMint,
    fontWeight: '500',
  },
  weatherTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  weatherTagText: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  cardBody: {
    marginBottom: SPACING.lg,
  },
  titleText: {
    fontFamily: FONTS.sans,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  descriptionText: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
    fontWeight: '400',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    flex: 1.15,
    height: 44,
    backgroundColor: COLORS.primaryMint,
    borderRadius: RADII.pill,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: COLORS.primaryMint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  primaryButtonText: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  secondaryButton: {
    flex: 1,
    height: 44,
    backgroundColor: COLORS.buttonDark,
    borderRadius: RADII.pill,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryButtonText: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.buttonTextLight,
  },
  exhaustedCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADII.card,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
    alignItems: 'center',
  },
  shieldIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryMintMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  exhaustedTitle: {
    fontFamily: FONTS.sans,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  exhaustedText: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  openDashboardButton: {
    paddingHorizontal: 20,
    height: 40,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADII.pill,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  openDashboardButtonText: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primaryMint,
  },
  bottomLockShortcuts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  quickAccessCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  homeIndicator: {
    width: 134,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});
