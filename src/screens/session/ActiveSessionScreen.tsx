import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Animated, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { sessionApi } from '../../services/api';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export const ActiveSessionScreen = () => { 
  const { t } = useTranslation('session.active');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<any>();
  const [sessionData, setSessionData] = useState<any>(null);
  const companionId = route.params?.companionId || sessionData?.companionId;
  const companionName = route.params?.companionName || sessionData?.companionName || 'Companion';
  const [etiquetteVisible, setEtiquetteVisible] = useState(true);
  
  // Timer State (e.g. 2 hours = 7200 seconds default)
  const [totalSeconds, setTotalSeconds] = useState(7200);
  const [timeLeft, setTimeLeft] = useState(7200);

  // Modals
  const [extendModalVisible, setExtendModalVisible] = useState(false);
  const [selectedExtension, setSelectedExtension] = useState<30 | 60>(60);
  const [endEarlyModalVisible, setEndEarlyModalVisible] = useState(false);
  const [bookingDetailsModalVisible, setBookingDetailsModalVisible] = useState(false);
  
  // Pulse Animation for LIVE badge
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Fetch live session from backend
    sessionApi.getCurrentSession().then((sess) => {
      if (sess) {
        setSessionData(sess);
        const durationSec = (sess.durationMinutes || 120) * 60;
        setTotalSeconds(durationSec);
        if (sess.startedAt) {
          const elapsedSec = Math.floor((Date.now() - new Date(sess.startedAt).getTime()) / 1000);
          const remaining = Math.max(0, durationSec - elapsedSec);
          setTimeLeft(remaining);
        }
      }
    }).catch(() => {});

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.2, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
      ])
    ).start();

    // Countdown Timer
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [pulseAnim]);

  // Format Time
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercentage = totalSeconds > 0 ? ((totalSeconds - timeLeft) / totalSeconds) * 100 : 0;

  const handleEndEarly = async () => {
    setEndEarlyModalVisible(false);
    try {
      const current = await sessionApi.getCurrentSession();
      if (current?.id) {
        await sessionApi.endSession(current.id);
      }
    } catch {
      // Graceful fallback
    } finally {
      navigation.navigate('SessionCompleteScreen', { companionId, companionName });
    }
  };

  const handleConfirmExtension = async () => {
    setTimeLeft(prev => prev + (selectedExtension * 60));
    setExtendModalVisible(false);
    try {
      const current = await sessionApi.getCurrentSession();
      if (current?.id) {
        await sessionApi.extendSession(current.id, selectedExtension);
      }
    } catch {
      // Graceful fallback
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      {/* Urgent Header */}
      <View style={styles.header}>
        <View style={styles.liveBadge}>
          <Animated.View style={[styles.liveDot, { opacity: pulseAnim }]} />
          <Text style={styles.liveText}>{t('liveSession', 'LIVE SESSION')}</Text>
        </View>
        <TouchableOpacity style={styles.sosBtn} onPress={() => navigation.navigate('SafetySupportStack', { screen: 'SafetyHubScreen' })} accessibilityRole="button" accessibilityLabel={t('a11ySosEmergency', 'SOS / EMERGENCY')}>
          <Icon name="shield-half-full" size={18} color={theme.colors.background} />
          <Text style={styles.sosBtnText}>{t('sosEmergency', 'SOS / EMERGENCY')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Etiquette Reminder */}
        {etiquetteVisible && (
          <View style={styles.etiquetteCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon name="information" size={18} color={theme.colors.primary} />
                <Text style={styles.etiquetteTitle}>{t('etiquetteReminder', 'Etiquette Reminder')}</Text>
              </View>
              <TouchableOpacity onPress={() => setEtiquetteVisible(false)} accessibilityRole="button" accessibilityLabel={t('a11yClose', 'Close')}>
                <Icon name="close" size={18} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.etiquetteDesc}>{t('pleaseRemainInPublicSpaces', 'Please remain in public spaces at all times. Treat your companion with absolute respect. CoBuddy has a strict zero-tolerance policy for harassment.')}</Text>
          </View>
        )}

        {/* Live Timer Card */}
        <View style={styles.timerCard}>
          <Text style={styles.timerSub}>{t('timeRemainingLabel', 'Time Remaining')}</Text>
          <Text style={styles.timerMain}>{formatTime(timeLeft)}</Text>
          
          <View style={styles.timerProgressBg}>
            <View style={[styles.timerProgressFill, { width: `${progressPercentage}%` }]} />
          </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 8 }}>
            <Text style={styles.timerLimitText}>{t('mockStarted', 'Started: 7:00 PM')}</Text>
            <Text style={styles.timerLimitText}>{t('mockEnds', 'Ends: 9:00 PM')}</Text>
          </View>
        </View>

        {/* Companion Snapshot */}
        <View style={styles.companionCard}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitials}>{(companionName || 'Elena Vasquez').charAt(0)}</Text>
          </View>
          <View style={{ flex: 1, paddingLeft: 12 }}>
            <Text style={styles.companionName} numberOfLines={1}>{companionName || 'Elena Vasquez'}</Text>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }} accessibilityRole="button" accessibilityLabel={t('a11yViewFullProfile', 'View Full Profile')}>
              <Text style={{ color: theme.colors.primary, fontSize: 13, fontWeight: 'bold' }}>{t('viewFullProfile', 'View Full Profile')}</Text>
              <Icon name="chevron-right" size={14} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={styles.circleBtn} accessibilityRole="button" accessibilityLabel={t('a11yCall', 'Call')}>
              <Icon name="phone" size={18} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.circleBtn} accessibilityRole="button" accessibilityLabel={t('a11yChat', 'Chat')}>
              <Icon name="chat" size={18} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* View Details Link */}
        <TouchableOpacity style={styles.detailsBtn} onPress={() => setBookingDetailsModalVisible(true)} accessibilityRole="button" accessibilityLabel={t('a11yViewBookingDetails', 'View Booking Details')}>
          <Icon name="file-document-outline" size={18} color={theme.colors.textSecondary} />
          <Text style={styles.detailsText}>{t('viewBookingDetails', 'View Booking Details')}</Text>
          <Icon name="chevron-right" size={16} color={theme.colors.textSecondary} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

        {/* Action Controls */}
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => setExtendModalVisible(true)} accessibilityRole="button" accessibilityLabel={t('a11yAdd', 'Add')}>
            <Icon name="clock-plus-outline" size={24} color={theme.colors.background} />
            <Text style={styles.actionBtnPrimaryText}>{t('extendSession', 'Extend Session')}</Text>
            <Text style={styles.actionBtnPrimarySub}>{t('addMoreTime', 'Add more time')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionBtnSecondary} onPress={() => setEndEarlyModalVisible(true)} accessibilityRole="button" accessibilityLabel={t('a11yClockRemoveOutline', 'clock remove outline')}>
            <Icon name="clock-remove-outline" size={24} color={theme.colors.error} />
            <Text style={styles.actionBtnSecondaryText}>{t('endEarly', 'End Early')}</Text>
            <Text style={styles.actionBtnSecondarySub}>{t('proRataCharges', 'Pro-rata charges')}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* EXTEND SESSION MODAL */}
      <Modal visible={extendModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('extendSession', 'Extend Session')}</Text>
              <TouchableOpacity onPress={() => setExtendModalVisible(false)} style={styles.modalCloseBtn} accessibilityRole="button" accessibilityLabel={t('a11yClose', 'Close')}>
                <Icon name="close" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDesc}>{t('extendModalDesc', 'How much longer would you like to extend this session?')}</Text>
            
            <View style={{ gap: 12, marginBottom: 24 }}>
              <TouchableOpacity 
                style={[styles.extensionOption, selectedExtension === 30 && { borderColor: theme.colors.primary, backgroundColor: 'rgba(212,175,55,0.1)' }]}
                onPress={() => setSelectedExtension(30)} accessibilityRole="button" accessibilityLabel={t('a11y30Mins750', '+ 30 Mins ₹750')}
              >
                <Text style={[styles.extensionTime, selectedExtension === 30 && { color: theme.colors.primary }]}>{t('plus30Mins', '+ 30 Mins')}</Text>
                <Text style={[styles.extensionPrice, selectedExtension === 30 && { color: theme.colors.primary }]}>₹750</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.extensionOption, selectedExtension === 60 && { borderColor: theme.colors.primary, backgroundColor: 'rgba(212,175,55,0.1)' }]}
                onPress={() => setSelectedExtension(60)} accessibilityRole="button" accessibilityLabel={t('a11y1Hour1500', '+ 1 Hour ₹1,500')}
              >
                <Text style={[styles.extensionTime, selectedExtension === 60 && { color: theme.colors.primary }]}>{t('plus1Hour', '+ 1 Hour')}</Text>
                <Text style={[styles.extensionPrice, selectedExtension === 60 && { color: theme.colors.primary }]}>₹1,500</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleConfirmExtension} accessibilityRole="button" accessibilityLabel={t('a11yConfirmExtension', 'Confirm session extension')}>
              <Text style={styles.primaryBtnText}>{t('confirmExtensionPrice', 'Confirm Extension (₹{{amount}})', { amount: selectedExtension === 30 ? '750' : '1,500' })}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* END EARLY MODAL */}
      <Modal visible={endEarlyModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.error }]}>{t('endSessionEarly', 'End Session Early?')}</Text>
              <TouchableOpacity onPress={() => setEndEarlyModalVisible(false)} style={styles.modalCloseBtn} accessibilityRole="button" accessibilityLabel={t('a11yClose', 'Close')}>
                <Icon name="close" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.warningBox}>
              <Icon name="alert-circle-outline" size={20} color={theme.colors.warning} />
              <Text style={styles.warningBoxText}>{t('endingNowWillReleaseEscrow', 'Ending now will release escrow funds based on our Pro-Rata Policy.')}</Text>
            </View>

            <View style={{ gap: 8, marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: theme.colors.textSecondary }}>{t('timeCompleted', 'Time completed')}</Text>
                <Text style={{ color: theme.colors.textPrimary, fontWeight: 'bold' }}>{t('mockTimeCompleted', '1 hr 15 mins')}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: theme.colors.textSecondary }}>{t('escrowReleased', 'Escrow to be released')}</Text>
                <Text style={{ color: theme.colors.textPrimary, fontWeight: 'bold' }}>₹1,875</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: theme.colors.textSecondary }}>{t('refundToYou', 'Refund to you')}</Text>
                <Text style={{ color: theme.colors.success, fontWeight: 'bold' }}>₹1,125</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.primaryBtn, { backgroundColor: theme.colors.error }]} 
              onPress={handleEndEarly} accessibilityRole="button" accessibilityLabel={t('a11yConfirmEndSession', 'Confirm & End Session')}
            >
              <Text style={styles.primaryBtnText}>{t('confirmEndSession', 'Confirm & End Session')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={{ marginTop: 16, alignItems: 'center' }} onPress={() => setEndEarlyModalVisible(false)} accessibilityRole="button" accessibilityLabel={t('a11yKeepSessionActive', 'Keep Session Active')}>
              <Text style={{ color: theme.colors.textSecondary, fontWeight: 'bold' }}>{t('keepSessionActive', 'Keep Session Active')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* BOOKING DETAILS MODAL */}
      <Modal visible={bookingDetailsModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('bookingDetails', 'Booking Details')}</Text>
              <TouchableOpacity onPress={() => setBookingDetailsModalVisible(false)} style={styles.modalCloseBtn} accessibilityRole="button" accessibilityLabel={t('a11yClose', 'Close')}>
                <Icon name="close" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={{ gap: 16, marginBottom: 24 }}>
              <View>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 12, textTransform: 'uppercase', marginBottom: 4 }}>{t('activityLabel', 'Activity')}</Text>
                <Text style={{ color: theme.colors.textPrimary, fontSize: 15, fontWeight: 'bold' }}>{t('mockActivity', 'Fine Dining & Drinks')}</Text>
              </View>
              
              <View>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 12, textTransform: 'uppercase', marginBottom: 4 }}>{t('dateTimeLabel', 'Date & Time')}</Text>
                <Text style={{ color: theme.colors.textPrimary, fontSize: 15, fontWeight: 'bold' }}>{t('mockDateTime', 'Today, 7:00 PM - 9:00 PM')}</Text>
              </View>

              <View>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 12, textTransform: 'uppercase', marginBottom: 4 }}>{t('specialNoteLabel', 'Your Special Note')}</Text>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border }}>
                  <Text style={{ color: theme.colors.textPrimary, fontSize: 14, fontStyle: 'italic' }}>{t('iPreferSittingNearThe', '"I prefer sitting near the window. Please wear smart casuals."')}</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={() => setBookingDetailsModalVisible(false)} accessibilityRole="button" accessibilityLabel={t('a11yBackToSession', 'Back to Session')}>
              <Text style={styles.primaryBtnText}>{t('backToSession', 'Back to Session')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={styles.primaryBtn} 
          onPress={() => navigation.navigate('SessionCompleteScreen', { companionId, companionName })} accessibilityRole="button" accessibilityLabel={t('a11yMockTimesUpAutoEnd', "[MOCK] Time's Up / Auto End")}
        >
          <Text style={styles.primaryBtnText}>{t('mockTimesUp', "[MOCK] Time's Up / Auto End")}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.success },
  liveText: { color: theme.colors.success, fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  
  sosBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.error, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, gap: 6, shadowColor: theme.colors.error, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  sosBtnText: { color: theme.colors.background, fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  
  content: { padding: 20, gap: 24, paddingBottom: 40 },
  
  etiquetteCard: { backgroundColor: 'rgba(212, 175, 55, 0.1)', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.primary },
  etiquetteTitle: { fontSize: 14, fontWeight: 'bold', color: theme.colors.primary },
  etiquetteDesc: { fontSize: 13, color: theme.colors.textSecondary, lineHeight: 20 },

  timerCard: { alignItems: 'center', padding: 32, backgroundColor: theme.colors.surface, borderRadius: 24, borderWidth: 1, borderColor: theme.colors.border },
  timerSub: { fontSize: 14, color: theme.colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  timerMain: { fontSize: 48, fontWeight: '900', color: theme.colors.textPrimary, fontVariant: ['tabular-nums'], letterSpacing: 2, marginBottom: 24 },
  timerProgressBg: { width: '100%', height: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' },
  timerProgressFill: { height: '100%', backgroundColor: theme.colors.primary, borderRadius: 4 },
  timerLimitText: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: '500' },

  companionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.primary },
  avatarInitials: { color: theme.colors.primary, fontSize: 18, fontWeight: 'bold' },
  companionName: { fontSize: 15, fontWeight: 'bold', color: theme.colors.textPrimary },
  circleBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },

  detailsBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, gap: 12 },
  detailsText: { fontSize: 14, color: theme.colors.textSecondary, fontWeight: '500' },

  actionGrid: { flexDirection: 'row', gap: 16 },
  actionBtnPrimary: { flex: 1, backgroundColor: theme.colors.primary, padding: 20, borderRadius: 20, alignItems: 'center', gap: 8 },
  actionBtnPrimaryText: { fontSize: 15, fontWeight: 'bold', color: theme.colors.background },
  actionBtnPrimarySub: { fontSize: 11, color: theme.colors.background, opacity: 0.8 },
  
  actionBtnSecondary: { flex: 1, backgroundColor: 'rgba(239, 68, 68, 0.05)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)', padding: 20, borderRadius: 20, alignItems: 'center', gap: 8 },
  actionBtnSecondaryText: { fontSize: 15, fontWeight: 'bold', color: theme.colors.error },
  actionBtnSecondarySub: { fontSize: 11, color: theme.colors.error, opacity: 0.8 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: theme.colors.textPrimary },
  modalCloseBtn: { padding: 4 },
  modalDesc: { color: theme.colors.textSecondary, fontSize: 14, marginBottom: 24, lineHeight: 22 },
  
  extensionOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.background },
  extensionTime: { fontSize: 16, fontWeight: 'bold', color: theme.colors.textPrimary },
  extensionPrice: { fontSize: 16, fontWeight: 'bold', color: theme.colors.textPrimary },

  warningBox: { flexDirection: 'row', backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: 16, borderRadius: 12, gap: 12, marginBottom: 24 },
  warningBoxText: { flex: 1, color: theme.colors.warning, fontSize: 13, lineHeight: 20 },

  bottomBar: { padding: 20, paddingBottom: 32, backgroundColor: theme.colors.surface, borderTopWidth: 1, borderTopColor: theme.colors.border },
  primaryBtn: { width: '100%', backgroundColor: theme.colors.primary, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: theme.colors.background, fontSize: 15, fontWeight: 'bold' },
});
