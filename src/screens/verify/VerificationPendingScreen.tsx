import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { kycApi } from '../../services/api';
import type { KycStatus } from '../../services/api/kyc.api';

export const VerificationPendingScreen = () => { 
  const { t } = useTranslation('verify.pending');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const loadStatus = async () => {
      setIsLoading(true);
      setLoadError(false);
      try {
        const result = await kycApi.getKycStatus();
        if (isMounted) setKycStatus(result);
      } catch {
        if (isMounted) setLoadError(true);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadStatus();
    return () => { isMounted = false; };
  }, [attempt]);

  const verified = kycStatus?.status === 'verified' || kycStatus?.status === 'approved';
  const reviewSteps = [
    {
      icon: kycStatus?.documentSubmitted ? 'file-document-check' : 'file-document-outline',
      label: t('steps.documentVerification', 'Document evidence'),
      status: kycStatus ? (kycStatus.documentSubmitted ? 'Evidence stored' : 'Not submitted') : 'Unavailable',
      done: Boolean(kycStatus?.documentSubmitted),
    },
    {
      icon: kycStatus?.selfieSubmitted ? 'image-check-outline' : 'image-outline',
      label: t('steps.selfieLiveness', 'Selfie evidence'),
      status: kycStatus ? (kycStatus.selfieSubmitted ? 'Evidence stored' : 'Not submitted') : 'Unavailable',
      done: Boolean(kycStatus?.selfieSubmitted),
    },
    {
      icon: kycStatus?.livenessSubmitted ? 'video-check-outline' : 'video-outline',
      label: t('steps.profileReview', 'Liveness evidence'),
      status: kycStatus ? (kycStatus.livenessSubmitted ? 'Evidence stored; no automated assessment' : 'Not submitted') : 'Unavailable',
      done: Boolean(kycStatus?.livenessSubmitted),
    },
    {
      icon: verified ? 'check-decagram' : 'account-search',
      label: t('steps.bookingAuthorization', 'Verification status'),
      status: verified ? 'Customer Backend reports verified' : 'Admin review is not connected',
      done: verified,
    },
  ];

  const handleGoToIdentity = () => {
    // If KYC was opened from another flow (like Booking), return to it.
    const parent = navigation.getParent();
    if (parent && parent.canGoBack()) {
      parent.goBack();
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'MainTabNavigator' }] });
    }
  };

  const isFromFlow = navigation.getParent()?.canGoBack();

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleGoToIdentity}
          hitSlop={{top:10,bottom:10,left:10,right:10}}
          activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={t('a11yClose', 'Close')}>
          <Icon name="close" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('headerTitle', 'Verification Status')}</Text>
        <View style={styles.headerIconWrap}>
          <Icon name="shield-check" size={24} color={theme.colors.primary} />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        <View style={styles.heroCard}>
          <View style={styles.heroGlow} pointerEvents="none" />
          <View style={styles.heroIconRing}>
            <View style={styles.heroIconInner}>
              <Icon name="shield-account" size={44} color={theme.colors.primary} />
            </View>
          </View>

          <Text style={styles.heroTitle}>
            {isLoading ? 'Checking verification status…' : loadError ? 'Verification status unavailable' : verified ? 'Customer Backend reports verified' : 'Evidence status'}
          </Text>

          <View style={styles.statusBadge}>
            <Icon name="clock-outline" size={14} color={theme.colors.warning} />
            <Text style={styles.statusBadgeLabel}>{t('statusLabel', 'STATUS')}</Text>
            <View style={styles.statusBadgeDivider} />
            <Text style={styles.statusBadgeValue}>{loadError ? 'Unavailable' : kycStatus?.status || 'Unavailable'}</Text>
          </View>

          <View style={styles.etaRow}>
            {isLoading ? <ActivityIndicator size="small" color={theme.colors.textSecondary} /> : <Icon name="information-outline" size={14} color={theme.colors.textSecondary} />}
            <Text style={styles.etaText}>
              {loadError
                ? 'The Customer Backend could not return a verification status.'
                : 'Automated identity assessment and administrative review are not connected. No completion time is available.'}
            </Text>
          </View>
          {loadError ? (
            <TouchableOpacity onPress={() => setAttempt((current) => current + 1)} accessibilityRole="button">
              <Text style={styles.statusBadgeValue}>Retry</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>{t('progress', 'VERIFICATION PROGRESS')}</Text>
          {reviewSteps.map((step, i) => (
            <View key={step.label} style={[styles.reviewRow, i < reviewSteps.length - 1 && styles.reviewRowBorder]}>
              <View style={[styles.reviewIconWrap, step.done && styles.reviewIconWrapDone]}>
                <Icon
                  name={step.icon}
                  size={16}
                  color={step.done ? theme.colors.success : theme.colors.textSecondary}
                />
              </View>
              <View style={styles.reviewMeta}>
                <Text style={styles.reviewLabel}>{step.label}</Text>
                <Text style={[styles.reviewStatus, step.done && styles.reviewStatusDone]}>
                  {step.status}
                </Text>
              </View>
              {step.done ? (
                <Icon name="check-circle" size={18} color={theme.colors.success} />
              ) : (
                <Icon name="timer-sand" size={16} color={theme.colors.warning} />
              )}
            </View>
          ))}
        </View>

        <View style={styles.nextCard}>
          <View style={styles.nextIconWrap}>
            <Icon name="information" size={20} color={theme.colors.primary} />
          </View>
          <View style={styles.nextMeta}>
            <Text style={styles.nextTitle}>{t('continueSetup', 'Continue Setting Up Your Experience')}</Text>
            <Text style={styles.nextSub}>{t('youCanContinueExploringThe', 'You can continue using features that are available for your current server-reported status.')}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.ctaBtn} onPress={handleGoToIdentity} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel={isFromFlow ? t('actions.goBack', 'Go Back') : t('actions.continue', 'Continue')}>
          <Text style={styles.ctaBtnText}>{isFromFlow ? t('actions.goBack', 'Go Back') : t('actions.continueToApp', 'Continue to App')}</Text>
          <Icon name={isFromFlow ? "arrow-left" : "arrow-right"} size={18} color={theme.colors.background} />
        </TouchableOpacity>

        <View style={styles.securityNote}>
          <Icon name="lock" size={13} color={theme.colors.textSecondary} />
          <Text style={styles.securityText}>{t('allVerificationDataIsProtected', 'Evidence is stored by the Customer Backend. This app build does not perform an automated identity match or administrative review.')}</Text>
        </View>

        <View style={{height: 20}} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: theme.colors.background},

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1, borderColor: theme.colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {flex: 1, fontWeight: '600', fontSize: 17, color: theme.colors.textPrimary, letterSpacing: 0.2, textAlign: 'center'},
  headerIconWrap: {width: 40, alignItems: 'flex-end'},

  scroll: {flex: 1},
  scrollContent: {paddingHorizontal: 20, paddingTop: 24, gap: 20, paddingBottom: 40},

  heroCard: {
    backgroundColor: theme.colors.surface, borderRadius: 28,
    borderWidth: 1, borderColor: theme.colors.border,
    padding: 28, alignItems: 'center', gap: 16,
    position: 'relative', overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute', top: -80, left: 0, right: 0,
    height: 220, backgroundColor: 'rgba(212, 175, 55, 0.03)', borderRadius: 200,
  },
  heroIconRing: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: theme.colors.background,
    borderWidth: 2, borderColor: theme.colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  heroIconInner: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: theme.colors.surface,
    borderWidth: 1, borderColor: theme.colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: {fontWeight: 'bold', fontSize: 26, color: theme.colors.textPrimary, textAlign: 'center'},

  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: theme.colors.background,
    borderRadius: 100, borderWidth: 1, borderColor: theme.colors.border,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  statusBadgeLabel: {fontWeight: '600', fontSize: 10, color: theme.colors.textSecondary, letterSpacing: 1.5},
  statusBadgeDivider: {width: 1, height: 12, backgroundColor: theme.colors.border},
  statusBadgeValue: {fontWeight: '600', fontSize: 13, color: theme.colors.warning},

  etaRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
  etaText: {fontSize: 12, color: theme.colors.textSecondary, flex: 1, lineHeight: 17},

  card: {
    backgroundColor: theme.colors.surface, borderRadius: 20,
    borderWidth: 1, borderColor: theme.colors.border, padding: 20,
  },
  sectionLabel: {
    fontWeight: '600', fontSize: 10,
    color: theme.colors.textSecondary, letterSpacing: 1.5, marginBottom: 14,
  },
  reviewRow: {flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12},
  reviewRowBorder: {borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border},
  reviewIconWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: theme.colors.background,
    borderWidth: 1, borderColor: theme.colors.border,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  reviewIconWrapDone: {
    borderColor: theme.colors.success,
  },
  reviewMeta: {flex: 1},
  reviewLabel: {fontWeight: '500', fontSize: 14, color: theme.colors.textPrimary},
  reviewStatus: {fontSize: 11, color: theme.colors.warning, marginTop: 2},
  reviewStatusDone: {color: theme.colors.success},

  nextCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    backgroundColor: theme.colors.surface,
    borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border,
    borderLeftWidth: 3, borderLeftColor: theme.colors.primary, padding: 16,
  },
  nextIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: theme.colors.background,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  nextMeta: {flex: 1},
  nextTitle: {fontWeight: '600', fontSize: 14, color: theme.colors.textPrimary, marginBottom: 6},
  nextSub: {fontSize: 12, color: theme.colors.textSecondary, lineHeight: 17},

  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 17, borderRadius: 100,
    backgroundColor: theme.colors.primary,
  },
  ctaBtnText: {fontWeight: '600', fontSize: 16, color: theme.colors.background, letterSpacing: 0.3},

  securityNote: {flexDirection: 'row', alignItems: 'flex-start', gap: 8, opacity: 0.6},
  securityText: {flex: 1, fontSize: 11, color: theme.colors.textSecondary, lineHeight: 16},
});
