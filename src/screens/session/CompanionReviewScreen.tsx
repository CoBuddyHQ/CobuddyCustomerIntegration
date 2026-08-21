import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { adminValues } from '../../config/adminValues';
import { reviewsApi } from '../../services/api';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export const CompanionReviewScreen = () => { 
  const { t } = useTranslation('session.companionReview');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [publicReview, setPublicReview] = useState('');
  const [privateFeedback, setPrivateFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const route = useRoute<any>();
  const { companionId, companionName, bookingId, sessionId } = route.params || {};

  const toggleTag = (id: string) => {
    setSelectedTags(prev => 
      prev.includes(id) ? prev.filter(tag => tag !== id) : [...prev, id]
    );
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      if (rating > 0) {
        await reviewsApi.createReview({
          companionId: companionId || 'c1',
          bookingId,
          sessionId,
          rating,
          text: publicReview,
          tags: selectedTags,
        });
      }
    } catch {
      // Graceful fallback
    } finally {
      setIsSubmitting(false);
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabNavigator' }],
      });
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      <View style={styles.header}>
        <View style={styles.iconBtnPlaceholder} />
        <Text style={styles.headerTitle}>{t('headerTitle', 'Leave a Review')}</Text>
        <View style={styles.iconBtnPlaceholder} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          
          {/* Rating Section */}
          <View style={styles.ratingSection}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{(companionName || 'Elena Vasquez').charAt(0)}</Text>
            </View>
            <Text style={styles.question}>{t('questionRate', 'Rate your time with {{name}}', { name: (companionName || 'Elena Vasquez') })}</Text>
            
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity key={star} onPress={() => setRating(star)} style={styles.starBtn} accessibilityRole="button" accessibilityLabel={t('a11yReview', 'Review')}>
                  <Icon 
                    name={rating >= star ? 'star' : 'star-outline'} 
                    size={48} 
                    color={rating >= star ? theme.colors.primary : theme.colors.textSecondary} 
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Review Tags */}
          <View style={styles.tagsSection}>
            <Text style={styles.tagsHeader}>{t('tagsPraiseHeader', 'Praise')}</Text>
            <View style={styles.tagsContainer}>
              {adminValues.reviewTags.praise.map(tag => {
                const isSelected = selectedTags.includes(tag);
                const label = tag.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                return (
                  <TouchableOpacity 
                    key={tag} 
                    style={[styles.tagBadge, isSelected && styles.tagBadgeSelectedPraise]}
                    onPress={() => toggleTag(tag)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>{t(`tag.${tag}`, label)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.tagsHeader}>{t('tagsConcernHeader', 'Concerns')}</Text>
            <View style={styles.tagsContainer}>
              {adminValues.reviewTags.concern.map(tag => {
                const isSelected = selectedTags.includes(tag);
                const label = tag.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                return (
                  <TouchableOpacity 
                    key={tag} 
                    style={[styles.tagBadge, isSelected && styles.tagBadgeSelectedConcern]}
                    onPress={() => toggleTag(tag)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>{t(`tag.${tag}`, label)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Public Review */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('publicReviewLabel', 'PUBLIC REVIEW (OPTIONAL)')}</Text>
            <TextInput
              style={styles.textArea}
              placeholder={t('placeholder.PublicReview', 'Share your experience to help the community...')}
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              numberOfLines={4}
              value={publicReview}
              onChangeText={setPublicReview}
              textAlignVertical="top"
            />
          </View>

          {/* Private Feedback */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('privateFeedbackLabel', 'PRIVATE FEEDBACK TO COBUDDY TEAM (OPTIONAL)')}</Text>
            <TextInput
              style={styles.textArea}
              placeholder={t('placeholder.PrivateFeedback', 'Any private comments or safety concerns...')}
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              numberOfLines={3}
              value={privateFeedback}
              onChangeText={setPrivateFeedback}
              textAlignVertical="top"
            />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.submitBtn, rating === 0 && styles.submitBtnDisabled]} 
          onPress={handleFinish}
          disabled={rating === 0 || isSubmitting}
          accessibilityRole="button" 
          accessibilityLabel={t('a11ySubmitReview', 'Submit Review')}
        >
          <Text style={styles.submitBtnText}>{t('submitBtn', 'Submit Review')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  iconBtnPlaceholder: { width: 40 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.textPrimary },
  content: { padding: 20 },
  ratingSection: { alignItems: 'center', marginVertical: 24 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: theme.colors.border },
  avatarInitials: { fontSize: 32, fontWeight: 'bold', color: theme.colors.primary },
  question: { fontSize: 18, fontWeight: 'bold', color: theme.colors.textPrimary, textAlign: 'center', marginBottom: 20 },
  starsRow: { flexDirection: 'row', gap: 12 },
  starBtn: { padding: 4 },
  tagsSection: { marginBottom: 24 },
  tagsHeader: { fontSize: 13, fontWeight: 'bold', color: theme.colors.textSecondary, letterSpacing: 0.5, marginBottom: 12, marginTop: 8 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  tagBadge: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  tagBadgeSelectedPraise: { backgroundColor: 'rgba(217, 119, 6, 0.15)', borderColor: theme.colors.primary },
  tagBadgeSelectedConcern: { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: theme.colors.error },
  tagText: { fontSize: 13, color: theme.colors.textSecondary, fontWeight: '500' },
  tagTextSelected: { color: theme.colors.textPrimary, fontWeight: 'bold' },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 12, fontWeight: 'bold', color: theme.colors.textSecondary, letterSpacing: 0.5, marginBottom: 8 },
  textArea: { backgroundColor: theme.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, padding: 16, color: theme.colors.textPrimary, fontSize: 15, minHeight: 100 },
  footer: { padding: 20, paddingBottom: 32, backgroundColor: theme.colors.background, borderTopWidth: 1, borderTopColor: theme.colors.border },
  submitBtn: { backgroundColor: theme.colors.primary, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: theme.colors.background, fontSize: 16, fontWeight: 'bold' }
});
