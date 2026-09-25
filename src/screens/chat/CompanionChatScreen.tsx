import React, { useState, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  StatusBar, KeyboardAvoidingView, Platform, Modal, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { ChatInputBar } from '../../components/common/ChatInputBar';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { getMockChatMessages } from '../../services/mock/chat.mock';
import { chatApi } from '../../services/api';
import { RootStackParamList } from '../../types/navigation';
import { isFeatureEnabled } from '../../config/featureFlags';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export const CompanionChatScreen = () => { 
  const { t } = useTranslation('chat.companion');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { smartGoBack } = useSmartNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'CompanionChatScreen'>>();
  const companionName = route.params?.companionName || 'Companion';
  const bookingId = route.params?.bookingId || '';
  const companionId = route.params?.companionId || '';
  
  const [isOptionsMenuVisible, setOptionsMenuVisible] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<any[]>([]);

  React.useEffect(() => {
    let isMounted = true;
    chatApi.getMessages(companionId).then(apiMsgs => {
      if (isMounted && apiMsgs?.data) {
        setMessages(apiMsgs.data.map(m => ({
          id: m.id,
          type: 'text',
          text: m.text || '',
          sender: m.senderId === companionId ? 'them' : 'me',
          time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now',
        })));
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 200);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, [companionId]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    
    const newMsg = {
      id: Date.now().toString(),
      type: 'text',
      text: text,
      sender: 'me',
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };
    
    setMessages(prev => [...prev, newMsg]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      await chatApi.sendMessage(companionId, text.trim());
    } catch {
      // Optimistic update retained
    }
  };

  const handleCall = () => {
    navigation.navigate('VoiceCallScreen', { companionName: companionName });
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
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <TouchableOpacity onPress={() => smartGoBack()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel={t('a11yGoBack', 'Go back')}>
              <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.avatarBox}
              onPress={() => navigation.navigate('CompanionProfileScreen', { companionId })} accessibilityRole="button" accessibilityLabel={t('a11yGoToDiscovertab', 'Go to DiscoverTab')}
            >
              <Text style={styles.avatarInitials}>{companionName.charAt(0)}</Text>
              <View style={styles.onlineDot} />
            </TouchableOpacity>
            <View style={{ marginLeft: 12, flexShrink: 1 }}>
              <Text style={styles.headerTitle} numberOfLines={1}>{companionName}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('BookingsTab', { screen: 'BookingDetailScreen', initial: false, params: { bookingId } })} accessibilityRole="button" accessibilityLabel={t('a11yViewBooking', 'View Booking')}>
                <Text style={styles.viewBookingText}>{t('viewBookingText', 'View Booking')}</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {isFeatureEnabled('ENABLE_VOICE_CALL') && (
            <TouchableOpacity style={styles.callBtn} onPress={handleCall} accessibilityRole="button" accessibilityLabel={t('a11yCall', 'Call')}>
              <Icon name="phone" size={20} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.moreBtn} onPress={() => setOptionsMenuVisible(true)} accessibilityRole="button" accessibilityLabel={t('a11yMoreOptions', 'More options')}>
            <Icon name="dots-vertical" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Safety Banner */}
        <View style={styles.safetyBanner}>
          <Icon name="shield-lock" size={16} color={theme.colors.warning} />
          <Text style={styles.safetyText}>{t('keepAllPaymentsOnThe', 'Keep all payments on the app. Do not share personal phone numbers.')}</Text>
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

        {messages.map((msg) => {
          if (msg.type === 'system') {
            return (
              <View key={msg.id} style={styles.systemBubble}>
                <Text style={styles.systemText}>{msg.text}</Text>
                <Text style={styles.systemTime}>{msg.time}</Text>
              </View>
            );
          }

          const isMe = msg.sender === 'me';
          return (
            <View key={msg.id} style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowThem]}>
              <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                <Text style={[styles.bubbleText, isMe && { color: theme.colors.background }]}>{msg.text}</Text>
                <Text style={[styles.msgTime, isMe && { color: 'rgba(0,0,0,0.5)' }]}>{msg.time}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* ── Input Area is now a separate component ── */}
      <ChatInputBar onSend={handleSend} />

      {/* ── Polished Options Menu (Bottom Sheet) ── */}
      <Modal
        visible={isOptionsMenuVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setOptionsMenuVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setOptionsMenuVisible(false)} accessibilityRole="button" accessibilityLabel={t('a11yCloseOptionsMenu', 'Close options menu')}
        >
          <View style={styles.optionsSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{t('sheetTitle', 'Chat Options')}</Text>
            
            <View style={styles.optionsList}>
              <TouchableOpacity 
                style={styles.optionItem} 
                onPress={() => { 
                  setOptionsMenuVisible(false); 
                  navigation.navigate('CompanionProfileScreen', { companionId }); 
                }} accessibilityRole="button" accessibilityLabel={t('a11yViewProfile', 'View Profile')}
              >
                <Icon name="account-outline" size={24} color={theme.colors.textPrimary} style={styles.optionIcon} />
                <Text style={styles.optionText}>{t('optionProfile', 'View Profile')}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.optionItem} 
                onPress={() => { 
                  setOptionsMenuVisible(false); 
                  Alert.alert(t('alertTitleNotificationsmu', 'Notifications muted for this chat.')); 
                }} accessibilityRole="button" accessibilityLabel={t('a11yMuteNotifications', 'Mute Notifications')}
              >
                <Icon name="bell-off-outline" size={24} color={theme.colors.textPrimary} style={styles.optionIcon} />
                <Text style={styles.optionText}>{t('optionMute', 'Mute Notifications')}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.optionItem} 
                onPress={() => { 
                  setOptionsMenuVisible(false); 
                  setMessages([{ id: 'sys1', type: 'system', text: t('sysMsg.bookingAccepted', 'Booking Accepted! You can now chat securely.'), time: '11:30 AM' }]); 
                }} accessibilityRole="button" accessibilityLabel={t('a11yClearChat', 'Clear Chat')}
              >
                <Icon name="delete-outline" size={24} color={theme.colors.textPrimary} style={styles.optionIcon} />
                <Text style={styles.optionText}>{t('optionClear', 'Clear Chat')}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.optionItem, { borderBottomWidth: 0, marginTop: 12 }]} 
                onPress={() => { 
                  setOptionsMenuVisible(false); 
                  // If we have an IncidentReport screen we can navigate there, or mock it:
                  Alert.alert(t('alertTitleOurSafetyTeamha', 'Our Safety Team has been notified. We take your safety seriously.')); 
                }} accessibilityRole="button" accessibilityLabel={t('a11yReportSafetyIssue', 'Report Safety Issue')}
              >
                <Icon name="shield-alert-outline" size={24} color={theme.colors.error} style={styles.optionIcon} />
                <Text style={[styles.optionText, { color: theme.colors.error, fontWeight: 'bold' }]}>{t('optionReport', 'Report Safety Issue')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

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
  avatarBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(212,175,55,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.primary },
  avatarInitials: { color: theme.colors.primary, fontWeight: 'bold', fontSize: 16 },
  onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: theme.colors.success, borderWidth: 2, borderColor: theme.colors.surface },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: theme.colors.textPrimary },
  viewBookingText: { fontSize: 12, color: theme.colors.primary, marginTop: 2, fontWeight: '600' },
  
  callBtn: { padding: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, marginRight: 8 },
  moreBtn: { padding: 8 },

  safetyBanner: { flexDirection: 'row', backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: 12, alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(245, 158, 11, 0.2)' },
  safetyText: { flex: 1, color: theme.colors.warning, fontSize: 12, lineHeight: 18 },

  chatArea: { padding: 16, paddingBottom: 24 },
  
  dateChip: { alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 24 },
  dateText: { color: theme.colors.textSecondary, fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },

  systemBubble: { alignSelf: 'center', backgroundColor: 'rgba(212, 175, 55, 0.1)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, marginBottom: 20, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.primary },
  systemText: { color: theme.colors.primary, fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
  systemTime: { color: theme.colors.textSecondary, fontSize: 10, marginTop: 4 },

  messageRow: { flexDirection: 'row', marginBottom: 16 },
  messageRowMe: { justifyContent: 'flex-end' },
  messageRowThem: { justifyContent: 'flex-start', maxWidth: '85%' },
  
  bubble: { maxWidth: '80%', padding: 14, borderRadius: 20 },
  bubbleMe: { backgroundColor: theme.colors.primary, borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: theme.colors.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: theme.colors.border },
  
  bubbleText: { color: theme.colors.textPrimary, fontSize: 15, lineHeight: 22 },
  msgTime: { color: theme.colors.textSecondary, fontSize: 10, marginTop: 6, alignSelf: 'flex-end' },

  // Options Menu Specific
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  optionsSheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2, 
    backgroundColor: theme.colors.border, 
    alignSelf: 'center', marginBottom: 16
  },
  sheetTitle: {
    fontSize: 16, fontWeight: 'bold', 
    color: theme.colors.textPrimary, 
    marginBottom: 24, textAlign: 'center'
  },
  optionsList: {
    marginTop: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  optionIcon: {
    width: 32,
  },
  optionText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
});
