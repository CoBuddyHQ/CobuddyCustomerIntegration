import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { accountApi } from '../../services/api';

export const AccountReactivationRequestScreen = () => {
  const { t } = useTranslation('system.reactivationReq');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [statusMessage, setStatusMessage] = useState('No reactivation request has been submitted.');

  const submitRequest = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setStatusMessage('');
    try {
      const result = await accountApi.submitReactivationRequest({});
      if (!result?.message) throw new Error('The Customer Backend did not confirm the request.');
      setIsSubmitted(true);
      setStatusMessage(result.message);
    } catch {
      setIsSubmitted(false);
      setStatusMessage(t('requestUnavailable', 'The Customer Backend did not confirm a reactivation request. No request has been marked as submitted.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Icon name={isSubmitted ? 'account-check-outline' : 'account-clock-outline'} size={72} color={isSubmitted ? theme.colors.success : theme.colors.warning} />
        </View>
        
        <Text style={styles.title}>{isSubmitted ? t('title', 'Request recorded') : t('requestTitle', 'Reactivation request')}</Text>
        <Text style={styles.message}>
          {statusMessage || (isSubmitting
            ? t('requestSending', 'Submitting request to the Customer Backend…')
            : t('requestPrompt', 'Submit a reactivation request. Response timing is not guaranteed.'))}
        </Text>
        {isSubmitting ? <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 16 }} /> : null}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.primaryButton}
          disabled={isSubmitting}
          onPress={() => {
            if (isSubmitted) navigation.navigate('AuthStack');
            else submitRequest();
          }}
          accessibilityRole="button"
          accessibilityLabel={isSubmitted ? t('a11yReturnToLogin', 'Return to Login') : t('a11ySubmitRequest', 'Submit reactivation request')}
        >
          <Text style={styles.primaryButtonText}>
            {isSubmitting ? t('requestSending', 'Submitting…') : isSubmitted ? t('loginBtn', 'Return to Login') : t('submitBtn', 'Submit reactivation request')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    padding: 24,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: theme.colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
