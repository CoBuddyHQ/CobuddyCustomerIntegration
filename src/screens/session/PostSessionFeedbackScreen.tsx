import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { sessionApi } from '../../services/api';

export const PostSessionFeedbackScreen = () => { 
  const { t } = useTranslation('session.postFeedback');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<any>();
  const { companionName, sessionId } = route.params || {};
  const { smartGoBack } = useSmartNavigation();
  const [sentiment, setSentiment] = useState<'up' | 'down' | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  const positiveTags = ['Great Listener', 'Punctual', 'Fun & Energetic', 'Dressed Well', 'Polite', 'Safe & Comforting'];
  const negativeTags = ['Late', 'Rude/Unprofessional', 'Catfished/Fake Profile', 'Made me uncomfortable', 'Boring'];

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleSubmitFeedback = async () => {
    if (!sessionId || !sentiment || selectedTags.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(false);
    try {
      const result = await sessionApi.submitFeedback(sessionId, sentiment, selectedTags);
      if (!result?.message) throw new Error('The Customer Backend did not confirm feedback.');
      navigation.reset({ index: 0, routes: [{ name: 'MainTabNavigator' }] });
    } catch {
      setSubmitError(true);
      Alert.alert('Feedback not submitted', 'The Customer Backend did not confirm that your feedback was saved. Retry when connected.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => navigation.reset({ index: 0, routes: [{ name: 'MainTabNavigator' }] });

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => smartGoBack()} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel={t('a11yGoBack', 'Go back')}>
          <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('headerTitle', 'Quick Feedback')}</Text>
        <TouchableOpacity onPress={handleSkip} accessibilityRole="button" accessibilityLabel={t('a11ySkip', 'Skip')}>
          <Text style={styles.skipBtn}>{t('skipBtn', 'Skip')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.question}>{t('questionRate', 'How was your session with {{name}}?', { name: companionName || t('companion', 'Companion') })}</Text>
        
        <View style={styles.sentimentRow}>
          <TouchableOpacity 
            style={[styles.sentimentBtn, sentiment === 'down' && styles.sentimentBtnDown]}
            onPress={() => { setSentiment('down'); setSelectedTags([]); }} accessibilityRole="button" accessibilityLabel={sentiment === 'down' ? t('a11ySentimentDownSelected', 'Thumbs down, selected') : t('a11ySentimentDown', 'Thumbs down')}
          >
            <Icon name={sentiment === 'down' ? 'thumb-down' : 'thumb-down-outline'} size={40} color={sentiment === 'down' ? theme.colors.background : theme.colors.error} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.sentimentBtn, sentiment === 'up' && styles.sentimentBtnUp]}
            onPress={() => { setSentiment('up'); setSelectedTags([]); }} accessibilityRole="button" accessibilityLabel={sentiment === 'up' ? t('a11ySentimentUpSelected', 'Thumbs up, selected') : t('a11ySentimentUp', 'Thumbs up')}
          >
            <Icon name={sentiment === 'up' ? 'thumb-up' : 'thumb-up-outline'} size={40} color={sentiment === 'up' ? theme.colors.background : theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {sentiment && (
          <View style={styles.tagsSection}>
            <Text style={styles.tagsTitle}>{t('tagsTitle', 'What stood out?')}</Text>
            <View style={styles.tagsContainer}>
              {(sentiment === 'up' ? positiveTags : negativeTags).map(tag => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <TouchableOpacity 
                    key={tag} 
                    style={[styles.tagBadge, isSelected && styles.tagBadgeSelected]}
                    onPress={() => handleTagToggle(tag)} accessibilityRole="button" accessibilityLabel={t('a11yTag', 'tag')}
                  >
                    <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>{t(`tags.${tag.replace(/[^a-zA-Z0-9]/g, '')}`, tag)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        {submitError ? <Text accessibilityRole="alert" style={styles.submitError}>Your feedback has not been confirmed as saved.</Text> : null}
        <TouchableOpacity 
          style={[styles.primaryBtn, (!sentiment || selectedTags.length === 0) && { opacity: 0.5 }]} 
          disabled={!sessionId || !sentiment || selectedTags.length === 0 || isSubmitting}
          onPress={handleSubmitFeedback} accessibilityRole="button" accessibilityLabel={t('a11yContinue', 'Submit Feedback')}
        >
          <Text style={styles.primaryBtnText}>{isSubmitting ? 'Saving…' : t('continueBtn', 'Submit feedback')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16 },
  iconBtn: { padding: 8, backgroundColor: theme.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: theme.colors.textPrimary },
  skipBtn: { fontSize: 15, fontWeight: 'bold', color: theme.colors.textSecondary, paddingHorizontal: 8 },
  
  content: { padding: 24, paddingBottom: 60, alignItems: 'center' },
  question: { fontSize: 22, fontWeight: 'bold', color: theme.colors.textPrimary, textAlign: 'center', marginBottom: 40 },
  
  sentimentRow: { flexDirection: 'row', gap: 40, marginBottom: 40 },
  sentimentBtn: { width: 100, height: 100, borderRadius: 50, backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: theme.colors.border },
  sentimentBtnUp: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  sentimentBtnDown: { backgroundColor: theme.colors.error, borderColor: theme.colors.error },

  tagsSection: { width: '100%', marginTop: 20 },
  tagsTitle: { fontSize: 16, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 16, textAlign: 'center' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  
  tagBadge: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 4 },
  tagBadgeSelected: { backgroundColor: 'rgba(212, 175, 55, 0.15)', borderColor: theme.colors.primary },
  tagText: { color: theme.colors.textSecondary, fontSize: 14, fontWeight: '500' },
  tagTextSelected: { color: theme.colors.primary, fontWeight: 'bold' },

  bottomBar: { padding: 20, paddingBottom: 32, backgroundColor: theme.colors.surface, borderTopWidth: 1, borderTopColor: theme.colors.border },
  primaryBtn: { width: '100%', backgroundColor: theme.colors.primary, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: theme.colors.background, fontSize: 15, fontWeight: 'bold' },
  submitError: { color: theme.colors.error, fontSize: 13, textAlign: 'center', marginBottom: 10 },
});
