import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { MOCK_BLOCKED_USERS } from '../../services/mock';
import { accountApi } from '../../services/api';

export const BlockedUsersScreen = () => { 
  const { t } = useTranslation('settings.blockedUsers');
  const { smartGoBack } = useSmartNavigation();
  const [blockedUsers, setBlockedUsers] = useState(MOCK_BLOCKED_USERS);

  React.useEffect(() => {
    let isMounted = true;
    accountApi.getBlockedUsers().then(list => {
      if (isMounted && list && list.length > 0) {
        setBlockedUsers(list.map(u => ({
          id: u.id,
          name: u.name,
          date: u.blockedAt ? new Date(u.blockedAt).toLocaleDateString() : 'Recently',
        })));
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const handleUnblock = (user: typeof MOCK_BLOCKED_USERS[0]) => {
    Alert.alert(
      t('unblockTitle', 'Unblock User'),
      t('unblockMessage', 'Are you sure you want to unblock {{name}}? They will be able to message you and view your profile again.', { name: user.name }),
      [
        { text: t('cancelBtn', 'Cancel'), style: "cancel" },
        { 
          text: t('unblockBtn', 'Unblock'), 
          style: "destructive",
          onPress: async () => {
            setBlockedUsers(prev => prev.filter(u => u.id !== user.id));
            try {
              await accountApi.unblockUser(user.id);
            } catch {
              // Ignored
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => smartGoBack()} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={t('a11yGoBack', 'Go back')}>
          <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('blockedUsersHeader', 'Blocked Users')}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.infoBox}>
            <Icon name="information-outline" size={20} color={theme.colors.textSecondary} style={{marginTop: 2}} />
            <Text style={styles.infoText}>{t('blockedUsersCannotSendYou', 'Blocked users cannot send you messages, request bookings, or view your profile. They won\'t be notified that you blocked them.')}</Text>
        </View>

        {blockedUsers.length > 0 ? (
            <View style={styles.listContainer}>
                {blockedUsers.map((user, index) => (
                    <View key={user.id} style={[styles.userCard, index > 0 && styles.userCardBorder]}>
                        <View style={styles.userInfo}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
                            </View>
                            <View>
                                <Text style={styles.userName}>{user.name}</Text>
                                <Text style={styles.blockDate}>{user.date}</Text>
                            </View>
                        </View>
                        <TouchableOpacity 
                            style={styles.unblockBtn}
                            activeOpacity={0.7}
                            onPress={() => handleUnblock(user)} accessibilityRole="button" accessibilityLabel={t('a11yUnblock', 'Unblock')}
                        >
                            <Text style={styles.unblockText}>{t('unblock', 'Unblock')}</Text>
                        </TouchableOpacity>
                    </View>
                ))}
            </View>
        ) : (
            <View style={styles.emptyState}>
                <View style={styles.emptyIconWrap}>
                    <Icon name="shield-check" size={48} color={theme.colors.success} />
                </View>
                <Text style={styles.emptyTitle}>{t('emptyTitle', 'No Blocked Users')}</Text>
                <Text style={styles.emptySub}>{t('youHaventBlockedAnyoneYet', 'You haven\'t blocked anyone yet. When you block a user, they will appear here.')}</Text>
            </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.textPrimary },
  
  scrollContent: { padding: 16, paddingBottom: 40 },
  
  infoBox: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 12, marginBottom: 24, gap: 12 },
  infoText: { flex: 1, fontSize: 13, color: theme.colors.textSecondary, lineHeight: 20 },

  listContainer: { backgroundColor: theme.colors.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden' },
  userCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  userCardBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border },
  userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 16 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(212,175,55,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: theme.colors.primary },
  userName: { fontSize: 16, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 4 },
  blockDate: { fontSize: 12, color: theme.colors.textSecondary },

  unblockBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)' },
  unblockText: { fontSize: 13, fontWeight: 'bold', color: theme.colors.textPrimary },

  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60, paddingHorizontal: 20 },
  emptyIconWrap: { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(16, 185, 129, 0.08)', justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)' },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 12 },
  emptySub: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 22 }
});
