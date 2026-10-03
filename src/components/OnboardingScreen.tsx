import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS, RADII, SPACING, FONTS } from '../theme/theme';
import { SparkleIcon, ShieldIcon, ShieldLockIcon, CheckIcon } from './common/Icons';
import { checkUsernameAvailable, registerUser } from '../database/storageService';

interface OnboardingScreenProps {
  onComplete: (username: string) => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [username, setUsername] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    const clean = username.trim();
    if (!clean) {
      setErrorMessage('Please enter a username.');
      return;
    }

    setIsChecking(true);
    setErrorMessage(null);

    try {
      const check = await checkUsernameAvailable(clean);
      if (!check.available) {
        setErrorMessage(check.reason || 'This username is already taken. Try another.');
        setIsChecking(false);
        return;
      }

      // Username is free -> Register
      await registerUser(clean);
      setIsSuccess(true);

      setTimeout(() => {
        onComplete(clean);
      }, 700);
    } catch (err) {
      setErrorMessage('Something went wrong. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <View style={styles.content}>
          {/* Brand Icon */}
          <View style={styles.brandIconWrapper}>
            <SparkleIcon size={24} color={COLORS.primaryMint} />
          </View>

          {/* Headlines */}
          <Text style={styles.appName}>FitTapp</Text>
          <Text style={styles.headline}>No passwords. Just you.</Text>
          <Text style={styles.subtitle}>
            Choose a handle. We'll handle your micro-habits quietly from the lock screen without stealing your time.
          </Text>

          {/* Input Card */}
          <View style={styles.inputCard}>
            <Text style={styles.fieldLabel}>CHOOSE YOUR HANDLE</Text>
            <View style={[styles.inputRow, errorMessage ? styles.inputRowError : null]}>
              <Text style={styles.atSymbol}>@</Text>
              <TextInput
                style={styles.textInput}
                placeholder="yourname"
                placeholderTextColor={COLORS.textMuted}
                value={username}
                onChangeText={(val) => {
                  setUsername(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                maxLength={20}
                autoFocus
              />
            </View>

            {/* Error Message Box */}
            {errorMessage && (
              <View style={styles.errorBox}>
                <ShieldLockIcon size={14} color={COLORS.softCoral} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {/* Success indicator */}
            {isSuccess && (
              <View style={styles.successBox}>
                <CheckIcon size={14} color={COLORS.primaryMint} />
                <Text style={styles.successText}>Handle reserved! Welcome to FitTapp.</Text>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, isSuccess && styles.submitButtonSuccess]}
              activeOpacity={0.85}
              onPress={handleSubmit}
              disabled={isChecking || isSuccess}
            >
              {isChecking ? (
                <ActivityIndicator size="small" color={COLORS.textDark} />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isSuccess ? 'Registered' : 'Get Started →'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Privacy Note */}
          <View style={styles.privacyNote}>
            <ShieldIcon size={13} color={COLORS.textMuted} />
            <Text style={styles.privacyNoteText}>
              Local-first database. 100% stored securely on your device.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  content: {
    alignItems: 'center',
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
  brandIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  appName: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryMint,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  headline: {
    fontFamily: FONTS.sans,
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  inputCard: {
    width: '100%',
    backgroundColor: COLORS.surfaceCard,
    borderRadius: RADII.card,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  fieldLabel: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: SPACING.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADII.pill,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  inputRowError: {
    borderColor: COLORS.softCoral,
  },
  atSymbol: {
    fontFamily: FONTS.mono,
    fontSize: 16,
    color: COLORS.primaryMint,
    fontWeight: '700',
    marginRight: 6,
  },
  textInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontFamily: FONTS.sans,
    fontSize: 15,
    fontWeight: '600',
    height: '100%',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(248, 113, 113, 0.08)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.25)',
    marginBottom: SPACING.md,
  },
  errorText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.softCoral,
    fontWeight: '500',
    flex: 1,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
    marginBottom: SPACING.md,
  },
  successText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.primaryMint,
    fontWeight: '600',
    flex: 1,
  },
  submitButton: {
    height: 48,
    backgroundColor: COLORS.primaryMint,
    borderRadius: RADII.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonSuccess: {
    backgroundColor: COLORS.accentLime,
  },
  submitButtonText: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: SPACING.lg,
  },
  privacyNoteText: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: COLORS.textMuted,
  },
});
