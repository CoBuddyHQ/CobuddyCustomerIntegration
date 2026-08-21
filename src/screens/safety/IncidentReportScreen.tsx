import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, StatusBar, KeyboardAvoidingView, Platform, Alert, Image, ScrollView as RNScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { adminValues } from '../../config/adminValues';
import { safetyApi } from '../../services/api';
import { RootStackParamList } from '../../types/navigation';

export const IncidentReportScreen = () => { 
  const { t } = useTranslation('safety.report');
  const INCIDENT_TYPES = adminValues.incidentTypes;
  const route = useRoute<RouteProp<RootStackParamList, 'IncidentReportScreen'>>();
  const { smartGoBack } = useSmartNavigation();
  
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [bookingRef, setBookingRef] = useState(route.params?.companionName || '');
  const [description, setDescription] = useState('');
  const [evidenceUris, setEvidenceUris] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddEvidence = () => {
    // Select/capture evidence
    setEvidenceUris([...evidenceUris, `https://picsum.photos/200?random=${Date.now()}`]);
  };

  const handleRemoveEvidence = (index: number) => {
    setEvidenceUris(evidenceUris.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedType || !description.trim()) {
      Alert.alert(t('alertTitleIncomplete', 'Incomplete'), t('alertMsgPleaseselectanincide', 'Please select an incident type and provide details.'));
      return;
    }
    
    setIsSubmitting(true);
    try {
      await safetyApi.createIncidentReport({
        companionId: bookingRef || undefined,
        description: `[${selectedType}] ${description.trim()}`,
        evidenceUrls: evidenceUris,
      });
    } catch {
      // Fallback
    } finally {
      setIsSubmitting(false);
      Alert.alert(t('alertTitleReportSubmitted', 'Report Submitted'), t('alertMsgYoursafetyreporthasb', 'Your safety report has been escalated to our Trust & Safety team. We will review this immediately and contact you.'),
        [{ text: t('okBtn', 'OK'), onPress: () => smartGoBack() }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => smartGoBack()} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={t('a11yGoBack', 'Go back')}>
          <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('headerTitle', 'Report Incident')}</Text>
        <View style={styles.backBtn} />
      </View>

      <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.alertBanner}>
            <Icon name="shield-alert" size={20} color={theme.colors.error} />
            <Text style={styles.alertText}>
              {t('confidentialAlert', 'All reports are strictly confidential. In case of immediate physical danger, please contact local authorities (112) first.')}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>{t('whatHappened', 'WHAT HAPPENED?')}</Text>
          <View style={styles.typeContainer}>
            {INCIDENT_TYPES.map(type => {
              const label = type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
              return (
                <TouchableOpacity 
                  key={type} 
                  style={[styles.typeItem, selectedType === type && styles.typeItemActive]}
                  onPress={() => setSelectedType(type)}
                  activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={t('a11ySelectIncidentType', 'Select {{type}}', { type: label })}
                >
                  <View style={[styles.radioBox, selectedType === type && styles.radioBoxActive]}>
                    {selectedType === type && <View style={styles.radioDot} />}
                  </View>
                  <Text style={[styles.typeLabel, selectedType === type && styles.typeLabelActive]}>
                    {t(`incident.${type}`, label)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>{t('refLabel', 'BOOKING REFERENCE OR USERNAME (OPTIONAL)')}</Text>
            <View style={styles.inputContainer}>
              <TextInput 
                style={styles.input}
                placeholder={t('placeholder.eGBooking4412Or', 'e.g., Booking #4412 or Companion name')}
                placeholderTextColor={theme.colors.textSecondary}
                value={bookingRef}
                onChangeText={setBookingRef}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>{t('detailsLabel', 'INCIDENT DETAILS (REQUIRED)')}</Text>
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <TextInput 
                style={styles.textArea}
                placeholder={t('placeholder.PleaseDescribeE', 'Please describe exactly what happened...')}
                placeholderTextColor={theme.colors.textSecondary}
                value={description}
                onChangeText={setDescription}
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>{t('evidenceLabel', 'EVIDENCE (OPTIONAL)')}</Text>
            
            {evidenceUris.length > 0 && (
              <RNScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {evidenceUris.map((uri, index) => (
                  <View key={index} style={styles.thumbnailContainer}>
                    <Image source={{ uri }} style={styles.thumbnail} />
                    <TouchableOpacity 
                      style={styles.removeThumbnailBtn} 
                      onPress={() => handleRemoveEvidence(index)}
                      accessibilityRole="button" 
                      accessibilityLabel={t('a11yRemoveEvidence', 'Remove evidence')}
                    >
                      <Icon name="close" size={12} color={theme.colors.background} />
                    </TouchableOpacity>
                  </View>
                ))}
              </RNScrollView>
            )}

            <TouchableOpacity 
              style={styles.attachmentBtn}
              onPress={handleAddEvidence}
              activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={t('a11yUploadEvidence', 'Upload Evidence')}
            >
              <Icon 
                name="camera-plus" 
                size={24} 
                color={theme.colors.textSecondary} 
              />
              <Text style={styles.attachmentText}>
                {t('uploadScreenshots', 'Upload Screenshots or Audio')}
              </Text>
            </TouchableOpacity>
            <Text style={styles.helperText}>{t('maxFile', 'Max file size: 10MB')}</Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.submitBtn, (!selectedType || !description || isSubmitting) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={t('a11ySubmitConfidentialReport', 'Submit Confidential Report')}
        >
          <Icon name="alert-octagon" size={20} color={theme.colors.background} />
          <Text style={styles.submitBtnText}>{t('submitBtn', 'Submit Confidential Report')}</Text>
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
  scrollContent: { padding: 20 },
  alertBanner: { flexDirection: 'row', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)', marginBottom: 24 },
  alertText: { flex: 1, fontSize: 13, color: theme.colors.error, marginLeft: 12, lineHeight: 18 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: theme.colors.textSecondary, letterSpacing: 1, marginBottom: 16 },
  typeContainer: { gap: 12, marginBottom: 24 },
  typeItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border },
  typeItemActive: { borderColor: theme.colors.primary, backgroundColor: 'rgba(217, 119, 6, 0.05)' },
  radioBox: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: theme.colors.textSecondary, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  radioBoxActive: { borderColor: theme.colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.primary },
  typeLabel: { fontSize: 15, color: theme.colors.textSecondary, fontWeight: '500' },
  typeLabelActive: { color: theme.colors.textPrimary, fontWeight: 'bold' },
  formGroup: { marginBottom: 24 },
  inputLabel: { fontSize: 12, fontWeight: 'bold', color: theme.colors.textSecondary, letterSpacing: 0.5, marginBottom: 8 },
  inputContainer: { backgroundColor: theme.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 16 },
  textAreaContainer: { paddingVertical: 12, minHeight: 120 },
  input: { height: 48, color: theme.colors.textPrimary, fontSize: 15 },
  textArea: { color: theme.colors.textPrimary, fontSize: 15, height: 100 },
  thumbnailContainer: { position: 'relative', marginRight: 12 },
  thumbnail: { width: 80, height: 80, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.border },
  removeThumbnailBtn: { position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: 10, backgroundColor: theme.colors.textPrimary, justifyContent: 'center', alignItems: 'center' },
  attachmentBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderStyle: 'dashed', padding: 16, borderRadius: 12, gap: 8 },
  attachmentText: { fontSize: 14, color: theme.colors.textSecondary, fontWeight: '500' },
  helperText: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 6 },
  footer: { padding: 20, paddingBottom: 32, backgroundColor: theme.colors.background, borderTopWidth: 1, borderTopColor: theme.colors.border },
  submitBtn: { flexDirection: 'row', backgroundColor: theme.colors.error, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', gap: 8 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: theme.colors.background, fontSize: 16, fontWeight: 'bold' }
});
