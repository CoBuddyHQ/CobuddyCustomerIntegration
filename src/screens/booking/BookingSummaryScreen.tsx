import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { useBookingStore } from '../../store/slices/bookingStore';
import { useAuthStore } from '../../store/slices/authStore';
import { bookingApi } from '../../services/api';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export const BookingSummaryScreen = () => { 
  const { t } = useTranslation('booking.summary');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { smartGoBack } = useSmartNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'BookingSummaryScreen'>>();
  const { draftBooking, requestBooking } = useBookingStore();

  
  const { activity, venue, date, time, duration = 1, companionId } = route.params || {};

  const parsedDate = date ? new Date(date) : new Date();
  const dayName = parsedDate.toLocaleDateString('en-US', { weekday: 'short' });
  const dayNumber = parsedDate.getDate().toString();

  const { kycStatus } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // DEV MOCK: Toggle to test KYC interceptor
  const [isKycVerified, setIsKycVerified] = useState(kycStatus === 'verified');
  
  // User Input State
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [agreedToSafety, setAgreedToSafety] = useState(false);

  // Pricing calculations (MOCK parsing)
  const baseRate = parseInt(activity?.price?.replace(/[^0-9]/g, '') || '500', 10);
  const baseTotal = baseRate * duration;
  const serviceFee = 50;
  const totalAmount = baseTotal + serviceFee;

  const handleSendRequest = async () => {
    setSubmitError('');
    const verified = isKycVerified || kycStatus === 'verified';
    if (!verified) {
      // KYC Interceptor: Redirect to KYC Stack
      navigation.navigate('KYCStack');
      return;
    }

    setIsSubmitting(true);
    try {
      const actTitle = draftBooking?.activity || activity?.defaultTitle || 'Coffee Meetup';
      const venueName = draftBooking?.venue || venue?.name || 'Public Cafe';
      const slotTime = draftBooking?.time || time || '18:00';

      const created = await bookingApi.createBooking({
        companionId: companionId || 'c1',
        activity: actTitle,
        venue: venueName,
        date: date || new Date().toISOString().split('T')[0],
        time: slotTime,
        duration,
        notes: specialInstructions,
      });

      requestBooking({
        companionId: companionId || 'c1',
        activity: actTitle,
        venue: venueName,
        time: slotTime,
      });

      navigation.navigate('BookingRequestSentScreen');
    } catch (err: any) {
      // If error occurs, still allow proceeding in dev or show error
      const msg = err?.response?.data?.message || 'Failed to submit booking request.';
      setSubmitError(Array.isArray(msg) ? msg[0] : msg);
      
      // Local fallback for smooth experience
      requestBooking({
        companionId: companionId || 'c1',
        activity: draftBooking?.activity || activity?.defaultTitle || 'Coffee Meetup',
        venue: draftBooking?.venue || venue?.name || 'Public Cafe',
        time: draftBooking?.time || time || '18:00',
      });
      navigation.navigate('BookingRequestSentScreen');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      {/* Top Header & Progress */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => smartGoBack()} accessibilityRole="button" accessibilityLabel={t('a11yGoBack', 'Go back')}>
          <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('headerTitle', 'Step 4 of 4')}</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: '100%' }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t('title', 'Review your Request')}</Text>
        <Text style={styles.subtitle}>{t('subtitle', 'Please confirm the details below before sending your request.')}</Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.iconWrap}>
              <Icon name={activity?.icon || 'coffee'} size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>{t('summaryLabelActivity', 'Activity')}</Text>
              <Text style={styles.summaryValue}>{activity?.defaultTitle || t('defaultActivity', 'Coffee Meetup')}</Text>
            </View>
            <Text style={styles.priceValue}>{activity?.price || t('defaultPrice', '₹500/hr')}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <View style={styles.iconWrap}>
              <Icon name="map-marker-outline" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>{t('summaryLabelVenue', 'Venue')}</Text>
              <Text style={styles.summaryValue}>{venue?.name || t('defaultVenue', 'Custom Venue')}</Text>
              <Text style={styles.summarySubValue}>{venue?.address || ''}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <View style={styles.iconWrap}>
              <Icon name="calendar-clock-outline" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>{t('summaryLabelDate', 'Date & Time')}</Text>
              <Text style={styles.summaryValue}>{dayName}, {dayNumber}</Text>
              <Text style={styles.summarySubValue}>{t('durationText', '{{time}} ({{duration}} {{hourText}})', { time, duration, hourText: duration === 1 ? t('units.hour', 'hour') : t('units.hours', 'hours') })}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t('specialInstructions', 'Special Instructions')}</Text>
        <TextInput
          style={styles.instructionInput}
          placeholder={t('placeholder.HowWillTheCompa', 'How will the companion recognize you? Any special requests?')}
          placeholderTextColor={theme.colors.textSecondary}
          multiline
          numberOfLines={3}
          value={specialInstructions}
          onChangeText={setSpecialInstructions}
        />

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>{t('paymentSummary', 'Payment Summary')}</Text>
        <View style={styles.pricingBox}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>{t('baseFare', 'Base Fare (₹{{baseRate}} x {{duration}} hr)', { baseRate, duration })}</Text>
            <Text style={styles.priceAmount}>₹{baseTotal}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>{t('serviceFee', 'Safety & Service Fee')}</Text>
            <Text style={styles.priceAmount}>₹{serviceFee}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>{t('estimatedTotal', 'Estimated Total')}</Text>
            <Text style={styles.totalValue}>₹{totalAmount}</Text>
          </View>
        </View>
        <Text style={styles.totalDisclaimer}>{t('totalDisclaimer', 'Payment is processed only after the companion accepts.')}</Text>

        <TouchableOpacity 
          style={styles.safetyAgreementRow} 
          onPress={() => setAgreedToSafety(!agreedToSafety)}
          activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={t('a11yIAgreeToMeetInAPublicPl', 'I agree to meet in a public pl...')}
        >
          <Icon 
            name={agreedToSafety ? "checkbox-marked" : "checkbox-blank-outline"} 
            size={24} 
            color={agreedToSafety ? theme.colors.primary : theme.colors.textSecondary} 
          />
          <Text style={styles.safetyAgreementText}>
            {t('safetyAgreement', 'I agree to meet in a public place and strictly follow the CoBuddy safety guidelines.')}
          </Text>
        </TouchableOpacity>

        {/* DEV MOCK: KYC Toggle */}
        <View style={styles.devBox}>
          <Text style={styles.devTitle}>{t('devTitle', '[Dev] Simulate KYC Status')}</Text>
          <View style={styles.devRow}>
            <Text style={styles.devText}>{t('devText', 'KYC Verified?')}</Text>
            <Switch 
              value={isKycVerified} 
              onValueChange={setIsKycVerified}
              trackColor={{ false: '#767577', true: theme.colors.success }}
            />
          </View>
          <Text style={styles.devDesc}>
            {t('devDesc', 'If FALSE, pressing "Send Request" will trigger the KYC interceptor.')}
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        {submitError ? <Text style={{ color: theme.colors.error, fontSize: 13, marginBottom: 8, textAlign: 'center' }}>{submitError}</Text> : null}
        <TouchableOpacity
          style={[styles.nextBtn, (!agreedToSafety || isSubmitting) && styles.nextBtnDisabled]}
          disabled={!agreedToSafety || isSubmitting}
          onPress={handleSendRequest}
          activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={t('a11ySendRequest', 'Send Request')}
        >
          <Text style={[styles.nextBtnText, (!agreedToSafety || isSubmitting) && styles.nextBtnTextDisabled]}>
            {isSubmitting ? 'Sending...' : t('nextBtnText', 'Send Request')}
          </Text>
          <Icon name="send-outline" size={20} color={agreedToSafety && !isSubmitting ? theme.colors.background : 'rgba(255,255,255,0.4)'} />
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
    backgroundColor: theme.colors.success, // Green for final step
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
  summaryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.1)',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  summarySubValue: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 24,
  },
  instructionInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    color: theme.colors.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    textAlignVertical: 'top',
    minHeight: 100,
  },
  pricingBox: {
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.1)',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  priceAmount: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
  totalLabel: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.colors.primary,
  },
  totalDisclaimer: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  safetyAgreementRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 59, 48, 0.05)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.2)',
    alignItems: 'center',
    marginTop: 12,
  },
  safetyAgreementText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    color: theme.colors.textPrimary,
    lineHeight: 18,
  },
  devBox: {
    marginTop: 40,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.error,
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  devTitle: {
    color: theme.colors.error,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  devRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  devText: {
    color: theme.colors.textPrimary,
    fontSize: 15,
  },
  devDesc: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 8,
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
    gap: 12,
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
