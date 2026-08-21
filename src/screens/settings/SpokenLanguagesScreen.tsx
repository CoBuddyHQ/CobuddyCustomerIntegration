import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

const SPOKEN_LANGUAGES = [
    { id: 'en', label: 'English', native: 'English' },
    { id: 'hi', label: 'Hindi', native: 'हिंदी' },
    { id: 'mr', label: 'Marathi', native: 'मराठी' },
    { id: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
    { id: 'bn', label: 'Bengali', native: 'বাংলা' },
    { id: 'ta', label: 'Tamil', native: 'தமிழ்' },
    { id: 'te', label: 'Telugu', native: 'తెలుగు' },
    { id: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
    { id: 'ml', label: 'Malayalam', native: 'മലയാളം' },
    { id: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
    { id: 'ur', label: 'Urdu', native: 'اردو' },
    { id: 'or', label: 'Odia', native: 'ଓଡ଼ିଆ' },
    { id: 'hinglish', label: 'Hinglish', native: 'Hinglish' },
    { id: 'fr', label: 'French', native: 'Français' },
    { id: 'es', label: 'Spanish', native: 'Español' },
];

export const SpokenLanguagesScreen = () => { 
  const { t } = useTranslation('settings.spokenLanguages');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { smartGoBack } = useSmartNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'SpokenLanguagesScreen'>>();
  
  const initialLanguages = route.params?.initialLanguages || ['en', 'hi'];
  const [selected, setSelected] = useState<Set<string>>(new Set(initialLanguages));

  const toggleLang = (id: string) => {
      setSelected(prev => {
          const next = new Set(prev);
          if (next.has(id)) {
              if (next.size > 1) next.delete(id);
          } else {
              if (next.size < 5) next.add(id);
          }
          return next;
      });
  };

  const handleSave = () => {
      // Map IDs back to Labels for simple display in EditProfile
      const selectedLabels = Array.from(selected).map(
          id => SPOKEN_LANGUAGES.find(l => l.id === id)?.label || id
      );
      
      navigation.navigate({
          name: 'EditProfileScreen',
          params: { updatedLanguages: selectedLabels, updatedLangIds: Array.from(selected) },
          merge: true,
      } as any);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => smartGoBack()} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel={t('a11yGoBack', 'Go back')}>
          <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('headerTitle', 'Spoken Languages')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>{t('subtitle', 'Select up to 5 languages you are comfortable speaking.')}</Text>

        <View style={styles.listContainer}>
            {SPOKEN_LANGUAGES.map(lang => {
                const isSelected = selected.has(lang.id);
                return (
                    <TouchableOpacity 
                        key={lang.id} 
                        style={[styles.row, isSelected && styles.rowActive]}
                        onPress={() => toggleLang(lang.id)}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={t('a11yToggleLang', 'Toggle {{label}}', { label: lang.label })}
                    >
                        <View>
                            <Text style={[styles.langLabel, isSelected && styles.langLabelActive]}>{lang.label}</Text>
                            <Text style={styles.langNative}>{lang.native}</Text>
                        </View>
                        <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                            {isSelected && <Icon name="check" size={16} color={theme.colors.background} />}
                        </View>
                    </TouchableOpacity>
                );
            })}
        </View>
      </ScrollView>

      {/* Sticky Save CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={t('a11ySavePreferences', 'Save Preferences')}>
            <Text style={styles.saveBtnText}>{t('saveBtn', 'Save Preferences ({{count}}/5)', { count: selected.size })}</Text>
        </TouchableOpacity>
      </View>
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
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  listContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  rowActive: {
    backgroundColor: 'rgba(217, 119, 6, 0.05)',
  },
  langLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  langLabelActive: {
    color: theme.colors.primary,
  },
  langNative: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  bottomBar: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.background,
  },
});
