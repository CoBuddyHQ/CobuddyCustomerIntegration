import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, StatusBar, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';



import { kycApi } from '../../services/api';
import { useAuthStore } from '../../store/slices/authStore';

export const VerificationProcessingScreen = () => { 
  const { t } = useTranslation('verify.processing');

  const STEPS = [
  {id: 1, icon: 'file-document-outline', label: t('steps.documentVerification', 'Document evidence'), status: t('status.pending', 'NOT CONFIRMED')},
  {id: 2, icon: 'face-recognition', label: t('steps.selfieLiveness', 'Selfie evidence'), status: t('status.pending', 'NOT CONFIRMED')},
  {id: 3, icon: 'account-search', label: t('steps.profileReview', 'Administrative review'), status: t('status.pending', 'NOT CONFIRMED')},
  {id: 4, icon: 'check-decagram', label: t('steps.bookingAuthorization', 'Booking authorization'), status: t('status.pending', 'NOT CONFIRMED')},
];

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const setKycStatus = useAuthStore((s) => s.setKycStatus);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setError(false);
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {toValue: 1.15, duration: 900, useNativeDriver: true}),
        Animated.timing(pulseAnim, {toValue: 1.0,  duration: 900, useNativeDriver: true}),
      ]),
    );
    animation.start();
    const checkStatus = async () => {
      try {
        const res = await kycApi.getKycStatus();
        if (!active) return;
        if (!res || typeof res.status !== 'string') {
          setError(true);
          return;
        }
        const status = res.status.toLowerCase();
        if (status === 'approved' || status === 'verified') {
          setKycStatus('verified');
          navigation.replace('VerificationSuccessScreen');
        } else if (status === 'rejected' || status === 'resubmit') {
          setKycStatus('rejected');
          navigation.replace('VerificationRejectedScreen');
        } else {
          setKycStatus('pending');
          navigation.replace('VerificationPendingScreen');
        }
      } catch {
        if (active) setError(true);
      }
    };
    void checkStatus();

    return () => {
      active = false;
      animation.stop();
    };
  }, [navigation, pulseAnim, setKycStatus, attempt]);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      <View style={styles.header}>
        <View style={styles.headerIconWrap}>
          <Icon name="lock" size={18} color={theme.colors.primary} />
        </View>
        <Text style={styles.headerTitle}>{t('headerTitle', 'Secure Verification')}</Text>
        <View style={styles.headerIconWrap}>
          <Icon name="shield-check" size={18} color={theme.colors.primary} />
        </View>
      </View>

      <ScrollView style={styles.bodyScroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.heroRing, {transform: [{scale: pulseAnim}]}]}>
          <View style={styles.heroInnerRing}>
            <Icon name="shield-search" size={52} color={theme.colors.primary} />
          </View>
        </Animated.View>

        <Text style={styles.heroTitle}>
          {t('heroTitleVerifying', 'Checking Your\nVerification Status')}
        </Text>
        <Text style={styles.heroSub}>
          {error
            ? t('statusUnavailable', 'We could not check your verification status. Please try again.')
            : t('processing.reviewingDetails', 'Retrieving your latest verification status...')}
        </Text>

        {error && (
          <TouchableOpacity accessibilityRole="button" onPress={() => setAttempt(value => value + 1)}>
            <Text style={styles.heroSub}>{t('retry', 'Try Again')}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.stepStack}>
          {STEPS.map((step, i) => {
            const isDone = false;
            const isProcessing = !error && i === 0;
            
            return (
              <View key={step.id} style={[styles.stepRow, i < STEPS.length - 1 && styles.stepRowBorder]}>
                <View style={[
                  styles.stepIconWrap,
                  isDone && styles.stepIconWrapDone,
                  isProcessing && styles.stepIconWrapActive,
                ]}>
                  <Icon
                    name={step.icon}
                    size={18}
                    color={
                      isDone ? theme.colors.success
                        : isProcessing ? theme.colors.primary : theme.colors.textSecondary
                    }
                  />
                </View>

                <Text style={styles.stepLabel}>{step.label}</Text>

                <View style={[
                  styles.statusBadge,
                  isDone && styles.statusBadgeDone,
                  isProcessing && styles.statusBadgeActive,
                ]}>
                  {isDone ? (
                    <Icon name="check-circle" size={12} color={theme.colors.success} />
                  ) : isProcessing ? (
                    <Icon name="sync" size={12} color={theme.colors.primary} />
                  ) : (
                    <Icon name="radiobox-blank" size={12} color={theme.colors.textSecondary} />
                  )}
                  <Text style={[
                    styles.statusText,
                    isDone && styles.statusTextDone,
                    isProcessing && styles.statusTextActive,
                  ]}>
                    {isDone ? t('status.completed', 'COMPLETED') : isProcessing ? t('status.processing', 'PROCESSING') : t('status.pending', 'PENDING')}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.trustBanner}>
          <Icon name="lock" size={16} color={theme.colors.primary} />
          <View style={styles.trustMeta}>
            <Text style={styles.trustTitle}>{t('protectedInfo', 'Your Information Is Protected')}</Text>
            <Text style={styles.trustSub}>
              {t('trustSubText', 'Verification results are shown only after confirmation from the server.')}
            </Text>
          </View>
        </View>
        <View style={{height: 40}} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: theme.colors.background},

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerIconWrap: {width: 36, alignItems: 'center'},
  headerTitle: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  bodyScroll: { flex: 1 },
  body: {
    alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 40, paddingBottom: 40, gap: 28,
  },

  heroRing: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: theme.colors.surface,
    borderWidth: 2, borderColor: theme.colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  heroInnerRing: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: theme.colors.background,
    borderWidth: 1, borderColor: theme.colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },

  heroTitle: {
    fontWeight: 'bold', fontSize: 26,
    color: theme.colors.textPrimary, textAlign: 'center', lineHeight: 34,
  },
  heroSub: {fontSize: 13, color: theme.colors.primary, letterSpacing: 0.5},

  progressBarTrack: {
    width: '100%', height: 3, borderRadius: 2,
    backgroundColor: theme.colors.border, overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%', borderRadius: 2,
    backgroundColor: theme.colors.primary,
  },

  stepStack: {
    width: '100%',
    backgroundColor: theme.colors.surface, borderRadius: 20,
    borderWidth: 1, borderColor: theme.colors.border, padding: 16,
  },
  stepRow: {flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10},
  stepRowBorder: {borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border},
  stepIconWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: theme.colors.background,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  stepIconWrapDone: {backgroundColor: theme.colors.background, borderColor: theme.colors.success, borderWidth: 1},
  stepIconWrapActive: {
    backgroundColor: theme.colors.background,
    borderWidth: 1, borderColor: theme.colors.primary,
  },
  stepLabel: {flex: 1, fontWeight: '500', fontSize: 13, color: theme.colors.textPrimary},
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3,
    backgroundColor: theme.colors.background,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  statusBadgeDone: {borderColor: theme.colors.success},
  statusBadgeActive: {borderColor: theme.colors.primary},
  statusText: {fontWeight: '600', fontSize: 9, color: theme.colors.textSecondary, letterSpacing: 1},
  statusTextDone: {color: theme.colors.success},
  statusTextActive: {color: theme.colors.primary},

  trustBanner: {
    width: '100%',
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border,
    borderLeftWidth: 3, borderLeftColor: theme.colors.primary,
    padding: 16,
  },
  trustMeta: {flex: 1, gap: 6},
  trustTitle: {fontWeight: '600', fontSize: 13, color: theme.colors.textPrimary},
  trustSub: {fontSize: 11, color: theme.colors.textSecondary, lineHeight: 16},
});
