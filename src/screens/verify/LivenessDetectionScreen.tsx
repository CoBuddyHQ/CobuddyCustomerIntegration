import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { FlowTracker } from '../../services/flowTracker';

export const LivenessDetectionScreen = () => {
  const { t } = useTranslation('verify.liveness');
  const { smartGoBack } = useSmartNavigation();

  useEffect(() => {
    FlowTracker.saveActiveScreen('LivenessDetectionScreen');
  }, []);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => smartGoBack()}
          accessibilityRole="button"
          accessibilityLabel={t('a11yGoBack', 'Go back')}
        >
          <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('step3of3', 'Step 3 of 3')}</Text>
        <View style={styles.headerSpacer} />
      </View>
      <View style={styles.content}>
        <Icon name="camera-off" size={72} color={theme.colors.textSecondary} />
        <Text style={styles.title}>{t('livenessCheck', 'Liveness Check')}</Text>
        <Text style={styles.message}>
          {t(
            'liveness.unavailable',
            'Liveness verification is unavailable in this app build. No video was captured or submitted.',
          )}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { padding: 8 },
  headerTitle: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headerSpacer: { width: 40 },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
});
