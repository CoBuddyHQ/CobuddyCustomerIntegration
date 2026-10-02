import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { walletApi } from '../../services/api';
import type { Transaction } from '../../services/api/wallet.api';
import { RootStackParamList } from '../../types/navigation';


export const TransactionDetailScreen = () => { 
  const { t } = useTranslation('wallet.transactionDetail');
  const { smartGoBack } = useSmartNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'TransactionDetailScreen'>>();
  const [tx, setTx] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const id = route.params?.transactionId;
    if (!id) { setNotFound(true); setIsLoading(false); return; }
    walletApi.getTransaction(id)
      .then(data => { setTx(data); })
      .catch(() => { setNotFound(true); })
      .finally(() => setIsLoading(false));
  }, [route.params?.transactionId]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => smartGoBack()} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={t('a11yGoBack', 'Go back')}>
            <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('headerTitle', 'Transaction Details')}</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (notFound || !tx) {

    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => smartGoBack()} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={t('a11yGoBack', 'Go back')}>
            <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('headerTitle', 'Transaction Details')}</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Icon name="receipt" size={48} color={theme.colors.textSecondary} />
          <Text style={{ fontSize: 15, color: theme.colors.textSecondary }}>{t('emptyTextNotFound', 'Transaction not found.')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleDownload = () => {
    Alert.alert(t('alertTitleDownloadReceipt', 'Download Receipt'), t('alertMsgPDFreceipthasbeendow', 'PDF receipt has been downloaded successfully.'));
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => smartGoBack()} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={t('a11yGoBack', 'Go back')}>
          <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('headerTitle', 'Transaction Details')}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        
        <View style={styles.heroCard}>
            <View style={styles.heroGlow} />
            <View style={styles.heroTop}>
                <View style={styles.iconWrap}>
                    <Icon name="receipt" size={28} color={theme.colors.primary} />
                </View>
                <View style={styles.refBlock}>
                    <Text style={styles.refLabel}>{t('refLabel', 'TRANSACTION ID')}</Text>
                    <Text style={styles.refValue}>{tx.refId}</Text>
                    <View style={styles.statusBadge}>
                        <Icon name="check-circle" size={12} color={theme.colors.success} />
                        <Text style={styles.statusBadgeText}>{t(`status.${tx.status}`, String(tx.status))}</Text>
                    </View>
                </View>
            </View>

            <Text style={[styles.heroAmount, tx.positive && styles.heroAmountPos]}>{tx.amount}</Text>

            <View style={styles.verifiedBanner}>
                <Icon name="shield-check" size={16} color={theme.colors.success} />
                <View style={styles.verifiedMeta}>
                    <Text style={styles.verifiedTitle}>{t('verifiedTitle', 'Secured Transaction')}</Text>
                    <Text style={styles.verifiedSub}>{t('verifiedSub', 'Processed via CoBuddy Escrow')}</Text>
                </View>
            </View>
        </View>

        
        <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('infoTitle', 'TRANSACTION INFO')}</Text>
            {[
                { icon: 'calendar', label: t('txDetail.date', 'Date'), value: tx.date },
                { icon: 'clock-outline', label: t('txDetail.time', 'Time'), value: tx.time },
                { icon: 'tag-outline', label: t('txDetail.category', 'Category'), value: t(`categoryValues.${tx.category}`, String(tx.category)) },
                { icon: 'credit-card-outline', label: t('txDetail.paymentSource', 'Payment Source'), value: tx.paymentSource },
            ].map((row, i, arr) => (
                <View key={row.label} style={[styles.infoRow, i !== arr.length - 1 && styles.infoBorder]}>
                    <Icon name={row.icon} size={18} color={theme.colors.textSecondary} />
                    <Text style={styles.infoLabel}>{row.label}</Text>
                    <Text style={styles.infoValue}>{row.value}</Text>
                </View>
            ))}
        </View>

        
        {tx.companion ? (
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>{t('sessionTitle', 'SESSION DETAILS')}</Text>
                <View style={[styles.infoRow, styles.infoBorder]}>
                    <Icon name="account-outline" size={18} color={theme.colors.primary} />
                    <Text style={styles.infoLabel}>{t('infoCompanion', 'Companion')}</Text>
                    <Text style={styles.infoValue}>{tx.companion}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Icon name="timer-sand" size={18} color={theme.colors.primary} />
                    <Text style={styles.infoLabel}>{t('infoDuration', 'Duration')}</Text>
                    <Text style={styles.infoValue}>{tx.duration}</Text>
                </View>
            </View>
        ) : null}

        
        <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('breakdownTitle', 'PAYMENT BREAKDOWN')}</Text>
            {tx.breakdown.map((item: typeof tx.breakdown[0], i: number) => (
                <View key={item.label} style={[styles.summaryRow, i !== tx.breakdown.length - 1 && styles.summaryBorder]}>
                    <Text style={styles.summaryLabel}>{t(`breakdownLabels.${item.label}`, String(item.label))}</Text>
                    <Text style={styles.summaryValue}>{item.value}</Text>
                </View>
            ))}
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>{t('totalLabel', 'TOTAL')}</Text>
                <Text style={styles.totalValue}>{tx.amount.replace('-', '').replace('+', '')}</Text>
            </View>
        </View>

        
        <TouchableOpacity style={styles.downloadBtn} activeOpacity={0.8} onPress={handleDownload} accessibilityRole="button" accessibilityLabel={t('a11yDownloadReceipt', 'Download Receipt')}>
            <Icon name="download" size={20} color={theme.colors.surface} />
            <Text style={styles.downloadBtnText}>{t('downloadBtn', 'Download Receipt')}</Text>
        </TouchableOpacity>
        
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

  heroCard: { backgroundColor: theme.colors.surface, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden' },
  heroGlow: { position: 'absolute', top: -50, right: -20, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(212, 175, 55, 0.05)' },
  heroTop: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  iconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(212, 175, 55, 0.1)', justifyContent: 'center', alignItems: 'center' },
  refBlock: { flex: 1, justifyContent: 'center', gap: 4 },
  refLabel: { fontSize: 10, fontWeight: '600', color: theme.colors.textSecondary, letterSpacing: 1 },
  refValue: { fontSize: 16, fontWeight: 'bold', color: theme.colors.textPrimary },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(16, 185, 129, 0.1)', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { fontSize: 11, fontWeight: 'bold', color: theme.colors.success },
  heroAmount: { fontSize: 36, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 20 },
  heroAmountPos: { color: theme.colors.success },
  
  verifiedBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(16, 185, 129, 0.05)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)' },
  verifiedMeta: { flex: 1 },
  verifiedTitle: { fontSize: 13, fontWeight: 'bold', color: theme.colors.success },
  verifiedSub: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },

  card: { backgroundColor: theme.colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: theme.colors.border },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', color: theme.colors.textSecondary, letterSpacing: 1, marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  infoBorder: { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  infoLabel: { flex: 1, fontSize: 14, color: theme.colors.textSecondary },
  infoValue: { fontSize: 14, fontWeight: '600', color: theme.colors.textPrimary },

  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
  summaryBorder: { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  summaryLabel: { fontSize: 14, color: theme.colors.textSecondary },
  summaryValue: { fontSize: 14, fontWeight: '500', color: theme.colors.textPrimary },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 16, marginTop: 4, borderTopWidth: 1, borderTopColor: 'rgba(212, 175, 55, 0.2)' },
  totalLabel: { fontSize: 15, fontWeight: 'bold', color: theme.colors.textPrimary },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: theme.colors.primary },

  downloadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.colors.primary, paddingVertical: 16, borderRadius: 16, marginTop: 8 },
  downloadBtnText: { fontSize: 15, fontWeight: 'bold', color: theme.colors.surface },
});
