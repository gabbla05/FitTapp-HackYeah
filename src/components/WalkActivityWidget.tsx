import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, RADII, SPACING, FONTS } from '../theme/theme';
import { ActivityFeedback, WalkActivityWidgetProps } from '../types';
import { PauseIcon, PlayIcon, CheckIcon, WalkIcon, LockIcon } from './common/Icons';

interface ExtendedWalkActivityWidgetProps extends WalkActivityWidgetProps {
  onOpenMap?: () => void;
}

export const WalkActivityWidget: React.FC<ExtendedWalkActivityWidgetProps> = ({
  targetDistanceKm = 1.5,
  activityTitle = 'Outdoor Reset Walk',
  onFinish,
  onOpenMap,
}) => {
  const [seconds, setSeconds] = useState<number>(872); // ~14m 32s
  const [distanceKm, setDistanceKm] = useState<number>(1.24);
  const [steps, setSteps] = useState<number>(1640);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [selectedFeedback, setSelectedFeedback] = useState<ActivityFeedback | null>(null);

  // Live timer simulation on lock screen
  useEffect(() => {
    if (isPaused || isFinished) return;

    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
      setDistanceKm((prev) => +(prev + 0.002).toFixed(2));
      setSteps((prev) => prev + 3);
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, isFinished]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleSelectFeedback = (feedback: ActivityFeedback) => {
    setSelectedFeedback(feedback);
    if (onFinish) {
      setTimeout(() => {
        onFinish(feedback);
      }, 700);
    }
  };

  return (
    <View style={styles.lockScreenWrapper}>
      {/* System Lock Screen Context */}
      <View style={styles.systemClockContainer}>
        <View style={styles.lockIconBadge}>
          <LockIcon size={14} color={COLORS.textMuted} />
        </View>
        <Text style={styles.systemDate}>Saturday, October 3</Text>
        <Text style={styles.systemClock}>09:44</Text>
      </View>

      {/* Live Activity Lock Screen Card */}
      <View style={styles.activityCard}>
        {/* Dynamic Activity Header */}
        <View style={styles.activityHeader}>
          <View style={styles.pulseContainer}>
            <View style={[styles.pulseDot, isFinished && styles.pulseDotSuccess]} />
            <Text style={styles.liveTagText}>
              {isFinished ? 'WALK COMPLETED' : isPaused ? 'PAUSED' : 'LIVE GPS • OUTDOOR WALK'}
            </Text>
          </View>
          <View style={styles.categoryPill}>
            <WalkIcon size={13} color={COLORS.primaryMint} />
            <Text style={styles.categoryText}>Outdoor Walk</Text>
          </View>
        </View>

        {!isFinished ? (
          /* ACTIVE WALK STATE */
          <View style={styles.activeContainer}>
            {/* Main Stats: Distance & Target */}
            <View style={styles.distanceRow}>
              <View>
                <Text style={styles.distanceValue}>
                  {distanceKm.toFixed(2)} <Text style={styles.distanceUnit}>km</Text>
                </Text>
                <Text style={styles.targetLabel}>
                  Goal: {targetDistanceKm} km ({Math.min(100, Math.round((distanceKm / targetDistanceKm) * 100))}%)
                </Text>
              </View>

              <View style={styles.subStatsCol}>
                <View style={styles.subStatItem}>
                  <Text style={styles.subStatLabel}>STEPS</Text>
                  <Text style={styles.subStatValue}>{steps}</Text>
                </View>
                <View style={styles.subStatItem}>
                  <Text style={styles.subStatLabel}>TIME</Text>
                  <Text style={styles.subStatValue}>{formatTime(seconds)}</Text>
                </View>
              </View>
            </View>

            {/* Seamless in-app navigation banner */}
            <TouchableOpacity
              style={styles.openMapBanner}
              activeOpacity={0.85}
              onPress={onOpenMap}
            >
              <View style={styles.openMapIcon}>
                <WalkIcon size={17} color={COLORS.primaryMint} />
              </View>
              <View style={styles.openMapTextCol}>
                <Text style={styles.openMapTitle}>Open Live GPS Map in App ↗</Text>
                <Text style={styles.openMapSub}>Real-time route tracking on street map</Text>
              </View>
            </TouchableOpacity>

            {/* Controls */}
            <View style={styles.controlButtonsRow}>
              <TouchableOpacity
                style={styles.pauseButton}
                activeOpacity={0.75}
                onPress={() => setIsPaused((prev) => !prev)}
              >
                {isPaused ? <PlayIcon size={15} color={COLORS.textPrimary} /> : <PauseIcon size={15} color={COLORS.textPrimary} />}
                <Text style={styles.pauseButtonText}>{isPaused ? 'Resume' : 'Pause'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.finishButton}
                activeOpacity={0.85}
                onPress={() => setIsFinished(true)}
              >
                <CheckIcon size={15} color={COLORS.textDark} />
                <Text style={styles.finishButtonText}>Finish Walk</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* COMPLETION ADAPTATION STATE */
          <View style={styles.feedbackContainer}>
            <View style={styles.completedBadgeIcon}>
              <WalkIcon size={22} color={COLORS.primaryMint} />
            </View>

            <Text style={styles.feedbackTitle}>How did it feel?</Text>
            <Text style={styles.feedbackSubtitle}>
              You covered {distanceKm.toFixed(2)} km in {formatTime(seconds)}. We'll tailor your next walk goal!
            </Text>

            {/* Three adaptive buttons */}
            <View style={styles.feedbackButtonsRow}>
              <TouchableOpacity
                style={[styles.adaptivePill, selectedFeedback === 'too_easy' && styles.adaptivePillActive]}
                activeOpacity={0.75}
                onPress={() => handleSelectFeedback('too_easy')}
              >
                <Text style={[styles.adaptivePillText, selectedFeedback === 'too_easy' && styles.adaptivePillTextActive]}>
                  Too easy
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.adaptivePill, selectedFeedback === 'just_right' && styles.adaptivePillActive]}
                activeOpacity={0.75}
                onPress={() => handleSelectFeedback('just_right')}
              >
                <Text style={[styles.adaptivePillText, selectedFeedback === 'just_right' && styles.adaptivePillTextActive]}>
                  Just right
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.adaptivePill, selectedFeedback === 'too_hard' && styles.adaptivePillActive]}
                activeOpacity={0.75}
                onPress={() => handleSelectFeedback('too_hard')}
              >
                <Text style={[styles.adaptivePillText, selectedFeedback === 'too_hard' && styles.adaptivePillTextActive]}>
                  Too hard
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.reassuranceText}>
              {selectedFeedback
                ? 'Saved. Your next walk goal is calibrated.'
                : 'One tap and done. Zero pressure.'}
            </Text>
          </View>
        )}
      </View>

      {/* Lock screen bottom indicators */}
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
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  systemClock: {
    fontFamily: FONTS.sans,
    fontSize: 78,
    fontWeight: '200',
    color: COLORS.textPrimary,
    letterSpacing: -2,
  },
  activityCard: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADII.card,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 10,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  pulseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.primaryMint,
  },
  pulseDotSuccess: {
    backgroundColor: COLORS.accentLime,
  },
  liveTagText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryText: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  activeContainer: {
    width: '100%',
  },
  distanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  distanceValue: {
    fontFamily: FONTS.mono,
    fontSize: 40,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -1,
  },
  distanceUnit: {
    fontFamily: FONTS.sans,
    fontSize: 18,
    fontWeight: '500',
    color: COLORS.primaryMint,
  },
  targetLabel: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: -2,
  },
  subStatsCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  subStatItem: {
    alignItems: 'flex-end',
  },
  subStatLabel: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    color: COLORS.textMuted,
    letterSpacing: 0.8,
  },
  subStatValue: {
    fontFamily: FONTS.mono,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  openMapBanner: {
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  openMapIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  openMapTextCol: {
    flex: 1,
  },
  openMapTitle: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryMint,
  },
  openMapSub: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  controlButtonsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    marginTop: SPACING.md,
  },
  pauseButton: {
    flex: 1,
    height: 44,
    backgroundColor: COLORS.buttonDark,
    borderRadius: RADII.pill,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pauseButtonText: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.buttonTextLight,
  },
  finishButton: {
    flex: 1.4,
    height: 44,
    backgroundColor: COLORS.primaryMint,
    borderRadius: RADII.pill,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  finishButtonText: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  feedbackContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  completedBadgeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryMintMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  feedbackTitle: {
    fontFamily: FONTS.sans,
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  feedbackSubtitle: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  feedbackButtonsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 8,
    marginBottom: SPACING.base,
  },
  adaptivePill: {
    flex: 1,
    height: 40,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADII.pill,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  adaptivePillActive: {
    backgroundColor: COLORS.primaryMint,
    borderColor: COLORS.primaryMint,
  },
  adaptivePillText: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  adaptivePillTextActive: {
    color: COLORS.textDark,
    fontWeight: '700',
  },
  reassuranceText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.primaryMint,
    textAlign: 'center',
    minHeight: 18,
    fontWeight: '500',
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
