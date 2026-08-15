import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { sessionApi } from '../../services/api';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export const TipGratuityScreen = () => { 
  const { t } = useTranslation('session.tip');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<any>();
  const { companionId, companionName } = route.params || {};
  const { smartGoBack } = useSmartNavigation();
  const [selectedTip, setSelectedTip] = useState<number | null>(null);
  const [customTip, setCustomTip] = useState<string>('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const customInputRef = useRef<TextInput>(null);

  const TIPS = [100, 200, 500];

  useEffect(() => {
    if (selectedTip === -1 && customInputRef.current) {
      customInputRef.current.focus();
    }
  }, [selectedTip]);

  const handlePayTip = async () => {
    const amount = selectedTip === -1 ? parseInt(customTip, 10) || 0 : (selectedTip || 0);
    if (amount > 0) {
      setIsSubmitting(true);
      try {
        const current = await sessionApi.getCurrentSession();
        if (current?.id) {
          await sessionApi.submitTip(current.id, amount);
        }
      } catch {
        // Graceful fallback
      } finally {
        setIsSubmitting(false);
      }
    }
    navigation.navigate('CompanionReviewScreen', { ...(route.params || {}), companionId, companionName });
  };

  const getButtonLabel = () => {
    if (selectedTip === null) return t('btnSelectTip', 'Select a Tip Amount');
    if (selectedTip === -1) {
      if (!customTip) return t('btnEnterCustom', 'Enter Custom Amount');
      return t('btnPayTip', 'Pay Tip (₹{{amount}})', { amount: customTip });
    }
    return t('btnPayTip', 'Pay Tip (₹{{amount}})', { amount: selectedTip });
  };

  const isPayDisabled = selectedTip === null || (selectedTip === -1 && !customTip);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => smartGoBack()} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel={t('a11yGoBack', 'Go back')}>
          <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('headerTitle', 'Add a Tip')}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CompanionReviewScreen', { ...(route.params || {}), companionId, companionName })} accessibilityRole="button" accessibilityLabel={t('a11ySkip', 'Skip')}>
          <Text style={styles.skipBtn}>{t('skipBtn', 'Skip')}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          <View style={styles.iconCircle}>
            <Icon name="gift-outline" size={48} color={theme.colors.primary} />
          </View>
          
          <Text style={styles.title}>{t('title', 'Show your appreciation')}</Text>
          <Text style={styles.subtitle}>{t('subtitle', 'Did {{name}} go above and beyond? A small tip can make their day.', { name: companionName || 'Elena' })}</Text>

          <View style={styles.tipGrid}>
            {TIPS.map(amount => (
              <TouchableOpacity 
                key={amount} 
                style={[styles.tipCard, selectedTip === amount && styles.tipCardSelected]}
                onPress={() => {
                  setSelectedTip(amount);
                  setCustomTip('');
                }} accessibilityRole="button" accessibilityLabel={t('a11yAmount', '₹ amount')}
              >
                <Text style={[styles.tipAmount, selectedTip === amount && styles.tipAmountSelected]}>₹{amount}</Text>
              </TouchableOpacity>
            ))}
            
            {/* Custom Tip Option */}
            <TouchableOpacity 
              style={[styles.tipCard, selectedTip === -1 && styles.tipCardSelected]}
              onPress={() => setSelectedTip(-1)} accessibilityRole="button" accessibilityLabel={t('a11yCustomTip', 'Enter custom tip')}
            >
              {selectedTip === -1 ? (
                <View style={styles.customInputWrapper}>
                  <Text style={[styles.tipAmount, styles.tipAmountSelected]}>₹</Text>
                  <TextInput
                    ref={customInputRef}
                    style={styles.customInput}
                    keyboardType="numeric"
                    value={customTip}
                    onChangeText={setCustomTip}
                    placeholder={t('placeholder.0', '0')}
                    placeholderTextColor="rgba(212,175,55,0.5)"
                    maxLength={5}
                  />
                </View>
              ) : (
                <Text style={[styles.tipAmount, selectedTip === -1 && styles.tipAmountSelected]}>{t('customTip', 'Custom')}</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.trustBanner}>
            <Icon name="shield-check" size={20} color={theme.colors.success} />
            <Text style={styles.trustText}>{t('trustText', '100% of your tip goes directly to the companion. CoBuddy takes zero commission.')}</Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={[styles.primaryBtn, (isPayDisabled || isSubmitting) && { opacity: 0.5 }]} 
          disabled={isPayDisabled || isSubmitting}
          onPress={handlePayTip} accessibilityRole="button" accessibilityLabel={t('a11yPayTip', 'Pay tip amount')}
        >
          <Text style={styles.primaryBtnText}>
            {isSubmitting ? 'Processing...' : getButtonLabel()}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16 },
  iconBtn: { padding: 8, backgroundColor: theme.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: theme.colors.textPrimary },
  skipBtn: { fontSize: 15, fontWeight: 'bold', color: theme.colors.textSecondary, paddingHorizontal: 8 },
  
  content: { flexGrow: 1, padding: 24, alignItems: 'center', paddingTop: 40, paddingBottom: 40 },
  
  iconCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(212, 175, 55, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  
  title: { fontSize: 24, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 12 },
  subtitle: { fontSize: 15, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 40, paddingHorizontal: 20 },

  tipGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16, marginBottom: 40 },
  tipCard: { width: '45%', height: 80, backgroundColor: theme.colors.surface, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: theme.colors.border },
  tipCardSelected: { borderColor: theme.colors.primary, backgroundColor: 'rgba(212, 175, 55, 0.1)' },
  tipAmount: { fontSize: 24, fontWeight: 'bold', color: theme.colors.textPrimary },
  tipAmountSelected: { color: theme.colors.primary },
  
  customInputWrapper: { flexDirection: 'row', alignItems: 'center' },
  customInput: { fontSize: 24, fontWeight: 'bold', color: theme.colors.primary, minWidth: 40, padding: 0, margin: 0 },

  trustBanner: { flexDirection: 'row', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: 16, borderRadius: 12, alignItems: 'center', gap: 12 },
  trustText: { flex: 1, color: theme.colors.success, fontSize: 13, lineHeight: 20, fontWeight: '500' },

  bottomBar: { padding: 20, paddingBottom: 32, backgroundColor: theme.colors.surface, borderTopWidth: 1, borderTopColor: theme.colors.border },
  primaryBtn: { width: '100%', backgroundColor: theme.colors.primary, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: theme.colors.background, fontSize: 15, fontWeight: 'bold' },
});
