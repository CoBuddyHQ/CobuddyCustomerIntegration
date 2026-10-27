import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ActivityIndicator, Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { getNotificationPreferences, updateNotificationPreferences, NotificationPreferences } from '../../services/api/account.api';

const CustomSwitch = ({ value, onValueChange, disabled = false, label }: { value: boolean, onValueChange?: (val: boolean) => void, disabled?: boolean, label?: string }) => {
    const translateX = useRef(new Animated.Value(value ? 20 : 0)).current;

    useEffect(() => {
        Animated.timing(translateX, {
            toValue: value ? 20 : 0,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [value, translateX]);

    return (
        <TouchableOpacity 
            activeOpacity={disabled ? 1 : 0.8}
            onPress={() => !disabled && onValueChange && onValueChange(!value)}
            style={[
                styles.switchContainer, 
                { backgroundColor: value ? (disabled ? 'rgba(212,175,55,0.5)' : theme.colors.primary) : 'rgba(255,255,255,0.1)' }
            ]} accessibilityRole="button" accessibilityLabel={label || 'Toggle switch'}
        >
            <Animated.View style={[
                styles.switchThumb,
                { transform: [{ translateX }] }
            ]} />
        </TouchableOpacity>
    );
};

export const NotificationPreferencesScreen = () => { 
  const { t } = useTranslation('settings.notificationPreferences');
  const { smartGoBack } = useSmartNavigation();
  
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadPreferences = useCallback(async () => {
    setLoadFailed(false);
    try {
      setPrefs(await getNotificationPreferences());
    } catch {
      setLoadFailed(true);
    }
  }, []);

  useEffect(() => {
    void loadPreferences();
  }, [loadPreferences]);

  const togglePref = async (key: keyof NotificationPreferences, value: boolean) => {
    setSaving(true);
    try {
      setPrefs(await updateNotificationPreferences({ [key]: value }));
    } catch {
      Alert.alert('Preference not saved', 'The Customer Backend did not confirm this notification preference.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => smartGoBack()} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={t('a11yGoBack', 'Go back')}>
          <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('headerTitle', 'Notifications')}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loadFailed ? (
          <TouchableOpacity onPress={() => void loadPreferences()} accessibilityRole="button">
            <Text style={styles.helperText}>Could not load preferences. Tap to retry.</Text>
          </TouchableOpacity>
        ) : prefs === null ? (
          <View style={styles.row}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={styles.helperText}>Loading notification preferences...</Text>
          </View>
        ) : (
          <Text style={styles.helperText}>
            Preferences are saved on the Customer Backend. Separate reminders, email receipts, wallet alerts, and review requests are not configurable yet.
          </Text>
        )}
        
        <View style={styles.heroSection}>
            <View style={styles.iconWrap}>
                <Icon name="bell-ring-outline" size={40} color={theme.colors.primary} />
            </View>
            <Text style={styles.heroTitle}>{t('heroTitle', 'Stay Updated')}</Text>
            <Text style={styles.heroSub}>{t('controlWhichNotificationsYouReceive', 'Control which notifications you receive and how you receive them.')}</Text>
        </View>

        <Text style={styles.sectionTitle}>{t('bookingUpdates', 'BOOKING UPDATES')}</Text>
        <View style={styles.card}>
            <View style={[styles.row, styles.borderBottom]}>
                <View style={styles.meta}>
                    <Text style={styles.title}>{t('statusUpdates', 'Status Updates')}</Text>
                    <Text style={styles.sub}>{t('statusUpdatesSub', 'Requests accepted, companion arrivals')}</Text>
                </View>
                <CustomSwitch value={prefs?.bookings ?? false} disabled={!prefs || saving} onValueChange={(value) => void togglePref('bookings', value)} label={t('a11yToggleBookingPush', 'Toggle booking notifications')} />
            </View>
            <View style={[styles.row, styles.borderBottom]}>
                <View style={styles.meta}>
                    <Text style={styles.title}>{t('sessionReminders', 'Session Reminders')}</Text>
                    <Text style={styles.sub}>{t('sessionRemindersSub', '"Your session starts in 1 hour"')}</Text>
                </View>
                <CustomSwitch value={prefs?.bookings ?? false} disabled label={t('a11yToggleBookingReminders', 'Session reminders are controlled with booking notifications')} />
            </View>
            <View style={styles.row}>
                <View style={styles.meta}>
                    <Text style={styles.title}>{t('emailReceipts', 'Email Receipts')}</Text>
                    <Text style={styles.sub}>{t('emailReceiptsSub', 'Invoices and booking summaries')}</Text>
                </View>
                <CustomSwitch value={false} disabled label={t('a11yToggleBookingEmail', 'Email receipts are not configurable yet')} />
            </View>
        </View>

        <Text style={styles.sectionTitle}>{t('commWallet', 'COMMUNICATION & WALLET')}</Text>
        <View style={styles.card}>
            <View style={[styles.row, styles.borderBottom]}>
                <View style={styles.meta}>
                    <Text style={styles.title}>{t('chatMessages', 'Chat Messages')}</Text>
                    <Text style={styles.sub}>{t('chatMessagesSub', 'Direct messages from companions')}</Text>
                </View>
                <CustomSwitch value={prefs?.messages ?? false} disabled={!prefs || saving} onValueChange={(value) => void togglePref('messages', value)} label={t('a11yToggleChatPush', 'Toggle chat message notifications')} />
            </View>
            <View style={[styles.row, styles.borderBottom]}>
                <View style={styles.meta}>
                    <Text style={styles.title}>{t('walletAlerts', 'Wallet Alerts')}</Text>
                    <Text style={styles.sub}>{t('walletAlertsSub', 'Money added, refunds processed')}</Text>
                </View>
                <CustomSwitch value={false} disabled label={t('a11yToggleWalletPush', 'Wallet alerts are not configurable yet')} />
            </View>
            <View style={styles.row}>
                <View style={styles.meta}>
                    <Text style={styles.title}>{t('reviewRequests', 'Review Requests')}</Text>
                    <Text style={styles.sub}>{t('reviewRequestsSub', '"How was your session with Sarah?"')}</Text>
                </View>
                <CustomSwitch value={false} disabled label={t('a11yToggleReviewPush', 'Review requests are not configurable yet')} />
            </View>
        </View>

        <Text style={styles.sectionTitle}>{t('marketing', 'MARKETING')}</Text>
        <View style={styles.card}>
            <View style={styles.row}>
                <View style={styles.meta}>
                    <Text style={styles.title}>{t('promotions', 'Promotions & Offers')}</Text>
                    <Text style={styles.sub}>{t('promotionsSub', 'Discounts, new features, and news')}</Text>
                </View>
                <CustomSwitch value={prefs?.promotions ?? false} disabled={!prefs || saving} onValueChange={(value) => void togglePref('promotions', value)} label={t('a11yTogglePromoPush', 'Toggle promotions and offers')} />
            </View>
        </View>

        <Text style={styles.sectionTitle}>{t('safetySecurity', 'SAFETY & SECURITY')}</Text>
        <View style={styles.card}>
            <View style={[styles.row, {opacity: 0.8}]}>
                <View style={styles.meta}>
                    <Text style={styles.title}>{t('sosAlerts', 'SOS & Security Alerts')}</Text>
                    <Text style={styles.sub}>{t('sosAlertsSub', 'Critical account and safety notices')}</Text>
                </View>
                <CustomSwitch value={prefs?.safety ?? false} disabled={!prefs || saving} onValueChange={(value) => void togglePref('safety', value)} label={t('a11ySOSAlertsStatus', 'Toggle safety notifications')} />
            </View>
        </View>
        <View style={styles.footerNote}>
            <Icon name="information-outline" size={14} color={theme.colors.textSecondary} />
            <Text style={styles.helperText}>{t('securityNote', 'Security alerts cannot be disabled for your safety.')}</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.textPrimary },
  
  scrollContent: { padding: 16, paddingBottom: 40 },
  
  heroSection: { alignItems: 'center', marginBottom: 32, marginTop: 10 },
  iconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(212,175,55,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)' },
  heroTitle: { fontSize: 22, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 8 },
  heroSub: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },

  sectionTitle: { fontSize: 11, fontWeight: 'bold', color: theme.colors.textSecondary, letterSpacing: 1, marginBottom: 12, marginTop: 16, marginLeft: 8 },
  card: { backgroundColor: theme.colors.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16 },
  borderBottom: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
  meta: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 4 },
  sub: { fontSize: 13, color: theme.colors.textSecondary, lineHeight: 18 },
  
  switchContainer: { width: 46, height: 26, borderRadius: 13, padding: 2, justifyContent: 'center' },
  switchThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 },

  footerNote: { flexDirection: 'row', alignItems: 'center', marginTop: 12, marginLeft: 8, opacity: 0.8 },
  helperText: { fontSize: 12, color: theme.colors.textSecondary, marginLeft: 6 }
});
