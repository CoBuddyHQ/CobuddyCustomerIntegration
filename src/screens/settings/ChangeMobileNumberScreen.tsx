import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { requestMobileChangeOtps, verifyMobileChangeOtps } from '../../services/api/account.api';
import { showApiError } from '../../utils/errorHandler';

export const ChangeMobileNumberScreen = () => {
  const { t } = useTranslation('settings.changeMobile');
  const { smartGoBack } = useSmartNavigation();
  const [oldPhone, setOldPhone] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [oldOtp, setOldOtp] = useState('');
  const [newOtp, setNewOtp] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!otpRequested && (!oldPhone.trim() || !newPhone.trim())) {
      Alert.alert(t('errorTitle', 'Error'), t('errorMsg', 'Please enter both old and new mobile numbers.'));
      return;
    }
    if (otpRequested && (!oldOtp.trim() || !newOtp.trim())) {
      Alert.alert('OTP required', 'Enter the verification codes for both mobile numbers.');
      return;
    }
    
    setIsLoading(true);
    try {
      if (!otpRequested) {
        const result = await requestMobileChangeOtps({
          oldPhone: oldPhone.trim(),
          newPhone: newPhone.trim(),
        });
        setOtpRequested(true);
        Alert.alert('Verification prepared', result.message);
        return;
      }
      const result = await verifyMobileChangeOtps({
        oldPhone: oldPhone.trim(),
        newPhone: newPhone.trim(),
        oldOtp: oldOtp.trim(),
        newOtp: newOtp.trim(),
      });
      Alert.alert('Number updated', result.message, [{ text: 'OK', onPress: () => smartGoBack() }]);
    } catch (error) {
      showApiError(error, {
        title: otpRequested ? 'Number change failed' : 'OTP request failed',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => smartGoBack()} accessibilityRole="button" accessibilityLabel="Back">
          <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('headerTitle', 'Change Mobile Number')}</Text>
        <View style={styles.backBtn} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.description}>
            {t('description', 'To securely change your mobile number, we need to verify both your current and new numbers via OTP.')}
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('oldNumberLabel', 'Current Mobile Number')}</Text>
            <View style={styles.inputContainer}>
              <Icon name="phone" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="+91 9876543210"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="phone-pad"
                value={oldPhone}
                editable={!otpRequested}
                onChangeText={setOldPhone}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('newNumberLabel', 'New Mobile Number')}</Text>
            <View style={styles.inputContainer}>
              <Icon name="phone-plus" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="+91 8765432109"
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="phone-pad"
                value={newPhone}
                editable={!otpRequested}
                onChangeText={setNewPhone}
              />
            </View>
          </View>

          {otpRequested && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Verification code for current number</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter current-number code"
                    placeholderTextColor={theme.colors.textSecondary}
                    keyboardType="number-pad"
                    value={oldOtp}
                    onChangeText={setOldOtp}
                  />
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Verification code for new number</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter new-number code"
                    placeholderTextColor={theme.colors.textSecondary}
                    keyboardType="number-pad"
                    value={newOtp}
                    onChangeText={setNewOtp}
                  />
                </View>
              </View>
            </>
          )}

        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={isLoading}>
          <Text style={styles.submitBtnText}>
            {otpRequested ? 'Verify numbers' : t('submitBtn', 'Request OTPs')}
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
  content: { padding: 20 },
  description: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: 32, lineHeight: 22 },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 8, letterSpacing: 0.5 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 16 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, height: 52, color: theme.colors.textPrimary, fontSize: 16 },
  footer: { padding: 20, paddingBottom: 32, backgroundColor: theme.colors.background, borderTopWidth: 1, borderTopColor: theme.colors.border },
  submitBtn: { backgroundColor: theme.colors.primary, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  submitBtnText: { color: theme.colors.background, fontSize: 16, fontWeight: 'bold' }
});
