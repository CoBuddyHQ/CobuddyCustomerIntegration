import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';


export const IncomingCallScreen = () => { 
  const { t } = useTranslation('chat.incomingCall');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { smartGoBack } = useSmartNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'IncomingCallScreen'>>();
  const callerName = route.params?.callerName || 'Companion';

  // Pulse animation for the caller avatar
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
      ])
    ).start();
  }, [pulseAnim]);

  const handleAccept = () => {
    navigation.replace('VoiceCallScreen', { companionName: callerName });
  };

  const handleDecline = () => {
    smartGoBack();
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <View style={styles.topSection}>
        <Text style={styles.incomingText}>{t('incomingText', 'CoBuddy Voice Call')}</Text>
        <Text style={styles.callerName}>{callerName}</Text>
        <Text style={styles.statusText}>{t('statusText', 'Ringing...')}</Text>
      </View>

      <View style={styles.middleSection}>
        <Animated.View style={[styles.avatarPulse, { transform: [{ scale: pulseAnim }] }]} />
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarInitials}>{callerName.charAt(0)}</Text>
        </View>
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.declineBtn} onPress={handleDecline} accessibilityRole="button" accessibilityLabel={t('a11yPhoneHangup', 'Phone Hangup')}>
            <Icon name="phone-hangup" size={32} color={theme.colors.background} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept} accessibilityRole="button" accessibilityLabel={t('a11yCall', 'Call')}>
            <Icon name="phone" size={32} color={theme.colors.background} />
          </TouchableOpacity>
        </View>
        <Text style={styles.secureNotice}>
          <Icon name="lock" size={12} color={theme.colors.textSecondary} /> {t('secureCallNotice', 'Calls are secured and masked by CoBuddy.')}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000', justifyContent: 'space-between', paddingVertical: 40 },
  
  topSection: { alignItems: 'center', marginTop: 60 },
  incomingText: { fontSize: 14, color: theme.colors.textSecondary, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 },
  callerName: { fontSize: 32, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 8 },
  statusText: { fontSize: 16, color: theme.colors.primary },
  
  middleSection: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  avatarPulse: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(212,175,55,0.2)' },
  avatarContainer: { width: 120, height: 120, borderRadius: 60, backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: theme.colors.primary, zIndex: 10 },
  avatarInitials: { fontSize: 48, fontWeight: 'bold', color: theme.colors.primary },

  bottomSection: { alignItems: 'center', paddingBottom: 40 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', paddingHorizontal: 40, marginBottom: 40 },
  
  declineBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: theme.colors.error, justifyContent: 'center', alignItems: 'center', shadowColor: theme.colors.error, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
  acceptBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: theme.colors.success, justifyContent: 'center', alignItems: 'center', shadowColor: theme.colors.success, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
  
  secureNotice: { fontSize: 12, color: theme.colors.textSecondary },
});
