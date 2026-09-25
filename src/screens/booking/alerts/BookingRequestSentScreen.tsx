import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../../theme';
import { RootStackParamList } from '../../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export const BookingRequestSentScreen = ({ route }: { route: any }) => { 
  const { t } = useTranslation('booking.requestSent');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  const bookingData = {
    bookingId: route?.params?.bookingId || '',
    companionName: route?.params?.companionName || 'Companion',
    date: route?.params?.date || 'Today',
    time: route?.params?.time || '18:00',
    venue: route?.params?.venue || 'Public Venue',
    amount: route?.params?.amount || '₹1,000',
  };

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
      ])
    ).start();
  }, [pulseAnim]);

  const handleReturnHome = () => {
    const parent = navigation.getParent();
    if (parent) {
      parent.reset({ index: 0, routes: [{ name: 'MainTabNavigator', params: { screen: 'HomeTab' } }] });
    } else {
      (navigation as any).navigate('MainTabNavigator', { screen: 'HomeTab' });
    }
  };

  const handleViewDetails = () => {
    const parent = navigation.getParent();
    const target = {
      screen: 'BookingsTab',
      params: {
        screen: 'BookingDetailScreen',
        initial: false,
        params: { bookingId: bookingData.bookingId }
      }
    };
    if (parent) {
      parent.reset({
        index: 0,
        routes: [{ name: 'MainTabNavigator', params: target }]
      });
    } else {
      (navigation as any).navigate('MainTabNavigator', target);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Animated.View style={[styles.glow, { transform: [{ scale: pulseAnim }] }]} />
          <Icon name="send-circle" size={90} color={theme.colors.primary} />
        </View>

        <Text style={styles.title}>{t('title', 'Request Sent!')}</Text>
        <Text style={styles.subtitle}>
          {t('bookingRequestSent.body', 'We\'ve notified {{name}}. They have 24 hours to review your request, but companions usually respond within a few hours.', { name: bookingData.companionName })}
        </Text>

        <View style={styles.card}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
            <Text style={styles.cardHeader}>{t('cardHeader', 'REQUEST SNAPSHOT')}</Text>
            <Text style={styles.bookingId}>#{bookingData.bookingId}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Icon name="calendar-blank" size={18} color={theme.colors.textSecondary} />
            <Text style={styles.detailText}>{bookingData.date}</Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="clock-outline" size={18} color={theme.colors.textSecondary} />
            <Text style={styles.detailText}>{bookingData.time}</Text>
          </View>
          <View style={styles.detailRow}>
            <Icon name="map-marker-outline" size={18} color={theme.colors.textSecondary} />
            <Text style={styles.detailText}>
              {typeof bookingData.venue === 'object' ? (bookingData.venue as any)?.name : String(bookingData.venue || 'Public Cafe')}
            </Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={[styles.detailRow, { marginBottom: 0, justifyContent: 'space-between' }]}>
            <Text style={styles.detailLabel}>{t('detailLabel', 'Escrow Amount Held')}</Text>
            <Text style={styles.amountText}>{bookingData.amount}</Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleViewDetails} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel={t('a11yViewRequestDetails', 'View Request Details')}>
          <Text style={styles.primaryBtnText}>{t('primaryBtnText', 'View Request Details')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={handleReturnHome} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel={t('a11yReturnToHome', 'Return to Home')}>
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
  glow: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: theme.colors.primary, opacity: 0.15 },
  
  title: { fontSize: 32, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 15, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 40, paddingHorizontal: 10 },
  
  card: { width: '100%', backgroundColor: theme.colors.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: theme.colors.border },
  cardHeader: { fontSize: 11, fontWeight: 'bold', color: theme.colors.textSecondary, letterSpacing: 1.2 },
  bookingId: { fontSize: 12, color: theme.colors.textSecondary, opacity: 0.7 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  detailText: { fontSize: 15, color: theme.colors.textPrimary, fontWeight: '500' },
  detailLabel: { fontSize: 14, color: theme.colors.textSecondary },
  amountText: { fontSize: 16, color: theme.colors.primary, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 12 },
  
  bottomBar: { padding: 24, paddingBottom: 40, gap: 12 },
  primaryBtn: { backgroundColor: theme.colors.primary, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: theme.colors.background, fontSize: 16, fontWeight: 'bold' },
  secondaryBtn: { height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border },
  secondaryBtnText: { color: theme.colors.textPrimary, fontSize: 16, fontWeight: '600' },
});
