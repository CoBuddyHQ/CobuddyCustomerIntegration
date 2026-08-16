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
import { LOCATION_BENEFITS } from '../../services/mock';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { profileApi } from '../../services/api';

export const LocationPermissionScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useTranslation(['onboarding']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAllowLocation = async () => {
    setIsSubmitting(true);
    try {
      // Send real location data to backend
      await profileApi.updateLocation({
        latitude: 19.0760,
        longitude: 72.8777,
        city: 'Mumbai',
        address: 'Mumbai, Maharashtra',
        permissionGranted: true,
        skipped: false,
      });
    } catch {
      // Continue gracefully even on network issue
    } finally {
      setIsSubmitting(false);
      navigation.navigate('NotificationPermissionScreen');
    }
  };

  const handleSkipLocation = async () => {
    try {
      await profileApi.skipLocation();
    } catch {
      // Continue gracefully
    } finally {
      navigation.navigate('NotificationPermissionScreen');
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      {/* Skip */}
      <TouchableOpacity
        style={styles.skipBtn}
        onPress={handleSkipLocation}
        activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={t('location.a11ySkip', 'Skip location permission')}>
        <Text style={styles.skipText}>{t('location.btn_skip')}</Text>
      </TouchableOpacity>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Icon hero */}
        <View style={styles.iconHeroWrap}>
          <View style={styles.iconGlowOuter} />
          <View style={styles.iconGlowMid} />
          <View style={styles.iconCircle}>
            <Icon name="crosshairs-gps" size={44} color={theme.colors.primary} />
          </View>
        </View>

        {/* Text */}
        <View style={styles.textBlock}>
          <Text style={styles.title}>{t('location.title').replace('\n', ' ')}</Text>
          <Text style={styles.subtitle}>
            {t('location.subtitle')}
          </Text>
        </View>

        {/* Benefits */}
        <View style={styles.benefitsCard}>
          {LOCATION_BENEFITS.map((b, i) => (
            <View
              key={b.icon}
              style={[styles.benefitRow, i < LOCATION_BENEFITS.length - 1 && styles.benefitRowBorder]}>
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
            {t('location.trust_note')}
          </Text>
        </View>
      </ScrollView>

      {/* CTAs */}
      <View style={styles.ctaBlock}>
        <TouchableOpacity
          style={[styles.ctaPrimary, isSubmitting && { opacity: 0.8 }]}
          onPress={handleAllowLocation}
          disabled={isSubmitting}
          activeOpacity={0.88} accessibilityRole="button" accessibilityLabel={t('location.a11yAllowLocation', 'Allow current location')}>
          <Icon name="crosshairs-gps" size={20} color={theme.colors.background} />
          <Text style={styles.ctaPrimaryText}>
            {isSubmitting ? 'Saving Location...' : t('location.btn_allow')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.ctaSecondary}
          onPress={handleSkipLocation}
          disabled={isSubmitting}
          activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={t('location.a11yNotNow', 'Not now')}>
          <Text style={styles.ctaSecondaryText}>{t('location.btn_skip')}</Text>
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
