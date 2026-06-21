import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../theme/colors';

/** A rounded-square checkbox that fills with lime and springs when toggled. */
export function Checkbox({ done }: { done: boolean }) {
  const progress = useSharedValue(done ? 1 : 0);
  const scale = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(done ? 1 : 0, { duration: 200 });
    scale.value = withSpring(done ? 1.15 : 1, { damping: 7, stiffness: 240 });
    scale.value = withSpring(1, { damping: 12, stiffness: 180 });
  }, [done, progress, scale]);

  const fillStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.5 + progress.value * 0.5 }],
  }));

  const boxStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      style={[
        {
          width: 26,
          height: 26,
          borderRadius: 9,
          borderWidth: 2,
          borderColor: done ? colors.accent : colors.textMuted,
          backgroundColor: done ? colors.accent : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        },
        boxStyle,
      ]}
    >
      <Animated.View style={fillStyle}>
        <Ionicons name="checkmark-sharp" size={16} color={colors.onAccent} />
      </Animated.View>
    </Animated.View>
  );
}
