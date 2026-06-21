import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOutLeft, Layout } from 'react-native-reanimated';
import { colors } from '../theme/colors';
import { fonts, radius, spacing } from '../theme/typography';
import type { List } from '../lib/types';

type Props = {
  list: List;
  onOpen: (list: List) => void;
  onDelete: (list: List) => void;
};

export function ListCard({ list, onOpen, onDelete }: Props) {
  return (
    <Animated.View
      entering={FadeIn.duration(260)}
      exiting={FadeOutLeft.duration(220)}
      layout={Layout.springify().damping(18)}
    >
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        onPress={() => onOpen(list)}
      >
        <View style={styles.left}>
          <View style={styles.dot} />
          <View style={styles.texts}>
            <Text style={styles.name} numberOfLines={1}>
              {list.name}
            </Text>
            <Text style={styles.code}>{list.share_code}</Text>
          </View>
        </View>
        <Pressable
          style={({ pressed }) => [styles.trash, pressed && { opacity: 0.5 }]}
          onPress={() => onDelete(list)}
          hitSlop={8}
          accessibilityLabel="Delete list"
        >
          <Ionicons name="trash-outline" size={20} color={colors.textMuted} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.md,
    shadowColor: colors.shadow,
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  pressed: { backgroundColor: colors.surfaceAlt, transform: [{ scale: 0.99 }] },
  left: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, flex: 1 },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.accent,
  },
  texts: { flex: 1 },
  name: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.text,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  code: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
    letterSpacing: 2,
    marginTop: 2,
    textAlign: 'right',
  },
  trash: { paddingStart: spacing.md, paddingVertical: spacing.xs },
});
