import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';

type Props = {
  canUp: boolean;
  canDown: boolean;
  onUp: () => void;
  onDown: () => void;
};

/** Stacked up/down arrows for manual reordering. Reliable on every platform. */
export function ReorderArrows({ canUp, canDown, onUp, onDown }: Props) {
  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={onUp}
        disabled={!canUp}
        hitSlop={6}
        style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
        accessibilityLabel="הזז למעלה"
      >
        <Ionicons name="chevron-up" size={18} color={canUp ? colors.textMuted : colors.border} />
      </Pressable>
      <Pressable
        onPress={onDown}
        disabled={!canDown}
        hitSlop={6}
        style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
        accessibilityLabel="הזז למטה"
      >
        <Ionicons name="chevron-down" size={18} color={canDown ? colors.textMuted : colors.border} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { justifyContent: 'center' },
  btn: { paddingHorizontal: 2, paddingVertical: 1 },
  pressed: { opacity: 0.4 },
});
