import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { supportApi } from '../../services/api';
import { MOCK_TICKETS, MOCK_THREADS } from '../../services/mock/support.mock';
import { RootStackParamList } from '../../types/navigation';

export const SupportTicketDetailScreen = () => { 
  const { t } = useTranslation('support.ticketDetail');
  const { smartGoBack } = useSmartNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'SupportTicketDetailScreen'>>();
  const ticketId = route.params?.ticketId || 'TKT-8921';
  const matchedTicket = MOCK_TICKETS.find((tk: any) => tk.id === ticketId);
  
  const [replyText, setReplyText] = useState('');
  const [messages, setMessages] = useState(MOCK_THREADS[ticketId] || MOCK_THREADS['TKT-8921']);
  const [isSending, setIsSending] = useState(false);
  const isClosed = matchedTicket?.status === 'Closed';

  React.useEffect(() => {
    let isMounted = true;
    supportApi.getTicketDetail(ticketId).then(detail => {
      if (isMounted && detail?.messages && detail.messages.length > 0) {
        setMessages(detail.messages.map((m: any) => ({
          id: m.id,
          sender: m.senderType === 'agent' ? 'support' : 'user',
          text: m.content || m.text,
          time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
        })));
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, [ticketId]);

  const handleSend = async () => {
    if (!replyText.trim() || isSending) return;
    const txt = replyText.trim();
    const newMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: txt,
      time: t('justNow', 'Just now')
    };
    setMessages(prev => [...prev, newMsg]);
    setReplyText('');
    
    setIsSending(true);
    try {
      await supportApi.replyToTicket(ticketId, txt);
    } catch {
      // Optimistic update retained
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => smartGoBack()} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={t('a11yGoBack', 'Go back')}>
          <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>{ticketId}</Text>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            {matchedTicket?.status === 'Open' ? <Text style={styles.statusText}>{t('statusOpen', 'Open')}</Text> : matchedTicket?.status === 'Closed' ? <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>{t('statusClosed', 'Closed')}</Text> : <Text style={[styles.statusText, { color: theme.colors.primary }]}>{t('statusInProgress', 'In Progress')}</Text>}
          </View>
        </View>
        <View style={styles.backBtn} />
      </View>

      <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        
        {/* Ticket Original Context */}
        <View style={styles.contextCard}>
          <Text style={styles.contextLabel}>{matchedTicket?.subject || t('contextLabel', 'Refund Request for Booking #4412')}</Text>
          <Text style={styles.contextMeta}>{t('ticketMeta', 'Category: {{category}} • Created {{date}}', { category: t(`category.${matchedTicket?.category || 'Payment'}`, matchedTicket?.category || 'Payment'), date: matchedTicket?.date || '2 hours ago' })}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.chatScroll} showsVerticalScrollIndicator={false}>
          {messages.map((msg: any) => {
            const isUser = msg.sender === 'user';
            return (
              <View key={msg.id} style={[styles.messageWrapper, isUser ? styles.messageUser : styles.messageSupport]}>
                {!isUser && (
                  <View style={styles.supportAvatar}>
                    <Icon name="face-agent" size={16} color={theme.colors.primary} />
                  </View>
                )}
                <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleSupport]}>
                  <Text style={styles.bubbleText}>{msg.text}</Text>
                  <Text style={[styles.bubbleTime, isUser && { color: 'rgba(255,255,255,0.7)' }]}>{msg.time}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Reply Box */}
        {!isClosed ? (
          <View style={styles.replyBox}>
            <TouchableOpacity style={styles.attachBtn} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={t('a11yAttachFile', 'Attach file')}>
              <Icon name="paperclip" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            <TextInput
              style={styles.replyInput}
              placeholder={t('placeholder.WriteAReply', 'Write a reply...')}
              placeholderTextColor={theme.colors.textSecondary}
              value={replyText}
              onChangeText={setReplyText}
              multiline
            />
            <TouchableOpacity 
              style={[styles.sendBtn, !replyText.trim() && { opacity: 0.5 }]} 
              onPress={handleSend}
              activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={t('a11ySend', 'Send')}
            >
              <Icon name="send" size={20} color={theme.colors.background} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.closedBanner}>
            <Icon name="lock-outline" size={20} color={theme.colors.textSecondary} />
            <Text style={styles.closedText}>{t('closedText', 'This ticket has been marked as closed.')}</Text>
          </View>
        )}

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitleWrap: { alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 2 },
  
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, gap: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.error },
  statusText: { fontSize: 10, fontWeight: 'bold', color: theme.colors.error, textTransform: 'uppercase' },

  contextCard: { backgroundColor: theme.colors.surface, padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  contextLabel: { fontSize: 16, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 6 },
  contextMeta: { fontSize: 12, color: theme.colors.textSecondary },

  chatScroll: { padding: 16, paddingBottom: 24, gap: 16 },
  
  messageWrapper: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 8, width: '100%' },
  messageUser: { justifyContent: 'flex-end' },
  messageSupport: { justifyContent: 'flex-start' },
  
  supportAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(212,175,55,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 8, borderWidth: 1, borderColor: theme.colors.primary },
  
  bubble: { maxWidth: '80%', padding: 14, borderRadius: 20 },
  bubbleUser: { backgroundColor: theme.colors.primary, borderBottomRightRadius: 4 },
  bubbleSupport: { backgroundColor: theme.colors.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: theme.colors.border },
  
  bubbleText: { fontSize: 15, color: theme.colors.textPrimary, lineHeight: 22, marginBottom: 4 },
  bubbleTime: { fontSize: 11, color: theme.colors.textSecondary, alignSelf: 'flex-end' },

  replyBox: { flexDirection: 'row', alignItems: 'flex-end', padding: 16, borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: theme.colors.background },
  attachBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  replyInput: { flex: 1, minHeight: 44, maxHeight: 120, backgroundColor: theme.colors.surface, borderRadius: 22, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, color: theme.colors.textPrimary, fontSize: 15, marginHorizontal: 8, borderWidth: 1, borderColor: theme.colors.border },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' },

  closedBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: theme.colors.surface, borderTopWidth: 1, borderTopColor: theme.colors.border, gap: 8 },
  closedText: { fontSize: 13, color: theme.colors.textSecondary }
});
