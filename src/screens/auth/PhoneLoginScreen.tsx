import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';
import { Button } from '../../components/ui/Button';
import { OnboardingHeader } from '../../components/onboarding/OnboardingHeader';
import { BottomActionBar } from '../../components/ui/BottomActionBar';
import { AppBottomSheet } from '../../components/ui/AppBottomSheet';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { validatePhone } from '../../utils/validation';
import { useAuthStore } from '../../store/slices/authStore';

import { useTranslation } from 'react-i18next';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

const COUNTRY_CODES = [
  { flag: '🇮🇳', code: '+91', nameKey: 'india', defaultName: 'India', maxLength: 10 },
  { flag: '🇺🇸', code: '+1', nameKey: 'us', defaultName: 'United States', maxLength: 10 },
  { flag: '🇬🇧', code: '+44', nameKey: 'uk', defaultName: 'United Kingdom', maxLength: 10 },
  { flag: '🇦🇪', code: '+971', nameKey: 'uae', defaultName: 'UAE', maxLength: 9 },
  { flag: '🇫🇷', code: '+33', nameKey: 'france', defaultName: 'France', maxLength: 9 },
  { flag: '🇸🇬', code: '+65', nameKey: 'singapore', defaultName: 'Singapore', maxLength: 8 },
  { flag: '🇦🇺', code: '+61', nameKey: 'australia', defaultName: 'Australia', maxLength: 9 },
];

export const PhoneLoginScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { smartGoBack } = useSmartNavigation();
  const { t } = useTranslation(['auth']);
  const { sendOtp, isLoading, error, clearError } = useAuthStore();

  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0]);
  const [phone, setPhone] = useState('');
  const [localError, setLocalError] = useState('');
  const [pickerVisible, setPickerVisible] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const fullPhone = `${countryCode.code}${phone}`;
  const isValid = validatePhone(fullPhone);

  const handleChangePhone = (text: string) => {
    const digits = text.replace(/\D/g, '');
    setPhone(digits);
    if (localError) { setLocalError(''); }
    if (error) { clearError(); }
  };

  const handleSendOTP = async () => {
    if (!isValid) {
      setLocalError(t('phone.error_invalid'));
      return;
    }
    setLocalError('');
    clearError();

    try {
      await sendOtp(fullPhone);
      // Navigate to OTP screen — phone is passed as param
      navigation.navigate('OTPVerificationScreen', { phone: fullPhone });
    } catch {
      // Error is already set in the store via sendOtp
    }
  };

  const displayError = localError || error || '';

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <OnboardingHeader showBack onBack={() => smartGoBack()} centerLabel={t('phone.header')} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.topCopy}>
            <Text style={styles.overline}>{t('phone.overline')}</Text>
            <Text style={styles.title}>{t('phone.title')}</Text>
            <Text style={styles.subtitle}>
              {t('phone.subtitle')}
            </Text>
          </View>

          {/* Label */}
          <Text style={styles.fieldLabel}>{t('phone.label_mobile')}</Text>

          {/* Phone field */}
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.fieldRow, displayError ? styles.fieldRowError : null]}
            onPress={() => inputRef.current?.focus()} accessibilityRole="button" accessibilityLabel={t('phone.a11yFocusInput', 'Focus phone number input')}>

            {/* Country code button */}
            <TouchableOpacity
              style={styles.codeBtn}
              onPress={() => setPickerVisible(true)}
              activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={`${countryCode.flag} ${countryCode.code}`}>
              <Text style={styles.codeFlag}>{countryCode.flag}</Text>
              <Text style={styles.codeText}>{countryCode.code}</Text>
              <Icon name="chevron-down" size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <View style={styles.fieldDivider} />

            {/* Real TextInput */}
            <TextInput
              ref={inputRef}
              style={styles.phoneInput}
              value={phone}
              onChangeText={handleChangePhone}
              placeholder={t('phone.placeholder')}
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="phone-pad"
              maxLength={countryCode.maxLength}
              returnKeyType="done"
              onSubmitEditing={handleSendOTP}
              autoFocus={true}
            />
          </TouchableOpacity>

          {displayError ? <Text style={styles.errorText}>{displayError}</Text> : null}

          {/* Trust note */}
          <View style={styles.trustNote}>
            <Icon name="lock-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.trustText}>
              {t('phone.trust_note')}
            </Text>
          </View>
        </ScrollView>

        <BottomActionBar>
          <Button
            title={t('phone.btn_send')}
            onPress={handleSendOTP}
            disabled={!isValid || isLoading}
            loading={isLoading}
          />
        </BottomActionBar>
      </SafeAreaView>

      {/* Country picker bottom sheet */}
      <AppBottomSheet
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        title={t('phone.titleSelectCountry', 'Select Country')}>
        <FlatList
          data={COUNTRY_CODES}
          keyExtractor={item => item.code}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.pickerItem,
                item.code === countryCode.code && styles.pickerItemActive,
              ]}
              onPress={() => {
                setCountryCode(item);
                setPickerVisible(false);
              }} accessibilityRole="button" accessibilityLabel={`${item.flag} ${t(`phone.countries.${item.nameKey}`, item.defaultName as string)} ${item.code}`}>
              <Text style={styles.pickerFlag}>{item.flag}</Text>
              <Text style={styles.pickerCountry}>{t(`phone.countries.${item.nameKey}`, item.defaultName as string)}</Text>
              <Text style={styles.pickerCode}>{item.code}</Text>
              {item.code === countryCode.code && (
                <Icon name="check" size={20} color={theme.colors.primary} />
              )}
            </TouchableOpacity>
          )}
        />
      </AppBottomSheet>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.background },
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },

  topCopy: { marginBottom: 32 },
  overline: {
    fontSize: 10,
    letterSpacing: 3,
    color: theme.colors.primary,
    fontWeight: '600',
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 36,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  subtitle: { fontSize: 14, color: theme.colors.textSecondary, lineHeight: 21 },

  fieldLabel: {
    fontSize: 11,
    letterSpacing: 2,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginBottom: 10,
  },

  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    marginBottom: 8,
    overflow: 'hidden',
  },
  fieldRowError: { borderColor: theme.colors.error },

  codeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 6,
    height: '100%',
  },
  codeFlag: { fontSize: 20 },
  codeText: { fontSize: 15, color: theme.colors.textPrimary, fontWeight: '600' },

  fieldDivider: {
    width: 1,
    height: 30,
    backgroundColor: theme.colors.border,
    marginHorizontal: 4,
  },

  phoneInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 14,
    fontSize: 18,
    color: theme.colors.textPrimary,
    fontWeight: '400',
    letterSpacing: 1,
  },

  errorText: {
    fontSize: 12,
    color: theme.colors.error,
    marginBottom: 12,
    marginLeft: 4,
  },

  trustNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  trustText: { flex: 1, fontSize: 12, color: theme.colors.textSecondary, lineHeight: 18 },

  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  pickerItemActive: { backgroundColor: 'rgba(212,175,55,0.08)', borderRadius: 8, paddingHorizontal: 8, marginHorizontal: -8 },
  pickerFlag: { fontSize: 22 },
  pickerCountry: { flex: 1, fontSize: 15, color: theme.colors.textPrimary, fontWeight: '500' },
  pickerCode: { fontSize: 14, color: theme.colors.textSecondary },
});
