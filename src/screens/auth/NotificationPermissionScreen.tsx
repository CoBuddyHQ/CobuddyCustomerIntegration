import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTranslation } from 'react-i18next';
import { NOTIFICATION_BENEFITS } from '../../services/mock';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { notificationsApi } from '../../services/api';
import { showApiError } from '../../utils/errorHandler';
import { FlowTracker } from '../../services/flowTracker';

export const NotificationPermissionScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useTranslation(['onboarding']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    FlowTracker.saveActiveScreen('NotificationPermissionScreen');
  }, []);

  const handleEnableNotifications = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await notificationsApi.updateNotificationPermission({
        enabled: true,
        skipped: false,
      });
      navigation.navigate('BasicProfileSetupScreen');
    } catch (e: any) {
      showApiError(e, {
        title: 'Notification Setup Failed',
        onRetry: handleEnableNotifications,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipNotifications = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await notificationsApi.skipNotificationPermission();
      navigation.navigate('BasicProfileSetupScreen');
    } catch (e: any) {
      showApiError(e, {
        title: 'Action Failed',
        onRetry: handleSkipNotifications,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      {/* Skip */}
      <TouchableOpacity
        style={styles.skipBtn}
        onPress={handleSkipNotifications}
        activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={t('notification.a11ySkip', 'Skip notification permission')}>
        <Text style={styles.skipText}>{t('notification.btn_skip')}</Text>
      </TouchableOpacity>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Icon hero */}
        <View style={styles.iconHeroWrap}>
          <View style={styles.iconGlowOuter} />
          <View style={styles.iconGlowMid} />
          <View style={styles.iconCircle}>
            <Icon name="bell-outline" size={44} color={theme.colors.primary} />
          </View>
          {/* Notification chip floating */}
          <View style={styles.notifChip}>
            <View style={styles.notifDot} />
            <Text style={styles.notifChipText}>{t('notification.bookingConfirmed', 'Booking Confirmed!')}</Text>
          </View>
        </View>

        {/* Text */}
        <View style={styles.textBlock}>
          <Text style={styles.title}>{t('notification.title').replace('\n', ' ')}</Text>
          <Text style={styles.subtitle}>
            {t('notification.subtitle')}
          </Text>
        </View>

        {/* Benefits */}
        <View style={styles.benefitsCard}>
          {NOTIFICATION_BENEFITS.map((b, i) => (
            <View
              key={b.icon}
              style={[styles.benefitRow, i < NOTIFICATION_BENEFITS.length - 1 && styles.benefitRowBorder]}>
              <View style={styles.benefitIconWrap}>
                <Icon name={b.icon} size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.benefitMeta}>
                <Text style={styles.benefitTitle}>{t(b.titleKey, b.defaultTitle) as string}</Text>
                <Text style={styles.benefitSub}>{t(b.subKey, b.defaultSub) as string}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Privacy note */}
        <View style={styles.privacyRow}>
          <Icon name="lock-outline" size={14} color={theme.colors.textSecondary} />
          <Text style={styles.privacyText}>
            {t('notification.trust_note')}
          </Text>
        </View>
      </ScrollView>

      {/* CTAs */}
      <View style={styles.ctaBlock}>
        <TouchableOpacity
          style={[styles.ctaPrimary, isSubmitting && { opacity: 0.8 }]}
          onPress={handleEnableNotifications}
          disabled={isSubmitting}
          activeOpacity={0.88} accessibilityRole="button" accessibilityLabel={t('notification.a11yEnable', 'Enable notifications')}>
          <Icon name="bell-ring-outline" size={20} color={theme.colors.background} />
          <Text style={styles.ctaPrimaryText}>
            {isSubmitting ? 'Configuring Notifications...' : t('notification.btn_allow')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.ctaSecondary}
          onPress={handleSkipNotifications}
          disabled={isSubmitting}
          activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={t('notification.a11yNotNow', 'Not now')}>
          <Text style={styles.ctaSecondaryText}>{t('notification.btn_skip')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  skipBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 20, paddingTop: 8,
  },
  skipText: { fontSize: 14, color: theme.colors.textSecondary, fontWeight: '500' },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 28,
  },
  iconHeroWrap: { alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  iconGlowOuter: {
    position: 'absolute',
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(212,175,55,0.06)',
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.10)',
  },
  iconGlowMid: {
    position: 'absolute',
    width: 112, height: 112, borderRadius: 56,
    backgroundColor: 'rgba(212,175,55,0.10)',
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.18)',
  },
  iconCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(212,175,55,0.15)',
    borderWidth: 1.5, borderColor: 'rgba(212,175,55,0.35)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 6,
  },
  notifChip: {
    position: 'absolute',
    bottom: -14, right: -24,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: theme.colors.surface, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  notifDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.primary },
  notifChipText: { fontSize: 10, color: theme.colors.primary, fontWeight: '600' },
  textBlock: { alignItems: 'center', gap: 10 },
  title: {
    fontSize: 32, color: theme.colors.textPrimary,
    textAlign: 'center', letterSpacing: -0.3, fontWeight: 'bold'
  },
  subtitle: {
    fontSize: 15, color: theme.colors.textSecondary,
    textAlign: 'center', lineHeight: 22,
  },
  benefitsCard: {
    width: '100%',
    backgroundColor: theme.colors.surface, borderRadius: 20,
    borderWidth: 1, borderColor: theme.colors.border,
    paddingVertical: 4,
  },
  benefitRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  benefitRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
  benefitIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(212,175,55,0.10)',
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.20)',
    alignItems: 'center', justifyContent: 'center',
  },
  benefitMeta: { flex: 1 },
  benefitTitle: { fontSize: 14, color: theme.colors.textPrimary, marginBottom: 3, fontWeight: '600' },
  benefitSub: { fontSize: 12, color: theme.colors.textSecondary, lineHeight: 16 },
  privacyRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 8,
  },
  privacyText: {
    flex: 1, fontSize: 12, color: theme.colors.textSecondary, lineHeight: 16,
  },
  ctaBlock: { paddingHorizontal: 24, paddingBottom: 16, gap: 12 },
  ctaPrimary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 16, borderRadius: 16,
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  ctaPrimaryText: { fontSize: 16, color: theme.colors.background, fontWeight: 'bold' },
  ctaSecondary: { alignItems: 'center', paddingVertical: 10 },
  ctaSecondaryText: { fontSize: 15, color: theme.colors.textSecondary, fontWeight: '600' },
});
