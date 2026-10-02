import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { bookingApi } from '../../services/api';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export const SessionReminderScreen = () => { 
  const { t } = useTranslation('session.reminder');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { smartGoBack } = useSmartNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'SessionReminderScreen'>>();

  const [companionName, setCompanionName] = useState(route.params?.companionName || '');
  const [sessionTime, setSessionTime] = useState(route.params?.time || '');
  const [venue, setVenue] = useState(route.params?.venue || '');

  useEffect(() => {
    const bookingId = route.params?.bookingId;
    if (bookingId && (!companionName || !sessionTime)) {
      bookingApi.getBookingById(bookingId).then((b: any) => {
        if (b) {
          setCompanionName(prev => prev || b.companion?.name || b.companionName || '');
          setSessionTime(prev => prev || (b.date && b.time ? `${b.date}, ${b.time}` : b.scheduledAt || ''));
          setVenue(prev => prev || b.location || b.venue || '');
        }
      }).catch(() => {});
    }
  }, [route.params?.bookingId]);

    const SAFETY_TIPS = [
    { icon: 'shield-account-outline', text: t('safetyTip.public', 'Meet in a public place with good lighting.') },
    { icon: 'account-cancel-outline', text: t('safetyTip.personal', 'Do not share your personal address or last name.') },
    { icon: 'cellphone-check', text: t('safetyTip.phone', 'Keep your phone charged and handy.') },
    { icon: 'account-group-outline', text: t('safetyTip.boundaries', 'Respect boundaries and CoBuddy etiquette.') },
  ];

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => smartGoBack()} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel={t('a11yGoBack', 'Go back')}>
          <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('headerTitle', 'Meetup Reminder')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.alertBox}>
          <Icon name="clock-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.alertText}>{t('alertPrefix', 'Your session with ')}{companionName || t('yourCompanion', 'your companion')}{t('alertMid', ' starts in ')}<Text style={{fontWeight: 'bold', color: theme.colors.textPrimary}}>{t('alertHours', '2 hours')}</Text>{t('alertSuffix', '.')}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('cardTitle', 'Meetup Details')}</Text>
          <View style={styles.detailRow}>
            <View style={styles.iconCircleSm}>
              <Icon name="calendar-clock" size={16} color={theme.colors.primary} />
            </View>
            <Text style={styles.detailText}>{sessionTime || t('timeNotSet', 'Time TBD')}</Text>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.iconCircleSm}>
              <Icon name="map-marker" size={16} color={theme.colors.primary} />
            </View>
            <Text style={styles.detailText}>{venue || t('venueNotSet', 'Venue TBD')}</Text>
          </View>
          
          <View style={styles.mapPlaceholder}>
            <Icon name="map-outline" size={40} color={theme.colors.textSecondary} />
            <Text style={{color: theme.colors.textSecondary, marginTop: 8}}>{t('mapPlaceholder', 'Map View Placeholder')}</Text>
          </View>

          <TouchableOpacity style={styles.secondaryBtn} accessibilityRole="button" accessibilityLabel={t('a11yGetDirections', 'Get Directions')}>
            <Icon name="directions" size={18} color={theme.colors.primary} />
            <Text style={styles.secondaryBtnText}>{t('getDirections', 'Get Directions')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>{t('safetyTitle', 'Safety Checklist')}</Text>
        <View style={styles.safetyCard}>
          {SAFETY_TIPS.map((tip, index) => (
            <View key={index} style={styles.safetyRow}>
              <Icon name={tip.icon} size={20} color={theme.colors.textSecondary} />
              <Text style={styles.safetyText}>{tip.text}</Text>
            </View>
          ))}
        </View>

      </ScrollView>

      <View style={styles.bottomBar}>
        <Text style={styles.bottomHint}>{t('bottomHint', 'Only confirm arrival when you are physically at the venue.')}</Text>
        <TouchableOpacity 
          style={styles.primaryBtn} 
          onPress={() => navigation.navigate('ArrivalCheckInScreen')} accessibilityRole="button" accessibilityLabel={t('a11ySimulateArrivalAtVenue', 'Simulate Arrival at Venue')}
        >
          <Text style={styles.primaryBtnText}>{t('primaryBtnText', 'Simulate Arrival at Venue')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16 },
  iconBtn: { padding: 8, backgroundColor: theme.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: theme.colors.textPrimary },
  
  content: { padding: 20, paddingBottom: 40, gap: 24 },
  
  alertBox: { flexDirection: 'row', backgroundColor: 'rgba(212, 175, 55, 0.1)', padding: 16, borderRadius: 16, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: theme.colors.primary },
  alertText: { flex: 1, color: theme.colors.textSecondary, fontSize: 15, lineHeight: 22 },

  card: { backgroundColor: theme.colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: theme.colors.border },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 16 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  iconCircleSm: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  detailText: { fontSize: 15, color: theme.colors.textPrimary, fontWeight: '500' },
  
  mapPlaceholder: { height: 120, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginVertical: 16, borderWidth: 1, borderColor: theme.colors.border, borderStyle: 'dashed' },
  
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 12, backgroundColor: 'rgba(212, 175, 55, 0.1)', borderWidth: 1, borderColor: theme.colors.primary },
  secondaryBtnText: { color: theme.colors.primary, fontSize: 14, fontWeight: 'bold' },

  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: theme.colors.textPrimary, marginLeft: 4 },
  
  safetyCard: { backgroundColor: theme.colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: theme.colors.border, gap: 16 },
  safetyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  safetyText: { flex: 1, fontSize: 14, color: theme.colors.textSecondary, lineHeight: 20 },

  bottomBar: { padding: 20, paddingBottom: 32, backgroundColor: theme.colors.surface, borderTopWidth: 1, borderTopColor: theme.colors.border, gap: 12 },
  bottomHint: { fontSize: 12, color: theme.colors.textSecondary, textAlign: 'center' },
  primaryBtn: { width: '100%', backgroundColor: theme.colors.primary, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: theme.colors.background, fontSize: 15, fontWeight: 'bold' },
});
