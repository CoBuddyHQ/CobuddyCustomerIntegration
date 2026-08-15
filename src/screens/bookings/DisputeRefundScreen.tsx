import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { MOCK_BOOKINGS } from '../../services/mock/bookings.mock';
import { bookingApi } from '../../services/api';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

const CATEGORIES = [
  { key: 'no_show', label: 'Companion No-Show' },
  { key: 'unprofessional', label: 'Unprofessional Behavior' },
  { key: 'different_profile', label: 'Different from Profile' },
  { key: 'other', label: 'Other' }
];

export const DisputeRefundScreen = () => { 
  const { t } = useTranslation('bookings.dispute');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { smartGoBack } = useSmartNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'DisputeRefundScreen'>>();
  const bookingId = route.params?.bookingId || 'CB-HIS-9921';
  const booking = MOCK_BOOKINGS.find(b => b.id === bookingId) || MOCK_BOOKINGS[0];
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBack = () => smartGoBack();
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await bookingApi.disputeBooking(bookingId, {
        reason: selectedCategory || 'other',
        description,
      });
    } catch {
      // Graceful fallback
    } finally {
      setIsSubmitting(false);
      navigation.navigate('MainTabNavigator', { screen: 'BookingsTab' });
    }
  };

  const isFormValid = selectedCategory && description.length > 10;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel={t('a11yGoBack', 'Go back')}>
          <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('headerTitle', 'Raise a Dispute')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Booking Reference */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{t('summaryTitle', 'Disputing Booking: {{id}}', { id: bookingId })}</Text>
          <View style={styles.summaryRow}>
            <Icon name="account" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.summaryText}>{t('labelCompanion', 'Companion:')} {booking?.companionName || t('fallback.companionName', 'Companion')}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Icon name="calendar-check" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.summaryText}>{t('labelSessionDate', 'Session Date:')} {booking?.date || t('fallback.date2', 'Fri, 24 Oct 2026')}</Text>
          </View>
        </View>

        {/* Info Banner */}
        <View style={styles.infoCard}>
          <Icon name="shield-alert-outline" size={24} color={theme.colors.warning} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.infoTitle}>{t('infoTitle', 'Escrow Frozen')}</Text>
            <Text style={styles.infoDesc}>{t('infoDesc', 'Submitting a dispute will freeze the escrow payment. Our safety team will review your claim within 24 hours.')}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t('sectionCategory', 'ISSUE CATEGORY')}</Text>
        
        <View style={styles.reasonsContainer}>
          {CATEGORIES.map((categoryObj) => (
            <TouchableOpacity 
              key={categoryObj.key} 
              style={[styles.reasonRow, selectedCategory === categoryObj.key && styles.reasonRowActive]}
              onPress={() => setSelectedCategory(categoryObj.key)}
              activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={t(`category.${categoryObj.key}`, categoryObj.label)}
            >
              <Text style={[styles.reasonText, selectedCategory === categoryObj.key && styles.reasonTextActive]}>{t(`category.${categoryObj.key}`, categoryObj.label)}</Text>
              <View style={[styles.radioCircle, selectedCategory === categoryObj.key && styles.radioCircleActive]}>
                {selectedCategory === categoryObj.key && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>{t('sectionDesc', 'DETAILED DESCRIPTION')}</Text>
        <TextInput
          style={styles.textArea}
          placeholder={t('placeholder.PleaseDescribeW', 'Please describe what happened in detail (min 10 chars)...')}
          placeholderTextColor={theme.colors.textSecondary}
          multiline={true}
          numberOfLines={6}
          textAlignVertical="top"
          value={description}
          onChangeText={setDescription}
        />
        
        <Text style={styles.sectionTitle}>{t('sectionProof', 'UPLOAD PROOF (OPTIONAL)')}</Text>
        <TouchableOpacity style={styles.uploadBox} accessibilityRole="button" accessibilityLabel={t('a11yTapToUploadScreenshotsOrP', 'Tap to upload screenshots or p...')}>
          <Icon name="camera-plus" size={32} color={theme.colors.primary} />
          <Text style={styles.uploadText}>{t('uploadText', 'Tap to upload screenshots or photos')}</Text>
        </TouchableOpacity>
        
      </ScrollView>

      {/* Sticky Footer */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={[styles.primaryBtn, (!isFormValid || isSubmitting) && { opacity: 0.5 }]} 
          disabled={!isFormValid || isSubmitting}
          onPress={handleSubmit}
          activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={t('a11ySubmitDispute', 'Submit Dispute')}
        >
          <Text style={styles.primaryBtnText}>
            {isSubmitting ? 'Submitting...' : t('submitBtn', 'Submit Dispute')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  iconBtn: { padding: 8, backgroundColor: theme.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: theme.colors.textPrimary, letterSpacing: 0.5 },
  
  scrollContent: { padding: 20, paddingBottom: 40, gap: 24 },
  
  summaryCard: { backgroundColor: theme.colors.surface, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border },
  summaryTitle: { fontSize: 13, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 8, letterSpacing: 0.5 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 6 },
  summaryText: { fontSize: 14, color: theme.colors.textSecondary },

  infoCard: { flexDirection: 'row', backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.warning, alignItems: 'center' },
  infoTitle: { fontSize: 14, fontWeight: 'bold', color: theme.colors.warning, marginBottom: 4 },
  infoDesc: { fontSize: 13, color: theme.colors.textPrimary, lineHeight: 20 },
  
  sectionTitle: { fontSize: 12, fontWeight: '900', color: theme.colors.textSecondary, letterSpacing: 1.5, marginTop: 8 },
  
  reasonsContainer: { backgroundColor: theme.colors.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden' },
  reasonRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  reasonRowActive: { backgroundColor: 'rgba(212, 175, 55, 0.05)' },
  reasonText: { fontSize: 15, color: theme.colors.textPrimary },
  reasonTextActive: { color: theme.colors.primary, fontWeight: '600' },
  
  radioCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: theme.colors.textSecondary, justifyContent: 'center', alignItems: 'center' },
  radioCircleActive: { borderColor: theme.colors.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.primary },

  textArea: { backgroundColor: theme.colors.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, padding: 16, color: theme.colors.textPrimary, fontSize: 15, minHeight: 120 },

  uploadBox: { backgroundColor: 'rgba(212, 175, 55, 0.05)', borderRadius: 16, borderWidth: 1, borderColor: theme.colors.primary, borderStyle: 'dashed', padding: 32, alignItems: 'center', justifyContent: 'center' },
  uploadText: { color: theme.colors.primary, fontSize: 13, marginTop: 12, fontWeight: '500' },

  bottomBar: { 
    padding: 20, 
    paddingBottom: 24, 
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)'
  },
  bottomBarHandle: {
    width: 36,
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
    marginTop: -8
  },
  actionCol: { gap: 12, width: '100%' },
  primaryBtn: { width: '100%', height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  primaryBtnText: { color: theme.colors.background, fontSize: 15, fontWeight: 'bold' },
});
