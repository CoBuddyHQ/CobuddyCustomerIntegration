import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, Animated, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { AppBottomSheet } from '../../components/ui/AppBottomSheet';
import { DUMMY_PROFILE, DUMMY_COMPANIONS, DUMMY_FEATURED } from '../../services/mock';
import { discoveryApi, accountApi, CompanionDetail as CompanionDetailType } from '../../services/api';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';

const { width, height } = Dimensions.get('window');
const HERO_HEIGHT = height * 0.55; 

const VERIFICATION_LABEL_KEYS: Record<string, string> = {
  'ID Verified': 'badges.id_verified',
  'Phone Verified': 'badges.phone_verified',
  'Background Checked': 'badges.background_checked',
};

// Dummy data enhanced with details
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';

export const CompanionProfileScreen = ({ route }: { route: RouteProp<RootStackParamList, 'CompanionProfileScreen'> }) => {
  const { companionId } = route?.params || {};
  const matchedCompanion = [...DUMMY_COMPANIONS, ...DUMMY_FEATURED].find(c => c.id === companionId);

  const [apiProfile, setApiProfile] = useState<CompanionDetailType | null>(null);
  const profile = apiProfile
    ? {
        ...DUMMY_PROFILE,
        ...apiProfile,
        name: apiProfile.name || matchedCompanion?.name || DUMMY_PROFILE.name,
        trustScore: apiProfile.trustScore ?? matchedCompanion?.trustScore ?? DUMMY_PROFILE.trustScore,
        distance: apiProfile.distance || matchedCompanion?.distance || DUMMY_PROFILE.distance,
        bio: apiProfile.bio || DUMMY_PROFILE.bio,
        photos: apiProfile.photos && apiProfile.photos.length > 0 ? apiProfile.photos : DUMMY_PROFILE.photos,
      }
    : matchedCompanion
    ? {
        ...DUMMY_PROFILE,
        name: matchedCompanion.name,
        trustScore: matchedCompanion.trustScore,
        distance: matchedCompanion.distance,
        reviews: { ...DUMMY_PROFILE.reviews, count: matchedCompanion.reviews },
        completedSessions: matchedCompanion.sessions,
      }
    : DUMMY_PROFILE;
  const { t } = useTranslation(['companionProfile']);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { smartGoBack } = useSmartNavigation();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [showMenuSheet, setShowMenuSheet] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isMounted = true;
    const fetchDetail = async () => {
      if (!companionId) {
        setLoading(false);
        return;
      }
      try {
        const data = await discoveryApi.getCompanionDetail(companionId);
        if (isMounted && data) {
          setApiProfile(data);
        }
      } catch {
        // Fallback to mock profile
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDetail();
    return () => {
      isMounted = false;
    };
  }, [companionId]);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false } // Need false for backgroundColor/opacity interpolation if used on non-transform
  );

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HERO_HEIGHT - 100, HERO_HEIGHT - 50],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  const onMomentumScrollEnd = (event: import('react-native').NativeSyntheticEvent<import('react-native').NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setActivePhotoIndex(index);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        {/* Edge-to-Edge Hero Skeleton */}
        <View style={styles.heroContainer}>
          <SkeletonLoader width={width} height={HERO_HEIGHT} borderRadius={0} />
          {/* Dark Overlay Skeleton details */}
          <View style={styles.heroOverlay}>
            <View style={styles.heroDetails}>
              <SkeletonLoader width="60%" height={38} borderRadius={8} style={{ marginBottom: 12 }} />
              <SkeletonLoader width="40%" height={18} borderRadius={6} style={{ marginBottom: 16 }} />
              <SkeletonLoader width="30%" height={16} borderRadius={6} />
            </View>
          </View>
        </View>

        {/* Content Body */}
        <View style={styles.contentBody}>
          {/* Quick Stats Row Skeleton */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <SkeletonLoader width={28} height={28} borderRadius={14} style={{ marginBottom: 8 }} />
              <SkeletonLoader width={40} height={16} borderRadius={4} style={{ marginBottom: 4 }} />
              <SkeletonLoader width={60} height={12} borderRadius={4} />
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <SkeletonLoader width={28} height={28} borderRadius={14} style={{ marginBottom: 8 }} />
              <SkeletonLoader width={40} height={16} borderRadius={4} style={{ marginBottom: 4 }} />
              <SkeletonLoader width={60} height={12} borderRadius={4} />
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <SkeletonLoader width={28} height={28} borderRadius={14} style={{ marginBottom: 8 }} />
              <SkeletonLoader width={40} height={16} borderRadius={4} style={{ marginBottom: 4 }} />
              <SkeletonLoader width={60} height={12} borderRadius={4} />
            </View>
          </View>

          {/* About Card Skeleton */}
          <View style={styles.card}>
            <SkeletonLoader width="50%" height={24} borderRadius={6} style={{ marginBottom: 16 }} />
            <SkeletonLoader width="100%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
            <SkeletonLoader width="90%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
            <SkeletonLoader width="70%" height={16} borderRadius={4} style={{ marginBottom: 20 }} />
            
            <View style={styles.tagsContainer}>
              <SkeletonLoader width={80} height={32} borderRadius={16} />
              <SkeletonLoader width={100} height={32} borderRadius={16} />
              <SkeletonLoader width={90} height={32} borderRadius={16} />
            </View>
          </View>
        </View>

        {/* Floating Header Actions (static over skeleton) */}
        <View style={[styles.floatingActions, { top: Math.max(insets.top, 16) + 6 }]}>
          <TouchableOpacity style={styles.iconCircle} onPress={() => smartGoBack('DiscoverTab')} accessibilityRole="button" accessibilityLabel={t('a11yGoBack', 'Go back')}>
            <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={styles.iconCircle}>
              <Icon name="heart-outline" size={22} color={theme.colors.textPrimary} />
            </View>
            <View style={styles.iconCircle}>
              <Icon name="dots-vertical" size={22} color={theme.colors.textPrimary} />
            </View>
          </View>
        </View>

        {/* Premium Bottom Action Bar Skeleton */}
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom + 8, 24), paddingTop: 16, position: 'absolute', bottom: 0, left: 0, right: 0 }]}>
          <View style={styles.bottomBarLeft}>
            <SkeletonLoader width={80} height={14} borderRadius={4} style={{ marginBottom: 6 }} />
            <SkeletonLoader width={120} height={24} borderRadius={6} />
          </View>
          <SkeletonLoader width={160} height={48} borderRadius={24} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      
      {/* Edge-to-Edge Hero Image */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View style={styles.heroContainer}>
          <Animated.ScrollView 
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onMomentumScrollEnd}
          >
            {profile.photos.map((photo, index) => (
              <Image key={index} source={{ uri: photo }} style={styles.heroImage} />
            ))}
          </Animated.ScrollView>
          
          {/* Dark Overlay at bottom of image for contrast */}
          <View style={styles.heroOverlay}>
            <View style={styles.heroDetails}>
              <View style={styles.nameRow}>
                <Text style={styles.heroName}>{profile.name}, {profile.age}</Text>
                <View style={styles.trustBadge}>
                  <Icon name="shield-check" size={16} color={theme.colors.background} />
                  <Text style={styles.trustScore}>{profile.trustScore}</Text>
                </View>
              </View>
              <Text style={styles.heroSubtitle}>{profile.location} • {profile.distance}</Text>
              
              <View style={styles.metaRow}>
                <Text style={[styles.heroSubtitle, { fontSize: 14, opacity: 0.8 }]}>{profile.pronouns}</Text>
                <View style={styles.dotSeparator} />
                <View style={styles.activeStatusRow}>
                  <View style={styles.activeDot} />
                  <Text style={styles.activeStatusText}>{profile.lastActive}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.paginationContainer}>
            {profile.photos.map((_, i) => (
              <View key={i} style={[styles.dot, activePhotoIndex === i && styles.paginationActiveDot]} />
            ))}
          </View>
        </View>

        {/* Content Body */}
        <View style={styles.contentBody}>
          
          {/* Quick Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Icon name="star" size={24} color={theme.colors.primary} />
              <Text style={styles.statValue}>{profile.reviews.average}</Text>
              <Text style={styles.statLabel}>{profile.reviews.count} {t('statReviews', 'Reviews')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Icon name="check-decagram" size={24} color={theme.colors.success} />
              <Text style={styles.statValue}>{profile.completedSessions}</Text>
              <Text style={styles.statLabel}>{t('statSessions', 'Sessions')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Icon name="clock-fast" size={24} color={theme.colors.textSecondary} />
              <Text style={styles.statValue}>{profile.responseTime}</Text>
              <Text style={styles.statLabel}>{t('statResponse', 'Response')}</Text>
            </View>
          </View>

          {/* About Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('aboutName', 'About {{name}}', { name: profile.name })}</Text>
            <Text style={styles.bioText}>{profile.bio}</Text>
            
            <View style={styles.tagsContainer}>
              {profile.languages.map(lang => (
                <View key={lang} style={styles.tag}>
                  <Icon name="translate" size={14} color={theme.colors.textSecondary} />
                  <Text style={styles.tagText}>{lang}</Text>
                </View>
              ))}
              {profile.hobbies.map(hobby => (
                <View key={hobby} style={styles.tag}>
                  <Icon name="heart-outline" size={14} color={theme.colors.textSecondary} />
                  <Text style={styles.tagText}>{hobby}</Text>
                </View>
              ))}
              {profile.personality.map(trait => (
                <View key={trait} style={styles.tag}>
                  <Icon name="account-star-outline" size={14} color={theme.colors.textSecondary} />
                  <Text style={styles.tagText}>{trait}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Services & Pricing Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('servicesPricing', 'Services & Pricing')}</Text>
            {profile.pricing.map((p, idx) => (
              <View key={idx} style={styles.pricingRow}>
                <View style={styles.pricingLeft}>
                  <View style={styles.pricingIconBox}>
                    <Icon name={p.icon} size={20} color={theme.colors.primary} />
                  </View>
                  <Text style={styles.pricingActivity}>{p.activity}</Text>
                </View>
                <Text style={styles.pricingAmount}>{p.price}</Text>
              </View>
            ))}
            <View style={styles.infoRow}>
              <Icon name="map-marker-distance" size={18} color={theme.colors.textSecondary} />
              <Text style={styles.infoText}>{profile.travelPreference}</Text>
            </View>
          </View>

          {/* Availability & Rules Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('availabilityRules', 'Availability & Rules')}</Text>
            <View style={[styles.infoRow, { marginBottom: 16 }]}>
              <Icon name="calendar-clock" size={20} color={theme.colors.textSecondary} />
              <Text style={[styles.infoText, { color: theme.colors.textPrimary, fontWeight: 'bold' }]}>
                {profile.schedule}
              </Text>
            </View>
            
            {profile.rules.map((rule, idx) => (
              <View key={idx} style={styles.ruleRow}>
                <Icon name="check-circle-outline" size={18} color={theme.colors.textSecondary} />
                <Text style={styles.ruleText}>{rule}</Text>
              </View>
            ))}

            <View style={[styles.ruleRow, { marginTop: 8 }]}>
              <Icon name="information-outline" size={18} color={theme.colors.error} />
              <Text style={[styles.ruleText, { color: theme.colors.error }]}>{profile.cancellationPolicy}</Text>
            </View>
          </View>

          {/* Verifications Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('trustVerifications', 'Trust & Verifications')}</Text>
            <Text style={styles.mutedText}>{t('memberSince', 'Member since')} {profile.memberSince}</Text>
            <View style={styles.verificationList}>
              {profile.verifications.map((v, idx) => (
                <View key={idx} style={styles.verifyItem}>
                  <Icon name={v.icon} size={20} color={v.color} />
                  <Text style={styles.verifyLabel}>{t(VERIFICATION_LABEL_KEYS[v.label] || v.label, v.label)}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Reviews Card */}
          <View style={styles.card}>
            <View style={styles.reviewHeader}>
              <Text style={styles.cardTitle}>{t('reviewsCount', 'Reviews ({{count}})', { count: profile.reviews.count })}</Text>
              <Text style={styles.reviewSeeAll}>{t('reviewSeeAll', 'See All')}</Text>
            </View>
            
            <View style={styles.reviewScoresGrid}>
              <View style={styles.reviewScoreItem}>
                <Text style={styles.reviewScoreLabel}>{t('punctuality', 'Punctuality')}</Text>
                <Text style={styles.reviewScoreValue}>{profile.reviews.categories.punctuality}</Text>
              </View>
              <View style={styles.reviewScoreItem}>
                <Text style={styles.reviewScoreLabel}>{t('communication', 'Communication')}</Text>
                <Text style={styles.reviewScoreValue}>{profile.reviews.categories.communication}</Text>
              </View>
              <View style={styles.reviewScoreItem}>
                <Text style={styles.reviewScoreLabel}>{t('behavior', 'Behavior')}</Text>
                <Text style={styles.reviewScoreValue}>{profile.reviews.categories.behavior}</Text>
              </View>
            </View>

            {profile.reviews.items.map((rev, idx) => (
              <View key={rev.id} style={[styles.reviewBox, idx === profile.reviews.items.length - 1 && { borderBottomWidth: 0, paddingBottom: 0 }]}>
                <View style={styles.reviewAuthorRow}>
                  <View style={styles.reviewAvatar}>
                    <Text style={styles.reviewAvatarText}>{rev.author.charAt(0)}</Text>
                  </View>
                  <View>
                    <Text style={styles.reviewAuthor}>{rev.author}</Text>
                    <Text style={styles.reviewDate}>{rev.date} • {rev.activity}</Text>
                  </View>
                </View>
                <Text style={styles.reviewText}>{rev.text}</Text>
              </View>
            ))}
          </View>
          {/* Bottom spacer instead of ugly buttons */}
          <View style={{ height: 40 }} />
        </View>
      </Animated.ScrollView>

      {/* Glassmorphism Sticky Header */}
      <Animated.View style={[styles.stickyHeader, { height: insets.top + 56, paddingTop: insets.top, opacity: headerOpacity }]}>
        <Text style={styles.stickyHeaderTitle}>{profile.name}</Text>
      </Animated.View>

      {/* Floating Header Actions */}
      <View style={[styles.floatingActions, { top: Math.max(insets.top, 16) + 6 }]}>
        <TouchableOpacity style={styles.iconCircle} onPress={() => smartGoBack('DiscoverTab')} accessibilityRole="button" accessibilityLabel={t('a11yGoBack', 'Go back')}>
          <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity style={styles.iconCircle} onPress={() => setIsFavorite(!isFavorite)} accessibilityRole="button" accessibilityLabel={t('a11yLike', 'Like')}>
            <Icon name={isFavorite ? "heart" : "heart-outline"} size={22} color={isFavorite ? theme.colors.error : theme.colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconCircle} onPress={() => setShowMenuSheet(true)} accessibilityRole="button" accessibilityLabel={t('a11yMoreOptions', 'More options')}>
            <Icon name="dots-vertical" size={22} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Premium Bottom Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom + 8, 24), paddingTop: 16 }]}>
        <View style={styles.bottomBarLeft}>
          <Text style={styles.bottomPriceLabel}>{t('starts_from', 'Starts from')}</Text>
          <Text style={styles.bottomPriceValue}>₹500 <Text style={styles.bottomPriceUnit}>{t('hr', '/ hr')}</Text></Text>
        </View>
        
        <TouchableOpacity 
          style={styles.requestBtn}
          onPress={() => navigation.navigate('BookingFlowStack', {
                screen: 'BookingActivitySelectScreen',
                params: { companionId, companionName: profile.name },
              })} accessibilityRole="button" accessibilityLabel={t('a11yRequestBooking', 'Request Booking')}
        >
          <Text style={styles.requestBtnText}>{t('btn_request', 'Request Booking')}</Text>
        </TouchableOpacity>
      </View>

      {/* Options Bottom Sheet */}
      <AppBottomSheet
        visible={showMenuSheet}
        onClose={() => setShowMenuSheet(false)}
        title={t('title.Options', 'Options')}
      >
        <View style={styles.sheetContent}>
          <TouchableOpacity style={styles.sheetRow} activeOpacity={0.7} onPress={() => setShowMenuSheet(false)} accessibilityRole="button" accessibilityLabel={t('a11yShareProfile', 'Share Profile')}>
            <View style={styles.sheetIconWrap}>
              <Icon name="share-variant-outline" size={20} color={theme.colors.textPrimary} />
            </View>
            <Text style={styles.sheetRowText}>{t('shareProfile', 'Share Profile')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sheetRow} activeOpacity={0.7} onPress={() => setShowMenuSheet(false)} accessibilityRole="button" accessibilityLabel={t('a11yReportName', 'Report {{name}}', { name: profile.name })}>
            <View style={styles.sheetIconWrap}>
              <Icon name="flag-outline" size={20} color={theme.colors.textPrimary} />
            </View>
            <Text style={styles.sheetRowText}>{t('reportName', 'Report {{name}}', { name: profile.name })}</Text>
          </TouchableOpacity>

          <View style={styles.sheetDivider} />

          <TouchableOpacity 
            style={styles.sheetRow} 
            activeOpacity={0.7}
            onPress={() => {
              setShowMenuSheet(false);
              setTimeout(() => {
                  Alert.alert(
                    t('blockUserTitle', 'Block User'),
                    t('blockUserConfirm', "Are you sure you want to block {{name}}? You won't be able to request bookings or send messages to them.", { name: profile.name }),
                    [
                      { text: t('cancel', 'Cancel'), style: "cancel" },
                      { 
                        text: t('block', 'Block'), 
                        style: "destructive",
                        onPress: async () => {
                          if (companionId) {
                            try {
                              await accountApi.blockUser(companionId);
                            } catch {
                              // Ignored
                            }
                          }
                          Alert.alert(t('blockedTitle', 'Blocked'), t('blockedMessage', '{{name}} has been blocked.', { name: profile.name }));
                          smartGoBack('DiscoverTab');
                        }
                      }
                    ]
                  );
              }, 300);
            }} accessibilityRole="button" accessibilityLabel={t('a11yBlockName', 'Block {{name}}', { name: profile.name })}
          >
            <View style={[styles.sheetIconWrap, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
              <Icon name="block-helper" size={20} color={theme.colors.error} />
            </View>
            <Text style={[styles.sheetRowText, { color: theme.colors.error }]}>{t('blockName', 'Block {{name}}', { name: profile.name })}</Text>
          </TouchableOpacity>
        </View>
      </AppBottomSheet>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background, // Fixed to use V2 theme
  },
  headerBar: {
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  heroContainer: {
    width: width,
    height: HERO_HEIGHT,
    position: 'relative',
  },
  heroImage: {
    width: width,
    height: HERO_HEIGHT,
    resizeMode: 'cover',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: 'rgba(11, 13, 26, 0.65)', // Match Deep Navy base better
    justifyContent: 'flex-end',
    padding: 24,
  },
  heroDetails: {
    marginBottom: 20,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  heroName: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    marginLeft: 12,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  trustScore: {
    color: theme.colors.background,
    fontWeight: 'bold',
    fontSize: 13,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  dotSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 8,
  },
  activeStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.success,
    marginRight: 6,
  },
  activeStatusText: {
    color: theme.colors.success,
    fontSize: 14,
    fontWeight: '600',
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 16,
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  paginationActiveDot: {
    backgroundColor: '#FFF',
    width: 20,
  },
  contentBody: {
    padding: 16,
    marginTop: -20, // More overlap for depth
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 18,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.15)', // Subtle gold border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  statValue: {
    fontSize: 19,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginTop: 6,
    letterSpacing: 0.5,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  bioText: {
    fontSize: 15,
    lineHeight: 24,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.06)', // Very faint gold
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.15)',
    gap: 6,
  },
  tagText: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  pricingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pricingIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pricingActivity: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
  pricingAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  infoText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  ruleText: {
    color: theme.colors.textSecondary,
    fontSize: 15,
  },
  mutedText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginBottom: 16,
    marginTop: -8,
  },
  verificationList: {
    gap: 12,
  },
  verifyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  verifyLabel: {
    color: theme.colors.textPrimary,
    fontSize: 15,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  reviewSeeAll: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  reviewScoresGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    backgroundColor: 'rgba(212, 175, 55, 0.04)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.1)',
  },
  reviewScoreItem: {
    alignItems: 'center',
  },
  reviewScoreLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  reviewScoreValue: {
    color: theme.colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  reviewBox: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  reviewAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reviewAvatarText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  reviewAuthor: {
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
    fontSize: 15,
  },
  reviewDate: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  reviewText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  
  // Sheet Styles
  sheetContent: {
    paddingBottom: 24,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  sheetIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  sheetRowText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
  sheetDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 8,
  },

  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    zIndex: 10,
  },
  stickyHeaderTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  floatingActions: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 20,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(21, 24, 43, 0.98)', // Deep Navy Surface with high opacity
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.2)', // Gold accent border
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 24,
  },
  bottomBarLeft: {
    flex: 1,
  },
  bottomPriceLabel: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  bottomPriceValue: {
    color: theme.colors.primary,
    fontSize: 26,
    fontWeight: '800',
    marginTop: 2,
  },
  bottomPriceUnit: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  requestBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 32,
    height: 52, // Slightly taller for premium feel
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  requestBtnText: {
    color: theme.colors.background,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
