import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { useAuthStore } from '../../store/slices/authStore';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface MenuItem {
  id: string;
  icon: string;
  title: string;
  sub?: string;
  route?: string;
  action?: () => void;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface DevTestItem {
  id: string;
  title: string;
  route: string;
}

export const SettingsHubScreen = () => { 
  const { t } = useTranslation('settings.hub');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const SETTING_SECTIONS: MenuSection[] = [
    {
      title: t('sections.account', 'ACCOUNT'),
      items: [
        { id: 'acc', icon: 'account-cog-outline', title: t('items.acc.title', 'Account Settings'), sub: t('items.acc.sub', 'Phone, Email, Linked Accounts'), route: 'AccountSettingsScreen' },
        { id: 'perms', icon: 'shield-account-outline', title: t('items.perms.title', 'App Permissions'), sub: t('items.perms.sub', 'Camera, Location, Microphone'), route: 'AppPermissionsScreen' },
        { id: 'sessions', icon: 'devices', title: t('items.sessions.title', 'Active Sessions'), sub: t('items.sessions.sub', 'Manage logged-in devices'), route: 'ActiveSessionsScreen' },
      ]
    },
    {
      title: t('sections.privacy___safety', 'PRIVACY & SAFETY'),
      items: [
        { id: 'applock', icon: 'fingerprint', title: t('items.applock.title', 'App Lock'), sub: t('items.applock.sub', 'FaceID & Biometrics'), route: 'AppLockScreen' },
        { id: 'blocked', icon: 'cancel', title: t('items.blocked.title', 'Blocked Users'), sub: t('items.blocked.sub', 'Manage your blocked list'), route: 'BlockedUsersScreen' },
        { id: 'safety', icon: 'shield-check-outline', title: t('items.safety.title', 'Safety Settings'), sub: t('items.safety.sub', 'SOS & Trusted Contacts'), route: 'SafetySettingsScreen' },
      ]
    },
    {
      title: t('sections.data___notifications', 'DATA & NOTIFICATIONS'),
      items: [
        { id: 'notif', icon: 'bell-outline', title: t('items.notif.title', 'Notifications'), sub: t('items.notif.sub', 'Push & Email preferences'), route: 'NotificationPreferencesScreen' },
        { id: 'data', icon: 'database-outline', title: t('items.data.title', 'Data & Cache'), sub: t('items.data.sub', 'Clear cache & consent manager'), route: 'DataCacheScreen' },
        { id: 'lang', icon: 'translate', title: t('items.lang.title', 'App Language'), sub: t('items.lang.sub', 'English (US)'), route: 'LanguageSelectionScreen' },
      ]
    },
    {
      title: t('sections.support', 'SUPPORT'),
      items: [
        { id: 'help', icon: 'help-circle-outline', title: t('items.help.title', 'Help Center'), sub: t('items.help.sub', 'FAQs & Guides'), action: () => navigation.navigate('SafetySupportStack', { screen: 'HelpCenterScreen' }) },
        { id: 'contact', icon: 'headset', title: t('items.contact.title', 'Contact Support'), sub: t('items.contact.sub', '24/7 Concierge Chat'), action: () => navigation.navigate('ChatTab', { screen: 'ConciergeChatScreen', initial: false }) },
        { id: 'report', icon: 'alert-circle-outline', title: t('items.report.title', 'Report a Problem'), sub: t('items.report.sub', 'Flag an issue or bug'), action: () => navigation.navigate('SafetySupportStack', { screen: 'CreateSupportTicketScreen' }) },
      ]
    },
  ];

  const DANGER_ZONE: MenuItem[] = [
    { id: 'deactivate', icon: 'pause-circle-outline', title: t('items.deactivate.title', 'Deactivate Account'), sub: t('items.deactivate.sub', 'Temporarily hide your profile'), route: 'DeactivateAccountScreen' },
    { id: 'delete', icon: 'delete-forever-outline', title: t('items.delete.title', 'Delete Account'), sub: t('items.delete.sub', 'Permanently remove all data'), route: 'DeleteAccountScreen' },
  ];

  // NOTE: kept intentionally (not to be removed by automated fix passes) — will be removed manually before final handoff.
  const DEV_TEST_SCREENS: DevTestItem[] = [
    { id: 'susp', title: t('items.susp.title', 'Suspended Screen'), route: 'AccountSuspendedScreen' },
    { id: 'rev', title: t('items.rev.title', 'Under Review Screen'), route: 'AccountUnderManualReviewScreen' },
    { id: 'react', title: t('items.react.title', 'Reactivation Request'), route: 'AccountReactivationRequestScreen' },
    { id: 'pol', title: t('items.pol.title', 'Policy Violation'), route: 'PolicyViolationNoticeScreen' },
    { id: 'deact', title: t('items.deact.title', 'Deactivated Screen'), route: 'AccountDeactivatedScreen' },
    { id: 'net', title: t('items.net.title', 'Network Error'), route: 'NetworkErrorScreen' },
    { id: 'force', title: t('items.force.title', 'Force Update'), route: 'ForceUpdateScreen' },
    { id: 'maint', title: t('items.maint.title', 'Maintenance Mode'), route: 'MaintenanceModeScreen' },
  ];

    const { smartGoBack } = useSmartNavigation();

  const handleLogout = () => {
    Alert.alert(
      t('logOutAlert.title', 'Log Out'),
      t('logOutAlert.message', 'Are you sure you want to log out of CoBuddy?'),
      [
        { text: t('logOutAlert.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('logOutAlert.confirm', 'Log Out'),
          style: 'destructive',
          onPress: async () => {
            try {
              await useAuthStore.getState().logout();
            } catch (err) {
              console.error('Logout error:', err);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => smartGoBack()} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={t('a11yGoBack', 'Go back')}>
          <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('headerTitle', 'Settings')}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Privacy Banner */}
        <View style={styles.privacyBanner}>
            <View style={styles.privacyHeader}>
                <Icon name="shield-lock-outline" size={24} color={theme.colors.success} />
                <View style={styles.privacyMeta}>
                    <Text style={styles.privacyTitle}>{t('privacyTitle', 'Your Privacy, Our Priority')}</Text>
                    <Text style={styles.privacySub}>{t('privacySub', 'CoBuddy is built on a privacy-first architecture.')}</Text>
                </View>
            </View>
            <View style={styles.privacyPillars}>
                <View style={styles.pillar}>
                    <Icon name="database-lock-outline" size={16} color={theme.colors.primary} />
                    <Text style={styles.pillarText}>{t('pillar1', 'Data Sovereignty')}</Text>
                </View>
                <View style={styles.pillarDivider} />
                <View style={styles.pillar}>
                    <Icon name="incognito-circle-off" size={16} color={theme.colors.primary} />
                    <Text style={styles.pillarText}>{t('pillar2', 'Zero-Share')}</Text>
                </View>
                <View style={styles.pillarDivider} />
                <View style={styles.pillar}>
                    <Icon name="key-outline" size={16} color={theme.colors.primary} />
                    <Text style={styles.pillarText}>{t('pillar3', 'AES-256 Auth')}</Text>
                </View>
            </View>
        </View>

        {SETTING_SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.card}>
              {section.items.map((item, index) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={[styles.row, index !== section.items.length - 1 && styles.borderBottom]}
                  activeOpacity={0.7}
                  onPress={() => item.action ? item.action() : item.route ? navigation.navigate(item.route as never) : null}
                  disabled={!item.route && !item.action} accessibilityRole="button" accessibilityLabel={item.title}
                >
                  <View style={styles.iconWrap}>
                    <Icon name={item.icon} size={22} color={theme.colors.primary} />
                  </View>
                  <View style={styles.meta}>
                    <Text style={styles.title}>{item.title}</Text>
                    {item.sub ? <Text style={styles.sub}>{item.sub}</Text> : null}
                  </View>
                  {item.route ? <Icon name="chevron-right" size={20} color={theme.colors.textSecondary} /> : null}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* DEV ZONE FOR TESTING SYSTEM SCREENS — kept intentionally, remove manually before final handoff */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: theme.colors.warning}]}>{t('devZone', 'DEV ZONE (TEMPORARY)')}</Text>
          <View style={[styles.card, {borderColor: 'rgba(245, 158, 11, 0.2)'}]}>
            {DEV_TEST_SCREENS.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.row, index !== DEV_TEST_SCREENS.length - 1 && {borderBottomWidth: 1, borderBottomColor: 'rgba(245, 158, 11, 0.1)'}]}
                activeOpacity={0.7}
                onPress={() => {
                  if (item.route === 'NetworkErrorScreen' || item.route === 'ForceUpdateScreen' || item.route === 'MaintenanceModeScreen') {
                    navigation.navigate(item.route as never);
                  } else {
                    navigation.navigate('SystemStateStack', { screen: item.route as never });
                  }
                }} accessibilityRole="button" accessibilityLabel={item.title}
              >
                <View style={[styles.iconWrap, {backgroundColor: 'rgba(245, 158, 11, 0.1)'}]}>
                  <Icon name="test-tube" size={22} color={theme.colors.warning} />
                </View>
                <View style={styles.meta}>
                  <Text style={[styles.title, {color: theme.colors.warning}]}>{item.title}</Text>
                </View>
                <Icon name="chevron-right" size={20} color={theme.colors.warning} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: theme.colors.error}]}>{t('dangerZone', 'DANGER ZONE')}</Text>
          <View style={[styles.card, {borderColor: 'rgba(239, 68, 68, 0.2)'}]}>
            {DANGER_ZONE.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.row, index !== DANGER_ZONE.length - 1 && {borderBottomWidth: 1, borderBottomColor: 'rgba(239, 68, 68, 0.1)'}]}
                activeOpacity={0.7}
                onPress={() => item.action ? item.action() : item.route ? navigation.navigate(item.route as never) : null} accessibilityRole="button" accessibilityLabel={item.title}
              >
                <View style={[styles.iconWrap, {backgroundColor: 'rgba(239, 68, 68, 0.1)'}]}>
                  <Icon name={item.icon} size={22} color={theme.colors.error} />
                </View>
                <View style={styles.meta}>
                  <Text style={[styles.title, {color: theme.colors.error}]}>{item.title}</Text>
                  {item.sub ? <Text style={[styles.sub, {color: theme.colors.error, opacity: 0.7}]}>{item.sub}</Text> : null}
                </View>
                <Icon name="chevron-right" size={20} color={theme.colors.error} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.8} onPress={handleLogout} accessibilityRole="button" accessibilityLabel={t('a11yLogOut', 'Log Out')}>
          <Icon name="logout-variant" size={20} color={theme.colors.error} />
          <Text style={styles.logoutText}>{t('logOut', 'Log Out')}</Text>
        </TouchableOpacity>

        <View style={styles.footerBrand}>
            <Text style={styles.brandText}>{t('brand', 'CoBuddy')}</Text>
            <Text style={styles.copyrightText}>{t('copyright', '© 2026 CoBuddy Technologies')}</Text>
            <Text style={styles.versionText}>{t('version', 'v1.0.0 (Build 42)')}</Text>
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
  
  privacyBanner: { backgroundColor: 'rgba(16, 185, 129, 0.05)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)', padding: 16, marginBottom: 24 },
  privacyHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  privacyMeta: { flex: 1 },
  privacyTitle: { fontSize: 14, fontWeight: 'bold', color: theme.colors.success, marginBottom: 2 },
  privacySub: { fontSize: 12, color: theme.colors.textSecondary, lineHeight: 16 },
  privacyPillars: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, overflow: 'hidden' },
  pillar: { flex: 1, paddingVertical: 10, alignItems: 'center', gap: 4 },
  pillarText: { fontSize: 10, fontWeight: 'bold', color: theme.colors.textPrimary },
  pillarDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 8 },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', color: theme.colors.textSecondary, letterSpacing: 1, marginBottom: 12, marginLeft: 8 },
  card: { backgroundColor: theme.colors.surface, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  iconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(212, 175, 55, 0.1)', justifyContent: 'center', alignItems: 'center' },
  meta: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 2 },
  sub: { fontSize: 12, color: theme.colors.textSecondary },
  
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)', marginTop: 8 },
  logoutText: { fontSize: 15, fontWeight: 'bold', color: theme.colors.error },
  
  footerBrand: { alignItems: 'center', marginTop: 40, opacity: 0.5 },
  brandText: { fontSize: 14, fontWeight: 'bold', color: theme.colors.textSecondary, letterSpacing: 1 },
  copyrightText: { fontSize: 10, color: theme.colors.textSecondary, marginTop: 4 },
  versionText: { fontSize: 10, color: theme.colors.textSecondary, marginTop: 2 }
});
