import { Ionicons } from '@expo/vector-icons';
import { memo, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOutLeft,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type { Item } from '../lib/types';
import { colors } from '../theme/colors';
import { fonts, radius, spacing } from '../theme/typography';
import { Checkbox } from './Checkbox';
import { ReorderArrows } from './ReorderArrows';

type Props = {
  item: Item;
  canUp: boolean;
  canDown: boolean;
  onToggle: (item: Item) => void;
  onDelete: (item: Item) => void;
  onUp: (item: Item) => void;
  onDown: (item: Item) => void;
};

function ChecklistItemBase({ item, canUp, canDown, onToggle, onDelete, onUp, onDown }: Props) {
  const [textWidth, setTextWidth] = useState(0);
  const progress = useSharedValue(item.is_done ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(item.is_done ? 1 : 0, { duration: 260 });
  }, [item.is_done, progress]);

  const lineStyle = useAnimatedStyle(() => ({
    width: progress.value * textWidth,
    opacity: progress.value,
  }));

  const textColorStyle = useAnimatedStyle(() => ({
    color: progress.value > 0.5 ? colors.done : colors.text,
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(240)}
      exiting={FadeOutLeft.duration(200)}
      layout={LinearTransition.springify().damping(18)}
      style={styles.row}
    >
      <ReorderArrows
        canUp={canUp}
        canDown={canDown}
        onUp={() => onUp(item)}
        onDown={() => onDown(item)}
      />

      <Pressable style={styles.main} onPress={() => onToggle(item)} hitSlop={4}>
        <Checkbox done={item.is_done} />
        <View style={styles.textWrap}>
          <Animated.Text
            style={[styles.text, textColorStyle]}
            onLayout={(e) => setTextWidth(e.nativeEvent.layout.width)}
          >
            {item.text}
          </Animated.Text>
          <Animated.View style={[styles.strike, lineStyle]} pointerEvents="none" />
        </View>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.trash, pressed && { opacity: 0.5 }]}
        onPress={() => onDelete(item)}
        hitSlop={8}
        accessibilityLabel="מחק פריט"
      >
        <Ionicons name="trash-outline" size={19} color={colors.textMuted} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  textWrap: { flex: 1, justifyContent: 'center' },
  text: {
    fontFamily: fonts.body,
    fontSize: 18,
    lineHeight: 24,
    color: colors.text,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  strike: {
    position: 'absolute',
    start: 0,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.strike,
  },
  trash: { paddingStart: spacing.sm, paddingVertical: spacing.xs },
});

export const ChecklistItem = memo(ChecklistItemBase);
