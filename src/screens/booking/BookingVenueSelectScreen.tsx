import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { useBookingStore } from '../../store/slices/bookingStore';
import { adminValues } from '../../config/adminValues';
import { selectSetDraftBooking, selectDraftBooking } from '../../store/selectors/bookingSelectors';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// MOCK: Replace with API response from Safe Venues database
const SAFE_VENUES = [
  { id: 'v1', name: 'Starbucks Reserve', address: '123 Fort, Downtown', icon: 'coffee', type: 'cafe' },
  { id: 'v2', name: 'Third Wave Coffee', address: 'Bandra West', icon: 'coffee', type: 'cafe' },
  { id: 'v3', name: 'Phoenix Palladium', address: 'Lower Parel', icon: 'shopping', type: 'shopping_mall' },
  { id: 'v4', name: 'PVR Cinemas', address: 'Juhu', icon: 'popcorn', type: 'movie_theater' },
];

export const BookingVenueSelectScreen = () => { 
  const { t } = useTranslation('booking.venueSelect');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { smartGoBack } = useSmartNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'BookingVenueSelectScreen'>>();
  const setDraftBooking = useBookingStore(selectSetDraftBooking);
  const draftBooking = useBookingStore(selectDraftBooking);

  const { activity, companionId, companionName } = route.params || {};

  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(draftBooking?.venue?.venueId || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlaceType, setSelectedPlaceType] = useState<string | null>(null);

  const handleBack = () => {
    smartGoBack();
  };

  const handleNext = () => {
    if (!selectedVenueId) return;
    
    const venue = SAFE_VENUES.find(v => v.id === selectedVenueId);
    if (!venue) return;

    setDraftBooking({
      venue: {
        venueId: venue.id,
        name: venue.name,
        area: (venue as any).area || 'Central',
        city: (venue as any).city || 'Mumbai',
        isApproved: true,
        venueType: venue.type,
        meetingPoint: venue.name,
        landmark: venue.address,
      }
    });
    
    navigation.navigate('BookingTimeSelectScreen', {
      activity,
      venue: venue,
      companionId,
      companionName,
    });
  };

  const filteredVenues = SAFE_VENUES.filter(venue => {
    const matchesSearch = venue.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          venue.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedPlaceType ? venue.type === selectedPlaceType : true;
    return matchesSearch && matchesType;
  });

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      {/* Top Header & Progress */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack} accessibilityRole="button" accessibilityLabel={t('a11yGoBack', 'Go back')}>
          <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('headerTitle', 'Step 2 of 4')}</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: '50%' }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t('title', 'Where do you want to meet?')}</Text>
        <Text style={styles.subtitle}>{t('subtitle', 'Select a safe public venue for {{activity}}.', { activity: activity?.defaultTitle || t('thisSession', 'this session') })}</Text>

        <View style={styles.searchContainer}>
          <Icon name="magnify" size={24} color={theme.colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('placeholder.SearchPublicVen', 'Search public venues...')}
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Place Type Filter Horizontal List */}
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>{t('filterByPlaceType', 'Filter by Place Type')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
            <TouchableOpacity
              style={[styles.filterChip, selectedPlaceType === null && styles.filterChipActive]}
              onPress={() => setSelectedPlaceType(null)}
              accessibilityRole="button"
              accessibilityLabel="Show all place types"
            >
              <Text style={[styles.filterChipText, selectedPlaceType === null && styles.filterChipTextActive]}>
                {t('all', 'All')}
              </Text>
            </TouchableOpacity>
            {adminValues.venue.allowedPlaceTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.filterChip, selectedPlaceType === type && styles.filterChipActive]}
                onPress={() => setSelectedPlaceType(selectedPlaceType === type ? null : type)}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${type.replace(/_/g, ' ')}`}
              >
                <Text style={[styles.filterChipText, selectedPlaceType === type && styles.filterChipTextActive]}>
                  {type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <Text style={styles.sectionTitle}>{t('sectionTitle', 'Curated Safe Venues')}</Text>

        <View style={styles.listContainer}>
          {filteredVenues.map((venue) => {
            const isSelected = selectedVenueId === venue.id;
            return (
              <TouchableOpacity
                key={venue.id}
                style={[styles.card, isSelected && styles.cardSelected]}
                onPress={() => setSelectedVenueId(venue.id)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={venue.name}
              >
                <View style={styles.iconWrap}>
                  <Icon name={venue.icon} size={28} color={isSelected ? theme.colors.primary : theme.colors.textSecondary} />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.venueName}>{venue.name}</Text>
                  <Text style={styles.venueAddress}>{venue.address}</Text>
                  <View style={styles.badge}>
                    <Icon name="shield-check" size={14} color={theme.colors.success} />
                    <Text style={styles.badgeText}>{t('safePublicLocation', 'Safe Public Location')}</Text>
                  </View>
                </View>
                <View style={[styles.radio, isSelected && styles.radioSelected]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer / CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextBtn, !selectedVenueId && styles.nextBtnDisabled]}
          disabled={!selectedVenueId}
          onPress={handleNext}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={t('a11ySelectDate', 'Select date')}
        >
          <Text style={styles.nextBtnText}>{t('btn.selectDate', 'Select Date & Time')}</Text>
          <Icon name="arrow-right" size={20} color={theme.colors.background} />
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
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  progressContainer: {
    height: 4,
    backgroundColor: theme.colors.surface,
    width: '100%',
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    color: theme.colors.textPrimary,
    fontSize: 15,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  filterContainer: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterChipActive: {
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  listContainer: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(217, 119, 6, 0.05)',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  venueName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  venueAddress: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    color: theme.colors.success,
    fontWeight: '500',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  radioSelected: {
    borderColor: theme.colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  nextBtn: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    borderRadius: 30,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  nextBtnDisabled: {
    opacity: 0.5,
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.background,
  },
});
