import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, TextInput, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { useInterestsData } from '../onboarding/InterestSelectionScreen'; // To map IDs to full objects
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { MOCK_PROFILE } from '../../services/mock';
import { profileApi } from '../../services/api';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export const EditProfileScreen = () => {
  const INTERESTS_DATA = useInterestsData(); 
  const { t } = useTranslation('profile.edit');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { smartGoBack } = useSmartNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'EditProfileScreen'>>();
  
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
      name: MOCK_PROFILE.name,
      bio: MOCK_PROFILE.bio,
      city: MOCK_PROFILE.city,
      languages: MOCK_PROFILE.languages,
      langIds: MOCK_PROFILE.langIds,
      interests: MOCK_PROFILE.interests.map((i) => INTERESTS_DATA.find((d) => d.id === i.id) || i),
  });

  useEffect(() => {
    profileApi.getProfile().then(p => {
      if (p) {
        setForm(prev => ({
          ...prev,
          name: p.name || prev.name,
          bio: p.bio || prev.bio,
          city: p.city || prev.city,
        }));
      }
    }).catch(() => {});
  }, []);

  // Handle incoming params from sub-screens (Location, Interests, Languages)
  useEffect(() => {
      if (route.params?.updatedCity) {
          setForm(prev => ({ ...prev, city: (route.params?.updatedCity as string) }));
      }
      if (route.params?.updatedInterests) {
          // Map IDs back to full interest objects for rendering the grid
          const newInterests = route.params.updatedInterests.map((id: string) => {
              return INTERESTS_DATA.find(i => i.id === id) || { id, label: id, icon: 'star' };
          });
          setForm(prev => ({ ...prev, interests: newInterests }));
      }
      if (route.params?.updatedLanguages) {
          setForm(prev => ({ 
              ...prev, 
              languages: (route.params?.updatedLanguages as string[]),
              langIds: (route.params?.updatedLangIds as string[]) || prev.langIds 
          }));
      }
  }, [route.params, INTERESTS_DATA]);

  const updateForm = (key: string, value: string) => {
      setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
      if (!form.name.trim()) {
          Alert.alert(t('errorTitle', 'Error'), t('errorEmptyName', 'Display name cannot be empty.'));
          return;
      }
      setIsSaving(true);
      try {
        await profileApi.updateProfile({
          name: form.name.trim(),
          bio: form.bio.trim(),
          city: form.city,
        });

        if (form.interests && form.interests.length > 0) {
          await profileApi.updateInterests(form.interests.map(i => i.id));
        }
      } catch {
        // Fallback
      } finally {
        setIsSaving(false);
        Alert.alert(t('successTitle', 'Success'), t('successProfileUpdate', 'Profile updated successfully!'), [{ text: t('ok', 'OK'), onPress: () => smartGoBack() }]);
      }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => smartGoBack()} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={t('a11yGoBack', 'Go back')}>
          <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('title', 'Edit Profile')}</Text>
        <TouchableOpacity style={styles.saveHeaderBtn} onPress={handleSave} disabled={isSaving} accessibilityRole="button" accessibilityLabel={t('a11ySave', 'Save')}>
            <Text style={[styles.saveHeaderBtnText, isSaving && { opacity: 0.5 }]}>
              {isSaving ? 'Saving...' : t('saveBtn', 'Save')}
            </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            
            <View style={styles.avatarSection}>
                <View style={styles.avatarWrap}>
                    <Image source={{uri: 'https://i.pravatar.cc/300?img=11'}} style={styles.avatar} />
                    <TouchableOpacity style={styles.editAvatarBtn} accessibilityRole="button" accessibilityLabel={t('a11yCamera', 'Camera')}>
                        <Icon name="camera" size={16} color={theme.colors.surface} />
                    </TouchableOpacity>
                </View>
                <Text style={styles.avatarSub}>{t('changePhoto', 'Tap to change photo')}</Text>
            </View>

            <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>{t('basicInfo', 'BASIC INFO')}</Text>
                
                <View style={styles.inputBlock}>
                    <Text style={styles.inputLabel}>{t('displayName', 'Display Name')}</Text>
                    <TextInput style={styles.input} value={form.name} onChangeText={v => updateForm('name', v)} placeholder={t('placeholder.FirstName', 'First Name')} placeholderTextColor={theme.colors.textSecondary} />
                </View>

                <View style={styles.inputBlock}>
                    <Text style={styles.inputLabel}>{t('shortBio', 'Short Bio')}</Text>
                    <TextInput style={[styles.input, styles.textArea]} value={form.bio} onChangeText={v => updateForm('bio', v)} placeholder={t('placeholder.SaySomethingAbo', 'Say something about yourself...')} placeholderTextColor={theme.colors.textSecondary} multiline maxLength={150} textAlignVertical="top" />
                    <Text style={styles.helperText}>{form.bio.length}{t('profile.charactersLimit', '/150 characters')}</Text>
                </View>

                <View style={styles.inputBlock}>
                    <Text style={styles.inputLabel}>{t('currentCity', 'Current City')}</Text>
                    <TouchableOpacity 
                        style={[styles.iconInputWrap, {paddingVertical: 14, paddingRight: 16}]} 
                        activeOpacity={0.7}
                        onPress={() => navigation.navigate('LocationSelectionScreen')} accessibilityRole="button" accessibilityLabel={form.city || t('a11ySelectLocation', t('profile.selectLocation', 'Select Location'))}
                    >
                        <Icon name="map-marker-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                        <Text style={[styles.iconInput, {paddingVertical: 0, paddingRight: 0}]}>{form.city || t('selectLocation', 'Select Location')}</Text>
                        <Icon name="chevron-right" size={20} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.formSection}>
                <View style={styles.rowHeader}>
                <Text style={styles.sectionTitle}>{t('languagesSpoken', 'LANGUAGES SPOKEN')}</Text>
                    <TouchableOpacity 
                        style={styles.editIconBtn} 
                        onPress={() => navigation.navigate('SpokenLanguagesScreen', { initialLanguages: form.langIds })} accessibilityRole="button" accessibilityLabel={t('a11yEdit', 'Edit')}
                    >
                        <Icon name="pencil" size={16} color={theme.colors.primary} />
                    </TouchableOpacity>
                </View>
                
                <TouchableOpacity 
                    style={styles.clickableRow} 
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('SpokenLanguagesScreen', { initialLanguages: form.langIds })} accessibilityRole="button" accessibilityLabel={form.languages.length > 0 ? form.languages.join(', ') : t('a11ySelectLanguages', t('profile.selectLanguages', 'Select Languages'))}
                >
                    <Text style={styles.clickableRowText}>
                        {form.languages.length > 0 ? form.languages.join(', ') : t('selectLanguages', 'Select Languages')}
                    </Text>
                    <Icon name="chevron-right" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
            </View>

            <View style={styles.formSection}>
                <View style={styles.rowHeader}>
                    <Text style={styles.sectionTitle}>{t('interestsActivities', 'INTERESTS & ACTIVITIES')}</Text>
                    <TouchableOpacity 
                        style={styles.editIconBtn} 
                        onPress={() => navigation.navigate('InterestSelectionScreen', { 
                            isEditMode: true, 
                            initialInterests: form.interests.map(i => i.id) 
                        })} accessibilityRole="button" accessibilityLabel={t('a11yEdit', 'Edit')}
                    >
                        <Icon name="pencil" size={16} color={theme.colors.primary} />
                    </TouchableOpacity>
                </View>
                
                <View style={styles.grid}>
                    {form.interests.map(item => (
                        <View key={item.id} style={[styles.tile, styles.tileActive]}>
                            <View style={styles.tileIconWrap}>
                                <Icon name={item.icon} size={20} color={theme.colors.primary} />
                            </View>
                            <Text style={[styles.tileLabel, styles.tileLabelActive]}>{item.label}</Text>
                        </View>
                    ))}
                </View>
            </View>

            <View style={styles.formSection}>
                <View style={styles.rowHeader}>
                    <Text style={[styles.sectionTitle, {marginBottom: 0}]}>{t('lockedDemographics', 'LOCKED DEMOGRAPHICS')}</Text>
                    {MOCK_PROFILE.kycVerified && (
                        <View style={styles.kycBadge}>
                            <Icon name="shield-check" size={12} color={theme.colors.success} />
                            <Text style={styles.kycBadgeText}>{t('kycVerified', 'KYC Verified')}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.lockedBlock}>
                    <View style={styles.lockedRow}>
                        <Text style={styles.lockedLabel}>{t('gender', 'Gender')}</Text>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                            <Icon name="lock" size={14} color={theme.colors.textSecondary} />
                            <Text style={styles.lockedValue}>{MOCK_PROFILE.gender}</Text>
                        </View>
                    </View>
                    <View style={styles.lockedDivider} />
                    <View style={styles.lockedRow}>
                        <Text style={styles.lockedLabel}>{t('age', 'Age')}</Text>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                            <Icon name="lock" size={14} color={theme.colors.textSecondary} />
                            <Text style={styles.lockedValue}>{MOCK_PROFILE.age} {t('units.yrs', 'yrs')}</Text>
                        </View>
                    </View>
                </View>
                {MOCK_PROFILE.kycVerified && (
                    <Text style={styles.helperTextLocked}>{t('lockedNotice', 'These details are locked for safety after KYC verification. Contact support to change.')}</Text>
                )}
            </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.textPrimary },
  saveHeaderBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(212,175,55,0.1)', borderRadius: 12 },
  saveHeaderBtnText: { fontSize: 14, fontWeight: 'bold', color: theme.colors.primary },
  
  scrollContent: { padding: 16, paddingBottom: 40 },
  
  avatarSection: { alignItems: 'center', marginBottom: 32, marginTop: 10 },
  avatarWrap: { width: 100, height: 100, borderRadius: 50, backgroundColor: theme.colors.surface, borderWidth: 2, borderColor: theme.colors.primary, marginBottom: 12, position: 'relative' },
  avatar: { width: '100%', height: '100%', borderRadius: 50 },
  editAvatarBtn: { position: 'absolute', bottom: -4, right: -4, width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: theme.colors.background },
  avatarSub: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: '500' },

  formSection: { marginBottom: 32 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', color: theme.colors.textSecondary, letterSpacing: 1, marginBottom: 16 },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  editIconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(212,175,55,0.1)', justifyContent: 'center', alignItems: 'center', marginTop: -6 },
  
  inputBlock: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 8 },
  input: { backgroundColor: theme.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: theme.colors.textPrimary },
  
  iconInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden' },
  inputIcon: { paddingHorizontal: 12 },
  iconInput: { flex: 1, paddingVertical: 14, paddingRight: 16, fontSize: 15, color: theme.colors.textPrimary },

  textArea: { height: 100 },
  helperText: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 6, marginLeft: 4 },

  clickableRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 16, paddingVertical: 16 },
  clickableRowText: { fontSize: 15, color: theme.colors.textPrimary, fontWeight: '500' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '48%', backgroundColor: theme.colors.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  tileActive: { borderColor: 'rgba(212,175,55,0.8)', backgroundColor: 'rgba(212,175,55,0.08)' },
  tileIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  tileLabel: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: '600', flex: 1 },
  tileLabelActive: { color: theme.colors.primary },

  kycBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 100 },
  kycBadgeText: { fontSize: 10, fontWeight: 'bold', color: theme.colors.success },
  lockedBlock: { backgroundColor: theme.colors.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden', marginTop: 16 },
  lockedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  lockedDivider: { height: 1, backgroundColor: theme.colors.border },
  lockedLabel: { fontSize: 15, color: theme.colors.textPrimary, fontWeight: '500' },
  lockedValue: { fontSize: 15, color: theme.colors.textSecondary, fontWeight: '600' },
  helperTextLocked: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 12, marginLeft: 4, lineHeight: 16 }
});
