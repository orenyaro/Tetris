import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { syncNow } from '../lib/store';
import { colors } from '../theme/colors';

/**
 * Manual refresh, shown on every screen. On the web/PWA it pulls the latest
 * deployed version (updates the service worker, then reloads — which also
 * re-syncs the lists). On native it just refetches the lists from the cloud.
 */
export function RefreshButton() {
  const rot = useSharedValue(0);
  const spin = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }] }));

  const onPress = async () => {
    rot.value = withRepeat(withTiming(360, { duration: 700, easing: Easing.linear }), -1);

    if (Platform.OS === 'web') {
      try {
        const reg = await (navigator as any)?.serviceWorker?.getRegistration?.();
        await reg?.update?.();
      } catch {
        /* ignore */
      }
      if (typeof location !== 'undefined') location.reload();
      return;
    }

    await syncNow();
    cancelAnimation(rot);
    rot.value = 0;
  };

  return (
    <Pressable onPress={onPress} hitSlop={10} style={{ padding: 6 }} accessibilityLabel="רענון">
      <Animated.View style={spin}>
        <Ionicons name="refresh" size={22} color={colors.accent} />
      </Animated.View>
    </Pressable>
  );
}
