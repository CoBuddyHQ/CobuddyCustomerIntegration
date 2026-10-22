import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Animated, Modal, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { sessionApi } from '../../services/api';
import type { Session } from '../../services/api/session.api';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export const ActiveSessionScreen = () => { 
  const { t } = useTranslation('session.active');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<any>();
  const [sessionData, setSessionData] = useState<Session | null>(null);
  const [sessionLoadState, setSessionLoadState] = useState<'loading' | 'ready' | 'unavailable' | 'error'>('loading');
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [endSessionError, setEndSessionError] = useState(false);
  const companionId = route.params?.companionId || sessionData?.companionId;
  const companionName = route.params?.companionName || sessionData?.companionName || sessionData?.booking?.companionName || 'Unavailable';
  const [etiquetteVisible, setEtiquetteVisible] = useState(true);
  
  // Timer State (in seconds)
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  // Modals & Prompts
  const [extendModalVisible, setExtendModalVisible] = useState(false);
  const [endEarlyModalVisible, setEndEarlyModalVisible] = useState(false);
  const [bookingDetailsModalVisible, setBookingDetailsModalVisible] = useState(false);
  const [timeoutModalVisible, setTimeoutModalVisible] = useState(false);
  
  const timeoutPromptedRef = useRef(false);

  // Pulse Animation for LIVE badge
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let isMounted = true;
    const loadSession = async () => {
      try {
        const session = await sessionApi.getCurrentSession();
        if (!isMounted) return;
        const requestedSessionId = route.params?.sessionId;
        if (requestedSessionId && session?.id !== requestedSessionId) {
          setSessionLoadState('unavailable');
          return;
        }
        const isActive = session && ['active', 'extending'].includes(session.status);
        const startedAt = session?.startedAt ? new Date(session.startedAt) : null;
        const durationMinutes = Number(session?.durationMinutes);
        if (!session || !isActive || !startedAt || !Number.isFinite(startedAt.getTime()) || !Number.isFinite(durationMinutes) || durationMinutes <= 0) {
          setSessionLoadState('unavailable');
          return;
        }

        const durationSeconds = (durationMinutes + Math.max(0, session.extensionMinutes || 0)) * 60;
        const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startedAt.getTime()) / 1000));
        const remainingSeconds = Math.max(0, durationSeconds - elapsedSeconds);
        setSessionData(session);
        setTotalSeconds(durationSeconds);
        setTimeLeft(remainingSeconds);
        setSessionLoadState('ready');
        if (remainingSeconds === 0 && !timeoutPromptedRef.current) {
          timeoutPromptedRef.current = true;
          setTimeoutModalVisible(true);
        }
      } catch {
        if (isMounted) setSessionLoadState('error');
      }
    };
    loadSession();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.2, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
      ])
    ).start();

    return () => { isMounted = false; };
  }, [pulseAnim, route.params?.sessionId]);

  useEffect(() => {
    if (sessionLoadState !== 'ready') return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (!timeoutPromptedRef.current) {
            timeoutPromptedRef.current = true;
            setTimeoutModalVisible(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionLoadState]);

  // Format Time (HH:MM:SS)
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isTimedOut = timeLeft <= 0 && totalSeconds > 0;
  const progressPercentage = totalSeconds > 0 ? Math.min(100, ((totalSeconds - timeLeft) / totalSeconds) * 100) : 0;

  // Real timestamps calculation
  const formatAmPm = (d: Date) => {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  };
  const startDate = sessionData?.startedAt ? new Date(sessionData.startedAt) : new Date(0);
  const endDate = new Date(startDate.getTime() + totalSeconds * 1000);
  const startedLabel = `Started: ${formatAmPm(startDate)}`;
  const endsLabel = isTimedOut ? `Ended: ${formatAmPm(endDate)}` : `Ends: ${formatAmPm(endDate)}`;

  const elapsedSeconds = Math.max(0, totalSeconds - timeLeft);
  const completedMins = Math.max(1, Math.floor(elapsedSeconds / 60));
  const completedHours = Math.floor(completedMins / 60);
  const completedRemMins = completedMins % 60;
  const timeCompletedText = completedHours > 0 ? `${completedHours} hr ${completedRemMins} mins` : `${completedMins} mins`;
  const handleFinishSession = async () => {
    if (!sessionData?.id || isEndingSession) return;
    setIsEndingSession(true);
    setEndSessionError(false);
    try {
      const history = await sessionApi.getSessionHistory();
      const confirmed = history.find((session) => session.id === sessionData.id);
      if (!confirmed || confirmed.status !== 'completed') {
        setEndSessionError(true);
        Alert.alert(
          'Waiting for companion confirmation',
          'The Companion Backend must record session completion. No completion or payment action was performed by this screen. Ask your companion to finish the session, then refresh its status.',
        );
        return;
      }
      setEndEarlyModalVisible(false);
      setTimeoutModalVisible(false);
      navigation.navigate('SessionCompleteScreen', {
        companionId,
        companionName,
        sessionId: confirmed.id,
        sessionStatus: confirmed.status,
      });
    } catch {
      setEndSessionError(true);
      Alert.alert('Session status unavailable', 'The Customer Backend could not confirm session completion. No completion or payment action was performed by this screen.');
    } finally {
      setIsEndingSession(false);
    }
  };

  if (sessionLoadState === 'loading') {
    return (
      <SafeAreaView style={[styles.root, { justifyContent: 'center', alignItems: 'center', gap: 12 }]}>
        <ActivityIndicator color={theme.colors.primary} />
        <Text style={{ color: theme.colors.textSecondary }}>Checking session status…</Text>
      </SafeAreaView>
    );
  }

  if (sessionLoadState !== 'ready' || !sessionData) {
    return (
      <SafeAreaView style={[styles.root, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Icon name="alert-circle-outline" size={52} color={theme.colors.warning} />
        <Text style={[styles.modalTitle, { textAlign: 'center', marginVertical: 12 }]}>Session unavailable</Text>
        <Text style={{ color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 20 }}>
          {sessionLoadState === 'error'
            ? 'The Customer Backend could not confirm an active session. No session timer was started.'
            : 'No active, server-confirmed session was found.'}
        </Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.goBack()} accessibilityRole="button">
          <Text style={styles.primaryBtnText}>Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      {/* Urgent Header */}
      <View style={styles.header}>
        <View style={isTimedOut ? styles.timeoutBadge : styles.liveBadge}>
          <Animated.View style={[isTimedOut ? styles.timeoutDot : styles.liveDot, { opacity: pulseAnim }]} />
          <Text style={isTimedOut ? styles.timeoutText : styles.liveText}>
            {isTimedOut ? t('timeoutSession', 'MEETUP TIME COMPLETE') : t('liveSession', 'LIVE SESSION')}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.sosBtn} 
          onPress={() => navigation.navigate('SafetySupportStack', { screen: 'SafetyHubScreen' })} 
          accessibilityRole="button" 
          accessibilityLabel={t('a11ySosEmergency', 'SOS / EMERGENCY')}
        >
          <Icon name="shield-half-full" size={18} color={theme.colors.background} />
          <Text style={styles.sosBtnText}>{t('sosEmergency', 'SOS / EMERGENCY')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {endSessionError ? (
          <View style={styles.warningBox}>
            <Text style={styles.warningBoxText}>Session end was not confirmed. The session remains open in this app.</Text>
          </View>
        ) : null}
        
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
        <View style={[styles.timerCard, isTimedOut && styles.timerCardTimeout]}>
          <Text style={[styles.timerSub, isTimedOut && { color: theme.colors.warning }]}>
            {isTimedOut ? t('meetupEndedLabel', 'Meetup Duration Reached') : t('timeRemainingLabel', 'Time Remaining')}
          </Text>
          <Text style={[styles.timerMain, isTimedOut && { color: theme.colors.warning }]}>
            {formatTime(timeLeft)}
          </Text>
          
          <View style={styles.timerProgressBg}>
            <View style={[
              styles.timerProgressFill, 
              { width: `${progressPercentage}%` },
              isTimedOut && { backgroundColor: theme.colors.warning }
            ]} />
          </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 8 }}>
            <Text style={styles.timerLimitText}>{startedLabel}</Text>
            <Text style={[styles.timerLimitText, isTimedOut && { color: theme.colors.warning, fontWeight: '700' }]}>{endsLabel}</Text>
          </View>

          {isTimedOut && (
            <View style={styles.timeoutNoticePill}>
              <Icon name="alert-circle-outline" size={16} color={theme.colors.warning} />
              <Text style={styles.timeoutNoticeText}>
                {t('sessionOvertimeNotice', 'Meetup time ended. Please complete session or extend.')}
              </Text>
            </View>
          )}
        </View>

        {/* Companion Snapshot */}
        <View style={styles.companionCard}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitials}>{(companionName || 'Elena').charAt(0)}</Text>
          </View>
          <View style={{ flex: 1, paddingLeft: 12 }}>
            <Text style={styles.companionName} numberOfLines={1}>{companionName}</Text>
            <TouchableOpacity 
              style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }} 
              accessibilityRole="button" 
              accessibilityLabel={t('a11yViewFullProfile', 'View Full Profile')}
            >
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
          
          <TouchableOpacity 
            style={[styles.actionBtnSecondary, isTimedOut && { borderColor: theme.colors.primary, backgroundColor: 'rgba(212,175,55,0.1)' }]} 
            onPress={() => isTimedOut ? handleFinishSession() : setEndEarlyModalVisible(true)}
            disabled={isEndingSession}
            accessibilityRole="button" 
            accessibilityLabel={isTimedOut ? 'Complete Meetup' : 'End Early'}
          >
            <Icon name={isTimedOut ? 'check-decagram' : 'clock-remove-outline'} size={24} color={isTimedOut ? theme.colors.primary : theme.colors.error} />
            <Text style={[styles.actionBtnSecondaryText, isTimedOut && { color: theme.colors.primary }]}>
              {isTimedOut ? t('completeMeetup', 'Complete Meetup') : t('endEarly', 'End Early')}
            </Text>
            <Text style={[styles.actionBtnSecondarySub, isTimedOut && { color: theme.colors.primary }]}>
              {isTimedOut ? t('reviewAndPay', 'Finish and review') : t('proRataCharges', 'Payment adjustment unavailable')}
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* MEETUP TIME COMPLETE / TIMEOUT MODAL */}
      <Modal visible={timeoutModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon name="clock-check-outline" size={24} color={theme.colors.warning} />
                <Text style={styles.modalTitle}>{t('meetupTimeComplete', 'Meetup Time Complete')}</Text>
              </View>
              <TouchableOpacity onPress={() => setTimeoutModalVisible(false)} style={styles.modalCloseBtn} accessibilityRole="button" accessibilityLabel={t('a11yClose', 'Close')}>
                <Icon name="close" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.timeoutAlertCard}>
              <Text style={styles.timeoutAlertText}>
                {t('meetupTimeoutDesc', 'Your scheduled meetup duration with {{name}} has now ended. Would you like to wrap up and review or add extra time?', { name: companionName })}
              </Text>
            </View>

            <View style={{ gap: 12, marginBottom: 20 }}>
              <TouchableOpacity 
                style={styles.primaryBtn} 
                onPress={() => {
                  setTimeoutModalVisible(false);
                  handleFinishSession();
                }} 
                accessibilityRole="button" 
                accessibilityLabel="Complete and Review Session"
              >
                <Text style={styles.primaryBtnText}>{t('completeAndReview', 'Complete & Review Meetup')}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.primaryBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.primary }]} 
                onPress={() => {
                  setTimeoutModalVisible(false);
                  setExtendModalVisible(true);
                }} 
                accessibilityRole="button" 
                accessibilityLabel="Extend Meetup Time"
              >
                <Text style={[styles.primaryBtnText, { color: theme.colors.primary }]}>{t('extendMeetupTime', '+ Extend Meetup Time')}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={{ alignItems: 'center', paddingVertical: 8 }} 
              onPress={() => setTimeoutModalVisible(false)} 
              accessibilityRole="button" 
              accessibilityLabel="Dismiss modal and wrap up"
            >
              <Text style={{ color: theme.colors.textSecondary, fontWeight: '600' }}>{t('dismissWrapUp', 'Wrap up in person')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
            <Text style={styles.modalDesc}>
              Companion approval and payment processing are not configured for extensions in this app build. The session duration will not change.
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setExtendModalVisible(false)} accessibilityRole="button">
              <Text style={styles.primaryBtnText}>Close</Text>
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
              <Text style={styles.warningBoxText}>{t('endingNowWillReleaseEscrow', 'The Customer Backend can record this session as ended. The Companion Backend and payment provider are not coordinated by this action.')}</Text>
            </View>

            <View style={{ gap: 8, marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: theme.colors.textSecondary }}>{t('timeCompleted', 'Time completed')}</Text>
                <Text style={{ color: theme.colors.textPrimary, fontWeight: 'bold' }}>{timeCompletedText}</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.primaryBtn, { backgroundColor: theme.colors.error }]} 
              onPress={handleFinishSession} disabled={isEndingSession} accessibilityRole="button" accessibilityLabel={t('a11yConfirmEndSession', 'Confirm & End Session')}
            >
              <Text style={styles.primaryBtnText}>{isEndingSession ? 'Ending session…' : t('confirmEndSession', 'Confirm & End Session')}</Text>
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
                <Text style={{ color: theme.colors.textPrimary, fontSize: 15, fontWeight: 'bold' }}>
                  {sessionData?.booking?.activityName || t('fineDiningDrinks', 'Fine Dining & Social Meetup')}
                </Text>
              </View>
              
              <View>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 12, textTransform: 'uppercase', marginBottom: 4 }}>{t('dateTimeLabel', 'Date & Time')}</Text>
                <Text style={{ color: theme.colors.textPrimary, fontSize: 15, fontWeight: 'bold' }}>
                  {startedLabel} — {endsLabel}
                </Text>
              </View>

              <View>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 12, textTransform: 'uppercase', marginBottom: 4 }}>{t('specialNoteLabel', 'Your Special Note')}</Text>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border }}>
                  <Text style={{ color: theme.colors.textPrimary, fontSize: 14, fontStyle: 'italic' }}>
                    {sessionData?.booking?.specialInstructions ? `"${sessionData.booking.specialInstructions}"` : t('standardPublicMeetup', '"Standard public venue meetup. Please observe etiquette policy."')}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={() => setBookingDetailsModalVisible(false)} accessibilityRole="button" accessibilityLabel={t('a11yBackToSession', 'Back to Session')}>
              <Text style={styles.primaryBtnText}>{t('backToSession', 'Back to Session')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Dynamic Bottom Bar based on session time state */}
      <View style={styles.bottomBar}>
        {isTimedOut ? (
          <TouchableOpacity 
            style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }]} 
            onPress={handleFinishSession}
            disabled={isEndingSession}
            accessibilityRole="button" 
            accessibilityLabel={t('a11yCompleteReview', 'Complete & Review Meetup')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="check-decagram" size={20} color={theme.colors.background} />
              <Text style={styles.primaryBtnText}>{t('completeAndReview', 'Complete & Review Meetup')}</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.primaryBtn} 
            onPress={() => setExtendModalVisible(true)} 
            accessibilityRole="button" 
            accessibilityLabel={t('a11yExtendMeetupTime', 'Extend Meetup Time')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="clock-plus-outline" size={20} color={theme.colors.background} />
              <Text style={styles.primaryBtnText}>{t('extendMeetupTime', 'Extend Meetup Time')}</Text>
            </View>
          </TouchableOpacity>
        )}
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

  timeoutBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245, 158, 11, 0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 6 },
  timeoutDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.warning },
  timeoutText: { color: theme.colors.warning, fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  
  sosBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.error, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, gap: 6, shadowColor: theme.colors.error, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  sosBtnText: { color: theme.colors.background, fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  
  content: { padding: 20, gap: 24, paddingBottom: 40 },
  
  etiquetteCard: { backgroundColor: 'rgba(212, 175, 55, 0.1)', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.primary },
  etiquetteTitle: { fontSize: 14, fontWeight: 'bold', color: theme.colors.primary },
  etiquetteDesc: { fontSize: 13, color: theme.colors.textSecondary, lineHeight: 20 },

  timerCard: { alignItems: 'center', padding: 32, backgroundColor: theme.colors.surface, borderRadius: 24, borderWidth: 1, borderColor: theme.colors.border },
  timerCardTimeout: { borderColor: 'rgba(245, 158, 11, 0.5)', backgroundColor: 'rgba(245, 158, 11, 0.05)' },
  timerSub: { fontSize: 14, color: theme.colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  timerMain: { fontSize: 48, fontWeight: '900', color: theme.colors.textPrimary, fontVariant: ['tabular-nums'], letterSpacing: 2, marginBottom: 24 },
  timerProgressBg: { width: '100%', height: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' },
  timerProgressFill: { height: '100%', backgroundColor: theme.colors.primary, borderRadius: 4 },
  timerLimitText: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: '500' },
  timeoutNoticePill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(245, 158, 11, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginTop: 16 },
  timeoutNoticeText: { color: theme.colors.warning, fontSize: 12, fontWeight: '600' },

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

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: theme.colors.textPrimary },
  modalCloseBtn: { padding: 4 },
  modalDesc: { color: theme.colors.textSecondary, fontSize: 14, marginBottom: 24, lineHeight: 22 },
  
  timeoutAlertCard: { backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)', marginBottom: 20 },
  timeoutAlertText: { color: theme.colors.textPrimary, fontSize: 14, lineHeight: 22 },

  extensionOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.background },
  extensionTime: { fontSize: 16, fontWeight: 'bold', color: theme.colors.textPrimary },
  extensionPrice: { fontSize: 16, fontWeight: 'bold', color: theme.colors.textPrimary },

  warningBox: { flexDirection: 'row', backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: 16, borderRadius: 12, gap: 12, marginBottom: 24 },
  warningBoxText: { flex: 1, color: theme.colors.warning, fontSize: 13, lineHeight: 20 },

  bottomBar: { padding: 20, paddingBottom: 32, backgroundColor: theme.colors.surface, borderTopWidth: 1, borderTopColor: theme.colors.border },
  primaryBtn: { width: '100%', backgroundColor: theme.colors.primary, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: theme.colors.background, fontSize: 15, fontWeight: 'bold' },
});
