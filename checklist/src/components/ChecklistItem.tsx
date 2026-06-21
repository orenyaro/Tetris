import { Ionicons } from '@expo/vector-icons';
import { memo, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { personById } from '../lib/people';
import type { Item } from '../lib/types';
import { colors } from '../theme/colors';
import { fonts, radius, spacing } from '../theme/typography';
import { Checkbox } from './Checkbox';

type Props = {
  item: Item;
  active?: boolean;
  onToggle: (item: Item) => void;
  onDelete: (item: Item) => void;
  onAssign: (item: Item) => void;
  onEdit: (item: Item, text: string) => void;
  dragHandleProps?: object; // PanResponder handlers, attached to the grip only
};

function ChecklistItemBase({
  item,
  active,
  onToggle,
  onDelete,
  onAssign,
  onEdit,
  dragHandleProps,
}: Props) {
  const [textWidth, setTextWidth] = useState(0);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const progress = useSharedValue(item.is_done ? 1 : 0);
  const person = personById(item.assignee);

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

  const startEdit = () => {
    setDraft(item.text);
    setEditing(true);
  };
  const saveEdit = () => {
    const t = draft.trim();
    if (t && t !== item.text) onEdit(item, t);
    setEditing(false);
  };

  return (
    <View style={[styles.row, active && styles.rowActive]}>
      {dragHandleProps && (
        <View style={styles.handle} accessibilityLabel="ידית גרירה" {...dragHandleProps}>
          <Ionicons name="reorder-three" size={24} color={colors.textMuted} />
        </View>
      )}

      {editing ? (
        <View style={styles.main}>
          <Checkbox done={item.is_done} />
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={saveEdit}
            onBlur={saveEdit}
            autoFocus
            style={styles.editInput}
            textAlign="right"
            returnKeyType="done"
          />
        </View>
      ) : (
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
      )}

      {!editing && (
        <Pressable
          onPress={() => onAssign(item)}
          hitSlop={6}
          style={({ pressed }) => [styles.chip, pressed && { opacity: 0.6 }]}
          accessibilityLabel="שיוך אחראי"
        >
          <View
            style={[styles.chipDot, person ? { backgroundColor: person.color } : styles.chipDotNone]}
          />
          {person && <Text style={styles.chipLabel}>{person.label}</Text>}
        </Pressable>
      )}

      <Pressable
        style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.5 }]}
        onPress={editing ? saveEdit : startEdit}
        hitSlop={8}
        accessibilityLabel={editing ? 'שמירה' : 'עריכת פריט'}
      >
        <Ionicons
          name={editing ? 'checkmark' : 'pencil'}
          size={editing ? 22 : 17}
          color={editing ? colors.accent : colors.textMuted}
        />
      </Pressable>

      {!editing && (
        <Pressable
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.5 }]}
          onPress={() => onDelete(item)}
          hitSlop={8}
          accessibilityLabel="מחק פריט"
        >
          <Ionicons name="trash-outline" size={19} color={colors.textMuted} />
        </Pressable>
      )}
    </View>
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
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  rowActive: {
    borderColor: colors.accent,
    backgroundColor: colors.surfaceAlt,
    shadowColor: colors.accent,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  handle: {
    paddingHorizontal: 2,
    justifyContent: 'center',
    // @ts-expect-error web-only cursor hint
    cursor: 'grab',
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
  editInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 18,
    color: colors.text,
    writingDirection: 'rtl',
    paddingVertical: 2,
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
  },
  strike: {
    position: 'absolute',
    start: 0,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.strike,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingVertical: 5,
    paddingHorizontal: spacing.sm,
  },
  chipDot: { width: 12, height: 12, borderRadius: 6 },
  chipDotNone: { borderWidth: 2, borderColor: colors.textMuted },
  chipLabel: { fontFamily: fonts.semibold, fontSize: 12, color: colors.text },
  iconBtn: { paddingHorizontal: 2, paddingVertical: spacing.xs },
});

export const ChecklistItem = memo(ChecklistItemBase);
