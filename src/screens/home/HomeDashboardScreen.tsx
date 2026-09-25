import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { CompanionCard } from '../../components/ui/CompanionCard';
import { CompanionCardSkeleton } from '../../components/ui/CompanionCardSkeleton';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useUserPreferencesStore } from '../../store/slices/userPreferencesStore';
import { selectInterests } from '../../store/selectors/userPreferencesSelectors';
import { INTEREST_MAPPING } from '../../services/mock/interestMapping';
import { useBookingStore } from '../../store/slices/bookingStore';
import { selectActiveBooking } from '../../store/selectors/bookingSelectors';
import { useAuthStore } from '../../store/slices/authStore';
import { discoveryApi, bookingApi, profileApi, notificationsApi, CompanionCard as CompanionCardType } from '../../services/api';

const DEFAULT_CATEGORIES: discoveryApi.HomeCategory[] = [
  { id: 'coffee', title: 'Coffee Meetups', icon: 'coffee', color: '#D4AF37' },
  { id: 'movie', title: 'Movie Buffs', icon: 'movie', color: '#E11D48' },
  { id: 'city', title: 'City Walk', icon: 'map-marker', color: '#10B981' },
  { id: 'study', title: 'Study Buddy', icon: 'book', color: '#3B82F6' },
  { id: 'shopping', title: 'Shopping & Lifestyle', icon: 'shopping', color: '#8B5CF6' },
];

const DEFAULT_FEATURED_LIST: CompanionCardType[] = [
  {
    id: 'c1',
    name: 'Elena Vasquez',
    age: 26,
    initials: 'EV',
    title: 'City guide & local experiences expert',
    bio: "Hi! I love exploring new cafes in the city and talking about art, literature, and movies.",
    trustScore: 98,
    rating: 4.97,
    reviews: 124,
    sessions: 312,
    rate: '₹500 /hr',
    distance: '2.5 km away',
    isOnline: true,
    category: 'coffee',
    gender: 'Female',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 'c2',
    name: 'Aisha Sharma',
    age: 24,
    initials: 'AS',
    title: 'Shopping & lifestyle companion',
    bio: 'Fashion lover, shopping enthusiast and great listener.',
    trustScore: 97,
    rating: 5.0,
    reviews: 76,
    sessions: 150,
    rate: '₹400 /hr',
    distance: '3.0 km away',
    isOnline: true,
    category: 'shopping',
    gender: 'Female',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800',
  },
];

export const HomeDashboardScreen = () => {
  const { t } = useTranslation('home.dashboard');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<discoveryApi.HomeCategory[]>(DEFAULT_CATEGORIES);
  const [featuredList, setFeaturedList] = useState<CompanionCardType[]>(DEFAULT_FEATURED_LIST);
  const [notificationCount, setNotificationCount] = useState(0);
  const [bookingCount, setBookingCount] = useState(0);
  const [activeBooking, setActiveBooking] = useState<any | null>(null);

  const { user, updateUser } = useAuthStore();
  const selectedInterests = useUserPreferencesStore(selectInterests);

  const sortedCategories = React.useMemo(() => {
    if (!categories || categories.length === 0) return DEFAULT_CATEGORIES;
    if (!selectedInterests || selectedInterests.length === 0) return categories;

    const userCategoryIds = new Set<string>();
    selectedInterests.forEach(interestId => {
      const mapping = INTEREST_MAPPING[interestId];
      if (mapping && mapping.categoryId) {
        userCategoryIds.add(mapping.categoryId);
      }
    });

    return [...categories].sort((a, b) => {
      const aMatches = userCategoryIds.has(a.id);
      const bMatches = userCategoryIds.has(b.id);
      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;
      return 0;
    });
  }, [selectedInterests, categories]);

  const loadHomeData = useCallback(async () => {
    setError(null);
    try {
      const homeData = await discoveryApi.getHomeDashboardData();

      if (homeData) {
        if (homeData.categories && homeData.categories.length > 0) {
          setCategories(homeData.categories);
        }
        if (homeData.featuredCompanions && homeData.featuredCompanions.length > 0) {
          setFeaturedList(homeData.featuredCompanions);
        }
        setNotificationCount(homeData.quickAccess?.notificationCount || 0);
        setBookingCount(homeData.quickAccess?.bookingCount || 0);
        setActiveBooking(homeData.activeBooking || null);

        if (homeData.profile?.name) {
          updateUser({
            name: homeData.profile.name,
            avatar: homeData.profile.photoUrl || null,
            city: homeData.profile.city || null,
            gender: homeData.profile.gender || null,
          });
        }
      }
    } catch (err: any) {
      console.error('[HomeDashboardScreen] Error loading home data:', err);
      setError('Unable to load home data. Tap to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [updateUser]);

  useEffect(() => {
    loadHomeData();
  }, [loadHomeData]);
  

  useFocusEffect(
    useCallback(() => {
      loadHomeData();
    }, [loadHomeData])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadHomeData();
  };

  const hasActiveBooking = !!activeBooking;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      
      {/* Top Header */}
      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>C</Text>
          </View>
          <Text style={styles.logoText}>{t('appName', 'CoBuddy')}</Text>
        </View>
        <View style={styles.topRightIcons}>
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7} onPress={() => navigation.navigate('NotificationsScreen')} accessibilityRole="button" accessibilityLabel={t('a11yNotifications', 'Notifications')}>
            {notificationCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{notificationCount > 9 ? '9+' : notificationCount}</Text>
              </View>
            )}
            <Icon name="bell-outline" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
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
        
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>{t('greeting', 'Welcome,')} <Text style={styles.welcomeName}>{user?.name || 'Member'}</Text></Text>
          <Text style={styles.subtitleText}>{t('subtitle', 'Find verified local companions for your daily activities')}</Text>
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <Icon name="alert-circle-outline" size={32} color={theme.colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadHomeData}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {hasActiveBooking ? (
          <>
            {/* Active Meetup Card */}
            <View style={styles.cardSection}>
              <View style={styles.cardHeader}>
                <Icon name="calendar-check" size={16} color={theme.colors.primary} />
                <Text style={styles.cardSectionTitle}>{t('upcoming.title', 'UPCOMING MEETUP')}</Text>
              </View>
              
              <View style={styles.activeCard}>
                <View style={styles.activeCardTop}>
                  <View style={styles.badgeRow}>
                    <View style={styles.badgeSolid}>
                      <Icon name="check" size={12} color={theme.colors.background} />
                      <Text style={styles.badgeSolidText}>{t('upcoming.status', 'Confirmed')}</Text>
                    </View>
                  </View>
                  <Text style={styles.activeMeetupTitle}>{activeBooking?.activityName || activeBooking?.activity}</Text>
                  <Text style={styles.activeMeetupTime}>
                    {activeBooking?.scheduledStart ? new Date(activeBooking.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'} · {typeof activeBooking?.venue === 'object' ? (activeBooking?.venue as any)?.name : (activeBooking?.venueName || activeBooking?.venue || 'City Spot')} · {t('upcoming.idVerified', 'ID Verified')}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.arrowBtn} 
                  onPress={() => navigation.navigate('BookingsTab')}
                  accessibilityRole="button" 
                  accessibilityLabel={t('a11yArrowRight', 'View Booking')}
                >
                  <Icon name="arrow-right" size={20} color={theme.colors.background} />
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          /* Explore Activities Section */
          <View style={styles.exploreSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>{t('exploreActivities', 'Explore Activities')}</Text>
            </View>
            {loading ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.exploreScroll}>
                <View style={styles.exploreSkeleton} />
                <View style={styles.exploreSkeleton} />
                <View style={styles.exploreSkeleton} />
              </ScrollView>
            ) : sortedCategories.length === 0 ? (
              <View style={styles.emptyContainerSmall}>
                <Text style={styles.emptyTextSmall}>No activities available</Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.exploreScroll}>
                {sortedCategories.map(cat => (
                  <TouchableOpacity 
                    key={cat.id} 
                    style={styles.exploreCard}
                    onPress={() => navigation.navigate('DiscoverTab', { 
                      screen: 'DiscoverScreen', 
                      initial: false,
                      params: { category: cat.id } 
                    })} 
                    accessibilityRole="button" 
                    accessibilityLabel={cat.title}
                  >
                    <View style={[styles.exploreIconBox, { backgroundColor: `${cat.color || '#D4AF37'}20` }]}>
                      <Icon name={cat.icon || 'star-outline'} size={28} color={cat.color || theme.colors.primary} />
                    </View>
                    <Text style={styles.exploreCardTitle}>{cat.title}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* Quick Access Grid */}
        <View style={styles.quickAccessSection}>
          <Text style={styles.sectionTitleSmall}>{t('quick_access.title', 'QUICK ACCESS')}</Text>
          <View style={styles.gridRow}>
            
            <TouchableOpacity 
              style={styles.gridItem}
              onPress={() => navigation.navigate('DiscoverTab')} accessibilityRole="button" accessibilityLabel={t('a11yGoToDiscovertab', 'Go to DiscoverTab')}
            >
              <View style={[styles.gridIconCircle, { backgroundColor: 'rgba(212, 175, 55, 0.1)' }]}>
                <Icon name="account-search" size={24} color={theme.colors.primary} />
              </View>
              <Text style={styles.gridText}>{t('quick_access.find', 'Find Companion')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.gridItem}
              onPress={() => navigation.navigate('BookingsTab')} accessibilityRole="button" accessibilityLabel={t('a11yGoToBookingstab', 'Go to BookingsTab')}
            >
              <View style={[styles.gridIconCircle, { backgroundColor: 'rgba(212, 175, 55, 0.1)' }]}>
                {bookingCount > 0 && <View style={styles.countBadge}><Text style={styles.countBadgeText}>{bookingCount}</Text></View>}
                <Icon name="calendar-clock" size={24} color={theme.colors.primary} />
              </View>
              <Text style={styles.gridText}>{t('quick_access.bookings', 'My Bookings')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.gridItem}
              onPress={() => navigation.navigate('SafetySupportStack', { screen: 'SafetyHubScreen' })} accessibilityRole="button" accessibilityLabel={t('a11yGoToSafety', 'Go to Safety Toolkit')}
            >
              <View style={[styles.gridIconCircle, { backgroundColor: 'rgba(212, 175, 55, 0.1)' }]}>
                <Icon name="shield-check" size={24} color={theme.colors.primary} />
              </View>
              <Text style={styles.gridText}>{t('quick_access.safety', 'Safety Toolkit')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.gridItem}
              onPress={() => navigation.navigate('ProfileTab')} accessibilityRole="button" accessibilityLabel={t('a11yGoToProfiletab', 'Go to ProfileTab')}
            >
              <View style={[styles.gridIconCircle, { backgroundColor: 'rgba(212, 175, 55, 0.1)' }]}>
                <Icon name="account-outline" size={24} color={theme.colors.primary} />
              </View>
              <Text style={styles.gridText}>{t('quick_access.profile', 'My Profile')}</Text>
            </TouchableOpacity>

          </View>
        </View>

        {/* Featured Companions Section */}
        <View style={styles.featuredSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>{t('featuredCompanions', 'Featured Companions')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('DiscoverTab')} accessibilityRole="button" accessibilityLabel={t('a11yViewAll', 'View All')}>
              <Text style={styles.viewAllText}>{t('viewAll', 'View All')}</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredScroll}>
            {loading ? (
              <>
                <View style={[styles.featuredCardWrapper, { width: 320 }]}>
                  <CompanionCardSkeleton />
                </View>
                <View style={[styles.featuredCardWrapper, { width: 320 }]}>
                  <CompanionCardSkeleton />
                </View>
              </>
            ) : featuredList.length === 0 ? (
              <View style={styles.emptyContainerSmall}>
                <Text style={styles.emptyTextSmall}>No companions available right now</Text>
              </View>
            ) : (
              featuredList.map((item) => (
                <View key={item.id} style={styles.featuredCardWrapper}>
                  <CompanionCard
                    {...item}
                    onPress={(id) => navigation.navigate('CompanionProfileScreen', {
                      companionId: id
                    } as never)}
                  />
                </View>
              ))
            )}
          </ScrollView>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  logoBadgeText: {
    color: theme.colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  topRightIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.error,
    zIndex: 1,
  },
  notifBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    zIndex: 1,
  },
  notifBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  countBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    zIndex: 1,
  },
  countBadgeText: {
    color: theme.colors.background,
    fontSize: 10,
    fontWeight: 'bold',
  },
  errorCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: theme.colors.error,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  retryBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  emptyContainerSmall: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emptyTextSmall: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontStyle: 'italic',
  },
  exploreSkeleton: {
    width: 120,
    height: 120,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    opacity: 0.6,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  welcomeSection: {
    marginTop: 20,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  welcomeText: {
    fontSize: 24,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  welcomeName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  subtitleText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    lineHeight: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  sectionTitleSmall: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    letterSpacing: 1.5,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  exploreSection: {
    marginBottom: 24,
  },
  exploreScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  exploreCard: {
    backgroundColor: theme.colors.surface,
    width: 120,
    height: 120,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'space-between',
  },
  exploreIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exploreCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  cardSection: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  cardSectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    letterSpacing: 1.5,
  },
  activeCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  activeCardTop: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  badgeSolid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  badgeSolidText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.background,
  },
  activeMeetupTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  activeMeetupTime: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  arrowBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itineraryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  itineraryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  itineraryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  timelineContainer: {
    paddingLeft: 8,
    marginBottom: 24,
  },
  timelineNode: {
    flexDirection: 'row',
  },
  nodeIconContainer: {
    width: 24,
    alignItems: 'center',
    marginRight: 16,
  },
  nodeDotActive: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
    marginTop: 4,
  },
  nodeDotInactive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.textSecondary,
    marginTop: 4,
  },
  timelineLine: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginLeft: 11,
    marginVertical: -4,
  },
  nodeContent: {
    flex: 1,
  },
  nodeTime: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  nodeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  nodeDesc: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  nodeTimeMuted: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  nodeTitleMuted: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  nodeDescMuted: {
    fontSize: 14,
    color: 'rgba(160, 164, 184, 0.5)',
  },
  fullItineraryBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  fullItineraryText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    letterSpacing: 1.5,
  },
  quickAccessSection: {
    marginTop: 10,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  gridItem: {
    alignItems: 'center',
    width: '23%',
  },
  gridIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  gridText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  featuredSection: {
    marginTop: 32,
  },
  featuredScroll: {
    paddingHorizontal: 20,
    gap: 16,
  },
  featuredCardWrapper: {
    width: 320,
  },
  viewAllText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
});
