import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { sessionApi, bookingApi } from '../../services/api';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export const ArrivalCheckInScreen = () => { 
  const { t } = useTranslation('session.arrival');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { smartGoBack } = useSmartNavigation();
  const route = useRoute<any>();
  const { companionId, companionName, bookingId } = route.params || {};
  const [hasArrived, setHasArrived] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isRefreshingSession, setIsRefreshingSession] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<string | null>(null);
  const [customerSessionId, setCustomerSessionId] = useState<string | undefined>(undefined);
  const [passCode, setPassCode] = useState('');
  const [venueName, setVenueName] = useState<string>(route?.params?.venueName || '');

  React.useEffect(() => {
    let isMounted = true;
    const loadSession = async () => {
      if (!bookingId) return;
      const [sessionResult, bookingResult] = await Promise.allSettled([
        sessionApi.getCurrentSession(),
        bookingApi.getBooking(bookingId),
      ]);
      if (!isMounted) return;
      if (bookingResult.status === 'fulfilled') {
        const booking = bookingResult.value;
        setVenueName(booking?.venueName || booking?.venue?.name || 'Venue details unavailable');
      }
      if (sessionResult.status === 'fulfilled') {
        const session = sessionResult.value;
        if (session && session.bookingId === bookingId && session.passCode) {
          setPassCode(session.passCode);
          setCustomerSessionId(session.id);
          setSessionStatus(session.status);
          setHasArrived(['checked_in', 'active', 'extending'].includes(session.status));
        }
      }
    };
    loadSession();
    return () => { isMounted = false; };
  }, [bookingId]);

  // ── Auto-transition to ActiveSessionScreen when companion starts session ──
  useEffect(() => {
    if (sessionStatus === 'active' || sessionStatus === 'extending') {
      navigation.replace('ActiveSessionScreen', {
        bookingId,
        companionId,
        companionName,
        sessionId: customerSessionId,
      });
    }
  }, [sessionStatus, customerSessionId, bookingId, companionId, companionName, navigation]);

  // ── Background Live Polling: Instantly detect session start ────────────────
  useEffect(() => {
    if (!hasArrived || !bookingId) return;
    const pollId = setInterval(async () => {
      try {
        const session = await sessionApi.getCurrentSession();
        if (session && (session.status === 'active' || session.status === 'extending')) {
          setSessionStatus(session.status);
          setCustomerSessionId(session.id);
        }
      } catch {}
    }, 1000);
    return () => clearInterval(pollId);
  }, [hasArrived, bookingId]);

  const refreshSessionStatus = async () => {
    if (isRefreshingSession || !bookingId) return;
    setIsRefreshingSession(true);
    try {
      const session = await sessionApi.getCurrentSession();
      if (!session || session.bookingId !== bookingId) {
        setSessionStatus(null);
        return;
      }
      setCustomerSessionId(session.id);
      setSessionStatus(session.status);
      if (session.passCode) setPassCode(session.passCode);
      setHasArrived(['checked_in', 'active', 'extending'].includes(session.status));
    } catch {
      Alert.alert('Session status unavailable', 'The Customer Backend could not refresh the session status. Try again when connected.');
    } finally {
      setIsRefreshingSession(false);
    }
  };

  const handleCheckIn = async () => {
    if (!bookingId) {
      Alert.alert('Check-in unavailable', 'A booking identifier is required. No arrival was recorded.');
      return;
    }
    setIsLocating(true);
    try {
      const result = await sessionApi.checkIn(bookingId);
      if (result.bookingId !== bookingId || !result.passCode || !['checked_in', 'active', 'extending'].includes(result.status)) {
        throw new Error('The Customer Backend did not confirm check-in.');
      }
      setPassCode(result.passCode);
      setCustomerSessionId(result.id);
      setSessionStatus(result.status);
      setHasArrived(true);
    } catch {
      Alert.alert('Check-in failed', 'The server did not confirm your arrival. Please retry.');
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => smartGoBack()} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel={t('a11yGoBack', 'Go back')}>
          <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('headerTitle', 'Meetup Day')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.venueInfo}>
          <Icon name="map-marker" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.venueText}>{t('venuePrefix', 'Meeting at ')}<Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>{venueName || t('venue.unavailable', 'Venue details unavailable')}</Text></Text>
        </View>

        {!hasArrived ? (
          /* STATE 1: Pre-Arrival */
          <View style={styles.preArrivalCard}>
            <View style={styles.mapPlaceholder}>
              <Icon name="map-marker-radius" size={48} color={theme.colors.primary} />
              <Text style={{color: theme.colors.textSecondary, marginTop: 12}}>{t('gpsUnavailable', 'Live location is not shared by this build')}</Text>
            </View>
            <Text style={styles.otpTitle}>{t('otpTitle1', 'Are you at the venue?')}</Text>
            <Text style={styles.otpDesc}>{t('otpDesc1', 'Confirm your arrival to record check-in and display the session pass code. This app build does not share your live location.')}</Text>
            
            <TouchableOpacity 
              style={[styles.primaryBtn, { width: '100%' }, isLocating && { opacity: 0.7 }]} 
              onPress={handleCheckIn}
              disabled={isLocating} accessibilityRole="button" accessibilityLabel={t('a11yCheckIn', 'Check in at the venue')}
            >
              {isLocating ? (
                <ActivityIndicator color={theme.colors.background} />
              ) : (
                <Text style={styles.primaryBtnText}>{t('checkInBtn', 'I\'m at the Venue (Check-In)')}</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          /* STATE 2: OTP Revealed */
          <View style={styles.otpCard}>
            <View style={styles.iconCircle}>
              <Icon name="shield-check" size={32} color={theme.colors.primary} />
            </View>
            <Text style={styles.otpTitle}>{t('otpTitle2', 'Session pass code')}</Text>
            <Text style={styles.otpDesc}>{t('otpSharePrefix', 'Share this server-issued code in person with ')}<Text style={{ color: theme.colors.textPrimary, fontWeight: 'bold' }}>{companionName || 'your companion'}</Text>{t('otpShareSuffix', ' to verify the session start in the Companion app.')}</Text>
            
            <View style={styles.codeBox}>
              {passCode.split('').map((digit, index) => (
                <View key={index} style={styles.digitBox}>
                  <Text style={styles.digitText}>{digit}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.warningText}>
              {t('arrival.neverShareOtp', 'Never share this OTP over phone or chat. Only share it in person when you meet.')} 
              {"\n\n"}{t('arrival.shareCodeWarning', 'This code verifies the session start. It does not initiate or release a payment.')}
            </Text>
            {sessionStatus !== 'active' && sessionStatus !== 'extending' ? (
              <View style={{ alignItems: 'center', gap: 12, marginTop: 16 }}>
                <Text style={styles.warningText}>The companion must verify this code before the Customer Backend records an active session.</Text>
                <TouchableOpacity onPress={refreshSessionStatus} disabled={isRefreshingSession} accessibilityRole="button">
                  {isRefreshingSession ? <ActivityIndicator color={theme.colors.primary} /> : <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>Refresh session status</Text>}
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        )}

        {/* Quick Communication */}
        <View style={styles.commCard}>
          <Text style={styles.commTitle}>{t('commTitle', 'Can\'t find your companion?')}</Text>
          <View style={styles.commRow}>
            <TouchableOpacity style={styles.commBtn} onPress={() => {
              Alert.alert(t('secureCallTitle', 'Secure Call'), t('secureCallMsg', 'This feature requires a telephony backend integration (e.g., Twilio/Exotel) to mask numbers, which is not yet implemented.'));
            }} accessibilityRole="button" accessibilityLabel={t('a11yCallSecurely', 'Call Securely')}>
              <Icon name="phone" size={20} color={theme.colors.primary} />
              <Text style={styles.commBtnText}>{t('commCall', 'Call Securely')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.commBtn} onPress={() => {
              const nav = navigation as unknown as { navigate: (route: string, params?: unknown) => void };
              nav.navigate('MainTabNavigator', {
                screen: 'ChatTab',
                params: { screen: 'CompanionChatScreen', initial: false, params: { companionName: companionName, companionId: companionId } }
              });
            }} accessibilityRole="button" accessibilityLabel={t('a11yMessage', 'Message')}>
              <Icon name="chat" size={20} color={theme.colors.primary} />
              <Text style={styles.commBtnText}>{t('commMessage', 'Message')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Safety Issue Link */}
        <TouchableOpacity 
          style={styles.reportBtn} 
          onPress={() => navigation.navigate('SafetySupportStack', { screen: 'IncidentReportScreen', params: { companionName: companionName } })} accessibilityRole="button" accessibilityLabel={t('a11yCompanionDidntShowUp', "Companion didn't show up")}
        >
          <Icon name="alert-circle-outline" size={16} color={theme.colors.error} />
          <Text style={styles.reportText}>{t('reportText', "Companion didn't show up or looks different? Report Issue")}</Text>
        </TouchableOpacity>

      </ScrollView>

      {hasArrived && (sessionStatus === 'active' || sessionStatus === 'extending') && (
        <View style={styles.bottomBar}>
          <TouchableOpacity 
            style={styles.primaryBtn} 
            onPress={() => navigation.navigate('ActiveSessionScreen', { companionId, companionName, sessionId: customerSessionId || undefined })} accessibilityRole="button" accessibilityLabel={t('a11yContinueToActiveSession', 'Continue to Active Session')}
          >
            <Text style={styles.primaryBtnText}>{t('continueSession', 'Continue to Active Session')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16 },
  iconBtn: { padding: 8, backgroundColor: theme.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: theme.colors.textPrimary },
  
  content: { padding: 20, paddingBottom: 40, flexGrow: 1, justifyContent: 'center' },
  
  venueInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 12 },
  venueText: { color: theme.colors.textSecondary, fontSize: 14 },

  preArrivalCard: { backgroundColor: theme.colors.surface, borderRadius: 24, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border, marginBottom: 24 },
  mapPlaceholder: { width: '100%', height: 160, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: theme.colors.border, borderStyle: 'dashed' },

  otpCard: { backgroundColor: theme.colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.2)', shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10, marginBottom: 24 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(212, 175, 55, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  otpTitle: { fontSize: 20, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 8 },
  otpDesc: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  
  codeBox: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  digitBox: { width: 56, height: 64, backgroundColor: theme.colors.background, borderRadius: 12, borderWidth: 2, borderColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
  digitText: { fontSize: 32, fontWeight: '900', color: theme.colors.primary },
  
  warningText: { fontSize: 12, color: theme.colors.error, textAlign: 'center', lineHeight: 18, opacity: 0.9 },

  commCard: { backgroundColor: theme.colors.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 24 },
  commTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 16, textAlign: 'center' },
  commRow: { flexDirection: 'row', gap: 12 },
  commBtn: { flex: 1, flexDirection: 'row', height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: theme.colors.border },
  commBtnText: { fontSize: 14, fontWeight: '600', color: theme.colors.primary },

  reportBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: 12 },
  reportText: { fontSize: 13, color: theme.colors.error, fontWeight: '500', textDecorationLine: 'underline' },

  bottomBar: { padding: 20, paddingBottom: 32, backgroundColor: theme.colors.surface, borderTopWidth: 1, borderTopColor: theme.colors.border },
  primaryBtn: { width: '100%', backgroundColor: theme.colors.primary, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: theme.colors.background, fontSize: 15, fontWeight: 'bold' },
});
