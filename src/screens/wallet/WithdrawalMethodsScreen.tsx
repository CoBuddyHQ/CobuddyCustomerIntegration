import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { walletApi, WithdrawalMethod } from '../../services/api';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export const WithdrawalMethodsScreen = () => {
  const { t } = useTranslation('wallet.withdrawalMethods');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'WithdrawalMethodsScreen'>>();
  const { smartGoBack } = useSmartNavigation();
  const [methods, setMethods] = useState<WithdrawalMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const currentSelectionId = route.params?.currentId;

  const loadMethods = useCallback(async () => {
    setIsLoading(true);
    setLoadFailed(false);
    try {
      setMethods(await walletApi.getWithdrawalMethods());
    } catch {
      setLoadFailed(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMethods();
  }, [loadMethods]);

  const removeMethod = (method: WithdrawalMethod) => {
    Alert.alert(
      t('alertTitleRemovePayoutMet', 'Remove Payout Method'),
      t('alertMsgRemoveConfirm', 'Are you sure you want to remove {{title}}?', { title: method.title }),
      [
        { text: t('cancelBtn', 'Cancel'), style: 'cancel' },
        {
          text: t('removeBtn', 'Remove'),
          style: 'destructive',
          onPress: async () => {
            try {
              if (method.type === 'bank') await walletApi.deleteBankAccount(method.id);
              else await walletApi.deletePaymentMethod(method.id);
              setMethods((current) => current.filter((entry) => entry.id !== method.id));
            } catch {
              Alert.alert('Could not remove method', 'The server did not confirm removal.');
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => smartGoBack()}
          accessibilityRole="button"
          accessibilityLabel={t('a11yGoBack', 'Go back')}
        >
          <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('headerTitle', 'Withdrawal Methods')}</Text>
        <View style={styles.backButton} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
          <Icon name="bank-transfer-out" size={22} color={theme.colors.primary} />
          <Text style={styles.infoText}>
            Payout processing and bank verification are not configured. Only server-verified methods are shown.
          </Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>VERIFIED WITHDRAWAL METHODS</Text>
          {isLoading ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : loadFailed ? (
            <TouchableOpacity onPress={() => void loadMethods()} accessibilityRole="button">
              <Text style={styles.emptyText}>Could not load methods. Tap to retry.</Text>
            </TouchableOpacity>
          ) : methods.length === 0 ? (
            <Text style={styles.emptyText}>No verified withdrawal methods are available.</Text>
          ) : (
            methods.map((method, index) => {
              const selected = currentSelectionId === method.id;
              return (
                <TouchableOpacity
                  key={method.id}
                  style={[styles.methodRow, index < methods.length - 1 && styles.rowBorder, selected && styles.selected]}
                  onPress={() => navigation.navigate('WithdrawMoneyScreen', {
                    selectedMethod: method as unknown as Record<string, unknown>,
                  })}
                  accessibilityRole="button"
                  accessibilityLabel={t('a11ySelectPayoutMethod', 'Select {{method}}', { method: method.title })}
                >
                  <Icon name={method.icon || (method.type === 'bank' ? 'bank' : 'cellphone-wireless')} size={22} color={theme.colors.primary} />
                  <View style={styles.methodInfo}>
                    <Text style={styles.methodTitle}>{method.title}</Text>
                    <Text style={styles.methodSub}>{method.sub}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeMethod(method)}
                    accessibilityRole="button"
                    accessibilityLabel={t('a11yDelete', 'Delete')}
                  >
                    <Icon name="trash-can-outline" size={20} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })
          )}
        </View>
        <TouchableOpacity
          style={styles.addRow}
          onPress={() => navigation.navigate('AddBankAccountScreen')}
          accessibilityRole="button"
          accessibilityLabel={t('a11yAddBankAccount', 'Add Bank Account')}
        >
          <Icon name="bank-plus" size={22} color={theme.colors.primary} />
          <Text style={styles.addText}>{t('addBank', 'Add Bank Account')}</Text>
          <Icon name="chevron-right" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    minHeight: 60,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: { width: 40, paddingVertical: 8 },
  headerTitle: { color: theme.colors.textPrimary, fontSize: 18, fontWeight: '700' },
  content: { padding: 16, gap: 16 },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  infoText: { flex: 1, color: theme.colors.textSecondary, lineHeight: 20 },
  card: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 12,
  },
  sectionTitle: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: '700' },
  emptyText: { color: theme.colors.textSecondary, paddingVertical: 12 },
  methodRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  selected: { backgroundColor: 'rgba(255,255,255,0.03)' },
  methodInfo: { flex: 1 },
  methodTitle: { color: theme.colors.textPrimary, fontWeight: '600' },
  methodSub: { color: theme.colors.textSecondary, marginTop: 3 },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  addText: { flex: 1, color: theme.colors.textPrimary, fontWeight: '600' },
});
