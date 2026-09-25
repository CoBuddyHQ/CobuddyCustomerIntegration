import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { bookingApi, Booking as BookingApiType } from '../../services/api';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type TabType = 'pending' | 'accepted' | 'history';

export const BookingsListScreen = () => { 
  const { t } = useTranslation('bookings.list');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [apiBookings, setApiBookings] = useState<BookingApiType[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      const fetchBookings = async () => {
        setIsLoading(true);
        try {
          const list = await bookingApi.listBookings(activeTab);
          if (isMounted && list && list.length > 0) {
            setApiBookings(list);
          } else if (isMounted) {
            setApiBookings([]);
          }
        } catch {
          if (isMounted) setApiBookings([]);
        } finally {
          if (isMounted) setIsLoading(false);
        }
      };

      fetchBookings();
      return () => {
        isMounted = false;
      };
    }, [activeTab])
  );

  const displayList = apiBookings.map(b => {
    const rawTime = b.time || '18:00';
    const formattedTime = rawTime.includes('T') ? rawTime.split('T')[1].replace(/(:00)$/, '') : rawTime;
    const refId = (b as any).bookingRef || (b.id?.length > 12 ? 'CB-' + b.id.slice(0, 8).toUpperCase() : b.id);
    const st = (b.status as string)?.toLowerCase();

    let displayStatus = 'Awaiting Reply';
    if (st === 'accepted' || st === 'confirmed' || st === 'in_progress') {
      displayStatus = 'Accepted';
    } else if (st === 'counter_proposed' || st === 'countered') {
      displayStatus = 'Counter-Proposed';
    } else if (st === 'declined') {
      displayStatus = 'Declined';
    } else if (st === 'completed') {
      displayStatus = 'Completed';
    } else if (st === 'cancelled') {
      displayStatus = 'Cancelled';
    }

    return {
      id: b.id,
      displayId: refId,
      type: 'companion',
      companionId: b.companionId,
      companionName: b.companionName || 'Companion',
      rating: '5.0',
      activity: b.activityName || b.activity || 'Experience Meetup',
      date: b.date ? new Date(b.date).toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short' }) : 'Today',
      time: `${formattedTime} (${b.durationHours || b.duration || 1} hrs)`,
      venue: typeof b.venue === 'object' ? ((b.venue as any)?.name || 'Public Venue') : (b.venueName || b.venue || 'Public Venue'),
      price: (b.pricing?.totalAmount || b.totalAmount) ? `₹${b.pricing?.totalAmount || b.totalAmount}` : '₹550',
      displayStatus,
      duration: `${b.durationHours || b.duration || 1} hrs`,
    };
  });

  const handlePressCard = (booking: any) => {
    if (booking.displayStatus === 'Counter-Proposed') {
      navigation.navigate('BookingFlowStack', { 
        screen: 'BookingCounterOfferScreen', 
        params: { bookingId: booking.id, companionName: booking.companionName, companionId: booking.companionId } 
      });
    } else {
      navigation.navigate('BookingDetailScreen', { 
        bookingId: booking.id,
        status: booking.displayStatus
      });
    }
  };

  const renderStatusBadge = (status: string) => {
    let color = theme.colors.textSecondary;
    let bgColor = theme.colors.surface;
    let icon = 'clock-outline';

    if (status === 'Accepted') {
      color = theme.colors.success;
      bgColor = 'rgba(16, 185, 129, 0.15)';
      icon = 'check-decagram-outline';
    } else if (status === 'Counter-Proposed') {
      color = theme.colors.warning;
      bgColor = 'rgba(245, 158, 11, 0.15)';
      icon = 'swap-horizontal';
    } else if (status === 'Awaiting Reply') {
      color = theme.colors.primary;
      bgColor = 'rgba(212, 175, 55, 0.15)';
      icon = 'timer-sand';
    } else if (status === 'Completed') {
      color = theme.colors.textSecondary;
      bgColor = theme.colors.border;
      icon = 'check-all';
    } else if (status === 'Declined') {
      color = theme.colors.error;
      bgColor = 'rgba(239, 68, 68, 0.15)';
      icon = 'cancel';
    } else if (status === 'Cancelled') {
      color = theme.colors.error;
      bgColor = 'rgba(239, 68, 68, 0.15)';
      icon = 'close-circle-outline';
    }

    return (
      <View style={[styles.statusBadge, { backgroundColor: bgColor, borderColor: color }]}>
        <Icon name={icon} size={14} color={color} style={{ marginRight: 4 }} />
        <Text style={[styles.statusText, { color }]}>{t(`status.${status}`, status)}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      {/* Luxury Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>{t('headerTitle', 'My Bookings')}</Text>
          <TouchableOpacity 
            style={styles.headerIconBtn} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('SafetySupportStack', { screen: 'HelpCenterScreen' })} accessibilityRole="button" accessibilityLabel={t('a11yHelp', 'Help')}
          >
             <Icon name="help-circle-outline" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>{t('headerSubtitle', 'Manage your upcoming and past meetups.')}</Text>
      </View>

      {/* Premium Segmented Tabs */}
      <View style={styles.tabWrapper}>
        <View style={styles.tabContainer}>
          {(['pending', 'accepted', 'history'] as TabType[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={t('a11ySwitchTab', 'Switch to {{tab}} tab', { tab })}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {t(`tabs.${tab}`, tab.charAt(0).toUpperCase() + tab.slice(1))}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {isLoading && displayList.length === 0 ? (
          <View style={[styles.emptyState, { paddingTop: 60 }]}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.emptyDesc, { marginTop: 16 }]}>Loading your bookings...</Text>
          </View>
        ) : displayList.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconGlow}>
              <View style={styles.emptyIconCircle}>
                <Icon name="calendar-star" size={48} color={theme.colors.primary} />
              </View>
            </View>
            <Text style={styles.emptyTitle}>{t('emptyTitle', 'No {{tab}} bookings', { tab: activeTab })}</Text>
            <Text style={styles.emptyDesc}>{t('emptyDesc', 'You don\'t have any experiences scheduled in this section right now.')}</Text>
            <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8} onPress={() => navigation.navigate('DiscoverTab')} accessibilityRole="button" accessibilityLabel={t('a11yDiscoverCompanions', 'Discover Companions')}>
              <Text style={styles.primaryBtnText}>{t('primaryBtnText', 'Discover Companions')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          displayList.map((booking) => (
            <TouchableOpacity 
              key={booking.id} 
              style={styles.card} 
              activeOpacity={0.9}
              onPress={() => handlePressCard(booking)} accessibilityRole="button" accessibilityLabel={t('a11yViewBookingDetails', 'View booking details')}
            >
              {/* Top Section: ID & Status */}
              <View style={styles.cardTopRow}>
                <Text style={styles.bookingId}>{booking.displayId}</Text>
                {renderStatusBadge(booking.displayStatus)}
              </View>

              {/* Profile & Activity Section */}
              <View style={styles.profileRow}>
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>{booking.companionName.charAt(0)}</Text>
                </View>
                <View style={styles.profileInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.companionName}>{booking.companionName}</Text>
                    <View style={styles.ratingBadge}>
                      <Icon name="star" size={10} color={theme.colors.primary} />
                      <Text style={styles.ratingText}>{booking.rating}</Text>
                    </View>
                  </View>
                  <Text style={styles.activityText}>{booking.activity}</Text>
                </View>
              </View>

              <View style={styles.cardDivider} />

              {/* Itinerary Grid */}
              <View style={styles.itineraryGrid}>
                <View style={styles.gridItem}>
                  <Icon name="calendar-month-outline" size={18} color={theme.colors.primary} style={styles.gridIcon} />
                  <View>
                    <Text style={styles.gridLabel}>{t('gridLabelDate', 'Date')}</Text>
                    <Text style={styles.gridValue}>{booking.date}</Text>
                  </View>
                </View>
                <View style={styles.gridItem}>
                  <Icon name="clock-outline" size={18} color={theme.colors.primary} style={styles.gridIcon} />
                  <View>
                    <Text style={styles.gridLabel}>{t('gridLabelTime', 'Time ({{duration}})', { duration: booking.duration })}</Text>
                    <Text style={styles.gridValue}>{booking.time.split(' - ')[0]}</Text>
                  </View>
                </View>
              </View>

              {/* Venue & Total */}
              <View style={styles.cardFooter}>
                <View style={styles.venueContainer}>
                  <Icon name="map-marker-outline" size={16} color={theme.colors.textSecondary} />
                  <Text style={styles.venueText} numberOfLines={1}>
                    {typeof booking.venue === 'object' ? (booking.venue as any)?.name : String(booking.venue || 'Public Venue')}
                  </Text>
                </View>
                <View style={styles.priceContainer}>
                  <Text style={styles.priceValue}>{booking.price}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 },
  headerTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: theme.colors.textPrimary, letterSpacing: 0.5 },
  headerIconBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20 },
  headerSubtitle: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 4 },
  
  tabWrapper: { paddingHorizontal: 20, marginBottom: 20 },
  tabContainer: { 
    flexDirection: 'row', 
    backgroundColor: theme.colors.background, 
    borderRadius: 16, 
    padding: 6,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  tabBtnActive: { backgroundColor: theme.colors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 4, elevation: 5 },
  tabText: { fontSize: 13, color: theme.colors.textSecondary, fontWeight: '600' },
  tabTextActive: { color: theme.colors.primary, fontWeight: 'bold' },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 20 },
  
  card: { 
    backgroundColor: theme.colors.surface, 
    borderRadius: 20, 
    padding: 20, 
    borderWidth: 1, 
    borderColor: 'rgba(212, 175, 55, 0.2)', // Subtle gold border for luxury
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  bookingId: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: '700', letterSpacing: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 },

  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 16, width: '100%' },
  avatarPlaceholder: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255, 255, 255, 0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: theme.colors.primary },
  avatarInitials: { color: theme.colors.primary, fontSize: 20, fontWeight: 'bold' },
  profileInfo: { flex: 1, justifyContent: 'center' },
  companionName: { fontSize: 18, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 4, flexShrink: 1 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(212, 175, 55, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, gap: 4 },
  ratingText: { color: theme.colors.primary, fontSize: 10, fontWeight: 'bold' },
  activityText: { fontSize: 13, color: theme.colors.textSecondary, flexShrink: 1 },
  
  cardDivider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 20 },
  
  itineraryGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, gap: 12 },
  gridItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  gridIcon: { marginRight: 12, backgroundColor: 'rgba(212, 175, 55, 0.1)', padding: 8, borderRadius: 12 },
  gridLabel: { fontSize: 11, color: theme.colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  gridValue: { fontSize: 13, color: theme.colors.textPrimary, fontWeight: 'bold', flexShrink: 1 },

  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(0, 0, 0, 0.2)', padding: 12, borderRadius: 12 },
  venueContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, paddingRight: 10 },
  venueText: { fontSize: 12, color: theme.colors.textSecondary, flexShrink: 1 },
  priceContainer: { backgroundColor: theme.colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  priceValue: { fontSize: 14, color: theme.colors.background, fontWeight: 'bold' },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyIconGlow: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(212, 175, 55, 0.05)', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.primary },
  emptyTitle: { fontSize: 22, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 12 },
  emptyDesc: { fontSize: 15, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 32, paddingHorizontal: 30, lineHeight: 22 },
  primaryBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 30, shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  primaryBtnText: { color: theme.colors.background, fontSize: 16, fontWeight: 'bold' },
});
