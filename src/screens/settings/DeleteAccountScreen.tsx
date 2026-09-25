import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';

import { deleteAccount } from '../../services/api/account.api';
import { useAuthStore } from '../../store/slices/authStore';

export const DeleteAccountScreen = () => { 
  const { t } = useTranslation('settings.deleteAccount');
  const { smartGoBack } = useSmartNavigation();
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const isDeleteEnabled = confirmText.trim().toUpperCase() === 'DELETE';

  const handleDelete = () => {
      if (!isDeleteEnabled || isDeleting) return;
      
      Alert.alert(
          t('alertTitleFinalConfirmati', 'Final Confirmation'), 
          t('alertMsgThisactionisirrevers', 'This action is irreversible. All your data, wallet balance, and history will be permanently deleted.'),
          [
              { text: t('cancelBtn', 'Cancel'), style: 'cancel' },
              { 
                  text: t('confirmDelete', 'Yes, Delete'), 
                  style: 'destructive', 
                  onPress: async () => {
                      try {
                          setIsDeleting(true);
                          await deleteAccount();
                          await useAuthStore.getState().logout();
                          Alert.alert(
                              t('alertTitleAccountDeleted', 'Account Deleted'), 
                              t('alertMsgYouraccounthasbeende', 'Your account has been deleted.'), 
                              [{ text: t('okBtn', 'OK') }]
                          );
                      } catch (err: any) {
                          Alert.alert(
                              'Error', 
                              err?.response?.data?.message || err?.message || 'Failed to delete account. Please try again.'
                          );
                      } finally {
                          setIsDeleting(false);
                      }
                  }
              }
          ]
      );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => smartGoBack()} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={t('a11yGoBack', 'Go back')}>
          <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('headerTitle', 'Delete Account')}</Text>
        <View style={styles.backBtn} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            
            <View style={styles.warningCard}>
                <Icon name="alert-circle-outline" size={48} color={theme.colors.error} style={{marginBottom: 16}} />
                <Text style={styles.warningTitle}>{t('warningTitle', 'Are you absolutely sure?')}</Text>
                <Text style={styles.warningDesc}>
                    {t('warningDesc', 'Deleting your account is permanent. This action cannot be undone. You will immediately lose access to:')}
                </Text>
                <View style={styles.bulletList}>
                    <Text style={styles.bulletItem}>{t('chatHistory', '• Your entire chat history')}</Text>
                    <Text style={styles.bulletItem}>{t('bookingHistory', '• Your booking history and reviews')}</Text>
                    <Text style={styles.bulletItem}>{t('walletBalance', '• Any remaining wallet balance')}</Text>
                    <Text style={styles.bulletItem}>{t('kycStatus', '• Your KYC verification status')}</Text>
                </View>
            </View>

            <View style={styles.confirmSection}>
                <Text style={styles.confirmLabel}>{t('confirmLabel', 'To confirm, please type "DELETE" below:')}</Text>
                <TextInput 
                    style={styles.input}
                    value={confirmText}
                    onChangeText={setConfirmText}
                    placeholder={t('placeholder.DELETE', 'DELETE')}
                    placeholderTextColor={theme.colors.textSecondary}
                    autoCapitalize="characters"
                />
            </View>

            <TouchableOpacity 
                style={[styles.deleteBtn, (!isDeleteEnabled || isDeleting) && styles.deleteBtnDisabled]} 
                activeOpacity={0.8}
                disabled={!isDeleteEnabled || isDeleting}
                onPress={handleDelete} accessibilityRole="button" accessibilityLabel={t('a11yPermanentlyDeleteMyAccount', 'Permanently Delete My Account')}
            >
                <Text style={[styles.deleteBtnText, (!isDeleteEnabled || isDeleting) && styles.deleteBtnTextDisabled]}>
                    {isDeleting ? 'Deleting Account...' : t('deleteBtn', 'Permanently Delete My Account')}
                </Text>
            </TouchableOpacity>

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
  
  scrollContent: { padding: 24, paddingBottom: 40 },
  
  warningCard: { backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)', padding: 24, alignItems: 'center', marginBottom: 32 },
  warningTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.error, marginBottom: 12, textAlign: 'center' },
  warningDesc: { fontSize: 14, color: theme.colors.textPrimary, textAlign: 'center', lineHeight: 22, marginBottom: 16 },
  bulletList: { alignSelf: 'stretch', backgroundColor: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 12 },
  bulletItem: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 8, fontWeight: '500' },

  confirmSection: { marginBottom: 32 },
  confirmLabel: { fontSize: 14, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 12 },
  input: { backgroundColor: theme.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: theme.colors.error, fontWeight: 'bold', textAlign: 'center', letterSpacing: 2 },
  
  deleteBtn: { backgroundColor: theme.colors.error, paddingVertical: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: theme.colors.error, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  deleteBtnDisabled: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, shadowOpacity: 0, elevation: 0 },
  deleteBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  deleteBtnTextDisabled: { color: theme.colors.textSecondary }
});
