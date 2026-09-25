import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../../theme';
import { RootStackParamList } from '../../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useBookingStore } from '../../../store/slices/bookingStore';
import { selectClearActiveBooking } from '../../../store/selectors/bookingSelectors';

export const BookingDeclinedScreen = ({ route }: { route: any }) => { 
  const { t } = useTranslation('booking.declined');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  const bookingData = route?.params || {};
  const clearActiveBooking = useBookingStore(selectClearActiveBooking);

  useEffect(() => {
    clearActiveBooking();
  }, [clearActiveBooking]);

  const handleFindAnother = () => {
    const parent = navigation.getParent();
    if (parent) {
      parent.reset({ index: 0, routes: [{ name: 'MainTabNavigator', params: { screen: 'DiscoverTab' } }] });
    } else {
      (navigation as any).navigate('MainTabNavigator', { screen: 'DiscoverTab' });
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.glow} />
          <Icon name="close-circle" size={90} color={theme.colors.error} />
        </View>

        <Text style={styles.title}>{t('title', 'Booking Declined')}</Text>
        <Text style={styles.subtitle}>
          {t('bookingDeclined.body', 'Unfortunately, {{name}} is unavailable for {{date}} at {{time}}. Don\'t worry, there are many other great companions available!', { name: bookingData.companionName, date: bookingData.date, time: bookingData.time })}
        </Text>
        
        {bookingData.reason ? (
          <View style={styles.reasonCard}>
            <Text style={styles.reasonLabel}>{t('reasonLabel', 'Reason given:')}</Text>
            <Text style={styles.reasonText}>{t('reasonText', '"{{reason}}"', { reason: bookingData.reason })}</Text>
          </View>
        ) : null}

        <View style={styles.noteCard}>
          <Icon name="information-outline" size={20} color={theme.colors.textSecondary} />
          <Text style={styles.noteText}>{t('noteText', 'Any pre-authorized holds on your payment method have been released instantly.')}</Text>
        </View>
      </View>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleFindAnother} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel={t('a11yFindAnotherCompanion', 'Find Another Companion')}>
          <Text style={styles.primaryBtnText}>{t('primaryBtnText', 'Find Another Companion')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={handleFindAnother} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel={t('a11yReturnToHome', 'Return to Home')}>
          <Text style={styles.secondaryBtnText}>{t('secondaryBtnText', 'Return to Home')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  
  iconContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 32, position: 'relative' },
  glow: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: theme.colors.error, opacity: 0.15 },
  
  title: { fontSize: 32, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 15, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 24, paddingHorizontal: 10 },
  
  reasonCard: { backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 16, borderRadius: 12, marginBottom: 24, width: '100%', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' },
  reasonLabel: { fontSize: 12, color: theme.colors.error, marginBottom: 4, fontWeight: '600' },
  reasonText: { fontSize: 14, color: theme.colors.textPrimary, fontStyle: 'italic' },
  
  noteCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: theme.colors.surface, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border },
  noteText: { flex: 1, fontSize: 13, color: theme.colors.textSecondary, lineHeight: 20 },
  
  bottomBar: { padding: 24, paddingBottom: 40, gap: 12 },
  primaryBtn: { backgroundColor: theme.colors.primary, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: theme.colors.background, fontSize: 16, fontWeight: 'bold' },
  secondaryBtn: { height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border },
  secondaryBtnText: { color: theme.colors.textPrimary, fontSize: 16, fontWeight: '600' },
});
