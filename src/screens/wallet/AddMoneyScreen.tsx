import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { theme } from '../../theme';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { paymentApi, walletApi } from '../../services/api';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

const PRESET_AMOUNTS = ['500', '1000', '2000', '5000'];
const DEFAULT_PAYMENT = { id: 'pm_upi', icon: 'qrcode', title: 'UPI / GPay', sub: 'shlok@okicici' };

export const AddMoneyScreen = () => { 
  const { t } = useTranslation('wallet.addMoney');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { smartGoBack } = useSmartNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'AddMoneyScreen'>>();
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<any>(DEFAULT_PAYMENT);

  const [isProcessing, setIsProcessing] = useState(false);
  const [currentBalance, setCurrentBalance] = useState<number>(4500);

  useEffect(() => {
    walletApi.getWalletBalance().then(wb => {
      if (wb?.balance !== undefined) setCurrentBalance(wb.balance);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (route.params?.selectedMethod) {
        setSelectedMethod(route.params.selectedMethod);
        navigation.setParams({ selectedMethod: undefined });
    }
  }, [route.params?.selectedMethod, navigation]);

  const handleProceed = async () => {
    const val = parseInt(amount, 10);
    if (!amount || isNaN(val) || val < 100) return;

    setIsProcessing(true);
    try {
      const order = await paymentApi.createWalletTopupOrder(val);
      // Simulate/Trigger payment gateway verification
      if (order?.orderId) {
        await paymentApi.verifyWalletTopup({
          razorpay_order_id: order.orderId,
          razorpay_payment_id: `pay_${Date.now()}`,
          razorpay_signature: `sig_${Date.now()}`,
          amount: val,
        });
      }
    } catch {
      // Fallback
    } finally {
      setIsProcessing(false);
      navigation.navigate('TransactionHistoryScreen');
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => smartGoBack()} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={t('a11yGoBack', 'Go back')}>
          <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('headerTitle', 'Add Money')}</Text>
        <View style={styles.backBtn} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            
            <View style={styles.balanceInfoBox}>
                <Text style={styles.balanceInfoLabel}>{t('balanceLabel', 'CURRENT BALANCE')}</Text>
                <Text style={styles.balanceInfoValue}>₹{currentBalance.toLocaleString()}</Text>
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.rupeeSymbol}>₹</Text>
                <TextInput 
                    style={styles.amountInput}
                    value={amount}
                    onChangeText={setAmount}
                    placeholder={t('placeholder.0', '0')}
                    placeholderTextColor={theme.colors.textSecondary}
                    keyboardType="number-pad"
                    maxLength={5}
                    autoFocus
                />
            </View>

            <View style={styles.chipsRow}>
                {PRESET_AMOUNTS.map(preset => (
                    <TouchableOpacity 
                        key={preset} 
                        style={styles.presetChip}
                        activeOpacity={0.7}
                        onPress={() => setAmount(preset)} accessibilityRole="button" accessibilityLabel={t('a11yPreset', '+ ₹ preset')}
                    >
                        <Text style={styles.presetText}>+ ₹{preset}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <Text style={styles.helperText}>{t('helperText', 'Minimum top-up is ₹100. Max limit ₹10,000 per transaction.')}</Text>

            <View style={styles.paymentCard}>
                <Text style={styles.sectionTitle}>{t('sectionTitle', 'PAYING FROM')}</Text>
                
                <View style={styles.paymentRow}>
                    <View style={styles.paymentIconWrap}>
                        <Icon name={selectedMethod.icon} size={24} color={theme.colors.primary} />
                    </View>
                    <View style={styles.paymentMeta}>
                        <Text style={styles.paymentTitle}>{selectedMethod.title}</Text>
                        <Text style={styles.paymentSub}>{selectedMethod.sub}</Text>
                    </View>
                    <TouchableOpacity 
                        style={styles.changeBtn} 
                        activeOpacity={0.7}
                        onPress={() => navigation.navigate('PaymentMethodsScreen', { mode: 'select', currentId: selectedMethod.id })} accessibilityRole="button" accessibilityLabel={t('a11yChange', 'Change')}
                    >
                        <Text style={styles.changeText}>{t('btnChange', 'Change')}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.trustBanner}>
                    <Icon name="shield-check" size={16} color={theme.colors.success} />
                    <View>
                        <Text style={styles.trustTitle}>{t('trustTitle', '100% Safe & Secure')}</Text>
                        <Text style={styles.trustSub}>{t('trustSub', 'PCI-DSS compliant encrypted payments')}</Text>
                    </View>
                </View>
            </View>

        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
          <TouchableOpacity 
              style={[styles.proceedBtn, (!amount || parseInt(amount) < 100 || isProcessing) ? styles.proceedBtnDisabled : null]} 
              disabled={!amount || parseInt(amount) < 100 || isProcessing}
              activeOpacity={0.8}
              onPress={handleProceed} accessibilityRole="button" accessibilityLabel={t('a11yProceedToPay', 'Proceed to pay')}
          >
              <Text style={styles.proceedText}>
                {isProcessing ? 'Processing...' : t('proceedToPay', 'Proceed to Pay ₹{{amount}}', { amount: amount || '0' })}
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
  balanceInfoBox: { alignItems: 'center', marginBottom: 32 },
  balanceInfoLabel: { fontSize: 11, color: theme.colors.textSecondary, letterSpacing: 1, fontWeight: 'bold', marginBottom: 4 },
  balanceInfoValue: { fontSize: 16, color: theme.colors.textPrimary, fontWeight: '600' },
  inputContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 32 },
  rupeeSymbol: { fontSize: 40, color: theme.colors.textPrimary, fontWeight: 'bold', marginRight: 8, marginTop: Platform.OS === 'ios' ? 0 : -4 },
  amountInput: { fontSize: 48, color: theme.colors.textPrimary, fontWeight: 'bold', minWidth: 60, textAlign: 'center', padding: 0 },
  chipsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  presetChip: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 12, marginHorizontal: 4, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  presetText: { fontSize: 14, fontWeight: '600', color: theme.colors.textPrimary },
  helperText: { fontSize: 12, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 40 },
  paymentCard: { backgroundColor: theme.colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: theme.colors.border },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', color: theme.colors.textSecondary, letterSpacing: 1, marginBottom: 16 },
  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  paymentIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(212, 175, 55, 0.1)', justifyContent: 'center', alignItems: 'center' },
  paymentMeta: { flex: 1 },
  paymentTitle: { fontSize: 15, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 2 },
  paymentSub: { fontSize: 12, color: theme.colors.textSecondary },
  changeBtn: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, borderWidth: 1, borderColor: theme.colors.border },
  changeText: { fontSize: 12, fontWeight: 'bold', color: theme.colors.textPrimary },
  trustBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(16, 185, 129, 0.05)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)' },
  trustTitle: { fontSize: 12, fontWeight: 'bold', color: theme.colors.success, marginBottom: 2 },
  trustSub: { fontSize: 10, color: theme.colors.textSecondary },
  footer: { padding: 20, paddingBottom: Platform.OS === 'ios' ? 34 : 20, borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: theme.colors.background },
  proceedBtn: { backgroundColor: theme.colors.primary, paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
  proceedBtnDisabled: { opacity: 0.5 },
  proceedText: { fontSize: 16, fontWeight: 'bold', color: theme.colors.surface }
});
