import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

const CapabilityStatus = ({ label }: { label: string }) => (
  <Text style={styles.capabilityStatus}>{label}</Text>
);

export const SafetySettingsScreen = () => { 
  const { t } = useTranslation('safety.settings');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { smartGoBack } = useSmartNavigation();
  
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => smartGoBack()} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={t('a11yGoBack', 'Go back')}>
          <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('headerTitle', 'Safety Center')}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.heroSection}>
            <View style={styles.iconWrap}>
                <Icon name="shield-star" size={40} color={theme.colors.primary} />
            </View>
            <Text style={styles.heroTitle}>{t('heroTitle', 'Your Safety First')}</Text>
            <Text style={styles.heroSub}>{t('customizeYourPrivacyAndSafety', 'Customize your privacy and safety preferences to ensure a secure and comfortable experience on CoBuddy.')}</Text>
        </View>

        <Text style={styles.sectionTitle}>{t('profileVisibility', 'PROFILE VISIBILITY')}</Text>
        
        <View style={styles.card}>
            <View style={styles.settingRow}>
                <View style={styles.iconBox}>
                    <Icon name="incognito" size={20} color={theme.colors.textSecondary} />
                </View>
                <View style={styles.settingTextContent}>
                    <Text style={styles.settingTitle}>{t('incognitoMode', 'Profile Visibility Controls')}</Text>
                    <Text style={styles.settingDesc}>{t('incognitoModeSub', 'Profile visibility controls are not configured in this app build.')}</Text>
                </View>
                <CapabilityStatus label={t('unavailable', 'Unavailable')} />
            </View>
        </View>

        <Text style={styles.sectionTitle}>{t('interactionsChat', 'INTERACTIONS & CHAT')}</Text>
        
        <View style={styles.card}>
            <View style={styles.settingRow}>
                <View style={styles.iconBox}>
                    <Icon name="message-alert-outline" size={20} color={theme.colors.textSecondary} />
                </View>
                <View style={styles.settingTextContent}>
                    <Text style={styles.settingTitle}>{t('safeChat', 'Safe Chat Filter')}</Text>
                    <Text style={styles.settingDesc}>{t('safeChatSub', 'Automatic image blurring and message filtering are not configured in this app build.')}</Text>
                </View>
                <CapabilityStatus label={t('unavailable', 'Unavailable')} />
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.settingRow}>
                <View style={styles.iconBox}>
                    <Icon name="check-decagram-outline" size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.settingTextContent}>
                    <Text style={styles.settingTitle}>{t('verifiedUsers', 'Approved Companion Profiles')}</Text>
                    <Text style={styles.settingDesc}>{t('verifiedUsersSub', 'Discovery returns only active companion profiles approved and published by the Companion service.')}</Text>
                </View>
                <CapabilityStatus label={t('serviceEnforced', 'Service enforced')} />
            </View>
        </View>

        <Text style={styles.sectionTitle}>{t('emergencyFeatures', 'EMERGENCY FEATURES')}</Text>

        <View style={styles.card}>
            <TouchableOpacity 
                style={styles.actionRow} 
                activeOpacity={0.7} 
                onPress={() => navigation.navigate('SafetySupportStack', { screen: 'TrustedContactsScreen', params: { fromSettings: true } })} accessibilityRole="button" accessibilityLabel={t('a11yTrustedContacts', 'Manage trusted contacts')}
            >
                <View style={[styles.iconBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                    <Icon name="car-emergency" size={20} color={theme.colors.error} />
                </View>
                <View style={styles.settingTextContent}>
                    <Text style={styles.settingTitle}>{t('emergencyContacts', 'Emergency Contacts (SOS)')}</Text>
                    <Text style={styles.settingDesc}>{t('emergencyContactsSub', 'Save up to 3 contacts for reference. This build does not send them location or SOS messages.')}</Text>
                </View>
                <Icon name="chevron-right" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>{t('liveSafety', 'LIVE SAFETY MONITORING')}</Text>

        <View style={styles.card}>
            <View style={styles.settingRow}>
                <View style={styles.iconBox}>
                    <Icon name="share-variant-outline" size={20} color={theme.colors.textSecondary} />
                </View>
                <View style={styles.settingTextContent}>
                    <Text style={styles.settingTitle}>{t('contactSharing', 'Trusted Contact Sharing')}</Text>
                    <Text style={styles.settingDesc}>{t('contactSharingSub', 'External contact sharing is not configured in this build.')}</Text>
                </View>
                <CapabilityStatus label={t('unavailable', 'Unavailable')} />
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.settingRow}>
                <View style={styles.iconBox}>
                    <Icon name="radar" size={20} color={theme.colors.textSecondary} />
                </View>
                <View style={styles.settingTextContent}>
                    <Text style={styles.settingTitle}>{t('liveMonitoring', 'Live Safety Monitoring')}</Text>
                    <Text style={styles.settingDesc}>{t('liveMonitoringSub', 'Live session tracking and anomaly detection are not configured in this build.')}</Text>
                </View>
                <CapabilityStatus label={t('unavailable', 'Unavailable')} />
            </View>
        </View>

        <TouchableOpacity 
            style={styles.hubBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('SafetySupportStack', { screen: 'SafetyHubScreen' })} accessibilityRole="button" accessibilityLabel={t('a11yOpenSafetyHub', 'Open Safety Hub')}
        >
            <Icon name="security" size={18} color={theme.colors.background} />
            <Text style={styles.hubBtnText}>{t('openSafetyHub', 'Open Safety Hub')}</Text>
            <Icon name="arrow-right" size={20} color={theme.colors.background} />
        </TouchableOpacity>

        <View style={styles.footerNote}>
            <Icon name="lock-check-outline" size={16} color={theme.colors.success} />
            <Text style={styles.footerText}>{t('cobuddyActivelyMonitorsReportsTo', 'Safety reports can be recorded. Live monitoring and external emergency dispatch are not configured in this build.')}</Text>
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

  sectionTitle: { fontSize: 11, fontWeight: 'bold', color: theme.colors.textSecondary, letterSpacing: 1, marginBottom: 12, marginTop: 24, marginLeft: 8 },
  
  card: { backgroundColor: theme.colors.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, padding: 16 },
  
  settingRow: { flexDirection: 'row', alignItems: 'center' },
  actionRow: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  settingTextContent: { flex: 1, marginRight: 12 },
  settingTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 4 },
  settingDesc: { fontSize: 13, color: theme.colors.textSecondary, lineHeight: 18 },

  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 16 },

  capabilityStatus: { color: theme.colors.textSecondary, fontSize: 11, fontWeight: '600', textAlign: 'right', maxWidth: 94 },

  hubBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.colors.primary, borderRadius: 20, paddingVertical: 14, paddingHorizontal: 16, marginTop: 12 },
  hubBtnText: { fontSize: 15, fontWeight: 'bold', color: theme.colors.background },

  footerNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 40, paddingHorizontal: 20, opacity: 0.8 },
  footerText: { fontSize: 12, color: theme.colors.success, lineHeight: 18, textAlign: 'center' }
});
