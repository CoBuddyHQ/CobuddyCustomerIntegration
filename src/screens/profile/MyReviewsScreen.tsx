import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { reviewsApi } from '../../services/api';
import type { Review } from '../../services/api/reviews.api';

export const MyReviewsScreen = () => { 
  const { t } = useTranslation('profile.reviews');
  const { smartGoBack } = useSmartNavigation();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    reviewsApi.getMyReviews()
      .then(data => setReviews(Array.isArray(data) ? data : []))
      .catch(() => setReviews([]))
      .finally(() => setIsLoading(false));
  }, []);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : '—';

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => smartGoBack()} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={t('a11yGoBack', 'Go back')}>
          <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('headerTitle', 'My Trust Profile')}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.heroCard}>
            <View style={styles.heroGlow} />
            <Text style={styles.heroSubtitle}>{t('overallScore', 'OVERALL TRUST SCORE')}</Text>
            {isLoading ? (
              <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginVertical: 16 }} />
            ) : (
              <View style={styles.scoreRow}>
                  <Icon name="star" size={32} color={theme.colors.primary} />
                  <Text style={styles.scoreText}>{avgRating}</Text>
                  <Text style={styles.scoreTotal}>/5</Text>
              </View>
            )}
            <Text style={styles.reviewsCount}>{t('reviews.basedOn', 'Based on ')}{reviews.length} {t('reviews.fromCompanions', 'reviews from companions')}</Text>
        </View>

        <View style={styles.trustBanner}>
            <Icon name="shield-star" size={20} color={theme.colors.success} />
            <Text style={styles.trustBannerText}>{t('trustBanner', 'A high trust score makes it 3x more likely for your booking requests to be accepted!')}</Text>
        </View>

        <Text style={styles.sectionTitle}>{t('recentReviews', 'RECENT REVIEWS')}</Text>

        {reviews.length === 0 && !isLoading ? (
            <View style={styles.emptyState}>
                <Icon name="star-outline" size={48} color={theme.colors.textSecondary} style={{opacity: 0.5, marginBottom: 16}} />
                <Text style={styles.emptyTitle}>{t('emptyTitle', 'No reviews yet')}</Text>
                <Text style={styles.emptySub}>{t('emptySub', 'Book a meetup with a companion. After your session, their review will appear here.')}</Text>
            </View>
        ) : (
            <View style={styles.reviewsList}>
                {reviews.map(rev => (
                    <View key={rev.id} style={styles.reviewCard}>
                        <View style={styles.reviewHeader}>
                            <View style={styles.reviewerInfo}>
                                <View style={styles.avatarPlaceholder}>
                                    <Text style={styles.avatarInitials}>{(rev.companionName || 'C').charAt(0)}</Text>
                                </View>
                                <View>
                                    <Text style={styles.reviewerName}>{rev.companionName || t('unknownCompanion', 'Companion')}</Text>
                                    <Text style={styles.reviewDate}>{new Date(rev.createdAt).toLocaleDateString()}</Text>
                                </View>
                            </View>
                            <View style={styles.ratingBadge}>
                                <Text style={styles.ratingText}>{rev.rating}</Text>
                                <Icon name="star" size={12} color={theme.colors.primary} />
                            </View>
                        </View>
                        {rev.text ? <Text style={styles.reviewComment}>{rev.text}</Text> : null}
                    </View>
                ))}
            </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.textPrimary },
  
  scrollContent: { padding: 16, paddingBottom: 40 },
  
  heroCard: { backgroundColor: theme.colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.2)', overflow: 'hidden', marginBottom: 16 },
  heroGlow: { position: 'absolute', top: -50, left: '20%', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(212,175,55,0.05)' },
  heroSubtitle: { fontSize: 12, color: theme.colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, fontWeight: 'bold' },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 8 },
  scoreText: { fontSize: 56, fontWeight: 'bold', color: theme.colors.textPrimary },
  scoreTotal: { fontSize: 24, fontWeight: 'bold', color: theme.colors.textSecondary },
  reviewsCount: { fontSize: 13, color: theme.colors.textSecondary },

  trustBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(16, 185, 129, 0.05)', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)', marginBottom: 32 },
  trustBannerText: { flex: 1, fontSize: 12, color: theme.colors.success, lineHeight: 18, fontWeight: '500' },

  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: theme.colors.textPrimary, letterSpacing: 1, marginBottom: 16, paddingLeft: 4 },
  
  emptyState: { alignItems: 'center', padding: 40, backgroundColor: theme.colors.surface, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border, borderStyle: 'dashed' },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 8 },
  emptySub: { fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  reviewsList: { gap: 16 },
  reviewCard: { backgroundColor: theme.colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: theme.colors.border },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  reviewerInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  avatarInitials: { fontSize: 16, fontWeight: 'bold', color: theme.colors.textSecondary },
  reviewerName: { fontSize: 15, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 2 },
  reviewDate: { fontSize: 11, color: theme.colors.textSecondary },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(212, 175, 55, 0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  ratingText: { fontSize: 13, fontWeight: 'bold', color: theme.colors.primary },
  reviewComment: { fontSize: 14, color: theme.colors.textSecondary, lineHeight: 22 }
});
