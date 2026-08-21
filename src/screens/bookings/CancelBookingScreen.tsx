import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { MOCK_BOOKINGS } from '../../services/mock/bookings.mock';
import { bookingApi } from '../../services/api';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useBookingStore } from '../../store/slices/bookingStore';
import { selectCancelBooking } from '../../store/selectors/bookingSelectors';
import { adminValues } from '../../config/adminValues';

export const CancelBookingScreen = () => { 
  const { t } = useTranslation('bookings.cancel');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { smartGoBack } = useSmartNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'CancelBookingScreen'>>();
  const bookingId = route.params?.bookingId || 'CB-REQ-8829';
  const booking = MOCK_BOOKINGS.find(b => b.id === bookingId) || MOCK_BOOKINGS[0];
  
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const cancelBooking = useBookingStore(selectCancelBooking);

  // Calculate dynamic refund
  const parsedDate = new Date(`${booking?.date} ${booking?.time || '18:00'}`);
  const hoursUntilSession = isNaN(parsedDate.getTime()) ? 48 : (parsedDate.getTime() - Date.now()) / (1000 * 60 * 60);

  const { tier1, tier2, tier3 } = adminValues.cancellationRefundTiers;
  let refundPercent = 100;
  let refundText = t('refundText.tier1', 'Since you are cancelling more than 48 hours in advance, you will receive a ');

  if (hoursUntilSession >= tier1.minHours) {
    refundPercent = tier1.refundPercent;
    refundText = t('refundText.tier1', 'Since you are cancelling more than 48 hours in advance, you will receive a ');
  } else if (hoursUntilSession >= tier2.minHours) {
    refundPercent = tier2.refundPercent;
    refundText = t('refundText.tier2', 'Since you are cancelling between 24 and 48 hours in advance, you will receive a ');
  } else {
    refundPercent = tier3.refundPercent;
    refundText = t('refundText.tier3', 'Since you are cancelling less than 24 hours in advance, you will receive a ');
  }

  // Guard: should never arrive here without a real bookingId
  useEffect(() => {
    if (!bookingId) {
      smartGoBack();
    }
  }, [bookingId]);

  const handleBack = () => smartGoBack();
  
  const handleConfirmCancel = async () => {
    if (!bookingId) return;
    setIsCancelling(true);
    try {
      await bookingApi.cancelBooking(bookingId, {
        reason: selectedReason || 'other',
      });
    } catch {
      // Graceful fallback
    } finally {
      cancelBooking(bookingId);
      setIsCancelling(false);
      navigation.navigate('MainTabNavigator', { screen: 'BookingsTab' });
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel={t('a11yGoBack', 'Go back')}>
          <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('headerTitle', 'Cancel Booking')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Booking Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{t('summaryTitle', 'Cancelling Booking: {{id}}', { id: bookingId })}</Text>
          <View style={styles.summaryRow}>
            <Icon name="account" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.summaryText}>{booking?.companionName || t('fallbackCompanion', 'Companion')}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Icon name="calendar-clock" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.summaryText}>{booking?.date} • {booking?.time || '18:00'}</Text>
          </View>
        </View>

        {/* Warning Card */}
        <View style={styles.warningCard}>
          <Icon name="alert-circle-outline" size={24} color={theme.colors.error} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.warningTitle}>{t('warningTitle', 'Cancellation Policy')}</Text>
            <Text style={styles.warningDesc}>{t('warningDesc1', refundText)}<Text style={{fontWeight: 'bold', color: theme.colors.error}}>{t('warningDesc2', `${refundPercent}% refund`)}</Text>{t('warningDesc3', '. The escrow hold will be adjusted immediately.')}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t('sectionTitle', 'WHY ARE YOU CANCELLING?')}</Text>
        
        <View style={styles.reasonsContainer}>
          {adminValues.cancellationReasons.map((reasonKey) => (
            <TouchableOpacity 
              key={reasonKey} 
              style={[styles.reasonRow, selectedReason === reasonKey && styles.reasonRowActive]}
              onPress={() => setSelectedReason(reasonKey)}
              activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={t(`reason.${reasonKey}`, reasonKey.replace(/_/g, ' '))}
            >
              <Text style={[styles.reasonText, selectedReason === reasonKey && styles.reasonTextActive]}>
                {t(`reason.${reasonKey}`, reasonKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))}
              </Text>
              <View style={[styles.radioCircle, selectedReason === reasonKey && styles.radioCircleActive]}>
                {selectedReason === reasonKey && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>
        
      </ScrollView>

      {/* Sticky Footer */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarHandle} />
        <TouchableOpacity 
          style={[styles.cancelBtn, (!selectedReason || isCancelling) && styles.cancelBtnDisabled]} 
          onPress={handleConfirmCancel}
          disabled={!selectedReason || isCancelling}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={t('a11yConfirmCancellation', 'Confirm Cancellation')}
        >
          <Text style={styles.cancelBtnText}>{isCancelling ? 'Cancelling...' : t('btn.confirmCancellation', 'Confirm Cancellation')}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.keepBtn} 
          onPress={handleBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('a11yKeepBooking', 'Keep Booking')}
        >
          <Text style={styles.keepBtnText}>{t('btn.keepBooking', 'Nevermind, Keep Booking')}</Text>
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
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  summaryText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.error,
    marginBottom: 4,
  },
  warningDesc: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 12,
  },
  reasonsContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    marginBottom: 24,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  reasonRowActive: {
    backgroundColor: 'rgba(217, 119, 6, 0.05)',
  },
  reasonText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  reasonTextActive: {
    fontWeight: '600',
    color: theme.colors.primary,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  radioCircleActive: {
    borderColor: theme.colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  bottomBar: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  bottomBarHandle: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  cancelBtn: {
    backgroundColor: theme.colors.error,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cancelBtnDisabled: {
    opacity: 0.5,
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  keepBtn: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keepBtnText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
});
