import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChecklistItem } from '../../components/ChecklistItem';
import { addItem, deleteItem, fetchList, resetList, setItemDone } from '../../lib/db';
import { DEMO, demoListById } from '../../lib/demo';
import type { Item, List } from '../../lib/types';
import { useRealtimeItems } from '../../hooks/useRealtimeItems';
import { colors } from '../../theme/colors';
import { fonts, radius, spacing } from '../../theme/typography';

export default function ListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { items, loading } = useRealtimeItems(id);
  const [list, setList] = useState<List | null>(null);
  const [text, setText] = useState('');

  useEffect(() => {
    if (!id) return;
    if (DEMO) {
      setList(demoListById[id] ?? null);
      return;
    }
    fetchList(id).then(setList).catch(() => {});
  }, [id]);

  const remaining = items.filter((i) => !i.is_done).length;

  const onAdd = async () => {
    const trimmed = text.trim();
    if (!trimmed || !id) return;
    setText('');
    const nextPos = items.reduce((m, i) => Math.max(m, i.position), 0) + 1;
    try {
      await addItem(id, trimmed, nextPos);
    } catch (e: any) {
      Alert.alert('שגיאה', e?.message ?? 'נכשל');
    }
  };

  const onToggle = (item: Item) =>
    setItemDone(item.id, !item.is_done).catch((e) => Alert.alert('שגיאה', e.message));

  const onDeleteItem = (item: Item) =>
    deleteItem(item.id).catch((e) => Alert.alert('שגיאה', e.message));

  const onReset = () => {
    if (!id) return;
    Alert.alert('איפוס הרשימה?', 'כל הסימונים יוסרו. הפריטים יישארו.', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'איפוס',
        onPress: () => resetList(id).catch((e) => Alert.alert('שגיאה', e.message)),
      },
    ]);
  };

  const onShare = () => {
    if (!list) return;
    Share.share({
      message: `הצטרפו לרשימה "${list.name}" באפליקציה — קוד שיתוף: ${list.share_code}`,
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.topbar}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.iconBtn}>
          <Ionicons name="chevron-forward" size={26} color={colors.text} />
        </Pressable>
        <Pressable onPress={onShare} hitSlop={10} style={styles.iconBtn}>
          <Ionicons name="share-outline" size={22} color={colors.accent} />
        </Pressable>
      </View>

      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>
          {list?.name ?? '…'}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>
            {remaining} מתוך {items.length} נותרו
          </Text>
          {list && (
            <View style={styles.codeChip}>
              <Ionicons name="key-outline" size={13} color={colors.accent} />
              <Text style={styles.codeText}>{list.share_code}</Text>
            </View>
          )}
        </View>
      </View>

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
          <Ionicons name="add" size={26} color={colors.surface} />
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xxl }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <ChecklistItem item={item} onToggle={onToggle} onDelete={onDeleteItem} />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="checkmark-done-outline" size={48} color={colors.accentSoft} />
              <Text style={styles.emptyText}>הרשימה ריקה</Text>
              <Text style={styles.emptyHint}>הוסיפו פריט ראשון למעלה</Text>
            </View>
          }
        />
      )}

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
  topbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  iconBtn: { padding: spacing.xs },
  header: { marginTop: spacing.sm, marginBottom: spacing.lg },
  title: {
    fontFamily: fonts.title,
    fontSize: 34,
    color: colors.text,
    textAlign: 'right',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  meta: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted },
  codeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  codeText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.accentDeep,
    letterSpacing: 2,
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
  },
  addBtn: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: { paddingBottom: spacing.xxl },
  empty: { alignItems: 'center', marginTop: spacing.xxl * 2, gap: spacing.sm },
  emptyText: { fontFamily: fonts.display, fontSize: 20, color: colors.textMuted },
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
    borderColor: colors.accentSoft,
  },
  resetText: { fontFamily: fonts.semibold, fontSize: 16, color: colors.accent },
});
