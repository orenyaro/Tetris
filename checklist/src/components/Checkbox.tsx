import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../theme/colors';

/** A round checkbox that springs/fills when toggled. */
export function Checkbox({ done }: { done: boolean }) {
  const progress = useSharedValue(done ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(done ? 1 : 0, { duration: 220 });
  }, [done, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.6 + progress.value * 0.4 }],
  }));

  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withSpring(done ? 1.12 : 1, { damping: 6, stiffness: 220 });
    scale.value = withSpring(1, { damping: 10, stiffness: 180 });
  }, [done, scale]);

  const boxStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      style={[
        {
          width: 26,
          height: 26,
          borderRadius: 13,
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
        <Ionicons name="checkmark-sharp" size={16} color={colors.surface} />
      </Animated.View>
    </Animated.View>
  );
}
