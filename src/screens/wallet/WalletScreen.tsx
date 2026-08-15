import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  StatusBar, Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { walletApi, WalletBalance, Transaction } from '../../services/api';
import { useAuthStore } from '../../store/slices/authStore';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Mock Data
const WALLET_DATA = {
  balance: 4500,
  pendingRefund: 500,
  escrowHeld: 1200,
  kycStatus: 'unverified',
};



export const WalletScreen = () => { 
  const { t } = useTranslation('wallet.wallet');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { smartGoBack } = useSmartNavigation();
  const { kycStatus } = useAuthStore();

  const [wallet, setWallet] = useState<WalletBalance>({
    balance: 4500,
    currency: 'INR',
    pendingRefund: 500,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    let isMounted = true;
    const fetchWalletData = async () => {
      setIsLoading(true);
      try {
        const [wb, txs] = await Promise.allSettled([
          walletApi.getWalletBalance(),
          walletApi.getTransactions(),
        ]);
        if (isMounted && wb.status === 'fulfilled' && wb.value) {
          setWallet(wb.value);
        }
        if (isMounted && txs.status === 'fulfilled' && txs.value?.data) {
          setTransactions(txs.value.data);
        }
      } catch {
        // Fallback to initial state
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchWalletData();
    return () => {
      isMounted = false;
    };
  }, []);

  const MOCK_TRANSACTIONS = [
    { id: '1', type: 'add', title: t('txTypes.moneyAdded', 'Money Added'), method: 'via UPI ending in 45', amount: '+ ₹1,000', date: 'Today, 2:30 PM', positive: true, isRefund: false },
    { id: '2', type: 'deduct', title: t('txTypes.sessionPayment', 'Session Payment'), method: 'Booking #8294', amount: '- ₹450', date: 'Yesterday, 8:15 PM', positive: false, isRefund: false },
    { id: '3', type: 'refund', title: t('txTypes.refundProcessed', 'Refund Processed'), method: 'Canceled Session #8290', amount: '+ ₹200', date: 'Oct 18, 10:00 AM', positive: true, isRefund: true },
    { id: '4', type: 'add', title: t('txTypes.moneyAdded', 'Money Added'), method: 'via Card ending in 4242', amount: '+ ₹2,000', date: 'Oct 10, 1:15 PM', positive: true, isRefund: false },
  ];

  const displayTransactions = transactions.length > 0
    ? transactions.map((tx: Transaction) => ({
        id: tx.id,
        type: tx.type,
        title: tx.type === 'credit' ? t('txTypes.moneyAdded', 'Money Added') : tx.type === 'refund' ? t('txTypes.refundProcessed', 'Refund Processed') : t('txTypes.sessionPayment', 'Session Payment'),
        method: tx.category || tx.paymentSource || 'Wallet Transaction',
        amount: `${tx.positive ? '+' : '-'} ₹${Math.abs(tx.amount).toLocaleString()}`,
        date: tx.date || (tx.time ? `${tx.date} ${tx.time}` : 'Recent'),
        positive: tx.positive,
        isRefund: tx.type === 'refund',
      }))
    : MOCK_TRANSACTIONS;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backBtn} 
          onPress={() => smartGoBack()}
          activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={t('a11yGoBack', 'Go back')}
        >
          <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('headerTitle', 'My Wallet')}</Text>
        <View style={styles.backBtn} /> 
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        
        <View style={styles.heroCard}>
          <View style={styles.heroGlow} />
          <Text style={styles.heroSubtitle}>{t('availableBalance', 'Available Balance')}</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.currencySymbol}>₹</Text>
            <Text style={styles.balanceText}>{(wallet.balance ?? 4500).toLocaleString()}</Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statBadgeWarning}>
              <Icon name="clock-outline" size={14} color={theme.colors.warning} />
              <Text style={styles.statBadgeWarningText}>{t('wallet.pendingRefunds', 'Pending Refunds: ₹')}{(wallet.pendingRefund ?? 500).toLocaleString()}</Text>
            </View>
            <View style={styles.statBadgeNeutral}>
              <Icon name="shield-lock-outline" size={14} color={theme.colors.textSecondary} />
              <Text style={styles.statBadgeNeutralText}>{t('wallet.heldInEscrow', 'Held in Escrow: ₹')}{(wallet.escrowHeld ?? 1200).toLocaleString()}</Text>
            </View>
          </View>

          {kycStatus !== 'verified' && (
            <TouchableOpacity 
              style={styles.kycWarningBox}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('KYCStack')} accessibilityRole="button" accessibilityLabel={t('a11yWalletRestrictedTo10000L', 'Wallet restricted to ₹10,000 l...')}
            >
              <Icon name="alert-circle-outline" size={16} color={theme.colors.error} />
              <Text style={styles.kycWarningText}>{t('kycWarning', 'Wallet restricted to ₹10,000 limit. Complete KYC to upgrade.')}</Text>
              <Icon name="chevron-right" size={16} color={theme.colors.error} />
            </TouchableOpacity>
          )}
        </View>

        
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8} onPress={() => navigation.navigate('AddMoneyScreen')} accessibilityRole="button" accessibilityLabel={t('a11yAddMoney', 'Add Money')}>
            <View style={styles.actionIconBox}>
              <Icon name="plus" size={24} color={theme.colors.primary} />
            </View>
            <Text style={styles.actionLabel}>{t('addMoney', 'Add Money')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8} onPress={() => Alert.alert(t('alertTitleAutoReload', 'Auto-Reload'), t('alertMsgThisfeaturewillbeava', 'This feature will be available in V2.'))} accessibilityRole="button" accessibilityLabel={t('a11yAutoReload', 'Auto-Reload')}>
            <View style={styles.actionIconBoxV2}>
              <Icon name="autorenew" size={24} color={theme.colors.textSecondary} />
            </View>
            <Text style={styles.actionLabel}>{t('autoReload', 'Auto-Reload')}</Text>
            <View style={styles.v2Badge}><Text style={styles.v2BadgeText}>{t('v2', 'V2')}</Text></View>
          </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8} onPress={() => navigation.navigate('WithdrawMoneyScreen')} accessibilityRole="button" accessibilityLabel={t('a11yWithdraw', 'Withdraw')}>
              <View style={styles.actionIconBoxSecondary}>
                <Icon name="bank-transfer" size={24} color={theme.colors.textPrimary} />
              </View>
              <Text style={styles.actionLabel}>{t('withdraw', 'Withdraw')}</Text>
            </TouchableOpacity>
        </View>

        
        <TouchableOpacity style={styles.paymentCard} activeOpacity={0.8} onPress={() => navigation.navigate('PaymentMethodsScreen')} accessibilityRole="button" accessibilityLabel={t('a11yViewPaymentMethods', 'View payment methods')}>
          <View style={styles.paymentIconWrap}>
            <Icon name="credit-card-outline" size={22} color={theme.colors.primary} />
          </View>
          <View style={styles.paymentMeta}>
            <Text style={styles.paymentTitle}>{t('paymentMethodsTitle', 'Payment Methods')}</Text>
            <Text style={styles.paymentSub}>{t('paymentMethodsSub', 'Manage saved Cards & UPI')}</Text>
          </View>
          <Icon name="chevron-right" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        
        <View style={styles.txCard}>
          <View style={styles.txHeader}>
            <View>
              <Text style={styles.sectionTitle}>{t('recentTransactions', 'Recent Transactions')}</Text>
              <TouchableOpacity style={styles.downloadRow} onPress={() => Alert.alert(t('alertTitleDownloadStateme', 'Download Statement'), t('alertMsgPDFstatementhasbeeng', 'PDF statement has been generated and saved.'))} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={t('a11yDownloadStatement', 'Download Statement')}>
                <Icon name="download" size={14} color={theme.colors.primary} />
                <Text style={styles.downloadText}>{t('downloadStatement', 'Download Statement')}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('TransactionHistoryScreen')} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={t('a11yViewAll', 'View All')}>
              <Text style={styles.viewAllText}>{t('viewAll', 'View All')}</Text>
            </TouchableOpacity>
          </View>

          {displayTransactions.map((tx: any, index: number) => (
            <View key={tx.id} style={[styles.txItem, index !== displayTransactions.length - 1 && styles.txBorder]}>
              <View style={[styles.txIconWrap, tx.positive ? styles.txIconWrapPos : styles.txIconWrapNeg, tx.isRefund && styles.txIconWrapRefund]}>
                <Icon 
                  name={tx.isRefund ? "arrow-u-left-top" : tx.positive ? "arrow-bottom-left" : "arrow-top-right"} 
                  size={18} 
                  color={tx.isRefund ? theme.colors.warning : tx.positive ? theme.colors.success : theme.colors.error} 
                />
              </View>
              <View style={styles.txItemMeta}>
                <Text style={styles.txItemTitle}>{tx.title}</Text>
                <Text style={styles.txItemDate}>{tx.date} • {tx.method}</Text>
              </View>
              <Text style={[styles.txItemAmount, tx.positive ? styles.txAmountPos : styles.txAmountNeg, tx.isRefund && styles.txAmountRefund]}>
                {tx.amount}
              </Text>
            </View>
          ))}
        </View>

        
        <View style={styles.trustFooter}>
          <Icon name="shield-check" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.trustFooterText}>{t('escrowProtection', 'Secured by CoBuddy Escrow Protection')}</Text>
        </View>
        <Text style={styles.trustSubtext}>{t('escrowSubtext', 'Your money is safely held and only released upon successful session completion.')}</Text>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  
  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.textPrimary },

  scrollContent: { padding: 16, paddingBottom: 40, gap: 20 },

  // Hero Card
  heroCard: { 
    backgroundColor: theme.colors.surface, 
    borderRadius: 24, 
    padding: 24, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: 'rgba(212, 175, 55, 0.2)',
    overflow: 'hidden'
  },
  heroGlow: { position: 'absolute', top: -50, left: '20%', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(212,175,55,0.1)' },
  heroSubtitle: { fontSize: 13, color: theme.colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  balanceRow: { flexDirection: 'row', alignItems: 'flex-start' },
  currencySymbol: { fontSize: 24, color: theme.colors.primary, fontWeight: 'bold', marginTop: 4, marginRight: 4 },
  balanceText: { fontSize: 48, fontWeight: 'bold', color: theme.colors.textPrimary },
  
  statsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 16 },
  statBadgeWarning: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(245, 158, 11, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.2)' },
  statBadgeWarningText: { fontSize: 12, color: theme.colors.warning, fontWeight: '600' },
  statBadgeNeutral: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255, 255, 255, 0.05)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  statBadgeNeutralText: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: '600' },

  kycWarningBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)', marginTop: 16, width: '100%', gap: 8 },
  kycWarningText: { flex: 1, fontSize: 12, color: theme.colors.error, fontWeight: '500' },

  // Actions Row
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  actionBtn: { flex: 1, alignItems: 'center', backgroundColor: theme.colors.surface, paddingVertical: 16, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border, position: 'relative' },
  actionIconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(212, 175, 55, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionIconBoxV2: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255, 255, 255, 0.05)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionIconBoxSecondary: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255, 255, 255, 0.05)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionLabel: { fontSize: 12, fontWeight: '600', color: theme.colors.textPrimary },
  v2Badge: { position: 'absolute', top: 10, right: 10, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  v2BadgeText: { fontSize: 9, fontWeight: 'bold', color: theme.colors.textSecondary },

  // Payment Bridge
  paymentCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: theme.colors.surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: theme.colors.border },
  paymentIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(212, 175, 55, 0.1)', justifyContent: 'center', alignItems: 'center' },
  paymentMeta: { flex: 1 },
  paymentTitle: { fontSize: 15, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 2 },
  paymentSub: { fontSize: 12, color: theme.colors.textSecondary },

  // Transactions
  txCard: { backgroundColor: theme.colors.surface, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: theme.colors.border },
  txHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: theme.colors.textPrimary },
  downloadRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  downloadText: { fontSize: 12, color: theme.colors.primary, fontWeight: '500' },
  viewAllText: { fontSize: 13, color: theme.colors.primary, fontWeight: '600', marginTop: 2 },
  
  txItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 14 },
  txBorder: { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  txIconWrap: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  txIconWrapPos: { backgroundColor: 'rgba(16, 185, 129, 0.1)' }, // Success Green bg
  txIconWrapNeg: { backgroundColor: 'rgba(239, 68, 68, 0.1)' }, // Error Red bg
  txIconWrapRefund: { backgroundColor: 'rgba(245, 158, 11, 0.1)' }, // Warning Orange bg
  
  txItemMeta: { flex: 1 },
  txItemTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 2 },
  txItemDate: { fontSize: 11, color: theme.colors.textSecondary },
  
  txItemAmount: { fontSize: 14, fontWeight: 'bold' },
  txAmountPos: { color: theme.colors.success },
  txAmountNeg: { color: theme.colors.textPrimary },
  txAmountRefund: { color: theme.colors.warning },

  // Footer
  trustFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10 },
  trustFooterText: { fontSize: 12, fontWeight: '600', color: theme.colors.textSecondary },
  trustSubtext: { fontSize: 11, color: theme.colors.textSecondary, textAlign: 'center', marginTop: 4, paddingHorizontal: 20, opacity: 0.7, lineHeight: 16 }
});
