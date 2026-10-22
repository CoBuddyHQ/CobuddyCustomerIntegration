import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Animated, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../../theme';
import { RootStackParamList } from '../../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { bookingApi } from '../../../services/api';
import { formatBookingAmount, normalizePaymentState } from '../../../utils/bookingPresentation';

export const BookingAcceptedScreen = ({ route }: { route: any }) => { 
  const { t } = useTranslation('booking.accepted');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const scaleAnim = useRef(new Animated.Value(0)).current;

  const [booking, setBooking] = React.useState<any>(null);
  const [bookingLoadError, setBookingLoadError] = React.useState(false);
  const routeBookingId = route?.params?.bookingId;

  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, tension: 40, friction: 6, useNativeDriver: true }).start();
    if (routeBookingId) {
      bookingApi.getBooking(routeBookingId)
        .then((res) => {
          if (res) setBooking(res);
          else setBookingLoadError(true);
        })
        .catch(() => setBookingLoadError(true));
    } else {
      setBookingLoadError(true);
    }
  }, [scaleAnim, routeBookingId]);

  const bookingData = {
    bookingId: booking?.id || routeBookingId || '',
    companionName: booking?.companionName || 'Unavailable',
    companionId: booking?.companionId || '',
    activity: booking?.activityName || booking?.activity || 'Unavailable',
    date: booking?.date && Number.isFinite(new Date(booking.date).getTime())
      ? new Date(booking.date).toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
      : 'Unavailable',
    time: booking?.time || 'Unavailable',
    venue: typeof booking?.venue === 'object' ? booking?.venue?.name || 'Unavailable' : booking?.venueName || booking?.venue || 'Unavailable',
    address: booking?.venueAddress || 'Unavailable',
    amount: formatBookingAmount(booking?.pricing?.totalAmount ?? booking?.totalAmount),
    isAccepted: booking?.status === 'accepted' || booking?.status === 'confirmed',
    paymentStatus: normalizePaymentState(booking?.paymentStatus),
  };
  const paymentStatusLabel = {
    pending: 'No completed payment is confirmed',
    completed: 'Payment recorded by the Customer Backend',
    failed: 'Payment failed according to the Customer Backend',
    refunded: 'Refund reported by the Customer Backend',
    unknown: 'Payment status unavailable',
  }[bookingData.paymentStatus];

  const handleMessage = () => {
    if (!bookingData.companionId || !bookingData.bookingId) return;
    const parent = navigation.getParent();
    const target = {
      screen: 'ChatTab',
      params: {
        screen: 'CompanionChatScreen',
        initial: false,
        params: { companionName: bookingData.companionName, bookingId: bookingData.bookingId, companionId: bookingData.companionId }
      }
    };
    if (parent) {
      parent.reset({ index: 0, routes: [{ name: 'MainTabNavigator', params: target }] });
    } else {
      (navigation as any).navigate('MainTabNavigator', target);
    }
  };

  const handleViewItinerary = () => {
    if (!bookingData.bookingId) return;
    const parent = navigation.getParent();
    const target = {
      screen: 'BookingsTab',
      params: {
        screen: 'BookingDetailScreen',
        initial: false,
        params: { bookingId: bookingData.bookingId }
      }
    };
    if (parent) {
      parent.reset({ index: 0, routes: [{ name: 'MainTabNavigator', params: target }] });
    } else {
      (navigation as any).navigate('MainTabNavigator', target);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.iconContainer, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.glow} />
          <Icon
            name={bookingData.isAccepted ? 'check-decagram' : bookingLoadError ? 'alert-circle-outline' : 'clock-outline'}
            size={100}
            color={bookingData.isAccepted ? theme.colors.success : bookingLoadError ? theme.colors.warning : theme.colors.textSecondary}
          />
        </Animated.View>

        <Text style={styles.title}>
          {bookingData.isAccepted
            ? t('title', 'Booking accepted')
            : bookingLoadError
              ? t('statusUnavailable', 'Booking status unavailable')
              : t('checkingStatus', 'Checking booking status…')}
        </Text>
        <Text style={styles.subtitle}>
          {bookingData.isAccepted
            ? t('acceptedMsg2', 'The Customer Backend confirmed that the companion accepted this booking.')
            : bookingLoadError
              ? t('statusLoadError', 'The booking service could not confirm the current status. Check booking details before continuing.')
              : t('statusLoading', 'Loading the latest booking status from the Customer Backend.')}
        </Text>

        <View style={styles.card}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
            <Text style={styles.cardHeader}>{t('cardHeader', 'BOOKING DETAILS')}</Text>
            <Text style={styles.bookingId}>#{bookingData.bookingId}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.iconBox}>
              <Icon name="party-popper" size={18} color={theme.colors.primary} />
            </View>
            <View>
              <Text style={styles.detailLabel}>{t('detailLabelActivity', 'Activity')}</Text>
              <Text style={styles.detailText}>{bookingData.activity}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.iconBox}>
              <Icon name="calendar-clock" size={18} color={theme.colors.primary} />
            </View>
            <View>
              <Text style={styles.detailLabel}>{t('detailLabelDate', 'Date & Time')}</Text>
              <Text style={styles.detailText}>{bookingData.date}</Text>
              <Text style={styles.subText}>{bookingData.time}</Text>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.iconBox}>
              <Icon name="map-marker-radius" size={18} color={theme.colors.primary} />
            </View>
            <View>
              <Text style={styles.detailLabel}>{t('detailLabelVenue', 'Venue')}</Text>
              <Text style={styles.detailText}>
                {typeof bookingData.venue === 'object' ? (bookingData.venue as any)?.name : String(bookingData.venue || 'Public Cafe')}
              </Text>
              <Text style={styles.subText}>{bookingData.address}</Text>
            </View>
          </View>

          <View style={styles.divider} />
          
          <View style={[styles.detailRow, { marginBottom: 0, justifyContent: 'space-between', alignItems: 'center' }]}>
            <View>
              <Text style={styles.detailLabel}>{t('detailLabelTotal', 'Booking amount')}</Text>
              <Text style={styles.paymentNote}>
                {t('escrowNote', 'Checkout is unavailable. {{status}}. This screen does not hold funds.', { status: paymentStatusLabel })}
              </Text>
            </View>
            <Text style={styles.amountText}>{bookingData.amount}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Floating Luxury Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarHandle} />
        <TouchableOpacity style={styles.primaryBtn} onPress={handleMessage} disabled={!bookingData.companionId} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel={t('a11yChat', 'Chat')}>
          <Icon name="chat" size={20} color={theme.colors.background} />
          <Text style={styles.primaryBtnText}>{t('messageCompanion', 'Message {{name}}', { name: bookingData.companionName })}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={handleViewItinerary} disabled={!bookingData.bookingId} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel={t('a11yViewBookingDetails', 'View Booking Details')}>
          <Text style={styles.secondaryBtnText}>{t('secondaryBtnText', 'View Booking Details')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 24, paddingBottom: 40, alignItems: 'center' },
  
  iconContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 24, marginTop: 20, position: 'relative' },
  glow: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: theme.colors.success, opacity: 0.15 },
  
  title: { fontSize: 32, fontWeight: '900', color: theme.colors.textPrimary, marginBottom: 12, textAlign: 'center', letterSpacing: 0.5 },
  subtitle: { fontSize: 15, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 40, paddingHorizontal: 10 },
  
  card: { width: '100%', backgroundColor: theme.colors.surface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)', shadowColor: theme.colors.success, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  cardHeader: { fontSize: 12, fontWeight: '900', color: theme.colors.textSecondary, letterSpacing: 1.5 },
  bookingId: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: 'bold' },
  
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(212, 175, 55, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  detailLabel: { fontSize: 12, color: theme.colors.textSecondary, marginBottom: 2 },
  detailText: { fontSize: 15, color: theme.colors.textPrimary, fontWeight: 'bold' },
  subText: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
  
  amountText: { fontSize: 24, color: theme.colors.success, fontWeight: '900' },
  paymentNote: { fontSize: 11, color: theme.colors.warning, marginTop: 4, fontWeight: '600' },
  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 8, marginBottom: 20 },
  
  bottomBar: { 
    padding: 20, 
    paddingBottom: 24, 
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 15,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)'
  },
  bottomBarHandle: {
    width: 36,
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 4,
    marginTop: -8
  },
  primaryBtn: { backgroundColor: theme.colors.primary, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  primaryBtnText: { color: theme.colors.background, fontSize: 16, fontWeight: 'bold' },
  secondaryBtn: { height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.primary, backgroundColor: 'rgba(212, 175, 55, 0.05)' },
  secondaryBtnText: { color: theme.colors.primary, fontSize: 16, fontWeight: 'bold' },
});
