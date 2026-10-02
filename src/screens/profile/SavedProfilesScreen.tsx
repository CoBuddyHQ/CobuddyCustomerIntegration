import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { AppBottomSheet } from '../../components/ui/AppBottomSheet';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { discoveryApi } from '../../services/api';
import type { CompanionCard } from '../../services/api/discovery.api';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export const SavedProfilesScreen = () => { 
  const { t } = useTranslation('profile.saved');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { smartGoBack } = useSmartNavigation();
  const [savedProfiles, setSavedProfiles] = useState<CompanionCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<CompanionCard | null>(null);
  const [showSheet, setShowSheet] = useState(false);

  useEffect(() => {
    discoveryApi.getFavorites()
      .then(data => setSavedProfiles(Array.isArray(data) ? data : []))
      .catch(() => setSavedProfiles([]))
      .finally(() => setIsLoading(false));
  }, []);

  const handleUnsave = (id: string) => {
    setSavedProfiles(prev => prev.filter(p => p.id !== id));
    setShowSheet(false);
    discoveryApi.removeFavorite(id).catch(() => {});
  };

  const openOptions = (profile: CompanionCard) => {
    setSelectedProfile(profile);
    setShowSheet(true);
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
        <View style={styles.emptyIconBox}>
            <Icon name="bookmark-outline" size={48} color={theme.colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>{t('emptyTitle', 'No Saved Checklists')}</Text>
        <Text style={styles.emptySub}>{t('emptySub', 'When you find a companion you like, tap the bookmark icon to save their profile here.')}</Text>
        <TouchableOpacity 
            style={styles.exploreBtn} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('DiscoverTab')} accessibilityRole="button" accessibilityLabel={t('a11yExploreCompanions', 'Explore Companions')}
        >
            <Text style={styles.exploreBtnText}>{t('exploreBtn', 'Explore Companions')}</Text>
        </TouchableOpacity>
    </View>
  );

  const renderItem = ({ item }: { item: CompanionCard }) => (
    <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.8}
        onPress={() => navigation.navigate('CompanionProfileScreen', { companionId: item.id })} accessibilityRole="button" accessibilityLabel={t('a11yGoToCompanionprofile', 'Go to CompanionProfile')}
    >
        <View style={styles.imagePlaceholder}>
            <Icon name="account" size={40} color="rgba(255,255,255,0.1)" />
            <TouchableOpacity 
                style={styles.bookmarkBtn}
                activeOpacity={0.7}
                onPress={() => openOptions(item)} accessibilityRole="button" accessibilityLabel={t('a11yMoreOptions', 'More options')}
            >
                <Icon name="dots-horizontal" size={20} color={theme.colors.background} />
            </TouchableOpacity>
        </View>

        <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
                <Text style={styles.name}>{item.name}{item.age ? `, ${item.age}` : ''}</Text>
                <Text style={styles.rate}>{item.rate || '—'}</Text>
            </View>

            <View style={styles.statsRow}>
                <View style={styles.ratingBox}>
                    <Icon name="star" size={14} color={theme.colors.background} />
                    <Text style={styles.ratingText}>{item.rating ?? '—'}</Text>
                </View>
                <Text style={styles.reviewsText}>({item.reviews ?? 0} {t('reviews.count', 'reviews')})</Text>
                <View style={styles.dot} />
                <Icon name="map-marker" size={12} color={theme.colors.textSecondary} />
                <Text style={styles.locationText} numberOfLines={1}>{item.city || item.distance || '—'}</Text>
            </View>

            <View style={styles.tagsRow}>
                {(item.activities || []).slice(0, 3).map((tag: string) => (
                    <View key={tag} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                    </View>
                ))}
            </View>
        </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => smartGoBack()} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={t('a11yGoBack', 'Go back')}>
          <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('headerTitle', 'Saved Checklists')}</Text>
        <View style={styles.backBtn} />
      </View>

      <FlatList
        data={savedProfiles}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={savedProfiles.length === 0 ? styles.emptyList : styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={isLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : renderEmpty}
      />

      <AppBottomSheet
        visible={showSheet}
        onClose={() => setShowSheet(false)}
        title={t('title.ManageSavedProf', 'Manage Saved Profile')}
      >
        <View style={styles.sheetContent}>
            <TouchableOpacity 
                style={styles.sheetAction} 
                activeOpacity={0.7}
                onPress={() => {
                    setShowSheet(false);
                    navigation.navigate('CompanionProfileScreen', { companionId: selectedProfile?.id });
                }} accessibilityRole="button" accessibilityLabel={t('a11yViewFullProfile', 'View Full Profile')}
            >
                <View style={styles.sheetIconBox}>
                    <Icon name="account-outline" size={20} color={theme.colors.textPrimary} />
                </View>
                <Text style={styles.sheetActionText}>{t('viewProfile', 'View Full Profile')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={styles.sheetAction} 
                activeOpacity={0.7}
                onPress={() => {
                    if(selectedProfile) handleUnsave(selectedProfile.id);
                }} accessibilityRole="button" accessibilityLabel={t('a11yRemoveFromSaved', 'Remove from Saved')}
            >
                <View style={[styles.sheetIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                    <Icon name="bookmark-off-outline" size={20} color={theme.colors.error} />
                </View>
                <Text style={[styles.sheetActionText, { color: theme.colors.error }]}>{t('removeSaved', 'Remove from Saved')}</Text>
            </TouchableOpacity>
        </View>
      </AppBottomSheet>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.textPrimary },
  
  listContent: { padding: 16, gap: 16, paddingBottom: 40 },
  emptyList: { flex: 1, justifyContent: 'center', padding: 24 },
  
  // Empty State
  emptyContainer: { alignItems: 'center', justifyContent: 'center' },
  emptyIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(212, 175, 55, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 12 },
  emptySub: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  exploreBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 20, shadowColor: theme.colors.primary, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  exploreBtnText: { color: theme.colors.background, fontSize: 15, fontWeight: 'bold' },

  // Card
  card: { backgroundColor: theme.colors.surface, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.border },
  imagePlaceholder: { height: 160, backgroundColor: '#1A1D2D', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  bookmarkBtn: { position: 'absolute', top: 12, right: 12, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  
  cardContent: { padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  name: { fontSize: 18, fontWeight: 'bold', color: theme.colors.textPrimary },
  rate: { fontSize: 16, fontWeight: 'bold', color: theme.colors.primary },
  
  statsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  ratingBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginRight: 6 },
  ratingText: { fontSize: 12, fontWeight: 'bold', color: theme.colors.background, marginLeft: 2 },
  reviewsText: { fontSize: 12, color: theme.colors.textSecondary, marginRight: 8 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: theme.colors.textSecondary, marginRight: 8 },
  locationText: { fontSize: 12, color: theme.colors.textSecondary, flex: 1, marginLeft: 4 },

  tagsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  tag: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border },
  tagText: { fontSize: 11, color: theme.colors.textSecondary },

  // Sheet
  sheetContent: { padding: 16, paddingBottom: 24, gap: 12 },
  sheetAction: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: theme.colors.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border },
  sheetIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  sheetActionText: { fontSize: 15, fontWeight: '600', color: theme.colors.textPrimary }
});
