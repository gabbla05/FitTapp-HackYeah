import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, RADII, SPACING, FONTS } from '../theme/theme';
import { WaveChart } from './WaveChart';
import { PauseIcon, PlayIcon, SparkleIcon, CheckIcon, LockIcon } from './common/Icons';
import { ActivityFeedback, LiveActivityWidgetProps } from '../types';

export const LiveActivityWidget: React.FC<LiveActivityWidgetProps> = ({
  initialSeconds = 108, // 01:48
  activityTitle = 'Desk Neck & Shoulder Stretch',
  activitySubtitle = '2 minutes for relief and posture',
  onFinish,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(initialSeconds);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [selectedFeedback, setSelectedFeedback] = useState<ActivityFeedback | null>(null);

  // Live countdown timer logic
  useEffect(() => {
    if (isPaused || isFinished) return;
    if (secondsLeft <= 0) {
      setIsFinished(true);
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, isFinished, secondsLeft]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleSelectFeedback = (feedback: ActivityFeedback) => {
    setSelectedFeedback(feedback);
    onFinish?.(feedback);
  };

  return (
    <View style={styles.lockScreenWrapper}>
      {/* System Lock Screen Context */}
      <View style={styles.systemClockContainer}>
        <View style={styles.lockIconBadge}>
          <LockIcon size={14} color={COLORS.textMuted} />
        </View>
        <Text style={styles.systemDate}>Saturday, October 3</Text>
        <Text style={styles.systemClock}>09:42</Text>
      </View>

      {/* Live Activity Card */}
      <View style={styles.activityCard}>
        {/* Dynamic Activity Badge */}
        <View style={styles.activityHeader}>
          <View style={styles.pulseContainer}>
            <View style={[styles.pulseDot, isFinished && styles.pulseDotSuccess]} />
            <Text style={styles.liveTagText}>
              {isFinished ? 'COMPLETED' : isPaused ? 'PAUSED' : 'LIVE ACTIVITY'}
            </Text>
          </View>
          <View style={styles.categoryPill}>
            <SparkleIcon size={12} color={COLORS.primaryMint} />
            <Text style={styles.categoryText}>Movement • Zero-Friction</Text>
          </View>
        </View>

        {/* CONDITIONAL RENDERING */}
        {!isFinished ? (
          <View style={styles.activeContainer}>
            {/* Monospaced Precision Timer */}
            <View style={styles.timerWrapper}>
              <Text style={styles.timerText}>{formatTime(secondsLeft)}</Text>
              <Text style={styles.timerLabel}>TIME REMAINING</Text>
            </View>

            {/* Subtle smoothed wave chart */}
            <WaveChart width={280} height={52} isPaused={isPaused} />

            {/* Title & subtitle */}
            <View style={styles.titleContainer}>
              <Text style={styles.activityTitle}>{activityTitle}</Text>
              <Text style={styles.activitySubtitle}>{activitySubtitle}</Text>
            </View>

            {/* Control buttons */}
            <View style={styles.controlButtonsRow}>
              <TouchableOpacity
                style={styles.pauseButton}
                activeOpacity={0.75}
                onPress={() => setIsPaused((prev) => !prev)}
              >
                {isPaused ? (
                  <PlayIcon size={15} color={COLORS.textPrimary} />
                ) : (
                  <PauseIcon size={15} color={COLORS.textPrimary} />
                )}
                <Text style={styles.pauseButtonText}>
                  {isPaused ? 'Resume' : 'Pause'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.finishButton}
                activeOpacity={0.85}
                onPress={() => setIsFinished(true)}
              >
                <CheckIcon size={15} color={COLORS.textDark} />
                <Text style={styles.finishButtonText}>Complete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* COMPLETION ADAPTATION STATE */
          <View style={styles.feedbackContainer}>
            <View style={styles.completedBadgeIcon}>
              <CheckIcon size={22} color={COLORS.primaryMint} />
            </View>

            <Text style={styles.feedbackTitle}>How was it?</Text>
            <Text style={styles.feedbackSubtitle}>
              We'll automatically adapt future hints with zero pressure or guilt.
            </Text>

            {/* Three adaptive pill buttons */}
            <View style={styles.feedbackButtonsRow}>
              <TouchableOpacity
                style={[
                  styles.adaptivePill,
                  selectedFeedback === 'too_easy' && styles.adaptivePillActive,
                ]}
                activeOpacity={0.75}
                onPress={() => handleSelectFeedback('too_easy')}
              >
                <Text
                  style={[
                    styles.adaptivePillText,
                    selectedFeedback === 'too_easy' && styles.adaptivePillTextActive,
                  ]}
                >
                  Too easy
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.adaptivePill,
                  selectedFeedback === 'just_right' && styles.adaptivePillActive,
                ]}
                activeOpacity={0.75}
                onPress={() => handleSelectFeedback('just_right')}
              >
                <Text
                  style={[
                    styles.adaptivePillText,
                    selectedFeedback === 'just_right' && styles.adaptivePillTextActive,
                  ]}
                >
                  Just right
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.adaptivePill,
                  selectedFeedback === 'too_hard' && styles.adaptivePillActive,
                ]}
                activeOpacity={0.75}
                onPress={() => handleSelectFeedback('too_hard')}
              >
                <Text
                  style={[
                    styles.adaptivePillText,
                    selectedFeedback === 'too_hard' && styles.adaptivePillTextActive,
                  ]}
                >
                  Too hard
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.reassuranceText}>
              {selectedFeedback
                ? 'Saved. Next hint will adapt to your energy level.'
                : 'One tap and done. Zero guilt.'}
            </Text>
          </View>
        )}
      </View>

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
    alignItems: 'center',
  },
  timerWrapper: {
    alignItems: 'center',
    marginTop: 4,
  },
  timerText: {
    fontFamily: FONTS.mono,
    fontSize: 54,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },
  timerLabel: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: -2,
    letterSpacing: 1,
  },
  titleContainer: {
    alignItems: 'center',
    marginVertical: 4,
  },
  activityTitle: {
    fontFamily: FONTS.sans,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  activitySubtitle: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  controlButtonsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    marginTop: SPACING.lg,
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
    flex: 1.2,
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
    lineHeight: 18,
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
