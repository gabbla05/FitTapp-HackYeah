import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Modal,
} from 'react-native';
import { COLORS, RADII, SPACING, FONTS } from '../theme/theme';
import { MinimalistDashboardProps } from '../types';
import {
  StretchIcon,
  WalkIcon,
  WaterIcon,
  MoonIcon,
  FoodIcon,
  SunIcon,
  CloudRainIcon,
  TabTodayIcon,
  TabProgressIcon,
  TabSettingsIcon,
  CheckIcon,
  MoodCalmIcon,
  MoodFlowIcon,
  MoodRelaxIcon,
  MoodTiredIcon,
  MoodTenseIcon,
} from './common/Icons';

export const MinimalistDashboard: React.FC<MinimalistDashboardProps> = ({
  appState,
  onUpdateState,
  onStartActivity,
  activeTab = 'today',
  onTabChange,
}) => {
  // 1. Interactive Habit Handlers
  const handleWaterDrink = () => {
    onUpdateState((prev) => {
      const newAmount = prev.waterMl + 250;
      return {
        ...prev,
        waterMl: newAmount > 3000 ? 0 : newAmount,
      };
    });
  };

  const handleToggleFood = () => {
    onUpdateState((prev) => ({
      ...prev,
      foodLogged: !prev.foodLogged,
    }));
  };

  const [isSleepModalOpen, setIsSleepModalOpen] = useState(false);
  const [modalSleepHours, setModalSleepHours] = useState<number>(appState.sleepHours > 0 ? appState.sleepHours : 7.5);
  const [modalSleepQuality, setModalSleepQuality] = useState<string>(
    appState.sleepQuality && appState.sleepQuality !== 'Not logged yet' ? appState.sleepQuality : 'Rested'
  );

  const openSleepModal = () => {
    setModalSleepHours(appState.sleepHours > 0 ? appState.sleepHours : 7.5);
    setModalSleepQuality(
      appState.sleepQuality && appState.sleepQuality !== 'Not logged yet' ? appState.sleepQuality : 'Rested'
    );
    setIsSleepModalOpen(true);
  };

  const handleSaveSleep = () => {
    onUpdateState({
      sleepHours: modalSleepHours,
      sleepQuality: modalSleepQuality,
    });
    setIsSleepModalOpen(false);
  };

  const handleToggleMood = () => {
    const moods = ['Calm', 'Flow', 'Tired'];
    const currentIdx = moods.indexOf(appState.moodLogged || 'Calm');
    const nextMood = moods[(currentIdx + 1) % moods.length];
    onUpdateState({ moodLogged: nextMood });
  };

  const isRain = appState.weather === 'rain';

  // Render appropriate vector icon based on current mood
  const renderMoodVector = (mood: string) => {
    switch (mood) {
      case 'Flow':
        return <MoodFlowIcon size={24} color={COLORS.accentLime} />;
      case 'Tired':
        return <MoodTiredIcon size={24} color={COLORS.textMuted} />;
      case 'Calm':
      default:
        return <MoodCalmIcon size={24} color={COLORS.primaryMint} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Minimal Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greetingText}>Hey, {appState.userName}</Text>
            <View style={styles.contextSubRow}>
              {isRain ? (
                <CloudRainIcon size={14} color={COLORS.skyBlue} />
              ) : (
                <SunIcon size={14} color={COLORS.amberWarm} />
              )}
              <Text style={styles.subGreetingText}>
                {appState.weatherDetails
                  ? `${appState.weatherDetails.temperatureC}°C • ${appState.weatherDetails.description} (${appState.weatherDetails.locationName || 'Local'})`
                  : isRain
                  ? 'Rainy • Recommended: desk stretch'
                  : 'Sunny • Recommended: outdoor walk'}
              </Text>
            </View>
          </View>
          <View style={styles.chillBadge}>
            <View style={styles.chillBadgeDot} />
            <Text style={styles.chillBadgeText}>Mode: Chill</Text>
          </View>
        </View>

        {/* Pure Micro-Habits Section */}
        <View style={styles.gridSection}>
          <Text style={styles.gridTitle}>Today's Micro-Habits</Text>

          {/* Row 1: Movement & Hydration */}
          <View style={styles.gridRow}>
            {/* Card 1: Movement */}
            <View style={styles.gridCard}>
              <View style={styles.cardIconHeader}>
                <View style={styles.iconCircle}>
                  {isRain ? (
                    <StretchIcon size={17} color={COLORS.primaryMint} />
                  ) : (
                    <WalkIcon size={17} color={COLORS.primaryMint} />
                  )}
                </View>
                <View style={styles.statusTag}>
                  <Text style={styles.statusTagText}>
                    {appState.movementDone ? 'Done' : isRain ? 'Desk' : 'Outdoor'}
                  </Text>
                </View>
              </View>

              <Text style={styles.habitCategory}>Movement</Text>
              <Text style={styles.habitValueMain}>
                {appState.movementDone
                  ? appState.movementType === 'walk' ? 'Walk 1.5km' : 'Desk Stretch'
                  : isRain ? 'Desk Stretch (2m)' : 'Outdoor Walk GPS'}
              </Text>

              <TouchableOpacity
                style={[styles.actionPillButton, appState.movementDone && styles.actionPillButtonDone]}
                activeOpacity={0.8}
                onPress={() => onStartActivity(isRain ? 'stretch' : 'walk')}
              >
                {appState.movementDone && <CheckIcon size={13} color={COLORS.textDark} />}
                <Text style={[styles.actionPillText, appState.movementDone && styles.actionPillTextDone]}>
                  {appState.movementDone ? 'Repeat' : 'Start'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Card 2: Hydration */}
            <View style={styles.gridCard}>
              <View style={styles.cardIconHeader}>
                <View style={styles.iconCircle}>
                  <WaterIcon size={17} color={COLORS.primaryMint} />
                </View>
                <Text style={styles.categoryBadgeWater}>
                  {appState.waterMl} / {appState.waterGoalMl} ml
                </Text>
              </View>

              <Text style={styles.habitCategory}>Hydration</Text>
              <Text style={styles.habitValueBig}>
                {appState.waterMl} <Text style={styles.unitText}>ml</Text>
              </Text>

              <TouchableOpacity
                style={[
                  styles.actionPillButton,
                  appState.waterMl >= appState.waterGoalMl && styles.actionPillButtonDone,
                ]}
                activeOpacity={0.8}
                onPress={handleWaterDrink}
              >
                {appState.waterMl >= appState.waterGoalMl && (
                  <CheckIcon size={13} color={COLORS.textDark} />
                )}
                <Text
                  style={[
                    styles.actionPillText,
                    appState.waterMl >= appState.waterGoalMl && styles.actionPillTextDone,
                  ]}
                >
                  +250ml Drink
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Row 2: Nutrition & Sleep */}
          <View style={styles.gridRow}>
            {/* Card 3: Nutrition */}
            <View style={styles.gridCard}>
              <View style={styles.cardIconHeader}>
                <View style={styles.iconCircle}>
                  <FoodIcon size={17} color={COLORS.primaryMint} />
                </View>
                <Text style={styles.timeTag}>Meal</Text>
              </View>

              <Text style={styles.habitCategory}>Nutrition</Text>
              <Text style={styles.habitValueMain}>
                {appState.foodLogged ? 'Logged' : 'Not logged'}
              </Text>

              <TouchableOpacity
                style={[styles.actionPillButton, appState.foodLogged && styles.actionPillButtonDone]}
                activeOpacity={0.8}
                onPress={handleToggleFood}
              >
                {appState.foodLogged && <CheckIcon size={13} color={COLORS.textDark} />}
                <Text style={[styles.actionPillText, appState.foodLogged && styles.actionPillTextDone]}>
                  {appState.foodLogged ? 'Logged' : 'Had a bite?'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Card 4: Sleep */}
            <TouchableOpacity
              style={styles.gridCard}
              activeOpacity={0.8}
              onPress={openSleepModal}
            >
              <View style={styles.cardIconHeader}>
                <View style={styles.iconCircle}>
                  <MoonIcon size={17} color={COLORS.primaryMint} />
                </View>
                <Text style={styles.timeTag}>Morning</Text>
              </View>

              <Text style={styles.habitCategory}>Sleep</Text>
              <Text style={styles.habitValueBig}>
                {appState.sleepHours > 0 ? `${appState.sleepHours}h` : '—'}
              </Text>
              <Text style={styles.habitSubtext}>
                {appState.sleepHours > 0 ? appState.sleepQuality : 'Tap to log'}
              </Text>

              <TouchableOpacity
                style={[
                  styles.actionPillButton,
                  appState.sleepHours > 0 && styles.actionPillButtonDone,
                ]}
                activeOpacity={0.8}
                onPress={openSleepModal}
              >
                {appState.sleepHours > 0 && <CheckIcon size={13} color={COLORS.textDark} />}
                <Text
                  style={[
                    styles.actionPillText,
                    appState.sleepHours > 0 && styles.actionPillTextDone,
                  ]}
                >
                  {appState.sleepHours > 0 ? 'Edit' : 'Log Sleep'}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </View>

          {/* Card 5: Mood & Stress (Bespoke vector icon) */}
          <TouchableOpacity
            style={styles.moodWideCard}
            activeOpacity={0.8}
            onPress={handleToggleMood}
          >
            <View style={styles.moodIconLeft}>
              {renderMoodVector(appState.moodLogged || 'Calm')}
            </View>
            <View style={styles.moodTextCol}>
              <Text style={styles.habitCategory}>Mood & Energy (Evening check-in)</Text>
              <Text style={styles.habitValueMain}>{appState.moodLogged || 'Not logged yet'}</Text>
              <Text style={styles.habitSubtext}>3 distinct states: Calm, Flow, Tired</Text>
            </View>
            <View style={styles.moodClickHint}>
              <Text style={styles.moodClickHintText}>Change ❯</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Sleep Logger Modal */}
      <Modal
        visible={isSleepModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSleepModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Log Sleep</Text>
                <Text style={styles.modalSubtitle}>Real sleep duration & recovery</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsSleepModalOpen(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Stepper */}
            <Text style={styles.modalSectionLabel}>Sleep Duration:</Text>
            <View style={styles.sleepStepperRow}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setModalSleepHours((prev) => Math.max(3.0, +(prev - 0.5).toFixed(1)))}
                activeOpacity={0.7}
              >
                <Text style={styles.stepperBtnText}>-</Text>
              </TouchableOpacity>

              <View style={styles.stepperValueContainer}>
                <Text style={styles.stepperValueText}>{modalSleepHours}</Text>
                <Text style={styles.stepperValueUnit}>hours</Text>
              </View>

              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setModalSleepHours((prev) => Math.min(14.0, +(prev + 0.5).toFixed(1)))}
                activeOpacity={0.7}
              >
                <Text style={styles.stepperBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            {/* Quick chips */}
            <View style={styles.chipsRow}>
              {[5.0, 6.0, 7.0, 7.5, 8.0, 9.0].map((hours) => (
                <TouchableOpacity
                  key={hours}
                  style={[
                    styles.chipBtn,
                    modalSleepHours === hours && styles.chipBtnActive,
                  ]}
                  onPress={() => setModalSleepHours(hours)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      modalSleepHours === hours && styles.chipTextActive,
                    ]}
                  >
                    {hours}h
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Quality selector */}
            <Text style={styles.modalSectionLabel}>Rest Quality:</Text>
            <View style={styles.qualityRow}>
              {(['Rested', 'Moderate', 'Tired'] as const).map((q) => {
                const isSelected = modalSleepQuality === q;
                return (
                  <TouchableOpacity
                    key={q}
                    style={[styles.qualityBtn, isSelected && styles.qualityBtnActive]}
                    onPress={() => {
                      setModalSleepQuality(q);
                      if (q === 'Rested' && modalSleepHours === 7.5) setModalSleepHours(8.0);
                      if (q === 'Moderate' && modalSleepHours === 7.5) setModalSleepHours(6.5);
                      if (q === 'Tired' && modalSleepHours === 7.5) setModalSleepHours(5.0);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.qualityText, isSelected && styles.qualityTextActive]}>
                      {q}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Action buttons */}
            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.saveSleepBtn}
                onPress={handleSaveSleep}
                activeOpacity={0.8}
              >
                <CheckIcon size={16} color={COLORS.textDark} />
                <Text style={styles.saveSleepText}>Save Sleep Record</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bottom Tab Navigator: Today, Progress, Settings */}
      <View style={styles.bottomNavContainer}>
        {/* Tab 1: Today */}
        <TouchableOpacity
          style={styles.navTabItem}
          activeOpacity={0.7}
          onPress={() => onTabChange('today')}
        >
          <TabTodayIcon
            size={22}
            color={activeTab === 'today' ? COLORS.primaryMint : COLORS.textMuted}
          />
          <Text
            style={[
              styles.navTabLabel,
              activeTab === 'today' && styles.navTabLabelActive,
            ]}
          >
            Today
          </Text>
        </TouchableOpacity>

        {/* Tab 2: Progress */}
        <TouchableOpacity
          style={styles.navTabItem}
          activeOpacity={0.7}
          onPress={() => onTabChange('progress')}
        >
          <TabProgressIcon
            size={22}
            color={activeTab === 'progress' ? COLORS.primaryMint : COLORS.textMuted}
          />
          <Text
            style={[
              styles.navTabLabel,
              activeTab === 'progress' && styles.navTabLabelActive,
            ]}
          >
            Progress
          </Text>
        </TouchableOpacity>

        {/* Tab 3: Settings */}
        <TouchableOpacity
          style={styles.navTabItem}
          activeOpacity={0.7}
          onPress={() => onTabChange('settings')}
        >
          <TabSettingsIcon
            size={22}
            color={activeTab === 'settings' ? COLORS.primaryMint : COLORS.textMuted}
          />
          <Text
            style={[
              styles.navTabLabel,
              activeTab === 'settings' && styles.navTabLabelActive,
            ]}
          >
            Settings
          </Text>
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
    backgroundColor: COLORS.background,
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
    marginBottom: SPACING.xl,
  },
  greetingText: {
    fontFamily: FONTS.sans,
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  contextSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  subGreetingText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  chillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryMintMuted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
  },
  chillBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primaryMint,
  },
  chillBadgeText: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primaryMint,
  },
  gridSection: {
    marginTop: SPACING.xs,
  },
  gridTitle: {
    fontFamily: FONTS.sans,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    letterSpacing: -0.3,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  gridCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADII.card,
    padding: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 148,
    justifyContent: 'space-between',
  },
  cardIconHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusTag: {
    backgroundColor: COLORS.primaryMintMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADII.pill,
  },
  statusTagText: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.primaryMint,
  },
  categoryBadgeWater: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  timeTag: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  habitCategory: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: 4,
  },
  habitValueMain: {
    fontFamily: FONTS.sans,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  habitValueBig: {
    fontFamily: FONTS.mono,
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  unitText: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    fontWeight: '400',
    color: COLORS.textMuted,
  },
  habitSubtext: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  actionPillButton: {
    height: 34,
    backgroundColor: COLORS.buttonDark,
    borderRadius: RADII.pill,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 4,
  },
  actionPillButtonDone: {
    backgroundColor: COLORS.primaryMint,
    borderColor: COLORS.primaryMint,
  },
  actionPillText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  actionPillTextDone: {
    color: COLORS.textDark,
    fontWeight: '700',
  },
  moodWideCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.card,
    padding: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 2,
    marginBottom: 8,
  },
  moodIconLeft: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  moodTextCol: {
    flex: 1,
  },
  moodClickHint: {
    paddingHorizontal: 8,
  },
  moodClickHintText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.textMuted,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    width: '100%',
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADII.card,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontFamily: FONTS.sans,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  modalSubtitle: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalCloseText: {
    fontSize: 16,
    color: COLORS.textMuted,
    fontWeight: 'bold',
  },
  modalSectionLabel: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sleepStepperRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginBottom: SPACING.md,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepperBtnText: {
    fontFamily: FONTS.sans,
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.primaryMint,
  },
  stepperValueContainer: {
    alignItems: 'center',
    minWidth: 100,
  },
  stepperValueText: {
    fontFamily: FONTS.mono,
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  stepperValueUnit: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  chipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
    gap: 6,
  },
  chipBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipBtnActive: {
    backgroundColor: 'rgba(94, 234, 212, 0.15)',
    borderColor: COLORS.primaryMint,
  },
  chipText: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: COLORS.primaryMint,
    fontWeight: '700',
  },
  qualityRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.xl,
  },
  qualityBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  qualityBtnActive: {
    backgroundColor: COLORS.primaryMint,
    borderColor: COLORS.primaryMint,
  },
  qualityText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  qualityTextActive: {
    color: COLORS.textDark,
    fontWeight: '700',
  },
  modalActionRow: {
    marginTop: 4,
  },
  saveSleepBtn: {
    backgroundColor: COLORS.primaryMint,
    paddingVertical: 14,
    borderRadius: RADII.pill,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  saveSleepText: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
  },
});
