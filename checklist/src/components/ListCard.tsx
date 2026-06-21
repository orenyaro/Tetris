import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOutLeft, LinearTransition } from 'react-native-reanimated';
import type { Item, List } from '../lib/types';
import { colors } from '../theme/colors';
import { fonts, radius, spacing } from '../theme/typography';
import { ReorderArrows } from './ReorderArrows';

type Props = {
  list: List;
  items: Item[];
  canUp: boolean;
  canDown: boolean;
  onOpen: (list: List) => void;
  onDelete: (list: List) => void;
  onUp: (list: List) => void;
  onDown: (list: List) => void;
};

export function ListCard({ list, items, canUp, canDown, onOpen, onDelete, onUp, onDown }: Props) {
  const total = items.length;
  const remaining = items.filter((i) => !i.is_done).length;

  return (
    <Animated.View
      entering={FadeIn.duration(240)}
      exiting={FadeOutLeft.duration(200)}
      layout={LinearTransition.springify().damping(18)}
    >
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        onPress={() => onOpen(list)}
      >
        <ReorderArrows
          canUp={canUp}
          canDown={canDown}
          onUp={() => onUp(list)}
          onDown={() => onDown(list)}
        />

        <View style={styles.texts}>
          <Text style={styles.name} numberOfLines={1}>
            {list.name}
          </Text>
          <Text style={styles.meta}>
            {total === 0 ? 'רשימה ריקה' : `${remaining} מתוך ${total} נותרו`}
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.trash, pressed && { opacity: 0.5 }]}
          onPress={() => onDelete(list)}
          hitSlop={8}
          accessibilityLabel="מחק רשימה"
        >
          <Ionicons name="trash-outline" size={19} color={colors.textMuted} />
        </Pressable>

        <Ionicons name="chevron-back" size={20} color={colors.textMuted} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  pressed: { backgroundColor: colors.surfaceAlt, transform: [{ scale: 0.99 }] },
  texts: { flex: 1 },
  name: {
    fontFamily: fonts.display,
    fontSize: 21,
    color: colors.text,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  meta: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: 2,
  },
  trash: { paddingHorizontal: spacing.xs, paddingVertical: spacing.xs },
});
