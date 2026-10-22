import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { supportApi } from '../../services/api';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';





export const HelpCenterScreen = () => { 
  const { t } = useTranslation('support.helpCenter');

  const CATEGORIES = [
  { id: '1', title: t('help.bookings', 'Bookings & Meetups'), icon: 'calendar-check-outline' },
  { id: '2', title: t('help.payments', 'Payments & Refunds'), icon: 'credit-card-outline' },
  { id: '3', title: t('help.trustSafety', 'Trust & Safety'), icon: 'shield-check-outline' },
  { id: '4', title: t('help.account', 'Account Settings'), icon: 'account-cog-outline' }
];

  const FAQS = [
  // Bookings & Meetups
  { id: 'f1', categoryId: '1', question: t('faq.f1.q', 'How do I cancel a booking?'), answer: t('faq.f1.a', 'Use booking details to request cancellation. The Customer Backend reports whether it was accepted. Provider refunds are unavailable in this app build.') },
  { id: 'f2', categoryId: '1', question: t('faq.f2.q', "What if a companion doesn't show up?"), answer: t('faq.f2.a', "Submit an incident report and contact local emergency services if there is immediate danger. A refund or profile action is not guaranteed by this app build.") },
  { id: 'f3', categoryId: '1', question: t('faq.f3.q', 'Can I reschedule my meetup?'), answer: t('faq.f3.a', 'Schedule changes are available for pending booking requests. The Customer Backend must confirm the Companion Backend accepted the update.') },
  { id: 'f4', categoryId: '1', question: t('faq.f4.q', 'Are there extra charges for overtime?'), answer: t('faq.f4.a', 'Session extensions are unavailable in this app build because companion approval and payment processing are not connected.') },

  // Payments & Refunds
  { id: 'f5', categoryId: '2', question: t('faq.f5.q', 'How is my payment secured?'), answer: t('faq.f5.a', 'Booking checkout is unavailable in this app build. No booking payment is submitted and no escrow funds are held by this screen.') },
  { id: 'f6', categoryId: '2', question: t('faq.f6.q', 'When will I get my refund?'), answer: t('faq.f6.a', 'Refund transfers are not configured in this app build. If a paid cancellation requires a refund, the Customer Backend keeps the booking active and reports that it could not cancel it.') },
  { id: 'f7', categoryId: '2', question: t('faq.f7.q', 'What payment methods do you accept?'), answer: t('faq.f7.a', 'Card tokenization and booking checkout are unavailable in this app build. Do not enter payment credentials here.') },

  // Trust & Safety
  { id: 'f8', categoryId: '3', question: t('faq.f8.q', 'How does the SOS feature work?'), answer: t('faq.f8.a', 'SOS records an event with the Customer Backend. This app build does not notify trusted contacts, share live location, or dispatch emergency services. Contact local authorities if you are in immediate danger.') },
  { id: 'f9', categoryId: '3', question: t('faq.f9.q', 'Are the companions identity-verified?'), answer: t('faq.f9.a', 'A profile may show a verification state reported by the service. Do not treat a badge as a guarantee; meet in public and use your judgment.') },
  { id: 'f10', categoryId: '3', question: t('faq.f10.q', 'Can I hide my profile?'), answer: t('faq.f10.a', 'Yes, go to Safety Settings and enable "Incognito Mode". Your profile will only be visible to people you message.') },

  // Account Settings
  { id: 'f11', categoryId: '4', question: t('faq.f11.q', 'How do I change my phone number?'), answer: t('faq.f11.a', 'Go to Profile > Settings Hub > Account Settings to update your registered phone number.') },
  { id: 'f12', categoryId: '4', question: t('faq.f12.q', 'How do I delete my account?'), answer: t('faq.f12.a', 'You can delete your account from Profile > Settings Hub > Account Settings > Delete Account. Please note this action is permanent.') },
];

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { smartGoBack } = useSmartNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [apiFaqs, setApiFaqs] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    supportApi.getFaqs().then(faqs => {
      if (isMounted && faqs && faqs.length > 0) {
        setApiFaqs(faqs);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const activeFaqList = apiFaqs.length > 0
    ? apiFaqs.map(f => ({
        id: f.id,
        categoryId: f.category || '1',
        question: f.question,
        answer: f.answer,
      }))
    : FAQS;

  // Dynamic filtering based on search text and selected category
  const filteredFaqs = activeFaqList.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? faq.categoryId === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => smartGoBack()} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={t('a11yGoBack', 'Go back')}>
          <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('headerTitle', 'Help Center')}</Text>
        <View style={styles.backBtn} />
      </View>

      <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            
            {/* Search Banner */}
            <View style={styles.searchSection}>
                <Text style={styles.greeting}>{t('greeting', 'Hi there, how can we help?')}</Text>
                <View style={styles.searchBox}>
                    <Icon name="magnify" size={22} color={theme.colors.textSecondary} />
                    <TextInput 
                        style={styles.searchInput}
                        placeholder={t('placeholder.SearchForHelpFA', 'Search for help, FAQs...')}
                        placeholderTextColor={theme.colors.textSecondary}
                        value={searchQuery}
                        onChangeText={(text) => {
                            setSearchQuery(text);
                            if (expandedFaq) setExpandedFaq(null);
                        }}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')} accessibilityRole="button" accessibilityLabel={t('a11yClose', 'Close')}>
                            <Icon name="close-circle" size={20} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Categories Grid */}
            <Text style={styles.sectionTitle}>{t('browseTopics', 'BROWSE TOPICS')}</Text>
            <View style={styles.grid}>
                {CATEGORIES.map(cat => {
                    const isSelected = selectedCategory === cat.id;
                    return (
                        <TouchableOpacity 
                            key={cat.id} 
                            style={[styles.gridItem, isSelected && styles.gridItemActive]} 
                            activeOpacity={0.7}
                            onPress={() => {
                                setSelectedCategory(isSelected ? null : cat.id);
                                setExpandedFaq(null);
                            }} accessibilityRole="button" accessibilityLabel={cat.title}
                        >
                            <View style={[styles.iconCircle, isSelected && styles.iconCircleActive]}>
                                <Icon name={cat.icon} size={24} color={isSelected ? theme.colors.background : theme.colors.primary} />
                            </View>
                            <Text style={[styles.gridTitle, isSelected && styles.gridTitleActive]}>{cat.title}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* FAQs */}
            <Text style={[styles.sectionTitle, {marginTop: 24}]}>
                {searchQuery ? t('help.searchResults', 'SEARCH RESULTS') : (selectedCategory ? t('help.categoryFaqs', 'CATEGORY FAQS') : t('help.frequentlyAsked', 'FREQUENTLY ASKED QUESTIONS'))}
            </Text>
            
            <View style={styles.faqCard}>
                {filteredFaqs.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Icon name="file-question-outline" size={32} color={theme.colors.textSecondary} />
                        <Text style={styles.emptyStateText}>{t('noFaqs', 'No FAQs found for this topic.')}</Text>
                    </View>
                ) : (
                    filteredFaqs.map((faq, index) => {
                        const isExpanded = expandedFaq === faq.id;
                        return (
                            <View key={faq.id}>
                                <TouchableOpacity 
                                    style={[styles.faqRow, index !== 0 && styles.borderTop]} 
                                    activeOpacity={0.7}
                                    onPress={() => setExpandedFaq(isExpanded ? null : faq.id)} accessibilityRole="button" accessibilityLabel={faq.question}
                                >
                                    <Text style={[styles.faqQuestion, isExpanded && {color: theme.colors.primary}]}>{faq.question}</Text>
                                    <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={isExpanded ? theme.colors.primary : theme.colors.textSecondary} />
                                </TouchableOpacity>
                                {isExpanded && (
                                    <View style={styles.faqAnswerBox}>
                                        <Text style={styles.faqAnswer}>{faq.answer}</Text>
                                    </View>
                                )}
                            </View>
                        )
                    })
                )}
            </View>

            {/* Contact Support */}
            <View style={styles.contactCard}>
                <View style={styles.contactMeta}>
                    <Text style={styles.contactTitle}>{t('stillNeedHelp', 'Still need help?')}</Text>
                    <Text style={styles.contactSub}>{t('contactSub', 'Create a support ticket in the app. Response timing is not guaranteed.')}</Text>
                </View>
                <TouchableOpacity 
                    style={styles.chatBtn}
                    activeOpacity={0.8}
                    onPress={() => { const nav = navigation as unknown as { navigate: (route: string, params?: unknown) => void }; nav.navigate('MainTabNavigator', { screen: 'ChatTab', params: { screen: 'ConciergeChatScreen', initial: false } }); }} accessibilityRole="button" accessibilityLabel={t('a11yChatNow', 'Chat Now')}
                >
                    <Icon name="message-text-outline" size={20} color={theme.colors.background} />
                    <Text style={styles.chatBtnText}>{t('chatNow', 'Chat Now')}</Text>
                </TouchableOpacity>
            </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.textPrimary },
  
  scrollContent: { padding: 16, paddingBottom: 40 },
  
  searchSection: { marginBottom: 32, marginTop: 10 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 16 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: 12, paddingHorizontal: 16, height: 50, borderWidth: 1, borderColor: theme.colors.border },
  searchInput: { flex: 1, marginLeft: 10, color: theme.colors.textPrimary, fontSize: 15 },
  
  sectionTitle: { fontSize: 11, fontWeight: 'bold', color: theme.colors.textSecondary, letterSpacing: 1, marginBottom: 12, marginLeft: 4 },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { width: '48%', backgroundColor: theme.colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
  gridItemActive: { backgroundColor: 'rgba(212, 175, 55, 0.1)', borderColor: theme.colors.primary },
  iconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(212, 175, 55, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  iconCircleActive: { backgroundColor: theme.colors.primary },
  gridTitle: { fontSize: 13, fontWeight: '600', color: theme.colors.textPrimary, textAlign: 'center' },
  gridTitleActive: { color: theme.colors.primary },

  faqCard: { backgroundColor: theme.colors.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden', minHeight: 100 },
  faqRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  borderTop: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border },
  faqQuestion: { flex: 1, fontSize: 14, fontWeight: '500', color: theme.colors.textPrimary, paddingRight: 16 },
  faqAnswerBox: { paddingHorizontal: 16, paddingBottom: 16, backgroundColor: 'rgba(255,255,255,0.02)' },
  faqAnswer: { fontSize: 13, color: theme.colors.textSecondary, lineHeight: 20 },
  
  emptyState: { padding: 32, alignItems: 'center', justifyContent: 'center' },
  emptyStateText: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 12, textAlign: 'center' },

  contactCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(212, 175, 55, 0.08)', borderRadius: 16, padding: 20, marginTop: 32, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.2)' },
  contactMeta: { flex: 1, marginRight: 12 },
  contactTitle: { fontSize: 16, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 4 },
  contactSub: { fontSize: 13, color: theme.colors.textSecondary, lineHeight: 18 },
  chatBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.primary, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, gap: 6 },
  chatBtnText: { fontSize: 14, fontWeight: 'bold', color: theme.colors.background }
});
