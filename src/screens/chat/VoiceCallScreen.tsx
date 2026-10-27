import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { RootStackParamList } from '../../types/navigation';

export const VoiceCallScreen = () => { 
  const { t } = useTranslation('chat.voiceCall');
  const { smartGoBack } = useSmartNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'VoiceCallScreen'>>();
  const companionName = route.params?.companionName || 'Companion';

  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    smartGoBack();
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <View style={styles.topSection}>
        <View style={styles.secureBadge}>
          <Icon name="shield-lock" size={12} color={theme.colors.success} />
          <Text style={styles.secureText}>{t('secureText', 'End-to-End Encrypted')}</Text>
        </View>
        <Text style={styles.callerName}>{companionName}</Text>
        <Text style={styles.durationText}>{formatDuration(callDuration)}</Text>
      </View>

      <View style={styles.middleSection}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarInitials}>{companionName.charAt(0)}</Text>
        </View>
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.controlsGrid}>
          
          <TouchableOpacity 
            style={[styles.controlBtn, isMuted && styles.controlBtnActive]} 
            onPress={() => setIsMuted(!isMuted)} accessibilityRole="button" accessibilityLabel={t('a11yMute', 'Mute')}
          >
            <Icon name={isMuted ? "microphone-off" : "microphone"} size={28} color={isMuted ? theme.colors.background : theme.colors.textPrimary} />
            <Text style={[styles.controlLabel, isMuted && { color: theme.colors.background }]}>{t('controlMute', 'Mute')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlBtn} accessibilityRole="button" accessibilityLabel={t('a11yKeypad', 'Keypad')}>
            <Icon name="dialpad" size={28} color={theme.colors.textPrimary} />
            <Text style={styles.controlLabel}>{t('controlKeypad', 'Keypad')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.controlBtn, isSpeaker && styles.controlBtnActive]} 
            onPress={() => setIsSpeaker(!isSpeaker)} accessibilityRole="button" accessibilityLabel={t('a11ySpeaker', 'Speaker')}
          >
            <Icon name={isSpeaker ? "volume-high" : "volume-medium"} size={28} color={isSpeaker ? theme.colors.background : theme.colors.textPrimary} />
            <Text style={[styles.controlLabel, isSpeaker && { color: theme.colors.background }]}>{t('controlSpeaker', 'Speaker')}</Text>
          </TouchableOpacity>

        </View>

        <TouchableOpacity style={styles.endCallBtn} onPress={handleEndCall} accessibilityRole="button" accessibilityLabel={t('a11yPhoneHangup', 'Phone Hangup')}>
          <Icon name="phone-hangup" size={32} color={theme.colors.background} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000', justifyContent: 'space-between', paddingVertical: 40 },
  
  topSection: { alignItems: 'center', marginTop: 40 },
  secureBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 6, marginBottom: 24 },
  secureText: { fontSize: 11, color: theme.colors.success, fontWeight: 'bold' },
  callerName: { fontSize: 28, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 8 },
  durationText: { fontSize: 16, color: theme.colors.textSecondary, fontVariant: ['tabular-nums'] },
  
  middleSection: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  avatarContainer: { width: 140, height: 140, borderRadius: 70, backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  avatarInitials: { fontSize: 56, fontWeight: 'bold', color: theme.colors.primary },

  bottomSection: { alignItems: 'center', paddingBottom: 40, width: '100%' },
  
  controlsGrid: { flexDirection: 'row', justifyContent: 'center', gap: 32, marginBottom: 60 },
  controlBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  controlBtnActive: { backgroundColor: theme.colors.textPrimary, borderColor: theme.colors.textPrimary },
  controlLabel: { fontSize: 10, color: theme.colors.textSecondary, marginTop: 4, fontWeight: '600' },
  
  endCallBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: theme.colors.error, justifyContent: 'center', alignItems: 'center', shadowColor: theme.colors.error, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
});
