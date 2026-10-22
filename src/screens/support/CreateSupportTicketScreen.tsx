import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, StatusBar, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { supportApi } from '../../services/api';



export const CreateSupportTicketScreen = () => { 
  const { t } = useTranslation('support.createTicket');

  const CATEGORIES = [
  { id: 'payment', label: t('ticket.paymentRefunds', 'Payment & Refunds'), icon: 'credit-card-outline' },
  { id: 'booking', label: t('ticket.bookingIssue', 'Booking Issue'), icon: 'calendar-check-outline' },
  { id: 'safety', label: t('ticket.safetyConcern', 'Report a Safety Concern'), icon: 'shield-alert-outline' },
  { id: 'account', label: t('ticket.techSupport', 'Account & Tech Support'), icon: 'account-cog-outline' }
];

  const { smartGoBack } = useSmartNavigation();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selectedCategory || !subject.trim() || !description.trim()) {
      Alert.alert(t('alertTitleIncomplete', 'Incomplete'), t('alertMsgPleaseselectacategor', 'Please select a category and fill out all fields.'));
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const ticket = await supportApi.createTicket({
        category: selectedCategory,
        subject: subject.trim(),
        message: description.trim(),
      });
      if (!ticket?.id) throw new Error('The Customer Backend did not confirm the ticket.');
      Alert.alert(
        t('alertTitleTicketSubmitted', 'Ticket recorded'),
        t('alertMsgTicketRecorded', 'The Customer Backend saved your ticket. Response timing is not guaranteed.'),
        [{ text: t('okBtn', 'OK'), onPress: () => smartGoBack() }],
      );
    } catch {
      setSubmitError(t('alertMsgTicketFailed', 'The Customer Backend did not confirm ticket creation. The ticket has not been marked as submitted.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => smartGoBack()} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={t('a11yGoBack', 'Go back')}>
          <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('headerTitle', 'Create Ticket')}</Text>
        <View style={styles.backBtn} />
      </View>

      <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <Text style={styles.sectionTitle}>{t('whatDoYouNeedHelpWith', 'WHAT DO YOU NEED HELP WITH?')}</Text>
          <View style={styles.categoriesContainer}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity 
                key={cat.id} 
                style={[styles.categoryCard, selectedCategory === cat.id && styles.categoryCardActive]}
                onPress={() => setSelectedCategory(cat.id)}
                activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={cat.label}
              >
                <Icon 
                  name={cat.icon} 
                  size={24} 
                  color={selectedCategory === cat.id ? theme.colors.primary : theme.colors.textSecondary} 
                />
                <Text style={[styles.categoryLabel, selectedCategory === cat.id && styles.categoryLabelActive]}>
                  {cat.label}
                </Text>
                {selectedCategory === cat.id && (
                  <View style={styles.checkBadge}>
                    <Icon name="check" size={14} color={theme.colors.background} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>{t('subject', 'SUBJECT')}</Text>
            <View style={styles.inputContainer}>
              <TextInput 
                style={styles.input}
                placeholder={t('placeholder.BrieflyDescribe', 'Briefly describe the issue')}
                placeholderTextColor={theme.colors.textSecondary}
                value={subject}
                onChangeText={setSubject}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>{t('description', 'DESCRIPTION')}</Text>
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <TextInput 
                style={styles.textArea}
                placeholder={t('placeholder.ProvideAsManyDe', 'Provide as many details as possible so we can help you faster...')}
                placeholderTextColor={theme.colors.textSecondary}
                value={description}
                onChangeText={setDescription}
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>{t('attachmentsOptional', 'ATTACHMENTS')}</Text>
            <View style={styles.attachmentBtn}>
              <Icon name="camera-off-outline" size={24} color={theme.colors.textSecondary} />
              <Text style={styles.attachmentText}>{t('attachmentsUnavailable', 'File attachments are unavailable in this app build. No file will be added.')}</Text>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        {submitError ? <Text accessibilityRole="alert" style={styles.submitError}>{submitError}</Text> : null}
        <TouchableOpacity 
          style={[styles.submitBtn, (!selectedCategory || !subject || !description || isSubmitting) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!selectedCategory || !subject || !description || isSubmitting}
          activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={t('a11ySubmitTicket', 'Submit Ticket')}
        >
          <Text style={styles.submitBtnText}>
            {isSubmitting ? 'Submitting...' : t('submitTicket', 'Submit Ticket')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.textPrimary },
  
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: theme.colors.textSecondary, letterSpacing: 1.5, marginBottom: 16 },
  
  categoriesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 },
  categoryCard: { width: '48%', backgroundColor: theme.colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.colors.border, position: 'relative' },
  categoryCardActive: { borderColor: theme.colors.primary, backgroundColor: 'rgba(212, 175, 55, 0.05)' },
  categoryLabel: { fontSize: 13, fontWeight: '600', color: theme.colors.textPrimary, marginTop: 12, lineHeight: 18 },
  categoryLabelActive: { color: theme.colors.primary },
  checkBadge: { position: 'absolute', top: 12, right: 12, width: 20, height: 20, borderRadius: 10, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' },

  formGroup: { marginBottom: 24 },
  inputLabel: { fontSize: 12, fontWeight: 'bold', color: theme.colors.textSecondary, letterSpacing: 1.5, marginBottom: 8 },
  inputContainer: { backgroundColor: theme.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border },
  input: { height: 50, paddingHorizontal: 16, color: theme.colors.textPrimary, fontSize: 15 },
  
  textAreaContainer: { height: 120 },
  textArea: { flex: 1, padding: 16, color: theme.colors.textPrimary, fontSize: 15 },

  attachmentBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: theme.colors.border, borderStyle: 'dashed', gap: 12 },
  attachmentBtnActive: { borderColor: theme.colors.primary, backgroundColor: 'rgba(212, 175, 55, 0.05)', borderStyle: 'solid' },
  attachmentText: { fontSize: 14, fontWeight: '500', color: theme.colors.textSecondary },
  submitError: { color: theme.colors.error, fontSize: 13, textAlign: 'center', marginBottom: 12 },

  footer: { padding: 20, paddingBottom: 32, borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: theme.colors.background },
  submitBtn: { backgroundColor: theme.colors.primary, paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { fontSize: 16, fontWeight: 'bold', color: theme.colors.background }
});
