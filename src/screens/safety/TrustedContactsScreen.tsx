import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { AppBottomSheet } from '../../components/ui/AppBottomSheet';
import { OnboardingHeader } from '../../components/onboarding/OnboardingHeader';
import { BottomActionBar } from '../../components/ui/BottomActionBar';
import { useAuthStore } from '../../store/slices/authStore';
import { useSafetyStore } from '../../store/slices/safetyStore';
import { selectCompleteOnboarding } from '../../store/selectors/authSelectors';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { validatePhone, validateName } from '../../utils/validation';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { safetyApi } from '../../services/api';

const RELATIONSHIPS = ['Family', 'Friend', 'Partner', 'Other'];

export const TrustedContactsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { smartGoBack } = useSmartNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'TrustedContactsScreen'>>();
  const { t } = useTranslation(['onboarding']);
  const completeOnboarding = useAuthStore(selectCompleteOnboarding);
  const isFromSettings = route.params?.fromSettings;
  const { trustedContacts, addTrustedContact, removeTrustedContact, updateTrustedContact } = useSafetyStore();
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRel, setNewRel] = useState('Friend');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    const fetchContacts = async () => {
      setIsLoading(true);
      try {
        const contacts = await safetyApi.getTrustedContacts();
        if (contacts && Array.isArray(contacts)) {
          // Sync with store
          contacts.forEach(c => {
            if (!trustedContacts.some(tc => tc.id === c.id)) {
              addTrustedContact(c);
            }
          });
        }
      } catch (err) {
        // Fallback gracefully to local store
      } finally {
        setIsLoading(false);
      }
    };
    fetchContacts();
  }, []);

  const removeContact = async (id: string) => {
    removeTrustedContact(id);
    try {
      await safetyApi.deleteTrustedContact(id);
    } catch {
      // Ignored for graceful UI
    }
  };

  const handleAddSubmit = async () => {
    setErrorMsg('');
    if (!validateName(newName)) {
      setErrorMsg(t('contacts.error_name'));
      return;
    }
    if (!validatePhone(newPhone)) {
      setErrorMsg(t('contacts.error_phone'));
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanPhone = newPhone.replace(/\D/g, '');
      const created = await safetyApi.addTrustedContact({
        name: newName.trim(),
        phone: cleanPhone,
        relationship: newRel,
      });

      addTrustedContact({
        id: created.id || Date.now().toString(),
        name: created.name || newName.trim(),
        phone: created.phone || cleanPhone,
        relationship: created.relationship || newRel,
      });

      setShowAddSheet(false);
      setNewName('');
      setNewPhone('');
      setNewRel('Friend');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to save contact.';
      setErrorMsg(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = trustedContacts.length > 0;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
        
        {isFromSettings ? (
          <View style={styles.settingsHeader}>
            <TouchableOpacity style={styles.backBtn} onPress={() => smartGoBack()} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={t('contacts.a11yGoBack', 'Go back')}>
              <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.settingsHeaderTitle}>{t('contacts.headerTitle', 'Emergency Contacts')}</Text>
            <View style={styles.backBtn} />
          </View>
        ) : (
          <OnboardingHeader
            showBack={navigation.canGoBack()}
            onBack={() => smartGoBack()}
            centerLabel={t('contacts.header')}
            showProgress
            currentStep={5}
            totalSteps={5}
            rightNode={
              <TouchableOpacity
                onPress={() => completeOnboarding()}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={t('contacts.a11yOptions', 'More options')}>
                <Text style={styles.skipText}>{t('contacts.btn_skip')}</Text>
              </TouchableOpacity>
            }
          />
        )}

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Editorial header */}
          <View style={styles.editorialHeader}>
            <View style={styles.iconHeroWrap}>
              <View style={styles.iconGlowOuter} />
              <View style={styles.iconCircle}>
                <Icon name="shield-account-outline" size={36} color={theme.colors.primary} />
              </View>
            </View>
            <Text style={styles.title}>{t('contacts.title')}</Text>
            <Text style={styles.subtitle}>
              {t('contacts.subtitle')}
            </Text>
          </View>

          {/* Contacts List */}
          {trustedContacts.map((contact) => (
            <View key={contact.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={styles.cardAvatar}>
                    <Text style={styles.cardAvatarText}>{contact.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text style={styles.cardTitle}>{contact.name}</Text>
                    <Text style={styles.cardRel}>{contact.relationship}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => removeContact(contact.id)} style={styles.removeBtn} accessibilityRole="button" accessibilityLabel={t('contacts.a11yRemoveContact', 'Remove contact')}>
                  <Icon name="close" size={16} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <View style={styles.cardBody}>
                <Icon name="phone-outline" size={16} color={theme.colors.textSecondary} />
                <Text style={styles.cardPhone}>{contact.maskedPhone || (contact.phone ? '******' + contact.phone.slice(-4) : '')}</Text>
              </View>
              <View style={styles.toggleRow}>
                <Text style={styles.toggleText}>{t('contacts.toggleLocation', 'Let this contact see my live-location during SOS.')}</Text>
                <Switch 
                  value={contact.shareLocation ?? false}
                  onValueChange={(val) => updateTrustedContact(contact.id, { shareLocation: val })}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor={theme.colors.surface}
                />
              </View>
            </View>
          ))}
          
          {trustedContacts.length < 3 && (
            <TouchableOpacity onPress={() => setShowAddSheet(true)} style={styles.addButton} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={t('contacts.a11yAddContact', 'Add new trusted contact')}>
              <Icon name="plus-circle-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.addButtonText}>{t('contacts.btn_add')}</Text>
            </TouchableOpacity>
          )}

          <View style={styles.privacyRow}>
            <Icon name="lock-outline" size={14} color={theme.colors.textSecondary} />
            <Text style={styles.privacyText}>
              {t('contacts.privacy')}
            </Text>
          </View>
        </ScrollView>

        <BottomActionBar>
          <Button 
            title={isFromSettings ? t('contacts.saveContacts', 'Save Contacts') : t('contacts.btn_complete')} 
            disabled={!isValid}
            onPress={() => isFromSettings ? smartGoBack() : completeOnboarding()} 
          />
        </BottomActionBar>

        {/* Add Contact Bottom Sheet */}
        <AppBottomSheet
          visible={showAddSheet}
          onClose={() => setShowAddSheet(false)}
          title={t('contacts.sheet_title')}>
          <View style={sheet.content}>
            <View style={sheet.inputGroup}>
              <Input 
                label={t('contacts.label_name')}
                placeholder={t('contacts.placeholder_name')}
                value={newName}
                onChangeText={setNewName}
              />
            </View>
            <View style={sheet.inputGroup}>
              <Input 
                label={t('contacts.label_phone')}
                placeholder={t('contacts.placeholder_phone')}
                keyboardType="phone-pad"
                value={newPhone}
                onChangeText={setNewPhone}
              />
            </View>
            <Text style={sheet.inputLabel}>{t('contacts.label_rel')}</Text>
            <View style={sheet.relationshipRow}>
              {RELATIONSHIPS.map((rel) => (
                <TouchableOpacity 
                  key={rel}
                  style={[sheet.relChip, newRel === rel && sheet.relChipActive]}
                  onPress={() => setNewRel(rel)} accessibilityRole="button" accessibilityLabel={t('contacts.a11ySelectRel', 'Select relationship')}>
                  <Text style={[sheet.relChipText, newRel === rel && sheet.relChipTextActive]}>{t(`contacts.rel_${rel.toLowerCase()}`, rel)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ marginTop: 12 }}>
              {errorMsg ? <Text style={{ color: theme.colors.error, fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{errorMsg}</Text> : null}
              <Button title={t('contacts.btn_save')} onPress={handleAddSubmit} disabled={!newName || !newPhone || isSubmitting} loading={isSubmitting} />
            </View>
          </View>
        </AppBottomSheet>

      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.background },
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  skipText: { fontSize: 14, color: theme.colors.textSecondary, fontWeight: '500' },
  
  settingsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  settingsHeaderTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.textPrimary },

  editorialHeader: { alignItems: 'center', marginBottom: 28 },
  iconHeroWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  iconGlowOuter: {
    position: 'absolute',
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(212,175,55,0.06)',
  },
  iconCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(212,175,55,0.15)',
    borderWidth: 1.5, borderColor: 'rgba(212,175,55,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  title: {
    fontSize: 26, color: theme.colors.textPrimary,
    textAlign: 'center', letterSpacing: -0.5, marginBottom: 10, fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14, color: theme.colors.textSecondary,
    textAlign: 'center', lineHeight: 22,
  },

  card: {
    backgroundColor: theme.colors.surface,
    padding: 20,
    borderRadius: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(212,175,55,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  cardAvatarText: { fontSize: 18, color: theme.colors.primary, fontWeight: 'bold' },
  cardTitle: { fontSize: 16, color: theme.colors.textPrimary, fontWeight: '600', marginBottom: 2 },
  cardRel: { fontSize: 12, color: theme.colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  removeBtn: { padding: 4 },
  cardBody: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 56, marginBottom: 12 },
  cardPhone: { fontSize: 14, color: theme.colors.textSecondary },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 12, paddingLeft: 56 },
  toggleText: { fontSize: 12, color: theme.colors.textSecondary, flex: 1, marginRight: 12 },

  addButton: {
    flexDirection: 'row',
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
    borderStyle: 'dashed',
    marginBottom: 24,
  },
  addButtonText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
  },
  privacyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  privacyText: { fontSize: 12, color: theme.colors.textSecondary, textAlign: 'center' },
});

const sheet = StyleSheet.create({
  content: { paddingBottom: 16 },
  inputGroup: { marginBottom: 20 },
  inputLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  relationshipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  relChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  relChipActive: {
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderColor: theme.colors.primary,
  },
  relChipText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  relChipTextActive: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
});
