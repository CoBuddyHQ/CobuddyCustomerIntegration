import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { RootStackParamList } from '../../types/navigation';
import { bookingApi, Booking as BookingApiType } from '../../services/api';
import { FlowTracker } from '../../services/flowTracker';
import { formatBookingAmount, normalizePaymentState } from '../../utils/bookingPresentation';

type PaymentScreenRouteProp = RouteProp<RootStackParamList, 'PaymentScreen'>;

export const PaymentScreen: React.FC = () => {
  const route = useRoute<PaymentScreenRouteProp>();
  const { smartGoBack } = useSmartNavigation();

  const bookingId = route.params?.bookingId;

  const [booking, setBooking] = useState<BookingApiType | null>(null);
  const [isLoadingBooking, setIsLoadingBooking] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    FlowTracker.saveActiveScreen('PaymentScreen');
  }, []);

  // Fetch authoritative booking and price data from the Customer Backend.
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoadingBooking(true);
      setLoadError(false);
      try {
        if (!bookingId) throw new Error('Booking identifier unavailable.');
        const fetchedBooking = await bookingApi.getBooking(bookingId);
        if (isMounted && fetchedBooking) {
          setBooking(fetchedBooking);
        } else if (isMounted) {
          setLoadError(true);
        }
      } catch {
        if (isMounted) setLoadError(true);
      } finally {
        if (isMounted) setIsLoadingBooking(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [bookingId]);

  // Display only amounts returned by the Customer Backend.
  const durationHours = booking?.pricing?.durationHours ?? booking?.durationHours ?? booking?.duration;
  const baseRate = booking?.pricing?.baseRate;
  const baseTotal = booking?.pricing?.baseTotal;
  const platformFee = booking?.pricing?.platformFee;
  const taxes = booking?.pricing?.taxAmount;
  const totalAmount = booking?.pricing?.totalAmount ?? booking?.totalAmount;
  const hasPriceBreakdown = [durationHours, baseRate, baseTotal, platformFee, taxes]
    .every((value) => typeof value === 'number' && Number.isFinite(value));

  const companionName = booking?.companionName || route.params?.companionName || 'Unavailable';
  const activityName = booking?.activityName || booking?.activity || route.params?.activityName || 'Unavailable';
  const venueName = typeof booking?.venue === 'object' ? (booking?.venue?.name || 'Unavailable') : (booking?.venueName || booking?.venue || 'Unavailable');
  const formattedDate = booking?.date ? new Date(booking.date).toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }) : 'Unavailable';
  const timeSlot = booking?.time || 'Unavailable';

  const paymentState = normalizePaymentState(booking?.paymentStatus);
  const paymentStateText = {
    pending: 'No completed payment is confirmed by the Customer Backend.',
    completed: 'The Customer Backend reports this payment as complete.',
    failed: 'The Customer Backend reports this payment as failed.',
    refunded: 'The Customer Backend reports this payment as refunded.',
    unknown: 'Payment status is unavailable from the Customer Backend.',
  }[paymentState];

  if (isLoadingBooking) {
    return (
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading booking details…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => smartGoBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Icon name="arrow-left" size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Payment details</Text>
          <Text style={styles.headerSubtitle}>Checkout unavailable in this app build</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Booking Summary Mini-Card */}
        <View style={styles.card}>
          <View style={styles.bookingRow}>
            <View style={styles.companionAvatar}>
              <Text style={styles.companionAvatarText}>{companionName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.bookingDetails}>
              <Text style={styles.companionName}>{companionName}</Text>
              <Text style={styles.activityTitle}>{activityName}</Text>
              <View style={styles.infoRow}>
                <Icon name="calendar-clock" size={14} color={theme.colors.textSecondary} />
                <Text style={styles.infoText}>{formattedDate} • {timeSlot}</Text>
              </View>
              <View style={styles.infoRow}>
                <Icon name="map-marker-outline" size={14} color={theme.colors.textSecondary} />
                <Text style={styles.infoText} numberOfLines={1}>{venueName}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.checkoutUnavailableCard}>
          <Icon name="alert-circle-outline" size={24} color={theme.colors.warning} />
          <View style={styles.escrowContent}>
            <Text style={styles.escrowTitle}>Checkout unavailable</Text>
            <Text style={styles.escrowDesc}>
              Payment processing is not configured in this app build. No payment was submitted and no funds were held by this screen.
            </Text>
            <Text style={styles.escrowDesc}>{paymentStateText}</Text>
          </View>
        </View>

        {/* Transparent Cost Breakdown */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Price Breakdown</Text>

          {hasPriceBreakdown ? <>
          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Session amount ({durationHours} hr)</Text>
            <Text style={styles.feeValue}>{formatBookingAmount(baseTotal)}</Text>
          </View>

          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Platform fee</Text>
            <Text style={styles.feeValue}>{formatBookingAmount(platformFee)}</Text>
          </View>

          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Taxes</Text>
            <Text style={styles.feeValue}>{formatBookingAmount(taxes)}</Text>
          </View>
          </> : (
            <Text style={styles.feeLabel}>Price breakdown unavailable from the Customer Backend.</Text>
          )}

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <View>
              <Text style={styles.totalLabel}>Booking total</Text>
              <Text style={styles.totalSubtext}>Server-reported amount; this screen does not charge or hold funds.</Text>
            </View>
              <Text style={styles.totalValue}>{formatBookingAmount(totalAmount)}</Text>
          </View>
        </View>

        {loadError && (
          <View style={styles.errorBox}>
            <Icon name="alert-circle-outline" size={20} color={theme.colors.error} />
            <Text style={styles.errorText}>Booking details could not be loaded. No price or payment status is being assumed.</Text>
          </View>
        )}
      </ScrollView>

      {/* Sticky Bottom Payment Button */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomTotalWrap}>
          <Text style={styles.bottomTotalLabel}>Booking total</Text>
          <Text style={styles.bottomTotalAmount}>{formatBookingAmount(totalAmount)}</Text>
        </View>

        <TouchableOpacity
          style={[styles.payButton, styles.payButtonDisabled]}
          disabled
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Checkout unavailable"
        >
          <Icon name="credit-card-off-outline" size={18} color={theme.colors.background} />
          <Text style={styles.payButtonText}>Checkout unavailable</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  secureBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: theme.colors.success,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.1)',
  },
  bookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  companionAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  companionAvatarText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  bookingDetails: {
    flex: 1,
    gap: 4,
  },
  companionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  activityTitle: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  infoText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  checkoutUnavailableCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
  },
  escrowIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  escrowContent: {
    flex: 1,
  },
  escrowTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  escrowDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 10,
    gap: 12,
  },
  methodOptionSelected: {
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderColor: theme.colors.primary,
  },
  methodIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  methodSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  insufficientText: {
    color: theme.colors.error,
    fontWeight: 'bold',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleActive: {
    borderColor: theme.colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  labelWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feeLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  feeValue: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  totalSubtext: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: theme.colors.primary,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.error,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.error,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    gap: 16,
  },
  bottomTotalWrap: {
    justifyContent: 'center',
  },
  bottomTotalLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
  },
  bottomTotalAmount: {
    fontSize: 20,
    fontWeight: '900',
    color: theme.colors.primary,
  },
  payButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    height: 50,
    borderRadius: 25,
    gap: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: theme.colors.background,
  },
});
