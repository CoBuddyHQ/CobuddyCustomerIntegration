import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';

export interface CompanionCardProps {
  id: string;
  name: string;
  initials?: string;
  photoUrl?: string; // Optional, fallback to initials if none
  title?: string; // The sub-line below name
  activities?: string[];
  trustScore?: number;
  rating?: number;
  reviews?: number | { count?: number; average?: number };
  reviewsCount?: number;
  sessions?: number;
  sessionsCount?: number;
  rate?: string; // e.g. "₹500 /hr"
  distance?: string; // e.g. "2.5 km away"
  isOnline?: boolean;
  city?: string | null;
  onPress: (id: string) => void;
}

export const CompanionCard = ({
  id,
  name,
  initials = name?.charAt(0) || 'C',
  photoUrl,
  title = 'Companion',
  activities = [],
  trustScore = 95,
  rating = 4.8,
  reviews = 10,
  reviewsCount,
  sessions = 12,
  sessionsCount,
  rate = '₹500 /hr',
  distance,
  isOnline = false,
  onPress,
}: CompanionCardProps) => {
  const { t } = useTranslation('common');
  const computedReviews = typeof reviews === 'object' ? (reviews as any)?.count ?? 0 : (reviews ?? reviewsCount ?? 0);
  const computedSessions = sessions ?? sessionsCount ?? 0;

  return (
    <View style={styles.cardContainer}>
      
      {/* Top Section */}
      <View style={styles.topSection}>
        
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
        </View>

        {/* Info Column */}
        <View style={styles.infoCol}>
          
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
            <View style={styles.trustBadge}>
              <Icon name="shield-check" size={12} color={theme.colors.textPrimary} />
              <Text style={styles.trustScore}>{trustScore}</Text>
            </View>
            {isOnline && <View style={styles.onlineDot} />}
          </View>

          <Text style={styles.title} numberOfLines={1}>{title}</Text>

          <View style={styles.statsRow}>
            <Icon name="star" size={14} color={theme.colors.primary} />
            <Text style={styles.statsText}>{rating} <Text style={styles.statsMuted}>{t('companionCard.statsMuted', '• {{reviews}} reviews • {{sessions}} sessions', { reviews: computedReviews, sessions: computedSessions })}</Text></Text>
          </View>
          
          {distance && (
            <View style={[styles.statsRow, { marginTop: 4 }]}>
              <Icon name="map-marker-outline" size={14} color={theme.colors.textSecondary} />
              <Text style={styles.statsMuted}>{distance}</Text>
            </View>
          )}
          
        </View>
      </View>

      {/* Chips Section */}
      <View style={styles.chipsRow}>
        {activities.map((act, idx) => (
          <View key={idx} style={styles.chip}>
            <Text style={styles.chipText}>{act}</Text>
          </View>
        ))}
      </View>

      {/* Bottom Action Section */}
      <View style={styles.bottomRow}>
        <Text style={styles.rateLabel}>{t('companionCard.fromRate', 'From ')}<Text style={styles.rateValue}>{rate}</Text></Text>
        
        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.8}
          onPress={() => onPress(id)}
          accessibilityRole="button"
          accessibilityLabel={`${t('companionCard.viewProfile', 'View Profile')} for ${name}`}
        >
          <Text style={styles.actionBtnText}>{t('companionCard.viewProfile', 'View Profile')}</Text>
          <Icon name="arrow-right" size={16} color={theme.colors.background} />
        </TouchableOpacity>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  topSection: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 24,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  trustScore: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.success,
    marginLeft: 8,
  },
  title: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statsText: {
    fontSize: 13,
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
  },
  statsMuted: {
    color: theme.colors.textSecondary,
    fontWeight: 'normal',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  chipText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rateLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  rateValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.background,
  },
});
