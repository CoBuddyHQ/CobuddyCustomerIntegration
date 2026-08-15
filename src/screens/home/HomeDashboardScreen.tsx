import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { CompanionCard } from '../../components/ui/CompanionCard';
import { CompanionCardSkeleton } from '../../components/ui/CompanionCardSkeleton';
import { DUMMY_FEATURED, MOCK_PROFILE } from '../../services/mock';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useUserPreferencesStore } from '../../store/slices/userPreferencesStore';
import { selectInterests } from '../../store/selectors/userPreferencesSelectors';
import { INTEREST_MAPPING } from '../../services/mock/interestMapping';
import { useBookingStore } from '../../store/slices/bookingStore';
import { selectActiveBooking } from '../../store/selectors/bookingSelectors';
import { useAuthStore } from '../../store/slices/authStore';
import { discoveryApi, bookingApi, CompanionCard as CompanionCardType } from '../../services/api';


export const HomeDashboardScreen = () => {
  const { t } = useTranslation('home.dashboard');

  const EXPLORE_CATEGORIES = React.useMemo(() => [
  { id: 'coffee', title: t('categories.coffeeMeetups', 'Coffee Meetups'), icon: 'coffee', color: '#D4AF37' },
  { id: 'movie', title: t('categories.movieBuffs', 'Movie Buffs'), icon: 'movie', color: '#E11D48' },
  { id: 'city', title: t('categories.cityWalk', 'City Walk'), icon: 'map-marker', color: '#10B981' },
  { id: 'study', title: t('categories.studyBuddy', 'Study Buddy'), icon: 'book', color: '#3B82F6' },
], [t]);

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [loading, setLoading] = useState(true);
  const [featuredList, setFeaturedList] = useState<CompanionCardType[]>([]);
  const user = useAuthStore(state => state.user);
  const selectedInterests = useUserPreferencesStore(selectInterests);

  const sortedExploreCategories = React.useMemo(() => {
    if (!selectedInterests || selectedInterests.length === 0) return EXPLORE_CATEGORIES;

    const userCategoryIds = new Set<string>();
    selectedInterests.forEach(interestId => {
      const mapping = INTEREST_MAPPING[interestId];
      if (mapping && mapping.categoryId) {
        userCategoryIds.add(mapping.categoryId);
      }
    });

    return [...EXPLORE_CATEGORIES].sort((a, b) => {
      const aMatches = userCategoryIds.has(a.id);
      const bMatches = userCategoryIds.has(b.id);
      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;
      return 0;
    });
  }, [selectedInterests, EXPLORE_CATEGORIES]);

  // In real app, this comes from global state or API
  const activeBooking = useBookingStore(selectActiveBooking);
  const hasActiveBooking = !!activeBooking;

  useEffect(() => {
    let isMounted = true;
    const loadHomeData = async () => {
      setLoading(true);
      try {
        const featured = await discoveryApi.getFeaturedCompanions();
        if (isMounted && featured && featured.length > 0) {
          setFeaturedList(featured);
        } else if (isMounted) {
          setFeaturedList(DUMMY_FEATURED as unknown as CompanionCardType[]);
        }
      } catch {
        if (isMounted) {
          setFeaturedList(DUMMY_FEATURED as unknown as CompanionCardType[]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadHomeData();
    return () => {
      isMounted = false;
    };
  }, []);

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
            <View style={styles.notifDot} />
            <Icon name="bell-outline" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>{t('greeting')} <Text style={styles.welcomeName}>{user?.name || MOCK_PROFILE.name}</Text></Text>
          <Text style={styles.subtitleText}>{t('subtitle')}</Text>
        </View>



        {hasActiveBooking ? (
          <>
            {/* Active Meetup Card */}
            <View style={styles.cardSection}>
              <View style={styles.cardHeader}>
                <Icon name="calendar-check" size={16} color={theme.colors.primary} />
                <Text style={styles.cardSectionTitle}>{t('upcoming.title')}</Text>
              </View>
              
              <View style={styles.activeCard}>
                <View style={styles.activeCardTop}>
                  <View style={styles.badgeRow}>
                    <View style={styles.badgeSolid}>
                      <Icon name="check" size={12} color={theme.colors.background} />
                      <Text style={styles.badgeSolidText}>{t('upcoming.status')}</Text>
                    </View>
                  </View>
                  <Text style={styles.activeMeetupTitle}>{activeBooking?.activity}</Text>
                  <Text style={styles.activeMeetupTime}>{activeBooking?.time} · {activeBooking?.venue} · {t('upcoming.idVerified', 'ID Verified')}</Text>
                </View>
                <TouchableOpacity style={styles.arrowBtn} accessibilityRole="button" accessibilityLabel={t('a11yArrowRight', 'Arrow Right')}>
                  <Icon name="arrow-right" size={20} color={theme.colors.background} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Today's Itinerary Timeline */}
            <View style={styles.itineraryCard}>
              <View style={styles.itineraryHeaderRow}>
                <Text style={styles.itineraryTitle}>{t('itinerary.title')}</Text>
                <TouchableOpacity accessibilityRole="button" accessibilityLabel={t('a11yDotsHorizontal', 'Dots Horizontal')}>
                  <Icon name="dots-horizontal" size={24} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.timelineContainer}>
                {/* Start Node */}
                <View style={styles.timelineNode}>
                  <View style={styles.nodeIconContainer}>
                    <View style={styles.nodeDotActive} />
                  </View>
                  <View style={styles.nodeContent}>
                    <Text style={styles.nodeTime}>16:00 - 18:00</Text>
                    <Text style={styles.nodeTitle}>{t('itinerary.start')}</Text>
                    <Text style={styles.nodeDesc}>{t('itinerary.start_desc')}</Text>
                  </View>
                </View>

                {/* Line connecting nodes */}
                <View style={styles.timelineLine} />

                {/* End Node */}
                <View style={styles.timelineNode}>
                  <View style={styles.nodeIconContainer}>
                    <View style={styles.nodeDotInactive} />
                  </View>
                  <View style={styles.nodeContent}>
                    <Text style={styles.nodeTimeMuted}>18:00</Text>
                    <Text style={styles.nodeTitleMuted}>{t('itinerary.end')}</Text>
                    <Text style={styles.nodeDescMuted}>{t('itinerary.end_desc')}</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.fullItineraryBtn} accessibilityRole="button" accessibilityLabel={t('a11yViewFullItinerary', 'View full itinerary')}>
                <Text style={styles.fullItineraryText}>{t('itinerary.view_full')}</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          /* Explore Activities Section */
          <View style={styles.exploreSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>{t('exploreActivities', 'Explore Activities')}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.exploreScroll}>
              {sortedExploreCategories.map(cat => (
                <TouchableOpacity 
                  key={cat.id} 
                  style={styles.exploreCard}
                  onPress={() => navigation.navigate('DiscoverTab', { 
                    screen: 'DiscoverScreen', 
                    initial: false,
                    params: { category: cat.id } 
                  })} accessibilityRole="button" accessibilityLabel={cat.title}
                >
                  <View style={[styles.exploreIconBox, { backgroundColor: `${cat.color}20` }]}>
                    <Icon name={cat.icon} size={28} color={cat.color} />
                  </View>
                  <Text style={styles.exploreCardTitle}>{cat.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Quick Access Grid */}
        <View style={styles.quickAccessSection}>
          <Text style={styles.sectionTitleSmall}>{t('quick_access.title')}</Text>
          <View style={styles.gridRow}>
            
            <TouchableOpacity 
              style={styles.gridItem}
              onPress={() => navigation.navigate('DiscoverTab')} accessibilityRole="button" accessibilityLabel={t('a11yGoToDiscovertab', 'Go to DiscoverTab')}
            >
              <View style={[styles.gridIconCircle, { backgroundColor: 'rgba(212, 175, 55, 0.1)' }]}>
                <Icon name="account-search" size={24} color={theme.colors.primary} />
              </View>
              <Text style={styles.gridText}>{t('quick_access.find')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.gridItem}
              onPress={() => navigation.navigate('BookingsTab')} accessibilityRole="button" accessibilityLabel={t('a11yGoToBookingstab', 'Go to BookingsTab')}
            >
              <View style={[styles.gridIconCircle, { backgroundColor: 'rgba(212, 175, 55, 0.1)' }]}>
                <Icon name="calendar-clock" size={24} color={theme.colors.primary} />
              </View>
              <Text style={styles.gridText}>{t('quick_access.bookings')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.gridItem}
              onPress={() => navigation.navigate('SafetySupportStack', { screen: 'SafetyHubScreen' })} accessibilityRole="button" accessibilityLabel={t('a11yGoToProfiletab', 'Go to ProfileTab')}
            >
              <View style={[styles.gridIconCircle, { backgroundColor: 'rgba(212, 175, 55, 0.1)' }]}>
                <Icon name="shield-check" size={24} color={theme.colors.primary} />
              </View>
              <Text style={styles.gridText}>{t('quick_access.safety')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.gridItem}
              onPress={() => navigation.navigate('ProfileTab')} accessibilityRole="button" accessibilityLabel={t('a11yGoToProfiletab', 'Go to ProfileTab')}
            >
              <View style={[styles.gridIconCircle, { backgroundColor: 'rgba(212, 175, 55, 0.1)' }]}>
                <Icon name="account-outline" size={24} color={theme.colors.primary} />
              </View>
              <Text style={styles.gridText}>{t('quick_access.profile')}</Text>
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
            ) : (
              (featuredList.length > 0 ? featuredList : DUMMY_FEATURED).map((item) => (
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
