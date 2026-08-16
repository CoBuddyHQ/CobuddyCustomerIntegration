import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';
import { Button } from '../../components/ui/Button';
import { BottomActionBar } from '../../components/ui/BottomActionBar';
import { AppBottomSheet } from '../../components/ui/AppBottomSheet';
import { OnboardingHeader } from '../../components/onboarding/OnboardingHeader';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const DocIcon = ({ icon }: { icon: string }) => {
  if (icon === '⚖') return <Icon name="scale-balance" size={22} color={theme.colors.primary} />;
  if (icon === '🔐') return <Icon name="lock-outline" size={22} color={theme.colors.primary} />;
  if (icon === '🛡') return <Icon name="shield-check-outline" size={22} color={theme.colors.primary} />;
  return <Icon name="file-document-outline" size={22} color={theme.colors.primary} />;
};

interface LegalDoc {
  id: string;
  icon: string;
  title: string;
  desc: string;
  sections: { heading: string; body: string }[];
}

import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { profileApi } from '../../services/api';

export const LegalConsentScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { smartGoBack } = useSmartNavigation();
  const { t } = useTranslation(['onboarding']);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [activeDoc, setActiveDoc] = useState<LegalDoc | null>(null);

  const DOCS: LegalDoc[] = [
    {
      id: 'terms',
      icon: '⚖',
      title: t('consent.docs.terms.title', 'Terms & Conditions'),
      desc: t('consent.docs.terms.desc', 'Our legal framework for usage and liability.'),
      sections: [
        { heading: t('consent.docs.terms.s1.h', 'Eligibility'), body: t('consent.docs.terms.s1.b', 'You must be 18 years or older to use CoBuddy. By registering, you confirm you meet this requirement and have the legal capacity to enter into this agreement.') },
        { heading: t('consent.docs.terms.s2.h', 'Permitted Use'), body: t('consent.docs.terms.s2.b', 'CoBuddy connects members for trusted public-only experiences including dining, cultural outings, networking, and wellness activities. The platform is strictly for platonic, professional companionship in verified public settings.') },
        { heading: t('consent.docs.terms.s3.h', 'Account Responsibility'), body: t('consent.docs.terms.s3.b', 'You are responsible for all activity under your account. Do not share credentials. CoBuddy reserves the right to suspend accounts for any breach of these terms without prior notice.') },
        { heading: t('consent.docs.terms.s4.h', 'Limitation of Liability'), body: t('consent.docs.terms.s4.b', 'CoBuddy acts as a connection platform only. We are not liable for conduct between members during or after sessions. Sessions are undertaken at your own discretion.') },
      ],
    },
    {
      id: 'privacy',
      icon: '🔐',
      title: t('consent.docs.privacy.title', 'Privacy Policy'),
      desc: t('consent.docs.privacy.desc', 'How we protect and manage your data.'),
      sections: [
        { heading: t('consent.docs.privacy.s1.h', 'Data We Collect'), body: t('consent.docs.privacy.s1.b', 'We collect identity verification data (government ID), contact information, location data during active sessions, and usage analytics to improve your experience.') },
        { heading: t('consent.docs.privacy.s2.h', 'How We Use Your Data'), body: t('consent.docs.privacy.s2.b', 'Your data is used exclusively for identity verification, session matching, safety monitoring, and personalized recommendations. We never sell personal data to third parties.') },
        { heading: t('consent.docs.privacy.s3.h', 'Data Protection'), body: t('consent.docs.privacy.s3.b', 'All data is encrypted in transit and at rest. We are compliant with applicable regional data protection regulations.') },
        { heading: t('consent.docs.privacy.s4.h', 'Your Rights'), body: t('consent.docs.privacy.s4.b', 'You may request access to, correction of, or deletion of your personal data at any time through Settings.') },
      ],
    },
    {
      id: 'community',
      icon: '🛡',
      title: t('consent.docs.community.title', 'Community Guidelines'),
      desc: t('consent.docs.community.desc', 'Behavioral standards for all members.'),
      sections: [
        { heading: t('consent.docs.community.s1.h', 'Respect & Dignity'), body: t('consent.docs.community.s1.b', 'All members must treat companions and fellow users with respect. Harassment, discrimination, or any form of disrespectful conduct will result in immediate account suspension.') },
        { heading: t('consent.docs.community.s2.h', 'Public Venues Only'), body: t('consent.docs.community.s2.b', 'For safety, all first-time meetings must occur in CoBuddy-verified public venues. Never request a companion to meet in private or isolated settings.') },
        { heading: t('consent.docs.community.s3.h', 'Zero Tolerance Policy'), body: t('consent.docs.community.s3.b', 'Any solicitation for services beyond our platform scope (romantic, sexual, or private arrangements) is strictly prohibited and will result in permanent banning and potential legal action.') },
        { heading: t('consent.docs.community.s4.h', 'Reporting'), body: t('consent.docs.community.s4.b', 'If you experience any behavior that violates these guidelines, use the in-app report feature immediately.') },
      ],
    },
  ];
  
  const CONSENTS = [
    { id: 'tos', label: t('consent.checkbox.tos', "I agree to CoBuddy's Terms & Conditions") },
    { id: 'public', label: t('consent.checkbox.public', 'I understand CoBuddy supports public-only meetups and verified experiences') },
    { id: 'safety', label: t('consent.checkbox.safety', 'I agree to follow community safety and respectful behavior guidelines') },
  ];

  const [isSubmitting, setIsSubmitting] = useState(false);

  const allChecked = CONSENTS.every(c => checked[c.id]);
  const toggle = (id: string) => setChecked(prev => ({ ...prev, [id]: !prev[id] }));

  const handleAgree = async () => {
    setIsSubmitting(true);
    try {
      await profileApi.submitLegalConsent({
        tosAccepted: !!checked['tos'],
        privacyAccepted: true,
        communityGuidelinesAccepted: !!checked['safety'],
        safetyAgreementAccepted: true,
        allAccepted: true,
      });
      navigation.navigate('LocationPermissionScreen');
    } catch {
      // Fallback gracefully
      navigation.navigate('LocationPermissionScreen');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom', 'left', 'right']}>
      <OnboardingHeader
        showBack={navigation.canGoBack()}
        onBack={() => smartGoBack()}
        centerLabel={t('consent.centerLabel.SafetyAgreement', 'Safety Agreement')}
        showProgress
        currentStep={1}
        totalSteps={5}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Editorial header */}
        <View style={styles.editorialHeader}>
          <Text style={styles.heroTitle}>{t('consent.title')}</Text>
          <Text style={styles.heroSub}>
            {t('consent.subtitle')}
          </Text>
        </View>

        {/* Document cards */}
        <View style={styles.docCards}>
          {DOCS.map(doc => (
            <View key={doc.id} style={styles.docCard}>
              <DocIcon icon={doc.icon} />
              <Text style={styles.docTitle}>{doc.title}</Text>
              <Text style={styles.docDesc}>{doc.desc}</Text>
              <TouchableOpacity
                style={styles.readLink}
                activeOpacity={0.7}
                onPress={() => setActiveDoc(doc)} accessibilityRole="button" accessibilityLabel={t('consent.a11yReadDoc', 'Read document')}>
                <Text style={styles.readText}>{t('consent.read', 'READ  →')}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Consent checklist */}
        <View style={styles.consentList}>
          {CONSENTS.map(c => {
            const active = !!checked[c.id];
            return (
              <TouchableOpacity
                key={c.id}
                style={styles.consentRow}
                onPress={() => toggle(c.id)}
                activeOpacity={0.75} accessibilityRole="button" accessibilityLabel={c.label}>
                <View style={[styles.checkbox, active && styles.checkboxChecked]}>
                  {active && <Icon name="check" size={16} color={theme.colors.background} />}
                </View>
                <Text style={[styles.consentLabel, active && styles.consentLabelActive]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.trustNote}>{t('consent.cobuddyIsDesignedAroundTrust', 'CoBuddy is designed around trust, verification, and safety-first public experiences.')}</Text>
      </ScrollView>

      <BottomActionBar>
        <Button
          title={t('consent.btn_agree')}
          onPress={handleAgree}
          disabled={!allChecked || isSubmitting}
          loading={isSubmitting}
        />
      </BottomActionBar>

      {/* Legal Document Bottom Sheet */}
      <AppBottomSheet
        visible={activeDoc !== null}
        onClose={() => setActiveDoc(null)}
        title={activeDoc?.title ?? ''}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={sheet.content}>
          <View style={sheet.iconRow}>
            <DocIcon icon={activeDoc?.icon ?? ''} />
            <Text style={sheet.docDesc}>{activeDoc?.desc}</Text>
          </View>
          {activeDoc?.sections.map(s => (
            <View key={s.heading} style={sheet.section}>
              <Text style={sheet.sectionHeading}>{s.heading}</Text>
              <Text style={sheet.sectionBody}>{s.body}</Text>
            </View>
          ))}
          <View style={sheet.bottomGap} />
        </ScrollView>
      </AppBottomSheet>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 24 },

  editorialHeader: { alignItems: 'center', marginBottom: 28 },
  heroTitle: {
    fontSize: 26,
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 34,
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  heroSub: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
  },

  docCards: { gap: 12, marginBottom: 24 },
  docCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 20,
  },
  docTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 4,
    lineHeight: 24,
    marginTop: 8,
  },
  docDesc: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 19,
    marginBottom: 12,
  },
  readLink: { alignSelf: 'flex-start' },
  readText: {
    fontSize: 11,
    letterSpacing: 2,
    color: theme.colors.primary,
    fontWeight: '600',
  },

  consentList: { gap: 4, marginBottom: 20 },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingVertical: 11,
    paddingHorizontal: 6,
    borderRadius: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  consentLabel: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textPrimary,
    lineHeight: 21,
  },
  consentLabelActive: { color: theme.colors.primary },

  trustNote: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    opacity: 0.6,
    paddingHorizontal: 8,
  },
});

const sheet = StyleSheet.create({
  content: { paddingBottom: 16 },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
    marginBottom: 16,
  },
  docDesc: { flex: 1, fontSize: 14, color: theme.colors.textSecondary, lineHeight: 21 },
  section: { marginBottom: 18 },
  sectionHeading: {
    fontSize: 12,
    letterSpacing: 2,
    color: theme.colors.primary,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  sectionBody: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  bottomGap: { height: 24 },
});
