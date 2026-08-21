import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../../theme';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import { kycApi } from '../../services/api';
import { RootStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type DocType = 'AADHAAR' | 'PAN' | 'PASSPORT' | 'DRIVING_LICENSE' | 'VOTER_ID';

type UploadState = 'idle' | 'selected' | 'uploaded';

export const DocumentVerificationScreen = () => { 
  const { t } = useTranslation('verify.document');

  const DOC_TYPES = [
    {id: 'AADHAAR',         icon: 'card-account-details-outline', label: t('docType.aadhaar', 'Aadhaar')},
    {id: 'PAN',             icon: 'card-account-details',         label: t('docType.pan', 'PAN Card')},
    {id: 'PASSPORT',        icon: 'book-open-page-variant',       label: t('docType.passport', 'Passport')},
    {id: 'DRIVING_LICENSE', icon: 'car',                          label: t('docType.dl', 'Driving License')},
    {id: 'VOTER_ID',        icon: 'card-bulleted-outline',        label: t('docType.voterId', 'Voter ID')},
  ] as const;

  const UPLOAD_TIPS = [
    {icon: 'white-balance-sunny', label: t('docVerify.clearLighting', 'Use clear lighting')},
    {icon: 'aspect-ratio',        label: t('docVerify.cornersVisible', 'Keep all corners visible')},
    {icon: 'blur-off',            label: t('docVerify.noBlurry', 'No blurry or cropped images')},
  ];

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { smartGoBack } = useSmartNavigation();
  const [selectedDoc, setSelectedDoc] = useState<DocType>('AADHAAR');
  const [docNumber, setDocNumber] = useState('');
  const [legalName, setLegalName] = useState('');
  const [frontState, setFrontState] = useState<UploadState>('idle');
  const [backState, setBackState]   = useState<UploadState>('idle');

  const formatDocNumber = (val: string, type: DocType) => {
    if (type === 'AADHAAR') {
      const cleaned = val.replace(/\D/g, '');
      const match = cleaned.match(/^(\d{0,4})(\d{0,4})(\d{0,4})$/);
      if (match) return [match[1], match[2], match[3]].filter(v => v).join(' ');
      return cleaned; // Fallback while typing
    }
    if (type === 'PAN') return val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    return val.toUpperCase();
  };

  const getMaxLength = () => {
    switch (selectedDoc) {
      case 'AADHAAR': return 14; 
      case 'PAN': return 10;
      default: return 20;
    }
  };

  const getPlaceholder = () => {
    switch (selectedDoc) {
      case 'AADHAAR': return '0000 0000 0000';
      case 'PAN': return 'ABCDE1234F';
      case 'DRIVING_LICENSE': return 'DL-1420110012345';
      case 'PASSPORT': return 'A1234567';
      case 'VOTER_ID': return 'ABC1234567';
    }
  };

  const canSubmit = () => {
    if (frontState !== 'uploaded') return false;
    if (selectedDoc !== 'PAN' && selectedDoc !== 'PASSPORT' && backState !== 'uploaded') return false;
    if (selectedDoc === 'AADHAAR' && docNumber.length < 14) return false;
    if (selectedDoc === 'PAN' && docNumber.length < 10) return false;
    if (docNumber.length < 5) return false;
    if (legalName.trim().length < 3) return false;
    return true;
  };

  const handleMockUpload = (side: 'front' | 'back') => {
    if (side === 'front') {
      setFrontState('selected');
      setTimeout(() => setFrontState('uploaded'), 600);
    } else {
      setBackState('selected');
      setTimeout(() => setBackState('uploaded'), 600);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => smartGoBack()} accessibilityRole="button" accessibilityLabel={t('a11yGoBack', 'Go back')}>
          <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('step1of3', 'Step 1 of 3')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <Text style={styles.title}>{t('completeIdentity', 'Complete Identity Verification')}</Text>
          <Text style={styles.pageSub}>{t('uploadAValidGovernmentissuedIdentity', 'Upload a valid government-issued identity document to unlock verified CoBuddy experiences.')}</Text>

          <View style={styles.card}>
            <Text style={styles.sectionLabel}>{t('selectDocType', 'SELECT DOCUMENT TYPE')}</Text>
            <View style={styles.docTypeGrid}>
              {DOC_TYPES.map(doc => {
                const selected = selectedDoc === doc.id;
                return (
                  <TouchableOpacity
                    key={doc.id}
                    style={[styles.docTypeCard, selected && styles.docTypeCardSelected]}
                    onPress={() => {
                      setSelectedDoc(doc.id);
                      setDocNumber('');
                      setFrontState('idle');
                      setBackState('idle');
                    }}
                    activeOpacity={0.75} accessibilityRole="button" accessibilityLabel={doc.label}>
                    <Icon name={doc.icon} size={24} color={selected ? theme.colors.primary : theme.colors.textSecondary} />
                    <Text style={[styles.docTypeLabel, selected && styles.docTypeLabelSelected]}>
                      {doc.label}
                    </Text>
                    {selected && (
                      <View style={styles.docTypeCheck}>
                        <Icon name="check-circle" size={14} color={theme.colors.primary} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={{height: 20}} />
            <Text style={styles.sectionLabel}>{t('docNumber', 'DOCUMENT NUMBER')}</Text>
            <TextInput
              style={styles.input}
              placeholder={getPlaceholder()}
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType={selectedDoc === 'AADHAAR' ? 'number-pad' : 'default'}
              maxLength={getMaxLength()}
              value={docNumber}
              autoCapitalize="characters"
              onChangeText={(val) => setDocNumber(formatDocNumber(val, selectedDoc))}
            />

            <View style={{height: 20}} />
            <Text style={styles.sectionLabel}>{t('legalName', 'LEGAL NAME (AS PER ID)')}</Text>
            <TextInput
              style={[styles.input, { letterSpacing: 1, fontWeight: '500' }]}
              placeholder={t('placeholder.eGShlokSharma', 'e.g. Shlok Sharma')}
              placeholderTextColor={theme.colors.textSecondary}
              value={legalName}
              autoCapitalize="words"
              onChangeText={setLegalName}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionLabel}>{t('uploadDoc', 'UPLOAD DOCUMENT')}</Text>
            <Text style={styles.uploadHint}>{t('clearAndReadableImagesWork', 'Clear and readable images work best. Max 5MB (JPG, PNG).')}</Text>

            <TouchableOpacity
              style={[styles.uploadSlot, frontState === 'uploaded' && styles.uploadSlotDone]}
              onPress={() => handleMockUpload('front')}
              activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={t('a11yConfirm', 'Confirm')}>
              <Icon
                name={frontState === 'uploaded' ? 'check-circle' : frontState === 'selected' ? 'timer-sand' : 'cloud-upload'}
                size={28}
                color={frontState === 'uploaded' ? theme.colors.success : theme.colors.primary}
              />
              <View style={styles.uploadSlotMeta}>
                <Text style={styles.uploadSlotTitle}>
                  {frontState === 'uploaded' ? t('doc.frontUploaded', 'Front Side Uploaded') : frontState === 'selected' ? t('doc.processing', 'Processing...') : t('doc.uploadFront', 'Upload Front Side')}
                </Text>
                <Text style={styles.uploadSlotSub}>
                  {frontState === 'uploaded' ? t('doc.imageAccepted', 'Image accepted') : t('doc.tapToSelect', 'Tap to select image')}
                </Text>
              </View>
              {frontState === 'idle' && (
                <Icon name="plus-circle" size={20} color={theme.colors.primary} />
              )}
            </TouchableOpacity>

            {(selectedDoc === 'AADHAAR' || selectedDoc === 'DRIVING_LICENSE' || selectedDoc === 'VOTER_ID') && (
              <>
                <View style={styles.uploadDivider} />
                <TouchableOpacity
                  style={[styles.uploadSlot, backState === 'uploaded' && styles.uploadSlotDone]}
                  onPress={() => handleMockUpload('back')}
                  activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={t('a11yGoBack', 'Go back')}>
                  <Icon
                    name={backState === 'uploaded' ? 'check-circle' : backState === 'selected' ? 'timer-sand' : 'image'}
                    size={28}
                    color={backState === 'uploaded' ? theme.colors.success : theme.colors.textSecondary}
                  />
                  <View style={styles.uploadSlotMeta}>
                    <Text style={styles.uploadSlotTitle}>
                      {backState === 'uploaded' ? t('doc.backUploaded', 'Back Side Uploaded') : backState === 'selected' ? t('doc.processing', 'Processing...') : t('doc.uploadBack', 'Upload Back Side')}
                    </Text>
                    <Text style={styles.uploadSlotSub}>
                      {backState === 'uploaded' ? t('doc.imageAccepted', 'Image accepted') : t('doc.tapToSelect', 'Tap to select image')}
                    </Text>
                  </View>
                  {backState === 'idle' && (
                    <Icon name="plus-circle" size={20} color={theme.colors.textSecondary} />
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={styles.tipsCard}>
            <Text style={styles.sectionLabel}>{t('imageReq', 'IMAGE REQUIREMENTS')}</Text>
            {UPLOAD_TIPS.map((tip, i) => (
              <View key={tip.icon} style={[styles.tipRow, i < UPLOAD_TIPS.length - 1 && styles.tipRowBorder]}>
                <View style={styles.tipIconWrap}>
                  <Icon name={tip.icon} size={16} color={theme.colors.primary} />
                </View>
                <Text style={styles.tipText}>{tip.label}</Text>
                <Icon name="check" size={14} color={theme.colors.success} />
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.ctaBtn, !canSubmit() && styles.ctaBtnDisabled]}
            disabled={!canSubmit()}
            onPress={async () => {
              try {
                await kycApi.submitKycDocument({
                  documentType: selectedDoc,
                  documentNumber: docNumber.trim(),
                  frontDocUri: 'file:///local/front.jpg',
                  backDocUri: 'file:///local/back.jpg',
                });
              } catch {
                // Fallback
              }
              navigation.navigate('SelfieCaptureScreen');
            }}
            activeOpacity={0.85} accessibilityRole="button" accessibilityLabel={t('a11yContinueVerification', 'Continue Verification')}>
            <Icon name="upload" size={18} color={theme.colors.background} />
            <Text style={styles.ctaBtnText}>{t('continueVerify', 'Continue Verification')}</Text>
          </TouchableOpacity>

          <View style={styles.securityNote}>
            <Icon name="lock" size={13} color={theme.colors.textSecondary} />
            <Text style={styles.securityText}>{t('yourInformationIsEncryptedAnd', 'Your information is encrypted and securely protected. Documents are used only for verification.')}</Text>
          </View>

          <View style={{height: 20}} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: theme.colors.background},
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  scroll: {flex: 1},
  scrollContent: {paddingHorizontal: 20, paddingTop: 16, gap: 20},
  title: {fontSize: 24, fontWeight: 'bold', color: theme.colors.textPrimary},
  pageSub: {fontSize: 13, color: theme.colors.textSecondary, lineHeight: 19},

  card: {
    backgroundColor: theme.colors.surface, borderRadius: 20,
    borderWidth: 1, borderColor: theme.colors.border, padding: 20,
  },
  sectionLabel: {
    fontWeight: '600', fontSize: 10,
    color: theme.colors.textSecondary, letterSpacing: 1.5, marginBottom: 14,
  },

  docTypeGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 10},
  docTypeCard: {
    flex: 1, minWidth: '45%',
    alignItems: 'center', gap: 8, padding: 16,
    borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border,
    backgroundColor: theme.colors.background, position: 'relative',
  },
  docTypeCardSelected: {
    borderColor: theme.colors.primary,
  },
  docTypeLabel: {fontSize: 12, color: theme.colors.textSecondary, textAlign: 'center'},
  docTypeLabelSelected: {color: theme.colors.primary, fontWeight: '500'},
  docTypeCheck: {position: 'absolute', top: 8, right: 8},

  input: {
    backgroundColor: theme.colors.background,
    borderWidth: 1, borderColor: theme.colors.border, borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 14,
    color: theme.colors.textPrimary, fontSize: 16, letterSpacing: 2, fontWeight: 'bold',
  },

  uploadHint: {fontSize: 12, color: theme.colors.textSecondary, marginBottom: 16, lineHeight: 17},
  uploadSlot: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border,
    padding: 16,
    backgroundColor: theme.colors.background,
  },
  uploadSlotDone: {
    borderColor: theme.colors.success,
  },
  uploadSlotMeta: {flex: 1},
  uploadSlotTitle: {fontWeight: '500', fontSize: 14, color: theme.colors.textPrimary},
  uploadSlotSub: {fontSize: 11, color: theme.colors.textSecondary, marginTop: 2},
  uploadDivider: {height: 10},

  tipsCard: {
    backgroundColor: theme.colors.surface, borderRadius: 20,
    borderWidth: 1, borderColor: theme.colors.border, padding: 20,
  },
  tipRow: {flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10},
  tipRowBorder: {borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border},
  tipIconWrap: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: theme.colors.background,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  tipText: {flex: 1, fontSize: 13, color: theme.colors.textPrimary},

  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 17, borderRadius: 100,
    backgroundColor: theme.colors.primary,
  },
  ctaBtnDisabled: {opacity: 0.5, backgroundColor: theme.colors.border},
  ctaBtnText: {fontWeight: '600', fontSize: 16, color: theme.colors.background, letterSpacing: 0.3},

  securityNote: {flexDirection: 'row', alignItems: 'flex-start', gap: 8, opacity: 0.6},
  securityText: {
    flex: 1, fontSize: 11, color: theme.colors.textSecondary, lineHeight: 16,
  },
});
