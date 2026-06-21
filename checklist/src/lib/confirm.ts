import { Alert, Platform } from 'react-native';

/**
 * Cross-platform confirmation. React Native's Alert.alert is a no-op on web,
 * so on web we use the browser's confirm() and on native a real Alert.
 * Resolves true if the user confirmed.
 */
export function confirmAction(
  title: string,
  message: string,
  confirmLabel = 'אישור',
): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || typeof window.confirm !== 'function') {
      return Promise.resolve(true);
    }
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'ביטול', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}
