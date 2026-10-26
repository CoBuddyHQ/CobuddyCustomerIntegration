import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { SmartHeader } from '../../components/ui/SmartHeader';
import { notificationsApi, bookingApi, Notification as ApiNotification } from '../../services/api';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type NotificationCategory = 'All' | 'request' | 'session' | 'safety' | 'payout' | 'support' | 'policy' | 'training' | 'system' | 'wallet' | 'promotion' | 'reminder';

interface NotificationItem {
  id: string;
  category: string;
  title: string;
  description: string;
  time: string;
  isRead: boolean;
  icon: string;
  iconColor: string;
  route: string;
  stack?: string; // Optional stack for cross-tab navigation
  routeParams?: Record<string, unknown>;
}

const CATEGORIES: string[] = ['All', 'request', 'session', 'safety', 'payout', 'support', 'policy', 'training', 'system', 'wallet', 'promotion', 'reminder'];

const formatRelativeTime = (dateString?: string): string => {
  if (!dateString) return 'Now';
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export const NotificationsScreen = () => { 
  const { t } = useTranslation('home.notifications');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchNotifications = useCallback(async () => {
    try {
      const list = await notificationsApi.listNotifications();
      if (list && Array.isArray(list)) {
        setNotifications(list.map((n: ApiNotification) => ({
          id: n.id,
          category: (n.category || ((n.data?.category as string) || 'All')) as NotificationCategory,
          title: n.title,
          description: n.description || n.body || '',
          time: formatRelativeTime(n.createdAt),
          isRead: n.isRead ?? false,
          icon: n.icon || (n.category === 'Security' ? 'shield-alert' : n.category === 'Wallet' ? 'wallet-plus' : 'calendar-check'),
          iconColor: n.iconColor || (n.category === 'Security' ? theme.colors.error : theme.colors.primary),
          route: n.route || 'HomeTab',
          stack: n.stack,
          routeParams: (n.routeParams || n.data || {}) as Record<string, unknown>,
        })));
      }
      setLoadError(false);
      setErrorMessage('');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || String(err);
      console.error('[NotificationsScreen] fetchNotifications error:', msg);
      setErrorMessage(msg);
      setLoadError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
      const interval = setInterval(() => {
        fetchNotifications();
      }, 5000);
      return () => clearInterval(interval);
    }, [fetchNotifications])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const filteredNotifications = notifications.filter(n => activeCategory === 'All' || n.category === activeCategory);

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      await notificationsApi.markAllNotificationsAsRead();
    } catch {
      // Ignored
    }
  };

  const handleNotificationPress = async (notification: NotificationItem) => {
    // Mark as read locally
    setNotifications(prev => 
      prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
    );
    try {
      await notificationsApi.markNotificationAsRead(notification.id);
    } catch {
      // Ignored
    }

    const title = (notification.title || '').toLowerCase();
    const routeParams = (notification.routeParams || {}) as Record<string, any>;
    let targetRoute = notification.route;

    // Resolve bookingId if missing in notification params
    let targetBookingId = routeParams.bookingId || routeParams.id;
    if (!targetBookingId && (title.includes('booking') || title.includes('session') || notification.category === 'booking' || notification.category === 'session')) {
      try {
        const bookings = await bookingApi.listBookings();
        if (bookings && bookings.length > 0) {
          targetBookingId = bookings[0].id;
        }
      } catch {
        // Fallback
      }
    }

    const rootNav = (navigation.getParent() || navigation) as any;

    if (title.includes('review') || targetRoute === 'SessionFeedbackScreen' || targetRoute === 'CompanionReviewScreen') {
      const reviewParams = { ...routeParams, bookingId: targetBookingId || routeParams.bookingId };
      rootNav.navigate('LiveSessionStack', { screen: 'CompanionReviewScreen', params: reviewParams });
    } else if (title.includes('started') || (targetRoute === 'ActiveSessionScreen' && !title.includes('accepted'))) {
      const sessionParams = { ...routeParams, bookingId: targetBookingId || routeParams.bookingId };
      rootNav.navigate('LiveSessionStack', { screen: 'ActiveSessionScreen', params: sessionParams });
    } else if (title.includes('counter') || targetRoute === 'BookingCounterOfferScreen') {
      const counterParams = { ...routeParams, bookingId: targetBookingId || routeParams.bookingId };
      rootNav.navigate('BookingFlowStack', { screen: 'BookingCounterOfferScreen', params: counterParams });
    } else {
      // Booking acceptance, booking request sent, status update, cancelled, etc.
      if (targetBookingId) {
        navigation.navigate('BookingDetailScreen' as any, { bookingId: targetBookingId, status: routeParams.status });
      } else {
        rootNav.navigate('BookingsTab', { screen: 'BookingsListScreen' });
      }
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      {/* Header */}
      <SmartHeader 
        title={t('title.Notifications', 'Notifications')} 
        fallbackTab="HomeTab"
        rightAction={
          notifications.some(n => !n.isRead) ? (
            <TouchableOpacity onPress={handleMarkAllRead} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={t('a11yMarkAllRead', 'Mark all read')}>
              <Text style={styles.markReadText}>{t('markAllRead', 'Mark all read')}</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      {/* Categories Horizontal Scroll */}
      <View style={styles.categoriesWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.categoriesContainer}
        >
          {CATEGORIES.map(category => {
            const isActive = activeCategory === category;
            return (
              <TouchableOpacity
                key={category}
                activeOpacity={0.8}
                onPress={() => setActiveCategory(category)}
                style={[
                  styles.categoryChip,
                  isActive && styles.categoryChipActive
                ]} accessibilityRole="button" accessibilityLabel={t('a11yCategory', 'category')}
              >
                <Text style={[
                  styles.categoryChipText,
                  isActive && styles.categoryChipTextActive
                ]}>
                  {t(`category.${category.toLowerCase()}`, category)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Notifications List */}
      <ScrollView 
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : loadError ? (
          <View style={styles.emptyState}>
            <Text accessibilityRole="alert" style={styles.emptyTitle}>Notifications are unavailable</Text>
            {errorMessage ? <Text style={[styles.emptySub, { color: theme.colors.error, marginTop: 8 }]}>{errorMessage}</Text> : null}
            <TouchableOpacity 
              onPress={() => { setLoading(true); setLoadError(false); fetchNotifications(); }} 
              style={{ marginTop: 16, backgroundColor: theme.colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 }}
            >
              <Text style={{ color: '#000', fontWeight: 'bold' }}>Tap to Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="bell-sleep-outline" size={64} color="rgba(255,255,255,0.1)" />
            <Text style={styles.emptyTitle}>{t('emptyTitle', 'All Caught Up!')}</Text>
            <Text style={styles.emptySub}>{t('emptySub', 'You have no notifications in this category right now.')}</Text>
          </View>
        ) : (
          filteredNotifications.map((notif, index) => (
            <TouchableOpacity 
              key={notif.id}
              activeOpacity={0.7}
              onPress={() => handleNotificationPress(notif)}
              style={[
                styles.notifCard,
                !notif.isRead && styles.notifCardUnread,
                index === filteredNotifications.length - 1 && styles.lastCard
              ]} accessibilityRole="button" accessibilityLabel={t('a11yOpenNotification', 'Open notification')}
            >
              {/* Unread Indicator */}
              {!notif.isRead && <View style={styles.unreadDot} />}

              {/* Icon */}
              <View style={[styles.iconWrapper, { backgroundColor: `${notif.iconColor}15`, borderColor: `${notif.iconColor}30` }]}>
                <Icon name={notif.icon} size={22} color={notif.iconColor} />
              </View>

              {/* Content */}
              <View style={styles.notifContent}>
                <View style={styles.notifHeader}>
                  <Text style={[styles.notifTitle, !notif.isRead && styles.notifTitleUnread]} numberOfLines={1}>
                    {t(`items.${notif.id}.title`, notif.title)}
                  </Text>
                  <Text style={styles.notifTime}>{notif.time}</Text>
                </View>
                <Text style={styles.notifDesc} numberOfLines={2}>
                  {t(`items.${notif.id}.description`, notif.description)}
                </Text>
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
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: theme.colors.textPrimary },
  markReadText: { fontSize: 13, color: theme.colors.primary, fontWeight: '600' },

  categoriesWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  categoryChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  categoryChipTextActive: {
    color: theme.colors.background,
    fontWeight: 'bold',
  },

  listContent: {
    padding: 16,
    paddingBottom: 40,
  },

  notifCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  notifCardUnread: {
    backgroundColor: 'rgba(212, 175, 55, 0.03)', // Subtle gold tint
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  lastCard: {
    marginBottom: 0,
  },
  
  unreadDot: {
    position: 'absolute',
    top: 16,
    left: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
  },
  
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginRight: 16,
  },
  
  notifContent: {
    flex: 1,
    justifyContent: 'center',
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notifTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    marginRight: 8,
  },
  notifTitleUnread: {
    fontWeight: 'bold',
  },
  notifTime: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  notifDesc: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  }
});
