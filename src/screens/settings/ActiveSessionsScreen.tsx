import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { accountApi, ActiveSession as ActiveSessionType } from '../../services/api';

interface Session {
    id: string;
    deviceName: string;
    os: string;
    location: string;
    ipAddress: string;
    lastActive: string;
    isCurrentDevice: boolean;
    deviceType: 'mobile' | 'desktop' | 'tablet';
}

const INITIAL_SESSIONS: Session[] = [
    {
        id: '1',
        deviceName: 'iPhone 15 Pro Max',
        os: 'iOS 17.4 • CoBuddy App',
        location: 'Mumbai, India',
        ipAddress: '192.168.1.45',
        lastActive: 'Active Now',
        isCurrentDevice: true,
        deviceType: 'mobile',
    },
    {
        id: '2',
        deviceName: 'MacBook Pro',
        os: 'macOS Sonoma • Chrome Browser',
        location: 'Delhi, India',
        ipAddress: '103.45.67.89',
        lastActive: 'Active 2 hours ago',
        isCurrentDevice: false,
        deviceType: 'desktop',
    },
    {
        id: '3',
        deviceName: 'Samsung Galaxy S23',
        os: 'Android 14 • CoBuddy App',
        location: 'Pune, India',
        ipAddress: '45.112.34.21',
        lastActive: 'Active 3 days ago',
        isCurrentDevice: false,
        deviceType: 'mobile',
    }
];

export const ActiveSessionsScreen = () => { 
  const { t } = useTranslation('settings.activeSessions');
  const { smartGoBack } = useSmartNavigation();
  const [sessions, setSessions] = useState<Session[]>(INITIAL_SESSIONS);

  React.useEffect(() => {
    let isMounted = true;
    accountApi.getActiveSessions().then(list => {
      if (isMounted && list && list.length > 0) {
        setSessions(list.map(s => ({
          id: s.id,
          deviceName: s.deviceInfo || 'Mobile Device',
          os: 'CoBuddy App',
          location: s.ipAddress ? `IP: ${s.ipAddress}` : 'India',
          ipAddress: s.ipAddress || '192.168.1.1',
          lastActive: s.createdAt ? new Date(s.createdAt).toLocaleTimeString() : 'Active Now',
          isCurrentDevice: s.isCurrent ?? false,
          deviceType: 'mobile' as const,
        })));
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const getDeviceIcon = (type: string) => {
      switch(type) {
          case 'desktop': return 'monitor';
          case 'tablet': return 'tablet';
          default: return 'cellphone';
      }
  };

  const handleLogoutSession = (id: string, deviceName: string) => {
      Alert.alert(
          t('logOutDeviceTitle', 'Log Out Device'),
          t('logOutDeviceMsg', 'Are you sure you want to log out from {{deviceName}}?', { deviceName }),
          [
              { text: t('cancelBtn', 'Cancel'), style: 'cancel' },
              { 
                  text: t('logOutBtn', 'Log Out'), 
                  style: 'destructive',
                  onPress: async () => {
                      setSessions(prev => prev.filter(s => s.id !== id));
                      try {
                        await accountApi.revokeSession(id);
                      } catch {
                        // Ignored
                      }
                  }
              }
          ]
      );
  };

  const handleLogoutAll = () => {
      Alert.alert(t('alertTitleLogOutAllOtherD', 'Log Out All Other Devices'), t('alertMsgYouwillbeloggedoutof', 'You will be logged out of all devices except this one. You will need to log in again on those devices.'),
          [
              { text: t('cancelBtn', 'Cancel'), style: 'cancel' },
              { 
                  text: t('logOutAllBtn', 'Log Out All'), 
                  style: 'destructive',
                  onPress: () => {
                      setSessions(prev => prev.filter(s => s.isCurrentDevice));
                  }
              }
          ]
      );
  };

  const currentDevice = sessions.find(s => s.isCurrentDevice);
  const otherDevices = sessions.filter(s => !s.isCurrentDevice);

  const renderSessionCard = (session: Session) => (
      <View key={session.id} style={[styles.sessionCard, session.isCurrentDevice && styles.currentSessionCard]}>
          <View style={styles.sessionHeader}>
              <View style={[styles.iconWrap, { backgroundColor: session.isCurrentDevice ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)' }]}>
                  <Icon name={getDeviceIcon(session.deviceType)} size={24} color={session.isCurrentDevice ? theme.colors.success : theme.colors.textPrimary} />
              </View>
              <View style={styles.sessionTextContent}>
                  <Text style={styles.deviceName} numberOfLines={1}>{session.deviceName}</Text>
                  <Text style={styles.osText} numberOfLines={1}>{session.os}</Text>
              </View>
              {session.isCurrentDevice && (
                  <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeText}>{t('thisDeviceBadge', 'THIS DEVICE')}</Text>
                  </View>
              )}
          </View>

          <View style={styles.divider} />

          <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                  <Icon name="map-marker-outline" size={14} color={theme.colors.textSecondary} />
                  <Text style={styles.detailText}>{session.location}</Text>
              </View>
              <View style={styles.detailItem}>
                  <Icon name="clock-outline" size={14} color={theme.colors.textSecondary} />
                  <Text style={[styles.detailText, session.isCurrentDevice && { color: theme.colors.success, fontWeight: '600' }]}>
                      {session.lastActive}
                  </Text>
              </View>
              <View style={styles.detailItem}>
                  <Icon name="ip-network-outline" size={14} color={theme.colors.textSecondary} />
                  <Text style={styles.detailText}>{session.ipAddress}</Text>
              </View>
          </View>

          {!session.isCurrentDevice && (
              <TouchableOpacity 
                  style={styles.logoutBtn} 
                  activeOpacity={0.7}
                  onPress={() => handleLogoutSession(session.id, session.deviceName)} accessibilityRole="button" accessibilityLabel={t('a11yLogOutDevice', 'Log Out Device')}
              >
                  <Icon name="logout" size={16} color={theme.colors.error} />
                  <Text style={styles.logoutBtnText}>{t('logOutDevice', 'Log Out Device')}</Text>
              </TouchableOpacity>
          )}
      </View>
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => smartGoBack()} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={t('a11yGoBack', 'Go back')}>
          <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('activeSessions', 'Active Sessions')}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.heroSection}>
            <View style={styles.shieldIconWrap}>
                <Icon name="devices" size={32} color={theme.colors.primary} />
            </View>
            <Text style={styles.heroTitle}>{t('manageDevices', 'Manage Devices')}</Text>
            <Text style={styles.heroSub}>{t('reviewTheListOfDevices', 'Review the list of devices where you\'re currently logged into CoBuddy. Log out of any unfamiliar devices immediately to secure your account.')}</Text>
        </View>

        {currentDevice && (
            <>
                <Text style={styles.sectionTitle}>{t('currentSession', 'CURRENT SESSION')}</Text>
                {renderSessionCard(currentDevice)}
            </>
        )}

        {otherDevices.length > 0 && (
            <>
                <Text style={styles.sectionTitle}>{t('otherDevices', 'OTHER LOGGED-IN DEVICES')}</Text>
                {otherDevices.map(renderSessionCard)}
                
                <TouchableOpacity 
                    style={styles.logoutAllBtn} 
                    activeOpacity={0.7}
                    onPress={handleLogoutAll} accessibilityRole="button" accessibilityLabel={t('a11yLogOutOfAllOtherDevices', 'Log Out of All Other Devices')}
                >
                    <Icon name="shield-alert-outline" size={20} color={theme.colors.error} />
                    <Text style={styles.logoutAllBtnText}>{t('logoutOther', 'Log Out of All Other Devices')}</Text>
                </TouchableOpacity>
            </>
        )}

        {otherDevices.length === 0 && (
            <View style={styles.secureState}>
                <Icon name="shield-check" size={48} color={theme.colors.success} style={{ opacity: 0.8, marginBottom: 12 }} />
                <Text style={styles.secureTitle}>{t('accountSecure', 'Account Secure')}</Text>
                <Text style={styles.secureSub}>{t('accountSecureSub', 'You are only logged in on this device.')}</Text>
            </View>
        )}

        <View style={styles.securityTipCard}>
            <Icon name="information-outline" size={20} color={theme.colors.textSecondary} />
            <View style={{ flex: 1 }}>
                <Text style={styles.securityTipTitle}>{t('securityTip', 'Security Tip')}</Text>
                <Text style={styles.securityTipText}>{t('ifYouSeeADevice', 'If you see a device you don\'t recognize, log it out immediately. If you suspect unauthorized access, please contact CoBuddy Support.')}</Text>
            </View>
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
  shieldIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(212,175,55,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)' },
  heroTitle: { fontSize: 22, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 8 },
  heroSub: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: 10 },

  sectionTitle: { fontSize: 11, fontWeight: 'bold', color: theme.colors.textSecondary, letterSpacing: 1, marginBottom: 12, marginTop: 24, marginLeft: 8 },
  
  sessionCard: { backgroundColor: theme.colors.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, padding: 16, marginBottom: 12 },
  currentSessionCard: { borderColor: 'rgba(16, 185, 129, 0.4)', backgroundColor: 'rgba(16, 185, 129, 0.03)' },
  
  sessionHeader: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  sessionTextContent: { flex: 1, marginRight: 12 },
  deviceName: { fontSize: 16, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 4 },
  osText: { fontSize: 12, color: theme.colors.textSecondary },
  
  currentBadge: { backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  currentBadgeText: { fontSize: 10, fontWeight: 'bold', color: theme.colors.success },

  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 14 },
  
  detailsGrid: { gap: 10 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 13, color: theme.colors.textSecondary },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, paddingVertical: 12, borderRadius: 10, backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  logoutBtnText: { fontSize: 14, fontWeight: '600', color: theme.colors.error },

  logoutAllBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 20, paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)', backgroundColor: 'rgba(239, 68, 68, 0.05)' },
  logoutAllBtnText: { fontSize: 15, fontWeight: 'bold', color: theme.colors.error },

  secureState: { alignItems: 'center', justifyContent: 'center', marginTop: 40, padding: 24, backgroundColor: 'rgba(16, 185, 129, 0.05)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.1)' },
  secureTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.success, marginBottom: 8 },
  secureSub: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center' },

  securityTipCard: { flexDirection: 'row', gap: 12, backgroundColor: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 12, marginTop: 32 },
  securityTipTitle: { fontSize: 13, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 4 },
  securityTipText: { fontSize: 12, color: theme.colors.textSecondary, lineHeight: 18 }
});
