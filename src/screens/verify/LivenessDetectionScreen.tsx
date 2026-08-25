import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { kycApi } from '../../services/api';
import { showApiError } from '../../utils/errorHandler';
import { FlowTracker } from '../../services/flowTracker';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export const LivenessDetectionScreen = () => { 
  const { t } = useTranslation('verify.liveness');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { smartGoBack } = useSmartNavigation();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Animation for scanning line
  const scanAnim = useRef(new Animated.Value(0)).current;

  const performLivenessSubmission = async () => {
    setIsSubmitting(true);
    try {
      await kycApi.submitKycLiveness('https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4');
      navigation.replace('VerificationProcessingScreen');
    } catch (e: any) {
      showApiError(e, {
        title: 'Liveness Check Failed',
        onRetry: performLivenessSubmission,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    FlowTracker.saveActiveScreen('LivenessDetectionScreen');

    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();

    const timer1 = setTimeout(() => setStep(1), 2500); // "Blink your eyes"
    const timer2 = setTimeout(() => {
      performLivenessSubmission();
    }, 4500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [scanAnim]);

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-140, 140],
  });

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => smartGoBack()} accessibilityRole="button" accessibilityLabel={t('a11yGoBack', 'Go back')}>
          <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('step3of3', 'Step 3 of 3')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{t('livenessCheck', 'Liveness Check')}</Text>
        <Text style={styles.subtitle}>
          {step === 0 ? t('liveness.holdStill', "Please hold your phone still...") : t('liveness.blinkEyes', 'Now, blink your eyes slowly.')}
        </Text>

        <View style={styles.cameraContainer}>
          <View style={styles.cameraFrame}>
            <View style={[styles.cornerMarker, styles.cornerTL]} />
            <View style={[styles.cornerMarker, styles.cornerTR]} />
            <View style={[styles.cornerMarker, styles.cornerBL]} />
            <View style={[styles.cornerMarker, styles.cornerBR]} />

            <Icon name="face-recognition" size={100} color={theme.colors.primary} style={{ opacity: 0.2 }} />
            <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]} />
          </View>
        </View>

        <View style={styles.progressWrap}>
          <Text style={styles.progressText}>{t('analyzing', 'Analyzing facial features...')}</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: step === 0 ? '50%' : '90%' }]} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: theme.colors.primary,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 60,
    height: 48,
  },
  cameraContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 60,
  },
  cameraFrame: {
    width: 280,
    height: 380,
    borderRadius: 140,
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#15182B',
    overflow: 'hidden',
    position: 'relative',
  },
  cornerMarker: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: theme.colors.primary,
    zIndex: 10,
  },
  cornerTL: {
    top: -2,
    left: 40,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 10,
  },
  cornerTR: {
    top: -2,
    right: 40,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 10,
  },
  cornerBL: {
    bottom: -2,
    left: 40,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 10,
  },
  cornerBR: {
    bottom: -2,
    right: 40,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 10,
  },
  scanLine: {
    position: 'absolute',
    width: '100%',
    height: 4,
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 5,
    zIndex: 5,
  },
  progressWrap: {
    width: '100%',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  progressText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  progressBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
});
