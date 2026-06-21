import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AssigneePicker } from '../../components/AssigneePicker';
import { DraggableChecklist } from '../../components/DraggableChecklist';
import { RefreshButton } from '../../components/RefreshButton';
import { confirmAction } from '../../lib/confirm';
import { byPosition } from '../../lib/order';
import { PEOPLE, type FilterId } from '../../lib/people';
import {
  addItem,
  deleteItem,
  editItemText,
  getList,
  renameList,
  reorderItems,
  resetList,
  setAssignee,
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
  const [filter, setFilter] = useState<FilterId>('all');
  const [editing, setEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [pickerItem, setPickerItem] = useState<Item | null>(null);

  const list = useMemo(() => (id ? getList(id) : undefined), [id, lists]);
  const items = useMemo(
    () => allItems.filter((i) => i.list_id === id).sort(byPosition),
    [allItems, id],
  );
  const visible = useMemo(
    () => (filter === 'all' ? items : items.filter((i) => i.assignee === filter)),
    [items, filter],
  );
  const remaining = items.filter((i) => !i.is_done).length;
  const canReorder = filter === 'all';

  const onAdd = () => {
    const trimmed = text.trim();
    if (!trimmed || !id) return;
    setText('');
    // New items adopt the active person filter, so adding while filtered "as
    // Dad" assigns to Dad automatically.
    addItem(id, trimmed, filter === 'all' ? null : filter);
  };

  const saveTitle = () => {
    if (id && titleDraft.trim()) renameList(id, titleDraft);
    setEditing(false);
  };

  const onReset = async () => {
    if (!id) return;
    const ok = await confirmAction(
      'איפוס הרשימה?',
      'כל הסימונים (הקווים) יוסרו. הפריטים יישארו.',
      'איפוס',
    );
    if (ok) resetList(id);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.iconBtn}>
          <Ionicons name="chevron-forward" size={26} color={colors.text} />
        </Pressable>

        {editing ? (
          <TextInput
            value={titleDraft}
            onChangeText={setTitleDraft}
            onSubmitEditing={saveTitle}
            onBlur={saveTitle}
            autoFocus
            style={styles.titleInput}
            textAlign="right"
            returnKeyType="done"
          />
        ) : (
          <Pressable
            style={styles.titleRow}
            onPress={() => {
              setTitleDraft(list?.name ?? '');
              setEditing(true);
            }}
          >
            <Text style={styles.title} numberOfLines={1}>
              {list?.name ?? ''}
            </Text>
            <Ionicons name="pencil" size={16} color={colors.textMuted} />
          </Pressable>
        )}
        <RefreshButton />
      </View>
      <Text style={styles.meta}>
        {items.length === 0 ? 'רשימה ריקה' : `${remaining} מתוך ${items.length} נותרו`}
      </Text>

      {/* Filter: everyone, or one person's items */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterBar}
      >
        <FilterChip label="כולם" active={filter === 'all'} onPress={() => setFilter('all')} />
        {PEOPLE.map((p) => (
          <FilterChip
            key={p.id}
            label={p.label}
            color={p.color}
            active={filter === p.id}
            onPress={() => setFilter(p.id)}
          />
        ))}
      </ScrollView>

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

      <DraggableChecklist
        items={visible}
        enabled={canReorder}
        emptyFiltered={filter !== 'all'}
        onReorder={(ids) => {
          if (id) reorderItems(id, ids);
        }}
        onToggle={(it: Item) => toggleItem(it.id)}
        onDelete={(it: Item) => deleteItem(it.id)}
        onAssign={(it: Item) => setPickerItem(it)}
        onEdit={(it: Item, t: string) => editItemText(it.id, t)}
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

      <AssigneePicker
        visible={pickerItem != null}
        current={pickerItem?.assignee ?? null}
        onClose={() => setPickerItem(null)}
        onPick={(personId) => {
          if (pickerItem) setAssignee(pickerItem.id, personId);
          setPickerItem(null);
        }}
      />
    </SafeAreaView>
  );
}

function FilterChip({
  label,
  color,
  active,
  onPress,
}: {
  label: string;
  color?: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      {color && <View style={[styles.chipDot, { backgroundColor: color }]} />}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.xl },
  topbar: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: spacing.sm },
  iconBtn: { padding: spacing.xs },
  titleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: spacing.sm },
  title: { fontFamily: fonts.title, fontSize: 28, color: colors.text, textAlign: 'right' },
  titleInput: {
    flex: 1,
    fontFamily: fonts.title,
    fontSize: 26,
    color: colors.text,
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
    paddingVertical: 2,
  },
  meta: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  filterScroll: { flexGrow: 0, flexShrink: 0, marginBottom: spacing.md },
  filterBar: { gap: spacing.sm, flexDirection: 'row', alignItems: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  chipDot: { width: 11, height: 11, borderRadius: 6 },
  chipText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.textMuted },
  chipTextActive: { color: colors.text },
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
  empty: { alignItems: 'center', marginTop: spacing.xxl, gap: spacing.sm },
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
