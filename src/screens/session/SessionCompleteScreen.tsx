import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export const SessionCompleteScreen = () => { 
  const { t } = useTranslation('session.complete');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<any>();
  const { companionId, companionName, sessionId, bookingId } = route.params || {};
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleContinueToReview = () => {
    navigation.replace('CompanionReviewScreen', {
      companionId,
      companionName: companionName || 'Companion',
      sessionId,
      bookingId,
    });
  };

  const handleBackToDashboard = () => {
    navigation.reset({ index: 0, routes: [{ name: 'MainTabNavigator' }] });
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      <Animated.ScrollView contentContainerStyle={styles.scrollContent} style={{ opacity: fadeAnim }}>
        
        <View style={styles.mainArea}>
          <View style={styles.iconCircle}>
            <Icon name="check-decagram" size={68} color={theme.colors.success} />
          </View>

          <Text style={styles.title}>
            {t('title', 'Session Completed! 🎉')}
          </Text>
          <Text style={styles.subtitle}>
            {companionName 
              ? `You have successfully completed your meetup with ${companionName}.`
              : 'Your meetup has been successfully completed.'}
          </Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>SESSION SUMMARY</Text>
            
            <View style={styles.row}>
              <Text style={styles.label}>Companion</Text>
              <Text style={styles.value}>{companionName || 'Companion'}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.label}>Status</Text>
              <View style={styles.statusBadge}>
                <Icon name="check-circle" size={14} color={theme.colors.success} style={{ marginRight: 4 }} />
                <Text style={styles.statusBadgeText}>Completed</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.label}>Safety & Verification</Text>
              <Text style={[styles.value, { color: theme.colors.primary }]}>Verified Meetup ✓</Text>
            </View>
          </View>

          <View style={styles.ratingPrompt}>
            <Icon name="star-outline" size={22} color={theme.colors.primary} />
            <Text style={styles.ratingPromptText}>
              Share your feedback to help the community and recognize your companion!
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.primaryBtn} 
            onPress={handleContinueToReview}
            accessibilityRole="button"
            accessibilityLabel="Rate & Review Companion"
          >
            <Icon name="star" size={20} color={theme.colors.background} style={{ marginRight: 8 }} />
            <Text style={styles.primaryBtnText}>Rate & Review Companion</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryBtn} 
            onPress={handleBackToDashboard}
            accessibilityRole="button"
            accessibilityLabel="Back to Home"
          >
            <Text style={styles.secondaryBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>

      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'space-between' },
  mainArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  iconCircle: { width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(16, 185, 129, 0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  
  title: { fontSize: 26, fontWeight: '900', color: theme.colors.textPrimary, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 15, color: theme.colors.textSecondary, marginBottom: 30, textAlign: 'center', lineHeight: 22 },

  card: { width: '100%', backgroundColor: theme.colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 20 },
  cardTitle: { fontSize: 12, fontWeight: '900', color: theme.colors.textSecondary, letterSpacing: 1.5, marginBottom: 16, textTransform: 'uppercase' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 4 },
  label: { fontSize: 14, color: theme.colors.textSecondary },
  value: { fontSize: 15, color: theme.colors.textPrimary, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 12 },

  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusBadgeText: { fontSize: 13, fontWeight: 'bold', color: theme.colors.success },

  ratingPrompt: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(212, 175, 55, 0.1)', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.3)', width: '100%' },
  ratingPromptText: { flex: 1, fontSize: 13, color: theme.colors.textPrimary, lineHeight: 18 },

  footer: { width: '100%', marginTop: 30, paddingBottom: 10 },
  primaryBtn: { width: '100%', backgroundColor: theme.colors.primary, height: 54, borderRadius: 27, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  primaryBtnText: { color: theme.colors.background, fontSize: 16, fontWeight: 'bold' },
  secondaryBtn: { width: '100%', backgroundColor: 'transparent', height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border, marginTop: 12 },
  secondaryBtnText: { color: theme.colors.textPrimary, fontSize: 15, fontWeight: '600' },
});
