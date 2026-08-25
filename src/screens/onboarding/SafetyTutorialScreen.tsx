import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';
import { Button } from '../../components/ui/Button';
import { BottomActionBar } from '../../components/ui/BottomActionBar';
import { AppBottomSheet } from '../../components/ui/AppBottomSheet';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { OnboardingHeader } from '../../components/onboarding/OnboardingHeader';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlowTracker } from '../../services/flowTracker';

const { width: SW } = Dimensions.get('window');

interface Slide {
  id: string;
  visual: 'shield' | 'venue' | 'live' | 'community';
}

const SLIDES: Slide[] = [
  { id: 'verified', visual: 'shield' },
  { id: 'public', visual: 'venue' },
  { id: 'live', visual: 'live' },
  { id: 'community', visual: 'community' },
];

const SAFETY_DETAILS = [
  { id: 'identity', iconName: 'fingerprint' },
  { id: 'contacts', iconName: 'contacts' },
  { id: 'verified', iconName: 'shield-check' },
];

function SlideVisual({ visual }: { visual: Slide['visual'] }) {
  const { t } = useTranslation(['onboarding']);
  if (visual === 'shield') {
    return (
      <View style={visualStyles.shieldWrap}>
        <View style={visualStyles.shieldGlow} />
        <View style={visualStyles.shieldCard}>
          <View style={visualStyles.shieldIconWrap}>
            <Icon name="shield-check-outline" size={80} color={theme.colors.primary} />
            <View style={visualStyles.shieldBadge}>
              <Icon name="star" size={12} color={theme.colors.background} />
            </View>
          </View>
        </View>
      </View>
    );
  }
  if (visual === 'venue') {
    return (
      <View style={visualStyles.venueCard}>
        <View style={visualStyles.venueImagePlaceholder}>
          <View style={{ opacity: 0.12 }}>
            <Icon name="bed-king-outline" size={64} color={theme.colors.textPrimary} />
          </View>
        </View>
        <View style={visualStyles.venueOverlay} />
        <View style={visualStyles.venueBadge}>
          <Icon name="map-marker" size={14} color={theme.colors.primary} />
          <Text style={visualStyles.venueBadgeText}>{t('safety.verifiedVenue', 'VERIFIED VENUE')}</Text>
        </View>
      </View>
    );
  }
  if (visual === 'live') {
    return (
      <View style={visualStyles.liveCard}>
        <View style={visualStyles.liveHeader}>
          <Icon name="lock-outline" size={22} color={theme.colors.primary} />
          <View style={visualStyles.liveDots}>
            <View style={[visualStyles.liveDot, { opacity: 1 }]} />
            <View style={[visualStyles.liveDot, { opacity: 0.5 }]} />
          </View>
        </View>
        <View style={visualStyles.liveRow}>
          <View style={[visualStyles.liveIconSmallWrap, { backgroundColor: 'rgba(74,222,128,0.2)' }]}>
            <Icon name="broadcast" size={16} color={theme.colors.primary} />
          </View>
          <View style={visualStyles.liveBar} />
        </View>
        <View style={visualStyles.liveRow}>
          <View style={[visualStyles.liveIconSmallWrap, { backgroundColor: 'rgba(212,175,55,0.2)' }]}>
            <Icon name="phone-outline" size={16} color={theme.colors.primary} />
          </View>
          <View style={[visualStyles.liveBar, { width: '66%' }]} />
        </View>
      </View>
    );
  }
  return (
    <View style={visualStyles.communityWrap}>
      <View style={[visualStyles.avatar, { marginRight: -24, zIndex: 2 }]}>
        <View style={{ opacity: 0.4 }}>
          <Icon name="account-outline" size={48} color={theme.colors.textSecondary} />
        </View>
      </View>
      <View style={[visualStyles.avatar, { marginTop: 40 }]}>
        <View style={{ opacity: 0.4 }}>
          <Icon name="account-outline" size={48} color={theme.colors.textSecondary} />
        </View>
      </View>
    </View>
  );
}

export const SafetyTutorialScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { smartGoBack } = useSmartNavigation();
  const { t } = useTranslation(['onboarding']);
  const [current, setCurrent] = useState(0);
  const [showLearnMore, setShowLearnMore] = useState(false);
  const listRef = useRef<FlatList<Slide>>(null);

  React.useEffect(() => {
    FlowTracker.saveActiveScreen('SafetyTutorialScreen');
  }, []);

  const isLast = current === SLIDES.length - 1;

  const goNext = () => {
    if (!isLast) {
      const next = current + 1;
      listRef.current?.scrollToIndex({ index: next, animated: true });
    } else {
      navigation.navigate('TrustedContactsScreen');
    }
  };

  const renderSlide = ({ item }: ListRenderItemInfo<Slide>) => (
    <View style={[slideStyles.slide, { width: SW }]}>
      <SlideVisual visual={item.visual} />
      <Text style={slideStyles.title}>{t(`safety.slides.${item.id}.title`)}</Text>
      <Text style={slideStyles.body}>{t(`safety.slides.${item.id}.body`)}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <OnboardingHeader
        showBack={navigation.canGoBack()}
        onBack={() => smartGoBack()}
        centerLabel={t('safety.header')}
        showProgress
        currentStep={4}
        totalSteps={5}
        rightNode={
          <TouchableOpacity
            onPress={() => navigation.navigate('TrustedContactsScreen')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel={t('safety.a11yNext', 'Go to next step')}>
            <Text style={styles.skipText}>{t('safety.btn_skip')}</Text>
          </TouchableOpacity>
        }
      />

      <FlatList<Slide>
        ref={listRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={i => i.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / SW);
          setCurrent(idx);
        }}
        style={styles.carousel}
      />

      {/* Progress Dots */}
      <View style={styles.pagination}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, current === i && styles.dotActive]} />
        ))}
      </View>

      <BottomActionBar>
        <Button
          title={isLast ? t('safety.btn_finish') : t('safety.btn_next')}
          onPress={goNext}
        />
        <TouchableOpacity style={styles.learnMoreBtn} onPress={() => setShowLearnMore(true)} accessibilityRole="button" accessibilityLabel={t('safety.a11yLearnMore', 'Learn more about safety')}>
          <Text style={styles.learnMoreText}>{t('safety.btn_learn_more')}</Text>
        </TouchableOpacity>
      </BottomActionBar>

      <AppBottomSheet
        visible={showLearnMore}
        onClose={() => setShowLearnMore(false)}
        title={t('safety.modal.title')}>
        {SAFETY_DETAILS.map(d => (
          <View key={d.id} style={modal.detailRow}>
            <View style={modal.detailIconWrap}>
              <Icon name={d.iconName} size={20} color={theme.colors.primary} />
            </View>
            <View style={modal.detailMeta}>
              <Text style={modal.detailLabel}>{t(`safety.modal.${d.id}_label`)}</Text>
              <Text style={modal.detailText}>{t(`safety.modal.${d.id}_text`)}</Text>
            </View>
          </View>
        ))}
        <Button title={t('safety.modal.btn_understood')} onPress={() => setShowLearnMore(false)} />
        <View style={{height: 16}} />
      </AppBottomSheet>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  skipText: {
    fontSize: 11,
    letterSpacing: 2,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  carousel: { flex: 1 },
  pagination: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.border },
  dotActive: { backgroundColor: theme.colors.primary, width: 24 },
  learnMoreBtn: { alignItems: 'center', paddingVertical: 12 },
  learnMoreText: { fontSize: 13, letterSpacing: 1, color: theme.colors.textSecondary, fontWeight: 'bold' },
});

const slideStyles = StyleSheet.create({
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 24,
  },
  title: {
    fontSize: 26,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginTop: 28,
    marginBottom: 14,
    lineHeight: 34,
    fontWeight: 'bold',
  },
  body: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 340,
  },
});

const visualStyles = StyleSheet.create({
  shieldWrap: { alignItems: 'center', justifyContent: 'center', width: '100%', height: 200 },
  shieldGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(212,175,55,0.05)',
  },
  shieldCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 36,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 80,
    elevation: 6,
  },
  shieldIconWrap: { position: 'relative' },
  shieldBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: theme.colors.primary,
    borderRadius: 14,
    padding: 6,
  },

  venueCard: {
    width: '100%',
    height: 200,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  venueImagePlaceholder: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
  },
  venueOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(20,20,15,0.5)',
  },
  venueBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  venueBadgeText: {
    fontSize: 10,
    letterSpacing: 2,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },

  liveCard: {
    width: '100%',
    backgroundColor: 'rgba(212,175,55,0.05)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.2)',
    padding: 20,
    gap: 14,
  },
  liveHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  liveDots: { flexDirection: 'row', gap: 6 },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  liveIconSmallWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveBar: {
    height: 8,
    width: '50%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
  },

  communityWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: theme.colors.background,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});

const modal = StyleSheet.create({
  detailRow: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  detailIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(212,175,55,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  detailMeta: { flex: 1 },
  detailLabel: {
    fontSize: 11,
    letterSpacing: 2,
    color: theme.colors.primary,
    fontWeight: '600',
    marginBottom: 6,
  },
  detailText: { fontSize: 13, color: theme.colors.textSecondary, lineHeight: 19 },
});
