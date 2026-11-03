import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  StatusBar, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { ChatInputBar } from '../../components/common/ChatInputBar';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { RootStackParamList } from '../../types/navigation';
import { isFeatureEnabled } from '../../config/featureFlags';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { chatApi } from '../../services/api';
import { chatSocketService } from '../../services/socket/chatSocket.service';

interface DisplayMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  senderName?: string;
  time: string;
}

export const ConciergeChatScreen = () => { 
  const { t } = useTranslation('chat.concierge');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { smartGoBack } = useSmartNavigation();
  const scrollRef = useRef<ScrollView>(null);

  const QUICK_ACTIONS = [
    t('quickAction.cancelBooking', 'Cancel Booking'), 
    t('quickAction.refundStatus', 'Refund Status'), 
    t('quickAction.reportSafety', 'Report Safety Issue'), 
    t('quickAction.generalHelp', 'General Help')
  ];

  const [conversationId, setConversationId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [messages, setMessages] = useState<DisplayMessage[]>([
    {
      id: 'welcome-1',
      text: t('botMsg.hi', 'Hi! I am the CoBuddy Concierge. How can I help you today?'),
      sender: 'bot',
      senderName: 'CoBuddy Concierge',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
    {
      id: 'welcome-2',
      text: t('botMsg.emergency', 'If you have an emergency, please use the SOS button on the home screen or type your issue below. A live support specialist is also available in this thread.'),
      sender: 'bot',
      senderName: 'CoBuddy Concierge',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const mapMessage = useCallback((m: any): DisplayMessage => {
    const isCustomer = m.senderType === 'customer';
    return {
      id: m.id || String(Date.now() + Math.random()),
      text: m.text || '',
      sender: isCustomer ? 'user' : 'bot',
      senderName: m.senderName || (isCustomer ? 'You' : 'CoBuddy Support'),
      time: m.createdAt
        ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }, []);

  const loadMessages = useCallback(async (convId: string) => {
    try {
      const res = await chatApi.getMessages(convId);
      if (res?.data && res.data.length > 0) {
        const mapped = res.data.map(mapMessage);
        setMessages((prev) => {
          const existingIds = new Set(mapped.map((item) => item.id));
          const pending = prev.filter((item) => item.id.startsWith('temp-') && !existingIds.has(item.id));
          return [...mapped, ...pending];
        });
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
      }
    } catch (err) {
      console.warn('Failed to load concierge messages:', err);
    }
  }, [mapMessage]);

  // Initialize conversation and socket subscription
  useEffect(() => {
    let isMounted = true;
    let pollInterval: any = null;

    async function initChat() {
      try {
        setLoading(true);
        const conv = await chatApi.getOrCreateConciergeConversation();
        if (conv?.id && isMounted) {
          setConversationId(conv.id);
          await loadMessages(conv.id);

          // Connect Socket.IO
          chatSocketService.connect(conv.id, (incoming) => {
            if (!isMounted || !incoming) return;
            const formatted = mapMessage(incoming);
            setMessages((prev) => {
              if (prev.some((msg) => msg.id === formatted.id)) return prev;
              return [...prev.filter((m) => !m.id.startsWith('temp-') || m.text !== formatted.text), formatted];
            });
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
          });

          // Periodic background poll fallback
          pollInterval = setInterval(() => {
            if (isMounted) loadMessages(conv.id);
          }, 3500);
        }
      } catch (err) {
        console.warn('Failed to init concierge chat:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initChat();

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
      chatSocketService.disconnect();
    };
  }, [loadMessages, mapMessage]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    let activeConvId = conversationId;
    if (!activeConvId) {
      try {
        const conv = await chatApi.getOrCreateConciergeConversation();
        if (conv?.id) {
          activeConvId = conv.id;
          setConversationId(conv.id);
        }
      } catch (err) {
        console.warn('Could not create concierge conversation:', err);
      }
    }

    const tempId = 'temp-' + Date.now();
    const optimisticMsg: DisplayMessage = {
      id: tempId,
      text: text.trim(),
      sender: 'user',
      senderName: 'You',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    if (activeConvId) {
      try {
        const saved = await chatApi.sendMessage(activeConvId, text.trim());
        if (saved?.id) {
          setMessages((prev) =>
            prev.map((m) => (m.id === tempId ? mapMessage(saved) : m))
          );
        }
      } catch (err) {
        console.warn('Failed to send concierge message:', err);
      }
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.surface} />
      
      {/* ── Header ── */}
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => smartGoBack()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel={t('a11yGoBack', 'Go back')}>
              <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles.avatarBox}>
              <Icon name="shield-star" size={20} color={theme.colors.background} />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.headerTitle}>{t('headerTitle', 'CoBuddy Concierge')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>{t('onlineText', 'Typically replies in 2 mins')}</Text>
              </View>
            </View>
          </View>
          {isFeatureEnabled('ENABLE_VOICE_CALL') && (
            <TouchableOpacity 
              style={styles.callBtn}
              onPress={() => navigation.navigate('VoiceCallScreen', { companionName: 'CoBuddy Concierge' })}
              activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={t('a11yCall', 'Call')}
            >
              <Icon name="phone" size={20} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      {/* ── Chat Messages Area ── */}
      <ScrollView 
        ref={scrollRef}
        contentContainerStyle={styles.chatArea} 
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        <View style={styles.dateChip}>
          <Text style={styles.dateText}>{t('dateText', 'TODAY')}</Text>
        </View>

        {loading && messages.length <= 2 && (
          <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginVertical: 12 }} />
        )}

        {messages.map((msg, idx) => {
          if (msg.sender === 'bot') {
            return (
              <View key={`${msg.id}-${idx}`} style={styles.messageRowBot}>
                <View style={styles.botAvatarSm}>
                  <Icon name="robot-outline" size={16} color={theme.colors.background} />
                </View>
                <View style={styles.botBubble}>
                  {msg.senderName && (
                    <Text style={styles.senderHeader}>{msg.senderName}</Text>
                  )}
                  <Text style={styles.botText}>{msg.text}</Text>
                  <Text style={styles.msgTime}>{msg.time}</Text>
                </View>
              </View>
            );
          } else {
            return (
              <View key={`${msg.id}-${idx}`} style={styles.messageRowUser}>
                <View style={styles.userBubble}>
                  <Text style={styles.userText}>{msg.text}</Text>
                  <Text style={[styles.msgTime, { alignSelf: 'flex-start', color: 'rgba(20,20,15,0.6)' }]}>{msg.time}</Text>
                </View>
              </View>
            );
          }
        })}
      </ScrollView>

      {/* ── Fixed Quick Actions (Above Text Input) ── */}
      <View style={styles.quickActionsWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.quickActionsContainer}
        >
          {QUICK_ACTIONS.map((action, idx) => (
            <TouchableOpacity 
              key={idx} 
              style={styles.actionChip}
              onPress={() => handleSend(action)} accessibilityRole="button" accessibilityLabel={t('a11ySendQuickAction', 'Send: {{action}}', { action })}
            >
              <Text style={styles.actionText}>{action}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ChatInputBar onSend={handleSend} />

    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  
  headerSafeArea: { backgroundColor: theme.colors.surface },
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingHorizontal: 16, paddingVertical: 12, 
    borderBottomWidth: 1, borderBottomColor: theme.colors.border, 
    backgroundColor: theme.colors.surface 
  },
  backBtn: { padding: 8, marginRight: 8, marginLeft: -8 },
  avatarBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: theme.colors.textPrimary },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.success },
  onlineText: { fontSize: 12, color: theme.colors.textSecondary },
  callBtn: { padding: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20 },

  chatArea: { padding: 16, paddingBottom: 24 },
  
  dateChip: { alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 24 },
  dateText: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },

  messageRowBot: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 16, maxWidth: '85%' },
  botAvatarSm: { width: 24, height: 24, borderRadius: 12, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  botBubble: { backgroundColor: theme.colors.surface, padding: 12, borderRadius: 16, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: theme.colors.border },
  senderHeader: { color: theme.colors.primary, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  botText: { color: theme.colors.textPrimary, fontSize: 14, lineHeight: 20 },
  
  messageRowUser: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 16, maxWidth: '85%', alignSelf: 'flex-end' },
  userBubble: { backgroundColor: theme.colors.primary, padding: 12, borderRadius: 16, borderBottomRightRadius: 4 },
  userText: { color: theme.colors.background, fontSize: 14, lineHeight: 20, fontWeight: '500' },

  msgTime: { color: theme.colors.textSecondary, fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },

  // Fixed above input
  quickActionsWrapper: {
    backgroundColor: theme.colors.background,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
  },
  quickActionsContainer: { paddingHorizontal: 16, gap: 10 },
  actionChip: { 
    backgroundColor: 'rgba(212, 175, 55, 0.1)', 
    borderWidth: 1, borderColor: theme.colors.primary, 
    paddingHorizontal: 16, paddingVertical: 8, 
    borderRadius: 20 
  },
  actionText: { color: theme.colors.primary, fontSize: 13, fontWeight: '600' },
});
