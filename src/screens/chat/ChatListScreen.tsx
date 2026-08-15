import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { MOCK_CHAT_LIST } from '../../services/mock';
import { chatApi, Conversation } from '../../services/api';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Define the exact colors to match the luxury theme
const Colors = {
  background: theme.colors.background,
  surface: theme.colors.surface,
  primary: theme.colors.primary,
  textPrimary: theme.colors.textPrimary,
  textSecondary: theme.colors.textSecondary,
  success: theme.colors.success,
  border: theme.colors.border,
  goldDim: 'rgba(212,175,55,0.1)',
};

export const ChatListScreen = () => { 
  const { t } = useTranslation('chat.list');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const activeBookings = [
    { id: 'CB-REQ-9401', name: 'Kabir Singh', role: 'Event Companion', online: true, companionId: 'c6' },
    { id: 'CB-REQ-9402', name: 'Sneha Verma', role: 'Local Guide', online: false, companionId: 'c7' },
  ];

  React.useEffect(() => {
    let isMounted = true;
    chatApi.listConversations().then(list => {
      if (isMounted && list && list.length > 0) {
        setConversations(list);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const displayChats = conversations.length > 0
    ? conversations.map(c => ({
        id: c.id,
        name: c.companionName || 'Companion',
        companionId: c.companionId || 'c1',
        lastMessage: c.lastMessage || 'Tap to chat',
        time: c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now',
        unread: c.unreadCount || 0,
        isOnline: true,
        isTyping: false,
        readReceipt: 'read',
      }))
    : MOCK_CHAT_LIST;



  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* ── Polished Theme Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('headerTitle', 'Messages')}</Text>
        <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.7} onPress={() => setShowNewMessageModal(true)} accessibilityRole="button" accessibilityLabel={t('a11yEdit', 'Edit')}>
          <Icon name="square-edit-outline" size={24} color={Colors.textPrimary} />
          {/* Ye dot tab dikhega jab koi naya notification/message compose action pending ho, ya isko hata bhi sakte hain */}
          {/* <View style={styles.headerNotifDot} /> */}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* ── Live Support Card (Pinned Concierge) ── */}
        <View style={styles.liveCardShadow}>
          <View style={styles.liveCard}>
            <View style={styles.liveCardGlow} />
            
            <View style={styles.liveCardTop}>
              <View style={styles.liveIconWrap}>
                <Icon name="shield-star" size={26} color={Colors.primary} />
              </View>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveBadgeText}>{t('liveBadgeText', 'Online Now')}</Text>
              </View>
            </View>

            <Text style={styles.liveCardTitle}>{t('liveCardTitle', 'CoBuddy Concierge')}</Text>
            <Text style={styles.liveCardSub}>{t('connectWithADedicatedSpecialist', 'Connect with a dedicated specialist for immediate 24/7 assistance.')}</Text>

            <TouchableOpacity
              style={styles.startBtn}
              onPress={() => navigation.navigate('ConciergeChatScreen')}
              activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={t('a11yStartConversation', 'Start Conversation')}>
              <Icon name="message-text" size={18} color={Colors.background} />
              <Text style={styles.startBtnText}>{t('startBtnText', 'Start Conversation')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{height: 24}} />

        {/* ── Active Conversations List ── */}
        <View style={styles.convoHeader}>
          <Text style={styles.convoHeaderLabel}>{t('convoHeaderLabel', 'ACTIVE CONVERSATIONS')}</Text>
        </View>

        {displayChats.map((chat, index) => (
          <React.Fragment key={chat.id}>
            <TouchableOpacity
              style={styles.convoItem}
              onPress={() => navigation.navigate('CompanionChatScreen', { companionName: chat.name, bookingId: chat.id, companionId: chat.companionId })}
              activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={t('a11yGoToCompanionchat', 'Go to CompanionChat')}>
              
              <View style={styles.convoAvatar}>
                <Text style={styles.convoAvatarText}>{chat.name.charAt(0)}</Text>
                {chat.isOnline && <View style={styles.convoOnlineDot} />}
              </View>

              <View style={styles.convoMeta}>
                <View style={styles.convoMetaRow}>
                  <Text style={[styles.convoName, chat.unread > 0 && {color: Colors.primary}]}>{chat.name}</Text>
                  <Text style={[styles.convoTime, chat.unread > 0 && {color: Colors.primary, fontWeight: 'bold'}]}>{chat.time}</Text>
                </View>
                <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                  <View style={{flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8}}>
                    {/* Read Receipt Icon */}
                    {chat.readReceipt === 'read' && (
                      <Icon name="check-all" size={14} color={Colors.primary} style={{marginRight: 4}} />
                    )}
                    {chat.readReceipt === 'delivered' && (
                      <Icon name="check-all" size={14} color={Colors.textSecondary} style={{marginRight: 4}} />
                    )}
                    {chat.readReceipt === 'sent' && (
                      <Icon name="check" size={14} color={Colors.textSecondary} style={{marginRight: 4}} />
                    )}
                    
                    {chat.isTyping ? (
                      <Text style={[styles.convoPreview, {color: Colors.primary, fontStyle: 'italic'}]}>{t('typing', 'typing...')}</Text>
                    ) : (
                      <Text style={[styles.convoPreview, chat.unread > 0 && {color: Colors.textPrimary, opacity: 1, fontWeight: '500'}]} numberOfLines={1}>
                        {chat.lastMessage}
                      </Text>
                    )}
                  </View>

                  {chat.unread > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{chat.unread}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
            
            {/* Divider between chats */}
            {index < MOCK_CHAT_LIST.length - 1 && <View style={styles.chatDivider} />}
          </React.Fragment>
        ))}

        {MOCK_CHAT_LIST.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="message-text-outline" size={48} color={Colors.border} />
            <Text style={styles.emptyTitle}>{t('emptyTitle', 'No active chats')}</Text>
            <Text style={styles.emptyDesc}>{t('emptyDesc', 'Once your booking is accepted, you can securely chat with your companion here.')}</Text>
          </View>
        )}

        <View style={{height: 32}} />
      </ScrollView>

      {/* ── New Message Modal ── */}
      <Modal
        visible={showNewMessageModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNewMessageModal(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowNewMessageModal(false)} accessibilityRole="button" accessibilityLabel={t('a11yCloseNewMessageDialog', 'Close new message dialog')}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{t('newMessageTitle', 'New Message')}</Text>
            <Text style={styles.modalSub}>{t('newMessageSub', 'Select an active booking to start a conversation.')}</Text>
            
            {activeBookings.map(bk => (
              <TouchableOpacity 
                key={bk.id} 
                style={styles.newChatOption}
                activeOpacity={0.8}
                onPress={() => {
                  setShowNewMessageModal(false);
                  navigation.navigate('CompanionChatScreen', { companionName: bk.name, bookingId: bk.id, companionId: bk.companionId });
                }} accessibilityRole="button" accessibilityLabel={t('a11yStartChatWith', 'Start chat with {{name}}', { name: bk.name })}
              >
                <View style={styles.newChatAvatar}>
                   <Text style={styles.newChatAvatarText}>{bk.name.charAt(0)}</Text>
                   {bk.online && <View style={styles.newChatOnlineDot} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.newChatName}>{bk.name}</Text>
                  <Text style={styles.newChatRole}>{t(`role.${bk.role.replace(' ', '')}`, bk.role)}</Text>
                </View>
                <Icon name="chevron-right" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},

  // ── Polished App Theme Header ──
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: Colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  headerTitle: {fontSize: 24, fontWeight: 'bold', color: Colors.textPrimary},
  headerIconBtn: {
    padding: 8,
    position: 'relative',
  },
  headerNotifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.error,
    borderWidth: 1.5,
    borderColor: Colors.background,
  },

  scroll: {flex: 1},
  scrollContent: {paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32},

  // ── Live support card (safe shadow/clip split) ──
  liveCardShadow: {
    borderRadius: 24,
    backgroundColor: 'rgba(212,175,55,0.05)',
    shadowColor: Colors.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  liveCard: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primary,
    padding: 20,
    position: 'relative',
    gap: 12,
  },
  liveCardGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.goldDim,
  },
  liveCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveBadge: {flexDirection: 'row', alignItems: 'center', gap: 6},
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  liveBadgeText: {fontSize: 11, letterSpacing: 1, color: Colors.textSecondary, fontWeight: 'bold', textTransform: 'uppercase'},
  liveCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    lineHeight: 28,
  },
  liveCardSub: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  startBtnText: {fontSize: 14, color: Colors.background, fontWeight: 'bold', letterSpacing: 0.5},

  // ── Active conversations ──
  convoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  convoHeaderLabel: {
    fontSize: 12,
    letterSpacing: 1.5,
    color: Colors.textSecondary,
    fontWeight: 'bold',
  },
  chatDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 64, // Align with text
    marginVertical: 4,
  },
  convoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12,
  },
  convoAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  convoAvatarText: {fontSize: 18, fontWeight: 'bold', color: Colors.primary},
  convoOnlineDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  convoMeta: {flex: 1},
  convoMetaRow: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4},
  convoName: {fontSize: 15, fontWeight: 'bold', color: Colors.textPrimary},
  convoTime: {fontSize: 12, color: Colors.textSecondary},
  convoPreview: {fontSize: 13, color: Colors.textSecondary, flex: 1, marginRight: 8},
  
  unreadBadge: {
    backgroundColor: Colors.primary,
    width: 20, height: 20, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center'
  },
  unreadText: {
    color: Colors.background,
    fontSize: 10,
    fontWeight: 'bold',
  },

  // ── Modal Styles ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  modalSub: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  newChatOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  newChatAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(212,175,55,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  newChatAvatarText: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  newChatOnlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  newChatName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  newChatRole: {
    fontSize: 13,
    color: Colors.textSecondary,
  },

  emptyState: {alignItems: 'center', justifyContent: 'center', paddingVertical: 32},
  emptyTitle: {fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary, marginTop: 12, marginBottom: 4},
  emptyDesc: {fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20},
});
