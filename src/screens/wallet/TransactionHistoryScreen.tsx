import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { walletApi } from '../../services/api';

const FILTERS = ['All', 'Money Added', 'Spent', 'Refunds'];
const FILTER_KEYS: Record<string, string> = {
  'All': 'filterChips.all',
  'Money Added': 'filterChips.moneyAdded',
  'Spent': 'filterChips.spent',
  'Refunds': 'filterChips.refunds',
};

export const TransactionHistoryScreen = () => { 
  const { t } = useTranslation('wallet.transactionHistory');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { smartGoBack } = useSmartNavigation();
  const [activeFilter, setActiveFilter] = useState('All');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      setIsLoading(true);
      walletApi.getTransactions(1, 50)
        .then(res => {
          if (!isMounted) return;
          const list = res.data || res.transactions || [];
          const formatted = list.map((item: any) => {
            const isAddMoney = item.type === 'add_money' || item.type === 'CREDIT' || item.type === 'credit';
            const isRefund = item.type === 'refund' || item.type === 'REFUND';
            const positive = item.positive !== undefined ? item.positive : (isAddMoney || isRefund);
            const category = isAddMoney ? 'Money Added' : isRefund ? 'Refunds' : 'Spent';
            const icon = isAddMoney ? 'wallet-plus' : isRefund ? 'arrow-u-left-top' : 'account-clock';
            const label = item.description || (isAddMoney ? t('txTypes.moneyAdded', 'Money Added') : item.booking?.companionName ? `Session with ${item.booking.companionName}` : 'Wallet Transaction');
            const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : (item.date || 'Recent');
            const amountStr = typeof item.amount === 'number' ? `${positive ? '+' : '-'} ₹${Math.abs(item.amount)}` : (item.amount || '₹0');
            const status = item.status || 'Successful';

            return {
              id: item.id,
              icon,
              label,
              category,
              date: dateStr,
              amount: amountStr,
              positive,
              status,
            };
          });
          setTransactions(formatted);
        })
        .catch(err => {
          console.warn('[TransactionHistoryScreen] Error loading real transactions:', err);
          if (isMounted) setTransactions([]);
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });

      return () => { isMounted = false; };
    }, [t])
  );

  const filtered = activeFilter === 'All'
    ? transactions
    : transactions.filter(t => t.category === activeFilter);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => smartGoBack()} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={t('a11yGoBack', 'Go back')}>
          <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('headerTitle', 'Transaction History')}</Text>
        <TouchableOpacity style={styles.backBtn} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={t('a11yDownload', 'Download')}>
            <Icon name="download" size={22} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {FILTERS.map(f => (
            <TouchableOpacity 
              key={f} 
              style={[styles.filterChip, activeFilter === f && styles.filterChipActive]} 
              onPress={() => setActiveFilter(f)}
              activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={t('a11yF', 'f')}
            >
              <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{t(FILTER_KEYS[f], f)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.emptyText}>Loading transactions...</Text>
          </View>
        ) : filtered.length === 0 ? (
           <View style={styles.emptyState}>
             <Icon name="receipt" size={48} color={theme.colors.textSecondary} />
             <Text style={styles.emptyText}>{t('emptyText', 'No transactions found.')}</Text>
           </View>
        ) : (
          filtered.map((tx, index) => (
            <TouchableOpacity 
              key={tx.id} 
              style={[styles.txItem, index !== filtered.length - 1 && styles.txBorder]}
              onPress={() => navigation.navigate('TransactionDetailScreen', { transactionId: tx.id })}
              activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={t('a11yGoToTransactiondetail', 'Go to TransactionDetail')}
            >
              <View style={[styles.txIconWrap, tx.positive ? styles.txIconWrapPos : styles.txIconWrapNeg, tx.status === 'Refunded' && styles.txIconWrapRefund]}>
                <Icon name={tx.icon} size={20} color={tx.status === 'Refunded' ? theme.colors.warning : tx.positive ? theme.colors.success : theme.colors.error} />
              </View>
              <View style={styles.txMeta}>
                <Text style={styles.txTitle} numberOfLines={1}>{tx.label}</Text>
                <Text style={styles.txSub}>{tx.date}</Text>
              </View>
              <View style={styles.txRight}>
                <Text style={[styles.txAmount, tx.positive ? styles.txAmountPos : styles.txAmountNeg, tx.status === 'Refunded' && styles.txAmountRefund]}>
                  {tx.amount}
                </Text>
                <View style={styles.statusRow}>
                  <Icon 
                    name={tx.status === 'Successful' || tx.status === 'Refunded' ? 'check-circle' : 'clock-outline'} 
                    size={12} 
                    color={tx.status === 'Pending' ? theme.colors.warning : theme.colors.success} 
                  />
                  <Text style={[styles.statusText, {color: tx.status === 'Pending' ? theme.colors.warning : theme.colors.success}]}>
                    {tx.status}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.textPrimary },
  
  filterContainer: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  filterScroll: { paddingHorizontal: 16, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  filterChipActive: { backgroundColor: 'rgba(212, 175, 55, 0.1)', borderColor: 'rgba(212, 175, 55, 0.4)' },
  filterText: { fontSize: 13, color: theme.colors.textSecondary, fontWeight: '500' },
  filterTextActive: { color: theme.colors.primary, fontWeight: '600' },

  scrollContent: { padding: 16, paddingBottom: 40 },
  
  txItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 14 },
  txBorder: { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  txIconWrap: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  txIconWrapPos: { backgroundColor: 'rgba(16, 185, 129, 0.1)' }, 
  txIconWrapNeg: { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  txIconWrapRefund: { backgroundColor: 'rgba(245, 158, 11, 0.1)' },
  
  txMeta: { flex: 1 },
  txTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 4 },
  txSub: { fontSize: 12, color: theme.colors.textSecondary },
  
  txRight: { alignItems: 'flex-end', gap: 4 },
  txAmount: { fontSize: 15, fontWeight: 'bold' },
  txAmountPos: { color: theme.colors.success },
  txAmountNeg: { color: theme.colors.textPrimary },
  txAmountRefund: { color: theme.colors.warning },
  
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusText: { fontSize: 11, fontWeight: '500' },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 15, color: theme.colors.textSecondary }
});
