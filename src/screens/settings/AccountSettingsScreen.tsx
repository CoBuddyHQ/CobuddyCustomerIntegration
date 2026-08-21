import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../../store/slices/authStore';
import { validateEmail } from '../../utils/validation';

export const AccountSettingsScreen = () => { 
  const { t } = useTranslation('settings.accountSettings');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { smartGoBack } = useSmartNavigation();
  const [email, setEmail] = useState('shlok.dev@example.com');
  const [appleConnected, setAppleConnected] = useState(false);
  const isKycVerified = useAuthStore(state => state.kycStatus === 'verified');
  
  const handleSaveEmail = () => {
      if (!validateEmail(email)) {
          Alert.alert(t('alertTitleInvalidEmail', 'Invalid Email'), t('alertMsgPleaseEnterValidEmail', 'Please enter a valid email address.'));
          return;
      }
      Alert.alert(t('alertTitleEmailUpdated', 'Email Updated'), t('alertMsgYouremailaddresshasb', 'Your email address has been successfully updated.'));
  };

  const handleDataRequest = () => {
      Alert.alert(t('alertTitleRequestSent', 'Request Sent'), t('alertMsgAlinktodownloadyourd', 'A link to download your data will be emailed to you within 48 hours.'));
  };

  const handleSupportRedirect = () => {
      navigation.navigate('SafetySupportStack', { screen: 'CreateSupportTicketScreen', params: { category: 'Identity Update' } });
  };

  const handlePhoneUpdate = () => {
      navigation.navigate('ChangeMobileNumberScreen' as never);
  };

  const toggleAppleConnect = () => {
      setAppleConnected(prev => !prev);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => smartGoBack()} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={t('a11yGoBack', 'Go back')}>
          <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('headerTitle', 'Account Settings')}</Text>
        <View style={styles.backBtn} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            
            {/* SECTION 1: CORE IDENTITY (Private) */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('coreIdentity', 'CORE IDENTITY (PRIVATE)')}</Text>
                <View style={styles.card}>
                    <View style={styles.infoBanner}>
                        <Icon name="shield-check" size={16} color={theme.colors.success} />
                        <Text style={styles.infoBannerText}>{t('identityVerified', 'Identity verified via KYC. Contact support to update.')}</Text>
                    </View>

                    <View style={styles.inputBlock}>
                        <Text style={styles.inputLabel}>{t('legalName', 'Legal Name')}</Text>
                        <TouchableOpacity style={styles.lockedInput} activeOpacity={0.9} onPress={handleSupportRedirect} accessibilityRole="button" accessibilityLabel={t('a11yShlokSharma', 'Shlok Sharma')}>
                            <Text style={styles.lockedText}>{t('mockName', 'Shlok Sharma')}</Text>
                            <Icon name={isKycVerified ? "lock" : "pencil"} size={16} color={isKycVerified ? theme.colors.textSecondary : theme.colors.primary} />
                        </TouchableOpacity>
                        <Text style={styles.helperText}>{t('matchesGovId', 'Matches your Government ID.')}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.inputBlock}>
                        <Text style={styles.inputLabel}>{t('dob', 'Date of Birth')}</Text>
                        <TouchableOpacity style={styles.lockedInput} activeOpacity={0.9} onPress={handleSupportRedirect} accessibilityRole="button" accessibilityLabel={t('a11y15Aug1998', '15 Aug 1998')}>
                            <Text style={styles.lockedText}>{t('mockDob', '15 Aug 1998')}</Text>
                            <Icon name={isKycVerified ? "lock" : "calendar-month"} size={16} color={isKycVerified ? theme.colors.textSecondary : theme.colors.primary} />
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.divider} />

                    <View style={styles.inputBlock}>
                        <Text style={styles.inputLabel}>{t('genderIdentity', 'Gender Identity')}</Text>
                        <TouchableOpacity style={styles.lockedInput} activeOpacity={0.9} onPress={handleSupportRedirect} accessibilityRole="button" accessibilityLabel={t('a11yMale', 'Male')}>
                            <Text style={styles.lockedText}>{t('genderMale', 'Male')}</Text>
                            <Icon name={isKycVerified ? "lock" : "chevron-down"} size={16} color={isKycVerified ? theme.colors.textSecondary : theme.colors.primary} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* SECTION 2: CONTACT & RECOVERY */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('contactRecovery', 'CONTACT & RECOVERY')}</Text>
                <View style={styles.card}>
                    <View style={styles.inputBlock}>
                        <Text style={styles.inputLabel}>{t('phone', 'Phone Number')}</Text>
                        <TouchableOpacity style={styles.lockedInput} activeOpacity={0.7} onPress={handlePhoneUpdate} accessibilityRole="button" accessibilityLabel={t('a11yCheckDecagram', 'Check Decagram')}>
                            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                                <Text style={styles.lockedText}>{t('mockPhone', '+91 98****1234')}</Text>
                                <Icon name="check-decagram" size={16} color={theme.colors.primary} />
                            </View>
                            <Icon name="pencil" size={16} color={theme.colors.primary} />
                        </TouchableOpacity>
                        <Text style={styles.helperText}>{t('verifiedOtp', 'Verified. Change requires OTP.')}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.inputBlock}>
                        <Text style={styles.inputLabel}>{t('email', 'Email Address')}</Text>
                        <View style={{flexDirection: 'row', gap: 8}}>
                            <TextInput 
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                placeholder={t('placeholder.nameExampleCom', 'name@example.com')}
                                placeholderTextColor={theme.colors.textSecondary}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEmail} accessibilityRole="button" accessibilityLabel={t('a11ySave', 'Save')}>
                                <Text style={styles.saveBtnText}>{t('save', 'Save')}</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.helperText}>{t('emailHelper', 'Used for booking receipts and support.')}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.inputBlock}>
                        <Text style={styles.inputLabel}>{t('linkedAccounts', 'Linked Accounts')}</Text>
                        
                        <View style={styles.linkedRow}>
                            <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                                <Icon name="google" size={24} color="#DB4437" />
                                <Text style={styles.linkedText}>{t('google', 'Google')}</Text>
                            </View>
                            <Text style={[styles.linkStatus, {color: theme.colors.success}]}>{t('connected', t('actions.connected', 'Connected'))}</Text>
                        </View>

                        <View style={[styles.linkedRow, {borderBottomWidth: 0, paddingBottom: 0, marginTop: 16}]}>
                            <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                                <Icon name="apple" size={24} color={theme.colors.textPrimary} />
                                <Text style={styles.linkedText}>{t('apple', 'Apple')}</Text>
                            </View>
                            <TouchableOpacity onPress={toggleAppleConnect} accessibilityRole="button" accessibilityLabel={appleConnected ? t('actions.connected', 'Connected') : t('actions.connect', 'Connect')}>
                                <Text style={[styles.linkStatus, {color: appleConnected ? theme.colors.success : theme.colors.primary}]}>
                                    {appleConnected ? t('actions.connected', 'Connected') : t('actions.connect', 'Connect')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>

            {/* SECTION 3: DATA & PORTABILITY */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('dataPrivacy', 'DATA & PRIVACY')}</Text>
                <View style={styles.card}>
                    <TouchableOpacity style={styles.downloadRow} activeOpacity={0.7} onPress={handleDataRequest} accessibilityRole="button" accessibilityLabel={t('a11yRequestDataDownload', 'Request your data download')}>
                        <View style={styles.iconBox}>
                            <Icon name="download-box-outline" size={24} color={theme.colors.textPrimary} />
                        </View>
                        <View style={{flex: 1, marginLeft: 16}}>
                            <Text style={styles.downloadTitle}>{t('downloadInfo', 'Download Account Info')}</Text>
                            <Text style={styles.downloadSub}>{t('downloadSub', 'Request a copy of your CoBuddy data')}</Text>
                        </View>
                        <Icon name="chevron-right" size={20} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                </View>
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
  
  scrollContent: { padding: 16, paddingBottom: 40 },
  
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', color: theme.colors.textSecondary, letterSpacing: 1, marginBottom: 12, marginLeft: 8 },
  card: { backgroundColor: theme.colors.surface, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border, padding: 20 },
  
  infoBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.05)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)', marginBottom: 20, gap: 8 },
  infoBannerText: { fontSize: 12, color: theme.colors.success, flex: 1 },

  inputBlock: { marginBottom: 4 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 8 },
  lockedInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 16, paddingVertical: 14 },
  lockedText: { fontSize: 15, color: theme.colors.textPrimary, fontWeight: '500' },
  helperText: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 8 },
  
  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 20 },
  
  input: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: theme.colors.textPrimary },
  saveBtn: { backgroundColor: 'rgba(212, 175, 55, 0.1)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.3)' },
  saveBtnText: { color: theme.colors.primary, fontWeight: 'bold', fontSize: 14 },

  linkedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  linkedText: { fontSize: 15, color: theme.colors.textPrimary, fontWeight: '500' },
  linkStatus: { fontSize: 13, fontWeight: '600' },

  downloadRow: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  downloadTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 2 },
  downloadSub: { fontSize: 12, color: theme.colors.textSecondary }
});
