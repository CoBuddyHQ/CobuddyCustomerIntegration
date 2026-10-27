import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { useBookingStore } from '../../store/slices/bookingStore';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { discoveryApi } from '../../services/api';
import type { ActivityOption } from '../../services/api/discovery.api';

export const BookingActivitySelectScreen = () => { 
  const { t } = useTranslation('booking.activitySelect');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<any>();
  const { companionId, companionName } = route.params || {};
  const { smartGoBack } = useSmartNavigation();
  const { setDraftBooking, clearDraftBooking } = useBookingStore();

  const [activitiesList, setActivitiesList] = React.useState<ActivityOption[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const isMounted = React.useRef(false);

  React.useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const loadActivities = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);
    setSelectedActivityId(null);
    try {
      const data = await discoveryApi.getActivities();
      if (isMounted.current) setActivitiesList(data);
    } catch {
      if (isMounted.current) {
        setActivitiesList([]);
        setLoadError(true);
      }
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const handleNext = () => {
    if (!selectedActivityId) return;
    
    const selectedActivity = activitiesList.find(a => a.id === selectedActivityId);
    if (!selectedActivity) return;
    const activityTitle = selectedActivity.titleKey
      ? (t(selectedActivity.titleKey, selectedActivity.defaultTitle || selectedActivity.name || 'Activity') as string)
      : (selectedActivity.defaultTitle || selectedActivity.name || 'Activity');
    setDraftBooking({ activity: activityTitle });
    
    navigation.navigate('BookingVenueSelectScreen', {
      activity: selectedActivity,
      companionId,
      companionName,
    });
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      {/* Top Header & Progress */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => {
          clearDraftBooking();
          smartGoBack();
        }} accessibilityRole="button" accessibilityLabel={t('a11yGoBack', 'Go back')}>
          <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('headerTitle', 'Step 1 of 4')}</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: '25%' }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t('title', 'What would you like to do?')}</Text>
        <Text style={styles.subtitle}>{t('subtitle', 'Select an activity for your booking request.')}</Text>

        <View style={styles.listContainer}>
          {isLoading ? (
            <View style={styles.statusPanel}>
              <ActivityIndicator color={theme.colors.primary} />
              <Text style={styles.statusText}>{t('loadingActivities', 'Loading activities…')}</Text>
            </View>
          ) : loadError ? (
            <View style={styles.statusPanel}>
              <Text style={styles.statusText}>{t('activitiesUnavailable', 'Activities could not be loaded. Check your connection and try again.')}</Text>
              <TouchableOpacity onPress={loadActivities} style={styles.retryBtn} accessibilityRole="button">
                <Text style={styles.retryText}>{t('retry', 'Retry')}</Text>
              </TouchableOpacity>
            </View>
          ) : activitiesList.length === 0 ? (
            <View style={styles.statusPanel}>
              <Text style={styles.statusText}>{t('noActivities', 'No activities are available right now.')}</Text>
            </View>
          ) : activitiesList.map((activity) => {
            const isSelected = selectedActivityId === activity.id;
            return (
              <TouchableOpacity
                key={activity.id}
                style={[styles.card, isSelected && styles.cardSelected]}
                onPress={() => setSelectedActivityId(activity.id)}
                activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={activity.defaultTitle || activity.name || t('activity', 'Activity')}
              >
                <View style={[styles.iconWrap, isSelected && styles.iconWrapSelected]}>
                  <Icon 
                    name={activity.icon || 'star'} 
                    size={24} 
                    color={isSelected ? theme.colors.background : theme.colors.primary} 
                  />
                </View>
                
                <View style={styles.cardContent}>
                  <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>
                    {activity.titleKey ? (t(activity.titleKey, activity.defaultTitle || activity.name || 'Activity') as string) : (activity.defaultTitle || activity.name || t('activity', 'Activity'))}
                  </Text>
                  {(activity.descKey || activity.defaultDesc) ? (
                    <Text style={[styles.cardDesc, isSelected && styles.cardDescSelected]}>
                      {activity.descKey ? (t(activity.descKey, activity.defaultDesc || '') as string) : activity.defaultDesc}
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.nextBtn, (!selectedActivityId || isLoading || loadError || activitiesList.length === 0) && styles.nextBtnDisabled]}
          disabled={!selectedActivityId || isLoading || loadError || activitiesList.length === 0}
          onPress={handleNext}
          activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={t('a11yContinue', 'Continue')}
        >
          <Text style={[styles.nextBtnText, (!selectedActivityId || isLoading || loadError || activitiesList.length === 0) && styles.nextBtnTextDisabled]}>{t('continue', 'Continue')}</Text>
          <Icon 
            name="arrow-right" 
            size={20} 
            color={selectedActivityId ? theme.colors.background : 'rgba(255,255,255,0.4)'} 
          />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  progressContainer: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
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
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    marginBottom: 32,
  },
  listContainer: {
    gap: 16,
  },
  statusPanel: {
    alignItems: 'center',
    gap: 12,
    padding: 24,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statusText: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  retryBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
  },
  retryText: { color: theme.colors.background, fontWeight: '700' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardSelected: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderColor: theme.colors.primary,
  },
  iconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  iconWrapSelected: {
    backgroundColor: theme.colors.primary,
  },
  cardContent: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  cardTitleSelected: {
    color: theme.colors.primary,
  },
  cardDesc: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  cardDescSelected: {
    color: 'rgba(212, 175, 55, 0.8)',
  },
  bottomBar: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    backgroundColor: theme.colors.surface,
  },
  nextBtn: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 28,
    gap: 8,
  },
  nextBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  nextBtnText: {
    color: theme.colors.background,
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  nextBtnTextDisabled: {
    color: 'rgba(255,255,255,0.4)',
  },
});
