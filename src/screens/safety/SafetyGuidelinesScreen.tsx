import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

const GUIDELINES = [
  { id: 'g1', icon: 'map-marker-radius', titleKey: 'guideline.g1.title', defaultTitle: 'Meet in Public Places', descKey: 'guideline.g1.desc', defaultDesc: 'Always arrange your first meetup in a well-lit, public location like a café, mall, or popular tourist spot. Avoid secluded areas or private residences.' },
  { id: 'g2', icon: 'shield-account', titleKey: 'guideline.g2.title', defaultTitle: 'Verify Their Identity', descKey: 'guideline.g2.desc', defaultDesc: 'Look for the "Identity Verified" badge on their profile. Trust your instincts—if a profile seems fake or suspicious, report it immediately.' },
  { id: 'g3', icon: 'share-variant', titleKey: 'guideline.g3.title', defaultTitle: 'Share Your Plans', descKey: 'guideline.g3.desc', defaultDesc: 'Use the "Trusted Contacts" feature to automatically share your live location and meetup details with a friend or family member.' },
  { id: 'g4', icon: 'car', titleKey: 'guideline.g4.title', defaultTitle: 'Control Your Transport', descKey: 'guideline.g4.desc', defaultDesc: 'Always be in control of how you get to and from the meetup. Do not rely entirely on the companion for transportation.' },
  { id: 'g5', icon: 'message-text-lock', titleKey: 'guideline.g5.title', defaultTitle: 'Keep Chat on CoBuddy', descKey: 'guideline.g5.desc', defaultDesc: 'Do not move your conversation to WhatsApp or SMS before meeting. Our chat filters protect you from scams and inappropriate content.' },
];

export const SafetyGuidelinesScreen = () => { 
  const { t } = useTranslation('safety.guidelines');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { smartGoBack } = useSmartNavigation();

    return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => smartGoBack()} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={t('a11yGoBack', 'Go back')}>
          <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('headerTitle', 'Safety Guidelines')}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.heroBanner}>
          <View style={styles.heroIconWrap}>
            <Icon name="shield-check" size={48} color={theme.colors.background} />
          </View>
          <Text style={styles.heroTitle}>{t('heroTitle', 'Your Safety is our Priority')}</Text>
          <Text style={styles.heroDesc}>{t('weveBuiltCobuddyToBe', 'We\'ve built CoBuddy to be a safe community, but personal safety starts with you. Please follow these essential guidelines.')}</Text>
        </View>

        <View style={styles.listContainer}>
          {GUIDELINES.map((item) => (
            <View key={item.id} style={styles.ruleCard}>
                <View style={styles.ruleHeader}>
                  <View style={styles.ruleIconBox}>
                    <Icon name={item.icon} size={22} color={theme.colors.primary} />
                  </View>
                  <Text style={styles.ruleTitle}>{t(item.titleKey, item.defaultTitle) as string}</Text>
                </View>
                <Text style={styles.ruleDesc}>{t(item.descKey, item.defaultDesc) as string}</Text>
              </View>
          ))}
        </View>

        <TouchableOpacity 
          style={styles.contactBtn}
          activeOpacity={0.8}
          onPress={() => { const nav = navigation as unknown as { navigate: (route: string, params?: unknown) => void }; nav.navigate('MainTabNavigator', { screen: 'ChatTab', params: { screen: 'ConciergeChatScreen', initial: false } }); }} accessibilityRole="button" accessibilityLabel={t('a11yContactTrustSafetyTeam', 'Contact Trust & Safety Team')}
        >
          <Icon name="headset" size={20} color={theme.colors.background} />
          <Text style={styles.contactBtnText}>{t('contactBtn', 'Contact Trust & Safety Team')}</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.textPrimary },
  
  scrollContent: { padding: 16, paddingBottom: 40 },
  
  heroBanner: { backgroundColor: theme.colors.primary, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 24 },
  heroIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  heroTitle: { fontSize: 22, fontWeight: 'bold', color: theme.colors.background, marginBottom: 8, textAlign: 'center' },
  heroDesc: { fontSize: 14, color: 'rgba(20,20,15,0.8)', textAlign: 'center', lineHeight: 22 },

  listContainer: { gap: 16, marginBottom: 32 },
  ruleCard: { backgroundColor: theme.colors.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: theme.colors.border },
  ruleHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  ruleIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(212, 175, 55, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  ruleTitle: { flex: 1, fontSize: 16, fontWeight: 'bold', color: theme.colors.textPrimary },
  ruleDesc: { fontSize: 14, color: theme.colors.textSecondary, lineHeight: 22 },

  contactBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primary, paddingVertical: 16, borderRadius: 16, gap: 8 },
  contactBtnText: { fontSize: 15, fontWeight: 'bold', color: theme.colors.background }
});
