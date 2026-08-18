import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Animated, Easing, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { isFeatureEnabled } from '../../config/featureFlags';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafetyStore } from '../../store/slices/safetyStore';
import { selectIsSOSActive, selectTriggerSOS, selectResolveSOS, selectIsSessionActive, selectLastKnownLocation } from '../../store/selectors/safetySelectors';
import { safetyApi } from '../../services/api';


export const SafetyHubScreen = () => { 
  const { t } = useTranslation('safety.hub');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { smartGoBack } = useSmartNavigation();
  
  // Animation for the SOS pulse rings
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    ).start();
  }, [pulseAnim]);

  const ring1Scale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.8] });
  const ring1Opacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });
  
  const ring2Scale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 2.4] });
  const ring2Opacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] });

  const isSOSActive = useSafetyStore(selectIsSOSActive);
  const activeSosId = useSafetyStore((s) => s.activeSosId);
  const triggerSOS = useSafetyStore(selectTriggerSOS);
  const resolveSOS = useSafetyStore(selectResolveSOS);
  const isSessionActive = useSafetyStore(selectIsSessionActive);
  const lastKnownLocation = useSafetyStore(selectLastKnownLocation);
  const setSessionActive = useSafetyStore((state) => state.setSessionActive);
  const updateLocation = useSafetyStore((state) => state.updateLocation);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isSessionActive) {
      interval = setInterval(() => {
        const lat = 37.7749 + (Math.random() - 0.5) * 0.01;
        const lng = -122.4194 + (Math.random() - 0.5) * 0.01;
        updateLocation(lat, lng);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isSessionActive, updateLocation]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => smartGoBack()} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={t('a11yGoBack', 'Go back')}>
          <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('headerTitle', 'Safety Hub')}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => { const nav = navigation as unknown as { navigate: (route: string, params?: unknown) => void }; nav.navigate('MainTabNavigator', { screen: 'ProfileTab', params: { screen: 'SafetySettingsScreen', initial: false } }); }} accessibilityRole="button" accessibilityLabel={t('a11ySettings', 'Settings')}>
          <Icon name="cog-outline" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Status Pill */}
        <View style={styles.statusWrapper}>
            <View style={[styles.statusPill, !isSessionActive && styles.statusPillInactive]}>
                <View style={[styles.statusDot, !isSessionActive && styles.statusDotInactive]} />
                <Text style={[styles.statusText, !isSessionActive && styles.statusTextInactive]}>{isSessionActive ? t('statusText', 'Live Protection Active') : t('statusInactive', 'Live Protection Inactive')}</Text>
            </View>
            {isSessionActive && lastKnownLocation && isFeatureEnabled('ENABLE_SOS_BACKGROUND_TRACKING') && (
              <Text style={styles.locationText}>{t('mockGps', 'Mock GPS')}: {lastKnownLocation.lat.toFixed(4)}, {lastKnownLocation.lng.toFixed(4)}</Text>
            )}
        </View>

        {/* Hero SOS Section */}
        <View style={styles.heroSection}>
            <View style={styles.sosContainer}>
                {/* Animated Rings */}
                <Animated.View style={[styles.pulseRing, { transform: [{ scale: ring2Scale }], opacity: ring2Opacity }]} />
                <Animated.View style={[styles.pulseRing, { transform: [{ scale: ring1Scale }], opacity: ring1Opacity }]} />
                
                {/* Main SOS Button */}
                <TouchableOpacity 
                    style={[styles.sosButton, isSOSActive && styles.sosButtonActive]} 
                    activeOpacity={0.9}
                    onPress={() => {
                        if (isSOSActive) {
                            Alert.alert(t('alertTitleCancelSOS', 'Cancel SOS'), t('alertMsgAreYouSureYouWantToCancel', 'Are you sure you want to cancel the SOS?'), [
                                { text: t('no', 'No'), style: 'cancel' },
                                { 
                                  text: t('yesSafe', 'Yes, I am safe'), 
                                  onPress: async () => {
                                    const sosId = activeSosId;
                                    resolveSOS();
                                    try {
                                      if (sosId) {
                                        await safetyApi.resolveSOS(sosId);
                                      }
                                    } catch {}
                                  } 
                                }
                            ]);
                        } else {
                            Alert.alert(t('alertTitleEMERGENCYSOS', '🚨 EMERGENCY SOS'), t('alertMsgAreyouindangerThiswi', 'Are you in danger? This will instantly share your live location with your trusted contacts and alert the CoBuddy Safety Team.'),
                              [
                                { text: t('cancel', 'Cancel'), style: 'cancel' },
                                { 
                                  text: t('activateSOS', 'ACTIVATE SOS'), 
                                  style: 'destructive',
                                  onPress: async () => {
                                    try {
                                      const res = await safetyApi.triggerSOS(
                                        undefined,
                                        lastKnownLocation?.lat,
                                        lastKnownLocation?.lng,
                                      );
                                      triggerSOS((res as any)?.sosId || (res as any)?.id);
                                    } catch {
                                      triggerSOS();
                                    }
                                    Alert.alert(t('alertTitleSOSActivated', 'SOS Activated'), t('alertMsgHelpisonthewayYourli', 'Help is on the way. Your live location is now being shared.'));
                                  }
                                }
                              ]
                            );
                        }
                    }} accessibilityRole="button" accessibilityLabel={t('a11yActivateSOS', 'Activate SOS emergency alert')}
                >
                    <View style={[styles.sosButtonInner, isSOSActive && styles.sosButtonInnerActive]}>
                        <Icon name={isSOSActive ? "shield-check" : "shield-alert"} size={42} color={theme.colors.background} />
                        <Text style={styles.sosButtonText}>{isSOSActive ? t('sosBtnSafe', 'SAFE') : t('sosBtn', 'SOS')}</Text>
                    </View>
                </TouchableOpacity>
            </View>
            <Text style={styles.sosSubtitle}>{t('sosSub', 'Press and hold in an emergency')}</Text>
        </View>

        {/* Quick Actions (Premium Wide Cards) */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('quickActions', 'QUICK ACTIONS')}</Text>
        </View>

        <TouchableOpacity 
            style={styles.premiumCard} 
            activeOpacity={0.7}
            onPress={() => setSessionActive(!isSessionActive)} accessibilityRole="button" accessibilityLabel={t('a11yToggle', 'Toggle')}
        >
            <View style={[styles.cardIconBox, { backgroundColor: isSessionActive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(156, 163, 175, 0.1)' }]}>
                <Icon name={isSessionActive ? "radar" : "radar-off"} size={24} color={isSessionActive ? theme.colors.success : theme.colors.textSecondary} />
            </View>
            <View style={styles.cardTextContent}>
                <Text style={styles.cardTitle}>{isSessionActive ? t('stopLiveSession', 'Stop Live Session') : t('startLiveSession', 'Start Live Session (Mock)')}</Text>
                <Text style={styles.cardDesc}>{t('safety.toggleLocationMock', 'Toggle background location service mocking.')}</Text>
            </View>
            <Icon name="chevron-right" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity 
            style={styles.premiumCard} 
            activeOpacity={0.7}
            onPress={() => navigation.navigate('TrustedContactsScreen', { fromSettings: true })} accessibilityRole="button" accessibilityLabel={t('a11yManageTrustedContacts', 'Manage trusted contacts')}
        >
            <View style={[styles.cardIconBox, { backgroundColor: 'rgba(212,175,55,0.1)' }]}>
                <Icon name="account-group" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.cardTextContent}>
                <Text style={styles.cardTitle}>{t('trustedContacts', 'Trusted Contacts')}</Text>
                <Text style={styles.cardDesc}>{t('trustedContactsSub', 'Manage who receives your live location and emergency alerts.')}</Text>
            </View>
            <Icon name="chevron-right" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity 
            style={styles.premiumCard} 
            activeOpacity={0.7}
            onPress={() => navigation.navigate('IncidentReportScreen')} accessibilityRole="button" accessibilityLabel={t('a11yReportIncident', 'Report a safety incident')}
        >
            <View style={[styles.cardIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                <Icon name="alert-octagon" size={24} color={theme.colors.error} />
            </View>
            <View style={styles.cardTextContent}>
                <Text style={styles.cardTitle}>{t('reportIncident', 'Report an Incident')}</Text>
                <Text style={styles.cardDesc}>{t('reportIncidentSub', 'Report inappropriate behavior, fake profiles, or no-shows.')}</Text>
            </View>
            <Icon name="chevron-right" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        {/* Resources Menu */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('resources', 'RESOURCES')}</Text>
        </View>

        <View style={styles.menuList}>
            <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={() => navigation.navigate('SafetyGuidelinesScreen')} accessibilityRole="button" accessibilityLabel={t('a11yViewSafetyGuidelines', 'View safety guidelines')}>
                <View style={[styles.menuIconBox, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                    <Icon name="book-open-page-variant" size={20} color={theme.colors.textPrimary} />
                </View>
                <View style={styles.menuTextContent}>
                    <Text style={styles.menuTitle}>{t('safetyGuidelines', 'Safety Guidelines')}</Text>
                </View>
                <Icon name="chevron-right" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            
            <View style={styles.divider} />

            <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={() => navigation.navigate('HelpCenterScreen')} accessibilityRole="button" accessibilityLabel={t('a11yOpenHelpCenter', 'Open help center')}>
                <View style={[styles.menuIconBox, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                    <Icon name="headset" size={20} color={theme.colors.textPrimary} />
                </View>
                <View style={styles.menuTextContent}>
                    <Text style={styles.menuTitle}>{t('support247', '24/7 Safety Support')}</Text>
                </View>
                <Icon name="chevron-right" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.textPrimary },
  
  scrollContent: { paddingHorizontal: 20, paddingBottom: 50 },

  statusWrapper: { alignItems: 'center', marginTop: 16, marginBottom: 20 },
  statusPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(34, 197, 94, 0.1)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.2)' },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.success, marginRight: 8, shadowColor: theme.colors.success, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4 },
  statusText: { fontSize: 12, fontWeight: 'bold', color: theme.colors.success, letterSpacing: 0.5 },
  statusPillInactive: { backgroundColor: 'rgba(156, 163, 175, 0.1)', borderColor: 'rgba(156, 163, 175, 0.2)' },
  statusDotInactive: { backgroundColor: theme.colors.textSecondary, shadowOpacity: 0 },
  statusTextInactive: { color: theme.colors.textSecondary },
  locationText: { fontSize: 10, color: theme.colors.textSecondary, marginTop: 4 },
  sosButtonActive: { backgroundColor: theme.colors.success, shadowColor: theme.colors.success },
  sosButtonInnerActive: { borderColor: 'rgba(255,255,255,0.4)' },

  heroSection: { alignItems: 'center', paddingVertical: 30, marginBottom: 20 },
  sosContainer: { width: 160, height: 160, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  pulseRing: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: theme.colors.error },
  
  sosButton: { 
      width: 140, height: 140, borderRadius: 70, 
      backgroundColor: theme.colors.error, 
      justifyContent: 'center', alignItems: 'center', 
      shadowColor: theme.colors.error, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 15, elevation: 12 
  },
  sosButtonInner: { 
      width: 124, height: 124, borderRadius: 62, 
      borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', 
      justifyContent: 'center', alignItems: 'center' 
  },
  sosButtonText: { fontSize: 24, fontWeight: '900', color: theme.colors.background, marginTop: 4, letterSpacing: 2 },
  sosSubtitle: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 28, letterSpacing: 0.5, fontWeight: '500' },

  sectionHeader: { marginBottom: 12, marginTop: 16, paddingLeft: 4 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', color: theme.colors.textSecondary, letterSpacing: 1.5 },
  
  premiumCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border },
  cardIconBox: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  cardTextContent: { flex: 1, marginRight: 12 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 4 },
  cardDesc: { fontSize: 13, color: theme.colors.textSecondary, lineHeight: 18 },

  menuList: { backgroundColor: theme.colors.surface, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  menuIconBox: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  menuTextContent: { flex: 1 },
  menuTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.textPrimary },
  divider: { height: 1, backgroundColor: theme.colors.border, marginLeft: 66 }
});
