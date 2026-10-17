import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';

export const BookingTimeSelectScreen = () => {
  const { t } = useTranslation('booking.timeSelect');
  const { smartGoBack } = useSmartNavigation();

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => smartGoBack()}
          accessibilityRole="button"
          accessibilityLabel={t('a11yGoBack', 'Go back')}
        >
          <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('headerTitle', 'Choose a Time')}</Text>
        <View style={styles.backButton} />
      </View>
      <View style={styles.content}>
        <Icon name="calendar-clock" size={56} color={theme.colors.textSecondary} />
        <Text style={styles.title}>Availability unavailable</Text>
        <Text style={styles.message}>
          A customer-facing companion availability contract is not configured. No sample time slot can be reserved.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    minHeight: 60,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: { width: 40, paddingVertical: 8 },
  headerTitle: { color: theme.colors.textPrimary, fontSize: 18, fontWeight: '700' },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  title: { color: theme.colors.textPrimary, fontSize: 22, fontWeight: '700', textAlign: 'center' },
  message: { color: theme.colors.textSecondary, fontSize: 15, lineHeight: 22, textAlign: 'center' },
});
