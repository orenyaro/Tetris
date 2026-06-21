import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChecklistItem } from '../../components/ChecklistItem';
import { byPosition } from '../../lib/order';
import {
  addItem,
  deleteItem,
  getList,
  moveItem,
  resetList,
  toggleItem,
  useItems,
  useLists,
} from '../../lib/store';
import type { Item } from '../../lib/types';
import { colors } from '../../theme/colors';
import { fonts, radius, spacing } from '../../theme/typography';

export default function ListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const lists = useLists();
  const allItems = useItems();
  const [text, setText] = useState('');

  const list = useMemo(() => (id ? getList(id) : undefined), [id, lists]);
  const items = useMemo(
    () => allItems.filter((i) => i.list_id === id).sort(byPosition),
    [allItems, id],
  );
  const remaining = items.filter((i) => !i.is_done).length;

  const onAdd = () => {
    const trimmed = text.trim();
    if (!trimmed || !id) return;
    setText('');
    addItem(id, trimmed);
  };

  const onReset = () => {
    if (!id) return;
    Alert.alert('איפוס הרשימה?', 'כל הסימונים יוסרו. הפריטים יישארו.', [
      { text: 'ביטול', style: 'cancel' },
      { text: 'איפוס', onPress: () => resetList(id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.iconBtn}>
          <Ionicons name="chevron-forward" size={26} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {list?.name ?? ''}
          </Text>
        </View>
      </View>
      <Text style={styles.meta}>
        {items.length === 0 ? 'רשימה ריקה' : `${remaining} מתוך ${items.length} נותרו`}
      </Text>

      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          placeholder="פריט חדש…"
          placeholderTextColor={colors.textMuted}
          value={text}
          onChangeText={setText}
          onSubmitEditing={onAdd}
          returnKeyType="done"
          textAlign="right"
        />
        <Pressable
          style={({ pressed }) => [styles.addBtn, pressed && { backgroundColor: colors.accentDeep }]}
          onPress={onAdd}
        >
          <Ionicons name="add" size={28} color={colors.onAccent} />
        </Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <ChecklistItem
            item={item}
            canUp={index > 0}
            canDown={index < items.length - 1}
            onToggle={(it: Item) => toggleItem(it.id)}
            onDelete={(it: Item) => deleteItem(it.id)}
            onUp={(it: Item) => moveItem(it.id, -1)}
            onDown={(it: Item) => moveItem(it.id, 1)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="checkmark-done-outline" size={46} color={colors.border} />
            <Text style={styles.emptyText}>הרשימה ריקה</Text>
            <Text style={styles.emptyHint}>הוסיפו פריט ראשון למעלה</Text>
          </View>
        }
      />

      {items.length > 0 && (
        <Pressable
          style={({ pressed }) => [styles.resetBtn, pressed && { backgroundColor: colors.surfaceAlt }]}
          onPress={onReset}
        >
          <Ionicons name="refresh" size={18} color={colors.accent} />
          <Text style={styles.resetText}>איפוס סימונים</Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.xl },
  topbar: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: spacing.sm },
  iconBtn: { padding: spacing.xs },
  title: {
    fontFamily: fonts.title,
    fontSize: 28,
    color: colors.text,
    textAlign: 'right',
  },
  meta: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    fontFamily: fonts.body,
    fontSize: 18,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    writingDirection: 'rtl',
  },
  addBtn: {
    width: 54,
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: { paddingBottom: spacing.xxl },
  empty: { alignItems: 'center', marginTop: spacing.xxl * 2, gap: spacing.sm },
  emptyText: { fontFamily: fonts.display, fontSize: 19, color: colors.textMuted },
  emptyHint: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingVertical: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resetText: { fontFamily: fonts.semibold, fontSize: 16, color: colors.accent },
});
