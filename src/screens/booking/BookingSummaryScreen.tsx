import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { useBookingStore } from '../../store/slices/bookingStore';
import { useAuthStore } from '../../store/slices/authStore';
import { bookingApi, BookingPriceQuote } from '../../services/api';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { showApiError } from '../../utils/errorHandler';
import { FlowTracker } from '../../services/flowTracker';

export const BookingSummaryScreen = () => { 
  const { t } = useTranslation('booking.summary');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { smartGoBack } = useSmartNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'BookingSummaryScreen'>>();
  const { draftBooking } = useBookingStore();

  React.useEffect(() => {
    FlowTracker.saveActiveScreen('BookingSummaryScreen');
  }, []);

  
  const { activity, venue, date, time, duration = 1, companionId } = route.params || {};
  const activityId = activity?.id;
  const activityTitle = draftBooking?.activity || activity?.defaultTitle;
  const venueInfo = draftBooking?.venue || (typeof venue === 'object' ? venue : undefined);
  const venueName = venueInfo?.name || (typeof venue === 'string' ? venue : undefined);
  const venueAddress = venueInfo && 'address' in venueInfo ? venueInfo.address : undefined;

  const parsedDate = date ? new Date(date) : null;
  const dayName = parsedDate && Number.isFinite(parsedDate.getTime())
    ? parsedDate.toLocaleDateString('en-US', { weekday: 'short' })
    : 'Unavailable';
  const dayNumber = parsedDate && Number.isFinite(parsedDate.getTime())
    ? parsedDate.getDate().toString()
    : '';

  const { kycStatus, user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [priceQuote, setPriceQuote] = useState<BookingPriceQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(true);
  const [quoteFailed, setQuoteFailed] = useState(false);
  const [quoteRefresh, setQuoteRefresh] = useState(0);
  
  // User Input State
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [agreedToSafety, setAgreedToSafety] = useState(false);

  React.useEffect(() => {
    let active = true;
    if (!companionId || !activityId) {
      setPriceQuote(null);
      setQuoteFailed(true);
      setIsLoadingQuote(false);
      return () => { active = false; };
    }
    setIsLoadingQuote(true);
    setQuoteFailed(false);
    bookingApi.getBookingPriceQuote({
      companionId,
      activityId,
      durationHours: duration,
    }).then((quote) => {
      if (active) setPriceQuote(quote);
    }).catch(() => {
      if (active) {
        setPriceQuote(null);
        setQuoteFailed(true);
      }
    }).finally(() => {
      if (active) setIsLoadingQuote(false);
    });
    return () => { active = false; };
  }, [companionId, activityId, duration, quoteRefresh]);

  const handleSendRequest = async () => {
    setSubmitError('');
    if (!agreedToSafety) {
      setSubmitError('Please check the safety agreement box to continue.');
      return;
    }

    const verified = kycStatus === 'verified' || user?.kycStatus === 'verified' || (user as any)?.isVerified;
    if (!verified) {
      // KYC Interceptor: Redirect to KYC Stack
      navigation.navigate('KYCStack');
      return;
    }

    if (!companionId || !activityId || !activityTitle || !venueName || !date || !time || !priceQuote) {
      setSubmitError('A server quote and complete booking details are required. No booking was submitted.');
      return;
    }

    setIsSubmitting(true);
    try {
      const resBooking = await bookingApi.createBooking({
        companionId,
        companionName: route.params?.companionName,
        activityId,
        activityName: activityTitle,
        activityIcon: activity?.icon,
        venueName,
        venueAddress,
        date,
        time,
        safetyAcknowledged: agreedToSafety,
        durationHours: duration,
        specialInstructions: specialInstructions.trim() || undefined,
      });
      if (!resBooking?.id) {
        throw new Error('The Customer Backend did not return a booking identifier.');
      }
      const formattedDateStr = new Date(date).toLocaleDateString('en-US', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
      });
      const serverTotal = resBooking.pricing?.totalAmount ?? resBooking.totalAmount;
      const formattedAmountStr = typeof serverTotal === 'number'
        ? '₹' + serverTotal.toLocaleString('en-IN')
        : 'Unavailable';

      navigation.navigate('BookingRequestSentScreen', {
        bookingId: resBooking?.id || '',
        companionName: route.params?.companionName || (resBooking as any)?.companionName || 'Companion',
        date: formattedDateStr,
        time,
        venue: venueName,
        amount: formattedAmountStr,
        companionRequestStatus: resBooking.companionRequestStatus,
      });
    } catch (err: any) {
      showApiError(err, {
        title: 'Booking Request Failed',
        onRetry: handleSendRequest,
      });
      const msg = err?.response?.data?.message || 'Failed to submit booking request. Please try again.';
      setSubmitError(Array.isArray(msg) ? msg[0] : msg);
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
              <Text style={styles.summaryValue}>{activityTitle || t('activityUnavailable', 'Activity unavailable')}</Text>
            </View>
            <Text style={styles.priceValue}>
              {priceQuote ? '₹' + priceQuote.baseRate.toLocaleString('en-IN') + '/hr' : 'Unavailable'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <View style={styles.iconWrap}>
              <Icon name="map-marker-outline" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>{t('summaryLabelVenue', 'Venue')}</Text>
              <Text style={styles.summaryValue}>{venueName || t('venueUnavailable', 'Venue unavailable')}</Text>
              <Text style={styles.summarySubValue}>{venueAddress || ''}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <View style={styles.iconWrap}>
              <Icon name="calendar-clock-outline" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>{t('summaryLabelDate', 'Date & Time')}</Text>
              <Text style={styles.summaryValue}>
                {dayNumber ? dayName + ', ' + dayNumber : 'Date unavailable'}
              </Text>
              <Text style={styles.summarySubValue}>
                {time
                  ? t('durationText', '{{time}} ({{duration}} {{hourText}})', { time, duration, hourText: duration === 1 ? t('units.hour', 'hour') : t('units.hours', 'hours') })
                  : 'Time unavailable'}
              </Text>
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
          {isLoadingQuote ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : priceQuote ? (
            <>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>
                  {t('baseFare', 'Base Fare (₹{{baseRate}} x {{duration}} hr)', {
                    baseRate: priceQuote.baseRate,
                    duration: priceQuote.durationHours,
                  })}
                </Text>
                <Text style={styles.priceAmount}>₹{priceQuote.baseTotal.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>{t('serviceFee', 'Platform fee')}</Text>
                <Text style={styles.priceAmount}>₹{priceQuote.platformFee.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Tax</Text>
                <Text style={styles.priceAmount}>₹{priceQuote.taxAmount.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.priceRow}>
                <Text style={styles.totalLabel}>{t('estimatedTotal', 'Server quote')}</Text>
                <Text style={styles.totalValue}>₹{priceQuote.totalAmount.toLocaleString('en-IN')}</Text>
              </View>
            </>
          ) : (
            <TouchableOpacity onPress={() => setQuoteRefresh((value) => value + 1)} accessibilityRole="button">
              <Text style={styles.priceLabel}>
                {quoteFailed ? 'Price quote unavailable. Tap to retry.' : 'Enter a valid companion and activity to request a price.'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.totalDisclaimer}>
          The Customer Backend recalculates the final price when the request is submitted. Checkout is currently unavailable.
        </Text>

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
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        {submitError ? <Text style={{ color: theme.colors.error, fontSize: 13, marginBottom: 8, textAlign: 'center' }}>{submitError}</Text> : null}
        <TouchableOpacity
          style={[styles.nextBtn, (isSubmitting || isLoadingQuote || !priceQuote) && styles.nextBtnDisabled]}
          disabled={isSubmitting || isLoadingQuote || !priceQuote}
          onPress={handleSendRequest}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={t('a11ySendRequest', 'Send Request')}
        >
          <Text style={styles.nextBtnText}>
            {isSubmitting ? 'Sending...' : t('nextBtnText', 'Send Request')}
          </Text>
          <Icon name="send-outline" size={20} color={theme.colors.background} />
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
