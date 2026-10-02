import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { supportApi } from '../../services/api';
import type { SupportTicket } from '../../services/api/support.api';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export const SupportCenterScreen = () => { 
  const { t } = useTranslation('support.supportCenter');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { smartGoBack } = useSmartNavigation();
  const [activeTab, setActiveTab] = useState<'Active' | 'Closed'>('Active');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supportApi.listTickets()
      .then(data => setTickets(Array.isArray(data) ? data : []))
      .catch(() => setTickets([]))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredTickets = tickets.filter(ticket =>
    activeTab === 'Active'
      ? (ticket.status === 'open' || ticket.status === 'in_progress')
      : (ticket.status === 'resolved' || ticket.status === 'closed')
  );

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'open': return theme.colors.error;
      case 'in_progress': return theme.colors.primary;
      case 'resolved': return theme.colors.success;
      case 'closed': return theme.colors.textSecondary;
      default: return theme.colors.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'open': return 'Open';
      case 'in_progress': return 'In Progress';
      case 'resolved': return 'Resolved';
      case 'closed': return 'Closed';
      default: return status;
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch(cat) {
      case 'Payment': return 'credit-card-outline';
      case 'Safety': return 'shield-alert-outline';
      case 'Account': return 'account-cog-outline';
      default: return 'help-circle-outline';
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => smartGoBack()} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={t('a11yGoBack', 'Go back')}>
          <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('headerTitle', 'Support Tickets')}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('HelpCenterScreen')} accessibilityRole="button" accessibilityLabel={t('a11yHelp', 'Help')}>
          <Icon name="help-circle-outline" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Active' && styles.activeTab]}
          onPress={() => setActiveTab('Active')}
          activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={t('a11yActive', 'Active')}
        >
          <Text style={[styles.tabText, activeTab === 'Active' && styles.activeTabText]}>{t('activeTab', 'Active')}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Closed' && styles.activeTab]}
          onPress={() => setActiveTab('Closed')}
          activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={t('a11yClosed', 'Closed')}
        >
          <Text style={[styles.tabText, activeTab === 'Closed' && styles.activeTabText]}>{t('closedTab', 'Closed')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : filteredTickets.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="ticket-confirmation-outline" size={48} color={theme.colors.textSecondary} style={{opacity: 0.5, marginBottom: 16}} />
            <Text style={styles.emptyTitle}>{t('noTickets', 'No {{tab}} tickets', { tab: activeTab.toLowerCase() })}</Text>
            <Text style={styles.emptySub}>{t('emptySub', 'You don\'t have any support tickets in this category right now.')}</Text>
          </View>
        ) : (
          <View style={styles.ticketList}>
            {filteredTickets.map(ticket => (
              <TouchableOpacity 
                key={ticket.id} 
                style={styles.ticketCard}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('SupportTicketDetailScreen', { ticketId: ticket.id })} accessibilityRole="button" accessibilityLabel={t('a11yGoToSupportticketdetail', 'Go to SupportTicketDetail')}
              >
                <View style={styles.ticketHeader}>
                  <View style={styles.ticketMeta}>
                    <Text style={styles.ticketId}>{ticket.id.slice(0, 8).toUpperCase()}</Text>
                    <View style={styles.dot} />
                    <Text style={styles.ticketDate}>{new Date(ticket.createdAt).toLocaleDateString()}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(ticket.status)}15` }]}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(ticket.status) }]} />
                    <Text style={[styles.statusText, { color: getStatusColor(ticket.status) }]}>{t(`status.${ticket.status}`, getStatusLabel(ticket.status))}</Text>
                  </View>
                </View>

                <View style={styles.ticketBody}>
                  <View style={styles.iconBox}>
                    <Icon name={getCategoryIcon(ticket.category)} size={20} color={theme.colors.textSecondary} />
                  </View>
                  <Text style={styles.ticketSubject} numberOfLines={2}>{ticket.subject}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('CreateSupportTicketScreen')} accessibilityRole="button" accessibilityLabel={t('a11yNewTicket', 'New Ticket')}
      >
        <Icon name="plus" size={24} color={theme.colors.background} />
        <Text style={styles.fabText}>{t('newTicket', 'New Ticket')}</Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.textPrimary },
  
  tabContainer: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: theme.colors.primary },
  tabText: { fontSize: 15, fontWeight: '600', color: theme.colors.textSecondary },
  activeTabText: { color: theme.colors.primary },

  scrollContent: { padding: 16, paddingBottom: 100 },
  
  ticketList: { gap: 12 },
  ticketCard: { backgroundColor: theme.colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.colors.border },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  ticketMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ticketId: { fontSize: 12, fontWeight: 'bold', color: theme.colors.textSecondary, letterSpacing: 0.5 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: theme.colors.border },
  ticketDate: { fontSize: 12, color: theme.colors.textSecondary },
  
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: 'bold' },

  ticketBody: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  ticketSubject: { flex: 1, fontSize: 15, fontWeight: '500', color: theme.colors.textPrimary, lineHeight: 22 },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 8 },
  emptySub: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', paddingHorizontal: 40, lineHeight: 20 },

  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: theme.colors.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 28, gap: 8, shadowColor: theme.colors.primary, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  fabText: { fontSize: 15, fontWeight: 'bold', color: theme.colors.background }
});
