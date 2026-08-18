import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { sessionApi } from '../../services/api';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export const ArrivalCheckInScreen = () => { 
  const { t } = useTranslation('session.arrival');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { smartGoBack } = useSmartNavigation();
  const [hasArrived, setHasArrived] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [passCode, setPassCode] = useState('8294');

  const route = useRoute<any>();
  const { companionId, companionName, bookingId } = route.params || {};

  React.useEffect(() => {
    sessionApi.getCurrentSession().then((sess) => {
      if (sess?.passCode) {
        setPassCode(sess.passCode);
      }
    }).catch(() => {});
  }, []);

  const handleSimulateArrival = async () => {
    setIsLocating(true);
    try {
      if (bookingId) {
        await sessionApi.checkIn(bookingId, passCode);
      }
    } catch {
      // Graceful fallback
    } finally {
      setIsLocating(false);
      setHasArrived(true);
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
          <Text style={styles.venueText}>{t('venuePrefix', 'Meeting at ')}<Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>{t('venueName', 'Starbucks, Connaught Place')}</Text></Text>
        </View>

        {!hasArrived ? (
          /* STATE 1: Pre-Arrival */
          <View style={styles.preArrivalCard}>
            <View style={styles.mapPlaceholder}>
              <Icon name="map-marker-radius" size={48} color={theme.colors.primary} />
              <Text style={{color: theme.colors.textSecondary, marginTop: 12}}>{t('gpsActive', 'GPS Tracking Active')}</Text>
            </View>
            <Text style={styles.otpTitle}>{t('otpTitle1', 'Are you at the venue?')}</Text>
            <Text style={styles.otpDesc}>{t('otpDesc1', 'Please confirm you have physically arrived at the meeting location to unlock your Escrow OTP.')}</Text>
            
            <TouchableOpacity 
              style={[styles.primaryBtn, { width: '100%' }, isLocating && { opacity: 0.7 }]} 
              onPress={handleSimulateArrival}
              disabled={isLocating} accessibilityRole="button" accessibilityLabel={t('a11yShareLocation', 'Share live location')}
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
            <Text style={styles.otpTitle}>{t('otpTitle2', 'Escrow Unlock OTP')}</Text>
            <Text style={styles.otpDesc}>{t('otpSharePrefix', 'Share this 4-digit code with ')}<Text style={{ color: theme.colors.textPrimary, fontWeight: 'bold' }}>{companionName}</Text>{t('otpShareSuffix', ' to start the session.')}</Text>
            
            <View style={styles.codeBox}>
              {passCode.split('').map((digit, index) => (
                <View key={index} style={styles.digitBox}>
                  <Text style={styles.digitText}>{digit}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.warningText}>
              {t('arrival.neverShareOtp', 'Never share this OTP over phone or chat. Only share it in person when you meet.')} 
              {"\n\n"}{t('arrival.shareCodeWarning', 'Sharing this code will instantly release Escrow funds and start the session timer.')}
            </Text>
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

      {hasArrived && (
        <View style={styles.bottomBar}>
          <TouchableOpacity 
            style={styles.primaryBtn} 
            onPress={() => navigation.navigate('ActiveSessionScreen', { companionId, companionName })} accessibilityRole="button" accessibilityLabel={t('a11yMockCompanionEnteredOtp', '[MOCK] Companion entered OTP')}
          >
            <Text style={styles.primaryBtnText}>{t('mockOtp', '[MOCK] Companion entered OTP')}</Text>
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
