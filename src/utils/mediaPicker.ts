/**
 * CoBuddy Customer App — Media Picker Utility
 * Encapsulates react-native-image-picker + Android/iOS permissions.
 */

import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';
import {
  launchCamera,
  launchImageLibrary,
  MediaType,
  PhotoQuality,
  ImagePickerResponse,
} from 'react-native-image-picker';

export interface PickedMedia {
  uri: string;
  type?: string;
  name?: string;
  fileSize?: number;
}

export type PickerMode = 'camera' | 'gallery';

const getPermissionForMode = (mode: PickerMode) => {
  if (mode === 'camera') return PermissionsAndroid.PERMISSIONS.CAMERA;
  return Number(Platform.Version) >= 33
    ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
    : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
};

export async function requestPickerPermission(mode: PickerMode): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  try {
    const perm = getPermissionForMode(mode);
    const alreadyGranted = await PermissionsAndroid.check(perm);
    if (alreadyGranted) return true;

    const isCamera = mode === 'camera';
    const result = await PermissionsAndroid.request(perm, {
      title: isCamera ? 'Camera Permission' : 'Storage Permission',
      message: isCamera
        ? 'CoBuddy needs camera access to capture verification documents.'
        : 'CoBuddy needs storage access to select photos from your gallery.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    });

    if (result === PermissionsAndroid.RESULTS.GRANTED) {
      return true;
    }

    if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      Alert.alert(
        'Permission Required',
        `CoBuddy needs ${isCamera ? 'Camera' : 'Storage'} permission to upload documents. Please enable it in Settings.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ],
      );
    }
    return false;
  } catch {
    return false;
  }
}

export async function pickMedia(
  mode: PickerMode,
  options?: {
    mediaType?: MediaType;
    quality?: PhotoQuality;
    videoQuality?: 'low' | 'medium' | 'high';
    durationLimit?: number;
  },
): Promise<PickedMedia | null> {
  const granted = await requestPickerPermission(mode);
  if (!granted) return null;

  const pickerOptions = {
    mediaType: options?.mediaType ?? ('photo' as MediaType),
    quality: options?.quality ?? (0.8 as PhotoQuality),
    videoQuality: options?.videoQuality ?? 'medium',
    durationLimit: options?.durationLimit ?? 15,
  };

  try {
    const response: ImagePickerResponse =
      mode === 'camera'
        ? await launchCamera(pickerOptions)
        : await launchImageLibrary(pickerOptions);

    if (response.didCancel) return null;
    if (response.errorCode) {
      Alert.alert('Error', response.errorMessage || 'Failed to select media');
      return null;
    }

    const asset = response.assets?.[0];
    if (!asset || !asset.uri) return null;

    return {
      uri: asset.uri,
      type: asset.type,
      name: asset.fileName || 'upload.jpg',
      fileSize: asset.fileSize,
    };
  } catch (err: any) {
    Alert.alert('Error', err?.message || 'Failed to open media picker');
    return null;
  }
}
