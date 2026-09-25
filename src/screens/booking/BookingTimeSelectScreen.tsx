import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { useBookingStore } from '../../store/slices/bookingStore';
import { selectSetDraftBooking } from '../../store/selectors/bookingSelectors';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// MOCK: Generate next 7 days for the date picker
const generateNext7Days = () => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + i);
    dates.push({
      id: `d${i}`,
      dateStr: nextDate.toISOString().split('T')[0],
      dayName: i === 0 ? 'Today' : nextDate.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: nextDate.getDate(),
    });
  }
  return dates;
};
const DATES = generateNext7Days();

// MOCK: Time slots
const TIME_SLOTS = [
  '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM',
  '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
  '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM'
];

export const BookingTimeSelectScreen = () => { 
  const { t } = useTranslation('booking.timeSelect');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { smartGoBack } = useSmartNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'BookingTimeSelectScreen'>>();
  const setDraftBooking = useBookingStore(selectSetDraftBooking);

  const { activity, venue, companionId, companionName } = route.params || {};

  const [selectedDateId, setSelectedDateId] = useState<string>(DATES[0].id);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(1); // Default 1 hour

  const handleBack = () => {
    smartGoBack();
  };

    const handleNext = () => {
    if (!selectedTime) return;
    
    const selectedDate = DATES.find(d => d.id === selectedDateId);
    setDraftBooking({ scheduledStart: `${selectedDate?.dateStr || ''}T${selectedTime || '18:00'}:00` });
    
    navigation.navigate('BookingSummaryScreen', {
      activity,
      venue,
      date: selectedDate?.dateStr,
      time: selectedTime,
      duration,
      companionId,
      companionName,
    });
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      {/* Top Header & Progress */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack} accessibilityRole="button" accessibilityLabel={t('a11yGoBack', 'Go back')}>
          <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('headerTitle', 'Step 3 of 4')}</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: '75%' }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t('title', 'When do you want to meet?')}</Text>
        <Text style={styles.subtitle}>{t('subtitle', 'Select a date and time for your booking.')}</Text>

        <Text style={styles.sectionTitle}>{t('sectionTitleDate', 'Select Date')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateList}>
          {DATES.map((d, index) => {
            const isSelected = selectedDateId === d.id;
            return (
              <TouchableOpacity
                key={d.id}
                style={[styles.dateCard, isSelected && styles.dateCardSelected]}
                onPress={() => {
                  setSelectedDateId(d.id);
                  setSelectedTime(null); // Reset time when date changes
                }} accessibilityRole="button" accessibilityLabel={`${d.dayName} ${d.dayNumber}`}
              >
                <Text style={[styles.dayName, isSelected && styles.textSelected]}>{index === 0 ? t('today', 'Today') : d.dayName}</Text>
                <Text style={[styles.dayNumber, isSelected && styles.textSelected]}>{d.dayNumber}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={[styles.sectionTitle, { marginTop: 32 }]}>{t('sectionTitleTime', 'Select Time')}</Text>
        <View style={styles.timeGrid}>
          {TIME_SLOTS.map((time) => {
            const isSelected = selectedTime === time;
            return (
              <TouchableOpacity
                key={time}
                style={[styles.timeSlot, isSelected && styles.timeSlotSelected]}
                onPress={() => setSelectedTime(time)} accessibilityRole="button" accessibilityLabel={t('a11yTime', 'time')}
              >
                <Text style={[styles.timeText, isSelected && styles.textSelected]}>{time}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 32 }]}>{t('sectionTitleDuration', 'Duration')}</Text>
        <View style={styles.durationRow}>
          {[1, 2, 3, 4].map((hrs) => {
            const isSelected = duration === hrs;
            return (
              <TouchableOpacity
                key={hrs}
                style={[styles.durationBtn, isSelected && styles.durationBtnSelected]}
                onPress={() => setDuration(hrs)} accessibilityRole="button" accessibilityLabel={hrs === 1 ? t('units.hr', 'hr') : t('units.hrs', 'hrs')}
              >
                <Text style={[styles.durationText, isSelected && styles.textSelected]}>
                  {hrs} {hrs === 1 ? t('units.hr', 'hr') : t('units.hrs', 'hrs')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.nextBtn, !selectedTime && styles.nextBtnDisabled]}
          disabled={!selectedTime}
          onPress={handleNext}
          activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={t('a11yContinue', 'Continue')}
        >
          <Text style={[styles.nextBtnText, !selectedTime && styles.nextBtnTextDisabled]}>{t('continue', 'Continue')}</Text>
          <Icon 
            name="arrow-right" 
            size={20} 
            color={selectedTime ? theme.colors.background : 'rgba(255,255,255,0.4)'} 
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  progressContainer: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    width: '100%',
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  dateList: {
    gap: 12,
  },
  dateCard: {
    width: 64,
    height: 80,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCardSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  dayName: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  textSelected: {
    color: theme.colors.background,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeSlot: {
    width: '30%',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  timeSlotSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  timeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 12,
  },
  durationBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  durationBtnSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  durationText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  bottomBar: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    backgroundColor: theme.colors.surface,
  },
  nextBtn: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 28,
    gap: 8,
  },
  nextBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  nextBtnText: {
    color: theme.colors.background,
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  nextBtnTextDisabled: {
    color: 'rgba(255,255,255,0.4)',
  },
});
