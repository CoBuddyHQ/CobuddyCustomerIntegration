import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';
import { Button } from '../../components/ui/Button';
import { BottomActionBar } from '../../components/ui/BottomActionBar';
import { AppBottomSheet } from '../../components/ui/AppBottomSheet';
import { OnboardingHeader } from '../../components/onboarding/OnboardingHeader';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { validateName, validateDOB } from '../../utils/validation';
import { useTranslation } from 'react-i18next';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { profileApi } from '../../services/api';
import { useAuthStore } from '../../store/slices/authStore';

const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
const GENDER_OPTION_KEYS: Record<string, string> = {
  'Male': 'profile.genderOptions.man',
  'Female': 'profile.genderOptions.woman',
  'Non-binary': 'profile.genderOptions.nonBinary',
  'Prefer not to say': 'profile.genderOptions.preferNotToSay',
};

type AvatarState = 'none' | 'photo' | 'selfie';
const AVATAR_COLORS: Record<AvatarState, string> = {
  none: 'transparent',
  photo: '#2a3b5e',
  selfie: '#3b2a5e',
};

export const BasicProfileSetupScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { smartGoBack } = useSmartNavigation();
  const { user, updateUser } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState(user?.gender || '');
  const [city, setCity] = useState(user?.city || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [showGender, setShowGender] = useState(false);
  const [nameError, setNameError] = useState('');
  const [dobError, setDobError] = useState('');
  const [cityError, setCityError] = useState('');
  const [bioError, setBioError] = useState('');
  const [avatarState, setAvatarState] = useState<AvatarState>(user?.avatar ? 'photo' : 'none');
  const [showAvatarSheet, setShowAvatarSheet] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { t } = useTranslation(['onboarding']);

  React.useEffect(() => {
    const fetchExistingProfile = async () => {
      try {
        const profile = await profileApi.getProfile();
        if (profile) {
          if (profile.name && !name) setName(profile.name);
          if (profile.city && !city) setCity(profile.city);
          if (profile.gender && !gender) setGender(profile.gender);
          if (profile.bio && !bio) setBio(profile.bio);
          if (profile.avatar) setAvatarState('photo');
        }
      } catch {
        // Fallback to local store
      }
    };
    fetchExistingProfile();
  }, []);
  
  const isValid = validateName(name) && validateDOB(dob) && gender !== '' && city.trim().length >= 3 && bio.trim().length >= 10;

  const handleContinue = async () => {
    let hasError = false;

    if (!validateName(name)) {
      setNameError(t('profile.error_name', 'Invalid name'));
      hasError = true;
    }
    if (!validateDOB(dob)) {
      setDobError(t('profile.error_dob', 'Must be 18+ and format DD/MM/YYYY'));
      hasError = true;
    }
    if (city.trim().length < 3) {
      setCityError(t('profile.error_city'));
      hasError = true;
    }
    if (bio.trim().length < 10) {
      setBioError(t('profile.error_bio'));
      hasError = true;
    }

    if (hasError) return;

    setIsSaving(true);
    try {
      // Parse age from DD/MM/YYYY dob
      const parts = dob.split('/');
      const birthYear = parseInt(parts[2], 10);
      const age = new Date().getFullYear() - birthYear;

      await profileApi.updateProfile({ name, city, gender, age, bio, dob });

      // Update local store
      updateUser({ name, city, gender, age, bio });

      // Navigate to next onboarding step
      navigation.navigate('InterestSelectionScreen');
    } catch {
      // Non-fatal — still allow proceeding to next step
      updateUser({ name, city, gender });
      navigation.navigate('InterestSelectionScreen');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDobChange = (text: string) => {
    // Auto-format to DD/MM/YYYY
    const cleaned = text.replace(/[^0-9]/g, '');
    let formatted = cleaned;
    if (cleaned.length >= 3) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    }
    if (cleaned.length >= 5) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
    }
    setDob(formatted);
    if (dobError) setDobError('');
  };

  const handleAvatarOption = (option: 'photo' | 'selfie' | 'skip') => {
    setShowAvatarSheet(false);
    if (option === 'photo') { setAvatarState('photo'); }
    if (option === 'selfie') { setAvatarState('selfie'); }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
        
        <OnboardingHeader
          showBack={navigation.canGoBack()}
          onBack={() => smartGoBack()}
          centerLabel={t('profile.header')}
          showProgress
          currentStep={2}
          totalSteps={5}
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* Ambient glow */}
          <View style={styles.ambientGlow} pointerEvents="none" />

          {/* Step label + headline */}
          <Text style={styles.stepLabel}>{t('profile.step')}</Text>
          <Text style={styles.title}>{t('profile.title')}</Text>
          <Text style={styles.subtitle}>
            {t('profile.subtitle')}
          </Text>

          {/* Glass form card */}
          <View style={styles.formCard}>
            
            {/* Avatar */}
            <View style={styles.photoSection}>
              <TouchableOpacity
                style={[
                  styles.photoCircle,
                  avatarState !== 'none' && styles.photoCircleSelected,
                ]}
                onPress={() => setShowAvatarSheet(true)}
                activeOpacity={0.85} accessibilityRole="button" accessibilityLabel={t('profile.a11yEditPhoto', 'Upload or edit profile photo')}>
                {avatarState === 'none' ? (
                  <>
                    <View style={{ opacity: 0.5 }}>
                      <Icon name="camera-outline" size={30} color={theme.colors.textSecondary} />
                    </View>
                    <View style={styles.photoAddBadge}>
                      <Icon name="plus" size={16} color={theme.colors.background} />
                    </View>
                  </>
                ) : (
                  <>
                    <View
                      style={[
                        styles.avatarFill,
                        { backgroundColor: AVATAR_COLORS[avatarState] },
                      ]}>
                      <View style={{ opacity: 0.7 }}>
                        <Icon
                          name={avatarState === 'selfie' ? 'camera-front-variant' : 'image-outline'}
                          size={36}
                          color={theme.colors.textPrimary}
                        />
                      </View>
                    </View>
                    <View style={styles.verifiedBadge}>
                      <Icon name="pencil-outline" size={12} color={theme.colors.textSecondary} />
                    </View>
                  </>
                )}
              </TouchableOpacity>

              {avatarState === 'none' ? (
                <Text style={styles.photoLabel}>{t('profile.photo_add')}</Text>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Text style={styles.photoLabel}>{t('profile.photo_added')}</Text>
                  <Icon name="check" size={14} color={theme.colors.primary} />
                </View>
              )}
              <Text style={styles.photoHint}>
                {avatarState === 'none'
                  ? t('profile.photo_hint_none')
                  : t('profile.photo_hint_added')}
              </Text>
            </View>

            {/* Full Name */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t('profile.label_name')}</Text>
              <TextInput
                style={[styles.underlineInput, nameError ? styles.underlineInputError : null]}
                value={name}
                onChangeText={t => { setName(t); if (nameError) { setNameError(''); } }}
                placeholder={t('profile.placeholder_name')}
                placeholderTextColor={theme.colors.textSecondary}
                autoCapitalize="words"
                returnKeyType="next"
              />
              {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
            </View>

            {/* DOB + Gender row */}
            <View style={styles.ageGenderRow}>
              <View style={[styles.field, { flex: 1.1 }]}>
                <Text style={styles.fieldLabel}>{t('profile.dobLabel', 'Date of Birth')}</Text>
                <TextInput
                  style={[styles.underlineInput, dobError ? styles.underlineInputError : null]}
                  value={dob}
                  onChangeText={handleDobChange}
                  placeholder={t('profile.placeholder.DDMMYYYY', 'DD/MM/YYYY')}
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="number-pad"
                  maxLength={10}
                  returnKeyType="next"
                />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>{t('profile.label_gender')}</Text>
                <TouchableOpacity
                  style={styles.underlineSelect}
                  onPress={() => setShowGender(s => !s)} accessibilityRole="button" accessibilityLabel={t('profile.a11yGenderDropdown', 'Toggle gender dropdown')}>
                  <Text style={gender ? styles.selectValue : styles.selectPlaceholder}>
                    {gender || t('profile.placeholder_gender')}
                  </Text>
                  <Icon name="chevron-down" size={16} color={theme.colors.textSecondary} />
                </TouchableOpacity>
                {showGender && (
                  <View style={styles.dropdown}>
                    {GENDER_OPTIONS.map(g => (
                      <TouchableOpacity
                        key={g}
                        style={styles.dropdownItem}
                        onPress={() => { setGender(g); setShowGender(false); }} accessibilityRole="button" accessibilityLabel={t('profile.a11ySelectGender', 'Select gender')}>
                        <Text style={[styles.dropdownText, g === gender && styles.dropdownTextActive]}>
                          {t(GENDER_OPTION_KEYS[g], g)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
            {dobError ? <Text style={styles.errorText}>{dobError}</Text> : null}
            <Text style={styles.ageHint}>{t('profile.youMustBe18To', 'You must be 18+ to use CoBuddy.')}</Text>

            {/* City */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t('profile.label_city')}</Text>
              <View style={[styles.underlineSelect, cityError ? styles.underlineInputError : null]}>
                <View style={styles.cityRow}>
                  <View style={{ opacity: 0.7 }}>
                    <Icon name="map-marker-outline" size={16} color={theme.colors.textSecondary} />
                  </View>
                  <TextInput
                    style={styles.cityInput}
                    value={city}
                    onChangeText={t => { setCity(t); if (cityError) setCityError(''); }}
                    placeholder={t('profile.placeholder_city')}
                    placeholderTextColor={theme.colors.textSecondary}
                    returnKeyType="next"
                  />
                </View>
              </View>
              {cityError ? <Text style={styles.errorText}>{cityError}</Text> : null}
            </View>

            {/* Bio */}
            <View style={[styles.field, { marginTop: 8 }]}>
              <Text style={styles.fieldLabel}>{t('profile.label_bio')}</Text>
              <View style={[styles.bioWrap, bioError ? styles.bioWrapError : null]}>
                <TextInput
                  style={styles.bioInput}
                  value={bio}
                  onChangeText={t => { setBio(t); if (bioError) setBioError(''); }}
                  placeholder={t('profile.placeholder_bio')}
                  placeholderTextColor={theme.colors.textSecondary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  maxLength={300}
                />
              </View>
              {bioError ? <Text style={styles.errorText}>{bioError}</Text> : null}
            </View>
          </View>

          {/* Footer trust note */}
          <View style={styles.trustRow}>
            <View style={{ marginTop: 2 }}>
              <Icon name="shield-check-outline" size={16} color={theme.colors.textSecondary} />
            </View>
            <Text style={styles.trustText}>
              {t('profile.trust_note')}
            </Text>
          </View>
        </ScrollView>

        <BottomActionBar>
          <Button title={t('profile.btn_continue')} onPress={handleContinue} disabled={!isValid || isSaving} loading={isSaving} />
        </BottomActionBar>

        {/* Avatar picker bottom sheet */}
        <AppBottomSheet
          visible={showAvatarSheet}
          onClose={() => setShowAvatarSheet(false)}
          title={t('profile.titleProfilePhoto', 'Profile Photo')}>
          <View style={picker.list}>
            {/* Upload Photo */}
            <TouchableOpacity
              style={picker.option}
              onPress={() => handleAvatarOption('photo')}
              activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={t('profile.a11yChoosePhoto', 'Choose photo from gallery')}>
              <View style={picker.optionIcon}>
                <Icon name="image-outline" size={22} color={theme.colors.primary} />
              </View>
              <View style={picker.optionMeta}>
                <Text style={picker.optionLabel}>{t('profile.uploadPhoto', 'Upload Photo')}</Text>
                <Text style={picker.optionDesc}>{t('profile.uploadPhotoDesc', 'Choose from your photo library')}</Text>
              </View>
              <Icon name="chevron-right" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <View style={picker.divider} />

            {/* Take Selfie */}
            <TouchableOpacity
              style={picker.option}
              onPress={() => handleAvatarOption('selfie')}
              activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={t('profile.a11yTakeSelfie', 'Take a selfie')}>
              <View style={picker.optionIcon}>
                <Icon name="camera-front-variant" size={22} color={theme.colors.primary} />
              </View>
              <View style={picker.optionMeta}>
                <Text style={picker.optionLabel}>{t('profile.takeSelfie', 'Take Selfie')}</Text>
                <Text style={picker.optionDesc}>{t('profile.takeSelfieDesc', 'Use your front camera')}</Text>
              </View>
              <Icon name="chevron-right" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <View style={picker.divider} />

            {/* Skip */}
            <TouchableOpacity
              style={picker.option}
              onPress={() => handleAvatarOption('skip')}
              activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={t('profile.a11ySkipAvatar', 'Skip adding a photo for now')}>
              <View style={[picker.optionIcon, picker.optionIconGhost]}>
                <Icon name="skip-next-outline" size={22} color={theme.colors.textSecondary} />
              </View>
              <View style={picker.optionMeta}>
                <Text style={[picker.optionLabel, picker.optionLabelMuted]}>{t('profile.skipForNow', 'Skip For Now')}</Text>
                <Text style={picker.optionDesc}>{t('profile.youCanAddAPhoto', 'You can add a photo later from your profile')}</Text>
              </View>
            </TouchableOpacity>
          </View>
          <View style={picker.bottomNote}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingBottom: 2 }}>
              <View style={{ marginTop: 1 }}>
                <Icon name="shield-check-outline" size={14} color={theme.colors.textSecondary} />
              </View>
              <Text style={[picker.bottomNoteText, { flex: 1 }]}>{t('profile.photoWillOnlyBeVisible', 'Photo will only be visible to verified members during active sessions.')}</Text>
            </View>
          </View>
        </AppBottomSheet>

      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.background },
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },

  ambientGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'rgba(212,175,55,0.03)',
  },

  stepLabel: {
    fontSize: 11,
    letterSpacing: 2,
    color: 'rgba(212,175,55,0.8)',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 6,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 20,
  },

  formCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 24,
    gap: 18,
    marginBottom: 18,
  },

  photoSection: { alignItems: 'center', gap: 6 },
  photoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: 'rgba(212,175,55,0.4)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoCircleSelected: { borderColor: theme.colors.primary },
  photoAddBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFill: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoLabel: { fontSize: 14, color: theme.colors.primary, fontWeight: '600' },
  photoHint: { fontSize: 11, color: theme.colors.textSecondary, opacity: 0.7 },

  field: { gap: 6 },
  fieldLabel: { fontSize: 13, color: theme.colors.textSecondary },
  underlineInput: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    height: 44,
    paddingVertical: 0,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  underlineInputError: { borderBottomColor: theme.colors.error },
  errorText: { fontSize: 12, color: theme.colors.error },

  ageGenderRow: { flexDirection: 'row', gap: 20 },
  underlineSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    height: 44,
  },
  selectValue: { fontSize: 16, color: theme.colors.textPrimary },
  selectPlaceholder: { fontSize: 16, color: theme.colors.textSecondary },
  dropdown: {
    position: 'absolute',
    top: 44,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    zIndex: 100,
    overflow: 'hidden',
  },
  dropdownItem: { paddingVertical: 12, paddingHorizontal: 16 },
  dropdownText: { fontSize: 15, color: theme.colors.textSecondary },
  dropdownTextActive: { color: theme.colors.primary },

  ageHint: { fontSize: 10, color: theme.colors.textSecondary, opacity: 0.5, marginTop: -10 },

  cityRow: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 },
  cityInput: { flex: 1, fontSize: 16, color: theme.colors.textPrimary, paddingVertical: 0 },

  bioWrap: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bioWrapError: { borderColor: theme.colors.error },
  bioInput: { fontSize: 15, color: theme.colors.textPrimary, minHeight: 80, textAlignVertical: 'top' },

  trustRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 4 },
  trustText: { flex: 1, fontSize: 12, color: theme.colors.textSecondary, lineHeight: 18, opacity: 0.75 },
});

const picker = StyleSheet.create({
  list: { gap: 2, paddingBottom: 8 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(212,175,55,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optionIconGhost: { backgroundColor: 'rgba(255,255,255,0.05)' },
  optionMeta: { flex: 1 },
  optionLabel: { fontSize: 16, fontWeight: '500', color: theme.colors.textPrimary, marginBottom: 2 },
  optionLabelMuted: { color: theme.colors.textSecondary },
  optionDesc: { fontSize: 12, color: theme.colors.textSecondary },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.border,
    marginLeft: 58,
  },
  bottomNote: {
    backgroundColor: 'rgba(212,175,55,0.05)',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  bottomNoteText: { fontSize: 12, color: theme.colors.textSecondary, lineHeight: 18 },
});
