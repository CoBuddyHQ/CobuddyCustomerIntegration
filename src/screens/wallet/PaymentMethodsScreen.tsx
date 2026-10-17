import { useTranslation } from 'react-i18next';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { walletApi, PaymentMethod } from '../../services/api';

export const PaymentMethodsScreen = () => { 
  const { t } = useTranslation('wallet.paymentMethods');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { smartGoBack } = useSmartNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'PaymentMethodsScreen'>>();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const isSelectionMode = route.params?.mode === 'select';

  const loadMethods = useCallback(async () => {
    setIsLoading(true);
    setLoadFailed(false);
    try {
      setMethods(await walletApi.getPaymentMethods());
    } catch {
      setLoadFailed(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMethods();
  }, [loadMethods]);

  const handleMethodPress = (method: any) => {
    if (isSelectionMode) {
      navigation.navigate('AddMoneyScreen', { selectedMethod: method });
    } else {
      Alert.alert('Default method unavailable', 'Changing the default payment method is not configured. No change was made.');
    }
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert(t('alertTitleRemovePaymentMe', 'Remove Payment Method'), t('alertMsgRemoveConfirm', 'Are you sure you want to remove {{title}} from your saved methods?', { title }),
        [
            { text: t('cancelBtn', 'Cancel'), style: 'cancel' },
            { text: t('removeBtn', 'Remove'), style: 'destructive', onPress: async () => {
                try {
                  await walletApi.deletePaymentMethod(id);
                  setMethods(prev => prev.filter(m => m.id !== id));
                } catch {
                  Alert.alert('Could not remove method', 'The server did not confirm the payment method removal.');
                }
            }}
        ]
    );
  };

  const handleAddUpi = () => {
    Alert.alert('UPI verification unavailable', 'No UPI verification provider is configured. No UPI ID was saved.');
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => smartGoBack()} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={t('a11yGoBack', 'Go back')}>
          <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isSelectionMode ? t('payment.selectMethod', 'Select Payment Method') : t('payment.methods', 'Payment Methods')}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {!isSelectionMode ? (
            <View style={styles.securityHero}>
                <View style={styles.securityIconWrap}>
                    <Icon name="shield-lock-outline" size={24} color={theme.colors.primary} />
                </View>
                <View style={styles.securityMeta}>
                    <Text style={styles.securityTitle}>{t('secureTitle', 'Secure payment provider unavailable')}</Text>
                    <Text style={styles.securitySub}>{t('secureDesc', 'No card tokenization provider is connected. Do not enter payment credentials.')}</Text>
                </View>
            </View>
        ) : null}

        <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('sectionTitle', 'SAVED PAYMENT METHODS')}</Text>

            {isLoading ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : loadFailed ? (
              <TouchableOpacity onPress={() => void loadMethods()} accessibilityRole="button">
                <Text style={styles.methodSub}>Could not load saved methods. Tap to retry.</Text>
              </TouchableOpacity>
            ) : methods.length === 0 ? (
              <Text style={styles.methodSub}>
                No verified payment methods are available. Secure tokenization is not configured.
              </Text>
            ) : null}
            
            {!isLoading && !loadFailed && methods.map((pm, index) => {
                const isSelected = isSelectionMode ? route.params?.currentId === pm.id : pm.isDefault;
                return (
                    <TouchableOpacity 
                        key={pm.id} 
                        style={[styles.methodRow, index !== methods.length - 1 ? styles.methodBorder : null, isSelected ? styles.methodSelected : null]}
                        activeOpacity={0.8}
                        onPress={() => handleMethodPress(pm)} accessibilityRole="button" accessibilityLabel={t('a11ySelectPaymentMethod', 'Select {{method}}', { method: pm.title })}
                    >
                        <View style={[styles.methodIconWrap, isSelected ? styles.methodIconWrapActive : null]}>
                            <Icon name={pm.icon} size={22} color={isSelected ? theme.colors.primary : theme.colors.textSecondary} />
                        </View>
                        <View style={styles.methodMeta}>
                            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                                <Text style={styles.methodTitle}>{pm.title}</Text>
                                {pm.isDefault && !isSelectionMode ? (
                                    <View style={styles.defaultBadge}>
                                        <Text style={styles.defaultBadgeText}>{t('defaultBadge', 'Default')}</Text>
                                    </View>
                                ) : null}
                            </View>
                            <Text style={styles.methodSub}>{pm.sub}</Text>
                        </View>
                        
                        {!isSelectionMode ? (
                            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(pm.id, pm.title)} accessibilityRole="button" accessibilityLabel={t('a11yDelete', 'Delete')}>
                                <Icon name="trash-can-outline" size={20} color={theme.colors.textSecondary} />
                            </TouchableOpacity>
                        ) : (
                            <View style={[styles.radioOuter, isSelected ? styles.radioOuterSelected : null]}>
                                {isSelected ? <View style={styles.radioInner} /> : null}
                            </View>
                        )}
                    </TouchableOpacity>
                );
            })}

            <View style={styles.actionsContainer}>
                <TouchableOpacity 
                    style={styles.addMethodRow} 
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('AddPaymentMethodScreen')} accessibilityRole="button" accessibilityLabel={t('a11yAddNewCard', 'Add New Card')}
                >
                    <View style={styles.addIconWrap}>
                        <Icon name="credit-card-plus-outline" size={22} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.addMethodText}>{t('addCard', 'Add New Card')}</Text>
                    <Icon name="chevron-right" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.addMethodRow, { borderTopWidth: 0, paddingTop: 12, marginTop: 4 }]} 
                    activeOpacity={0.7}
                    onPress={handleAddUpi} accessibilityRole="button" accessibilityLabel={t('a11yAddUpiId', 'Add UPI ID')}
                >
                    <View style={styles.addIconWrap}>
                        <Icon name="at" size={22} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.addMethodText}>{t('modalTitle', 'Add UPI ID')}</Text>
                    <Icon name="chevron-right" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
            </View>
        </View>

        <View style={styles.trustFooter}>
            <Icon name="lock" size={14} color={theme.colors.textSecondary} />
            <Text style={styles.trustText}>{t('trustText', 'No payment details are stored by this app.')}</Text>
        </View>

      </ScrollView>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.textPrimary },
  scrollContent: { padding: 16, paddingBottom: 40, gap: 16 },
  securityHero: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, backgroundColor: 'rgba(212, 175, 55, 0.05)', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.2)' },
  securityIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(212, 175, 55, 0.1)', justifyContent: 'center', alignItems: 'center' },
  securityMeta: { flex: 1 },
  securityTitle: { fontSize: 15, fontWeight: 'bold', color: theme.colors.primary, marginBottom: 4 },
  securitySub: { fontSize: 12, color: theme.colors.textSecondary, lineHeight: 18 },
  card: { backgroundColor: theme.colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: theme.colors.border },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', color: theme.colors.textSecondary, letterSpacing: 1, marginBottom: 16 },
  methodRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 14, borderRadius: 12, paddingHorizontal: 8 },
  methodBorder: { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  methodSelected: { backgroundColor: 'rgba(255,255,255,0.03)' },
  methodIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  methodIconWrapActive: { backgroundColor: 'rgba(212, 175, 55, 0.1)', borderColor: 'rgba(212, 175, 55, 0.3)', borderWidth: 1 },
  methodMeta: { flex: 1 },
  methodTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.textPrimary },
  methodSub: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 4 },
  defaultBadge: { backgroundColor: 'rgba(212, 175, 55, 0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 100 },
  defaultBadgeText: { fontSize: 9, fontWeight: 'bold', color: theme.colors.primary, textTransform: 'uppercase' },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: theme.colors.textSecondary, justifyContent: 'center', alignItems: 'center' },
  radioOuterSelected: { borderColor: theme.colors.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.primary },
  deleteBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 18 },
  actionsContainer: { paddingTop: 8, marginTop: 8, borderTopWidth: 1, borderTopColor: theme.colors.border },
  addMethodRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 8 },
  addIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(212, 175, 55, 0.05)', borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.2)', justifyContent: 'center', alignItems: 'center' },
  addMethodText: { flex: 1, fontSize: 15, fontWeight: '600', color: theme.colors.primary },
  trustFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10 },
  trustText: { fontSize: 12, color: theme.colors.textSecondary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.textPrimary },
  modalLabel: { fontSize: 12, fontWeight: '500', color: theme.colors.textSecondary, marginBottom: 8 },
  inputWrap: { justifyContent: 'center', marginBottom: 24 },
  upiInput: { backgroundColor: theme.colors.background, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, color: theme.colors.textPrimary, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, paddingRight: 48 },
  verifyBtn: { backgroundColor: theme.colors.primary, paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  verifyBtnText: { color: theme.colors.surface, fontSize: 16, fontWeight: 'bold' }
});
