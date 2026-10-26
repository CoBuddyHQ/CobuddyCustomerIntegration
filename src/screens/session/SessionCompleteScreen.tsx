import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export const SessionCompleteScreen = () => { 
  const { t } = useTranslation('session.complete');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<any>();
  const { companionId, companionName } = route.params || {};
  const isSessionComplete = route.params?.sessionStatus !== 'unconfirmed';
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      <Animated.ScrollView contentContainerStyle={styles.scrollContent} style={{ opacity: fadeAnim }}>
        
        <View style={styles.mainArea}>
          <View style={styles.iconCircle}>
            <Icon name={isSessionComplete ? 'check-decagram' : 'alert-circle-outline'} size={64} color={isSessionComplete ? theme.colors.success : theme.colors.warning} />
          </View>

          <Text style={styles.title}>
            {isSessionComplete ? t('title', 'Session end recorded') : t('statusUnavailable', 'Session completion not confirmed')}
          </Text>
          <Text style={styles.subtitle}>
            {isSessionComplete
              ? t('subtitle', 'The Customer Backend recorded the session as completed with {{name}}.', { name: companionName || 'your companion' })
              : t('statusMessage', 'The Customer Backend did not confirm session completion.')}
          </Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('cardTitle', 'SESSION STATUS')}</Text>
            <View style={styles.row}>
              <Text style={styles.label}>{t('sessionRecord', 'Customer Backend record')}</Text>
              <Text style={styles.value}>{isSessionComplete ? 'Completed' : 'Not confirmed'}</Text>
            </View>
            <Text style={styles.invoiceNote}>
              <Icon name="information-outline" size={14} color={theme.colors.textSecondary} /> {t('financialNotice', 'This screen does not release funds, issue a refund, or send an invoice. The Companion Backend is not updated by this customer action.')}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.primaryBtn} 
            onPress={() => isSessionComplete
              ? navigation.navigate('PostSessionFeedbackScreen', { companionId, companionName, sessionId: route.params?.sessionId })
              : navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel={t('a11yContinueToFeedback', isSessionComplete ? 'Continue to Feedback' : 'Back to session')}
          >
            <Text style={styles.primaryBtnText}>{isSessionComplete ? t('primaryBtnText', 'Continue to Feedback') : 'Back to session'}</Text>
          </TouchableOpacity>
        </View>

      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'space-between' },
  mainArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  iconCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(16, 185, 129, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  
  title: { fontSize: 28, fontWeight: '900', color: theme.colors.textPrimary, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 15, color: theme.colors.textSecondary, marginBottom: 40, textAlign: 'center' },

  card: { width: '100%', backgroundColor: theme.colors.surface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: theme.colors.border },
  cardTitle: { fontSize: 12, fontWeight: '900', color: theme.colors.textSecondary, letterSpacing: 1.5, marginBottom: 20, textTransform: 'uppercase' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  label: { fontSize: 15, color: theme.colors.textSecondary },
  value: { fontSize: 16, color: theme.colors.textPrimary, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 12 },
  
  invoiceNote: { fontSize: 12, color: theme.colors.textSecondary, textAlign: 'center', marginTop: 8 },

  footer: { width: '100%', marginTop: 40, paddingBottom: 20 },
  primaryBtn: { width: '100%', backgroundColor: theme.colors.primary, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  primaryBtnText: { color: theme.colors.background, fontSize: 16, fontWeight: 'bold' },
});
