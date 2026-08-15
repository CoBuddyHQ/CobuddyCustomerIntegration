import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { CompanionCard } from '../../components/ui/CompanionCard';
import { CompanionCardSkeleton } from '../../components/ui/CompanionCardSkeleton';
import { DUMMY_COMPANIONS } from '../../services/mock';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useUserPreferencesStore } from '../../store/slices/userPreferencesStore';
import { selectInterests } from '../../store/selectors/userPreferencesSelectors';
import { INTEREST_MAPPING } from '../../services/mock/interestMapping';
import { discoveryApi, CompanionCard as CompanionCardType } from '../../services/api';

const FILTER_STATUS = ['All', 'Available Today', 'Top Rated', 'Nearby'];
const FILTER_STATUS_KEYS: Record<string, string> = {
  'All': 'quickFilters.all',
  'Available Today': 'quickFilters.availableToday',
  'Top Rated': 'quickFilters.topRated',
  'Nearby': 'quickFilters.nearby',
};

const GENDER_OPTIONS = ['Any', 'Male', 'Female'];
const RATING_PILLS = [4.0, 4.5, 5.0];
const PRICE_PILLS = [500, 1000, 2000];
const DISTANCE_PILLS = [5, 15, 50];

// --- Custom Slider Component ---
const CustomSlider = ({ value, onValueChange, min, max, step, prefix = '', suffix = '' }: { value: number; onValueChange: (v: number) => void; min: number; max: number; step: number; prefix?: string; suffix?: string; }) => {
  const { t } = useTranslation();
  const [width, setWidth] = useState(1);
  const [localVal, setLocalVal] = useState(value);

  // Sync with parent when value changes via pills
  useEffect(() => {
    setLocalVal(value);
  }, [value]);

  const updateValue = (e: import("react-native").GestureResponderEvent, isRelease = false) => {
    const x = e.nativeEvent.locationX;
    let percent = x / width;
    if (percent < 0) percent = 0;
    if (percent > 1) percent = 1;
    const rawVal = min + percent * (max - min);
    const stepped = Math.round(rawVal / step) * step;
    const finalVal = parseFloat(stepped.toFixed(1));
    
    setLocalVal(finalVal);
    
    if (isRelease) {
      onValueChange(finalVal);
    }
  };

  const percentage = (localVal - min) / (max - min);

  return (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderLabelsRow}>
        <Text style={styles.sliderLabelMinMax}>{prefix}{min}{suffix}</Text>
        <Text style={styles.sliderLabelValue}>{t('discover.upTo', 'Up to ')}{prefix}{localVal}{suffix}</Text>
        <Text style={styles.sliderLabelMinMax}>{prefix}{max}{suffix}</Text>
      </View>
      <View 
        style={styles.sliderTrackContainer} 
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onResponderMove={(e) => updateValue(e, false)}
        onResponderRelease={(e) => updateValue(e, true)}
      >
        <View pointerEvents="none" style={styles.sliderTrack} />
        <View pointerEvents="none" style={[styles.sliderTrackActive, { width: `${percentage * 100}%` }]} />
        <View pointerEvents="none" style={[styles.sliderThumb, { left: `${percentage * 100}%` }]} />
      </View>
    </View>
  );
};
// -------------------------------

export const DiscoverScreen = () => {
  const { t } = useTranslation(['discover']);

  const MODAL_CATEGORIES = React.useMemo(() => [
  { id: 'coffee', label: t('categories.coffeeMeetups', 'Coffee Meetups') },
  { id: 'movie', label: t('categories.movieBuffs', 'Movie Buffs') },
  { id: 'study', label: t('categories.studyBuddy', 'Study Buddy') },
  { id: 'city', label: t('categories.cityWalk', 'City Walk') },
], [t]);

  const selectedInterests = useUserPreferencesStore(selectInterests);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'DiscoverScreen'>>();
  
  const [activeStatus, setActiveStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Advanced Filters State
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [filterGender, setFilterGender] = useState('Any');
  const [filterRating, setFilterRating] = useState(4.0);
  const [filterMaxPrice, setFilterMaxPrice] = useState(2000);
  const [filterDistance, setFilterDistance] = useState(50);
  
  const [loading, setLoading] = useState(true);
  const [apiCompanions, setApiCompanions] = useState<CompanionCardType[]>([]);

  // Sync navigation params to search bar whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const initialCategory = route.params?.category;
      if (initialCategory) {
        const cat = MODAL_CATEGORIES.find(c => c.id === initialCategory);
        if (cat) {
          setSearchQuery(cat.label);
        } else {
          setSearchQuery(initialCategory);
        }
        // Clear params so it doesn't get stuck if user clears search and re-focuses
        navigation.setParams({ category: undefined });
      }
    }, [route.params?.category, MODAL_CATEGORIES, navigation])
  );

  useEffect(() => {
    let isMounted = true;
    const fetchCompanions = async () => {
      setLoading(true);
      try {
        const params: any = {};
        if (searchQuery.trim()) params.search = searchQuery.trim();
        if (filterGender !== 'Any') params.gender = filterGender.toLowerCase();

        const res = await discoveryApi.getCompanions(params);
        if (isMounted && res?.data && res.data.length > 0) {
          setApiCompanions(res.data);
        } else if (isMounted) {
          setApiCompanions([]);
        }
      } catch {
        if (isMounted) setApiCompanions([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const timer = setTimeout(fetchCompanions, 400);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [activeStatus, searchQuery, filterGender, filterRating, filterMaxPrice, filterDistance]);

  const filteredCompanions = React.useMemo(() => {
    // 1. Gather all activity labels from user's selected interests
    const userActivityLabels = new Set<string>();
    if (selectedInterests) {
      selectedInterests.forEach(interestId => {
        const mapping = INTEREST_MAPPING[interestId];
        if (mapping && mapping.activityLabels) {
          mapping.activityLabels.forEach(label => userActivityLabels.add(label));
        }
      });
    }

    // 2. Filter companions (use apiCompanions if available, otherwise DUMMY_COMPANIONS)
    const sourceList = apiCompanions.length > 0 ? apiCompanions : DUMMY_COMPANIONS;
    const filtered = sourceList.filter(c => {
      // Search match
      const matchesSearch = searchQuery === '' || 
                            c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (c.activities && c.activities.some(act => act.toLowerCase().includes(searchQuery.toLowerCase()))) ||
                            MODAL_CATEGORIES.find(m => m.label.toLowerCase() === searchQuery.toLowerCase())?.id === c.category;
      
      // Quick status filters
      let matchesStatus = true;
      if (activeStatus === 'Available Today') matchesStatus = c.isOnline === true;
      if (activeStatus === 'Top Rated') matchesStatus = (c.rating ?? 0) >= 4.95;
      
      // Advanced Filters
      let matchesGender = true;
      if (filterGender !== 'Any') matchesGender = c.gender?.toLowerCase() === filterGender.toLowerCase();
      
      let matchesRating = true;
      matchesRating = (c.rating ?? 0) >= filterRating;

      let matchesPrice = true;
      if (c.rate) {
        const rateValue = parseInt(c.rate.replace(/\D/g, ''), 10);
        if (!isNaN(rateValue)) matchesPrice = rateValue <= filterMaxPrice;
      }

      let matchesDistance = true;
      if (c.distance) {
        const distValue = parseFloat(c.distance);
        if (!isNaN(distValue)) matchesDistance = distValue <= filterDistance;
      }
      
      return matchesSearch && matchesStatus && matchesGender && matchesRating && matchesPrice && matchesDistance;
    });

    // 3. Sort companions to boost matches based on selected interests
    if (userActivityLabels.size > 0) {
      filtered.sort((a, b) => {
        const aMatches = (a.activities && a.activities.some(act => userActivityLabels.has(act))) ? 1 : 0;
        const bMatches = (b.activities && b.activities.some(act => userActivityLabels.has(act))) ? 1 : 0;
        return bMatches - aMatches;
      });
    }

    return filtered;
  }, [
    apiCompanions, searchQuery, activeStatus, filterGender, filterRating, 
    filterMaxPrice, filterDistance, selectedInterests, MODAL_CATEGORIES
  ]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilterGender('Any');
    setFilterRating(3.0);
    setFilterMaxPrice(2000);
    setFilterDistance(50);
    setActiveStatus('All');
    setIsFilterVisible(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>{t('title', 'Discover')}</Text>
          <TouchableOpacity style={styles.filterBtn} onPress={() => setIsFilterVisible(true)} accessibilityRole="button" accessibilityLabel={t('a11yFilter', 'Filter')}>
            <Icon name="tune-variant" size={24} color={theme.colors.textSecondary} />
            {/* Show badge if advanced filters are active */}
            {(filterGender !== 'Any' || filterRating > 4.0 || filterMaxPrice < 2000 || filterDistance < 50) && (
              <View style={styles.filterBadge} />
            )}
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Icon name="magnify" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('search_placeholder')}
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn} accessibilityRole="button" accessibilityLabel={t('a11yClose', 'Close')}>
              <Icon name="close-circle" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Status Filters */}
        <View style={styles.filtersWrapper}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={FILTER_STATUS}
            keyExtractor={item => item}
            contentContainerStyle={styles.filtersList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filterPill,
                  activeStatus === item && styles.filterPillActive
                ]}
                onPress={() => setActiveStatus(item)} accessibilityRole="button" accessibilityLabel={t('a11ySelectFilter', 'Filter by {{item}}', { item })}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    activeStatus === item && styles.filterPillTextActive
                  ]}
                >
                  {t(FILTER_STATUS_KEYS[item], item)}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
        <View style={styles.infoBar}>
          <Text style={styles.infoBarText}>
            {t('showing', 'Showing ')}{filteredCompanions.length} {t('companions', 'companions')}
          </Text>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          <CompanionCardSkeleton />
          <CompanionCardSkeleton />
          <CompanionCardSkeleton />
        </ScrollView>
      ) : (
        <FlatList
          data={filteredCompanions}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <CompanionCard
              {...item}
              onPress={(id) => navigation.navigate('CompanionProfileScreen', { companionId: id })}
            />
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Icon name="account-search-outline" size={48} color={theme.colors.border} />
              <Text style={styles.emptyText}>{t('noCompanions', 'No companions found')}</Text>
              <TouchableOpacity style={styles.clearAllBtn} onPress={clearAllFilters} accessibilityRole="button" accessibilityLabel={t('a11yClearFilters', 'Clear Filters')}>
                <Text style={styles.clearAllBtnText}>{t('clearFilters', 'Clear Filters')}</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Polished Filter Modal */}
      <Modal
        visible={isFilterVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsFilterVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setIsFilterVisible(false)} accessibilityRole="button" accessibilityLabel={t('a11yCloseFilters', 'Close filters')} />
          <View style={styles.modalContent}>
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('filtersTitle', 'Filters')}</Text>
              <TouchableOpacity onPress={() => setIsFilterVisible(false)} accessibilityRole="button" accessibilityLabel={t('a11yClose', 'Close')}>
                <Icon name="close" size={24} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              
              {/* Categories */}
              <Text style={styles.modalSectionTitle}>{t('filterActivityType', 'Activity Type')}</Text>
              <View style={styles.modalOptionsGrid}>
                {MODAL_CATEGORIES.map((cat) => (
                  <TouchableOpacity 
                    key={cat.id} 
                    style={[
                      styles.modalOptionBtn,
                      searchQuery === cat.label && styles.modalOptionBtnActive
                    ]}
                    onPress={() => setSearchQuery(searchQuery === cat.label ? '' : cat.label)} accessibilityRole="button" accessibilityLabel={cat.label}
                  >
                    <Text style={[
                      styles.modalOptionText,
                      searchQuery === cat.label && styles.modalOptionTextActive
                    ]}>{cat.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Gender */}
              <Text style={styles.modalSectionTitle}>{t('filterGender', 'Gender')}</Text>
              <View style={styles.modalOptionsGrid}>
                {GENDER_OPTIONS.map((g) => (
                  <TouchableOpacity 
                    key={g} 
                    style={[
                      styles.modalOptionBtn,
                      filterGender === g && styles.modalOptionBtnActive
                    ]}
                    onPress={() => setFilterGender(g)} accessibilityRole="button" accessibilityLabel={t('a11yG', 'g')}
                  >
                    <Text style={[
                      styles.modalOptionText,
                      filterGender === g && styles.modalOptionTextActive
                    ]}>
                        {g === 'Any' ? t('filter.any', 'Any') : g === 'Male' ? t('filter.male', 'Male') : t('filter.female', 'Female')}
                      </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Price Range Slider */}
              <Text style={styles.modalSectionTitle}>{t('filterMaxHourlyRate', 'Maximum Hourly Rate')}</Text>
              <CustomSlider 
                value={filterMaxPrice} 
                onValueChange={setFilterMaxPrice} 
                min={200} 
                max={2000} 
                step={50} 
                prefix="₹"
                suffix=" /hr"
              />
              <View style={styles.modalOptionsGrid}>
                {PRICE_PILLS.map((p) => (
                  <TouchableOpacity 
                    key={p} 
                    style={[styles.modalOptionBtn, filterMaxPrice === p && styles.modalOptionBtnActive]}
                    onPress={() => setFilterMaxPrice(p)} accessibilityRole="button" accessibilityLabel={t('a11yP', '₹ p')}
                  >
                    <Text style={[styles.modalOptionText, filterMaxPrice === p && styles.modalOptionTextActive]}>
                      ₹{p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Rating Slider */}
              <Text style={styles.modalSectionTitle}>{t('filterMinRating', 'Minimum Rating')}</Text>
              <CustomSlider 
                value={filterRating} 
                onValueChange={setFilterRating} 
                min={1.0} 
                max={5.0} 
                step={0.1}
                suffix=" ⭐" 
              />
              <View style={styles.modalOptionsGrid}>
                {RATING_PILLS.map((r) => (
                  <TouchableOpacity 
                    key={r} 
                    style={[styles.modalOptionBtn, filterRating === r && styles.modalOptionBtnActive]}
                    onPress={() => setFilterRating(r)} accessibilityRole="button" accessibilityLabel={t('a11yR', 'r + ⭐')}
                  >
                    <Text style={[styles.modalOptionText, filterRating === r && styles.modalOptionTextActive]}>
                      {r}+ ⭐
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Distance Slider */}
              <Text style={styles.modalSectionTitle}>{t('filterMaxDistance', 'Maximum Distance')}</Text>
              <CustomSlider 
                value={filterDistance} 
                onValueChange={setFilterDistance} 
                min={1} 
                max={50} 
                step={1} 
                suffix={t('units.kmSpace', ' km')}
              />
              <View style={styles.modalOptionsGrid}>
                {DISTANCE_PILLS.map((d) => (
                  <TouchableOpacity 
                    key={d} 
                    style={[styles.modalOptionBtn, filterDistance === d && styles.modalOptionBtnActive]}
                    onPress={() => setFilterDistance(d)} accessibilityRole="button" accessibilityLabel={t('a11yDKm', 'd km')}
                  >
                    <Text style={[styles.modalOptionText, filterDistance === d && styles.modalOptionTextActive]}>
                      {d} {t('units.km', 'km')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Bottom Actions */}
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalClearBtn} onPress={clearAllFilters} accessibilityRole="button" accessibilityLabel={t('a11yClearAll', 'Clear All')}>
                <Text style={styles.modalClearBtnText}>{t('clearAll', 'Clear All')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalApplyBtn} onPress={() => setIsFilterVisible(false)} accessibilityRole="button" accessibilityLabel={t('a11yApplyFilters', 'Apply Filters')}>
                <Text style={styles.modalApplyBtnText}>{t('applyFilters', 'Apply Filters')}</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 16,
  },
  clearSearchBtn: {
    padding: 4,
  },
  filtersWrapper: {
    marginBottom: 12,
  },
  filtersList: {
    paddingRight: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterPillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterPillText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  filterPillTextActive: {
    color: theme.colors.background,
    fontWeight: 'bold',
  },
  infoBar: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  infoBarText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  clearAllBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  clearAllBtnText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  
  // Polished Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  modalScroll: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginTop: 24,
    marginBottom: 16,
  },
  modalOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  modalOptionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalOptionBtnActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderColor: theme.colors.primary,
  },
  modalOptionText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  modalOptionTextActive: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    gap: 16,
  },
  modalClearBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalClearBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  modalApplyBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalApplyBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.background,
  },
  
  // Custom Slider Styles
  sliderContainer: {
    marginVertical: 8,
    paddingHorizontal: 8,
  },
  sliderLabelsRow: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 12,
  },
  sliderLabelMinMax: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  sliderLabelValue: {
    color: theme.colors.primary, 
    fontWeight: 'bold',
    fontSize: 14,
  },
  sliderTrackContainer: {
    height: 40, 
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 6, 
    backgroundColor: theme.colors.border, 
    borderRadius: 3,
  },
  sliderTrackActive: {
    position: 'absolute', 
    left: 0, 
    height: 6, 
    backgroundColor: theme.colors.primary, 
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute', 
    marginLeft: -12, 
    width: 24, 
    height: 24, 
    borderRadius: 12, 
    backgroundColor: '#fff',
    borderWidth: 2, 
    borderColor: theme.colors.primary,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 3, 
    elevation: 5,
  }
});
