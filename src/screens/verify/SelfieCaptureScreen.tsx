import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { kycApi } from '../../services/api';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

const { width } = Dimensions.get('window');

export const SelfieCaptureScreen = () => { 
  const { t } = useTranslation('verify.selfie');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { smartGoBack } = useSmartNavigation();
  const [hasPermission, setHasPermission] = useState(false);
  const [photoCaptured, setPhotoCaptured] = useState(false);

  useEffect(() => {
    // Simulate camera permission check
    const timer = setTimeout(() => {
      setHasPermission(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleCapture = () => {
    setPhotoCaptured(true);
  };

  const handleRetake = () => {
    setPhotoCaptured(false);
  };

  const handleNext = async () => {
    try {
      await kycApi.submitKycSelfie({
        selfieUrl: 'file:///local/selfie.jpg',
      });
    } catch {
      // Graceful fallback
    }
    navigation.navigate('LivenessDetectionScreen');
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => smartGoBack()} accessibilityRole="button" accessibilityLabel={t('a11yGoBack', 'Go back')}>
          <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('step2of3', 'Step 2 of 3')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t('selfieVerify', 'Selfie Verification')}</Text>
        <Text style={styles.subtitle}>
          {photoCaptured 
            ? t('selfie.faceVisible', "Ensure your face is clearly visible and not blurry.") 
            : t('selfie.removeGlasses', "Please remove any glasses or hats, and ensure you are in a well-lit area.")}
        </Text>

        <View style={styles.cameraContainer}>
          <View style={[styles.cameraFrame, photoCaptured && styles.cameraFrameSuccess]}>
            <View style={[styles.cornerMarker, styles.cornerTL]} />
            <View style={[styles.cornerMarker, styles.cornerTR]} />
            <View style={[styles.cornerMarker, styles.cornerBL]} />
            <View style={[styles.cornerMarker, styles.cornerBR]} />

            {photoCaptured ? (
              <Icon name="face-recognition" size={80} color={theme.colors.success} />
            ) : (
              <Icon name="camera-front-variant" size={80} color={theme.colors.textSecondary} />
            )}
          </View>
        </View>

        {!photoCaptured && (
          <View style={styles.tipsBox}>
            <Icon name="lightbulb-on-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.tipsText}>{t('tipsText', 'Face the camera directly and center your face in the oval.')}</Text>
          </View>
        )}

        <View style={styles.bottomBar}>
          {photoCaptured ? (
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.retakeBtn} onPress={handleRetake} accessibilityRole="button" accessibilityLabel={t('a11yRetake', 'Retake')}>
                <Text style={styles.retakeBtnText}>{t('retakeBtn', 'Retake')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleNext} accessibilityRole="button" accessibilityLabel={t('a11yConfirm', 'Confirm')}>
                <Text style={styles.confirmBtnText}>{t('confirmBtn', 'Confirm')}</Text>
                <Icon name="check" size={20} color={theme.colors.background} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.captureBtn} onPress={handleCapture} activeOpacity={0.8} disabled={!hasPermission} accessibilityRole="button" accessibilityLabel={t('a11yCaptureSelfie', 'Capture selfie photo')}>
              <View style={[styles.captureInnerBtn, !hasPermission && { backgroundColor: theme.colors.textSecondary }]} />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  cameraContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  cameraFrame: {
    width: width * 0.7,
    height: width * 0.95,
    borderRadius: 140, 
    borderWidth: 2,
    borderColor: theme.colors.border, 
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    position: 'relative',
  },
  cameraFrameSuccess: {
    borderColor: theme.colors.success,
  },
  cornerMarker: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: theme.colors.primary,
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
  tipsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    width: '100%',
  },
  tipsText: {
    color: theme.colors.primary,
    fontSize: 13,
    marginLeft: 12,
    flex: 1,
    lineHeight: 18,
  },
  bottomBar: {
    width: '100%',
    paddingTop: 10,
    alignItems: 'center',
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: theme.colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInnerBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.textPrimary,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    width: '100%',
  },
  retakeBtn: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retakeBtnText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmBtn: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmBtnText: {
    color: theme.colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
